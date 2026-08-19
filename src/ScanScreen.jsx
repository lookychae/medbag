// 등록 흐름 오케스트레이션.
// 카메라 촬영 · OCR 분석 대기 · 결과 미리보기 · 수동 입력 폼 사이의 step 전환만 담당.
// 실제 UI는 CameraCapture / HospitalPicker / PrescriptionForm 로 분리됨.
import { useState, useEffect } from "react";
import { ACCENT_COLORS, EMPTY_MED } from "./constants";
import { COLORS, GRADIENTS, SAFE_TOP } from "./theme";
import { db, storage, auth } from "./firebase";
import { ref, uploadBytes } from "firebase/storage";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getRecentHospitals } from "./utils";
import { structuredToForm, regexParseOcr } from "./ocrParse";
import CameraCapture from "./CameraCapture";
import HospitalPicker from "./HospitalPicker";
import PrescriptionForm from "./PrescriptionForm";

// OCR + Claude 구조화 시간을 고려해 타임아웃 넉넉하게.
const OCR_TIMEOUT_MS = 90_000;

export default function ScanScreen({ onCancel, onSave, prescriptions = [] }) {
  const [step, setStep] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrStructured, setOcrStructured] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [preselectedHospital, setPreselectedHospital] = useState(null);

  // ScanScreen이 열려있는 동안 body 배경을 다크 네이비로 강제.
  // iOS PWA에서 안전영역 뒤로 body 원본 배경(밝은 회색)이 비치는 걸 방지.
  useEffect(() => {
    const prevBg = document.body.style.background;
    document.body.style.background = COLORS.navy;
    return () => { document.body.style.background = prevBg; };
  }, []);

  // 사진 업로드 → Cloud Function이 Vision OCR → Firestore에 텍스트 저장 → 여기서 onSnapshot으로 감지.
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
      // 1) 빈 문서 생성 → 2) Storage 업로드로 Cloud Function 트리거 → 3) onSnapshot으로 결과 감시
      await setDoc(docRef, { imagePath: path, status: "processing", createdAt: serverTimestamp() });
      await uploadBytes(ref(storage, path), file);

      unsubscribe = onSnapshot(docRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.status === "completed" && data.text != null) {
          cleanup();
          const rawText = data.text || "";
          setOcrText(rawText);
          // Claude 구조화 실패 시 정규식 파싱으로 fallback
          setOcrStructured(data.structured || regexParseOcr(rawText));
          setStep("ocr-result");
        } else if (data.status === "error") {
          cleanup();
          setErrorMsg(data.error || "OCR 처리 중 오류가 발생했어요");
          setStep("error");
        }
      });

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

  // 저장 시 신규 처방전에 id · accent를 부여해서 부모(App.jsx)로 전달.
  const finishSave = (form) => {
    onSave({
      ...form,
      id: Date.now(),
      accent: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
    });
  };

  const wrap = (children) => (
    <div style={{minHeight:"100svh",background:COLORS.navy,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:`${SAFE_TOP(60)} 28px 28px`,position:"relative"}}>
      <button onClick={onCancel} style={{position:"absolute",top:SAFE_TOP(8),left:18,background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:10}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      {children}
    </div>
  );

  if (step === "manual") {
    // 우선순위: OCR 구조화 결과 > 병원선택 자동채움 > 완전 빈 폼
    const initialForm = structuredToForm(ocrStructured) ||
      (preselectedHospital ? {
        hospital: preselectedHospital.hospital,
        doctor: preselectedHospital.doctor,
        date: new Date().toISOString().slice(0,10),
        symptom: "", child: "", memo: "",
        medicines: [{...EMPTY_MED}],
      } : null);
    return (
      <PrescriptionForm
        title="처방전 직접 입력"
        subtitle="처방전 내용을 직접 입력해주세요"
        icon="✏️"
        initialForm={initialForm}
        prescriptions={prescriptions}
        onCancel={() => { setPreselectedHospital(null); setStep("idle"); }}
        onSave={finishSave}
      />
    );
  }

  if (step === "hospital-picker") {
    const hospitals = getRecentHospitals(prescriptions);
    return (
      <HospitalPicker
        hospitals={hospitals}
        onSelect={(h) => { setPreselectedHospital(h); setStep("manual"); }}
        onSkip={() => { setPreselectedHospital(null); setStep("manual"); }}
        onCancel={() => setStep("idle")}
      />
    );
  }

  if (step === "camera") return (
    <CameraCapture
      onCancel={() => setStep("idle")}
      onCapture={(file) => handleFile(file)}
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
      <button onClick={() => { setStep("idle"); setPreview(null); }} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"12px 28px",color:"white",fontSize:14,cursor:"pointer"}}>다시 시도</button>
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
          <button onClick={() => { setStep("idle"); setPreview(null); setOcrText(""); setOcrStructured(null); }}
            style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"13px",color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer"}}>다시 스캔</button>
          <button onClick={() => setStep("manual")}
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
      <div onClick={() => setStep("camera")}
        style={{width:240,height:170,border:"2px dashed rgba(100,200,255,0.4)",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:28,position:"relative",cursor:"pointer",background:"rgba(255,255,255,0.02)",textAlign:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <span style={{fontSize:48,lineHeight:1}}>📷</span>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:12,lineHeight:1.6}}>약봉지를 가이드 안에<br/>맞춰 촬영하세요</span>
        </div>
        {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i) => (
          <div key={i} style={{position:"absolute",[v]:-2,[h]:-2,width:18,height:18,
            borderTop:v==="top"?"2px solid #64C8FF":"none",borderBottom:v==="bottom"?"2px solid #64C8FF":"none",
            borderLeft:h==="left"?"2px solid #64C8FF":"none",borderRight:h==="right"?"2px solid #64C8FF":"none",
            borderRadius:v==="top"&&h==="left"?"6px 0 0 0":v==="top"&&h==="right"?"0 6px 0 0":v==="bottom"&&h==="left"?"0 0 0 6px":"0 0 6px 0"}}/>
        ))}
      </div>
      <input id="med-file-input" type="file" accept="image/*" style={{display:"none"}} onChange={e => handleFile(e.target.files[0])}/>
      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:280}}>
        <button onClick={() => setStep("camera")}
          style={{background:GRADIENTS.primary,border:"none",borderRadius:14,padding:"15px",color:"white",fontSize:15,fontWeight:700,cursor:"pointer"}}>
          📸 스캐너 모드로 촬영
        </button>
        <button onClick={() => document.getElementById("med-file-input").click()}
          style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:"13px",color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          🖼️ 사진 앨범에서 선택
        </button>
        <button onClick={() => setStep(prescriptions.length > 0 ? "hospital-picker" : "manual")}
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
