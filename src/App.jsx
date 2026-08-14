// 메디백 루트 컴포넌트.
//
// 라우팅: react-router 없이 `screen` state(string)로 단일 화면 분기.
//   가능한 값: home | scan | edit | detail | meds | supplements | child | child-edit
//   하단 네비는 home/meds/supplements/child에서만 노출 (showNav 참고).
//
// 자동 업데이트 알림:
//   __BUILD_VERSION__은 vite.config.js의 versionPlugin이 빌드 시 주입한 timestamp.
//   서버의 /version.json과 비교해서 다르면 UpdateBanner를 띄움.
//   체크 타이밍: 초기 + visibilitychange + 5분 간격.
//
// 데이터: useFirestore() 훅에서 한 번에 받아서 자식 화면에 전달.
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import useFirestore from "./useFirestore";
import BottomNav from "./BottomNav";
import HomeScreen from "./HomeScreen";
import DetailScreen from "./DetailScreen";
import ScanScreen from "./ScanScreen";
import GrowthChart from "./GrowthChart";
import { ChildScreen, ChildEditScreen } from "./ChildScreens";
import { MedsScreen } from "./TabScreens";
import EditPrescriptionScreen from "./EditPrescriptionScreen";
import SupplementsScreen from "./SupplementsScreen";
import UpdateBanner from "./UpdateBanner";
import LoginScreen from "./LoginScreen";
import { COLORS } from "./theme";

const CURRENT_VERSION = typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : "dev";

export default function MedBagApp() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = 확인중, null = 로그아웃, 객체 = 로그인
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [memoEditing, setMemoEditing] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null);
  const [showGrowthChart, setShowGrowthChart] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // 인증 상태 감지 — Firebase 자동 유지 (앱 재시작해도 로그인 상태 유지됨)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setAuthUser(u));
    return unsub;
  }, []);

  const {
    loading, prescriptions, memos, childProfile, supplements, pharmacistNotes,
    savePrescriptions, saveMemos, saveChildProfile, saveSupplements, savePharmacistNotes,
  } = useFirestore(authUser?.uid);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch("/version.json?t=" + Date.now(), { cache: "no-store" });
        if (!r.ok) return;
        const { version } = await r.json();
        if (version && version !== CURRENT_VERSION) setUpdateAvailable(true);
      } catch { /* offline or network glitch — ignore */ }
    };
    check();
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(check, 5 * 60 * 1000);
    return () => { document.removeEventListener("visibilitychange", onVisible); clearInterval(id); };
  }, []);

  const handleDelete = (id) => {
    savePrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const handleEdit = (rx) => {
    setEditTarget(rx);
    setScreen("edit");
  };

  const handleEditSave = (updated) => {
    savePrescriptions(prescriptions.map(p => p.id === updated.id ? updated : p));
    setScreen("home");
    setEditTarget(null);
  };

  const handleScan = (rx) => {
    const updated = [rx, ...prescriptions];
    savePrescriptions(updated);
    setSelected(rx);
    setMemoEditing(false);
    setScreen("detail");
  };

  // 인증 상태 확인 중 (초기 로딩)
  if (authUser === undefined) return (
    <div style={{minHeight:"100vh",background:COLORS.navy,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:48,animation:"spin 1.5s linear infinite"}}>💊</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // 로그아웃 상태 → 로그인 화면
  if (authUser === null) return <LoginScreen />;

  // 로그인 완료했지만 데이터 로딩 중
  if (loading) return (
    <div style={{minHeight:"100vh",background:COLORS.navy,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:48,animation:"spin 1.5s linear infinite"}}>💊</div>
      <div style={{color:"rgba(255,255,255,0.5)",fontSize:14}}>약봉지 불러오는 중...</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const showNav = screen !== "scan" && screen !== "child-edit" && screen !== "edit";

  return (
    <div style={{width:"100%",maxWidth:500,margin:"0 auto",minHeight:"100svh",background:COLORS.bg,position:"relative",overflow:"hidden"}}>

      {screen === "scan" && (
        <ScanScreen onCancel={() => setScreen("home")} onSave={handleScan} prescriptions={prescriptions} />
      )}

      {screen === "home" && (
        <HomeScreen
          prescriptions={prescriptions} memos={memos}
          search={search} setSearch={setSearch}
          setScreen={setScreen} setSelected={setSelected} setMemoEditing={setMemoEditing}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      {screen === "edit" && editTarget && (
        <EditPrescriptionScreen
          rx={editTarget}
          onCancel={() => { setScreen("home"); setEditTarget(null); }}
          onSave={handleEditSave}
        />
      )}

      {screen === "detail" && selected && (
        <DetailScreen
          selected={selected} memos={memos} saveMemos={saveMemos}
          memoEditing={memoEditing} setMemoEditing={setMemoEditing}
          setScreen={setScreen} onEdit={handleEdit}
        />
      )}

      {screen === "meds" && (
        <MedsScreen
          prescriptions={prescriptions}
          setSelected={setSelected} setMemoEditing={setMemoEditing} setScreen={setScreen}
        />
      )}

      {screen === "supplements" && (
        <SupplementsScreen
          supplements={supplements}
          saveSupplements={saveSupplements}
          pharmacistNotes={pharmacistNotes}
          savePharmacistNotes={savePharmacistNotes}
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

      {updateAvailable && <UpdateBanner onUpdate={() => window.location.reload()} onClose={() => setUpdateAvailable(false)} />}

      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        input::placeholder, textarea::placeholder { color:rgba(255,255,255,0.35); }
`}</style>
    </div>
  );
}
