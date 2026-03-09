javascriptimport { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCfOFzjCiCqDRhnmNldyr7SzOStfZ4z174",
  authDomain: "medbag-b7f3c.firebaseapp.com",
  projectId: "medbag-b7f3c",
  storageBucket: "medbag-b7f3c.firebasestorage.app",
  messagingSenderId: "804247502285",
  appId: "1:804247502285:web:ba35e23819fcbfb550d884"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);