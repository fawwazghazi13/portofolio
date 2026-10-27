import { auth, db } from './firebase-config.js';
import { 
    GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');

// Login
googleLoginBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        loginError.textContent = "Login gagal: " + error.message;
    }
});

// Logout
logoutBtn.addEventListener('click', () => signOut(auth));

// Pantau status login
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("UID kamu:", user.uid); // Catat UID ini untuk Security Rules
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        // Muat data About yang sudah ada
        const docSnap = await getDoc(doc(db, "portfolio", "about"));
        if (docSnap.exists()) {
            document.getElementById('about-text').value = docSnap.data().text || '';
        }
    } else {
        loginSection.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

// Simpan About
document.getElementById('form-about').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newText = document.getElementById('about-text').value;
    try {
        await setDoc(doc(db, "portfolio", "about"), {
            text: newText,
            updatedAt: new Date()
        }, { merge: true });
        alert("About berhasil disimpan!");
    } catch (error) {
        alert("Gagal menyimpan: " + error.message);
    }
});