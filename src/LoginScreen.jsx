import { useState, useEffect, useRef } from "react";
import { signInWithCredential, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { COLORS, GRADIENTS, SAFE_TOP } from "./theme";

// iOS PWA에서 popup·redirect가 다 실패해서, Google Identity Services(GIS)로
// ID 토큰만 받아 Firebase에 넘긴다. GIS 버튼은 iOS PWA에서도 정상 동작.
const GOOGLE_CLIENT_ID = "804247502285-g4vk02qovqilkov1ehvr1kaifdqqqsec.apps.googleusercontent.com";

export default function LoginScreen() {
  const [error, setError] = useState("");
  const [gisReady, setGisReady] = useState(false);
  const btnRef = useRef(null);

  // GIS 스크립트가 로드될 때까지 폴링
  useEffect(() => {
    if (window.google?.accounts?.id) { setGisReady(true); return; }
    const iv = setInterval(() => {
      if (window.google?.accounts?.id) { setGisReady(true); clearInterval(iv); }
    }, 100);
    return () => clearInterval(iv);
  }, []);

  // GIS 초기화 + 버튼 렌더
  useEffect(() => {
    if (!gisReady || !btnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (resp) => {
        try {
          const cred = GoogleAuthProvider.credential(resp.credential);
          await signInWithCredential(auth, cred);
        } catch (e) {
          setError(e.message || "로그인에 실패했어요");
        }
      },
      auto_select: false,
      ux_mode: "popup",
    });
    // 버튼 렌더는 브랜드 규정상 Google이 제공하는 스타일을 그대로 사용
    window.google.accounts.id.renderButton(btnRef.current, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
      width: 300,
    });
  }, [gisReady]);

  // GIS 실패 시 최후 수단 (거의 안 씀)
  const fallbackPopup = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { setError(e.message || "로그인 실패"); }
  };

  return (
    <div style={{
      minHeight:"100svh", background:COLORS.navy,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:`${SAFE_TOP(20)} 28px calc(env(safe-area-inset-bottom) + 40px)`,
      position:"relative", overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:-80,right:-80,width:240,height:240,borderRadius:"50%",background:"rgba(100,200,255,0.06)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-100,left:-100,width:280,height:280,borderRadius:"50%",background:"rgba(167,139,250,0.06)",pointerEvents:"none"}}/>

      <div style={{textAlign:"center",marginBottom:40,zIndex:1}}>
        <div style={{width:80,height:80,margin:"0 auto 16px",borderRadius:22,background:GRADIENTS.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,boxShadow:"0 8px 24px rgba(100,200,255,0.4)"}}>💊</div>
        <div style={{color:"white",fontSize:26,fontWeight:800,letterSpacing:-0.5,marginBottom:8}}>약봉지</div>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:14,lineHeight:1.5}}>
          우리 아이 처방전 · 영양제<br/>안심하고 관리하세요
        </div>
      </div>

      <div ref={btnRef} style={{zIndex:1, minHeight:44, display:"flex", justifyContent:"center"}}/>

      {!gisReady && (
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginTop:14,zIndex:1}}>로그인 준비 중...</div>
      )}

      {error && (
        <div style={{marginTop:16,padding:"10px 14px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,color:"#FCA5A5",fontSize:12,maxWidth:320,textAlign:"center",zIndex:1}}>
          {error}
          <div style={{marginTop:8}}>
            <button onClick={fallbackPopup} style={{background:"transparent",border:"1px solid rgba(252,165,165,0.5)",color:"#FCA5A5",padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer"}}>
              다른 방법으로 시도
            </button>
          </div>
        </div>
      )}

      <div style={{marginTop:24,color:"rgba(255,255,255,0.35)",fontSize:11,textAlign:"center",lineHeight:1.6,zIndex:1}}>
        로그인하면 개인 계정 안에 안전하게<br/>처방전과 영양제 정보가 저장돼요
      </div>
    </div>
  );
}
