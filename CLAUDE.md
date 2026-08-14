# 메디백 (MedBag) — 프로젝트 가이드

> 이 파일은 Claude Code가 매 세션 자동으로 읽습니다. 새 세션에서 별도 컨텍스트 paste 안 해도 됨.

## 한 줄 요약
아이의 처방전·영양제·성장 기록을 관리하는 모바일 우선 PWA. React 19 + Firebase Hosting + Firestore.

## 라이브 URL
- 사용자 앱: https://medbag-b7f3c.web.app
- Firebase 콘솔: https://console.firebase.google.com/project/medbag-b7f3c

## 기술 스택
- **React 19** — 라우터 없음. `App.jsx`의 `screen` state(string)로 화면 분기
- **Vite 7.3** — 빌드 시 `dist/version.json` 자동 생성 (자동 업데이트 알림용)
- **Firestore** — 데이터 저장 (단일 도큐먼트 패턴)
- **Firebase Hosting** — 정적 호스팅 + SPA rewrite
- **인증 없음** — URL을 아는 사람 누구나 접근 가능. 본인/가족용으로 운영

## 빌드 & 배포
```bash
npm run build && firebase deploy --only hosting
```
- **알려진 빌드 버그**: Vite 7.3 + index.html 인라인 `<style>` 조합이 가끔 `vite:html-inline-proxy` 에러로 실패함. 그냥 같은 명령 한 번 더 돌리면 성공. `node_modules/.vite`는 지우지 말 것.
- Firestore 규칙도 같이 배포하려면: `firebase deploy --only firestore:rules`

## 폴더 구조 (요점)
```
src/
  App.jsx              — 화면 라우팅 + 자동 업데이트 체크
  main.jsx             — React mount
  theme.js             — 디자인 토큰 (COLORS, GRADIENTS, SAFE_TOP, DARK_INPUT, CARD)
  constants.js         — 카테고리·시드 데이터·CAT_COLOR 등
  firebase.js          — Firebase 초기화
  useFirestore.js      — 모든 Firestore 읽기/쓰기 통합 훅
  HomeScreen.jsx       — 메인 (처방전 목록 + 최근 검색)
  DetailScreen.jsx     — 처방전 상세 + 메모 편집
  ScanScreen.jsx       — 등록 화면 (사진/직접 입력)
  EditPrescriptionScreen.jsx — 처방전 수정
  SupplementsScreen.jsx — 영양제 관리 + 약사 노트
  ChildScreens.jsx     — 아이 정보 + 아이 정보 수정
  TabScreens.jsx       — 약 정보 (약 ↔ 병원 토글 탭)
  GrowthChart.jsx      — 키/몸무게 성장 그래프 모달
  BottomNav.jsx        — 하단 4개 탭 + 가운데 카메라 버튼
  MedBadge.jsx         — 용량 배지 (약 카드 우측 알약 모양)
  UpdateBanner.jsx     — 새 버전 알림 배너
public/
  manifest.webmanifest, icon-*.png, apple-touch-icon.png, icon.svg
api/scan.js            — Vercel serverless OCR 함수 (현재 Firebase 호스팅에서는 동작 안 함)
firestore.rules        — open 규칙 (allow read, write: if true)
firebase.json          — hosting + firestore 설정
vite.config.js         — versionPlugin: 빌드마다 dist/version.json 갱신
```

## 데이터 모델 (Firestore)
모든 데이터는 단일 컬렉션 `medbag/` 아래 도큐먼트 5개로 저장됨:

| 도큐먼트 | 형태 |
|---|---|
| `medbag/prescriptions` | `{ list: [{id, hospital, doctor, date, symptom, child, accent, memo, medicines:[{name, dosage, dosageAmt, dosageUnit, times, days, category, form, comment}]}] }` |
| `medbag/memos` | `{ map: { [prescriptionId]: string } }` — 부모 메모 |
| `medbag/child` | `{ name, birth, gender, bloodType, height, weight, allergy, notes, heightLog:[{date,value}], weightLog:[{date,value}] }` |
| `medbag/supplements` | `{ list: [{id, category, name, role, status, dosage, startDate, endDate, note}] }` |
| `medbag/pharmacistNotes` | `{ list: [string, ...] }` |

**중요**: useFirestore.js가 fallback으로 constants.js의 시드 데이터를 보여줌. Firestore가 빈 상태 + 권한 없음일 때 시드가 보이고, 그 위에서 수정해도 저장 안 되면 새로고침 시 시드로 리셋됨.

## 화면 라우팅 (`screen` state 값)
`home`, `scan`, `edit`, `detail`, `meds`, `supplements`, `child`, `child-edit`
- 하단 네비는 home, meds, supplements, child만 노출
- scan/edit/child-edit/detail은 모달성 진입
- BottomNav는 `screen === "scan" | "child-edit" | "edit"`일 때 숨김

## 디자인 시스템 ([src/theme.js](src/theme.js))
모든 컴포넌트가 이 토큰만 사용. 새 화면/위젯 추가할 때도 이걸 import해서 쓰면 됨.
- `COLORS` — navy, navyDeep, accentCyan, accentPurple, bg, bgSubtle, border, textPrimary/Secondary/Tertiary
- `GRADIENTS.primary` — 시안→퍼플 (앱 기본)
- `GRADIENTS.header` — 다크 그라디언트 (헤더용)
- `SAFE_TOP(extra)` — iOS 상태바 클리어 (`calc(max(env(safe-area-inset-top), 40px) + ${extra}px)`)
- `DARK_INPUT` — 다크 폼 인풋 스타일 객체
- `CARD` — 흰 카드 스타일

## 자동 업데이트 알림
- 빌드 시 vite.config.js의 versionPlugin이 `dist/version.json`에 timestamp 기록
- 동시에 `__BUILD_VERSION__` 글로벌로 번들에 내장
- App.jsx에서 visibilitychange + 5분 폴링으로 서버의 version.json 가져와 비교 → 다르면 UpdateBanner 표시
- `firebase.json`이 `index.html`, `version.json`은 `no-cache`로 응답하도록 헤더 설정함

## 알려진 한계
- **OCR 미작동** — `api/scan.js`는 Vercel serverless 함수. Firebase Hosting은 정적만 서빙해서 호출하면 HTML이 돌아옴 → 직접 입력만 가능. 해결하려면 Vercel 배포 or Firebase Functions(Blaze 요금제) 필요.
- **인증 없음** — Firestore 규칙도 open. URL이 비밀이라는 전제.
- **개발 시드와 실데이터 공존** — Firestore에 처음 시드가 들어간 적이 없으면 코드 fallback이 보임. 사용자가 직접 추가/수정하면 그때부터 Firestore에 본격 저장 시작.

## 코딩 컨벤션
- 인라인 스타일만 사용 (CSS-in-JS, Tailwind 등 없음)
- 색·간격은 theme.js 토큰 우선. 1회용 매직값만 인라인 OK.
- 컴포넌트는 작게. render 함수 안에서 다른 컴포넌트 정의 금지 (ESLint `react-hooks/static-components`)
- 폼은 inline 스타일로 구성하되 다크 인풋은 `DARK_INPUT` 스프레드 사용
- iOS 안전영역 항상 `SAFE_TOP()` 통과

## 자주 참고하는 명령
| 작업 | 명령 |
|---|---|
| 로컬 개발 | `npm run dev` (또는 `-- --host`로 폰 노출) |
| 빌드 | `npm run build` |
| 호스팅 배포 | `firebase deploy --only hosting` |
| 규칙 배포 | `firebase deploy --only firestore:rules` |
| 린트 | `npm run lint` |
| Firestore 데이터 직접 조회 | `node -e "..."` (firebase JS SDK 사용. CLAUDE.md 예시 참고) |
