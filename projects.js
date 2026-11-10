import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allProjects = [];
let currentFilter = 'all';

// ==========================================
// UI SOUND EFFECTS (WEB AUDIO API)
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playHoverSound() {
    if(!audioCtx || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
}

function playClickSound() {
    if(!audioCtx || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function attachSounds() {
    document.querySelectorAll('a, button, .modern-project-card, .video-item-card, .filter-btn').forEach(el => {
        el.removeEventListener('mouseenter', playHoverSound);
        el.removeEventListener('click', playClickSound);
        el.addEventListener('mouseenter', playHoverSound);
        el.addEventListener('click', playClickSound);
    });
}

// ==========================================
// FUNGSI UTAMA
// ==========================================
async function loadAllProjects() {
    const container = document.getElementById('all-projects-container');
    if (!container) return;
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'projects'));
        if (snap.exists()) {
            allProjects = snap.data().items || [];
            renderFilteredProjects();
        }
    } catch (err) { console.error(err); }
}

function renderFilteredProjects() {
    const container = document.getElementById('all-projects-container');
    if (!container) return;
    container.innerHTML = '';

    let filteredItems = allProjects;
    if (currentFilter !== 'all') {
        filteredItems = allProjects.filter(p => p.category === currentFilter);
    }

    if (filteredItems.length === 0) {
        container.innerHTML = '<h3 style="text-align:center; color:var(--muted); width:100%;">Belum ada project di kategori ini.</h3>';
        return;
    }

    const grouped = {};
    filteredItems.forEach(p => { if (!grouped[p.category]) grouped[p.category] = []; grouped[p.category].push(p); });
    const catNames = { social: 'Social Media', print: 'Print Media', illustration: 'Illustrations', branding: 'Branding', web: 'Web & UI', video: 'Video & Motion' };

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
            grouped[cat].forEach((p) => { 
                tilesHtml += `<a href="project.html?id=${p.id}" class="modern-project-card" title="${p.title}">${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : '<div style="background:#222;width:100%;height:100%;"></div>'}<div class="modern-project-overlay"></div><div class="card-scanline"></div><div class="card-hud-text">[ ID: ${p.id.slice(-4)} ]</div><div class="modern-project-info"><h4>${p.title}</h4><span>${p.tags}</span></div></a>`; 
            });
            showcase.innerHTML = `<div class="slide-head"><span>Portfolio</span><span>${catNames[cat] || cat}</span></div><h3 class="showcase-title">${catNames[cat]} <span class="script">Projects</span></h3><div class="modern-project-grid">${tilesHtml}</div>`;
        }
        container.appendChild(showcase);
    }
    
    attachSounds();
}

function getYouTubeId(url) { if (!url) return ''; if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]; if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]; return ''; }

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
        const cards = document.querySelectorAll('.modern-project-card, .video-item-card');
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

function initNewInteractive3DProject() {
    const wrapper = document.getElementById('interactive-3d-project');
    if (!wrapper) return;
    const obj = wrapper.querySelector('.stack-3d');
    let isDragging = false; let prevX = 0, prevY = 0;
    let currentRotationX = 0, currentRotationY = 0;

    wrapper.addEventListener('mousedown', (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let deltaX = e.clientX - prevX; let deltaY = e.clientY - prevY;
        currentRotationY += deltaX * 0.6; currentRotationX -= deltaY * 0.6;
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
        document.querySelectorAll('a, button, .btn, .modern-project-card, .video-item-card, #interactive-3d-project').forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
        });
    }
    
    initTiltEffect();
    initNewInteractive3DProject();
}

window.addEventListener('load', async () => {
    initScrollProgress();
    
    let progress = { val: 0 };
    const preloaderText = document.querySelector('.preloader-text'); const preloaderBar = document.querySelector('.preloader-bar-fill');
    
    gsap.set(['.slide-title', '.section-label', '.hud-frame'], { opacity: 0, y: 30 });

    let tlProgress = gsap.to(progress, { val: 80, duration: 1.2, ease: "power2.out", onUpdate: () => { if(preloaderText) preloaderText.innerText = Math.round(progress.val) + '%'; if(preloaderBar) preloaderBar.style.width = progress.val + '%'; } });
    await loadAllProjects();
    tlProgress.kill();

    gsap.to(progress, { 
        val: 100, duration: 0.5, ease: "power2.in", 
        onUpdate: () => { if(preloaderText) preloaderText.innerText = Math.round(progress.val) + '%'; if(preloaderBar) preloaderBar.style.width = progress.val + '%'; }, 
        onComplete: () => {
            const tl = gsap.timeline({
                onComplete: () => {
                    document.getElementById('preloader').style.display = 'none';
                    initPremiumFeatures();
                    gsap.registerPlugin(ScrollTrigger);
                    initTiltEffect();
                    attachSounds();
                }
            });

            tl.to('#preloader', { opacity: 0, scale: 1.1, filter: "blur(10px)", duration: 0.8, ease: "power2.inOut" })
              .to('.slide-title, .hud-frame', { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
              .to('.section-label', { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, "-=0.8");
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.dataset.filter;
            
            gsap.to('#all-projects-container', { opacity: 0, duration: 0.2, onComplete: () => {
                renderFilteredProjects();
                gsap.to('#all-projects-container', { opacity: 1, duration: 0.4 });
                initTiltEffect(); 
            }});
        });
    });

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
