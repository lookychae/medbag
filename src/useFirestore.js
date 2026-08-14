// 메디백 모든 Firestore 읽기/쓰기를 통합한 훅.
//
// 데이터 모델 (사용자별):
//   users/{uid}/medbag/prescriptions   처방전 배열 { list: [...] }
//   users/{uid}/medbag/memos           부모 메모 { map: {id: text} }
//   users/{uid}/medbag/child           아이 정보 + 성장 로그
//   users/{uid}/medbag/supplements     영양제 목록
//   users/{uid}/medbag/pharmacistNotes 약사 복약 지도
//
// userId가 없으면(로그아웃 상태) 시드 데이터만 표시, 저장 안 함.
import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SAMPLE_PRESCRIPTIONS, DEFAULT_CHILD_PROFILE, SAMPLE_SUPPLEMENTS, SAMPLE_PHARMACIST_NOTES } from "./constants";

export default function useFirestore(userId) {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState(SAMPLE_PRESCRIPTIONS);
  const [memos, setMemos] = useState({});
  const [childProfile, setChildProfile] = useState(DEFAULT_CHILD_PROFILE);
  const [supplements, setSupplements] = useState(SAMPLE_SUPPLEMENTS);
  const [pharmacistNotes, setPharmacistNotes] = useState(SAMPLE_PHARMACIST_NOTES);

  const base = userId ? ["users", userId, "medbag"] : null;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const load = async () => {
      try {
        const [rxDoc, memosDoc, childDoc, supDoc, notesDoc] = await Promise.all([
          getDoc(doc(db, ...base, "prescriptions")),
          getDoc(doc(db, ...base, "memos")),
          getDoc(doc(db, ...base, "child")),
          getDoc(doc(db, ...base, "supplements")),
          getDoc(doc(db, ...base, "pharmacistNotes")),
        ]);
        if (rxDoc.exists())    setPrescriptions(rxDoc.data().list || []);
        else                    setPrescriptions([]);
        if (memosDoc.exists()) setMemos(memosDoc.data().map || {});
        else                    setMemos({});
        if (childDoc.exists()) setChildProfile(childDoc.data());
        else                    setChildProfile(DEFAULT_CHILD_PROFILE);
        if (supDoc.exists())   setSupplements(supDoc.data().list || []);
        else                    setSupplements([]);
        if (notesDoc.exists()) setPharmacistNotes(notesDoc.data().list || []);
        else                    setPharmacistNotes([]);
      } catch(e) {
        console.log("Firebase 로드 오류:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const savePrescriptions = (list) => {
    setPrescriptions(list);
    if (!base) return;
    setDoc(doc(db, ...base, "prescriptions"), {list}).catch(console.log);
  };
  const saveMemos = (map) => {
    setMemos(map);
    if (!base) return;
    setDoc(doc(db, ...base, "memos"), {map}).catch(console.log);
  };
  const saveChildProfile = (data) => {
    setChildProfile(data);
    if (!base) return;
    setDoc(doc(db, ...base, "child"), data).catch(console.log);
  };
  const saveSupplements = (list) => {
    setSupplements(list);
    if (!base) return;
    setDoc(doc(db, ...base, "supplements"), {list}).catch(console.log);
  };
  const savePharmacistNotes = (list) => {
    setPharmacistNotes(list);
    if (!base) return;
    setDoc(doc(db, ...base, "pharmacistNotes"), {list}).catch(console.log);
  };

  return {
    loading, prescriptions, memos, childProfile, supplements, pharmacistNotes,
    savePrescriptions, saveMemos, saveChildProfile, saveSupplements, savePharmacistNotes,
  };
}
