export const FORM_ICON = {
  "시럽":"🧴","분말":"🫙","정제":"💊","캡슐":"💊",
  "좌약":"🩺","연고":"🪶","흡입":"💨","점안":"👁","기타":"💊",
};

export const CAT_COLOR = {
  "항생제":"#EF4444","해열진통제":"#F97316","거담제":"#6366F1",
  "항히스타민제":"#10B981","소화제":"#F59E0B","기관지확장제":"#3B82F6",
  "스테로이드":"#8B5CF6","외용제":"#06B6D4","유산균":"#84CC16","기타":"#9CA3AF",
};

export const ACCENT_COLORS = ["#F97316","#EF4444","#3B82F6","#10B981","#8B5CF6","#6366F1"];

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
