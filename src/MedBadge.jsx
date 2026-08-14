// 약 용량을 표시하는 chip. Chip을 얇게 감싼 어댑터.
// 카테고리별 컬러로 강도 힌트를 주고, 어떤 길이든 (0.333 mL 같은) 안 잘림.
import Chip from "./Chip";

export default function MedBadge({ dosage, color = "#64C8FF", small = false }) {
  return <Chip color={color} small={small}>{dosage}</Chip>;
}
