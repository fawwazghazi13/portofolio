import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadPortfolioContent() {
    try {
        // --- Bagian About & Profile ---
        const aboutSnap = await getDoc(doc(db, 'portfolio', 'about'));
        if (aboutSnap.exists()) {
            const d = aboutSnap.data();
            if (d.greeting) document.querySelector('.greeting').textContent = d.greeting;
            if (d.name) document.querySelectorAll('.slide-head span')[1].textContent = d.name;
            if (d.description) document.querySelector('.description').textContent = d.description;
            
            // GANTI TEKS LOADING DENGAN DATA ASLI
            if (d.aboutText) {
                document.querySelector('.about-content p').textContent = d.aboutText;
            } else {
                document.querySelector('.about-content p').textContent = "Halo! Saya Ghazi. (Data About belum diisi di Admin Panel).";
            }
            
            if (d.profileImage) {
                document.querySelector('.hero-image img').src = d.profileImage;
            }
        } else {
            // Kalau data 'about' belum ada di Firebase
            document.querySelector('.about-content p').textContent = "Data About belum dibuat. Silakan login ke Admin Panel dan simpan Profile.";
        }

        // --- Bagian Skills ---
        const skillsSnap = await getDoc(doc(db, 'portfolio', 'skills'));
        if (skillsSnap.exists()) {
            const items = skillsSnap.data().items || [];
            if(items.length > 0) {
                document.querySelector('.skills-container').innerHTML = items.map(s => `<li class="skill-card"><h4>${s.title}</h4><p>${s.description}</p></li>`).join('');
            } else {
                document.querySelector('.skills-container').innerHTML = '<li class="skill-card"><h4>Belum ada skill</h4><p>Tambahkan di Admin Panel.</p></li>';
            }
        }

        // --- Bagian Software ---
        const swSnap = await getDoc(doc(db, 'portfolio', 'software'));
        if (swSnap.exists()) {
            const items = swSnap.data().items || [];
            if (items.length > 0) {
                document.querySelector('.software-grid').innerHTML = items.map(s => `<div class="sw" title="${s.name}" style="color:${s.color};border-color:${s.color}; background: #222;">${s.label}</div>`).join('');
            } else {
                document.querySelector('.software-grid').innerHTML = '<div class="sw" style="border-color:#666; color:#666;">-</div>';
            }
        }

        // --- Bagian Contact ---
        const contactSnap = await getDoc(doc(db, 'portfolio', 'contact'));
        if (contactSnap.exists()) {
            const d = contactSnap.data();
            const emailBtn = document.getElementById('contact-email-btn');
            if (emailBtn && d.email) {
                emailBtn.href = `mailto:${d.email}?subject=Halo, saya tertarik dengan portofolio Anda`;
            }
        }
    } catch (err) { 
        console.error('Gagal memuat:', err); 
        // Jika error (misal rules Firebase salah), tampilkan pesan di web
        document.querySelector('.about-content p').textContent = "Gagal memuat data. Periksa Console (F12) untuk detail error.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioContent();

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });
    }
    const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
});

document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto:"]):not([target="_blank"])');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('javascript:')) return;
            e.preventDefault();
            document.body.classList.add('page-exit');
            setTimeout(() => { window.location.href = href; }, 400);
        });
    });
});
