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
                        videoCardsHtml += `<a href="project.html?id=${p.id}" class="video-item-card" title="Tonton: ${p.title}">${displayImage ? `<img src="${displayImage}" alt="${p.title}">` : ''}<div class="play-icon">▶</div><span style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.8); color:#fff; padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:bold; z-index:2;">${p.title}</span></a>`;
                    });
                    const duplicatedCards = videoCardsHtml + videoCardsHtml;
                    showcase.innerHTML = `<div class="slide-head"><span>Portfolio</span><span>${catNames[cat] || cat}</span></div><h3 class="showcase-title">${catNames[cat]} <span class="script">Showreel</span></h3><div class="video-marquee-wrapper"><div class="video-marquee-track">${duplicatedCards}</div></div>`;
                } else {
                    let tilesHtml = '';
                    grouped[cat].forEach((p) => { tilesHtml += `<a href="project.html?id=${p.id}" class="tile project-tile-custom reveal" title="${p.title}">${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : ''}<span>${p.title}</span></a>`; });
                    showcase.innerHTML = `<div class="slide-head"><span>Portfolio</span><span>${catNames[cat] || cat}</span></div><h3 class="showcase-title">${catNames[cat]} <span class="script">Projects</span></h3><div class="collage" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; grid-auto-rows: auto;">${tilesHtml}</div>`;
                }
                container.appendChild(showcase);
            }
        }
    } catch (err) { console.error(err); }
}

function getYouTubeId(url) { if (!url) return ''; if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]; if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]; return ''; }

function initPremiumFeatures() {
    if (window.matchMedia("(pointer: fine)").matches) {
        if (document.querySelector('.cursor-dot')) return; // Cegah duplikasi

        const cursorDot = document.createElement('div'); cursorDot.classList.add('cursor-dot');
        const cursorOutline = document.createElement('div'); cursorOutline.classList.add('cursor-outline');
        document.body.appendChild(cursorDot); document.body.appendChild(cursorOutline);

        const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const mouse = { x: pos.x, y: pos.y };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            cursorDot.style.left = mouse.x + 'px';
            cursorDot.style.top = mouse.y + 'px';
        });

        gsap.ticker.add(() => {
            pos.x += (mouse.x - pos.x) * 0.25;
            pos.y += (mouse.y - pos.y) * 0.25;
            cursorOutline.style.left = pos.x + 'px';
            cursorOutline.style.top = pos.y + 'px';
        });

        document.querySelectorAll('a, button, .btn, .video-item-card, .tile').forEach(el => {
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
    loadAllProjects();
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
