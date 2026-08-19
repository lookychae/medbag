// 처방전 수정 화면 — PrescriptionForm 얇게 감싼 어댑터.
// 저장 시 rx의 id/accent는 보존.
import { parseDosage } from "./utils";
import PrescriptionForm from "./PrescriptionForm";

export default function EditPrescriptionScreen({ rx, onCancel, onSave, prescriptions = [] }) {
  // rx.medicines는 dosage 문자열 → 폼용으로 amt/unit 분리해서 넣어줌.
  const initialForm = {
    ...rx,
    medicines: rx.medicines.map(m => {
      const p = parseDosage(m.dosage);
      return { ...m, dosageAmt: m.dosageAmt || p.amt, dosageUnit: m.dosageUnit || p.unit };
    }),
  };
  return (
    <PrescriptionForm
      title="처방전 수정"
      subtitle="내용을 수정하고 저장하세요"
      icon="✏️"
      initialForm={initialForm}
      // 자기 자신은 병원 자동완성 후보에서 제외 (같은 처방전 병원명이 중복 제안 안 뜨게).
      prescriptions={prescriptions.filter(p => p.id !== rx.id)}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}
