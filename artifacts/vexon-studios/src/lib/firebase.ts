import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "vexon-v1.firebaseapp.com",
  projectId: "vexon-v1",
  storageBucket: "vexon-v1.firebasestorage.app",
  messagingSenderId: "615686931516",
  appId: "1:615686931516:web:a1bda2468b48b7d615ef39",
  measurementId: "G-MD6PT2Y4MJ",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
