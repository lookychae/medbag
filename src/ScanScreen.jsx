import { useState } from "react";
import { ACCENT_COLORS, CAT_COLOR, FORM_ICON } from "./constants";
import MedBadge from "./MedBadge";

const EMPTY_MED = { name:"", dosage:"", times:"하루 3회", days:3, category:"기타", form:"시럽", comment:"" };

function ManualForm({ onCancel, onSave }) {
  const [form, setForm] = useState({
    hospital:"", doctor:"", date:new Date().toISOString().slice(0,10),
    symptom:"", child:"", memo:"", medicines:[{...EMPTY_MED}],
  });

  const setField = (key, val) => setForm(p => ({...p, [key]:val}));
  const setMed = (mi, key, val) => setForm(p => {
    const meds = [...p.medicines];
    meds[mi] = {...meds[mi], [key]: val};
    return {...p, medicines:meds};
  });

  const handleSave = () => {
    if (!form.hospital) { alert("병원명을 입력해주세요"); return; }
    if (!form.medicines[0].name) { alert("약 이름을 입력해주세요"); return; }
    onSave({
      ...form, id:Date.now(),
      accent: ACCENT_COLORS[Math.floor(Math.random()*ACCENT_COLORS.length)],
      medicines: form.medicines.filter(m => m.name),
    });
  };

  const inp = (val, onChange, placeholder, type="text", extra={}) => (
    <input type={type} value={val} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",
        borderRadius:10,padding:"10px 12px",color:"white",fontSize:14,outline:"none",...extra}} />
  );

  return (
    <div style={{width:"100%",maxWidth:360,overflowY:"auto",maxHeight:"85vh"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:32,marginBottom:6}}>✏️</div>
        <div style={{color:"white",fontSize:17,fontWeight:700}}>처방전 직접 입력</div>
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:4}}>처방전 내용을 직접 입력해주세요</div>
      </div>

      {/* 기본 정보 */}
      <div style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:16,marginBottom:12,border:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,marginBottom:12,letterSpacing:0.8}}>기본 정보</div>
        {[
          {label:"병원명 *",key:"hospital",ph:"서울아동병원"},
          {label:"담당의사",key:"doctor",ph:"김이름 원장"},
          {label:"증상",key:"symptom",ph:"감기, 발열"},
          {label:"처방받은 아이",key:"child",ph:"이준서 (5세)"},
        ].map((f,i) => (
          <div key={f.key} style={{marginBottom:i<3?12:0}}>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:4}}>{f.label}</div>
            {inp(form[f.key], v=>setField(f.key,v), f.ph)}
          </div>
        ))}
        <div style={{marginTop:12}}>
          <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:4}}>처방일 *</div>
          {inp(form.date, v=>setField("date",v), "", "date")}
        </div>
      </div>

      {/* 처방 약물 */}
      <div style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:16,marginBottom:12,border:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,marginBottom:12,letterSpacing:0.8}}>처방 약물</div>
        {form.medicines.map((m, mi) => (
          <div key={mi} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:12,marginBottom:10,border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:700}}>약 {mi+1}</span>
              {form.medicines.length>1 && (
                <button onClick={()=>setForm(p=>({...p,medicines:p.medicines.filter((_,j)=>j!==mi)}))}
                  style={{background:"#EF444430",border:"none",borderRadius:6,padding:"3px 8px",color:"#EF4444",fontSize:12,cursor:"pointer"}}>삭제</button>
              )}
            </div>
            {[
              {label:"약 이름 *",key:"name",ph:"타이레놀현탁액"},
              {label:"1회 용량",key:"dosage",ph:"5mL, 1정, 1포"},
              {label:"복용 방법",key:"times",ph:"하루 3회"},
              {label:"복용 주의사항",key:"comment",ph:"식후 복용"},
            ].map(f => (
              <div key={f.key} style={{marginBottom:8}}>
                <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>{f.label}</div>
                {inp(m[f.key], v=>setMed(mi,f.key,v), f.ph, "text", {})}
              </div>
            ))}
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}>
                <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>복용 일수</div>
                <input type="number" value={m.days} min="1" max="30"
                  onChange={e=>setMed(mi,"days",parseInt(e.target.value)||1)}
                  style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none"}} />
              </div>
              {[
                {label:"제형",key:"form",opts:["시럽","분말","정제","캡슐","좌약","연고","흡입","점안","기타"]},
                {label:"분류",key:"category",opts:Object.keys(CAT_COLOR)},
              ].map(sel => (
                <div key={sel.key} style={{flex:1}}>
                  <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>{sel.label}</div>
                  <select value={m[sel.key]} onChange={e=>setMed(mi,sel.key,e.target.value)}
                    style={{width:"100%",background:"rgba(30,30,60,0.9)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none"}}>
                    {sel.opts.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={()=>setForm(p=>({...p,medicines:[...p.medicines,{...EMPTY_MED}]}))}
          style={{width:"100%",border:"1.5px dashed rgba(100,200,255,0.4)",borderRadius:10,padding:"10px",color:"rgba(100,200,255,0.7)",background:"transparent",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          + 약 추가
        </button>
      </div>

      <div style={{display:"flex",gap:10}}>
        <button onClick={onCancel} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"13px",color:"rgba(255,255,255,0.55)",fontSize:13,cursor:"pointer"}}>취소</button>
        <button onClick={handleSave} style={{flex:2,background:"#1A1A2E",border:"none",borderRadius:12,padding:"13px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>저장하기</button>
      </div>
    </div>
  );
}

export default function ScanScreen({ onCancel, onSave }) {
  const [step, setStep] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analyzeImage = async (file) => {
    setStep("analyzing");
    try {
      const base64 = await new Promise((res,rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch("/api/scan", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({imageBase64:base64, mediaType:file.type||"image/jpeg"}),
      });
      const parsed = await resp.json();
      if (!resp.ok || parsed.error) throw new Error(parsed.error||"분석 실패");
      setResult({
        ...parsed, id:Date.now(),
        date: parsed.date||new Date().toISOString().slice(0,10),
        accent: ACCENT_COLORS[Math.floor(Math.random()*ACCENT_COLORS.length)],
        medicines: (parsed.medicines||[]).map(m=>({...m,days:Number(m.days)||3})),
      });
      setStep("result");
    } catch(e) {
      setErrorMsg(e.message||"오류가 발생했어요");
      setStep("error");
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    analyzeImage(file);
  };

  const wrap = (children) => (
    <div style={{minHeight:"100vh",background:"#1A1A2E",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,position:"relative"}}>
      <button onClick={onCancel} style={{position:"absolute",top:52,left:18,background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:"7px 14px",color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer"}}>‹ 취소</button>
      {children}
    </div>
  );

  if (step === "manual") return wrap(<ManualForm onCancel={()=>setStep("idle")} onSave={onSave}/>);

  if (step === "analyzing") return wrap(
    <div style={{textAlign:"center",width:"100%"}}>
      {preview && <div style={{marginBottom:20,display:"flex",justifyContent:"center"}}><img src={preview} style={{width:140,height:100,objectFit:"cover",borderRadius:12,opacity:0.6}} alt="preview"/></div>}
      <div style={{fontSize:44,marginBottom:16,animation:"spin 2s linear infinite"}}>⌛️</div>
      <div style={{color:"white",fontSize:16,fontWeight:700,marginBottom:6}}>AI 분석 중...</div>
      <div style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>약봉지 내용을 읽고 있어요</div>
    </div>
  );

  if (step === "error") return wrap(
    <div style={{textAlign:"center",width:"100%",maxWidth:300}}>
      <div style={{fontSize:44,marginBottom:14}}>⚠️</div>
      <div style={{color:"white",fontSize:16,fontWeight:700,marginBottom:8}}>분석 실패</div>
      <div style={{color:"rgba(255,255,255,0.5)",fontSize:13,marginBottom:24,lineHeight:1.6}}>{errorMsg}</div>
      <button onClick={()=>{setStep("idle");setPreview(null);}} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"12px 28px",color:"white",fontSize:14,cursor:"pointer"}}>다시 시도</button>
    </div>
  );

  if (step === "result" && result) return wrap(
    <div style={{width:"100%",maxWidth:360,overflowY:"auto",maxHeight:"80vh"}}>
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:36,marginBottom:6}}>✅</div>
        <div style={{color:"white",fontSize:17,fontWeight:700}}>분석 완료!</div>
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:4}}>내용을 확인 후 저장해주세요</div>
      </div>
      <div style={{background:"rgba(255,255,255,0.05)",borderRadius:18,padding:"18px",marginBottom:14,border:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{fontSize:18,fontWeight:800,color:"white",marginBottom:2}}>{result.date?.replace(/-/g,".")}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:4}}>{result.hospital} {result.doctor&&`· ${result.doctor}`}</div>
        {result.symptom&&<div style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontWeight:600,marginBottom:14}}>🩺 {result.symptom}</div>}
        {result.medicines?.map((m,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderTop:i>0?"1px solid rgba(255,255,255,0.06)":"none"}}>
            <span style={{fontSize:13}}>{FORM_ICON[m.form]||"💊"}</span>
            <span style={{flex:1,fontSize:13,color:"rgba(255,255,255,0.85)",fontWeight:600}}>{m.name}</span>
            <MedBadge dosage={m.dosage} color={CAT_COLOR[m.category]||"#888"} form={m.form} small/>
            <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.08)",borderRadius:5,padding:"2px 6px"}}>{m.days}일</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>{setStep("idle");setPreview(null);setResult(null);}} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"13px",color:"rgba(255,255,255,0.55)",fontSize:13,cursor:"pointer"}}>다시 스캔</button>
        <button onClick={()=>onSave(result)} style={{flex:2,background:"#1A1A2E",border:"none",borderRadius:12,padding:"13px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>저장하기</button>
      </div>
    </div>
  );

  // IDLE
  return wrap(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
      <div onClick={()=>document.getElementById("med-file-input").click()}
        style={{width:240,height:170,border:"2px dashed rgba(100,200,255,0.4)",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:28,position:"relative",cursor:"pointer",background:"rgba(255,255,255,0.02)",textAlign:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <span style={{fontSize:48,lineHeight:1}}>📷</span>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:12,lineHeight:1.6}}>약봉지를 찍거나<br/>이미지를 선택하세요</span>
        </div>
        {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i)=>(
          <div key={i} style={{position:"absolute",[v]:-2,[h]:-2,width:18,height:18,
            borderTop:v==="top"?"2px solid #64C8FF":"none",borderBottom:v==="bottom"?"2px solid #64C8FF":"none",
            borderLeft:h==="left"?"2px solid #64C8FF":"none",borderRight:h==="right"?"2px solid #64C8FF":"none",
            borderRadius:v==="top"&&h==="left"?"6px 0 0 0":v==="top"&&h==="right"?"0 6px 0 0":v==="bottom"&&h==="left"?"0 0 0 6px":"0 0 6px 0"}}/>
        ))}
      </div>
      <input id="med-file-input" type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:280}}>
        <button onClick={()=>document.getElementById("med-file-input").click()}
          style={{background:"linear-gradient(135deg,#64C8FF,#A78BFA)",border:"none",borderRadius:14,padding:"15px",color:"white",fontSize:15,fontWeight:700,cursor:"pointer"}}>
          📸 촬영 / 이미지 선택
        </button>
        <button onClick={()=>setStep("manual")}
          style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"15px",color:"rgba(255,255,255,0.7)",fontSize:15,fontWeight:700,cursor:"pointer"}}>
          ✏️ 직접 입력하기
        </button>
      </div>
      <div style={{color:"rgba(255,255,255,0.2)",fontSize:11,marginTop:10,textAlign:"center"}}>
        AI가 약봉지 내용을 자동으로 인식해요
      </div>
      <div style={{marginTop:16,width:"100%",maxWidth:280,background:"rgba(100,200,255,0.06)",border:"1px solid rgba(100,200,255,0.2)",borderRadius:12,padding:"11px 14px",textAlign:"center"}}>
        <div style={{fontSize:12,color:"rgba(100,200,255,0.9)",fontWeight:700,marginBottom:3}}>
          💡 크레딧 없이도 사용할 수 있어요
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.6}}>
          크레딧 없을 시 <b style={{color:"rgba(255,255,255,0.5)"}}>✏️ 직접 입력하기</b>를 이용해주세요
        </div>
      </div>
    </div>
  );
}
