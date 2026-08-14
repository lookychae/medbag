import { useState, useEffect, useRef } from "react";
import { ACCENT_COLORS, CAT_COLOR, EMPTY_MED, DOSAGE_UNITS } from "./constants";
import { COLORS, GRADIENTS, SAFE_TOP, DARK_INPUT } from "./theme";
import { db, storage, auth } from "./firebase";
import { ref, uploadBytes } from "firebase/storage";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { parseDosage } from "./utils";

// OCR + Claude 구조화 시간을 고려해 타임아웃 넉넉하게.
const OCR_TIMEOUT_MS = 90_000;

// 백엔드(Claude)가 보낸 구조화 처방전을 ManualForm의 form 형태로 변환.
function structuredToForm(s) {
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
function inferCategoryFromText(s) {
  if (!s) return "기타";
  for (const [re, cat] of CAT_KEYWORDS) if (re.test(s)) return cat;
  return "기타";
}

// 약 이름에서 제형 추론.
function inferFormFromName(name) {
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
// Claude 출력과 동일한 형태(dosage 합쳐진 문자열)로 반환 → structuredToForm + 결과 미리보기와 호환.
function regexParseOcr(text) {
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
  // 전략: [카테고리] 마커를 약 블록의 시작점으로 보고, 각 블록 내에서:
  //   1) 약 이름: [카테고리] 위로 1~5라인 중 노이즈 아닌 한글 단어 찾기
  //   2) 카테고리: [...] 텍스트
  //   3) 용량/횟수/일수: [카테고리]부터 다음 [카테고리] 직전까지 범위에서 용법 패턴 매칭
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

    // 약 이름: catIdx 바로 위 5라인 안에서 가장 가까운 후보
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

    // 용량/횟수/일수: 블록 내 dosage 패턴
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

  // 카테고리 마커 없는 형식 대비 — fallback: 용법 라인 기반 추출 (기존 방식)
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

  // 의미있는 정보가 하나도 안 잡혔으면 null 반환 (구조화 미리보기 안 보여줌)
  if (!out.hospital && !out.date && !out.child && out.medicines.length === 0) return null;

  return out;
}

// 라이브 카메라 + 가이드 프레임 + 콘텐츠 감지 기반 자동 활성화.
function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const guideRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [aligned, setAligned] = useState(false);
  const [stable, setStable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setError(
          e.name === "NotAllowedError" ? "카메라 권한이 거부됐어요. 설정에서 권한을 허용해주세요." :
          e.name === "NotFoundError"   ? "카메라를 찾을 수 없어요." :
          "카메라를 열 수 없어요: " + (e.message || e.name)
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (detectorRef.current) clearInterval(detectorRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready || !videoRef.current || !guideRef.current) return;
    const video = videoRef.current;
    const sampleCanvas = document.createElement("canvas");
    const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    let prevHist = null;

    const tick = () => {
      if (!video.videoWidth) return;
      const gr = guideRef.current.getBoundingClientRect();
      const vr = video.getBoundingClientRect();
      const sx = (gr.left - vr.left) / vr.width  * video.videoWidth;
      const sy = (gr.top  - vr.top ) / vr.height * video.videoHeight;
      const sw = gr.width  / vr.width  * video.videoWidth;
      const sh = gr.height / vr.height * video.videoHeight;
      const SAMPLE = 64;
      sampleCanvas.width = SAMPLE; sampleCanvas.height = SAMPLE;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, SAMPLE, SAMPLE);
      const img = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
      let sum = 0, sum2 = 0, n = 0;
      const hist = new Array(8).fill(0);
      for (let i = 0; i < img.length; i += 4) {
        const Y = 0.299 * img[i] + 0.587 * img[i+1] + 0.114 * img[i+2];
        sum += Y; sum2 += Y * Y; n++;
        hist[Math.min(7, Math.floor(Y / 32))]++;
      }
      const mean = sum / n;
      const variance = sum2 / n - mean * mean;
      const stddev = Math.sqrt(Math.max(0, variance));
      const contentOk = mean > 60 && stddev > 22;
      setAligned(contentOk);
      if (prevHist) {
        let diff = 0;
        for (let i = 0; i < 8; i++) diff += Math.abs(hist[i] - prevHist[i]);
        const stableNow = diff / n < 0.08;
        setStable(stableNow);
      }
      prevHist = hist;
    };

    detectorRef.current = setInterval(tick, 350);
    return () => { if (detectorRef.current) clearInterval(detectorRef.current); };
  }, [ready]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      blob => { if (blob) onCapture(new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" })); },
      "image/jpeg",
      0.92,
    );
  };

  const canCapture = ready && aligned && stable;
  const guideColor = canCapture ? "#10B981" : aligned ? "#F59E0B" : "rgba(255,255,255,0.7)";
  const hint = error ? error
    : !ready ? "카메라 준비 중..."
    : !aligned ? "가이드 안에 약봉지 전체를 맞춰주세요"
    : !stable ? "흔들림 감지 — 폰을 잠시 고정해주세요"
    : "촬영 준비 완료!";

  return (
    <div style={{position:"fixed",inset:0,background:"black",zIndex:200,overflow:"hidden"}}>
      <video ref={videoRef} playsInline muted
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>

      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <div ref={guideRef} style={{
          position:"absolute",
          top:"18%", left:"6%", right:"6%", bottom:"30%",
          borderRadius:10,
          boxShadow:`0 0 0 9999px rgba(0,0,0,0.55)`,
          border:`3px solid ${guideColor}`,
          transition:"border-color 0.25s",
        }}>
          {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i) => (
            <div key={i} style={{
              position:"absolute", [v]:-3, [h]:-3, width:28, height:28,
              borderTop:    v==="top"    ? `5px solid ${guideColor}` : "none",
              borderBottom: v==="bottom" ? `5px solid ${guideColor}` : "none",
              borderLeft:   h==="left"   ? `5px solid ${guideColor}` : "none",
              borderRight:  h==="right"  ? `5px solid ${guideColor}` : "none",
              borderRadius: v==="top"&&h==="left"?"6px 0 0 0":v==="top"&&h==="right"?"0 6px 0 0":v==="bottom"&&h==="left"?"0 0 0 6px":"0 0 6px 0",
              transition:"border-color 0.25s",
            }}/>
          ))}
        </div>
      </div>

      <div style={{position:"absolute",top:0,left:0,right:0,padding:`${SAFE_TOP(8)} 16px 8px`,display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:10}}>
        <button onClick={onCancel}
          style={{background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"50%",width:40,height:40,color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        <div style={{color:"white",fontSize:14,fontWeight:600,textShadow:"0 1px 4px rgba(0,0,0,0.7)"}}>약봉지 스캔</div>
        <div style={{width:40}}/>
      </div>

      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:`16px 16px calc(env(safe-area-inset-bottom) + 24px)`,display:"flex",flexDirection:"column",alignItems:"center",gap:14,zIndex:10}}>
        <div style={{color:"white",fontSize:13,fontWeight:600,textAlign:"center",background:"rgba(0,0,0,0.55)",padding:"7px 16px",borderRadius:16,maxWidth:"90%"}}>
          {hint}
        </div>
        <button onClick={capture} disabled={!canCapture}
          aria-label="촬영" style={{
          width:74, height:74, borderRadius:"50%",
          background: canCapture ? "white" : "rgba(255,255,255,0.35)",
          border:`5px solid rgba(255,255,255,${canCapture?0.9:0.4})`,
          cursor: canCapture ? "pointer" : "not-allowed",
          boxShadow: canCapture ? "0 4px 18px rgba(0,0,0,0.5)" : "none",
          transition:"all 0.2s",
          padding:0,
        }}>
          <div style={{
            width:"100%",height:"100%",borderRadius:"50%",
            background: canCapture ? "white" : "transparent",
            border: canCapture ? "2px solid rgba(0,0,0,0.1)" : "none",
          }}/>
        </button>
      </div>
    </div>
  );
}

function ManualForm({ onCancel, onSave, initialForm = null, initialMemo = "" }) {
  const [form, setForm] = useState(() => initialForm || {
    hospital:"", doctor:"", date:new Date().toISOString().slice(0,10),
    symptom:"", child:"", memo: initialMemo, medicines:[{...EMPTY_MED}],
  });

  useEffect(() => {
    const y = window.scrollY;
    const prevBg = document.body.style.background;
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    // iOS PWA에서 안전영역 뒤로 body 배경(밝은 회색)이 비치는 걸 막기 위해 강제로 다크 네이비로.
    document.body.style.background = COLORS.navy;
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.style.background = prevBg;
      window.scrollTo(0, y);
    };
  }, []);

  const setField = (key, val) => setForm(p => ({...p, [key]:val}));
  const setMed = (mi, key, val) => setForm(p => {
    const meds = [...p.medicines];
    meds[mi] = {...meds[mi], [key]: val};
    return {...p, medicines:meds};
  });

  const handleSave = () => {
    if (!form.hospital) { alert("병원명을 입력해주세요"); return; }
    if (!form.medicines[0].name) { alert("약 이름을 입력해주세요"); return; }
    document.activeElement?.blur();
    onSave({
      ...form, id:Date.now(),
      accent: ACCENT_COLORS[Math.floor(Math.random()*ACCENT_COLORS.length)],
      medicines: form.medicines.filter(m => m.name).map(m => ({...m, dosage:`${m.dosageAmt}${m.dosageUnit}`})),
    });
  };

  const inp = (val, onChange, placeholder, type="text", extra={}) => (
    <input type={type} value={val} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
      style={{...DARK_INPUT, fontSize:16, ...extra}} />
  );

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,display:"flex",justifyContent:"center",background:COLORS.navy}}>
    <div style={{width:"100%",maxWidth:500,height:"100%",background:COLORS.navy,display:"flex",flexDirection:"column",overflowX:"hidden"}}>
      {/* 고정 헤더 */}
      <div style={{flexShrink:0,padding:`${SAFE_TOP(18)} 18px 16px`,position:"relative"}}>
        <button onClick={()=>{document.activeElement?.blur();onCancel();}} style={{position:"absolute",top:SAFE_TOP(8),left:18,background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:10}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{textAlign:"center",marginTop:8}}>
          <div style={{fontSize:28,marginBottom:6}}>✏️</div>
          <div style={{color:"white",fontSize:17,fontWeight:700}}>처방전 직접 입력</div>
          <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:4}}>처방전 내용을 직접 입력해주세요</div>
        </div>
      </div>

      {/* 스크롤 가능한 폼 영역 */}
      <div style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
        {/* 기본 정보 */}
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:16,marginBottom:12,border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,marginBottom:12,letterSpacing:0.8}}>기본 정보</div>
          <div style={{marginBottom:12}}>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:4}}>병원명 *</div>
            <input type="text" value={form.hospital} placeholder="서울아동병원"
              onChange={e=>setField("hospital",e.target.value)}
              onBlur={e=>{
                const v=e.target.value.trim();
                if(v&&!["병원","의원","클리닉","센터","한의원","보건소","요양원"].some(s=>v.endsWith(s)))
                  setField("hospital",v+"병원");
              }}
              style={{...DARK_INPUT, fontSize:16}}/>
          </div>
          {[
            {label:"담당의사",key:"doctor",ph:"김이름 원장"},
            {label:"증상",key:"symptom",ph:"감기, 발열"},
          ].map((f) => (
            <div key={f.key} style={{marginBottom:12}}>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:4}}>{f.label}</div>
              {inp(form[f.key], v=>setField(f.key,v), f.ph)}
            </div>
          ))}
          <div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:4}}>처방일 *</div>
            <input type="date" value={form.date} onChange={e=>setField("date",e.target.value)}
              style={{...DARK_INPUT, colorScheme:"dark", WebkitAppearance:"none", appearance:"none"}} />
          </div>
        </div>

        {/* 처방 약물 */}
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:16,marginBottom:12,border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,marginBottom:12,letterSpacing:0.8}}>처방 약물</div>
          {form.medicines.map((m, mi) => (
            <div key={mi} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:12,marginBottom:10,border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:700}}>약 {mi+1}</span>
                {form.medicines.length>1 && (
                  <button onClick={()=>setForm(p=>({...p,medicines:p.medicines.filter((_,j)=>j!==mi)}))}
                    style={{background:"#EF444430",border:"none",borderRadius:6,padding:"3px 8px",color:"#EF4444",fontSize:12,cursor:"pointer"}}>삭제</button>
                )}
              </div>
              {[
                {label:"약 이름 *",key:"name",ph:"타이레놀현탁액"},
                {label:"복용 방법",key:"times",ph:"하루 3회"},
                {label:"복용 주의사항",key:"comment",ph:"식후 복용"},
              ].map(f => (
                <div key={f.key} style={{marginBottom:8}}>
                  <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>{f.label}</div>
                  {inp(m[f.key], v=>setMed(mi,f.key,v), f.ph)}
                </div>
              ))}
              <div style={{marginBottom:8}}>
                <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>1회 용량</div>
                <div style={{display:"flex",gap:6,overflow:"hidden"}}>
                  <input type="number" value={m.dosageAmt ?? ""} placeholder="5" min="0" step="0.1"
                    onChange={e=>setMed(mi,"dosageAmt",e.target.value)}
                    style={{...DARK_INPUT, flex:"1 1 0", minWidth:0, fontSize:16}}/>
                  <select value={m.dosageUnit} onChange={e=>setMed(mi,"dosageUnit",e.target.value)}
                    style={{flex:"1 1 0",minWidth:0,boxSizing:"border-box",background:"rgba(30,30,60,0.9)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 12px",color:"white",fontSize:16,outline:"none"}}>
                    {DOSAGE_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>복용 일수</div>
                  <input type="number" value={m.days ?? ""} min="1" max="30"
                    onChange={e=>{
                      const v = e.target.value;
                      if (v === "") return setMed(mi,"days","");
                      const n = parseInt(v);
                      if (!isNaN(n)) setMed(mi,"days",n);
                    }}
                    onBlur={()=>{ if (m.days === "" || m.days == null || m.days < 1) setMed(mi,"days",1); }}
                    style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none"}} />
                </div>
                {[
                  {label:"제형",key:"form",opts:["시럽","분말","정제","캡슐","좌약","연고","흡입","점안","기타"]},
                  {label:"분류",key:"category",opts:Object.keys(CAT_COLOR)},
                ].map(sel => (
                  <div key={sel.key} style={{flex:1}}>
                    <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>{sel.label}</div>
                    <select value={m[sel.key]} onChange={e=>setMed(mi,sel.key,e.target.value)}
                      style={{width:"100%",boxSizing:"border-box",background:"rgba(30,30,60,0.9)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none"}}>
                      {sel.opts.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={()=>setForm(p=>({...p,medicines:[...p.medicines,{...EMPTY_MED}]}))}
            style={{width:"100%",border:"1.5px dashed rgba(100,200,255,0.4)",borderRadius:10,padding:"10px",color:"rgba(100,200,255,0.7)",background:"transparent",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            + 약 추가
          </button>
        </div>
        <div style={{height:8}}/>
      </div>

      {/* 고정 하단 버튼 */}
      <div style={{flexShrink:0,padding:"12px 18px 8px",background:COLORS.navy,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>{document.activeElement?.blur();onCancel();}} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px",color:"rgba(255,255,255,0.55)",fontSize:14,cursor:"pointer"}}>취소</button>
          <button onClick={handleSave} style={{flex:2,background:GRADIENTS.primary,border:"none",borderRadius:12,padding:"14px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>저장하기</button>
        </div>
      </div>
    </div>
    </div>
  );
}

// 기존 처방전에서 병원별 최근 정보 뽑기 (중복 제거, 최신순).
function getRecentHospitals(prescriptions = []) {
  const seen = new Map();
  const sorted = [...prescriptions].sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  for (const rx of sorted) {
    if (!rx.hospital) continue;
    if (seen.has(rx.hospital)) continue;
    seen.set(rx.hospital, {
      hospital: rx.hospital,
      doctor: rx.doctor || "",
      accent: rx.accent || "#F97316",
      lastDate: rx.date || "",
    });
  }
  return Array.from(seen.values()).slice(0, 8);
}

function HospitalPicker({ hospitals, onSelect, onSkip, onCancel }) {
  return (
    <div onClick={onCancel} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:500,maxHeight:"calc(100svh - 40px)",overflowY:"auto",padding:`22px 20px calc(env(safe-area-inset-bottom) + 26px)`}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:32,marginBottom:6}}>🏥</div>
          <div style={{fontSize:17,fontWeight:800,color:"#1C1C1E"}}>어느 병원에서 받은 처방전인가요?</div>
          <div style={{fontSize:12,color:"#8E8E93",marginTop:4}}>이전에 등록한 병원을 선택하면 기본 정보를 자동으로 채워드려요</div>
        </div>

        {hospitals.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {hospitals.map(h => (
              <button key={h.hospital} onClick={()=>onSelect(h)}
                style={{display:"flex",alignItems:"center",gap:12,background:"white",border:"1.5px solid #E5E5EA",borderLeft:`4px solid ${h.accent}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left"}}>
                <div style={{width:36,height:36,borderRadius:10,background:h.accent+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏥</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1C1C1E",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.hospital}</div>
                  <div style={{fontSize:11,color:"#8E8E93",marginTop:2}}>
                    {h.doctor && `${h.doctor} · `}{h.lastDate && `마지막 방문 ${h.lastDate}`}
                  </div>
                </div>
                <span style={{fontSize:12,color:"#10B981",fontWeight:800,background:"#D1FAE5",padding:"3px 8px",borderRadius:6,flexShrink:0}}>Y</span>
              </button>
            ))}
          </div>
        )}

        <button onClick={onSkip}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#1A1A2E",border:"none",borderRadius:12,padding:"14px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8}}>
          <span>새로운 병원이에요</span>
          <span style={{fontSize:11,color:"#FCA5A5",fontWeight:800,background:"rgba(255,255,255,0.15)",padding:"3px 8px",borderRadius:6}}>N</span>
        </button>
        <button onClick={onCancel}
          style={{width:"100%",background:"transparent",border:"none",padding:"10px",color:"#8E8E93",fontSize:13,cursor:"pointer"}}>
          취소
        </button>
      </div>
    </div>
  );
}

export default function ScanScreen({ onCancel, onSave, prescriptions = [] }) {
  const [step, setStep] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrStructured, setOcrStructured] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [preselectedHospital, setPreselectedHospital] = useState(null);

  // ScanScreen이 열려있는 동안 body 배경을 다크 네이비로 강제.
  // iOS PWA에서 안전영역 뒤로 body의 원본 배경(밝은 회색)이 비치는 걸 방지.
  useEffect(() => {
    const prevBg = document.body.style.background;
    document.body.style.background = COLORS.navy;
    return () => { document.body.style.background = prevBg; };
  }, []);

  // 사진 업로드 → Cloud Function이 Vision OCR → Firestore에 텍스트 저장 → 여기서 onSnapshot으로 감지.
  // userId/파일명은 Firestore 문서 ID와 동일하게 맞춰서, 함수가 어느 문서를 업데이트해야 할지 알게 함.
  const analyzeImage = async (file) => {
    setStep("analyzing");
    setErrorMsg("");
    setOcrText("");
    setOcrStructured(null);

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setErrorMsg("로그인이 필요해요. 새로 로그인해주세요.");
      setStep("error");
      return;
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload.jpg";
    const filename = `${Date.now()}_${safeName}`;
    const path = `prescriptions/${uid}/${filename}`;
    const docRef = doc(db, "users", uid, "ocr_results", filename);

    let unsubscribe = null;
    let timeoutId = null;
    const cleanup = () => {
      if (unsubscribe) unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };

    try {
      // 1) 결과 받을 빈 문서 먼저 생성 (Cloud Function이 같은 ID에 merge로 업데이트)
      await setDoc(docRef, { imagePath: path, status: "processing", createdAt: serverTimestamp() });

      // 2) Storage 업로드 — 업로드 완료 시점에 Cloud Function 트리거됨
      await uploadBytes(ref(storage, path), file);

      // 3) 결과 도착 감시 — text(원본 OCR) + structured(Claude 파싱) 둘 다 기다림.
      //    Claude가 실패해서 structured가 null이면 클라이언트에서 정규식 파싱으로 fallback.
      unsubscribe = onSnapshot(docRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.status === "completed" && data.text != null) {
          cleanup();
          const rawText = data.text || "";
          setOcrText(rawText);
          setOcrStructured(data.structured || regexParseOcr(rawText));
          setStep("ocr-result");
        } else if (data.status === "error") {
          cleanup();
          setErrorMsg(data.error || "OCR 처리 중 오류가 발생했어요");
          setStep("error");
        }
      });

      // 4) 안전장치 — 90초 안에 결과 못 받으면 타임아웃
      timeoutId = setTimeout(() => {
        cleanup();
        setErrorMsg("OCR 처리가 시간 안에 끝나지 않았어요. 잠시 후 다시 시도해주세요.");
        setStep("error");
      }, OCR_TIMEOUT_MS);
    } catch (e) {
      cleanup();
      setErrorMsg(e.message || "업로드 중 오류가 발생했어요");
      setStep("error");
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    analyzeImage(file);
  };

  // OCR 텍스트를 들고 직접 입력 화면으로 — 메모 필드에 미리 채워줘서 사용자가 보면서 폼 채울 수 있게.
  const goToManualWithOcr = () => setStep("manual");

  const wrap = (children) => (
    <div style={{minHeight:"100svh",background:COLORS.navy,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:`${SAFE_TOP(60)} 28px 28px`,position:"relative"}}>
      <button onClick={onCancel} style={{position:"absolute",top:SAFE_TOP(8),left:18,background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:10}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      {children}
    </div>
  );

  if (step === "manual") {
    // 우선순위: OCR 구조화 > 사전 선택된 병원 > 빈 폼
    const initialForm = structuredToForm(ocrStructured) ||
      (preselectedHospital ? {
        hospital: preselectedHospital.hospital,
        doctor: preselectedHospital.doctor,
        date: new Date().toISOString().slice(0,10),
        symptom: "", child: "", memo: "",
        medicines: [{...EMPTY_MED}],
      } : null);
    return (
      <ManualForm
        onCancel={()=>{ setPreselectedHospital(null); setStep("idle"); }}
        onSave={onSave}
        initialForm={initialForm}
      />
    );
  }

  if (step === "hospital-picker") {
    const hospitals = getRecentHospitals(prescriptions);
    return (
      <HospitalPicker
        hospitals={hospitals}
        onSelect={(h)=>{ setPreselectedHospital(h); setStep("manual"); }}
        onSkip={()=>{ setPreselectedHospital(null); setStep("manual"); }}
        onCancel={()=>setStep("idle")}
      />
    );
  }

  if (step === "camera") return (
    <CameraCapture
      onCancel={()=>setStep("idle")}
      onCapture={(file)=>handleFile(file)}
    />
  );

  if (step === "analyzing") return wrap(
    <div style={{textAlign:"center",width:"100%"}}>
      {preview && <div style={{marginBottom:20,display:"flex",justifyContent:"center"}}><img src={preview} style={{width:140,height:100,objectFit:"cover",borderRadius:12,opacity:0.6}} alt="preview"/></div>}
      <div style={{fontSize:44,marginBottom:16,animation:"spin 2s linear infinite"}}>⌛️</div>
      <div style={{color:"white",fontSize:16,fontWeight:700,marginBottom:6}}>약봉지를 읽는 중...</div>
      <div style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>업로드 → Google Vision 분석 (최대 1분)</div>
    </div>
  );

  if (step === "error") return wrap(
    <div style={{textAlign:"center",width:"100%",maxWidth:320}}>
      <div style={{fontSize:44,marginBottom:14}}>⚠️</div>
      <div style={{color:"white",fontSize:16,fontWeight:700,marginBottom:8}}>분석 실패</div>
      <div style={{color:"rgba(255,255,255,0.5)",fontSize:13,marginBottom:24,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{errorMsg}</div>
      <button onClick={()=>{setStep("idle");setPreview(null);}} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"12px 28px",color:"white",fontSize:14,cursor:"pointer"}}>다시 시도</button>
    </div>
  );

  if (step === "ocr-result") {
    const s = ocrStructured;
    const hasStructured = !!s && (s.hospital || (s.medicines && s.medicines.length));
    return wrap(
      <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",maxHeight:"82vh"}}>
        <div style={{textAlign:"center",marginBottom:12,flexShrink:0}}>
          <div style={{fontSize:36,marginBottom:4}}>✅</div>
          <div style={{color:"white",fontSize:17,fontWeight:700}}>{hasStructured ? "분석 완료!" : "읽기 완료!"}</div>
          <div style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginTop:4}}>
            {hasStructured ? "내용 확인 후 다음으로 넘어가세요" : "아래 원본 텍스트를 참고해서 등록하세요"}
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",flex:1,overflowY:"auto",minHeight:120}}>
          {hasStructured ? (
            <div style={{color:"rgba(255,255,255,0.9)",fontSize:13,lineHeight:1.7}}>
              {s.hospital && <div><span style={{opacity:0.55}}>🏥 </span>{s.hospital}{s.doctor && ` · ${s.doctor}`}</div>}
              {s.date && <div><span style={{opacity:0.55}}>📅 </span>{s.date}</div>}
              {s.symptom && <div><span style={{opacity:0.55}}>🩺 </span>{s.symptom}</div>}
              {s.medicines?.length > 0 && (
                <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                  <div style={{fontSize:11,opacity:0.55,marginBottom:6}}>처방 약물 {s.medicines.length}종</div>
                  {s.medicines.map((m,i) => (
                    <div key={i} style={{fontSize:12.5,padding:"4px 0",display:"flex",justifyContent:"space-between",gap:8}}>
                      <span style={{fontWeight:600}}>💊 {m.name || "(이름 없음)"}</span>
                      <span style={{opacity:0.6,flexShrink:0}}>{m.dosage} · {m.times} · {m.days}일</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : ocrText ? (
            <div style={{color:"rgba(255,255,255,0.85)",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{ocrText}</div>
          ) : (
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:13,textAlign:"center",padding:"20px 0"}}>인식된 텍스트가 없어요. 사진이 너무 흐리거나 글자가 안 보일 수 있어요.</div>
          )}
        </div>
        <div style={{display:"flex",gap:10,flexShrink:0}}>
          <button onClick={()=>{setStep("idle");setPreview(null);setOcrText("");setOcrStructured(null);}}
            style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"13px",color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer"}}>다시 스캔</button>
          <button onClick={goToManualWithOcr}
            style={{flex:2,background:GRADIENTS.primary,border:"none",borderRadius:12,padding:"13px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            {hasStructured ? "확인 후 저장" : "직접 입력으로 등록"}
          </button>
        </div>
      </div>
    );
  }

  // IDLE
  return wrap(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
      <div onClick={()=>setStep("camera")}
        style={{width:240,height:170,border:"2px dashed rgba(100,200,255,0.4)",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:28,position:"relative",cursor:"pointer",background:"rgba(255,255,255,0.02)",textAlign:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <span style={{fontSize:48,lineHeight:1}}>📷</span>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:12,lineHeight:1.6}}>약봉지를 가이드 안에<br/>맞춰 촬영하세요</span>
        </div>
        {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i)=>(
          <div key={i} style={{position:"absolute",[v]:-2,[h]:-2,width:18,height:18,
            borderTop:v==="top"?"2px solid #64C8FF":"none",borderBottom:v==="bottom"?"2px solid #64C8FF":"none",
            borderLeft:h==="left"?"2px solid #64C8FF":"none",borderRight:h==="right"?"2px solid #64C8FF":"none",
            borderRadius:v==="top"&&h==="left"?"6px 0 0 0":v==="top"&&h==="right"?"0 6px 0 0":v==="bottom"&&h==="left"?"0 0 0 6px":"0 0 6px 0"}}/>
        ))}
      </div>
      <input id="med-file-input" type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:280}}>
        <button onClick={()=>setStep("camera")}
          style={{background:GRADIENTS.primary,border:"none",borderRadius:14,padding:"15px",color:"white",fontSize:15,fontWeight:700,cursor:"pointer"}}>
          📸 스캐너 모드로 촬영
        </button>
        <button onClick={()=>document.getElementById("med-file-input").click()}
          style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:"13px",color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          🖼️ 사진 앨범에서 선택
        </button>
        <button onClick={()=>setStep(prescriptions.length > 0 ? "hospital-picker" : "manual")}
          style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:"13px",color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          ✏️ 직접 입력하기
        </button>
      </div>
      <div style={{color:"rgba(255,255,255,0.2)",fontSize:11,marginTop:10,textAlign:"center"}}>
        가이드 안에 맞추면 자동으로 촬영 준비됨
      </div>
    </div>
  );
}
