import { CAT_COLOR, FORM_ICON } from "./constants";
import MedBadge from "./MedBadge";

function addTitle(doctor) {
  if (!doctor) return "";
  if (["원장","의사","선생님"].some(t => doctor.endsWith(t))) return doctor;
  return `${doctor} 의사`;
}

export default function DetailScreen({ selected, memos, saveMemos, memoEditing, setMemoEditing, setScreen }) {
  return (
    <div style={{paddingBottom:40}}>
      {/* Header */}
      <div style={{background:selected.accent,padding:"54px 22px 16px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
        <button onClick={()=>setScreen("home")} style={{position:"absolute",top:12,left:16,background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16}}>
          <div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginBottom:1}}>{selected.date}</div>
            <div style={{color:"white",fontSize:18,fontWeight:800,letterSpacing:-0.5}}>{selected.hospital}</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginTop:1}}>{addTitle(selected.doctor)}</div>
          </div>
        </div>

        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"3px 10px",fontSize:12,color:"white",fontWeight:600}}>🩺 {selected.symptom}</div>
          {selected.child && <div style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"3px 10px",fontSize:12,color:"white",fontWeight:600}}>👶 {selected.child}</div>}
        </div>

        {selected.memo && (
          <div style={{marginTop:8,background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",fontSize:12,color:"rgba(255,255,255,0.9)",lineHeight:1.6}}>
            📝 {selected.memo}
          </div>
        )}
      </div>

      <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontSize:13,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,marginBottom:4}}>
          처방 약물 {selected.medicines.length}종
        </div>
        {selected.medicines.map((m,i) => (
          <div key={i} style={{background:"white",borderRadius:14,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",borderLeft:`3px solid ${CAT_COLOR[m.category]||"#ccc"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>{FORM_ICON[m.form]||"💊"}</span>
                <div>
                  <div style={{fontSize:17,fontWeight:700,color:"#1C1C1E"}}>{m.name}</div>
                  {m.comment && <div style={{fontSize:11,color:"#8E8E93",marginTop:1}}>{m.comment}</div>}
                </div>
              </div>
              <span style={{fontSize:12,background:CAT_COLOR[m.category]+"20",color:CAT_COLOR[m.category],borderRadius:6,padding:"2px 8px",fontWeight:700,flexShrink:0}}>{m.category}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              {[
                {label:"용량",hi:true},
                {label:"복용",value:m.times,hi:false},
                {label:"기간",value:`${m.days}일`,hi:false},
              ].map((info,j) => (
                <div key={j} style={{flex:1,textAlign:"center",background:info.hi?CAT_COLOR[m.category]+"10":"#F9F9F9",borderRadius:10,padding:"10px 4px",border:info.hi?`1px solid ${CAT_COLOR[m.category]}25`:"1px solid #F0F0F0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
                  {info.hi ? <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form}/> : <div style={{fontSize:15,fontWeight:600,color:"#1C1C1E",lineHeight:1.3}}>{info.value}</div>}
                  <div style={{fontSize:12,color:"#8E8E93"}}>{info.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Memo */}
        <div style={{background:"white",borderRadius:14,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginTop:2}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:16}}>✏️</span>
              <span style={{fontSize:15,fontWeight:700,color:"#1C1C1E"}}>부모 메모</span>
            </div>
            {!memoEditing ? (
              <button onClick={()=>setMemoEditing(true)} style={{background:"#F2F2F7",border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:600,color:"#555",cursor:"pointer"}}>
                {memos[selected.id]?"수정":"추가"}
              </button>
            ) : (
              <button onClick={()=>setMemoEditing(false)} style={{background:"#1A1A2E",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,color:"white",cursor:"pointer"}}>저장</button>
            )}
          </div>
          {memoEditing ? (
            <textarea autoFocus placeholder="복약 상황, 부작용, 기타 참고 메모를 자유롭게 입력해주세요"
              value={memos[selected.id]||""} onChange={e=>saveMemos({...memos,[selected.id]:e.target.value})}
              style={{width:"100%",minHeight:90,border:"1.5px solid #E5E5EA",borderRadius:10,padding:"10px 12px",fontSize:13,color:"#1C1C1E",lineHeight:1.7,resize:"none",outline:"none",fontFamily:"'Pretendard',-apple-system,sans-serif",background:"#FAFAFA"}}/>
          ) : memos[selected.id] ? (
            <div style={{fontSize:15,color:"#3C3C3C",lineHeight:1.8,padding:"12px 14px",background:"#FAFAFA",borderRadius:10,whiteSpace:"pre-wrap"}}>{memos[selected.id]}</div>
          ) : (
            <div onClick={()=>setMemoEditing(true)} style={{fontSize:13,color:"#C7C7CC",lineHeight:1.7,padding:"10px 12px",background:"#FAFAFA",borderRadius:10,cursor:"pointer",border:"1.5px dashed #E5E5EA"}}>
              복약 상황, 부작용, 기타 참고 메모를 입력해보세요 📋
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
