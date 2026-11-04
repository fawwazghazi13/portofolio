import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadAllCertificates() {
    const container = document.getElementById('all-certificates-container');
    if (!container) return;
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'certificates'));
        if (snap.exists()) {
            const items = snap.data().items || [];
            if(items.length === 0) { container.innerHTML = '<h3 style="text-align:center; color:var(--muted); grid-column: 1 / -1;">Belum ada sertifikat.</h3>'; return; }
            container.innerHTML = '';
            items.forEach((item) => {
                const card = document.createElement('div');
                card.className = 'cert-card';
                card.innerHTML = `
                    <div class="cert-image-wrapper">
                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}">` : '<div style="background:#222;width:100%;height:100%;"></div>'}
                        <div class="cert-overlay"></div>
                    </div>
                    <div class="cert-info">
                        <h3>${item.title}</h3>
                        <div class="cert-issuer-row"><span>${item.issuer}</span><span>${item.date}</span></div>
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

function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.classList.add('scroll-progress');
    document.body.appendChild(progressBar);
    window.addEventListener('scroll', () => {
        let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        let scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    });
}

function initTiltEffect() {
    if (window.matchMedia("(pointer: fine)").matches) {
        const cards = document.querySelectorAll('.cert-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; const y = e.clientY - rect.top;
                const centerX = rect.width / 2; const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -8; const rotateY = ((x - centerX) / centerX) * 8;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
            });
        });
    }
}

// FUNGSI KHUSUS 3D MEDAL (DRAG)
function initNewInteractive3DCert() {
    const wrapper = document.getElementById('interactive-3d-cert');
    if (!wrapper) return;
    const obj = wrapper.querySelector('.medal-3d');
    
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let currentRotationX = 0, currentRotationY = 0;

    wrapper.addEventListener('mousedown', (e) => {
        isDragging = true; prevX = e.clientX; prevY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let deltaX = e.clientX - prevX;
        let deltaY = e.clientY - prevY;
        currentRotationY += deltaX * 0.6;
        currentRotationX -= deltaY * 0.6;
        gsap.set(obj, { rotationX: currentRotationX, rotationY: currentRotationY });
        prevX = e.clientX; prevY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            gsap.to(obj, { rotationX: currentRotationX + 10, rotationY: currentRotationY + 10, duration: 1.5, ease: "power3.out" });
            currentRotationX += 10; currentRotationY += 10;
        }
    });
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
        document.querySelectorAll('a, button, .cert-card, #interactive-3d-cert').forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
        });
    }
    
    initTiltEffect();
    initNewInteractive3DCert(); // Panggil fungsi 3D Drag di sini
}

window.addEventListener('load', async () => {
    initScrollProgress();
    
    let progress = { val: 0 };
    const preloaderText = document.querySelector('.preloader-text'); const preloaderBar = document.querySelector('.preloader-bar-fill');
    
    gsap.set(['.slide-title', '.section-label', '#all-certificates-container'], { opacity: 0, y: 30 });

    let tlProgress = gsap.to(progress, { val: 80, duration: 1.2, ease: "power2.out", onUpdate: () => { if(preloaderText) preloaderText.innerText = Math.round(progress.val) + '%'; if(preloaderBar) preloaderBar.style.width = progress.val + '%'; } });
    await loadAllCertificates();
    tlProgress.kill();

    gsap.to(progress, { 
        val: 100, duration: 0.5, ease: "power2.in", 
        onUpdate: () => { if(preloaderText) preloaderText.innerText = Math.round(progress.val) + '%'; if(preloaderBar) preloaderBar.style.width = progress.val + '%'; }, 
        onComplete: () => {
            const tl = gsap.timeline({
                onComplete: () => {
                    document.getElementById('preloader').style.display = 'none';
                    initPremiumFeatures();
                    initTiltEffect();
                }
            });
            tl.to('#preloader', { opacity: 0, scale: 1.1, filter: "blur(10px)", duration: 0.8, ease: "power2.inOut" })
              .to('.slide-title, #all-certificates-container', { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
              .to('.section-label', { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, "-=0.8");
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
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
