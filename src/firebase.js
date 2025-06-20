// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, get, off, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAIAl0rumgyoWEeMlYSmazyCemUedncLC8",
  authDomain: "barierfid.firebaseapp.com",
  databaseURL: "https://barierfid-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "barierfid",
  storageBucket: "barierfid.firebasestorage.app",
  messagingSenderId: "1078930232172",
  appId: "1:1078930232172:web:9734147daf220c5f351949"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, push, onValue, get, off, remove };
