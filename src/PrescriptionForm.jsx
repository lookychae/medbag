// 처방전 등록·수정 공용 폼.
// ScanScreen(신규 등록) · EditPrescriptionScreen(수정) 양쪽에서 사용.
// 부모 컴포넌트는 header 표시·저장 후처리(id/accent)만 담당.
import { useState, useEffect } from "react";
import { CAT_COLOR, EMPTY_MED, DOSAGE_UNITS } from "./constants";
import { COLORS, GRADIENTS, SAFE_TOP, DARK_INPUT } from "./theme";
import HospitalInput from "./HospitalInput";

const FORM_OPTS = ["시럽","분말","정제","캡슐","좌약","연고","흡입","점안","기타"];

export default function PrescriptionForm({
  title = "처방전 입력",
  subtitle = "",
  icon = "✏️",
  initialForm,
  onCancel,
  onSave,
  prescriptions = [],
}) {
  const [form, setForm] = useState(() => initialForm || {
    hospital:"", doctor:"", date:new Date().toISOString().slice(0,10),
    symptom:"", child:"", memo:"", medicines:[{...EMPTY_MED}],
  });

  // iOS PWA에서 body가 스크롤 튐 · 안전영역 뒤 배경 비침 방지.
  useEffect(() => {
    const y = window.scrollY;
    const prevBg = document.body.style.background;
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.body.style.background = COLORS.navy;
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.style.background = prevBg;
      window.scrollTo(0, y);
    };
  }, []);

  const setField = (key, val) => setForm(p => ({...p, [key]:val}));
  const setMed = (mi, key, val) => setForm(p => {
    const meds = [...p.medicines];
    meds[mi] = {...meds[mi], [key]: val};
    return {...p, medicines:meds};
  });

  const handleSave = () => {
    if (!form.hospital) { alert("병원명을 입력해주세요"); return; }
    if (!form.medicines[0]?.name) { alert("약 이름을 입력해주세요"); return; }
    document.activeElement?.blur();
    // 저장 직전 dosageAmt+dosageUnit → dosage 합성. 부모는 id/accent만 붙이면 됨.
    onSave({
      ...form,
      medicines: form.medicines.filter(m => m.name).map(m => ({
        ...m,
        dosage: `${m.dosageAmt || ""}${m.dosageUnit || "mL"}`,
      })),
    });
  };

  const inp = (val, onChange, placeholder, type="text", extra={}) => (
    <input type={type} value={val ?? ""} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
      style={{...DARK_INPUT, fontSize:16, ...extra}} />
  );

  const cancel = () => { document.activeElement?.blur(); onCancel(); };

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,display:"flex",justifyContent:"center",background:COLORS.navy}}>
    <div style={{width:"100%",maxWidth:500,height:"100%",background:COLORS.navy,display:"flex",flexDirection:"column",overflowX:"hidden"}}>
      {/* 헤더 */}
      <div style={{flexShrink:0,padding:`${SAFE_TOP(18)} 18px 16px`,position:"relative"}}>
        <button onClick={cancel} style={{position:"absolute",top:SAFE_TOP(8),left:18,background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:10}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{textAlign:"center",marginTop:8}}>
          <div style={{fontSize:28,marginBottom:6}}>{icon}</div>
          <div style={{color:"white",fontSize:17,fontWeight:700}}>{title}</div>
          {subtitle && <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:4}}>{subtitle}</div>}
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
        {/* 기본 정보 */}
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:16,marginBottom:12,border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,marginBottom:12,letterSpacing:0.8}}>기본 정보</div>
          <div style={{marginBottom:12}}>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:4}}>병원명 *</div>
            <HospitalInput
              value={form.hospital}
              onChange={v => setField("hospital", v)}
              onDoctorAutofill={d => setForm(p => p.doctor ? p : ({...p, doctor: d}))}
              prescriptions={prescriptions}
            />
          </div>
          {[
            {label:"담당의사",key:"doctor",ph:"김이름 원장"},
            {label:"증상",key:"symptom",ph:"감기, 발열"},
          ].map(f => (
            <div key={f.key} style={{marginBottom:12}}>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:4}}>{f.label}</div>
              {inp(form[f.key], v=>setField(f.key,v), f.ph)}
            </div>
          ))}
          <div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:4}}>처방일 *</div>
            <input type="date" value={form.date||""} onChange={e=>setField("date",e.target.value)}
              style={{...DARK_INPUT, colorScheme:"dark", WebkitAppearance:"none", appearance:"none"}} />
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
                {label:"복용 방법",key:"times",ph:"하루 3회"},
                {label:"복용 주의사항",key:"comment",ph:"식후 복용"},
              ].map(f => (
                <div key={f.key} style={{marginBottom:8}}>
                  <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>{f.label}</div>
                  {inp(m[f.key], v=>setMed(mi,f.key,v), f.ph)}
                </div>
              ))}
              <div style={{marginBottom:8}}>
                <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>1회 용량</div>
                <div style={{display:"flex",gap:6,overflow:"hidden"}}>
                  <input type="number" value={m.dosageAmt ?? ""} placeholder="5" min="0" step="0.1"
                    onChange={e=>setMed(mi,"dosageAmt",e.target.value)}
                    style={{...DARK_INPUT, flex:"1 1 0", minWidth:0, fontSize:16}}/>
                  <select value={m.dosageUnit} onChange={e=>setMed(mi,"dosageUnit",e.target.value)}
                    style={{flex:"1 1 0",minWidth:0,boxSizing:"border-box",background:"rgba(30,30,60,0.9)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 12px",color:"white",fontSize:16,outline:"none"}}>
                    {DOSAGE_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>복용 일수</div>
                  <input type="number" value={m.days ?? ""} min="1" max="30"
                    onChange={e=>{
                      const v = e.target.value;
                      if (v === "") return setMed(mi,"days","");
                      const n = parseInt(v);
                      if (!isNaN(n)) setMed(mi,"days",n);
                    }}
                    onBlur={()=>{ if (m.days === "" || m.days == null || m.days < 1) setMed(mi,"days",1); }}
                    style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none"}} />
                </div>
                {[
                  {label:"제형", key:"form", opts:FORM_OPTS},
                  {label:"분류", key:"category", opts:Object.keys(CAT_COLOR)},
                ].map(sel => (
                  <div key={sel.key} style={{flex:1}}>
                    <div style={{color:"rgba(255,255,255,0.35)",fontSize:10,marginBottom:3}}>{sel.label}</div>
                    <select value={m[sel.key]} onChange={e=>setMed(mi,sel.key,e.target.value)}
                      style={{width:"100%",boxSizing:"border-box",background:"rgba(30,30,60,0.9)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",color:"white",fontSize:13,outline:"none"}}>
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
        <div style={{height:8}}/>
      </div>

      {/* 하단 버튼 */}
      <div style={{flexShrink:0,padding:"12px 18px 8px",background:COLORS.navy,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",gap:10}}>
          <button onClick={cancel} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px",color:"rgba(255,255,255,0.55)",fontSize:14,cursor:"pointer"}}>취소</button>
          <button onClick={handleSave} style={{flex:2,background:GRADIENTS.primary,border:"none",borderRadius:12,padding:"14px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>저장하기</button>
        </div>
      </div>
    </div>
    </div>
  );
}
