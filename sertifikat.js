import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadAllCertificates() {
    const container = document.getElementById('all-certificates-container');
    if (!container) return;

    try {
        const snap = await getDoc(doc(db, 'portfolio', 'certificates'));
        if (snap.exists()) {
            const items = snap.data().items || [];
            if(items.length === 0) {
                container.innerHTML = '<h3 style="text-align:center; color:var(--muted); grid-column: 1 / -1;">Belum ada sertifikat.</h3>';
                return;
            }

            container.innerHTML = '';
            items.forEach((item) => {
                const card = document.createElement('div');
                card.className = 'cert-card reveal';
                card.innerHTML = `
                    <div class="cert-image-wrapper">
                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;">No Image</div>'}
                    </div>
                    <div class="cert-info">
                        <h3>${item.title}</h3>
                        <div class="cert-issuer">
                            <span>${item.issuer}</span>
                            <span>${item.date}</span>
                        </div>
                        ${item.credentialUrl ? `<a href="${item.credentialUrl}" target="_blank" class="cert-btn">Lihat Kredensial ↗</a>` : ''}
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<h3 style="text-align:center; color:red; grid-column: 1 / -1;">Gagal memuat sertifikat.</h3>';
    }
}

function initPremiumFeatures() {
    if (window.matchMedia("(pointer: fine)").matches) {
        if (document.querySelector('.cursor-dot')) return;
        const cursorDot = document.createElement('div'); cursorDot.classList.add('cursor-dot');
        const cursorOutline = document.createElement('div'); cursorOutline.classList.add('cursor-outline');
        document.body.appendChild(cursorDot); document.body.appendChild(cursorOutline);
        const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; const mouse = { x: pos.x, y: pos.y };
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX; mouse.y = e.clientY;
            cursorDot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
        });
        gsap.ticker.add(() => {
            pos.x += (mouse.x - pos.x) * 0.25; pos.y += (mouse.y - pos.y) * 0.25;
            cursorOutline.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
        });
        document.querySelectorAll('a, button, .cert-card').forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
        });
    }
}

window.addEventListener('load', () => {
    let progress = { val: 0 };
    const preloaderText = document.querySelector('.preloader-text'); const preloaderBar = document.querySelector('.preloader-bar-fill');
    gsap.to('#preloader-logo', { rotation: 360, duration: 2, repeat: -1, ease: "linear" });
    
    gsap.to(progress, { val: 100, duration: 1.2, ease: "power2.inOut", onUpdate: () => { if(preloaderText) preloaderText.innerText = Math.round(progress.val) + '%'; if(preloaderBar) preloaderBar.style.width = progress.val + '%'; }, onComplete: () => {
        gsap.to('#preloader', { y: '-100%', duration: 0.8, ease: "power4.inOut", onComplete: () => { document.getElementById('preloader').style.display = 'none'; } });
    }});
    
    initPremiumFeatures();
    gsap.registerPlugin(ScrollTrigger);
    setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => {
            gsap.fromTo(el, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" } });
        });
    }, 100);
});

document.addEventListener('DOMContentLoaded', () => {
    loadAllCertificates();
    const menuToggle = document.getElementById('menuToggle'); const navLinks = document.querySelector('.nav-links');
    if (menuToggle) menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰'; });
    const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
    const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto:"]):not([target="_blank"])');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href'); if (!href || href.startsWith('javascript:')) return;
            e.preventDefault(); document.body.classList.add('page-exit'); setTimeout(() => { window.location.href = href; }, 400);
        });
    });
});