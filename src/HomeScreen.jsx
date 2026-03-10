import { CAT_COLOR, FORM_ICON } from "./constants";
import MedBadge from "./MedBadge";

export default function HomeScreen({ prescriptions, memos, search, setSearch, setScreen, setSelected, setMemoEditing }) {
  const filtered = prescriptions.filter(p =>
    !search || p.hospital.includes(search) || p.symptom.includes(search) ||
    p.child?.includes(search) || p.medicines.some(m => m.name.includes(search))
  );

  const grouped = filtered.reduce((acc, p) => {
    const k = p.date.slice(0,7);
    if (!acc[k]) acc[k] = [];
    acc[k].push(p);
    return acc;
  }, {});

  const goDetail = (rx) => { setSelected(rx); setMemoEditing(false); setScreen("detail"); };

  return (
    <div style={{paddingBottom:110}}>
      {/* Header */}
      <div style={{background:"#1A1A2E",padding:"52px 22px 22px",position:"relative"}}>
        <div style={{position:"absolute",top:-50,right:-50,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.03)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:10,right:20,width:90,height:90,borderRadius:"50%",background:"rgba(100,200,255,0.06)",pointerEvents:"none"}}/>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,background:"linear-gradient(135deg,#64C8FF,#A78BFA)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>💊</div>
            <span style={{color:"white",fontSize:19,fontWeight:700,letterSpacing:-0.5}}>약봉지</span>
            <span style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>MedBag</span>
          </div>
          <button onClick={()=>setScreen("scan")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"7px 15px",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",position:"relative",zIndex:10}}>+ 등록</button>
        </div>

        <div style={{color:"rgba(255,255,255,0.6)",fontSize:15,marginBottom:4}}>안녕하세요! 👋</div>
        <div style={{color:"white",fontSize:18,fontWeight:700,letterSpacing:-0.5,marginBottom:18}}>
          처방전 {prescriptions.length}건을 보관하고 있어요
        </div>

        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>🔍</span>
          <input placeholder="약 이름, 증상, 병원명 검색" value={search} onChange={e=>setSearch(e.target.value)}
            style={{background:"transparent",border:"none",outline:"none",color:"white",fontSize:14,flex:1}}/>
        </div>
      </div>

      {/* List */}
      <div style={{padding:"0 18px"}}>
        {Object.keys(grouped).sort().reverse().map(month => (
          <div key={month}>
            <div style={{fontSize:13,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,padding:"14px 2px 10px"}}>
              {month.replace("-","년 ")}월
            </div>
            {grouped[month].map(rx => (
              <div key={rx.id} onClick={()=>goDetail(rx)}
                style={{background:"white",borderRadius:16,marginBottom:10,overflow:"hidden",
                  boxShadow:"0 2px 10px rgba(0,0,0,0.07)",cursor:"pointer",borderLeft:`4px solid ${rx.accent}`}}>
                {/* Card header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{background:rx.accent+"18",borderRadius:8,padding:"3px 9px"}}>
                      <span style={{fontSize:17,fontWeight:800,color:rx.accent}}>{rx.date.slice(5).replace("-","/")}</span>
                    </div>
                    <div style={{background:"#F2F2F7",borderRadius:6,padding:"2px 7px",fontSize:13,fontWeight:700,color:"#555"}}>
                      총 {Math.max(...rx.medicines.map(m=>m.days))}일
                    </div>
                    <span style={{fontSize:13,color:"#8E8E93"}}>{rx.hospital}</span>
                  </div>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>

                {/* Symptom */}
                <div style={{padding:"5px 14px 0",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,color:"#555",fontWeight:600}}>🩺 {rx.symptom}</span>
                </div>

                {/* Medicines */}
                <div style={{padding:"8px 14px",paddingBottom:memos[rx.id]?8:12}}>
                  {rx.medicines.map((m,i) => (
                    <div key={i} style={{paddingTop:i===0?0:8,marginTop:i===0?0:8,borderTop:i===0?"none":"1px solid #F2F2F7"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                        <span style={{fontSize:16,flexShrink:0}}>{FORM_ICON[m.form]||"💊"}</span>
                        <div style={{flex:1,fontSize:15,fontWeight:700,color:"#1C1C1E",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                        <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} small/>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:20}}>
                        <div style={{flex:1,fontSize:12,color:"#8E8E93",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.comment||""}</div>
                        <div style={{fontSize:12,color:"#555",fontWeight:600,background:"#F5F5F5",borderRadius:5,padding:"3px 9px",flexShrink:0,whiteSpace:"nowrap"}}>{m.times}</div>
                        <div style={{fontSize:12,color:"#555",fontWeight:600,background:"#F5F5F5",borderRadius:5,padding:"3px 9px",flexShrink:0,whiteSpace:"nowrap"}}>{m.days}일</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Memo preview */}
                {memos[rx.id] && (
                  <div style={{margin:"0 14px 12px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"flex-start",gap:6}}>
                    <span style={{fontSize:13,flexShrink:0,marginTop:1}}>📝</span>
                    <span style={{fontSize:12,color:"#92400E",lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                      {memos[rx.id]}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
