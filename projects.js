import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadAllProjects() {
    const container = document.getElementById('all-projects-container');
    if (!container) return;
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'projects'));
        if (snap.exists()) {
            const items = snap.data().items || [];
            if(items.length === 0) { container.innerHTML = '<h3 style="text-align:center; color:var(--muted);">Belum ada project.</h3>'; return; }
            const grouped = {};
            items.forEach(p => { if (!grouped[p.category]) grouped[p.category] = []; grouped[p.category].push(p); });
            const catNames = { social: 'Social Media', print: 'Print Media', illustration: 'Illustrations', branding: 'Branding', web: 'Web & UI', video: 'Video & Motion' };
            container.innerHTML = '';

            for (const cat in grouped) {
                const showcase = document.createElement('div'); showcase.className = 'showcase';
                if (cat === 'video') {
                    let videoCardsHtml = '';
                    grouped[cat].forEach((p) => {
                        let displayImage = p.imageUrl;
                        if (!displayImage && p.videoUrl) { let vid = getYouTubeId(p.videoUrl); if (vid) displayImage = `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`; }
                        videoCardsHtml += `<a href="project.html?id=${p.id}" class="video-item-card" title="Tonton: ${p.title}"><div class="video-card-inner">${displayImage ? `<img src="${displayImage}" alt="${p.title}" onerror="this.src='https://img.youtube.com/vi/${getYouTubeId(p.videoUrl)}/hqdefault.jpg'">` : ''}<div class="video-overlay"></div><div class="play-btn-wrapper"><div class="play-btn">▶</div></div><div class="video-title-badge">${p.title}</div></div></a>`;
                    });
                    const duplicatedCards = videoCardsHtml + videoCardsHtml;
                    showcase.innerHTML = `<div class="slide-head"><span>Portfolio</span><span>${catNames[cat] || cat}</span></div><h3 class="showcase-title">${catNames[cat]} <span class="script">Showreel</span></h3><div class="video-marquee-wrapper"><div class="video-marquee-track">${duplicatedCards}</div></div>`;
                } else {
                    let tilesHtml = '';
                    // PERBAIKAN: Hapus class 'reveal' dari kartu
                    grouped[cat].forEach((p) => { tilesHtml += `<a href="project.html?id=${p.id}" class="modern-project-card" title="${p.title}">${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : '<div style="background:#222;width:100%;height:100%;"></div>'}<div class="modern-project-overlay"></div><div class="modern-project-info"><h4>${p.title}</h4><span>${p.tags}</span></div></a>`; });
                    showcase.innerHTML = `<div class="slide-head"><span>Portfolio</span><span>${catNames[cat] || cat}</span></div><h3 class="showcase-title">${catNames[cat]} <span class="script">Projects</span></h3><div class="modern-project-grid">${tilesHtml}</div>`;
                }
                container.appendChild(showcase);
            }
        }
    } catch (err) { console.error(err); }
}

function getYouTubeId(url) { if (!url) return ''; if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]; if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]; return ''; }

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
        document.querySelectorAll('a, button, .btn, .video-item-card, .modern-project-card').forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
        });
    }
}

window.addEventListener('load', async () => {
    let progress = { val: 0 };
    const preloaderText = document.querySelector('.preloader-text'); 
    const preloaderBar = document.querySelector('.preloader-bar-fill');
    
    gsap.set(['.slide-title', '.section-label', '#all-projects-container'], { opacity: 0, y: 30 });

    // 1. Mulai loading bar ke 80% dengan cepat
    let tlProgress = gsap.to(progress, { 
        val: 80, duration: 1.2, ease: "power2.out", 
        onUpdate: () => { 
            if(preloaderText) preloaderText.innerText = Math.round(progress.val) + '%'; 
            if(preloaderBar) preloaderBar.style.width = progress.val + '%'; 
        } 
    });

    // 2. Tunggu data Firebase selesai dimuat
    await loadAllProjects(); 

    // 3. Selesaikan loading bar ke 100%
    tlProgress.kill();
    gsap.to(progress, { 
        val: 100, duration: 0.5, ease: "power2.in", 
        onUpdate: () => { 
            if(preloaderText) preloaderText.innerText = Math.round(progress.val) + '%'; 
            if(preloaderBar) preloaderBar.style.width = progress.val + '%'; 
        }, 
        onComplete: () => {
            const tl = gsap.timeline({
                onComplete: () => {
                    document.getElementById('preloader').style.display = 'none';
                    initPremiumFeatures();
                    // ScrollTrigger untuk element lain (jika ada) tetap jalan, tapi kartu project tidak perlu
                }
            });

            tl.to('#preloader', { opacity: 0, scale: 1.1, filter: "blur(10px)", duration: 0.8, ease: "power2.inOut" })
              .to('.slide-title, #all-projects-container', { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
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
