const TABS_LEFT  = [{icon:"🏠",label:"홈",id:"home"},{icon:"💊",label:"약 정보",id:"meds"}];
const TABS_RIGHT = [{icon:"🏥",label:"병원",id:"hospitals"},{icon:"🧒",label:"아이 정보",id:"child"}];

export default function BottomNav({ screen, setScreen }) {
  const TabBtn = ({ tab }) => (
    <button onClick={() => setScreen(tab.id)} style={{
      background:"none", border:"none", cursor:"pointer",
      display:"flex", flexDirection:"column", alignItems:"center", gap:2,
      opacity: screen === tab.id ? 1 : 0.28, flex:1,
    }}>
      <span style={{fontSize:22}}>{tab.icon}</span>
      <span style={{fontSize:11,fontWeight:700,color:"#1C1C1E",letterSpacing:0.2}}>{tab.label}</span>
    </button>
  );

  return (
    <div style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:390,
      background:"rgba(255,255,255,0.97)", backdropFilter:"blur(20px)",
      borderTop:"1px solid rgba(0,0,0,0.07)",
      display:"flex", justifyContent:"space-around", alignItems:"center",
      padding:"8px 0 28px", zIndex:100,
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
  );
}
