// OCR 결과(텍스트/구조화)를 폼 데이터로 변환하는 유틸.
// Cloud Function이 Vision OCR → Claude 구조화 → JSON을 리턴하는데,
// Claude 파싱 실패 시 regexParseOcr가 fallback으로 텍스트를 직접 분해.
import { parseDosage } from "./utils";

// 백엔드(Claude)가 보낸 구조화 처방전을 ManualForm의 form 형태로 변환.
export function structuredToForm(s) {
  if (!s) return null;
  return {
    hospital: s.hospital || "",
    doctor:   s.doctor || "",
    date:     s.date || new Date().toISOString().slice(0,10),
    symptom:  s.symptom || "",
    child:    s.child || "",
    memo:     s.memo || "",
    medicines: (s.medicines && s.medicines.length ? s.medicines : [{}]).map(m => {
      const d = parseDosage(m.dosage);
      return {
        name: m.name || "",
        dosageAmt: d.amt,
        dosageUnit: d.unit,
        times: m.times || "하루 3회",
        days: typeof m.days === "number" ? m.days : 3,
        category: m.category || "기타",
        form: m.form || "시럽",
        comment: m.comment || "",
      };
    }),
  };
}

// 카테고리 키워드 → 표준 카테고리 매핑.
const CAT_KEYWORDS = [
  [/항히스타민|알레르기/, "항히스타민제"],
  [/항생|페니실린|세파/, "항생제"],
  [/해열|진통|소염/, "해열진통제"],
  [/거담|기침|가래/, "거담제"],
  [/소화|위장|정장|장염/, "소화제"],
  [/기관지|천식/, "기관지확장제"],
  [/스테로이드|덱사|프레드니/, "스테로이드"],
  [/유산균|프로바이오/, "유산균"],
  [/외용|연고|크림|로션/, "외용제"],
];
export function inferCategoryFromText(s) {
  if (!s) return "기타";
  for (const [re, cat] of CAT_KEYWORDS) if (re.test(s)) return cat;
  return "기타";
}

// 약 이름에서 제형 추론.
export function inferFormFromName(name) {
  if (!name) return "기타";
  if (/시럽|액|드롭|믹스처/.test(name)) return "시럽";
  if (/분말|산$|포$/.test(name)) return "분말";
  if (/정$|타블렛/.test(name)) return "정제";
  if (/캡슐|캅셀/.test(name)) return "캡슐";
  if (/좌약/.test(name)) return "좌약";
  if (/연고|크림|로션/.test(name)) return "연고";
  if (/흡입/.test(name)) return "흡입";
  if (/점안/.test(name)) return "점안";
  return "기타";
}

// 흔한 노이즈/라벨 라인 (약 이름 후보에서 제외). 정확 일치 비교용.
const NOISE_EXACT = new Set([
  "약품명","약품 사진","약품사진","약품","사진",
  "복약안내","복약 안내","복용방법","복용 방법","복용법","효능","효과","효능효과",
  "보관","보관법","보관방법","주의","주의사항","주의점","상태","사용","사용법",
  "투약량","투약","횟수","일수","용법","용량","성분","모양","색상","식별","용기","규격","단위",
  "이미지","우리약국","차광","실온","냉장","기밀용기",
  "운전 주의","운전주의","졸음 주의","졸음주의",
  "환자정보","환자 정보","병원정보","병원 정보","조제","조제 약사","교부번호",
]);

// Claude 파싱이 실패했을 때 fallback — 정규식으로 처방전 구조화 데이터 추출.
// Claude 출력과 동일한 형태(dosage 합쳐진 문자열)로 반환.
export function regexParseOcr(text) {
  if (!text) return null;
  const out = {
    hospital: "", doctor: "",
    date: "",
    symptom: "", child: "", memo: "",
    medicines: [],
  };

  // ── 처방일 / 조제일자 ──
  let dateMatch = text.match(/(?:조제\s*일자|처방일|발급일|진료일)\s*[:-]?\s*(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (!dateMatch) dateMatch = text.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (dateMatch) {
    const [, y, m, d] = dateMatch;
    out.date = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }

  // ── 병원 + 의사 ──
  const hosLabeled = text.match(/병원\s*(?:정보|이름|명)?\s*[:-]\s*([^\n(]+?)\s*(?:\(([^)]+)\))?(?=\n|$)/);
  if (hosLabeled) {
    out.hospital = hosLabeled[1].trim();
    if (hosLabeled[2]) out.doctor = hosLabeled[2].trim().replace(/\s*(원장|의사|선생님|과장)\s*$/, "");
  } else {
    const line = text.split("\n").map(l => l.trim()).find(l =>
      /(병원|의원|소아과|이비인후과|내과|클리닉|한의원|치과|약국)$/.test(l) ||
      /(병원|의원|소아과|이비인후과|내과|클리닉|한의원|치과)\s*\(/.test(l)
    );
    if (line) {
      const m = line.match(/^(.+?)(?:\(([^)]+)\))?$/);
      if (m) {
        out.hospital = m[1].trim();
        if (m[2]) out.doctor = m[2].trim().replace(/\s*(원장|의사|선생님|과장)\s*$/, "");
      }
    }
  }

  // ── 환자 정보 ──
  const patient = text.match(/(?:환자\s*(?:정보|명|성명)?|성명)\s*[:-]\s*(.+?)(?=\n|$)/);
  if (patient) out.child = patient[1].trim();

  // ── 증상 / 진단명 ──
  const symptom = text.match(/(?:증상|진단명|상병명?)\s*[:-]\s*(.+?)(?=\n|$)/);
  if (symptom) out.symptom = symptom[1].trim();

  // ── 담당 의사가 따로 라인으로 있으면 ──
  if (!out.doctor) {
    const docLine = text.match(/(?:담당\s*의|처방\s*의|의사|약사)\s*[:-]\s*(.+?)(?=\n|$)/);
    if (docLine) out.doctor = docLine[1].trim().replace(/\s*(원장|의사|선생님|과장)\s*$/, "");
  }

  // ── 약 정보 추출 ──
  // 전략: [카테고리] 마커를 약 블록 시작점으로 보고 이름·용법 추출.
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const dosageRe = /(\d+\.?\d*)\s*(mL|ml|mg|g|정|포|캡슐|방울|패치|알|회분)\s*씩?\s*(\d+)\s*회\s*(\d+)\s*일/i;
  const catIdxList = [];
  for (let i = 0; i < lines.length; i++) {
    if (/\[[^\]]{2,40}\]/.test(lines[i])) catIdxList.push(i);
  }

  for (let ci = 0; ci < catIdxList.length; ci++) {
    const catIdx = catIdxList[ci];
    const blockEnd = catIdxList[ci + 1] ?? lines.length;
    const catMatch = lines[catIdx].match(/\[([^\]]+)\]/);
    const category = catMatch ? inferCategoryFromText(catMatch[1]) : "기타";

    let name = "";
    for (let j = catIdx - 1; j >= Math.max(0, catIdx - 5); j--) {
      const cand = lines[j].trim();
      if (!cand || cand.length > 20 || cand.length < 2) continue;
      if (NOISE_EXACT.has(cand)) continue;
      if (/[[\]:：()()]/.test(cand)) continue;
      if (/^\d/.test(cand)) continue;
      if (!/^[가-힣A-Za-z0-9·-]+$/.test(cand)) continue;
      if (!/[가-힣]/.test(cand)) continue;
      name = cand;
      break;
    }
    if (!name) continue;

    let dosage = "", times = "하루 3회", days = 3;
    for (let j = catIdx; j < blockEnd; j++) {
      const dm = lines[j].match(dosageRe);
      if (!dm) continue;
      const [, amt, unitRaw, tCount, dCount] = dm;
      const unit = unitRaw.toLowerCase() === "ml" ? "mL" : unitRaw;
      dosage = `${amt}${unit}`;
      times  = `하루 ${tCount}회`;
      days   = parseInt(dCount, 10) || 3;
      break;
    }

    out.medicines.push({
      name, dosage, times, days,
      category,
      form: inferFormFromName(name),
      comment: "",
    });
  }

  // 카테고리 마커 없는 형식 대비 — 용법 라인 기반 fallback.
  if (out.medicines.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const dm = lines[i].match(dosageRe);
      if (!dm) continue;
      const [, amt, unitRaw, tCount, dCount] = dm;
      const unit = unitRaw.toLowerCase() === "ml" ? "mL" : unitRaw;
      let name = "";
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        const cand = lines[j].replace(/\[.*?\]/g, "").trim();
        if (!cand || cand.length > 20 || cand.length < 2) continue;
        if (NOISE_EXACT.has(cand)) continue;
        if (/[[\]:：()()]/.test(cand)) continue;
        if (/^\d/.test(cand)) continue;
        if (!/[가-힣]/.test(cand)) continue;
        name = cand;
        break;
      }
      if (!name) continue;
      out.medicines.push({
        name,
        dosage: `${amt}${unit}`,
        times: `하루 ${tCount}회`,
        days: parseInt(dCount, 10) || 3,
        category: "기타",
        form: inferFormFromName(name),
        comment: "",
      });
    }
  }

  // 의미있는 정보가 하나도 안 잡혔으면 null
  if (!out.hospital && !out.date && !out.child && out.medicines.length === 0) return null;

  return out;
}
