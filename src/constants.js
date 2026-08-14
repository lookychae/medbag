// 메디백 도메인 상수 + 시드 데이터.
// 시드 데이터(SAMPLE_*)는 Firestore가 빈 상태일 때 사용되는 폴백.
// 실사용자가 처음 저장하면 그 이후로는 Firestore의 데이터가 우선.

// ───── 처방약 카테고리 ─────
// 카테고리 → 약 카드 좌측 라인/뱃지 색.
export const CAT_COLOR = {
  "항생제":"#EF4444","해열진통제":"#F97316","거담제":"#6366F1",
  "항히스타민제":"#10B981","소화제":"#F59E0B","기관지확장제":"#3B82F6",
  "스테로이드":"#8B5CF6","외용제":"#06B6D4","유산균":"#84CC16","기타":"#64C8FF",
};

// 약 제형 → 카드 이모지.
export const FORM_ICON = {
  "시럽":"🧴","분말":"🫙","정제":"💊","캡슐":"💊",
  "좌약":"🩺","연고":"🪶","흡입":"💨","점안":"👁","기타":"💊",
};

// 새 처방전 등록 시 무작위로 골라 카드 좌측 강조선 색으로 사용.
export const ACCENT_COLORS = ["#F97316","#EF4444","#3B82F6","#10B981","#8B5CF6","#6366F1"];

// ───── 처방전 시드 ─────
// Firestore 빈 상태일 때 화면에 표시되는 더미 데이터.
export const SAMPLE_PRESCRIPTIONS = [
  {
    id:1, hospital:"서울아동병원", doctor:"이지현 원장", date:"2025-02-20",
    symptom:"감기, 발열, 콧물", child:"이준서 (5세)", accent:"#F97316",
    memo:"38도 이상이면 해열제 우선, 구토 시 복용 중단",
    medicines:[
      {name:"코미시럽",dosage:"5mL",times:"하루 3회",days:5,category:"항히스타민제",form:"시럽",comment:"식후 복용, 졸릴 수 있음"},
      {name:"타이레놀현탁액",dosage:"7.5mL",times:"필요시 6시간마다",days:3,category:"해열진통제",form:"시럽",comment:"38도 이상 시만 복용"},
      {name:"암브록솔시럽",dosage:"4mL",times:"하루 2회",days:5,category:"거담제",form:"시럽",comment:"가래 묽게 해줌"},
      {name:"정장생균산",dosage:"1포",times:"하루 3회",days:5,category:"유산균",form:"분말",comment:"물에 타서 복용"},
    ],
  },
  {
    id:2, hospital:"강남소아과의원", doctor:"박민수 원장", date:"2025-01-15",
    symptom:"중이염, 귀 통증", child:"이준서 (5세)", accent:"#EF4444",
    memo:"귀 수술 이력 있음, 항생제 5일 완료 필수",
    medicines:[
      {name:"오구멘틴시럽",dosage:"6mL",times:"하루 2회",days:5,category:"항생제",form:"시럽",comment:"식후, 냉장 보관"},
      {name:"이부프로펜시럽",dosage:"5mL",times:"하루 3회",days:3,category:"해열진통제",form:"시럽",comment:"통증 심할 때만"},
      {name:"콧물감기시럽",dosage:"4mL",times:"하루 2회",days:5,category:"항히스타민제",form:"시럽",comment:"자기 전 복용 권장"},
    ],
  },
  {
    id:3, hospital:"한빛소아과", doctor:"최수진 원장", date:"2024-12-05",
    symptom:"장염, 구토, 설사", child:"이준서 (4세)", accent:"#10B981",
    memo:"구토 멈춘 후 복용 시작, 수분 보충 충분히",
    medicines:[
      {name:"스멕타현탁액",dosage:"1포",times:"하루 3회",days:3,category:"소화제",form:"분말",comment:"물 50mL에 타서 복용"},
      {name:"오라페드시럽",dosage:"3mL",times:"하루 2회",days:3,category:"스테로이드",form:"시럽",comment:"구토·염증 억제"},
      {name:"락토핏골드",dosage:"1포",times:"하루 1회",days:7,category:"유산균",form:"분말",comment:"장 회복 도움"},
    ],
  },
];

// ───── 영양제 ─────
// 카테고리 → 영양제 카드 좌측 라인 색.
export const SUPPLEMENT_CAT_COLOR = {
  "기초 미네랄/비타민":"#3B82F6",
  "필수 지방산/오메가3":"#0EA5E9",
  "필수 지방산/보조":"#06B6D4",
  "성장/미네랄":"#10B981",
  "면역/항산화":"#F59E0B",
  "유산균":"#84CC16",
  "기타":"#9CA3AF",
};

export const SUPPLEMENT_STATUS = ["복용중","중단","완료"];

// ───── 영양제 시드 ─────
// 사용자가 처음 사용 시 보일 더미 영양제 5종.
export const SAMPLE_SUPPLEMENTS = [
  {id:101, category:"기초 미네랄/비타민", name:"프라이멀 뉴트라", role:"종합 비타민 및 미네랄 공급",
   status:"복용중", dosage:"2알", startDate:"2026-01", endDate:"", note:"기초 영양 베이스. 차일드라이프와 아연(Zn) 중복 함량 정기 체크 필요."},
  {id:102, category:"필수 지방산/오메가3", name:"로지타 대구간유", role:"DHA/EPA, 천연 비타민 A 및 D",
   status:"복용중", dosage:"1알", startDate:"2026-01", endDate:"", note:"두뇌 발달 및 지용성 비타민 공급 핵심 제품. 지속 복용 적극 권장."},
  {id:103, category:"성장/미네랄", name:"차일드라이프 칼슘마그네슘", role:"칼슘, 마그네슘, 아연",
   status:"복용중", dosage:"15ml", startDate:"2026-01", endDate:"", note:"성장기 뼈 건강. 과량 복용 시 변이 묽어질 수 있으므로 아이 배변 상태에 따라 용량 조절."},
  {id:104, category:"면역/항산화", name:"시아플렉스 에프", role:"안토시아닌-다당체 (면역 및 항산화)",
   status:"복용중", dosage:"적정량", startDate:"2026-04", endDate:"", note:"플러스 알파용 면역 케어. 기존 루틴 유지 무방."},
  {id:105, category:"필수 지방산/보조", name:"미라클 에뮤오일", role:"오메가 지방산 보충",
   status:"복용중", dosage:"2알", startDate:"2026-01", endDate:"", note:"대구간유와 역할이 다소 중복됨. 아이가 먹기 힘들어하면 제외 가능 (선택사항)."},
];

export const SAMPLE_PHARMACIST_NOTES = [
  "[아연 중복 주의] '프라이멀 뉴트라'와 '차일드라이프'에 모두 아연이 있어 총 함량이 과다하지 않은지 체크 필요합니다.",
  "[마그네슘 모니터링] '차일드라이프' 섭취 후 아이 변이 묽어진다면 급여량을 조금 줄여주시는 것이 좋습니다.",
  "[비타민D 단독 보충 권장] 현재 조합에서 비타민D가 부족할 수 있으니 추후 액상 드롭스 형태 추가를 추천합니다.",
];

// ───── 신규 등록/수정 폼 초기값 ─────
// ScanScreen과 EditPrescriptionScreen이 공유.
export const EMPTY_MED = {
  name: "", dosageAmt: "", dosageUnit: "mL",
  times: "하루 3회", days: 3,
  category: "기타", form: "시럽", comment: "",
};
export const DOSAGE_UNITS = ["mL","mg","g","정","포","캡슐","방울","패치"];

// ───── 아이 프로필 폴백 ─────
export const DEFAULT_CHILD_PROFILE = {
  name:"이준서", birth:"2020-03-15", gender:"남", bloodType:"A+",
  height:110, weight:18.5,
  allergy:"페니실린 계열 항생제",
  notes:"편식이 심해서 약 먹이기 힘듦",
  heightLog:[
    {date:"2025-02-01",value:110},{date:"2024-08-01",value:106},{date:"2024-02-01",value:101},
  ],
  weightLog:[
    {date:"2025-02-01",value:18.5},{date:"2024-08-01",value:17.2},{date:"2024-02-01",value:15.8},
  ],
};
