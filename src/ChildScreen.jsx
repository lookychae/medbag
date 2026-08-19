// 아이 정보 뷰 — 프로필·표준 용량·성장 로그·메모·계정.
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { GRADIENTS, SAFE_TOP } from "./theme";

export default function ChildScreen({ childProfile, setScreen, setProfileDraft, setShowGrowthChart }) {
  const cp = childProfile;
  const age = cp.birth ? Math.floor((new Date() - new Date(cp.birth)) / (365.25*24*3600*1000)) : 0;
  // 몸무게 있을 때만 표준 해열제 권장 용량 계산 (참고용).
  const doses = cp.weight ? {
    "타이레놀": `${(cp.weight*15).toFixed(0)}mg · ${(cp.weight*0.15).toFixed(1)}mL`,
    "이부프로펜": `${(cp.weight*10).toFixed(0)}mg · ${(cp.weight*0.5).toFixed(1)}mL`,
  } : null;

  return (
    <div style={{paddingBottom:110}}>
      <div style={{background:GRADIENTS.header,padding:`${SAFE_TOP(16)} 22px 24px`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.03)",zIndex:0}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:64,height:64,borderRadius:20,background:GRADIENTS.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,flexShrink:0}}>
              {cp.gender==="여"?"👧":"🧒"}
            </div>
            <div>
              <div style={{color:"white",fontSize:20,fontWeight:800,letterSpacing:-0.5}}>{cp.name}</div>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginTop:3}}>만 {age}세 · {cp.gender}아 · {cp.bloodType}</div>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:2}}>{cp.birth}</div>
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
              <div style={{color:"white",fontSize:i===2?12:15,fontWeight:700,lineHeight:1.2}}>{s.value}</div>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:10}}>
        {doses && (
          <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
              <span style={{fontSize:16}}>💡</span>
              <span style={{fontSize:13,fontWeight:700,color:"#1C1C1E"}}>표준 해열제 권장 용량</span>
              <span style={{fontSize:12,color:"#8E8E93",marginLeft:"auto"}}>{cp.weight}kg 기준</span>
            </div>
            <div style={{fontSize:12,color:"#FF9500",background:"#FFF9F0",borderRadius:8,padding:"8px 10px",marginBottom:10,lineHeight:1.6}}>
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

        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:"#1C1C1E"}}>📊 성장 기록</div>
            <button onClick={()=>setShowGrowthChart(true)} style={{background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",border:"none",borderRadius:20,padding:"5px 13px",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              그래프 보기
            </button>
          </div>
          <div style={{display:"flex",gap:0}}>
            {[
              {label:"키 (cm)",color:"#3B82F6",logs:cp.heightLog,icon:"📏"},
              {label:"몸무게 (kg)",color:"#10B981",logs:cp.weightLog,icon:"⚖️"},
            ].map((col,ci) => (
              <div key={ci} style={{flex:1,borderLeft:ci===1?"1px solid #F2F2F7":"none",paddingLeft:ci===1?7:0,paddingRight:ci===0?7:0}}>
                <div style={{fontSize:12,fontWeight:700,color:col.color,marginBottom:10,display:"flex",alignItems:"center",gap:4}}>
                  <span>{col.icon}</span>{col.label}
                </div>
                {(col.logs||[]).length===0 && (
                  <div style={{fontSize:12,color:"#C7C7CC",paddingTop:4}}>기록 없음</div>
                )}
                {(col.logs||[]).map((log,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:20,padding:"7px 0",borderTop:i>0?"1px solid #F7F7F7":"none"}}>
                    <span style={{fontSize:11,color:"#AEAEB2"}}>{log.date.slice(0,7).replace("-",".")}</span>
                    <span style={{fontSize:14,fontWeight:700,color:"#1C1C1E"}}>{log.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <span style={{fontSize:14}}>📋</span>
            <span style={{fontSize:13,fontWeight:700,color:"#1C1C1E"}}>특이사항 / 주의</span>
          </div>
          <div style={{fontSize:13,color:cp.notes?"#3C3C3C":"#C7C7CC",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{cp.notes||"특이사항 없음"}</div>
        </div>

        <div style={{background:"white",borderRadius:14,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <span style={{fontSize:14}}>👤</span>
            <span style={{fontSize:13,fontWeight:700,color:"#1C1C1E"}}>계정</span>
          </div>
          <div style={{fontSize:12,color:"#8E8E93",marginBottom:10,wordBreak:"break-all"}}>
            {auth.currentUser?.email || "로그인 정보 없음"}
          </div>
          <button onClick={()=>{
            if (confirm("로그아웃할까요?\n\n다시 로그인해야 데이터를 볼 수 있어요.")) {
              signOut(auth).catch(console.log);
            }
          }} style={{width:"100%",background:"#F2F2F7",border:"none",borderRadius:10,padding:"10px",color:"#EF4444",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
