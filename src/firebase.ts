import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase App Config from provisioned environment
const firebaseConfig = {
  projectId: "resonant-loop-rdzmz",
  appId: "1:681675716008:web:086e4875be2955c950d99d",
  apiKey: "AIzaSyCyh_de-T_A_oFOiESM73KcTKH6xmIObH8",
  authDomain: "resonant-loop-rdzmz.firebaseapp.com",
  databaseId: "ai-studio-38aeaf3a-31bf-4814-9912-f395012d94b0",
  storageBucket: "resonant-loop-rdzmz.firebasestorage.app",
  messagingSenderId: "681675716008"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.databaseId);
export const storage = getStorage(app);
