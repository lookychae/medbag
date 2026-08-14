// 메디백 OCR + 구조화 Cloud Function.
//
// 동작:
//   1) 클라이언트가 Storage의 prescriptions/{userId}/{filename}에 사진 업로드
//   2) onObjectFinalized 트리거 → 이 함수 실행
//   3) Google Cloud Vision API로 raw OCR 텍스트 추출
//   4) Claude API(Opus 4.8 + 구조화 출력)로 텍스트를 처방전 JSON으로 변환
//   5) Firestore users/{userId}/ocr_results/{filename} 문서에 두 결과 모두 저장
//      → 클라이언트는 onSnapshot으로 듣다가 폼에 자동 입력
//
// 비용:
//   - Vision OCR: 월 1,000건 무료, 이후 1,000건당 $1.50
//   - Claude API: 처방전 1건당 약 $0.01~0.03 (Opus 4.8, 입력 ~1K + 출력 ~500 토큰)
//   - Functions 호출/실행: 무료 한도 큼 (월 2백만 호출)
//
// 시크릿:
//   ANTHROPIC_API_KEY는 Firebase Secret Manager에서 주입.
//   설정: firebase functions:secrets:set ANTHROPIC_API_KEY
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import vision from "@google-cloud/vision";
import Anthropic from "@anthropic-ai/sdk";

setGlobalOptions({ region: "asia-northeast3", maxInstances: 5 });
initializeApp();

const visionClient = new vision.ImageAnnotatorClient();
const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

// 처방전 JSON 스키마 — Claude가 이 형태로 출력하도록 강제.
const PRESCRIPTION_SCHEMA = {
  type: "object",
  properties: {
    hospital: { type: "string", description: "병원명. 못 찾으면 빈 문자열." },
    doctor:   { type: "string", description: "담당 의사 이름만 (직함 제외). 못 찾으면 빈 문자열." },
    date:     { type: "string", description: "처방일 YYYY-MM-DD. 못 찾으면 빈 문자열." },
    symptom:  { type: "string", description: "증상 또는 진단명. 못 찾으면 빈 문자열." },
    child:    { type: "string", description: "환자 이름 + 나이 (예: 정재인 (만1세)). 못 찾으면 빈 문자열." },
    memo:     { type: "string", description: "전체적 복약 주의사항 한 줄 요약. 없으면 빈 문자열." },
    medicines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name:    { type: "string", description: "약품명" },
          dosage:  { type: "string", description: "1회 용량. 단위 포함 (예: 4mL, 1포, 5mg)" },
          times:   { type: "string", description: "복용 횟수 (예: 하루 3회, 필요시 6시간마다)" },
          days:    { type: "integer", description: "복용 일수. 못 찾으면 3." },
          category:{ type: "string", enum: ["항생제","해열진통제","거담제","항히스타민제","소화제","기관지확장제","스테로이드","외용제","유산균","기타"] },
          form:    { type: "string", enum: ["시럽","분말","정제","캡슐","좌약","연고","흡입","점안","기타"] },
          comment: { type: "string", description: "복용 주의사항 또는 효능 한 줄. 없으면 빈 문자열." },
        },
        required: ["name", "dosage", "times", "days", "category", "form", "comment"],
        additionalProperties: false,
      },
    },
  },
  required: ["hospital", "doctor", "date", "symptom", "child", "memo", "medicines"],
  additionalProperties: false,
};

async function parseTextToStructured(client, text) {
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4000,
    output_config: {
      format: { type: "json_schema", schema: PRESCRIPTION_SCHEMA },
    },
    system: "당신은 한국 약국 처방전 OCR 텍스트를 분석해서 정해진 JSON 형식으로 변환하는 전문가입니다. 텍스트에 없는 정보는 비워두세요 (날조 금지). 약 분류는 약 이름과 효능 설명에서 추론하세요. 제형은 약 이름과 설명에서 추론하세요(시럽/액 → 시럽, 산 → 분말 등). 복용 일수가 명시 안 됐으면 3을 기본값으로.",
    messages: [
      { role: "user", content: `다음 OCR 텍스트를 처방전 JSON으로 변환:\n\n${text}` },
    ],
  });

  // output_config.format을 쓰면 첫 content block에 JSON 텍스트가 들어옴.
  const block = message.content.find(b => b.type === "text");
  if (!block) throw new Error("Claude 응답에 텍스트 블록이 없음");
  return JSON.parse(block.text);
}

export const detectPrescriptionText = onObjectFinalized(
  { region: "asia-northeast3", memory: "512MiB", timeoutSeconds: 120, secrets: [anthropicKey] },
  async (event) => {
    const filePath = event.data.name;
    if (!filePath || !filePath.startsWith("prescriptions/")) return;

    // filePath 구조: prescriptions/{userId}/{filename}
    const parts = filePath.split("/");
    if (parts.length < 3) return;
    const userId = parts[1];
    const filename = parts.slice(2).join("/");

    const docRef = getFirestore()
      .collection("users").doc(userId)
      .collection("ocr_results").doc(filename);

    try {
      // 1) Vision OCR — raw 텍스트 추출
      const gcsUri = `gs://${event.data.bucket}/${filePath}`;
      const [visionResult] = await visionClient.textDetection(gcsUri);
      const text = visionResult?.textAnnotations?.[0]?.description?.trim() || "";

      if (!text) {
        await docRef.set({
          imagePath: filePath,
          text: "",
          structured: null,
          status: "completed",
          completedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return;
      }

      // 2) Claude로 구조화
      const anthropic = new Anthropic({ apiKey: anthropicKey.value() });
      let structured = null;
      let structuredError = null;
      try {
        structured = await parseTextToStructured(anthropic, text);
      } catch (e) {
        console.error("Claude parse failed:", e);
        structuredError = e.message || String(e);
      }

      await docRef.set({
        imagePath: filePath,
        text,
        structured,
        structuredError,
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error("OCR pipeline failed:", err);
      await docRef.set({
        imagePath: filePath,
        status: "error",
        error: err.message || "OCR 파이프라인 오류",
        completedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
);
