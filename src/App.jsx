import { useState } from "react";

// 제형 타입
const FORM_ICON = {
  "시럽": "🧴",
  "분말": "🫙",
  "정제": "💊",
  "캡슐": "💊",
  "좌약": "🩺",
  "연고": "🪶",
  "흡입": "💨",
  "점안": "👁",
  "기타": "💊",
};

const CAT_COLOR = {
  "항생제":     "#EF4444",
  "해열진통제": "#F97316",
  "거담제":     "#6366F1",
  "항히스타민제":"#10B981",
  "소화제":     "#F59E0B",
  "기관지확장제":"#3B82F6",
  "스테로이드": "#8B5CF6",
  "외용제":     "#06B6D4",
  "유산균":     "#84CC16",
  "기타":       "#9CA3AF",
};

const SAMPLE_PRESCRIPTIONS = [
  {
    id: 1,
    hospital: "서울아동병원",
    doctor: "이지현 원장",
    date: "2025-02-20",
    symptom: "감기, 발열, 콧물",
    child: "이준서 (5세)",
    memo: "38도 이상이면 해열제 우선, 구토 시 복용 중단",
    accent: "#F97316",
    medicines: [
      { name: "코미시럽", dosage: "5mL", times: "하루 3회", days: 5, category: "항히스타민제", form: "시럽", comment: "식후 복용, 졸릴 수 있음" },
      { name: "타이레놀현탁액", dosage: "7.5mL", times: "필요시 6시간마다", days: 3, category: "해열진통제", form: "시럽", comment: "38도 이상 시만 복용" },
      { name: "암브록솔시럽", dosage: "4mL", times: "하루 2회", days: 5, category: "거담제", form: "시럽", comment: "가래 묽게 해줌" },
      { name: "정장생균산", dosage: "1포", times: "하루 3회", days: 5, category: "유산균", form: "분말", comment: "물에 타서 복용" },
    ],
  },
  {
    id: 2,
    hospital: "강남소아과의원",
    doctor: "박민수 원장",
    date: "2025-01-15",
    symptom: "중이염, 귀 통증",
    child: "이준서 (5세)",
    memo: "귀 수술 이력 있음, 항생제 5일 완료 필수",
    accent: "#EF4444",
    medicines: [
      { name: "오구멘틴시럽", dosage: "6mL", times: "하루 2회", days: 5, category: "항생제", form: "시럽", comment: "식후, 냉장 보관" },
      { name: "이부프로펜시럽", dosage: "5mL", times: "하루 3회", days: 3, category: "해열진통제", form: "시럽", comment: "통증 심할 때만" },
      { name: "콧물감기시럽", dosage: "4mL", times: "하루 2회", days: 5, category: "항히스타민제", form: "시럽", comment: "자기 전 복용 권장" },
    ],
  },
  {
    id: 3,
    hospital: "한빛소아과",
    doctor: "최수진 원장",
    date: "2024-12-05",
    symptom: "장염, 구토, 설사",
    child: "이준서 (4세)",
    memo: "구토 멈춘 후 복용 시작, 수분 보충 충분히",
    accent: "#10B981",
    medicines: [
      { name: "스멕타현탁액", dosage: "1포", times: "하루 3회", days: 3, category: "소화제", form: "분말", comment: "물 50mL에 타서 복용" },
      { name: "오라페드시럽", dosage: "3mL", times: "하루 2회", days: 3, category: "스테로이드", form: "시럽", comment: "구토·염증 억제" },
      { name: "락토핏골드", dosage: "1포", times: "하루 1회", days: 7, category: "유산균", form: "분말", comment: "장 회복 도움" },
    ],
  },
];

// ── 실제 Claude AI 스캔 컴포넌트 ──
function ScanScreen({ onCancel, onSave, CAT_COLOR, FORM_ICON, MedBadge }) {
  const [step, setStep] = useState("idle"); // idle | analyzing | result | error
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useState(null);
  const inputRef = { current: null };

  const ACCENT_COLORS = ["#F97316","#EF4444","#3B82F6","#10B981","#8B5CF6","#6366F1"];

  const analyzeImage = async (file) => {
    setStep("analyzing");
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 }
              },
              {
                type: "text",
                text: `이 약봉지 이미지를 분석해서 아래 JSON 형식으로만 응답해주세요. 다른 텍스트 없이 JSON만 출력하세요.

{
  "hospital": "병원명",
  "doctor": "원장/의사 이름 (없으면 빈문자열)",
  "date": "YYYY-MM-DD 형식 (없으면 오늘 날짜)",
  "symptom": "진단명/증상",
  "memo": "특이사항 또는 복약 주의사항 (없으면 빈문자열)",
  "medicines": [
    {
      "name": "약 이름",
      "dosage": "용량 (예: 5mL, 1포, 1정)",
      "times": "복용 횟수 (예: 하루 3회)",
      "days": 5,
      "category": "항생제|해열진통제|거담제|항히스타민제|소화제|기관지확장제|스테로이드|외용제|유산균|기타 중 하나",
      "form": "시럽|분말|정제|캡슐|연고|흡입|좌약|기타 중 하나",
      "comment": "복약 주의사항 간단히 (없으면 빈문자열)"
    }
  ]
}

약봉지가 아니거나 읽을 수 없으면: {"error": "읽을 수 없는 이미지입니다"}`
              }
            ]
          }]
        })
      });

      const data = await resp.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (parsed.error) throw new Error(parsed.error);

      const rx = {
        ...parsed,
        id: Date.now(),
        date: parsed.date || new Date().toISOString().slice(0, 10),
        accent: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
        medicines: (parsed.medicines || []).map(m => ({
          ...m,
          days: Number(m.days) || 3,
        }))
      };
      setResult(rx);
      setStep("result");
    } catch (e) {
      setErrorMsg(e.message || "분석 중 오류가 발생했어요");
      setStep("error");
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    analyzeImage(file);
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#1A1A2E",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:28,
      position:"relative",
    }}>
      <button onClick={onCancel} style={{
        position:"absolute", top:52, left:18,
        background:"rgba(255,255,255,0.1)", border:"none",
        borderRadius:10, padding:"7px 14px",
        color:"rgba(255,255,255,0.7)", fontSize:13, cursor:"pointer",
      }}>‹ 취소</button>

      {/* IDLE: 업로드 UI */}
      {step === "idle" && (
        <>
          <div
            onClick={() => document.getElementById("med-file-input").click()}
            style={{
              width:240, height:170,
              border:"2px dashed rgba(100,200,255,0.4)",
              borderRadius:20, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", marginBottom:28,
              position:"relative", cursor:"pointer",
              background:"rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ fontSize:48 }}>📄</span>
            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:8, textAlign:"center", lineHeight:1.6 }}>
              약봉지를 찍거나<br/>이미지를 선택하세요
            </span>
            {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i)=>(
              <div key={i} style={{
                position:"absolute",[v]:-2,[h]:-2,width:18,height:18,
                borderTop:v==="top"?"2px solid #64C8FF":"none",
                borderBottom:v==="bottom"?"2px solid #64C8FF":"none",
                borderLeft:h==="left"?"2px solid #64C8FF":"none",
                borderRight:h==="right"?"2px solid #64C8FF":"none",
                borderRadius:v==="top"&&h==="left"?"6px 0 0 0":v==="top"&&h==="right"?"0 6px 0 0":v==="bottom"&&h==="left"?"0 0 0 6px":"0 0 6px 0",
              }}/>
            ))}
          </div>

          <input
            id="med-file-input"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display:"none" }}
            onChange={e => handleFile(e.target.files[0])}
          />

          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:280 }}>
            <button
              onClick={() => document.getElementById("med-file-input").click()}
              style={{
                background:"linear-gradient(135deg,#64C8FF,#A78BFA)", border:"none",
                borderRadius:14, padding:"15px", color:"white", fontSize:15, fontWeight:700, cursor:"pointer",
              }}
            >📸 사진 촬영 / 선택</button>
          </div>
          <div style={{ color:"rgba(255,255,255,0.2)", fontSize:11, marginTop:16, textAlign:"center" }}>
            AI가 약봉지 내용을 자동으로 읽어드려요
          </div>
        </>
      )}

      {/* ANALYZING */}
      {step === "analyzing" && (
        <div style={{ textAlign:"center", width:"100%" }}>
          {preview && (
            <div style={{ marginBottom:20, display:"flex", justifyContent:"center" }}>
              <img src={preview} style={{ width:140, height:100, objectFit:"cover", borderRadius:12, opacity:0.6 }} alt="preview"/>
            </div>
          )}
          <div style={{ fontSize:44, marginBottom:16, animation:"spin 2s linear infinite" }}>⚙️</div>
          <div style={{ color:"white", fontSize:16, fontWeight:700, marginBottom:6 }}>AI 분석 중...</div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:13 }}>약봉지 내용을 읽고 있어요</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:24, width:220, margin:"24px auto 0" }}>
            {["이미지 인식","텍스트 추출","정보 구조화"].map((s,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{
                  width:20, height:20, borderRadius:"50%",
                  background:"rgba(100,200,255,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700,
                  animation:`pulse${i} 1.5s ease-in-out ${i*0.4}s infinite`,
                }}>•</div>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR */}
      {step === "error" && (
        <div style={{ textAlign:"center", width:"100%", maxWidth:300 }}>
          <div style={{ fontSize:44, marginBottom:14 }}>⚠️</div>
          <div style={{ color:"white", fontSize:16, fontWeight:700, marginBottom:8 }}>분석 실패</div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginBottom:24, lineHeight:1.6 }}>{errorMsg}</div>
          <button onClick={() => { setStep("idle"); setPreview(null); }} style={{
            background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)",
            borderRadius:12, padding:"12px 28px", color:"white", fontSize:14, cursor:"pointer",
          }}>다시 시도</button>
        </div>
      )}

      {/* RESULT */}
      {step === "result" && result && (
        <div style={{ width:"100%", maxWidth:360, overflowY:"auto", maxHeight:"80vh" }}>
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ fontSize:36, marginBottom:6 }}>✅</div>
            <div style={{ color:"white", fontSize:17, fontWeight:700 }}>분석 완료!</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>내용을 확인하고 저장하세요</div>
          </div>

          <div style={{
            background:"rgba(255,255,255,0.05)", borderRadius:18, padding:"18px", marginBottom:14,
            border:"1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ fontSize:18, fontWeight:800, color:"white", marginBottom:2 }}>
              {result.date?.replace(/-/g,".")}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:4 }}>
              {result.hospital} {result.doctor && `· ${result.doctor}`}
            </div>
            {result.symptom && (
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600, marginBottom:14 }}>
                🩺 {result.symptom}
              </div>
            )}
            {result.medicines?.map((m,i)=>(
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"8px 0", borderTop:i>0?"1px solid rgba(255,255,255,0.06)":"none",
              }}>
                <span style={{ fontSize:13 }}>{FORM_ICON[m.form]||"💊"}</span>
                <span style={{flex:1,fontSize:13,color:"rgba(255,255,255,0.85)",fontWeight:600}}>{m.name}</span>
                <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} small />
                <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.08)",borderRadius:5,padding:"2px 6px"}}>{m.days}일</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { setStep("idle"); setPreview(null); setResult(null); }} style={{
              flex:1, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:12, padding:"13px", color:"rgba(255,255,255,0.55)", fontSize:13, cursor:"pointer",
            }}>다시 스캔</button>
            <button onClick={() => onSave(result)} style={{
              flex:2, background:"#1A1A2E", border:"none",
              borderRadius:12, padding:"13px", color:"white", fontSize:14, fontWeight:700, cursor:"pointer",
            }}>저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 알약/시럽/분말 SVG 배지 ──
function MedBadge({ dosage, color, form, small = false }) {
  const w = small ? 68 : 84;
  const h = small ? 24 : 30;
  const r = h / 2;
  const match = dosage.match(/^([\d./]+)(.*)$/);
  const num = match ? match[1] : dosage;
  const unit = match ? match[2].trim() : "";
  const fs = small ? 10 : 12;
  const ufs = small ? 7.5 : 9.5;

  if (form === "시럽") {
    // 물방울 모양 배지
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink:0, display:"block" }}>
        <rect x="0" y="0" width={w} height={h} rx={r} fill={color+"20"} />
        <path d={`M ${r} 0 Q 0 0 0 ${r} Q 0 ${h} ${r} ${h} L ${w*0.54} ${h} L ${w*0.54} 0 Z`} fill={color} />
        {/* 물방울 점 */}
        <circle cx={r*0.65} cy={h*0.35} r={r*0.22} fill="rgba(255,255,255,0.35)" />
        <text x={w*0.27} y={h/2+fs*0.37} textAnchor="middle" fontSize={fs} fontWeight="800"
          fontFamily="'Apple SD Gothic Neo',sans-serif" fill="white">{num}</text>
        <text x={w*0.77} y={h/2+ufs*0.37} textAnchor="middle" fontSize={ufs} fontWeight="700"
          fontFamily="'Apple SD Gothic Neo',sans-serif" fill={color}>{unit||"mL"}</text>
      </svg>
    );
  }
  if (form === "분말") {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink:0, display:"block" }}>
        <rect x="0" y="0" width={w} height={h} rx={4} fill={color+"18"} />
        {/* 봉지 모양 왼쪽 */}
        <rect x="0" y="0" width={w*0.52} height={h} rx={4} fill={color} />
        {/* 점선 */}
        <line x1={w*0.52} y1={4} x2={w*0.52} y2={h-4} stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2,2" />
        <text x={w*0.26} y={h/2+fs*0.37} textAnchor="middle" fontSize={fs} fontWeight="800"
          fontFamily="'Apple SD Gothic Neo',sans-serif" fill="white">{num}</text>
        <text x={w*0.77} y={h/2+ufs*0.37} textAnchor="middle" fontSize={ufs} fontWeight="700"
          fontFamily="'Apple SD Gothic Neo',sans-serif" fill={color}>{unit||"포"}</text>
      </svg>
    );
  }
  // 기본 알약형
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink:0, display:"block" }}>
      <rect x="0" y="0" width={w} height={h} rx={r} fill={color+"20"} />
      <path d={`M ${r} 0 Q 0 0 0 ${r} Q 0 ${h} ${r} ${h} L ${w*0.54} ${h} L ${w*0.54} 0 Z`} fill={color} />
      <ellipse cx={r*0.8} cy={h*0.32} rx={r*0.38} ry={h*0.16} fill="rgba(255,255,255,0.28)" />
      <text x={w*0.27} y={h/2+fs*0.37} textAnchor="middle" fontSize={fs} fontWeight="800"
        fontFamily="'Apple SD Gothic Neo',sans-serif" fill="white">{num}</text>
      <text x={w*0.77} y={h/2+ufs*0.37} textAnchor="middle" fontSize={ufs} fontWeight="700"
        fontFamily="'Apple SD Gothic Neo',sans-serif" fill={color}>{unit||"정"}</text>
    </svg>
  );
}

export default function MedBagApp() {
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState(null);
  const [prescriptions, setPrescriptions] = useState(SAMPLE_PRESCRIPTIONS);
  const [scanStep, setScanStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [newRx, setNewRx] = useState(null);
  const [search, setSearch] = useState("");
  const [memos, setMemos] = useState({}); // { [rx.id]: string }
  const [memoEditing, setMemoEditing] = useState(false);
  const [childProfile, setChildProfile] = useState({
    name: "이준서", birth: "2020-03-15", gender: "남", bloodType: "A+",
    height: 110, weight: 18.5,
    allergy: "페니실린 계열",
    notes: "열성경련 이력 있음",
    heightLog: [
      { date: "2025-02-01", value: 110 },
      { date: "2024-08-01", value: 106 },
      { date: "2024-02-01", value: 101 },
    ],
    weightLog: [
      { date: "2025-02-01", value: 18.5 },
      { date: "2024-08-01", value: 17.2 },
      { date: "2024-02-01", value: 15.8 },
    ],
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null);

  const filtered = prescriptions.filter(p =>
    !search ||
    p.hospital.includes(search) ||
    p.symptom.includes(search) ||
    p.child?.includes(search) ||
    p.medicines.some(m => m.name.includes(search))
  );

  const grouped = filtered.reduce((acc, p) => {
    const key = p.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const simulateScan = () => {
    setScanning(true);
    setScanStep(1);
    setTimeout(() => setScanStep(2), 1200);
    setTimeout(() => setScanStep(3), 2400);
    setTimeout(() => {
      setScanStep(4);
      setScanning(false);
      setNewRx({
        id: Date.now(),
        hospital: "미래아동병원",
        doctor: "최현우 원장",
        date: new Date().toISOString().slice(0, 10),
        symptom: "기관지염, 기침",
        child: "이준서 (5세)",
        memo: "",
        accent: "#6366F1",
        medicines: [
          { name: "클래리스로마이신시럽", dosage: "5mL", times: "하루 2회", days: 5, category: "항생제", form: "시럽", comment: "냉장 보관 필수" },
          { name: "에리스로마이신시럽", dosage: "4mL", times: "하루 3회", days: 5, category: "기관지확장제", form: "시럽", comment: "기침 완화" },
          { name: "정장생균산", dosage: "1포", times: "하루 2회", days: 5, category: "유산균", form: "분말", comment: "항생제 복용 후 30분 뒤" },
        ],
      });
    }, 3600);
  };

  const confirmAdd = () => {
    setPrescriptions([newRx, ...prescriptions]);
    setNewRx(null);
    setScanStep(0);
    setScreen("home");
  };

  return (
    <div style={{
      fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      background: "#F2F2F7",
      minHeight: "100vh",
      maxWidth: 390,
      margin: "0 auto",
      position: "relative",
    }}>

      {/* ── HOME ── */}
      {screen === "home" && (
        <div style={{ paddingBottom: 110 }}>
          {/* Dark Header */}
          <div style={{
            background: "#1A1A2E", padding: "52px 22px 22px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />
            <div style={{ position:"absolute", top:10, right:20, width:90, height:90, borderRadius:"50%", background:"rgba(100,200,255,0.06)" }} />

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{
                  width:34, height:34,
                  background:"linear-gradient(135deg,#64C8FF,#A78BFA)",
                  borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
                }}>🧒</div>
                <span style={{ color:"white", fontSize:19, fontWeight:700, letterSpacing:-0.5 }}>약봉지</span>
                <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>MedBag</span>
              </div>
              <button onClick={() => setScreen("scan")} style={{
                background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)",
                borderRadius:20, padding:"7px 15px", color:"white",
                fontSize:13, fontWeight:600, cursor:"pointer",
              }}>+ 스캔</button>
            </div>

            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:15, marginBottom:4 }}>처방전 관리 👶</div>
            <div style={{ color:"white", fontSize:18, fontWeight:700, letterSpacing:-0.5, marginBottom:18 }}>
              처방전 {prescriptions.length}건이 저장되어 있어요
            </div>

            <div style={{
              background:"rgba(255,255,255,0.1)", borderRadius:12,
              display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
            }}>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:14 }}>🔍</span>
              <input
                placeholder="약 이름, 증상, 아이 이름 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background:"transparent", border:"none", outline:"none",
                  color:"white", fontSize:14, flex:1,
                }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ padding:"0 18px" }}>
            {Object.keys(grouped).sort().reverse().map(month => (
              <div key={month}>
                <div style={{ fontSize:13, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, padding:"14px 2px 10px" }}>
                  {month.replace("-", "년 ")}월
                </div>

                {grouped[month].map(rx => (
                  <div
                    key={rx.id}
                    onClick={() => { setSelected(rx); setMemoEditing(false); setScreen("detail"); }}
                    style={{
                      background:"white", borderRadius:16, marginBottom:10,
                      overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
                      cursor:"pointer", borderLeft:`4px solid ${rx.accent}`,
                    }}
                  >
                    {/* Card header */}
                    <div style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"11px 14px 0",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        {/* Date */}
                        <div style={{ background:rx.accent+"18", borderRadius:8, padding:"3px 9px" }}>
                          <span style={{ fontSize:17, fontWeight:800, color:rx.accent }}>
                            {rx.date.slice(5).replace("-","/")}
                          </span>
                        </div>
                        {/* Total days */}
                        <div style={{
                          background:"#F2F2F7", borderRadius:6, padding:"2px 7px",
                          fontSize:13, fontWeight:700, color:"#555",
                        }}>
                          총 {Math.max(...rx.medicines.map(m=>m.days))}일
                        </div>
                        <span style={{ fontSize:13, color:"#8E8E93" }}>{rx.hospital}</span>
                      </div>
                      <div style={{
                        width:32, height:32, borderRadius:"50%", background:"#F2F2F7",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>

                    {/* Symptom row */}
                    <div style={{ padding:"5px 14px 0", display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:13, color:"#555", fontWeight:600 }}>🩺 {rx.symptom}</span>
                    </div>

                    {/* Medicine rows — 2줄 구조로 얼라인 고정 */}
                    <div style={{ padding:"8px 14px 12px" }}>
                      {rx.medicines.map((m, i) => (
                        <div key={i} style={{
                          paddingTop: i===0?0:8, marginTop: i===0?0:8,
                          borderTop: i===0?"none":"1px solid #F2F2F7",
                        }}>
                          {/* 윗줄: 아이콘 + 약 이름 + 용량 배지 */}
                          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                            <span style={{ fontSize:16, flexShrink:0 }}>{FORM_ICON[m.form]||"💊"}</span>
                            <div style={{
                              flex:1, fontSize:15, fontWeight:700, color:"#1C1C1E",
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            }}>{m.name}</div>
                            <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} small />
                          </div>
                          {/* 아랫줄: 코멘트 + 복용횟수 + 일수 */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, paddingLeft:20 }}>
                            <div style={{ flex:1, fontSize:12, color:"#8E8E93", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {m.comment || ""}
                            </div>
                            <div style={{
                              fontSize:12, color:"#555", fontWeight:600,
                              background:"#F5F5F5", borderRadius:5, padding:"3px 9px",
                              flexShrink:0, whiteSpace:"nowrap",
                            }}>{m.times}</div>
                            <div style={{
                              fontSize:12, color:"#555", fontWeight:600,
                              background:"#F5F5F5", borderRadius:5, padding:"3px 9px",
                              flexShrink:0, whiteSpace:"nowrap",
                            }}>{m.days}일</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DETAIL ── */}
      {screen === "detail" && selected && (
        <div style={{ paddingBottom: 40 }}>
          <div style={{
            background: selected.accent, padding: "54px 22px 16px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />

            {/* 뒤로가기 아이콘 */}
            <button onClick={() => setScreen("home")} style={{
              position:"absolute", top:12, left:16,
              background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%",
              width:40, height:40,
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", padding:0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16 }}>
              <div>
                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginBottom:1 }}>{selected.date}</div>
                <div style={{ color:"white", fontSize:18, fontWeight:800, letterSpacing:-0.5 }}>{selected.hospital}</div>
                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:1 }}>{selected.doctor}</div>
              </div>
            </div>

            <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
              <div style={{
                background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"3px 10px",
                fontSize:12, color:"white", fontWeight:600,
              }}>🩺 {selected.symptom}</div>
              {selected.child && (
                <div style={{
                  background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"3px 10px",
                  fontSize:12, color:"white", fontWeight:600,
                }}>👶 {selected.child}</div>
              )}
            </div>

            {selected.memo && (
              <div style={{
                marginTop:8, background:"rgba(255,255,255,0.12)", borderRadius:10,
                padding:"8px 12px", fontSize:12, color:"rgba(255,255,255,0.9)", lineHeight:1.6,
              }}>📝 {selected.memo}</div>
            )}
          </div>

          <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, marginBottom:4 }}>
              처방 약물 {selected.medicines.length}종
            </div>
            {selected.medicines.map((m, i) => (
              <div key={i} style={{
                background:"white", borderRadius:14, padding:"14px 16px",
                boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
                borderLeft:`3px solid ${CAT_COLOR[m.category]||"#ccc"}`,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:18 }}>{FORM_ICON[m.form]||"💊"}</span>
                    <div>
                      <div style={{ fontSize:17, fontWeight:700, color:"#1C1C1E" }}>{m.name}</div>
                      {m.comment && <div style={{ fontSize:11, color:"#8E8E93", marginTop:1 }}>{m.comment}</div>}
                    </div>
                  </div>
                  <span style={{
                    fontSize:12, background:CAT_COLOR[m.category]+"20",
                    color:CAT_COLOR[m.category], borderRadius:6, padding:"2px 8px", fontWeight:700, flexShrink:0,
                  }}>{m.category}</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    { label:"용량", hi:true },
                    { label:"복용", value:m.times, hi:false },
                    { label:"기간", value:`${m.days}일`, hi:false },
                  ].map((info, j) => (
                    <div key={j} style={{
                      flex:1, textAlign:"center",
                      background: info.hi ? CAT_COLOR[m.category]+"10" : "#F9F9F9",
                      borderRadius:10, padding:"10px 4px",
                      border: info.hi ? `1px solid ${CAT_COLOR[m.category]}25` : "1px solid #F0F0F0",
                      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
                    }}>
                      {info.hi ? (
                        <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} />
                      ) : (
                        <div style={{ fontSize:15, fontWeight:600, color:"#1C1C1E", lineHeight:1.3 }}>{info.value}</div>
                      )}
                      <div style={{ fontSize:12, color:"#8E8E93" }}>{info.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ── 부모 메모 ── */}
            <div style={{
              background:"white", borderRadius:14, padding:"14px 16px",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)", marginTop:2,
            }}>
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:16 }}>✏️</span>
                  <span style={{ fontSize:15, fontWeight:700, color:"#1C1C1E" }}>부모 메모</span>
                </div>
                {!memoEditing ? (
                  <button
                    onClick={() => setMemoEditing(true)}
                    style={{
                      background:"#F2F2F7", border:"none", borderRadius:8,
                      padding:"4px 10px", fontSize:11, fontWeight:600,
                      color:"#555", cursor:"pointer",
                    }}
                  >{memos[selected.id] ? "수정" : "추가"}</button>
                ) : (
                  <button
                    onClick={() => setMemoEditing(false)}
                    style={{
                      background: "#1A1A2E", border:"none", borderRadius:8,
                      padding:"6px 14px", fontSize:12, fontWeight:700,
                      color:"white", cursor:"pointer",
                    }}
                  >저장</button>
                )}
              </div>

              {memoEditing ? (
                <textarea
                  autoFocus
                  placeholder="아이 반응, 부작용, 다음 진료 메모 등을 자유롭게 적어주세요"
                  value={memos[selected.id] || ""}
                  onChange={e => setMemos(prev => ({ ...prev, [selected.id]: e.target.value }))}
                  style={{
                    width:"100%", minHeight:90, border:"1.5px solid #E5E5EA",
                    borderRadius:10, padding:"10px 12px", fontSize:13,
                    color:"#1C1C1E", lineHeight:1.7, resize:"none", outline:"none",
                    fontFamily:"'Apple SD Gothic Neo', sans-serif",
                    background:"#FAFAFA",
                  }}
                />
              ) : memos[selected.id] ? (
                <div style={{
                  fontSize:15, color:"#3C3C43", lineHeight:1.8,
                  padding:"12px 14px", background:"#FAFAFA",
                  borderRadius:10, whiteSpace:"pre-wrap",
                }}>
                  {memos[selected.id]}
                </div>
              ) : (
                <div
                  onClick={() => setMemoEditing(true)}
                  style={{
                    fontSize:13, color:"#C7C7CC", lineHeight:1.7,
                    padding:"10px 12px", background:"#FAFAFA",
                    borderRadius:10, cursor:"pointer",
                    border:"1.5px dashed #E5E5EA",
                  }}
                >
                  아이 반응, 부작용, 다음 진료 메모 등을 여기에 남겨보세요 💬
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 아이 정보 탭 — 보기 ── */}
      {screen === "child" && (() => {
        const cp = childProfile;
        const age = cp.birth ? Math.floor((new Date() - new Date(cp.birth)) / (365.25*24*3600*1000)) : 0;
        const doses = cp.weight ? {
          "타이레놀": `${(cp.weight*15).toFixed(0)}mg · ${(cp.weight*0.15).toFixed(1)}mL`,
          "이부프로펜": `${(cp.weight*10).toFixed(0)}mg · ${(cp.weight*0.5).toFixed(1)}mL`,
        } : null;
        return (
          <div style={{ paddingBottom:110 }}>
            {/* 헤더 */}
            <div style={{
              background:"linear-gradient(135deg,#1A1A2E,#2D2D5E)",
              padding:"52px 22px 24px", position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }}/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", position:"relative", zIndex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{
                    width:64, height:64, borderRadius:20,
                    background:"linear-gradient(135deg,#64C8FF,#A78BFA)",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, flexShrink:0,
                  }}>{cp.gender === "여" ? "👧" : "🧒"}</div>
                  <div>
                    <div style={{ color:"white", fontSize:20, fontWeight:800, letterSpacing:-0.5 }}>{cp.name}</div>
                    <div style={{ color:"rgba(255,255,255,0.6)", fontSize:13, marginTop:3 }}>만 {age}세 · {cp.gender}아 · {cp.bloodType}</div>
                    <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 }}>{cp.birth}</div>
                  </div>
                </div>
                <button onClick={() => {
                  console.log("수정 버튼 클릭됨");
                  const draft = JSON.parse(JSON.stringify(childProfile));
                  console.log("draft:", draft);
                  setProfileDraft(draft);
                  setScreen("child-edit");
                  console.log("screen 변경 완료");
                }} style={{
                  background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)",
                  borderRadius:10, padding:"6px 14px", color:"white", fontSize:12, fontWeight:600, cursor:"pointer",
                }}>수정</button>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:18 }}>
                {[
                  { label:"키", value: cp.height ? `${cp.height}cm` : "-", icon:"📏" },
                  { label:"몸무게", value: cp.weight ? `${cp.weight}kg` : "-", icon:"⚖️" },
                  { label:"알레르기", value: cp.allergy || "없음", icon:"⚠️" },
                ].map((s,i) => (
                  <div key={i} style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:16, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ color:"white", fontSize:i===2?10:15, fontWeight:700, lineHeight:1.2 }}>{s.value}</div>
                    <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
              {/* 적정 용량 */}
              {doses && (
                <div style={{ background:"white", borderRadius:14, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                    <span style={{ fontSize:16 }}>💡</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#1C1C1E" }}>체중 기반 적정 용량</span>
                    <span style={{ fontSize:10, color:"#8E8E93", marginLeft:"auto" }}>{cp.weight}kg 기준</span>
                  </div>
                  <div style={{ fontSize:11, color:"#FF9500", background:"#FFF9F0", borderRadius:8, padding:"8px 10px", marginBottom:10, lineHeight:1.6 }}>
                    ⚠️ 참고용입니다. 실제 복용량은 의사 처방을 따르세요.
                  </div>
                  {Object.entries(doses).map(([name, dose], i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderTop:i>0?"1px solid #F2F2F7":"none" }}>
                      <span style={{ fontSize:13, color:"#555", fontWeight:600 }}>💊 {name}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#1C1C1E" }}>{dose}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 성장 기록 */}
              <div style={{ background:"white", borderRadius:14, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, marginBottom:12 }}>📈 성장 기록</div>
                <div style={{ display:"flex", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#3B82F6", marginBottom:8 }}>📏 키 (cm)</div>
                    {cp.heightLog.map((log,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderTop:i>0?"1px solid #F9F9F9":"none" }}>
                        <span style={{ fontSize:10, color:"#8E8E93" }}>{log.date.slice(0,7)}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:"#1C1C1E" }}>{log.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ width:1, background:"#F2F2F7" }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#10B981", marginBottom:8 }}>⚖️ 몸무게 (kg)</div>
                    {cp.weightLog.map((log,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderTop:i>0?"1px solid #F9F9F9":"none" }}>
                        <span style={{ fontSize:10, color:"#8E8E93" }}>{log.date.slice(0,7)}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:"#1C1C1E" }}>{log.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 특이사항 */}
              <div style={{ background:"white", borderRadius:14, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <span style={{ fontSize:14 }}>📋</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#1C1C1E" }}>특이사항 / 병력</span>
                </div>
                <div style={{ fontSize:13, color:cp.notes?"#3C3C43":"#C7C7CC", lineHeight:1.7 }}>
                  {cp.notes || "특이사항 없음"}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 아이 정보 수정 화면 ── */}
      {screen === "child-edit" && (() => {
        if (!profileDraft) { setProfileDraft(JSON.parse(JSON.stringify(childProfile))); return null; }
        const fields = [
          { label:"이름", key:"name", type:"text", placeholder:"홍길동" },
          { label:"생년월일", key:"birth", type:"date" },
          { label:"성별", key:"gender", type:"select", options:["남","여"] },
          { label:"혈액형", key:"bloodType", type:"text", placeholder:"A+, B-, O+ 등" },
        ];
        const bodyFields = [
          { label:"키", key:"height", type:"number", unit:"cm", placeholder:"110" },
          { label:"몸무게", key:"weight", type:"number", unit:"kg", placeholder:"18.5", step:"0.1" },
        ];
        return (
          <div style={{ background:"#F2F2F7", minHeight:"100vh", paddingBottom:40 }}>
            {/* 헤더 */}
            <div style={{ background:"linear-gradient(135deg,#1A1A2E,#2D2D5E)", padding:"16px 16px 14px", position:"relative" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <button onClick={() => setScreen("child")} style={{
                  background:"rgba(255,255,255,0.12)", border:"none", borderRadius:"50%",
                  width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", padding:0, flexShrink:0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span style={{ color:"white", fontSize:15, fontWeight:700 }}>아이 정보 수정</span>
                <button onClick={() => { setChildProfile(profileDraft); setScreen("child"); }} style={{
                  background:"#1A1A2E", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:10,
                  padding:"6px 14px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0,
                }}>저장</button>
              </div>
            </div>

            <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>

              {/* 아바타 선택 */}
              <div style={{ background:"white", borderRadius:14, padding:"20px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                <div style={{
                  width:72, height:72, borderRadius:22,
                  background:"linear-gradient(135deg,#64C8FF,#A78BFA)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:36,
                }}>{profileDraft.gender === "여" ? "👧" : "🧒"}</div>
                <div style={{ display:"flex", gap:10 }}>
                  {["남","여"].map(g => (
                    <button key={g} onClick={() => setProfileDraft(p=>({...p, gender:g}))} style={{
                      padding:"8px 28px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:700,
                      border: profileDraft.gender===g ? "none" : "1.5px solid #E5E5EA",
                      background: profileDraft.gender===g ? "#1A1A2E" : "white",
                      color: profileDraft.gender===g ? "white" : "#8E8E93",
                    }}>{g === "남" ? "🧒 남아" : "👧 여아"}</button>
                  ))}
                </div>
              </div>

              {/* 기본 정보 */}
              <div style={{ background:"white", borderRadius:14, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, marginBottom:14 }}>기본 정보</div>
                {fields.filter(f=>f.type!=="select").map((field, i) => (
                  <div key={field.key} style={{
                    display:"flex", alignItems:"center", gap:12,
                    paddingTop:i>0?12:0, marginTop:i>0?12:0,
                    borderTop:i>0?"1px solid #F2F2F7":"none",
                  }}>
                    <span style={{ fontSize:12, color:"#8E8E93", width:64, flexShrink:0 }}>{field.label}</span>
                    <input
                      type={field.type}
                      value={profileDraft[field.key] || ""}
                      placeholder={field.placeholder || ""}
                      onChange={e => setProfileDraft(p=>({...p, [field.key]: e.target.value}))}
                      style={{
                        flex:1, border:"none", borderBottom:"1.5px solid #E5E5EA",
                        padding:"6px 0", fontSize:14, fontWeight:600, outline:"none",
                        color:"#1C1C1E", background:"transparent",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* 신체 정보 — 변경 시 성장기록에 자동 추가 */}
              <div style={{ background:"white", borderRadius:14, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, marginBottom:4 }}>신체 정보</div>
                <div style={{ fontSize:11, color:"#C7C7CC", marginBottom:14 }}>변경하면 오늘 날짜로 성장 기록에 자동 추가돼요</div>
                <div style={{ display:"flex", gap:16 }}>
                  {[
                    { label:"키", key:"height", unit:"cm", placeholder:"110", logKey:"heightLog", step:"1" },
                    { label:"몸무게", key:"weight", unit:"kg", placeholder:"18.5", logKey:"weightLog", step:"0.1" },
                  ].map((field, i) => {
                    const latestLog = (profileDraft[field.logKey]||[]).slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
                    const latestVal = latestLog ? latestLog.value : (profileDraft[field.key] || "");
                    return (
                      <div key={field.key} style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                        <span style={{ fontSize:11, color:"#8E8E93" }}>{field.label}</span>
                        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                          <input
                            type="number"
                            value={profileDraft[field.key] || ""}
                            placeholder={field.placeholder}
                            step={field.step}
                            onChange={e => {
                              const val = parseFloat(e.target.value)||0;
                              const today = new Date().toISOString().slice(0,7)+"-01";
                              const logs = [...(profileDraft[field.logKey]||[])];
                              const todayIdx = logs.findIndex(l => l.date.slice(0,7) === today.slice(0,7));
                              if (todayIdx >= 0) logs[todayIdx] = { ...logs[todayIdx], value: val };
                              else logs.unshift({ date: today, value: val });
                              setProfileDraft(p=>({ ...p, [field.key]: val, [field.logKey]: logs }));
                            }}
                            style={{
                              flex:1, border:"none", borderBottom:"1.5px solid #E5E5EA",
                              padding:"6px 0", fontSize:22, fontWeight:800, outline:"none",
                              color:"#1C1C1E", background:"transparent", width:0,
                            }}
                          />
                          <span style={{ fontSize:13, color:"#8E8E93", fontWeight:600 }}>{field.unit}</span>
                        </div>
                        {latestLog && (
                          <div style={{ fontSize:11, color:"#C7C7CC" }}>
                            최근 {latestLog.date.slice(0,7)} · {latestLog.value}{field.unit}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 알레르기 */}
              <div style={{ background:"white", borderRadius:14, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, marginBottom:14 }}>⚠️ 알레르기</div>
                <input
                  type="text"
                  value={profileDraft.allergy || ""}
                  placeholder="페니실린 계열, 복숭아 등 (없으면 비워두세요)"
                  onChange={e => setProfileDraft(p=>({...p, allergy: e.target.value}))}
                  style={{
                    width:"100%", border:"none", borderBottom:"1.5px solid #E5E5EA",
                    padding:"6px 0", fontSize:14, fontWeight:600, outline:"none",
                    color:"#1C1C1E", background:"transparent",
                  }}
                />
              </div>

              {/* 성장 기록 수정 */}
              <div style={{ background:"white", borderRadius:14, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, marginBottom:14 }}>📈 성장 기록</div>
                {/* 키 */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#3B82F6", marginBottom:8 }}>📏 키 (cm)</div>
                  {(profileDraft.heightLog||[]).map((log, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <input
                        type="month"
                        value={log.date.slice(0,7)}
                        onChange={e => {
                          const logs = [...profileDraft.heightLog];
                          logs[i] = { ...logs[i], date: e.target.value+"-01" };
                          setProfileDraft(p=>({...p, heightLog:logs}));
                        }}
                        style={{ flex:1, border:"1px solid #E5E5EA", borderRadius:8, padding:"8px 10px", fontSize:13, outline:"none" }}
                      />
                      <input
                        type="number"
                        value={log.value}
                        onChange={e => {
                          const logs = [...profileDraft.heightLog];
                          logs[i] = { ...logs[i], value: parseFloat(e.target.value)||0 };
                          setProfileDraft(p=>({...p, heightLog:logs}));
                        }}
                        style={{ width:64, border:"1px solid #E5E5EA", borderRadius:8, padding:"8px 6px", fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }}
                      />
                      <span style={{ fontSize:12, color:"#8E8E93" }}>cm</span>
                      <button onClick={() => setProfileDraft(p=>({...p, heightLog:p.heightLog.filter((_,j)=>j!==i)}))}
                        style={{ background:"#FFE5E5", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:"#EF4444", flexShrink:0 }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => setProfileDraft(p=>({...p, heightLog:[...(p.heightLog||[]), { date:new Date().toISOString().slice(0,7)+"-01", value:0 }]}))}
                    style={{ width:"100%", border:"1.5px dashed #3B82F6", borderRadius:8, padding:"8px", fontSize:13, color:"#3B82F6", background:"transparent", cursor:"pointer", fontWeight:600 }}>+ 키 기록 추가</button>
                </div>

                <div style={{ height:1, background:"#F2F2F7", marginBottom:16 }}/>

                {/* 몸무게 */}
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#10B981", marginBottom:8 }}>⚖️ 몸무게 (kg)</div>
                  {(profileDraft.weightLog||[]).map((log, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <input
                        type="month"
                        value={log.date.slice(0,7)}
                        onChange={e => {
                          const logs = [...profileDraft.weightLog];
                          logs[i] = { ...logs[i], date: e.target.value+"-01" };
                          setProfileDraft(p=>({...p, weightLog:logs}));
                        }}
                        style={{ flex:1, border:"1px solid #E5E5EA", borderRadius:8, padding:"8px 10px", fontSize:13, outline:"none" }}
                      />
                      <input
                        type="number"
                        value={log.value}
                        step="0.1"
                        onChange={e => {
                          const logs = [...profileDraft.weightLog];
                          logs[i] = { ...logs[i], value: parseFloat(e.target.value)||0 };
                          setProfileDraft(p=>({...p, weightLog:logs}));
                        }}
                        style={{ width:64, border:"1px solid #E5E5EA", borderRadius:8, padding:"8px 6px", fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }}
                      />
                      <span style={{ fontSize:12, color:"#8E8E93" }}>kg</span>
                      <button onClick={() => setProfileDraft(p=>({...p, weightLog:p.weightLog.filter((_,j)=>j!==i)}))}
                        style={{ background:"#FFE5E5", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:"#EF4444", flexShrink:0 }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => setProfileDraft(p=>({...p, weightLog:[...(p.weightLog||[]), { date:new Date().toISOString().slice(0,7)+"-01", value:0 }]}))}
                    style={{ width:"100%", border:"1.5px dashed #10B981", borderRadius:8, padding:"8px", fontSize:13, color:"#10B981", background:"transparent", cursor:"pointer", fontWeight:600 }}>+ 몸무게 기록 추가</button>
                </div>
              </div>

              {/* 특이사항 */}
              <div style={{ background:"white", borderRadius:14, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, marginBottom:14 }}>📋 특이사항 / 병력</div>
                <textarea
                  value={profileDraft.notes || ""}
                  placeholder="열성경련, 수술 이력, 만성 질환 등"
                  onChange={e => setProfileDraft(p=>({...p, notes: e.target.value}))}
                  style={{
                    width:"100%", minHeight:80, border:"1px solid #E5E5EA",
                    borderRadius:10, padding:"10px 12px", fontSize:13, lineHeight:1.7,
                    resize:"none", outline:"none", color:"#1C1C1E", background:"#FAFAFA",
                    fontFamily:"'Apple SD Gothic Neo', sans-serif",
                  }}
                />
              </div>

              {/* 저장 버튼 */}
              <button onClick={() => { setChildProfile(profileDraft); setScreen("child"); }} style={{
                background:"#1A1A2E", border:"none",
                borderRadius:14, padding:"16px", color:"white", fontSize:15,
                fontWeight:700, cursor:"pointer", marginTop:4,
                boxShadow:"0 4px 14px rgba(0,0,0,0.15)",
              }}>저장하기</button>
            </div>
          </div>
        );
      })()}

      {screen === "scan" && (
        <ScanScreen
          onCancel={() => { setScreen("home"); setScanStep(0); setNewRx(null); }}
          onSave={(rx) => { setPrescriptions([rx, ...prescriptions]); setScreen("home"); }}
          CAT_COLOR={CAT_COLOR}
          FORM_ICON={FORM_ICON}
          MedBadge={MedBadge}
        />
      )}

      {/* ── 약 정보 탭 ── */}
      {screen === "meds" && (
        <div style={{ paddingBottom: 110 }}>
          <div style={{ background:"#1A1A2E", padding:"52px 22px 20px" }}>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:15, marginBottom:4 }}>처방 약 모아보기 💊</div>
            <div style={{ color:"white", fontSize:15, fontWeight:600 }}>
              총 {prescriptions.reduce((a,p)=>a+p.medicines.length,0)}종의 약이 있어요
            </div>
          </div>
          <div style={{ padding:"12px 18px 0" }}>
            {(() => {
              // 약 이름 기준으로 중복 제거해 모으기
              const medMap = {};
              prescriptions.forEach(rx => {
                rx.medicines.forEach(m => {
                  const key = m.name;
                  if (!medMap[key]) medMap[key] = { ...m, count: 0, hospitals: [] };
                  medMap[key].count += 1;
                  if (!medMap[key].hospitals.includes(rx.hospital)) medMap[key].hospitals.push(rx.hospital);
                });
              });
              const meds = Object.values(medMap).sort((a,b) => b.count - a.count);
              // 카테고리별 그룹
              const cats = meds.reduce((acc, m) => {
                const c = m.category || "기타";
                if (!acc[c]) acc[c] = [];
                acc[c].push(m);
                return acc;
              }, {});
              return Object.entries(cats).map(([cat, items]) => (
                <div key={cat}>
                  <div style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"14px 2px 8px",
                  }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:CAT_COLOR[cat]||"#ccc" }} />
                    <span style={{ fontSize:13, fontWeight:700, color:"#8E8E93", letterSpacing:0.8 }}>{cat}</span>
                  </div>
                  {items.map((m, i) => (
                    <div key={i} style={{
                      background:"white", borderRadius:14, marginBottom:8,
                      padding:"13px 16px", boxShadow:"0 1px 6px rgba(0,0,0,0.06)",
                      borderLeft:`3px solid ${CAT_COLOR[m.category]||"#ccc"}`,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:15 }}>{FORM_ICON[m.form]||"💊"}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, fontWeight:700, color:"#1C1C1E" }}>{m.name}</div>
                          {m.comment && <div style={{ fontSize:12, color:"#8E8E93", marginTop:2 }}>{m.comment}</div>}
                        </div>
                        <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} small />
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {m.hospitals.map((h,j) => (
                          <span key={j} style={{
                            fontSize:12, color:"#555", background:"#F2F2F7",
                            borderRadius:6, padding:"3px 10px", fontWeight:500,
                          }}>🏥 {h}</span>
                        ))}
                        {m.count > 1 && (
                          <span style={{
                            fontSize:12, color:CAT_COLOR[m.category], background:CAT_COLOR[m.category]+"15",
                            borderRadius:6, padding:"3px 10px", fontWeight:700,
                          }}>{m.count}회 처방</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ── 병원 탭 ── */}
      {screen === "hospitals" && (
        <div style={{ paddingBottom: 110 }}>
          <div style={{ background:"#1A1A2E", padding:"52px 22px 20px" }}>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:15, marginBottom:4 }}>병원 방문 이력 🏥</div>
            <div style={{ color:"white", fontSize:15, fontWeight:600 }}>
              총 {[...new Set(prescriptions.map(p=>p.hospital))].length}곳의 병원을 방문했어요
            </div>
          </div>
          <div style={{ padding:"12px 18px 0" }}>
            {(() => {
              // 월별 그룹
              const byMonth = prescriptions.reduce((acc, p) => {
                const key = p.date.slice(0,7);
                if (!acc[key]) acc[key] = [];
                acc[key].push(p);
                return acc;
              }, {});
              return Object.keys(byMonth).sort().reverse().map(month => (
                <div key={month}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, padding:"14px 2px 8px" }}>
                    {month.replace("-","년 ")}월
                  </div>
                  {byMonth[month].map((rx, i) => (
                    <div
                      key={i}
                      onClick={() => { setSelected(rx); setMemoEditing(false); setScreen("detail"); }}
                      style={{
                        background:"white", borderRadius:14, marginBottom:8,
                        padding:"16px 16px", boxShadow:"0 1px 6px rgba(0,0,0,0.06)",
                        cursor:"pointer", borderLeft:`4px solid ${rx.accent}`,
                        display:"flex", alignItems:"center", gap:14,
                      }}
                    >
                      <div style={{
                        width:48, height:48, borderRadius:14, flexShrink:0,
                        background:rx.accent+"15",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:22,
                      }}>🏥</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:17, fontWeight:700, color:"#1C1C1E" }}>{rx.hospital}</div>
                        <div style={{ fontSize:13, color:"#8E8E93", marginTop:3 }}>
                          {rx.date.slice(5).replace("-","/")} · {rx.symptom}
                        </div>
                        <div style={{ fontSize:13, color:"#8E8E93", marginTop:2 }}>
                          {rx.doctor} · 약 {rx.medicines.length}종
                        </div>
                      </div>
                      <div style={{
                        width:32, height:32, borderRadius:"50%", background:"#F2F2F7",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      {screen !== "scan" && screen !== "child-edit" && (
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:390,
          background:"rgba(255,255,255,0.97)",
          backdropFilter:"blur(20px)",
          borderTop:"1px solid rgba(0,0,0,0.07)",
          display:"flex", justifyContent:"space-around", alignItems:"center",
          padding:"8px 0 28px",
        }}>
          {[
            {icon:"🏠", label:"홈", id:"home"},
            {icon:"💊", label:"약 정보", id:"meds"},
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setScreen(tab.id)} style={{
              background:"none", border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              opacity:screen===tab.id?1:0.28, flex:1,
            }}>
              <span style={{fontSize:22}}>{tab.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color:"#1C1C1E",letterSpacing:0.2}}>{tab.label}</span>
            </button>
          ))}

          {/* FAB */}
          <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center" }}>
            <button onClick={()=>setScreen("scan")} style={{
              width:50, height:50, marginTop:-22,
              background:"linear-gradient(135deg,#1A1A2E,#4A4A8E)",
              border:"3px solid white", borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, cursor:"pointer",
              boxShadow:"0 4px 14px rgba(26,26,46,0.35)",
            }}>📸</button>
          </div>

          {[
            {icon:"🏥", label:"병원", id:"hospitals"},
            {icon:"🧒", label:"아이 정보", id:"child"},
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setScreen(tab.id)} style={{
              background:"none", border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              opacity:screen===tab.id?1:0.28, flex:1,
            }}>
              <span style={{fontSize:22}}>{tab.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color:"#1C1C1E",letterSpacing:0.2}}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        * { box-sizing:border-box; margin:0; padding:0; }
        input::placeholder { color:rgba(255,255,255,0.35); }
      `}</style>
    </div>
  );
}
