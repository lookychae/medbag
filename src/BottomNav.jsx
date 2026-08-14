import { createPortal } from "react-dom";
import { COLORS } from "./theme";

const TABS_LEFT  = [
  {icon:"🏠",label:"홈",id:"home"},
  {icon:"💊",label:"약 정보",id:"meds"},
];
const TABS_RIGHT = [
  {icon:"🥗",label:"영양제",id:"supplements"},
  {icon:"🧒",label:"아이 정보",id:"child"},
];

export default function BottomNav({ screen, setScreen }) {
  const TabBtn = ({ tab }) => (
    <button onClick={() => setScreen(tab.id)} style={{
      background:"none", border:"none", cursor:"pointer",
      display:"flex", flexDirection:"column", alignItems:"center", gap:2,
      opacity: screen === tab.id ? 1 : 0.28, flex:1,
    }}>
      <span style={{fontSize:22}}>{tab.icon}</span>
      <span style={{fontSize:11,fontWeight:700,color:COLORS.textPrimary,letterSpacing:0.2}}>{tab.label}</span>
    </button>
  );

  // 외부 컨테이너는 화면 전체 가로 폭, 내부 정렬용 컨테이너에서 maxWidth 적용.
  // transform 대신 flex로 중앙 정렬 — iOS PWA의 transform+fixed 버그 회피.
  return createPortal(
    <div style={{
      position:"fixed", bottom:0, left:0, right:0,
      display:"flex", justifyContent:"center",
      pointerEvents:"none",
      zIndex:100,
    }}>
      <div style={{
        width:"100%", maxWidth:500,
        pointerEvents:"auto",
        background:"rgba(255,255,255,0.97)", backdropFilter:"blur(20px)",
        borderTop:"1px solid rgba(0,0,0,0.07)",
        display:"flex", justifyContent:"space-around", alignItems:"center",
        paddingTop:6, paddingBottom:8,
      }}>
        {TABS_LEFT.map(tab => <TabBtn key={tab.id} tab={tab} />)}
        <div style={{flex:1,display:"flex",justifyContent:"center",alignItems:"center",zIndex:101,position:"relative"}}>
          <button onClick={() => setScreen("scan")} style={{
            width:56, height:56, marginTop:-26,
            background:"linear-gradient(135deg,#1A1A2E,#4A4A8E)",
            border:"3px solid white", borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, cursor:"pointer",
            boxShadow:"0 4px 14px rgba(26,26,46,0.35)",
            zIndex:101, position:"relative",
          }}>📸</button>
        </div>
        {TABS_RIGHT.map(tab => <TabBtn key={tab.id} tab={tab} />)}
      </div>
    </div>,
    document.body
  );
}
