const firebaseConfig = {
  apiKey: "AIzaSyD1sCJ1JUjU7wjKHUHdJ97iS2m8aFU9zwY",
  authDomain: "portofolio-ghazi.firebaseapp.com",
  projectId: "portofolio-ghazi",
  storageBucket: "portofolio-ghazi.firebasestorage.app",
  messagingSenderId: "73693211475",
  appId: "1:73693211475:web:04e8b70a1f1638c8160fa6",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 3. Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
