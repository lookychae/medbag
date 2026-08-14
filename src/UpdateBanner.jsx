import { GRADIENTS } from "./theme";

export default function UpdateBanner({ onUpdate, onClose }) {
  return (
    <div style={{
      position:"fixed", left:"50%", bottom:"calc(env(safe-area-inset-bottom) + 90px)",
      transform:"translateX(-50%)", zIndex:9999, width:"calc(100% - 28px)", maxWidth:460,
      background:GRADIENTS.header,
      borderRadius:14, padding:"12px 14px",
      boxShadow:"0 10px 30px rgba(0,0,0,0.25)",
      display:"flex", alignItems:"center", gap:10,
      border:"1px solid rgba(255,255,255,0.12)",
    }}>
      <span style={{fontSize:22}}>🚀</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:"white",fontSize:13,fontWeight:700}}>새 버전이 있어요</div>
        <div style={{color:"rgba(255,255,255,0.55)",fontSize:11,marginTop:2}}>새로고침해서 최신 기능을 사용해보세요</div>
      </div>
      <button onClick={onUpdate} style={{
        background:GRADIENTS.primary, border:"none",
        borderRadius:10, padding:"8px 14px", color:"white", fontSize:12, fontWeight:700,
        cursor:"pointer", flexShrink:0,
      }}>새로고침</button>
      <button onClick={onClose} aria-label="닫기" style={{
        background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"50%",
        width:24, height:24, color:"rgba(255,255,255,0.6)", fontSize:14, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, padding:0,
      }}>✕</button>
    </div>
  );
}
