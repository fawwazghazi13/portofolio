import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadProjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const container = document.getElementById('project-content');
    if (!projectId) { container.innerHTML = '<h1>Project tidak ditemukan.</h1><a href="projects.html" class="btn primary" style="margin-top:20px;">Kembali</a>'; return; }
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'projects'));
        if (snap.exists()) {
            const items = snap.data().items || [];
            const project = items.find(p => p.id === projectId);
            if (project) {
                let videoHtml = '';
                if (project.videoUrl) {
                    let isDirectVideo = project.videoUrl.match(/\.(mp4|webm|ogg)$/i) || project.videoUrl.includes('firebasestorage') || project.videoUrl.includes('cloudinary');
                    if (isDirectVideo) {
                        videoHtml = `<div class="video-container" style="padding-bottom: 56.25%; position: relative;"><video src="${project.videoUrl}" controls autoplay muted loop style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; background: #000; border-radius: 8px;"></video></div>`;
                    } else {
                        let videoId = ''; if (project.videoUrl.includes('watch?v=')) videoId = project.videoUrl.split('v=')[1].split('&')[0]; else if (project.videoUrl.includes('youtu.be/')) videoId = project.videoUrl.split('youtu.be/')[1].split('?')[0];
                        if (videoId) videoHtml = `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
                    }
                }
                document.title = project.title + " | Portofolio";
                container.innerHTML = `
                    <a href="projects.html" class="btn-back" style="color: var(--accent); text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 20px;">&larr; Kembali ke Projects</a>
                    <h1 style="font-family: var(--font-heading); font-size: 3rem; margin: 10px 0; color: #fff;">${project.title}</h1>
                    <p style="color: var(--accent); margin-bottom: 20px;">Kategori: ${project.category.toUpperCase()} | Tags: ${project.tags}</p>
                    ${project.imageUrl ? `<img src="${project.imageUrl}" class="project-detail-image reveal" alt="${project.title}">` : ''}
                    <p style="color: var(--muted); font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px;" class="reveal">${project.description}</p>
                    ${videoHtml}
                `;
            } else { container.innerHTML = '<h1>Project tidak ditemukan.</h1>'; }
        }
    } catch (error) { console.error(error); }
}

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

        document.querySelectorAll('a, button, .btn').forEach(el => {
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
    loadProjectDetail();
    const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto:"]):not([target="_blank"])');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href'); if (!href || href.startsWith('javascript:')) return;
            e.preventDefault(); document.body.classList.add('page-exit'); setTimeout(() => { window.location.href = href; }, 400);
        });
    });
});
