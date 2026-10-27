// ===== 1. KODE FIREBASE (DARI ADMIN PANEL) =====
import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadPortfolioContent() {
    try {
        // --- Profile & About ---
        const aboutSnap = await getDoc(doc(db, 'portfolio', 'about'));
        if (aboutSnap.exists()) {
            const d = aboutSnap.data();
            const elGreeting = document.querySelector('.greeting');
            const elDesc = document.querySelector('.description');
            const elAbout = document.querySelector('.about-content p');
            const elImg = document.querySelector('.hero-image img');
            const elName = document.querySelectorAll('.slide-head span')[1];

            if (d.greeting && elGreeting) elGreeting.textContent = d.greeting;
            if (d.name && elName) elName.textContent = d.name;
            if (d.description && elDesc) elDesc.textContent = d.description;
            if (d.aboutText && elAbout) elAbout.textContent = d.aboutText;
            if (d.profileImage && elImg) elImg.src = d.profileImage;
        }

        // --- Skills ---
        const skillsSnap = await getDoc(doc(db, 'portfolio', 'skills'));
        if (skillsSnap.exists()) {
            const items = skillsSnap.data().items || [];
            const container = document.querySelector('.skills-container');
            if (container) {
                container.innerHTML = items.map(s => `
                    <li class="skill-card">
                        <h4>${s.title}</h4>
                        <p>${s.description}</p>
                    </li>
                `).join('');
            }
        }

        // --- Software ---
        const swSnap = await getDoc(doc(db, 'portfolio', 'software'));
        if (swSnap.exists()) {
            const items = swSnap.data().items || [];
            const grid = document.querySelector('.software-grid');
            if (grid) {
                grid.innerHTML = items.map(s => `
                    <div class="sw" title="${s.name}" style="color:${s.color};border-color:${s.color}; background: #222;">
                        ${s.label}
                    </div>
                `).join('');
            }
        }

        // --- Contact ---
        const contactSnap = await getDoc(doc(db, 'portfolio', 'contact'));
        if (contactSnap.exists()) {
            const d = contactSnap.data();
            const emailBtn = document.querySelector('.contact .btn.primary');
            if (emailBtn && d.email) emailBtn.href = 'mailto:' + d.email;
        }

    } catch (err) {
        console.error('Gagal memuat konten Firebase:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadPortfolioContent);

// ===== 2. KODE ASLI KAMU (MENU & ANIMASI) =====
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    // --- Menu mobile ---
    function setMenu(open) {
        navLinks.classList.toggle('active', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.textContent = open ? '✕' : '☰';
    }

    menuToggle.addEventListener('click', () => {
        setMenu(!navLinks.classList.contains('active'));
    });

    links.forEach(link => link.addEventListener('click', () => setMenu(false)));

    // --- Tahun otomatis di footer ---
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // --- Animasi muncul saat scroll ---
    const targets = document.querySelectorAll(
        '.section-label, .slide-title, .about-content, .hero-image, .paper-card, ' +
        '.showcase, .project-card, .thanks-title, .contact-text, .contact .btn'
    );
    const tiles = document.querySelectorAll('.tile');

    targets.forEach(el => el.classList.add('reveal'));

    tiles.forEach((tile, i) => {
        tile.classList.add('reveal');
        tile.style.transitionDelay = (i % 6) * 80 + 'ms';
    });

    const all = [...targets, ...tiles];

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        all.forEach(el => revealObserver.observe(el));
    } else {
        all.forEach(el => el.classList.add('visible'));
    }

    // --- Highlight menu sesuai section yang sedang dilihat ---
    const sections = document.querySelectorAll('section[id]');
    const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(l => {
                    l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
                });
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => navObserver.observe(s));
});