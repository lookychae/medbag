import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SAMPLE_PRESCRIPTIONS, DEFAULT_CHILD_PROFILE } from "./constants";

export default function useFirestore() {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState(SAMPLE_PRESCRIPTIONS);
  const [memos, setMemos] = useState({});
  const [childProfile, setChildProfile] = useState(DEFAULT_CHILD_PROFILE);

  useEffect(() => {
    const load = async () => {
      try {
        const [rxDoc, memosDoc, childDoc] = await Promise.all([
          getDoc(doc(db,"medbag","prescriptions")),
          getDoc(doc(db,"medbag","memos")),
          getDoc(doc(db,"medbag","child")),
        ]);
        if (rxDoc.exists())    setPrescriptions(rxDoc.data().list);
        if (memosDoc.exists()) setMemos(memosDoc.data().map);
        if (childDoc.exists()) setChildProfile(childDoc.data());
      } catch(e) {
        console.log("Firebase 로드 오류:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async (collection, data, setter) => {
    setter(data);
    try {
      await setDoc(doc(db,"medbag",collection), data);
    } catch(e) { console.log(e); }
  };

  const savePrescriptions = (data) => save("prescriptions", {list:data}, setPrescriptions);
  const saveMemos = (data) => save("memos", {map:data}, setMemos);
  const saveChildProfile = (data) => save("child", data, setChildProfile);

  return { loading, prescriptions, memos, childProfile, savePrescriptions, saveMemos, saveChildProfile };
}
