export default function MedBadge({ dosage, color, form, small = false }) {
  const w = small ? 68 : 84, h = small ? 24 : 30, r = h / 2;
  const match = dosage.match(/^([\d./]+)(.*)$/);
  const num = match ? match[1] : dosage;
  const unit = match ? match[2].trim() : "";
  const fs = small ? 10 : 12, ufs = small ? 7.5 : 9.5;
  const vb = `0 0 ${w} ${h}`;
  const leftPath = `M ${r} 0 Q 0 0 0 ${r} Q 0 ${h} ${r} ${h} L ${w*0.54} ${h} L ${w*0.54} 0 Z`;

  if (form === "시럽") return (
    <svg width={w} height={h} viewBox={vb} style={{flexShrink:0,display:"block"}}>
      <rect x="0" y="0" width={w} height={h} rx={r} fill={color+"20"} />
      <path d={leftPath} fill={color} />
      <circle cx={r*0.65} cy={h*0.35} r={r*0.22} fill="rgba(255,255,255,0.35)" />
      <text x={w*0.27} y={h/2+fs*0.37} textAnchor="middle" fontSize={fs} fontWeight="800" fontFamily="'Pretendard',-apple-system,sans-serif" fill="white">{num}</text>
      <text x={w*0.77} y={h/2+ufs*0.37} textAnchor="middle" fontSize={ufs} fontWeight="700" fontFamily="'Pretendard',-apple-system,sans-serif" fill={color}>{unit||"mL"}</text>
    </svg>
  );

  if (form === "분말") return (
    <svg width={w} height={h} viewBox={vb} style={{flexShrink:0,display:"block"}}>
      <rect x="0" y="0" width={w} height={h} rx={4} fill={color+"18"} />
      <rect x="0" y="0" width={w*0.52} height={h} rx={4} fill={color} />
      <line x1={w*0.52} y1={4} x2={w*0.52} y2={h-4} stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2,2" />
      <text x={w*0.26} y={h/2+fs*0.37} textAnchor="middle" fontSize={fs} fontWeight="800" fontFamily="'Pretendard',-apple-system,sans-serif" fill="white">{num}</text>
      <text x={w*0.77} y={h/2+ufs*0.37} textAnchor="middle" fontSize={ufs} fontWeight="700" fontFamily="'Pretendard',-apple-system,sans-serif" fill={color}>{unit||"포"}</text>
    </svg>
  );

  return (
    <svg width={w} height={h} viewBox={vb} style={{flexShrink:0,display:"block"}}>
      <rect x="0" y="0" width={w} height={h} rx={r} fill={color+"20"} />
      <path d={leftPath} fill={color} />
      <ellipse cx={r*0.8} cy={h*0.32} rx={r*0.38} ry={h*0.16} fill="rgba(255,255,255,0.28)" />
      <text x={w*0.27} y={h/2+fs*0.37} textAnchor="middle" fontSize={fs} fontWeight="800" fontFamily="'Pretendard',-apple-system,sans-serif" fill="white">{num}</text>
      <text x={w*0.77} y={h/2+ufs*0.37} textAnchor="middle" fontSize={ufs} fontWeight="700" fontFamily="'Pretendard',-apple-system,sans-serif" fill={color}>{unit||"정"}</text>
    </svg>
  );
}
