import { useState } from "react";
import useFirestore from "./useFirestore";
import BottomNav from "./BottomNav";
import HomeScreen from "./HomeScreen";
import DetailScreen from "./DetailScreen";
import ScanScreen from "./ScanScreen";
import GrowthChart from "./GrowthChart";
import { ChildScreen, ChildEditScreen } from "./ChildScreens";
import { MedsScreen, HospitalsScreen } from "./TabScreens";

export default function MedBagApp() {
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [memoEditing, setMemoEditing] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null);
  const [showGrowthChart, setShowGrowthChart] = useState(false);

  const {
    loading, prescriptions, memos, childProfile,
    savePrescriptions, saveMemos, saveChildProfile,
  } = useFirestore();

  const handleScan = (rx) => {
    const updated = [rx, ...prescriptions];
    savePrescriptions(updated);
    setSelected(rx);
    setMemoEditing(false);
    setScreen("detail");
  };

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#1A1A2E",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:48,animation:"spin 1.5s linear infinite"}}>💊</div>
      <div style={{color:"rgba(255,255,255,0.5)",fontSize:14}}>약봉지 불러오는 중...</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const showNav = screen !== "scan" && screen !== "child-edit";

  return (
    <div style={{maxWidth:390,margin:"0 auto",minHeight:"100vh",background:"#F2F2F7",position:"relative",overflow:"hidden"}}>

      {screen === "scan" && (
        <ScanScreen onCancel={() => setScreen("home")} onSave={handleScan} />
      )}

      {screen === "home" && (
        <HomeScreen
          prescriptions={prescriptions} memos={memos}
          search={search} setSearch={setSearch}
          setScreen={setScreen} setSelected={setSelected} setMemoEditing={setMemoEditing}
        />
      )}

      {screen === "detail" && selected && (
        <DetailScreen
          selected={selected} memos={memos} saveMemos={saveMemos}
          memoEditing={memoEditing} setMemoEditing={setMemoEditing}
          setScreen={setScreen}
        />
      )}

      {screen === "meds" && <MedsScreen prescriptions={prescriptions} />}

      {screen === "hospitals" && (
        <HospitalsScreen
          prescriptions={prescriptions}
          setSelected={setSelected} setMemoEditing={setMemoEditing} setScreen={setScreen}
        />
      )}

      {screen === "child" && (
        <ChildScreen
          childProfile={childProfile}
          setScreen={setScreen} setProfileDraft={setProfileDraft}
          setShowGrowthChart={setShowGrowthChart}
        />
      )}

      {screen === "child-edit" && (
        <ChildEditScreen
          profileDraft={profileDraft} setProfileDraft={setProfileDraft}
          saveChildProfile={saveChildProfile} setScreen={setScreen}
        />
      )}

      {showNav && <BottomNav screen={screen} setScreen={setScreen} />}

      {showGrowthChart && (
        <GrowthChart childProfile={childProfile} onClose={() => setShowGrowthChart(false)} />
      )}

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        input::placeholder { color:rgba(255,255,255,0.35); }
      `}</style>
    </div>
  );
}
