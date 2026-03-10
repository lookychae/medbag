function ChartLine({ logs, color, unit, label, icon }) {
  if (!logs.length) return <div style={{color:"#8E8E93",fontSize:12,textAlign:"center",padding:20}}>기록 없음</div>;
  const vals = logs.map(l => l.value);
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const W = 280, H = 120, pad = 20;
  const xf = i => pad + (i / Math.max(logs.length-1,1)) * (W - pad*2);
  const yf = v => H - pad - ((v - min) / range) * (H - pad*2);
  const pts = logs.map((l,i) => `${xf(i)},${yf(l.value)}`).join(" ");
  const area = `${xf(0)},${H-pad} ${pts} ${xf(logs.length-1)},${H-pad}`;

  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:12,fontWeight:700,color,marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
        <span>{icon}</span>{label}
      </div>
      <svg width={W} height={H} style={{overflow:"visible"}}>
        {[0,0.25,0.5,0.75,1].map((t,i) => {
          const yy = H - pad - t*(H-pad*2);
          const val = (min + t*range).toFixed(t===Math.floor(t)?0:1);
          return (
            <g key={i}>
              <line x1={pad} y1={yy} x2={W-pad} y2={yy} stroke="#F2F2F7" strokeWidth="1"/>
              <text x={pad-4} y={yy+4} textAnchor="end" fontSize="9" fill="#C7C7CC">{val}</text>
            </g>
          );
        })}
        <polygon points={area} fill={color} fillOpacity="0.08"/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {logs.map((l,i) => (
          <g key={i}>
            <circle cx={xf(i)} cy={yf(l.value)} r="4" fill={color} stroke="white" strokeWidth="2"/>
            <text x={xf(i)} y={yf(l.value)-10} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">
              {l.value}{unit}
            </text>
          </g>
        ))}
        {logs.map((l,i) => (
          <text key={i} x={xf(i)} y={H-2} textAnchor="middle" fontSize="8" fill="#C7C7CC">
            {l.date.slice(2,7).replace("-","/")}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function GrowthChart({ childProfile, onClose }) {
  const hLogs = [...(childProfile.heightLog||[])].sort((a,b) => a.date.localeCompare(b.date));
  const wLogs = [...(childProfile.weightLog||[])].sort((a,b) => a.date.localeCompare(b.date));

  const stats = [
    { label:"최근 키", value: hLogs.at(-1)?.value, unit:"cm", color:"#3B82F6", icon:"📏",
      diff: hLogs.length>1 ? (hLogs.at(-1).value - hLogs.at(-2).value).toFixed(1) : null },
    { label:"최근 몸무게", value: wLogs.at(-1)?.value, unit:"kg", color:"#10B981", icon:"⚖️",
      diff: wLogs.length>1 ? (wLogs.at(-1).value - wLogs.at(-2).value).toFixed(1) : null },
  ];

  return (
    <div
      style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={onClose}
    >
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:390,maxHeight:"85vh",overflowY:"auto",padding:"24px 24px 40px"}}>
        <div style={{width:40,height:4,background:"#E5E5EA",borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <div style={{fontSize:17,fontWeight:800,color:"#1C1C1E"}}>📊 성장 그래프</div>
            <div style={{fontSize:12,color:"#8E8E93",marginTop:2}}>{childProfile.name} · 성장 기록</div>
          </div>
          <button onClick={onClose} style={{background:"#F2F2F7",border:"none",borderRadius:"50%",width:32,height:32,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        <div style={{display:"flex",gap:10,marginBottom:24}}>
          {stats.map((s,i) => (
            <div key={i} style={{flex:1,background:s.color+"10",borderRadius:14,padding:"14px",border:`1px solid ${s.color}22`}}>
              <div style={{fontSize:11,color:s.color,fontWeight:700,marginBottom:4}}>{s.icon} {s.label}</div>
              <div style={{fontSize:22,fontWeight:800,color:"#1C1C1E"}}>
                {s.value??"-"}<span style={{fontSize:13,color:"#8E8E93",fontWeight:400}}> {s.unit}</span>
              </div>
              {s.diff && (
                <div style={{fontSize:11,color:parseFloat(s.diff)>=0?"#10B981":"#EF4444",marginTop:3,fontWeight:600}}>
                  {parseFloat(s.diff)>=0?"▲":"▼"} {Math.abs(s.diff)}{s.unit} 이전 대비
                </div>
              )}
            </div>
          ))}
        </div>

        <ChartLine logs={hLogs} color="#3B82F6" unit="cm" label="키 변화 (cm)" icon="📏"/>
        <ChartLine logs={wLogs} color="#10B981" unit="kg" label="몸무게 변화 (kg)" icon="⚖️"/>
      </div>
    </div>
  );
}
