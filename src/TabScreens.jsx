import { CAT_COLOR, FORM_ICON } from "./constants";
import MedBadge from "./MedBadge";

export function MedsScreen({ prescriptions }) {
  const medMap = {};
  prescriptions.forEach(rx => {
    rx.medicines.forEach(m => {
      if (!medMap[m.name]) medMap[m.name] = {...m, count:0, hospitals:[]};
      medMap[m.name].count++;
      if (!medMap[m.name].hospitals.includes(rx.hospital)) medMap[m.name].hospitals.push(rx.hospital);
    });
  });
  const byCategory = Object.values(medMap)
    .sort((a,b) => b.count - a.count)
    .reduce((acc, m) => {
      const c = m.category||"기타";
      if (!acc[c]) acc[c] = [];
      acc[c].push(m);
      return acc;
    }, {});

  return (
    <div style={{paddingBottom:110}}>
      <div style={{background:"#1A1A2E",padding:"52px 22px 20px"}}>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:15,marginBottom:4}}>처방 약물 정보 💊</div>
        <div style={{color:"white",fontSize:15,fontWeight:600}}>
          총 {Object.keys(medMap).length}가지 약을 처방받았어요
        </div>
      </div>
      <div style={{padding:"12px 18px 0"}}>
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"14px 2px 8px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[cat]||"#ccc"}}/>
              <span style={{fontSize:13,fontWeight:700,color:"#8E8E93",letterSpacing:0.8}}>{cat}</span>
            </div>
            {items.map((m,i) => (
              <div key={i} style={{background:"white",borderRadius:14,marginBottom:8,padding:"13px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",borderLeft:`3px solid ${CAT_COLOR[m.category]||"#ccc"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:15}}>{FORM_ICON[m.form]||"💊"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#1C1C1E"}}>{m.name}</div>
                    {m.comment && <div style={{fontSize:12,color:"#8E8E93",marginTop:2}}>{m.comment}</div>}
                  </div>
                  <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} small/>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {m.hospitals.map((h,j) => (
                    <span key={j} style={{fontSize:12,color:"#555",background:"#F2F2F7",borderRadius:6,padding:"3px 10px",fontWeight:500}}>🏥 {h}</span>
                  ))}
                  {m.count > 1 && (
                    <span style={{fontSize:12,color:CAT_COLOR[m.category],background:CAT_COLOR[m.category]+"15",borderRadius:6,padding:"3px 10px",fontWeight:700}}>{m.count}회 처방</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HospitalsScreen({ prescriptions, setSelected, setMemoEditing, setScreen }) {
  const byMonth = prescriptions.reduce((acc, p) => {
    const k = p.date.slice(0,7);
    if (!acc[k]) acc[k] = [];
    acc[k].push(p);
    return acc;
  }, {});

  return (
    <div style={{paddingBottom:110}}>
      <div style={{background:"#1A1A2E",padding:"52px 22px 20px"}}>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:15,marginBottom:4}}>병원 방문 이력 🏥</div>
        <div style={{color:"white",fontSize:15,fontWeight:600}}>
          총 {[...new Set(prescriptions.map(p=>p.hospital))].length}곳의 병원을 방문했어요
        </div>
      </div>
      <div style={{padding:"12px 18px 0"}}>
        {Object.keys(byMonth).sort().reverse().map(month => (
          <div key={month}>
            <div style={{fontSize:13,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,padding:"14px 2px 8px"}}>
              {month.replace("-","년 ")}월
            </div>
            {byMonth[month].map((rx,i) => (
              <div key={i} onClick={()=>{setSelected(rx);setMemoEditing(false);setScreen("detail");}}
                style={{background:"white",borderRadius:14,marginBottom:8,padding:"16px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",cursor:"pointer",borderLeft:`4px solid ${rx.accent}`,display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,borderRadius:14,flexShrink:0,background:rx.accent+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏥</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:17,fontWeight:700,color:"#1C1C1E"}}>{rx.hospital}</div>
                  <div style={{fontSize:13,color:"#8E8E93",marginTop:3}}>{rx.date.slice(5).replace("-","/")} · {rx.symptom}</div>
                  <div style={{fontSize:13,color:"#8E8E93",marginTop:2}}>{rx.doctor} · 약 {rx.medicines.length}종</div>
                </div>
                <div style={{width:32,height:32,borderRadius:"50%",background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
