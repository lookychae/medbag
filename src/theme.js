// 메디백 디자인 시스템 토큰.
// 모든 컴포넌트는 색·간격·그라디언트를 이 파일에서 가져다 씀.
// 인라인 매직 값은 1회용일 때만 허용.

export const COLORS = {
  navy: "#1A1A2E",          // 헤더/주요 다크 배경
  navyDeep: "#2D2D5E",      // 헤더 그라디언트 끝 색
  accentCyan: "#64C8FF",    // 시안 (primary 그라디언트 시작)
  accentPurple: "#A78BFA",  // 퍼플 (primary 그라디언트 끝)

  bg: "#F2F2F7",            // 앱 본문 배경
  bgSubtle: "#FAFAFA",      // 입력란/메모 박스 배경
  border: "#E5E5EA",        // 입력 밑줄/카드 테두리

  textPrimary: "#1C1C1E",   // 본문 텍스트
  textSecondary: "#8E8E93", // 부가 정보·라벨
  textTertiary: "#C7C7CC",  // 흐린 안내 텍스트
};

export const GRADIENTS = {
  // 앱 기본 액센트 그라디언트. 로고/저장 버튼/배너 CTA 등.
  primary: `linear-gradient(135deg, ${COLORS.accentCyan}, ${COLORS.accentPurple})`,
  // 다크 헤더 그라디언트. 아이정보·아이수정 화면 헤더 등.
  header:  `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyDeep})`,
};

// iOS 상태바/노치를 항상 클리어하는 top 패딩 계산식.
// env(safe-area-inset-top)가 0이거나 미정의일 때도 40px 최소 마진 보장.
// 사용 예: padding: `${SAFE_TOP(16)} 22px 22px`  /  top: SAFE_TOP(8)
export const SAFE_TOP = (extra = 0) =>
  `calc(max(env(safe-area-inset-top), 40px) + ${extra}px)`;

// 흰 카드 스타일 (처방전 카드, 상세 정보 박스 등)
export const CARD = {
  background: "white",
  borderRadius: 14,
  padding: "14px 16px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

// 다크 폼 인풋 스타일 (등록/수정 화면의 입력란).
// 사용: <input style={{...DARK_INPUT, fontSize:16}}/>
export const DARK_INPUT = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "white",
  fontSize: 14,
  outline: "none",
};
