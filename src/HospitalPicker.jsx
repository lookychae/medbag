// 등록 시작 시 뜨는 병원 선택 모달.
// 기존 처방전이 있으면 병원 리스트 → 하나 골라 자동채움, 없으면 "새로운 병원" 진입.
export default function HospitalPicker({ hospitals, onSelect, onSkip, onCancel }) {
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
