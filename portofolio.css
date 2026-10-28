import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ===== 1. KODE FIREBASE (MENGAMBIL DATA DARI ADMIN) =====
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

        // --- PROJECTS ---
        const projSnap = await getDoc(doc(db, 'portfolio', 'projects'));
        if (projSnap.exists()) {
            const items = projSnap.data().items || [];
            renderPublicProjects(items);
        }

        // --- Contact / Email ---
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

// ===== 2. FUNGSI MENAMPILKAN PROJECT SEBAGAI KOLASE (FRAME) =====
function renderPublicProjects(items) {
    const projectsSection = document.querySelector('#projects');
    if (!projectsSection) return;

    // Hapus kotak-kotak lama bawaan HTML
    const oldShowcases = projectsSection.querySelectorAll('.showcase');
    oldShowcases.forEach(el => el.remove());

    // Kelompokkan per kategori
    const grouped = {};
    items.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
    });

    const catNames = {
        social: 'Social Media', print: 'Print Media', illustration: 'Illustrations',
        branding: 'Branding', web: 'Web & UI'
    };

    for (const cat in grouped) {
        const showcase = document.createElement('div');
        showcase.className = 'showcase reveal visible';

        let tilesHtml = '';
        
        grouped[cat].forEach((p) => {
            // Menggunakan class 'project-tile-custom' yang ada di CSS
            tilesHtml += `
                <div class="tile project-tile-custom" title="${p.description || ''}">
                    ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : ''}
                    <span>${p.title}</span>
                </div>
            `;
        });

        showcase.innerHTML = `
            <div class="slide-head"><span>Portfolio</span><span>${catNames[cat] || cat}</span></div>
            <h3 class="showcase-title">${catNames[cat]} <span class="script">Projects</span></h3>
            <div class="collage" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; grid-auto-rows: auto;">
                ${tilesHtml}
            </div>
        `;
        projectsSection.appendChild(showcase);
    }
}

document.addEventListener('DOMContentLoaded', loadPortfolioContent);

// ===== 3. KODE ASLI KAMU (MENU & ANIMASI) =====
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

    if (menuToggle) {
        menuToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('active')));
    }
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

    // --- Highlight menu ---
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
