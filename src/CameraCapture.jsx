// 약봉지 촬영 카메라 UI.
// getUserMedia로 후면 카메라 열고, 가이드 박스 안 프레임을 실시간 분석해서
// 정렬(밝기·대비)·안정(히스토그램 변화) 두 조건이 맞으면 촬영 버튼 활성화.
import { useState, useEffect, useRef } from "react";
import { SAFE_TOP } from "./theme";

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const guideRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [aligned, setAligned] = useState(false);
  const [stable, setStable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setError(
          e.name === "NotAllowedError" ? "카메라 권한이 거부됐어요. 설정에서 권한을 허용해주세요." :
          e.name === "NotFoundError"   ? "카메라를 찾을 수 없어요." :
          "카메라를 열 수 없어요: " + (e.message || e.name)
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (detectorRef.current) clearInterval(detectorRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready || !videoRef.current || !guideRef.current) return;
    const video = videoRef.current;
    const sampleCanvas = document.createElement("canvas");
    const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    let prevHist = null;

    const tick = () => {
      if (!video.videoWidth) return;
      const gr = guideRef.current.getBoundingClientRect();
      const vr = video.getBoundingClientRect();
      const sx = (gr.left - vr.left) / vr.width  * video.videoWidth;
      const sy = (gr.top  - vr.top ) / vr.height * video.videoHeight;
      const sw = gr.width  / vr.width  * video.videoWidth;
      const sh = gr.height / vr.height * video.videoHeight;
      const SAMPLE = 64;
      sampleCanvas.width = SAMPLE; sampleCanvas.height = SAMPLE;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, SAMPLE, SAMPLE);
      const img = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
      let sum = 0, sum2 = 0, n = 0;
      const hist = new Array(8).fill(0);
      for (let i = 0; i < img.length; i += 4) {
        const Y = 0.299 * img[i] + 0.587 * img[i+1] + 0.114 * img[i+2];
        sum += Y; sum2 += Y * Y; n++;
        hist[Math.min(7, Math.floor(Y / 32))]++;
      }
      const mean = sum / n;
      const variance = sum2 / n - mean * mean;
      const stddev = Math.sqrt(Math.max(0, variance));
      const contentOk = mean > 60 && stddev > 22;
      setAligned(contentOk);
      if (prevHist) {
        let diff = 0;
        for (let i = 0; i < 8; i++) diff += Math.abs(hist[i] - prevHist[i]);
        const stableNow = diff / n < 0.08;
        setStable(stableNow);
      }
      prevHist = hist;
    };

    detectorRef.current = setInterval(tick, 350);
    return () => { if (detectorRef.current) clearInterval(detectorRef.current); };
  }, [ready]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      blob => { if (blob) onCapture(new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" })); },
      "image/jpeg",
      0.92,
    );
  };

  const canCapture = ready && aligned && stable;
  const guideColor = canCapture ? "#10B981" : aligned ? "#F59E0B" : "rgba(255,255,255,0.7)";
  const hint = error ? error
    : !ready ? "카메라 준비 중..."
    : !aligned ? "가이드 안에 약봉지 전체를 맞춰주세요"
    : !stable ? "흔들림 감지 — 폰을 잠시 고정해주세요"
    : "촬영 준비 완료!";

  return (
    <div style={{position:"fixed",inset:0,background:"black",zIndex:200,overflow:"hidden"}}>
      <video ref={videoRef} playsInline muted
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>

      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <div ref={guideRef} style={{
          position:"absolute",
          top:"18%", left:"6%", right:"6%", bottom:"30%",
          borderRadius:10,
          boxShadow:`0 0 0 9999px rgba(0,0,0,0.55)`,
          border:`3px solid ${guideColor}`,
          transition:"border-color 0.25s",
        }}>
          {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i) => (
            <div key={i} style={{
              position:"absolute", [v]:-3, [h]:-3, width:28, height:28,
              borderTop:    v==="top"    ? `5px solid ${guideColor}` : "none",
              borderBottom: v==="bottom" ? `5px solid ${guideColor}` : "none",
              borderLeft:   h==="left"   ? `5px solid ${guideColor}` : "none",
              borderRight:  h==="right"  ? `5px solid ${guideColor}` : "none",
              borderRadius: v==="top"&&h==="left"?"6px 0 0 0":v==="top"&&h==="right"?"0 6px 0 0":v==="bottom"&&h==="left"?"0 0 0 6px":"0 0 6px 0",
              transition:"border-color 0.25s",
            }}/>
          ))}
        </div>
      </div>

      <div style={{position:"absolute",top:0,left:0,right:0,padding:`${SAFE_TOP(8)} 16px 8px`,display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:10}}>
        <button onClick={onCancel}
          style={{background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"50%",width:40,height:40,color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        <div style={{color:"white",fontSize:14,fontWeight:600,textShadow:"0 1px 4px rgba(0,0,0,0.7)"}}>약봉지 스캔</div>
        <div style={{width:40}}/>
      </div>

      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:`16px 16px calc(env(safe-area-inset-bottom) + 24px)`,display:"flex",flexDirection:"column",alignItems:"center",gap:14,zIndex:10}}>
        <div style={{color:"white",fontSize:13,fontWeight:600,textAlign:"center",background:"rgba(0,0,0,0.55)",padding:"7px 16px",borderRadius:16,maxWidth:"90%"}}>
          {hint}
        </div>
        <button onClick={capture} disabled={!canCapture}
          aria-label="촬영" style={{
          width:74, height:74, borderRadius:"50%",
          background: canCapture ? "white" : "rgba(255,255,255,0.35)",
          border:`5px solid rgba(255,255,255,${canCapture?0.9:0.4})`,
          cursor: canCapture ? "pointer" : "not-allowed",
          boxShadow: canCapture ? "0 4px 18px rgba(0,0,0,0.5)" : "none",
          transition:"all 0.2s",
          padding:0,
        }}>
          <div style={{
            width:"100%",height:"100%",borderRadius:"50%",
            background: canCapture ? "white" : "transparent",
            border: canCapture ? "2px solid rgba(0,0,0,0.1)" : "none",
          }}/>
        </button>
      </div>
    </div>
  );
}
