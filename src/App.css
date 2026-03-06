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

// 알약형 SVG — 시럽은 물방울, 분말은 봉지, 정제는 알약
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
        <div style={{ paddingBottom: 90 }}>
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

            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginBottom:3 }}>처방전 관리 👶</div>
            <div style={{ color:"white", fontSize:15, fontWeight:600, letterSpacing:-0.3, marginBottom:18 }}>
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
                <div style={{ fontSize:11, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, padding:"12px 2px 8px" }}>
                  {month.replace("-", "년 ")}월
                </div>

                {grouped[month].map(rx => (
                  <div
                    key={rx.id}
                    onClick={() => { setSelected(rx); setScreen("detail"); }}
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
                          <span style={{ fontSize:14, fontWeight:800, color:rx.accent }}>
                            {rx.date.slice(5).replace("-","/")}
                          </span>
                        </div>
                        {/* Total days */}
                        <div style={{
                          background:"#F2F2F7", borderRadius:6, padding:"2px 7px",
                          fontSize:11, fontWeight:700, color:"#555",
                        }}>
                          총 {Math.max(...rx.medicines.map(m=>m.days))}일
                        </div>
                        <span style={{ fontSize:11, color:"#8E8E93" }}>{rx.hospital}</span>
                      </div>
                      <span style={{ color:"#C7C7CC", fontSize:14 }}>›</span>
                    </div>

                    {/* Symptom row */}
                    <div style={{ padding:"5px 14px 0", display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, color:"#555", fontWeight:600 }}>🩺 {rx.symptom}</span>
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
                            <span style={{ fontSize:13, flexShrink:0 }}>{FORM_ICON[m.form]||"💊"}</span>
                            <div style={{
                              flex:1, fontSize:13, fontWeight:600, color:"#1C1C1E",
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            }}>{m.name}</div>
                            <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} small />
                          </div>
                          {/* 아랫줄: 코멘트 + 복용횟수 + 일수 */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, paddingLeft:20 }}>
                            <div style={{ flex:1, fontSize:10, color:"#8E8E93", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {m.comment || ""}
                            </div>
                            <div style={{
                              fontSize:10, color:"#555", fontWeight:600,
                              background:"#F5F5F5", borderRadius:5, padding:"2px 7px",
                              flexShrink:0, whiteSpace:"nowrap",
                            }}>{m.times}</div>
                            <div style={{
                              fontSize:10, fontWeight:700, color:"#3C3C43",
                              background:"white",
                              border:"1.5px solid #D1D1D6",
                              borderRadius:5, padding:"2px 7px", flexShrink:0,
                              display:"flex", alignItems:"center", gap:3,
                            }}>
                              <span style={{ fontSize:9 }}>📅</span>{m.days}일
                            </div>
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
            background: selected.accent, padding: "52px 22px 22px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
            <button onClick={() => setScreen("home")} style={{
              background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10,
              padding:"7px 14px", color:"white", fontSize:13, cursor:"pointer", marginBottom:16,
            }}>← 목록</button>

            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginBottom:2 }}>{selected.date}</div>
            <div style={{ color:"white", fontSize:22, fontWeight:800, letterSpacing:-0.8 }}>{selected.hospital}</div>
            <div style={{ color:"rgba(255,255,255,0.75)", fontSize:14, marginTop:2 }}>{selected.doctor}</div>

            <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
              <div style={{
                background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"5px 12px",
                fontSize:13, color:"white", fontWeight:600,
              }}>🩺 {selected.symptom}</div>
              {selected.child && (
                <div style={{
                  background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"5px 12px",
                  fontSize:13, color:"white", fontWeight:600,
                }}>👶 {selected.child}</div>
              )}
            </div>

            {selected.memo && (
              <div style={{
                marginTop:12, background:"rgba(255,255,255,0.12)", borderRadius:10,
                padding:"10px 14px", fontSize:13, color:"rgba(255,255,255,0.9)", lineHeight:1.6,
              }}>📝 {selected.memo}</div>
            )}
          </div>

          <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#8E8E93", letterSpacing:0.8, marginBottom:2 }}>
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
                      <div style={{ fontSize:15, fontWeight:700, color:"#1C1C1E" }}>{m.name}</div>
                      {m.comment && <div style={{ fontSize:11, color:"#8E8E93", marginTop:1 }}>{m.comment}</div>}
                    </div>
                  </div>
                  <span style={{
                    fontSize:10, background:CAT_COLOR[m.category]+"20",
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
                        <div style={{ fontSize:13, fontWeight:600, color:"#1C1C1E", lineHeight:1.3 }}>{info.value}</div>
                      )}
                      <div style={{ fontSize:10, color:"#8E8E93" }}>{info.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SCAN ── */}
      {screen === "scan" && (
        <div style={{
          minHeight:"100vh", background:"#1A1A2E",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:28,
        }}>
          <button onClick={() => { setScreen("home"); setScanStep(0); setNewRx(null); }} style={{
            position:"absolute", top:52, left:18,
            background:"rgba(255,255,255,0.1)", border:"none",
            borderRadius:10, padding:"7px 14px",
            color:"rgba(255,255,255,0.7)", fontSize:13, cursor:"pointer",
          }}>‹ 취소</button>

          {scanStep === 0 && !newRx && (
            <>
              <div style={{
                width:220, height:160, border:"2px dashed rgba(255,255,255,0.2)",
                borderRadius:20, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", marginBottom:32,
                position:"relative",
              }}>
                <span style={{ fontSize:48 }}>📄</span>
                <span style={{ color:"rgba(255,255,255,0.35)", fontSize:12, marginTop:8 }}>약봉지를 프레임에 맞추세요</span>
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
              <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:280 }}>
                <button onClick={simulateScan} style={{
                  background:"linear-gradient(135deg,#64C8FF,#A78BFA)", border:"none",
                  borderRadius:14, padding:"15px", color:"white", fontSize:15, fontWeight:700, cursor:"pointer",
                }}>📸 촬영하기</button>
                <button onClick={simulateScan} style={{
                  background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
                  borderRadius:14, padding:"13px", color:"rgba(255,255,255,0.6)", fontSize:14, cursor:"pointer",
                }}>🖼 갤러리에서 선택</button>
              </div>
            </>
          )}

          {scanning && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:56, marginBottom:20, animation:"spin 2s linear infinite" }}>⚙️</div>
              <div style={{ color:"white", fontSize:16, fontWeight:700, marginBottom:8 }}>
                {scanStep===1?"이미지 인식 중...":scanStep===2?"텍스트 추출 중...":"정보 구조화 중..."}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:20, width:220 }}>
                {["이미지 인식","OCR 텍스트 추출","AI 정보 구조화"].map((s,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{
                      width:22, height:22, borderRadius:"50%",
                      background:scanStep>i?"#64C8FF":"rgba(255,255,255,0.1)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, color:scanStep>i?"#1A1A2E":"rgba(255,255,255,0.3)",
                      fontWeight:700, transition:"all 0.3s", flexShrink:0,
                    }}>{scanStep>i?"✓":i+1}</div>
                    <span style={{
                      fontSize:13, transition:"all 0.3s",
                      color:scanStep>i?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)",
                    }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newRx && !scanning && (
            <div style={{ width:"100%", maxWidth:340 }}>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
                <div style={{ color:"white", fontSize:17, fontWeight:700 }}>스캔 완료!</div>
                <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, marginTop:4 }}>내용을 확인하고 저장하세요</div>
              </div>
              <div style={{
                background:"rgba(255,255,255,0.05)", borderRadius:18, padding:"18px", marginBottom:16,
                border:"1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize:20, fontWeight:800, color:"white", marginBottom:2 }}>
                  {newRx.date.replace(/-/g,".")}
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:14 }}>
                  {newRx.hospital} · {newRx.symptom}
                </div>
                {newRx.medicines.map((m,i)=>(
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"8px 0", borderTop:i>0?"1px solid rgba(255,255,255,0.06)":"none",
                  }}>
                    <span style={{ fontSize:14 }}>{FORM_ICON[m.form]||"💊"}</span>
                    <span style={{flex:1,fontSize:13,color:"rgba(255,255,255,0.8)",fontWeight:600}}>{m.name}</span>
                    <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} small />
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.08)",borderRadius:5,padding:"2px 6px"}}>{m.days}일</span>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>{setScanStep(0);setNewRx(null);}} style={{
                  flex:1, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
                  borderRadius:12, padding:"13px", color:"rgba(255,255,255,0.55)", fontSize:13, cursor:"pointer",
                }}>다시 스캔</button>
                <button onClick={confirmAdd} style={{
                  flex:2, background:"linear-gradient(135deg,#64C8FF,#A78BFA)", border:"none",
                  borderRadius:12, padding:"13px", color:"white", fontSize:14, fontWeight:700, cursor:"pointer",
                }}>저장하기 💾</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      {screen !== "scan" && (
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:390,
          background:"rgba(255,255,255,0.94)",
          backdropFilter:"blur(12px)",
          borderTop:"1px solid rgba(0,0,0,0.08)",
          display:"flex", justifyContent:"space-around",
          padding:"10px 0 22px",
        }}>
          {[{icon:"🏠",label:"홈",id:"home"},{icon:"📋",label:"전체",id:"list"}].map(tab=>(
            <button key={tab.id} onClick={()=>setScreen(tab.id)} style={{
              background:"none", border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              opacity:screen===tab.id?1:0.3,
            }}>
              <span style={{fontSize:20}}>{tab.icon}</span>
              <span style={{fontSize:10,fontWeight:600,color:"#1C1C1E"}}>{tab.label}</span>
            </button>
          ))}

          <button onClick={()=>setScreen("scan")} style={{
            width:54, height:54, marginTop:-14,
            background:"linear-gradient(135deg,#1A1A2E,#4A4A8E)",
            border:"none", borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, cursor:"pointer",
            boxShadow:"0 4px 16px rgba(26,26,46,0.4)",
          }}>📸</button>

          {[{icon:"🧒",label:"아이 정보"},{icon:"👤",label:"보호자"}].map((tab,i)=>(
            <button key={i} style={{
              background:"none", border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3, opacity:0.3,
            }}>
              <span style={{fontSize:20}}>{tab.icon}</span>
              <span style={{fontSize:10,fontWeight:600,color:"#1C1C1E"}}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        input::placeholder { color:rgba(255,255,255,0.35); }
      `}</style>
    </div>
  );
}
