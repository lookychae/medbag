// 병원명 입력 + 자동완성 + onBlur "병원" 자동 부착.
// ScanScreen 등록·EditPrescriptionScreen 수정 양쪽에서 공유.
import { useState, useMemo } from "react";
import { DARK_INPUT } from "./theme";
import { getRecentHospitals } from "./utils";

const CLINIC_SUFFIXES = ["병원", "의원", "클리닉", "센터", "한의원", "보건소", "요양원"];

export default function HospitalInput({ value, onChange, onDoctorAutofill, prescriptions = [], placeholder = "서울아동병원" }) {
  const [showHint, setShowHint] = useState(false);
  const known = useMemo(() => getRecentHospitals(prescriptions), [prescriptions]);
  const matches = useMemo(() => {
    const q = (value || "").trim();
    if (!q) return [];
    return known
      .filter(h => h.hospital !== q && h.hospital.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5);
  }, [value, known]);

  const pick = (h) => {
    onChange(h.hospital);
    if (onDoctorAutofill && h.doctor) onDoctorAutofill(h.doctor);
    setShowHint(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text" value={value || ""} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setShowHint(true); }}
        onFocus={() => setShowHint(true)}
        onBlur={e => {
          // 리스트 클릭할 시간을 잠깐 준 뒤 hint 닫기.
          setTimeout(() => setShowHint(false), 150);
          const v = e.target.value.trim();
          if (v && !CLINIC_SUFFIXES.some(s => v.endsWith(s))) onChange(v + "병원");
        }}
        style={{ ...DARK_INPUT, fontSize: 16 }}
      />
      {showHint && matches.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10,
          background: "white", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          padding: "6px 0", maxHeight: 220, overflowY: "auto",
        }}>
          {matches.map(h => (
            <button
              key={h.hospital} type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => pick(h)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: "transparent", border: "none", cursor: "pointer",
                padding: "10px 14px", textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>🏥</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.hospital}</div>
                {h.doctor && <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 1 }}>{h.doctor}</div>}
              </div>
              {h.lastDate && <div style={{ fontSize: 10, color: "#C7C7CC", fontWeight: 700 }}>{h.lastDate.slice(5).replace("-", "/")}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
