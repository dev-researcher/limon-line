import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAc2oNP3GegJXDdDtAfZ-8Dfnd1UYMZDRo",
  authDomain: "sistema-reservas-1c8ef.firebaseapp.com",
  projectId: "sistema-reservas-1c8ef",
  storageBucket: "sistema-reservas-1c8ef.firebasestorage.app",
  messagingSenderId: "587337350736",
  appId: "1:587337350736:web:adb7cd648ed461cc759b55",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
