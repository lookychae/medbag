import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";

// authDomain을 배포 도메인과 동일하게 두어야 iOS PWA에서 OAuth 리다이렉트가
// 같은 오리진 안에서 완료되어 세션이 유지된다.
const firebaseConfig = {
  apiKey: "AIzaSyCfOFzjCiCqDRhnmNldyr7SzOStfZ4z174",
  authDomain: "medbag-b7f3c.web.app",
  projectId: "medbag-b7f3c",
  storageBucket: "medbag-b7f3c.firebasestorage.app",
  messagingSenderId: "804247502285",
  appId: "1:804247502285:web:ba35e23819fcbfb550d884"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
// iOS PWA에서 리다이렉트 후에도 로그인이 유지되도록 명시적 영구 저장.
setPersistence(auth, indexedDBLocalPersistence).catch(() => setPersistence(auth, browserLocalPersistence));
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
