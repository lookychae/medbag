// 재사용 가능한 pill-shape chip.
// - color 미지정 → 회색 톤 (횟수·일수·라벨용)
// - color 지정   → 해당 컬러 저채도 배경 + 짙은 텍스트 (용량·카테고리용)
// MedBadge는 이 컴포넌트를 얇게 wrap한 것.
export default function Chip({ children, color, small = false, style }) {
  const isColored = Boolean(color);
  const fontSize = small ? 11 : 13;
  const padY = small ? 4 : 5;
  const padX = small ? 10 : 11;
  return (
    <span style={{
      display: "inline-block",
      background: isColored ? color + "1F" : "#F2F2F7",
      color: isColored ? color : "#555",
      padding: `${padY}px ${padX}px`,
      borderRadius: 999,
      fontSize,
      fontWeight: isColored ? 800 : 700,
      lineHeight: 1.15,
      whiteSpace: "nowrap",
      letterSpacing: -0.1,
      flexShrink: 0,
      ...style,
    }}>
      {children}
    </span>
  );
}
