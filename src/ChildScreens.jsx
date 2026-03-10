import { useState } from "react";

function Field({ label, value, onChange, type="text", placeholder="", opts=null }) {
  const base = {flex:1,border:"none",borderBottom:"1.5px solid #E5E5EA",padding:"6px 0",fontSize:14,fontWeight:600,outline:"none",color:"#1C1C1E",background:"transparent"};
  if (opts) return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{...base,appearance:"none"}}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
  return <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} style={base}/>;
}

export function ChildScreen({ childProfile, setScreen, setProfileDraft, setShowGrowthChart }) {
  const cp = childProfile;
  const age = cp.birth ? Math.floor((new Date() - new Date(cp.birth)) / (365.25*24*3600*1000)) : 0;
  const doses = cp.weight ? {
    "타이레놀": `${(cp.weight*15).toFixed(0)}mg · ${(cp.weight*0.15).toFixed(1)}mL`,
    "이부프로펜": `${(cp.weight*10).toFixed(0)}mg · ${(cp.weight*0.5).toFixed(1)}mL`,
  } : null;

  return (
    <div style={{paddingBottom:110}}>
      <div style={{background:"linear-gradient(135deg,#1A1A2E,#2D2D5E)",padding:"52px 22px 24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.03)",zIndex:0}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#64C8FF,#A78BFA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,flexShrink:0}}>
              {cp.gender==="여"?"👧":"🧒"}
            </div>
            <div>
              <div style={{color:"white",fontSize:20,fontWeight:800,letterSpacing:-0.5}}>{cp.name}</div>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginTop:3}}>만 {age}세 · {cp.gender}아 · {cp.bloodType}</div>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:2}}>{cp.birth}</div>
            </div>
          </div>
          <button onClick={()=>{setProfileDraft(JSON.parse(JSON.stringify(cp)));setScreen("child-edit");}}
            style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,padding:"6px 14px",color:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}>수정</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          {[
            {label:"키",value:cp.height?`${cp.height}cm`:"-",icon:"📏"},
            {label:"몸무게",value:cp.weight?`${cp.weight}kg`:"-",icon:"⚖️"},
            {label:"알레르기",value:cp.allergy||"없음",icon:"⚠️"},
          ].map((s,i) => (
            <div key={i} style={{flex:1,background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:16,marginBottom:4}}>{s.icon}</div>
              <div style={{color:"white",fontSize:i===2?10:15,fontWeight:700,lineHeight:1.2}}>{s.value}</div>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:10,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:10}}>
        {/* Dosage guide */}
        {doses && (
          <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
              <span style={{fontSize:16}}>💡</span>
              <span style={{fontSize:13,fontWeight:700,color:"#1C1C1E"}}>표준 해열제 권장 용량</span>
              <span style={{fontSize:10,color:"#8E8E93",marginLeft:"auto"}}>{cp.weight}kg 기준</span>
            </div>
            <div style={{fontSize:11,color:"#FF9500",background:"#FFF9F0",borderRadius:8,padding:"8px 10px",marginBottom:10,lineHeight:1.6}}>
              ⚠️ 참고용입니다. 실제 복용량은 의사·약사에게 확인하세요.
            </div>
            {Object.entries(doses).map(([name,dose],i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderTop:i>0?"1px solid #F2F2F7":"none"}}>
                <span style={{fontSize:13,color:"#555",fontWeight:600}}>💊 {name}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#1C1C1E"}}>{dose}</span>
              </div>
            ))}
          </div>
        )}

        {/* Growth log */}
        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#8E8E93",letterSpacing:0.8}}>📊 성장 기록</div>
            <button onClick={()=>setShowGrowthChart(true)} style={{background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",border:"none",borderRadius:20,padding:"5px 13px",color:"white",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              그래프 보기
            </button>
          </div>
          <div style={{display:"flex",gap:10}}>
            {[
              {label:"키 (cm)",color:"#3B82F6",logs:cp.heightLog},
              {label:"몸무게 (kg)",color:"#10B981",logs:cp.weightLog},
            ].map((col,ci) => (
              <div key={ci} style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:col.color,marginBottom:8}}>{ci===0?"📏":"⚖️"} {col.label}</div>
                {col.logs.map((log,i) => (
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderTop:i>0?"1px solid #F9F9F9":"none"}}>
                    <span style={{fontSize:10,color:"#8E8E93"}}>{log.date.slice(0,7)}</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#1C1C1E"}}>{log.value}</span>
                  </div>
                ))}
                {ci===0&&<div style={{width:1,background:"#F2F2F7"}}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <span style={{fontSize:14}}>📋</span>
            <span style={{fontSize:13,fontWeight:700,color:"#1C1C1E"}}>특이사항 / 주의</span>
          </div>
          <div style={{fontSize:13,color:cp.notes?"#3C3C3C":"#C7C7CC",lineHeight:1.7}}>{cp.notes||"특이사항 없음"}</div>
        </div>
      </div>
    </div>
  );
}

export function ChildEditScreen({ profileDraft, setProfileDraft, saveChildProfile, setScreen }) {
  if (!profileDraft) return null;

  const set = (key, val) => setProfileDraft(p => ({...p, [key]:val}));

  const updateLog = (logKey, idx, field, val) => {
    const logs = [...(profileDraft[logKey]||[])];
    logs[idx] = {...logs[idx], [field]: field==="value"?(parseFloat(val)||0):val+"-01"};
    setProfileDraft(p => ({...p, [logKey]:logs}));
  };

  const updateMeasurement = (key, logKey, val) => {
    const v = parseFloat(val)||0;
    const today = new Date().toISOString().slice(0,7)+"-01";
    const logs = [...(profileDraft[logKey]||[])];
    const idx = logs.findIndex(l => l.date.slice(0,7)===today.slice(0,7));
    if (idx>=0) logs[idx] = {...logs[idx], value:v};
    else logs.unshift({date:today, value:v});
    setProfileDraft(p => ({...p, [key]:v, [logKey]:logs}));
  };

  const addLog = (logKey) => setProfileDraft(p => ({...p, [logKey]:[...(p[logKey]||[]), {date:new Date().toISOString().slice(0,7)+"-01",value:0}]}));
  const removeLog = (logKey, idx) => setProfileDraft(p => ({...p, [logKey]:p[logKey].filter((_,j)=>j!==idx)}));

  const handleSave = () => { saveChildProfile(profileDraft); setScreen("child"); };

  return (
    <div style={{background:"#F2F2F7",minHeight:"100vh",paddingBottom:40}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1A1A2E,#2D2D5E)",padding:"16px 16px 14px",position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>setScreen("child")} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:"50%",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,flexShrink:0}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{color:"white",fontSize:15,fontWeight:700}}>아이 정보 수정</span>
          <button onClick={handleSave} style={{background:"#1A1A2E",border:"1.5px solid rgba(255,255,255,0.3)",borderRadius:10,padding:"6px 14px",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>저장</button>
        </div>
      </div>

      <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:12}}>
        {/* Avatar + gender */}
        <div style={{background:"white",borderRadius:14,padding:"20px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,#64C8FF,#A78BFA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>
            {profileDraft.gender==="여"?"👧":"🧒"}
          </div>
          <div style={{display:"flex",gap:10}}>
            {["남","여"].map(g => (
              <button key={g} onClick={()=>set("gender",g)} style={{padding:"8px 28px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,border:profileDraft.gender===g?"none":"1.5px solid #E5E5EA",background:profileDraft.gender===g?"#1A1A2E":"white",color:profileDraft.gender===g?"white":"#8E8E93"}}>
                {g==="남"?"🧒 남아":"👧 여아"}
              </button>
            ))}
          </div>
        </div>

        {/* Basic info */}
        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,marginBottom:14}}>기본 정보</div>
          {[
            {label:"이름",key:"name",ph:"이름"},
            {label:"생년월일",key:"birth",type:"date"},
            {label:"혈액형",key:"bloodType",ph:"A+, B-, O+ 등"},
          ].map((f,i) => (
            <div key={f.key} style={{display:"flex",alignItems:"center",gap:12,paddingTop:i>0?12:0,marginTop:i>0?12:0,borderTop:i>0?"1px solid #F2F2F7":"none"}}>
              <span style={{fontSize:12,color:"#8E8E93",width:64,flexShrink:0}}>{f.label}</span>
              <Field value={profileDraft[f.key]||""} onChange={v=>set(f.key,v)} type={f.type||"text"} placeholder={f.ph||""}/>
            </div>
          ))}
        </div>

        {/* Measurements */}
        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,marginBottom:4}}>신체 측정</div>
          <div style={{fontSize:11,color:"#C7C7CC",marginBottom:14}}>수정하면 오늘 날짜로 성장 기록에 자동 추가돼요</div>
          <div style={{display:"flex",gap:16}}>
            {[
              {label:"키",key:"height",logKey:"heightLog",unit:"cm",ph:"110",step:"1"},
              {label:"몸무게",key:"weight",logKey:"weightLog",unit:"kg",ph:"18.5",step:"0.1"},
            ].map((f,i) => (
              <div key={f.key} style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                <span style={{fontSize:11,color:"#8E8E93"}}>{f.label}</span>
                <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <input type="number" value={profileDraft[f.key]||""} placeholder={f.ph} step={f.step}
                    onChange={e=>updateMeasurement(f.key,f.logKey,e.target.value)}
                    style={{flex:1,border:"none",borderBottom:"1.5px solid #E5E5EA",padding:"6px 0",fontSize:22,fontWeight:800,outline:"none",color:"#1C1C1E",background:"transparent",width:0}}/>
                  <span style={{fontSize:13,color:"#8E8E93",fontWeight:600}}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allergy */}
        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,marginBottom:14}}>⚠️ 알레르기</div>
          <input type="text" value={profileDraft.allergy||""} placeholder="페니실린 계열 항생제, 특정 음식 등 (없으면 비워두세요)"
            onChange={e=>set("allergy",e.target.value)}
            style={{width:"100%",border:"none",borderBottom:"1.5px solid #E5E5EA",padding:"6px 0",fontSize:14,fontWeight:600,outline:"none",color:"#1C1C1E",background:"transparent"}}/>
        </div>

        {/* Growth logs */}
        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,marginBottom:16}}>📊 성장 기록</div>
          {[
            {label:"📏 키 (cm)",logKey:"heightLog",unit:"cm",color:"#3B82F6",step:"1"},
            {label:"⚖️ 몸무게 (kg)",logKey:"weightLog",unit:"kg",color:"#10B981",step:"0.1"},
          ].map((col,ci) => (
            <div key={col.logKey} style={{marginBottom:ci===0?16:0}}>
              <div style={{fontSize:12,fontWeight:700,color:col.color,marginBottom:8}}>{col.label}</div>
              {(profileDraft[col.logKey]||[]).map((log,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <input type="month" value={log.date.slice(0,7)} onChange={e=>updateLog(col.logKey,i,"date",e.target.value)}
                    style={{flex:1,border:"1px solid #E5E5EA",borderRadius:8,padding:"8px 10px",fontSize:13,outline:"none"}}/>
                  <input type="number" value={log.value} step={col.step} onChange={e=>updateLog(col.logKey,i,"value",e.target.value)}
                    style={{width:64,border:"1px solid #E5E5EA",borderRadius:8,padding:"8px 6px",fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/>
                  <span style={{fontSize:12,color:"#8E8E93"}}>{col.unit}</span>
                  <button onClick={()=>removeLog(col.logKey,i)}
                    style={{background:"#FFE5E5",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,color:"#EF4444",flexShrink:0}}>×</button>
                </div>
              ))}
              <button onClick={()=>addLog(col.logKey)}
                style={{width:"100%",border:`1.5px dashed ${col.color}`,borderRadius:8,padding:"8px",fontSize:13,color:col.color,background:"transparent",cursor:"pointer",fontWeight:600}}>
                + {col.label.split(" ")[1]} 기록 추가
              </button>
              {ci===0 && <div style={{height:1,background:"#F2F2F7",margin:"16px 0"}}/>}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,marginBottom:14}}>📋 특이사항 / 주의</div>
          <textarea value={profileDraft.notes||""} placeholder="편식이 심함, 약 먹이기 힘듦, 주의사항 등"
            onChange={e=>set("notes",e.target.value)}
            style={{width:"100%",minHeight:80,border:"1px solid #E5E5EA",borderRadius:10,padding:"10px 12px",fontSize:13,lineHeight:1.7,resize:"none",outline:"none",color:"#1C1C1E",background:"#FAFAFA",fontFamily:"'Apple SD Gothic Neo',sans-serif"}}/>
        </div>

        <button onClick={handleSave} style={{background:"#1A1A2E",border:"none",borderRadius:14,padding:"16px",color:"white",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4,boxShadow:"0 4px 14px rgba(0,0,0,0.15)"}}>저장하기</button>
      </div>
    </div>
  );
}
