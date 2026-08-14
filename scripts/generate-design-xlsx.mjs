// 메디백 디자인 시스템을 엑셀 파일로 뽑는 일회성 스크립트.
// 실행: node scripts/generate-design-xlsx.mjs
import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "docs", "medbag-design.xlsx");

const wb = new ExcelJS.Workbook();
wb.creator = "MedBag";
wb.created = new Date();

// ─────────────────────────────
// 공통 스타일 헬퍼
// ─────────────────────────────
const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A2E" } };
const HEADER_FONT = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
const CELL_BORDER = {
  top: { style: "thin", color: { argb: "FFE5E5EA" } },
  left: { style: "thin", color: { argb: "FFE5E5EA" } },
  bottom: { style: "thin", color: { argb: "FFE5E5EA" } },
  right: { style: "thin", color: { argb: "FFE5E5EA" } },
};

function addSheet(name, columns, rows, opts = {}) {
  const ws = wb.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 20 },
  });
  ws.columns = columns.map((c) => ({ ...c, style: { alignment: { vertical: "middle", wrapText: true } } }));
  // 헤더
  ws.getRow(1).values = columns.map((c) => c.header);
  ws.getRow(1).eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = CELL_BORDER;
  });
  ws.getRow(1).height = 24;
  // 데이터
  rows.forEach((r) => {
    const row = ws.addRow(r);
    row.eachCell((cell, colNumber) => {
      cell.border = CELL_BORDER;
      const key = columns[colNumber - 1]?.key;
      if (key === "swatch" && cell.value && String(cell.value).startsWith("#")) {
        const hex = String(cell.value).replace("#", "");
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + hex } };
        cell.font = { color: { argb: getTextColor(hex) } };
      }
    });
  });
  if (opts.merges) opts.merges.forEach((m) => ws.mergeCells(m));
  return ws;
}

function getTextColor(hex) {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "FF1C1C1E" : "FFFFFFFF";
}

// ─────────────────────────────
// 1. 개요
// ─────────────────────────────
addSheet(
  "1. 개요",
  [
    { header: "항목", key: "k", width: 20 },
    { header: "내용", key: "v", width: 80 },
  ],
  [
    { k: "앱 이름", v: "약봉지 (MedBag)" },
    { k: "한 줄 정체성", v: "아이의 처방전·영양제·성장 기록을 한 손으로 정리하는 모바일 우선 PWA" },
    { k: "감성 톤", v: "부드러운 야간 다크 + 파스텔 시안·퍼플 액센트. 병원 앱의 차가운 임상 톤이 아니라 '잠자기 전 부모의 스마트폰'에 어울리는 따뜻한 다크." },
    { k: "타겟 사용자", v: "부모(주로 엄마), 30-40대. 피곤한 상태에서 짧은 짬에 훑고 저장하는 흐름." },
    { k: "타겟 디바이스", v: "iPhone 세로 우선 (≤ 500px 폭). max-width:500px 로 데스크톱에서도 폰 폭 유지." },
    { k: "기술 스택", v: "React 19 + Vite 7.3 + Firebase (Firestore/Hosting/Auth/Storage). CSS 없음 — 인라인 스타일만." },
    { k: "라우팅", v: "라우터 없이 screen state(string)로 분기: home | scan | edit | detail | meds | supplements | child | child-edit" },
  ]
);

// ─────────────────────────────
// 2. 컬러 (다크 계열)
// ─────────────────────────────
addSheet(
  "2. 컬러(다크)",
  [
    { header: "토큰", key: "k", width: 16 },
    { header: "Hex", key: "swatch", width: 14 },
    { header: "용도", key: "v", width: 60 },
  ],
  [
    { k: "navy",         swatch: "#1A1A2E", v: "헤더 배경, 로그인·촬영 화면 전체 배경" },
    { k: "navyDeep",     swatch: "#2D2D5E", v: "헤더 그라디언트 끝점" },
    { k: "accentCyan",   swatch: "#64C8FF", v: "primary 그라디언트 시작, 액센트" },
    { k: "accentPurple", swatch: "#A78BFA", v: "primary 그라디언트 끝, 액센트" },
  ]
);

// ─────────────────────────────
// 3. 컬러 (라이트/텍스트)
// ─────────────────────────────
addSheet(
  "3. 컬러(라이트·텍스트)",
  [
    { header: "토큰", key: "k", width: 16 },
    { header: "Hex", key: "swatch", width: 14 },
    { header: "용도", key: "v", width: 60 },
  ],
  [
    { k: "bg",            swatch: "#F2F2F7", v: "앱 본문 배경 (iOS 시스템 그레이)" },
    { k: "bgSubtle",      swatch: "#FAFAFA", v: "인풋·메모 박스 배경" },
    { k: "border",        swatch: "#E5E5EA", v: "카드·인풋 하단 경계선" },
    { k: "textPrimary",   swatch: "#1C1C1E", v: "본문 텍스트" },
    { k: "textSecondary", swatch: "#8E8E93", v: "라벨·부가 정보" },
    { k: "textTertiary",  swatch: "#C7C7CC", v: "흐린 안내 텍스트" },
  ]
);

// ─────────────────────────────
// 4. 카테고리 컬러 (약)
// ─────────────────────────────
addSheet(
  "4. 카테고리(약)",
  [
    { header: "카테고리", key: "k", width: 18 },
    { header: "Hex", key: "swatch", width: 14 },
    { header: "의미/톤", key: "v", width: 40 },
  ],
  [
    { k: "항생제",         swatch: "#EF4444", v: "빨강 — 강한 약" },
    { k: "해열진통제",     swatch: "#F97316", v: "주황 — 열/통증" },
    { k: "거담제",         swatch: "#6366F1", v: "남보라 — 기침" },
    { k: "항히스타민제",   swatch: "#10B981", v: "초록 — 알레르기" },
    { k: "소화제",         swatch: "#F59E0B", v: "앰버 — 위장" },
    { k: "기관지확장제",   swatch: "#3B82F6", v: "블루 — 호흡" },
    { k: "스테로이드",     swatch: "#8B5CF6", v: "퍼플 — 강도 있는 약" },
    { k: "외용제",         swatch: "#06B6D4", v: "사이언 — 바르는 약" },
    { k: "유산균",         swatch: "#84CC16", v: "라임 — 순한 보조" },
    { k: "기타",           swatch: "#9CA3AF", v: "그레이 — 미분류" },
  ]
);

// ─────────────────────────────
// 5. 카테고리 컬러 (영양제)
// ─────────────────────────────
addSheet(
  "5. 카테고리(영양제)",
  [
    { header: "카테고리", key: "k", width: 26 },
    { header: "Hex", key: "swatch", width: 14 },
    { header: "톤", key: "v", width: 30 },
  ],
  [
    { k: "기초 미네랄/비타민",  swatch: "#3B82F6", v: "블루 — 데일리 베이스" },
    { k: "필수 지방산/오메가3", swatch: "#0EA5E9", v: "시안" },
    { k: "필수 지방산/보조",    swatch: "#06B6D4", v: "라이트 시안" },
    { k: "성장/미네랄",         swatch: "#10B981", v: "초록 — 성장" },
    { k: "면역/항산화",         swatch: "#F59E0B", v: "앰버 — 면역" },
    { k: "유산균",              swatch: "#84CC16", v: "라임" },
    { k: "기타",                swatch: "#9CA3AF", v: "그레이" },
  ]
);

// ─────────────────────────────
// 6. 그라디언트
// ─────────────────────────────
addSheet(
  "6. 그라디언트",
  [
    { header: "이름", key: "k", width: 16 },
    { header: "CSS", key: "v", width: 60 },
    { header: "사용처", key: "u", width: 50 },
  ],
  [
    { k: "primary",   v: "linear-gradient(135deg, #64C8FF, #A78BFA)", u: "로고 뱃지, 저장 버튼, 배너 CTA, 그래프 CTA" },
    { k: "header",    v: "linear-gradient(135deg, #1A1A2E, #2D2D5E)", u: "아이 정보·영양제 등 다크 헤더" },
    { k: "camera FAB", v: "linear-gradient(135deg, #1A1A2E, #4A4A8E)", u: "하단 네비 가운데 카메라 버튼" },
    { k: "규칙", v: "모든 그라디언트 각도는 135deg (좌상→우하)로 통일. 다른 각도 사용 금지.", u: "" },
  ]
);

// ─────────────────────────────
// 7. 타이포그래피
// ─────────────────────────────
addSheet(
  "7. 타이포그래피",
  [
    { header: "역할", key: "k", width: 22 },
    { header: "크기(px)", key: "s", width: 12 },
    { header: "굵기", key: "w", width: 10 },
    { header: "설명", key: "v", width: 50 },
  ],
  [
    { k: "로그인 브랜드",     s: 26, w: 800, v: "로그인 화면 '약봉지' 로고 옆" },
    { k: "화면 타이틀",       s: 20, w: 800, v: "아이 정보 헤더 이름 등" },
    { k: "섹션 헤딩",         s: 18, w: 700, v: "홈의 '처방전 N건을 보관하고 있어요'" },
    { k: "카드 이름",         s: "15-17", w: 700, v: "약 이름, 처방전 병원명" },
    { k: "본문",              s: 14, w: "500-600", v: "일반 텍스트" },
    { k: "라벨/부가 정보",    s: "12-13", w: 600, v: "'만 N세', 카테고리 라벨" },
    { k: "최소 안내",         s: 11, w: 500, v: "'로그인하면 개인 계정 안에...' 같은 미세 안내" },
    { k: "폰트 패밀리",       s: "", w: "", v: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
    { k: "letter-spacing",   s: "", w: "", v: "헤더/타이틀 -0.5px (Pretendard가 넓어서 살짝 조임)" },
    { k: "line-height",       s: "", w: "", v: "본문 1.5, 안내문 1.6, 타이틀 1.2" },
  ]
);

// ─────────────────────────────
// 8. 레이아웃 & 스페이싱
// ─────────────────────────────
addSheet(
  "8. 레이아웃",
  [
    { header: "항목", key: "k", width: 24 },
    { header: "값", key: "v", width: 70 },
  ],
  [
    { k: "컨테이너",         v: "width:100%; maxWidth:500px; margin:0 auto. 데스크톱에서도 폰 폭 유지." },
    { k: "가로 패딩",        v: "헤더 22px, 본문 리스트 18px" },
    { k: "세로 리듬",        v: "카드 간 10-12px, 섹션 간 20-24px" },
    { k: "iOS 상단 안전영역", v: "SAFE_TOP(extra) 헬퍼: calc(max(env(safe-area-inset-top), 40px) + Xpx)" },
    { k: "iOS 하단 안전영역", v: "padding-bottom: calc(env(safe-area-inset-bottom) + Xpx)" },
    { k: "스크롤 하단 여백",  v: "paddingBottom:110px (BottomNav 가림 방지)" },
    { k: "border-radius",    v: "카드 14, 인풋 10, 배너 12, 뱃지 20 (pill), 원형 FAB 50%" },
    { k: "box-shadow (카드)", v: "0 2px 8px rgba(0,0,0,0.06)" },
    { k: "box-shadow (버튼)", v: "0 6px 20px rgba(0,0,0,0.3) — 다크 상 흰 버튼" },
    { k: "box-shadow (FAB)",  v: "0 4px 14px rgba(26,26,46,0.35)" },
  ]
);

// ─────────────────────────────
// 9. 컴포넌트
// ─────────────────────────────
addSheet(
  "9. 컴포넌트",
  [
    { header: "컴포넌트", key: "k", width: 18 },
    { header: "스타일 규칙", key: "v", width: 80 },
  ],
  [
    { k: "CARD (흰 카드)",  v: "background:white; border-radius:14; padding:14px 16px; box-shadow:0 2px 8px rgba(0,0,0,0.06). 좌측에 4px 카테고리 컬러 세로 라인." },
    { k: "DARK_INPUT",     v: "background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:10; padding:10px 12px; color:white; font-size:14. placeholder는 rgba(255,255,255,0.35)" },
    { k: "라이트 인풋",     v: "border:none; border-bottom:1.5px solid #E5E5EA; padding:6px 0. iOS 폼 스타일." },
    { k: "주 CTA 버튼",     v: "primary 그라디언트; border-radius:14; color:white; padding:15px; font-weight:700" },
    { k: "보조/취소 버튼",  v: "background:transparent; border:1px solid rgba(255,255,255,0.2); color:white" },
    { k: "삭제 버튼",       v: "background:#EF4444 솔리드; color:white" },
    { k: "흰 버튼(다크위)",  v: "background:white; color:#1C1C1E; border-radius:14; box-shadow:0 6px 20px rgba(0,0,0,0.3). Google 로그인 등." },
    { k: "MedBadge",       v: "약 카드 우측에 미니 알약 모양 뱃지. 카테고리 컬러 + 제형 이모지." },
    { k: "BottomNav",      v: "4개 탭 + 가운데 카메라 FAB. 배경 rgba(255,255,255,0.97) + backdrop-filter:blur(20px). 활성 opacity:1, 비활성 0.28. createPortal(document.body)로 렌더." },
    { k: "카메라 FAB",     v: "56x56 원형, margin-top:-26px 로 반쯤 튀어나옴, 3px 흰 테두리, navy 그라디언트, 그림자." },
    { k: "스와이프 카드",   v: "좌로 스와이프 → 뒤에서 수정(파랑 #3B82F6) + 삭제(빨강 #EF4444) 액션 노출. 각 80px, 총 160px." },
    { k: "배경 데코 원",    v: "다크 화면 대각선에 큰 반투명 원 2개. 크기 200-280px, rgba(100,200,255,0.06) 시안 + rgba(167,139,250,0.06) 퍼플. pointer-events:none." },
    { k: "에러 배너",       v: "background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#FCA5A5; padding:10-14px; border-radius:10" },
  ]
);

// ─────────────────────────────
// 10. 이모지
// ─────────────────────────────
addSheet(
  "10. 이모지",
  [
    { header: "자리", key: "k", width: 24 },
    { header: "이모지", key: "e", width: 12 },
    { header: "비고", key: "v", width: 40 },
  ],
  [
    { k: "앱 로고 / 정제·캡슐",    e: "💊", v: "브랜드 시그니처" },
    { k: "홈 탭",                  e: "🏠" },
    { k: "약 정보 탭",             e: "💊" },
    { k: "영양제 탭",              e: "🥗" },
    { k: "아이 정보 탭(남)",       e: "🧒" },
    { k: "아이 정보 탭(여)",       e: "👧" },
    { k: "카메라 FAB",             e: "📸" },
    { k: "검색",                   e: "🔍" },
    { k: "병원",                   e: "🏥" },
    { k: "의사",                   e: "👨‍⚕️" },
    { k: "체온/열",                e: "🌡️" },
    { k: "알레르기 경고",          e: "⚠️" },
    { k: "메모/노트",              e: "📝" },
    { k: "키",                     e: "📏" },
    { k: "몸무게",                 e: "⚖️" },
    { k: "성장 기록",              e: "📊" },
    { k: "팁/조언",                e: "💡" },
    { k: "제형: 시럽",             e: "🧴" },
    { k: "제형: 분말",             e: "🫙" },
    { k: "제형: 좌약",             e: "🩺" },
    { k: "제형: 연고",             e: "🪶" },
    { k: "제형: 흡입",             e: "💨" },
    { k: "제형: 점안",             e: "👁" },
    { k: "규칙",                   e: "", v: "모든 UI 아이콘은 이모지. 별도 아이콘 라이브러리 없음." },
  ]
);

// ─────────────────────────────
// 11. 모션 & 인터랙션
// ─────────────────────────────
addSheet(
  "11. 모션·인터랙션",
  [
    { header: "항목", key: "k", width: 22 },
    { header: "동작", key: "v", width: 70 },
  ],
  [
    { k: "CSS transition", v: "명시적 transition 거의 안 씀. 유일하게 스와이프 카드가 transform으로 좌우 이동." },
    { k: "로딩 스피너",     v: "💊 이모지가 spin 1.5s linear infinite. 알약이 도는 앙증맞은 시그니처." },
    { k: "탭 피드백",       v: "opacity 변화로 처리. hover 효과 최소화 (모바일 우선)." },
    { k: "keyframes",       v: "spin (0→360deg), pulse (0.3→1→0.3 opacity). App.jsx의 style 블록에 정의." },
    { k: "업데이트 배너",   v: "새 빌드 감지 시 화면 상단에 슬라이드 없이 즉시 노출." },
    { k: "스와이프 감도",   v: "액션 폭의 절반(80px) 이상 당기면 열림/닫힘 스냅." },
  ]
);

// ─────────────────────────────
// 12. 화면 구조
// ─────────────────────────────
addSheet(
  "12. 화면 구조",
  [
    { header: "화면", key: "k", width: 16 },
    { header: "screen 값", key: "s", width: 14 },
    { header: "구성", key: "v", width: 70 },
  ],
  [
    { k: "홈",           s: "home",        v: "다크 헤더(로고·타이틀·[+등록]·인사·건수·검색바) → 최근 검색 chips → YYYY-MM 그룹핑된 처방전 카드 리스트" },
    { k: "처방전 상세",  s: "detail",      v: "좌측 4px 카테고리 라인 → 병원/의사/날짜/증상/메모 → 약물 리스트 카드(이모지 + 뱃지 + 용법·용량)" },
    { k: "등록",         s: "scan",        v: "전체 navy 배경. 사진 촬영 or 수동 입력 폼. 병원 선택 모달 → 새 병원 직접 입력" },
    { k: "처방전 수정",  s: "edit",        v: "등록과 동일 폼, 기존 데이터 프리필" },
    { k: "약 정보",      s: "meds",        v: "약 ↔ 병원 토글 탭. 통계(총 약 종수, 병원 수, 월별 처방 건수)" },
    { k: "영양제",       s: "supplements", v: "카테고리별 그룹 → 상태 필터(복용중/중단/완료) → 약사 노트 배너" },
    { k: "아이 정보",    s: "child",       v: "header 그라디언트 프로필 → 3열 스탯(키/몸무게/알레르기) → 표준 해열제 권장 용량 카드 → 성장 로그 → 계정/로그아웃" },
    { k: "아이 수정",    s: "child-edit",  v: "라이트 인풋 폼 (밑줄 스타일)" },
    { k: "하단 네비 노출", s: "", v: "home / meds / supplements / child 에서만 노출. scan / edit / child-edit 에서는 숨김." },
  ]
);

// ─────────────────────────────
// 13. 상태 처리
// ─────────────────────────────
addSheet(
  "13. 상태 처리",
  [
    { header: "상태", key: "k", width: 22 },
    { header: "표현", key: "v", width: 70 },
  ],
  [
    { k: "인증 확인 중",     v: "다크 배경 + 회전하는 💊" },
    { k: "데이터 로딩 중",   v: "다크 배경 + 회전하는 💊 + '약봉지 불러오는 중...' (14px, rgba(255,255,255,0.5))" },
    { k: "빈 리스트",        v: "회색 안내 텍스트 '기록 없음' (12px, #C7C7CC)" },
    { k: "에러",             v: "빨강 배경 카드 rgba(239,68,68,0.15) + 테두리 rgba(239,68,68,0.3) + 텍스트 #FCA5A5" },
    { k: "React 크래시",     v: "ErrorBoundary → 다크 네이비 배경 + 모노스페이스 에러 메시지 + 새로고침/무시 버튼" },
    { k: "새 버전 감지",     v: "UpdateBanner: primary 그라디언트 배너로 상단에 표시, 새로고침 버튼 제공" },
  ]
);

// ─────────────────────────────
// 14. 접근성 & 반응성
// ─────────────────────────────
addSheet(
  "14. 접근성",
  [
    { header: "항목", key: "k", width: 22 },
    { header: "규칙", key: "v", width: 70 },
  ],
  [
    { k: "터치 타깃",        v: "최소 44x44px 확보 (하단 탭, 카메라 FAB, 스와이프 액션)" },
    { k: "이모지 + 라벨",    v: "이모지에는 항상 텍스트 라벨 병기 (탭 등)" },
    { k: "viewport",         v: "viewport-fit=cover 로 노치 대응" },
    { k: "theme-color",      v: "#1A1A2E (iOS 상태바 색 매칭)" },
    { k: "대비",              v: "WCAG AA 통과. 다크 배경 위 텍스트는 최소 흰색 60% opacity" },
    { k: "다크 폼 라벨",     v: "rgba(255,255,255,0.6) 이상 유지" },
    { k: "다크 인풋 placeholder", v: "rgba(255,255,255,0.35) 이상 유지 (읽히지만 튀지 않게)" },
  ]
);

// ─────────────────────────────
// 15. 코드 컨벤션
// ─────────────────────────────
addSheet(
  "15. 코드 규칙",
  [
    { header: "규칙", key: "k", width: 22 },
    { header: "설명", key: "v", width: 70 },
  ],
  [
    { k: "인라인 스타일만",    v: "Tailwind / CSS-in-JS 없음. 색·간격은 반드시 theme.js 토큰" },
    { k: "CSS 파일 없음",     v: "유일한 <style> 블록은 App.jsx의 리셋 + keyframes 3개 (spin, pulse)" },
    { k: "단위",              v: "em/rem 안 씀. 모든 크기 px 고정 (모바일 우선이라 반응형 불필요)" },
    { k: "className 없음",    v: "BEM 없음. 컴포넌트 = 파일 하나 = 스타일 함께" },
    { k: "매직 값 인라인",    v: "theme.js 토큰이 우선. 1회용 매직값만 인라인 허용" },
    { k: "컴포넌트 정의",     v: "render 함수 안에서 다른 컴포넌트 정의 금지 (ESLint react-hooks/static-components)" },
    { k: "안전영역",          v: "iOS 상단은 항상 SAFE_TOP() 사용" },
  ]
);

// ─────────────────────────────
// 16. 브랜드 문구/톤
// ─────────────────────────────
addSheet(
  "16. 브랜드 문구",
  [
    { header: "상황", key: "k", width: 24 },
    { header: "예시", key: "v", width: 60 },
  ],
  [
    { k: "인사",              v: "안녕하세요! 👋" },
    { k: "격려",              v: "우리 아이 처방전 · 영양제 안심하고 관리하세요" },
    { k: "실수 방지 경고",     v: "⚠️ 참고용입니다. 실제 복용량은 의사·약사에게 확인하세요." },
    { k: "빈 화면 문구",       v: "기록 없음 / 검색 결과가 없어요" },
    { k: "로그인 유도",       v: "로그인하면 개인 계정 안에 안전하게 처방전과 영양제 정보가 저장돼요" },
    { k: "저장 확인",         v: "저장하기 (버튼 텍스트) — 저장 완료 후 별도 토스트 없이 화면 전환" },
    { k: "톤 규칙",           v: "존댓말 + 이모지 1개, 문장 짧게. '~해주세요'보다 '~해요' 선호 (덜 격식)" },
  ]
);

// ─────────────────────────────
// 저장
// ─────────────────────────────
await wb.xlsx.writeFile(outPath);
console.log("✅ 생성 완료:", outPath);
