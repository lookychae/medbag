import { useState, useRef } from "react";
import { FORM_ICON } from "./constants";
import { COLORS, GRADIENTS, SAFE_TOP } from "./theme";
import { catColor } from "./utils";

const RECENT_KEY = "medbag_recent_searches";
const MAX_RECENT = 8;
const loadRecent = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
};
const saveRecent = (list) => localStorage.setItem(RECENT_KEY, JSON.stringify(list));

const ACTION_W = 160; // 수정(80) + 삭제(80)

function SwipeableCard({ rx, memos, onDelete, onEdit, onClick }) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };
  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffsetX(Math.max(dx, -ACTION_W));
    else if (offsetX < 0) setOffsetX(Math.min(0, offsetX + dx));
  };
  const onTouchEnd = () => {
    setSwiping(false);
    setOffsetX(offsetX < -ACTION_W / 2 ? -ACTION_W : 0);
  };
  const handleClick = () => {
    if (offsetX < 0) { setOffsetX(0); return; }
    onClick();
  };

  return (
    <div style={{position:"relative",marginBottom:10,borderRadius:16,overflow:"hidden"}}>
      {/* 뒤에 있는 수정/삭제 버튼 */}
      <div style={{position:"absolute",top:0,right:0,bottom:0,width:ACTION_W,display:"flex",borderRadius:"0 16px 16px 0",overflow:"hidden"}}>
        <div style={{flex:1,background:"#3B82F6",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
          onClick={() => { setOffsetX(0); onEdit(rx); }}>
          <span style={{fontSize:20,marginBottom:2}}>✏️</span>
          <span style={{color:"white",fontSize:12,fontWeight:700}}>수정</span>
        </div>
        <div style={{flex:1,background:"#EF4444",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:"0 16px 16px 0"}}
          onClick={() => onDelete(rx.id)}>
          <span style={{fontSize:20,marginBottom:2}}>🗑️</span>
          <span style={{color:"white",fontSize:12,fontWeight:700}}>삭제</span>
        </div>
      </div>

      {/* 카드 */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
        style={{
          transform:`translateX(${offsetX}px)`,
          transition:swiping ? "none" : "transform 0.25s ease",
          background:"white",borderRadius:16,overflow:"hidden",
          boxShadow:"0 2px 10px rgba(0,0,0,0.07)",cursor:"pointer",
          borderLeft:`4px solid ${rx.accent}`,position:"relative",zIndex:1,
        }}
      >
        {/* Card header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:rx.accent+"18",borderRadius:8,padding:"3px 9px"}}>
              <span style={{fontSize:17,fontWeight:800,color:rx.accent}}>{rx.date.slice(5).replace("-","/")}</span>
            </div>
            <div style={{background:"#F2F2F7",borderRadius:6,padding:"2px 7px",fontSize:13,fontWeight:700,color:"#555"}}>
              총 {Math.max(...rx.medicines.map(m=>m.days))}일
            </div>
            <span style={{fontSize:13,color:"#8E8E93"}}>{rx.hospital}</span>
          </div>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        {/* Symptom */}
        <div style={{padding:"5px 14px 0",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:13,color:"#555",fontWeight:600}}>🩺 {rx.symptom}</span>
        </div>

        {/* Medicines — 컬럼 정렬 표 스타일 (약 | 용량 | 횟수 | 기간) */}
        <div style={{padding:"4px 14px 10px",paddingBottom:memos[rx.id]?8:12}}>
          <div style={{
            display:"grid",gridTemplateColumns:"1fr 62px 68px 36px",gap:8,
            padding:"8px 4px 6px",borderBottom:"1px solid #F2F2F7",
            fontSize:10,color:"#C7C7CC",fontWeight:800,letterSpacing:0.8,
          }}>
            <span>약</span>
            <span style={{textAlign:"center"}}>용량</span>
            <span style={{textAlign:"right"}}>횟수</span>
            <span style={{textAlign:"right"}}>기간</span>
          </div>
          {rx.medicines.map((m,i) => {
            const c = catColor(m);
            return (
              <div key={i} style={{
                display:"grid",gridTemplateColumns:"1fr 62px 68px 36px",gap:8,
                alignItems:"center",padding:"8px 4px",
                borderTop:i===0?"none":"1px solid #F7F7F7",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                  <span style={{fontSize:14,flexShrink:0}}>{FORM_ICON[m.form]||"💊"}</span>
                  <div style={{fontSize:13,fontWeight:700,color:"#1C1C1E",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                </div>
                <div style={{background:c+"1F",color:c,padding:"3px 6px",borderRadius:6,fontSize:11,fontWeight:800,textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.dosage}</div>
                <div style={{fontSize:11,fontWeight:700,color:"#8E8E93",textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.times}</div>
                <div style={{fontSize:11,fontWeight:700,color:"#8E8E93",textAlign:"right",whiteSpace:"nowrap"}}>{m.days}일</div>
              </div>
            );
          })}
        </div>

        {/* Memo preview */}
        {memos[rx.id] && (
          <div style={{margin:"0 14px 12px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"flex-start",gap:6}}>
            <span style={{fontSize:13,flexShrink:0,marginTop:1}}>📝</span>
            <span style={{fontSize:12,color:"#92400E",lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
              {memos[rx.id]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeScreen({ prescriptions, memos, search, setSearch, setScreen, setSelected, setMemoEditing, onDelete, onEdit }) {
  const [recents, setRecents] = useState(loadRecent);

  const commitRecent = (kw) => {
    const k = kw.trim();
    if (!k) return;
    const next = [k, ...recents.filter(r => r !== k)].slice(0, MAX_RECENT);
    setRecents(next);
    saveRecent(next);
  };

  const removeRecent = (kw) => {
    const next = recents.filter(r => r !== kw);
    setRecents(next);
    saveRecent(next);
  };

  const onSearchBlur = () => commitRecent(search);
  const onSearchKeyDown = (e) => { if (e.key === "Enter") { commitRecent(search); e.target.blur(); } };

  const filtered = prescriptions.filter(p =>
    !search || p.hospital.includes(search) || p.symptom.includes(search) ||
    p.medicines.some(m => m.name.includes(search))
  );

  const grouped = filtered.reduce((acc, p) => {
    const k = p.date.slice(0,7);
    if (!acc[k]) acc[k] = [];
    acc[k].push(p);
    return acc;
  }, {});

  const goDetail = (rx) => { setSelected(rx); setMemoEditing(false); setScreen("detail"); };

  return (
    <div style={{paddingBottom:110}}>
      {/* Header */}
      <div style={{background:COLORS.navy,padding:`${SAFE_TOP(16)} 22px 22px`,position:"relative"}}>
        <div style={{position:"absolute",top:-50,right:-50,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.03)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:10,right:20,width:90,height:90,borderRadius:"50%",background:"rgba(100,200,255,0.06)",pointerEvents:"none"}}/>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,background:GRADIENTS.primary,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>💊</div>
            <span style={{color:"white",fontSize:19,fontWeight:700,letterSpacing:-0.5}}>약봉지</span>
            <span style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>MedBag</span>
          </div>
          <button onClick={()=>setScreen("scan")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"7px 15px",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",position:"relative",zIndex:10}}>+ 등록</button>
        </div>

        <div style={{color:"rgba(255,255,255,0.6)",fontSize:15,marginBottom:4}}>안녕하세요! 👋</div>
        <div style={{color:"white",fontSize:18,fontWeight:700,letterSpacing:-0.5,marginBottom:18}}>
          처방전 {prescriptions.length}건을 보관하고 있어요
        </div>

        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>🔍</span>
          <input placeholder="약 이름, 증상, 병원명 검색" value={search}
            onChange={e=>setSearch(e.target.value)}
            onBlur={onSearchBlur} onKeyDown={onSearchKeyDown}
            style={{background:"transparent",border:"none",outline:"none",color:"white",fontSize:14,flex:1,minWidth:0}}/>
          {search && (
            <button onClick={() => setSearch("")} aria-label="검색어 지우기"
              style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,flexShrink:0}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {recents.length > 0 && (
          <div className="recent-scroll" style={{display:"flex",gap:6,marginTop:10,overflowX:"auto",paddingBottom:2,scrollbarWidth:"none",msOverflowStyle:"none"}}>
            <style>{`.recent-scroll::-webkit-scrollbar{display:none}`}</style>
            {recents.map(kw => (
              <div key={kw} style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,0.12)",borderRadius:14,paddingLeft:10,paddingRight:4,height:26,flexShrink:0}}>
                <button onClick={() => setSearch(kw)}
                  style={{background:"none",border:"none",color:"rgba(255,255,255,0.85)",fontSize:12,fontWeight:600,cursor:"pointer",padding:"0 6px 0 0",whiteSpace:"nowrap"}}>
                  {kw}
                </button>
                <button onClick={() => removeRecent(kw)} aria-label={`${kw} 삭제`}
                  style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,flexShrink:0}}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{padding:"0 18px"}}>
        {Object.keys(grouped).sort().reverse().map(month => (
          <div key={month}>
            <div style={{fontSize:13,fontWeight:700,color:"#8E8E93",letterSpacing:0.8,padding:"14px 2px 10px"}}>
              {month.replace("-","년 ")}월
            </div>
            {grouped[month].map(rx => (
              <SwipeableCard
                key={rx.id}
                rx={rx}
                memos={memos}
                onDelete={onDelete}
                onEdit={onEdit}
                onClick={() => goDetail(rx)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
