import { useState } from "react";
import { SUPPLEMENT_CAT_COLOR, SUPPLEMENT_STATUS } from "./constants";
import { COLORS, SAFE_TOP } from "./theme";

// 카테고리별 복용 중 영양제 비율을 SVG 도넛으로 시각화.
// 라이브러리 없이 stroke-dasharray 트릭으로 원형 차트 그림.
function NutrientChart({ supplements }) {
  const active = supplements.filter(s => s.status === "복용중");
  const byCat = active.reduce((acc, s) => {
    const c = s.category || "기타";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(byCat).sort((a,b) => b[1]-a[1]);
  const total = active.length;

  if (total === 0) {
    return (
      <div style={{margin:"14px 18px 0",background:"white",borderRadius:14,padding:"24px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",textAlign:"center",color:COLORS.textSecondary,fontSize:13}}>
        복용 중인 영양제가 없어요
      </div>
    );
  }

  const size = 140, radius = 50, sw = 22;
  const C = 2 * Math.PI * radius;
  // 각 아크 그리기에 필요한 누적 offset/길이를 한 번에 계산.
  const arcs = entries.reduce((list, [cat, count]) => {
    const len = (count / total) * C;
    const prev = list[list.length - 1];
    const offset = prev ? prev.offset + prev.len : 0;
    list.push({ cat, count, len, offset });
    return list;
  }, []);

  return (
    <div style={{margin:"14px 18px 0",background:"white",borderRadius:14,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:800,color:COLORS.textPrimary}}>📊 영양소 분포</div>
        <div style={{fontSize:11,color:COLORS.textSecondary}}>복용 중 {total}종 기준</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:18}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={COLORS.bg} strokeWidth={sw}/>
          {arcs.map(({ cat, len, offset }) => (
            <circle key={cat}
              cx={size/2} cy={size/2} r={radius}
              fill="none"
              stroke={SUPPLEMENT_CAT_COLOR[cat] || "#9CA3AF"}
              strokeWidth={sw}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              strokeLinecap="butt"
            />
          ))}
          <text x={size/2} y={size/2 - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill={COLORS.textPrimary}>{total}</text>
          <text x={size/2} y={size/2 + 15} textAnchor="middle" fontSize="10" fill={COLORS.textSecondary}>종</text>
        </svg>
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:6}}>
          {entries.map(([cat, count]) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={cat} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:3,background:SUPPLEMENT_CAT_COLOR[cat] || "#9CA3AF",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0,fontSize:12,fontWeight:600,color:COLORS.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat}</div>
                <div style={{fontSize:11,color:COLORS.textSecondary,fontWeight:600,flexShrink:0}}>{count}종 · {pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const EMPTY_SUPPLEMENT = {
  category:"기초 미네랄/비타민", name:"", role:"",
  status:"복용중", dosage:"", startDate:new Date().toISOString().slice(0,7), endDate:"", note:"",
};

function EditModal({ initial, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const set = (k,v) => setForm(p => ({...p, [k]:v}));
  const isNew = !initial.id;

  const handleSave = () => {
    if (!form.name.trim()) { alert("제품명을 입력해주세요"); return; }
    onSave({...form, id: form.id || Date.now()});
  };

  return (
    <div onClick={onCancel} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:500,maxHeight:"calc(100svh - 40px)",overflowY:"auto",padding:"22px 22px calc(env(safe-area-inset-bottom) + 28px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:17,fontWeight:800,color:"#1C1C1E"}}>{isNew?"영양제 추가":"영양제 수정"}</div>
          <button onClick={onCancel} style={{background:"#F2F2F7",border:"none",borderRadius:"50%",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
        </div>

        {[
          {label:"카테고리", key:"category", type:"select", opts:Object.keys(SUPPLEMENT_CAT_COLOR)},
          {label:"제품명 *", key:"name", ph:"프라이멀 뉴트라"},
          {label:"역할/성분", key:"role", ph:"종합 비타민 및 미네랄"},
          {label:"급여량", key:"dosage", ph:"2알 / 15ml / 적정량"},
          {label:"상태", key:"status", type:"select", opts:SUPPLEMENT_STATUS},
          {label:"시작일", key:"startDate", ph:"2026-01"},
          {label:"종료일", key:"endDate", ph:"(복용중이면 비워두기)"},
        ].map(f => (
          <div key={f.key} style={{marginBottom:10}}>
            <div style={{fontSize:11,color:"#8E8E93",fontWeight:600,marginBottom:4}}>{f.label}</div>
            {f.type === "select" ? (
              <select value={form[f.key]} onChange={e=>set(f.key,e.target.value)}
                style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E5E5EA",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",background:"white",color:"#1C1C1E"}}>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type="text" value={form[f.key]||""} placeholder={f.ph}
                onChange={e=>set(f.key,e.target.value)}
                style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E5E5EA",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",color:"#1C1C1E"}}/>
            )}
          </div>
        ))}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#8E8E93",fontWeight:600,marginBottom:4}}>메모 (관찰 포인트, 주의사항)</div>
          <textarea value={form.note||""} placeholder="아이 반응, 약사 조언, 관찰 메모"
            onChange={e=>set("note",e.target.value)}
            style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E5E5EA",borderRadius:10,padding:"10px 12px",fontSize:13,minHeight:70,resize:"none",outline:"none",lineHeight:1.6,fontFamily:"inherit",color:"#1C1C1E"}}/>
        </div>

        <div style={{display:"flex",gap:8}}>
          {!isNew && (
            <button onClick={()=>{if(confirm("이 영양제를 삭제할까요?"))onDelete(form.id);}}
              style={{flex:1,background:"#FFE5E5",border:"none",borderRadius:12,padding:"13px",color:"#EF4444",fontSize:14,fontWeight:700,cursor:"pointer"}}>삭제</button>
          )}
          <button onClick={handleSave}
            style={{flex:2,background:COLORS.navy,border:"none",borderRadius:12,padding:"13px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>저장</button>
        </div>
      </div>
    </div>
  );
}

function NotesEditor({ notes, onSave, onCancel }) {
  const [list, setList] = useState(notes);
  const update = (i,v) => setList(p => p.map((n,j)=>j===i?v:n));
  const add = () => setList(p => [...p, ""]);
  const remove = (i) => setList(p => p.filter((_,j)=>j!==i));

  return (
    <div onClick={onCancel} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:500,maxHeight:"calc(100svh - 40px)",overflowY:"auto",padding:"22px 22px calc(env(safe-area-inset-bottom) + 28px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:17,fontWeight:800,color:"#1C1C1E"}}>약사 노트 편집</div>
          <button onClick={onCancel} style={{background:"#F2F2F7",border:"none",borderRadius:"50%",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
        </div>
        {list.map((n,i) => (
          <div key={i} style={{display:"flex",gap:6,marginBottom:8,alignItems:"flex-start"}}>
            <textarea value={n} placeholder="복약 지도 내용" onChange={e=>update(i,e.target.value)}
              style={{flex:1,boxSizing:"border-box",border:"1.5px solid #E5E5EA",borderRadius:10,padding:"10px 12px",fontSize:13,minHeight:60,resize:"none",outline:"none",lineHeight:1.6,fontFamily:"inherit",color:"#1C1C1E"}}/>
            <button onClick={()=>remove(i)} style={{background:"#FFE5E5",border:"none",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:16,color:"#EF4444",flexShrink:0}}>×</button>
          </div>
        ))}
        <button onClick={add} style={{width:"100%",background:"transparent",border:"1.5px dashed #C7C7CC",borderRadius:10,padding:"10px",color:"#8E8E93",fontSize:13,fontWeight:600,cursor:"pointer",marginTop:4,marginBottom:14}}>+ 노트 추가</button>
        <button onClick={()=>onSave(list.filter(n=>n.trim()))}
          style={{width:"100%",background:COLORS.navy,border:"none",borderRadius:12,padding:"13px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>저장</button>
      </div>
    </div>
  );
}

export default function SupplementsScreen({ supplements, saveSupplements, pharmacistNotes, savePharmacistNotes }) {
  const [editing, setEditing] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);

  const handleSave = (item) => {
    const exists = supplements.some(s => s.id === item.id);
    const next = exists
      ? supplements.map(s => s.id === item.id ? item : s)
      : [...supplements, item];
    saveSupplements(next);
    setEditing(null);
  };

  const handleDelete = (id) => {
    saveSupplements(supplements.filter(s => s.id !== id));
    setEditing(null);
  };

  const grouped = supplements.reduce((acc, s) => {
    const cat = s.category || "기타";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div style={{paddingBottom:110}}>
      <div style={{background:COLORS.navy,padding:`${SAFE_TOP(16)} 22px 22px`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:"rgba(132,204,22,0.08)",pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,position:"relative"}}>
          <div>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:14,marginBottom:3}}>영양제 관리 🥗</div>
            <div style={{color:"white",fontSize:17,fontWeight:700,letterSpacing:-0.3}}>
              총 {supplements.length}종
            </div>
          </div>
          <button onClick={()=>setEditing({...EMPTY_SUPPLEMENT})}
            style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:20,padding:"7px 14px",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0}}>+ 추가</button>
        </div>
      </div>

      {/* 영양소 분포 차트 */}
      <NutrientChart supplements={supplements}/>

      {/* 약사 노트 */}
      <div style={{padding:"14px 18px 0"}}>
        <div style={{background:"linear-gradient(135deg,#FFFBEB,#FEF3C7)",border:"1px solid #FDE68A",borderRadius:14,padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:800,color:"#92400E"}}>💊 약사 복약 지도</div>
            <button onClick={()=>setEditingNotes(true)} style={{background:"rgba(146,64,14,0.12)",border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:"#92400E",cursor:"pointer"}}>편집</button>
          </div>
          {pharmacistNotes.length === 0 ? (
            <div style={{fontSize:12,color:"#92400E",opacity:0.7,padding:"4px 0"}}>약사 노트가 비어있습니다. 편집을 눌러 추가하세요.</div>
          ) : (
            pharmacistNotes.map((n,i) => (
              <div key={i} style={{fontSize:12.5,color:"#78350F",lineHeight:1.6,padding:"4px 0",display:"flex",gap:6}}>
                <span style={{flexShrink:0,fontWeight:800}}>{i+1}.</span>
                <span>{n}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 카테고리별 목록 */}
      <div style={{padding:"4px 18px 0"}}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#8E8E93"}}>
            <div style={{fontSize:48,marginBottom:10,opacity:0.5}}>🥗</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>등록된 영양제가 없어요</div>
            <div style={{fontSize:12,color:"#C7C7CC"}}>+ 추가 버튼으로 첫 영양제를 등록해보세요</div>
          </div>
        ) : Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"16px 2px 8px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:SUPPLEMENT_CAT_COLOR[cat]||"#9CA3AF"}}/>
              <span style={{fontSize:13,fontWeight:700,color:"#8E8E93",letterSpacing:0.5}}>{cat}</span>
              <span style={{fontSize:11,color:"#C7C7CC"}}>· {items.length}종</span>
            </div>
            {items.map(s => {
              const color = SUPPLEMENT_CAT_COLOR[s.category] || "#9CA3AF";
              const inactive = s.status !== "복용중";
              return (
                <div key={s.id} onClick={()=>setEditing(s)}
                  style={{background:"white",borderRadius:14,marginBottom:8,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",borderLeft:`3px solid ${color}`,cursor:"pointer",opacity:inactive?0.55:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:15,fontWeight:700,color:"#1C1C1E"}}>{s.name}</span>
                        {inactive && <span style={{fontSize:10,color:"#8E8E93",background:"#F2F2F7",borderRadius:5,padding:"2px 6px",fontWeight:700}}>{s.status}</span>}
                      </div>
                      {s.role && <div style={{fontSize:12,color:"#8E8E93",lineHeight:1.4}}>{s.role}</div>}
                    </div>
                    <div style={{background:color+"15",borderRadius:8,padding:"4px 10px",flexShrink:0}}>
                      <span style={{fontSize:13,fontWeight:700,color}}>{s.dosage||"-"}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                    {s.startDate && (
                      <span style={{fontSize:11,color:"#555",background:"#F5F5F5",borderRadius:5,padding:"3px 8px",fontWeight:600}}>
                        📅 {s.startDate}{s.endDate?` ~ ${s.endDate}`:" ~ 진행 중"}
                      </span>
                    )}
                  </div>
                  {s.note && (
                    <div style={{marginTop:8,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"7px 10px",fontSize:11.5,color:"#92400E",lineHeight:1.5}}>
                      📝 {s.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {editing && (
        <EditModal initial={editing} onCancel={()=>setEditing(null)} onSave={handleSave} onDelete={handleDelete}/>
      )}
      {editingNotes && (
        <NotesEditor notes={pharmacistNotes} onCancel={()=>setEditingNotes(false)} onSave={(list)=>{savePharmacistNotes(list);setEditingNotes(false);}}/>
      )}
    </div>
  );
}
