import { useState } from "react";
import { FORM_ICON } from "./constants";
import { COLORS, SAFE_TOP } from "./theme";
import MedBadge from "./MedBadge";
import { catColor } from "./utils";

function MedsContent({ prescriptions }) {
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
    <div style={{padding:"12px 18px 0"}}>
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"14px 2px 8px"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:catColor({category:cat})}}/>
            <span style={{fontSize:13,fontWeight:700,color:"#8E8E93",letterSpacing:0.8}}>{cat}</span>
          </div>
          {items.map((m,i) => (
            <div key={i} style={{background:"white",borderRadius:14,marginBottom:8,padding:"13px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",borderLeft:`3px solid ${catColor(m)}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:15}}>{FORM_ICON[m.form]||"💊"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#1C1C1E"}}>{m.name}</div>
                  {m.comment && <div style={{fontSize:12,color:"#8E8E93",marginTop:2}}>{m.comment}</div>}
                </div>
                <MedBadge dosage={m.dosage} color={catColor(m)} small/>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {m.hospitals.map((h,j) => (
                  <span key={j} style={{fontSize:12,color:"#555",background:"#F2F2F7",borderRadius:6,padding:"3px 10px",fontWeight:500}}>🏥 {h}</span>
                ))}
                {m.count > 1 && (
                  <span style={{fontSize:12,color:catColor(m),background:catColor(m)+"15",borderRadius:6,padding:"3px 10px",fontWeight:700}}>{m.count}회 처방</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function HospitalsContent({ prescriptions, setSelected, setMemoEditing, setScreen }) {
  const byMonth = prescriptions.reduce((acc, p) => {
    const k = p.date.slice(0,7);
    if (!acc[k]) acc[k] = [];
    acc[k].push(p);
    return acc;
  }, {});

  return (
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
  );
}

function TabBtn({ icon, label, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex:1, background: active ? "rgba(255,255,255,0.18)" : "transparent",
      border: "none", borderRadius:10, padding:"10px 8px", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      color: active ? "white" : "rgba(255,255,255,0.5)",
      fontSize:13, fontWeight:700, transition:"all 0.15s",
    }}>
      <span style={{fontSize:15}}>{icon}</span>
      <span>{label}</span>
      <span style={{fontSize:11,fontWeight:700,background:active?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.1)",borderRadius:6,padding:"1px 7px"}}>{count}</span>
    </button>
  );
}

export function MedsScreen({ prescriptions, setSelected, setMemoEditing, setScreen }) {
  const [tab, setTab] = useState("meds");

  const medCount = new Set(prescriptions.flatMap(p => p.medicines.map(m => m.name))).size;
  const hospitalCount = new Set(prescriptions.map(p => p.hospital)).size;

  return (
    <div style={{paddingBottom:110}}>
      <div style={{background:COLORS.navy,padding:`${SAFE_TOP(16)} 18px 14px`}}>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:14,marginBottom:12}}>
          {tab === "meds" ? "처방받은 약 정보 💊" : "방문한 병원 정보 🏥"}
        </div>
        <div style={{display:"flex",gap:6,background:"rgba(255,255,255,0.06)",borderRadius:12,padding:4}}>
          <TabBtn icon="💊" label="약" count={medCount} active={tab==="meds"} onClick={()=>setTab("meds")}/>
          <TabBtn icon="🏥" label="병원" count={hospitalCount} active={tab==="hospitals"} onClick={()=>setTab("hospitals")}/>
        </div>
      </div>
      {tab === "meds"
        ? <MedsContent prescriptions={prescriptions}/>
        : <HospitalsContent prescriptions={prescriptions} setSelected={setSelected} setMemoEditing={setMemoEditing} setScreen={setScreen}/>
      }
    </div>
  );
}
