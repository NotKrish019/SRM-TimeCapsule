// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDePsWXNneNzaRaJfKj6Eq-yI3NyIBgvRI",
  authDomain: "srm-timecapsule.firebaseapp.com",
  projectId: "srm-timecapsule",
  storageBucket: "srm-timecapsule.firebasestorage.app",
  messagingSenderId: "611215462807",
  appId: "1:611215462807:web:e2045dbfde483aa833f4d2",
  measurementId: "G-3NGVETMPQ3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
