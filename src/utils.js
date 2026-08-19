// 여러 화면에서 재사용되는 헬퍼.
import { CAT_COLOR } from "./constants";

// 카테고리 색 폴백 헬퍼. "기타"/미지정도 브랜드 액센트 시안으로.
export const catColor = (m) => CAT_COLOR[m?.category] || "#64C8FF";

// "5mL", "0.333 mg" 같은 문자열을 {amt, unit}으로 분리.
// 백엔드가 dosage 문자열로 주기 때문에 폼에 채울 때 다시 나눠야 함.
export function parseDosage(s) {
  if (!s) return { amt: "", unit: "mL" };
  const m = String(s).match(/^(\d+\.?\d*)\s*(.*)$/);
  return m ? { amt: m[1], unit: (m[2] || "mL").trim() } : { amt: "", unit: "mL" };
}

// 기존 처방전에서 병원별 최근 정보 뽑기 (중복 제거, 최신순, 최대 8개).
// HospitalPicker · HospitalInput 자동완성에서 공유.
export function getRecentHospitals(prescriptions = []) {
  const seen = new Map();
  const sorted = [...prescriptions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  for (const rx of sorted) {
    if (!rx.hospital) continue;
    if (seen.has(rx.hospital)) continue;
    seen.set(rx.hospital, {
      hospital: rx.hospital,
      doctor: rx.doctor || "",
      accent: rx.accent || "#F97316",
      lastDate: rx.date || "",
    });
  }
  return Array.from(seen.values()).slice(0, 8);
}
