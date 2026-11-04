import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadPortfolioContent() {
    try {
        const aboutSnap = await getDoc(doc(db, 'portfolio', 'about'));
        if (aboutSnap.exists()) {
            const d = aboutSnap.data();
            console.log("Data dari Firebase:", d); // Untuk ngecek di F12 Console

            // 1. GANTI GAMBAR PROFIL (Ditaruh paling atas agar tidak crash duluan)
            if (d.profileImage) {
                const imgElement = document.querySelector('.hero-image img');
                if (imgElement) {
                    imgElement.src = d.profileImage;
                    console.log("✅ Gambar berhasil diganti ke:", d.profileImage);
                }
            }

            // 2. UPDATE TEKS LAINNYA (Dengan pengaman if)
            if (d.greeting) {
                const elGreeting = document.querySelector('.greeting');
                if (elGreeting) elGreeting.textContent = d.greeting;
            }
            if (d.description) {
                const elDesc = document.querySelector('.description');
                if (elDesc) elDesc.textContent = d.description;
            }
            
            // Catatan: Teks About sekarang ada di dalam Terminal Box HTML.
            // Jika kamu ingin tetap mengambil teks from Firebase, aktifkan baris di bawah:
            /*
            if (d.aboutText) {
                const elAbout = document.querySelector('.terminal-body p');
                if (elAbout) elAbout.innerHTML = `<span class="term-prompt">></span> ` + d.aboutText + `<span class="blinking-cursor">_</span>`;
            }
            */
        }

        const skillsSnap = await getDoc(doc(db, 'portfolio', 'skills'));
        if (skillsSnap.exists()) {
            const items = skillsSnap.data().items || [];
            const container = document.querySelector('.skills-container');
            if (container) {
                container.innerHTML = items.map(s => `<li class="skill-card"><h4>${s.title}</h4><p>${s.description}</p></li>`).join('');
            }
        }
        
        const swSnap = await getDoc(doc(db, 'portfolio', 'software'));
        if (swSnap.exists()) {
            const items = swSnap.data().items || [];
            const grid = document.querySelector('.software-grid');
            if (grid) {
                grid.innerHTML = items.map(s => `<div class="sw" title="${s.name}"><span style="color:${s.color}; text-shadow: 0 0 15px ${s.color};">${s.label}</span></div>`).join('');
            }
        }
        
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
        
        document.querySelectorAll('a, button, .btn, #interactive-3d').forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
        });
    }
    
    document.querySelectorAll('.btn.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect(); const x = e.clientX - rect.left - rect.width / 2; const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.4, y: y * 0.4, duration: 0.4, ease: "power2.out" });
        });
        btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" }));
    });

    window.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.pageX) / 50;
        const y = (window.innerHeight / 2 - e.pageY) / 50;
        gsap.to('.parallax', { x: x, y: y, duration: 1, ease: "power2.out" });
        gsap.to('.floating-img', { x: -x*1.5, y: -y*1.5, duration: 1, ease: "power2.out" });
    });

    window.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.pageX) / 30;
        const y = (window.innerHeight / 2 - e.pageY) / 30;
        gsap.to('.parallax-3d', { rotationY: x, rotationX: -y, duration: 1.5, ease: "power2.out" });
    });

    initNewInteractive3D();
}

function initNewInteractive3D() {
    const wrapper = document.getElementById('interactive-3d');
    if (!wrapper) return;
    const globe = wrapper.querySelector('.globe');
    let isDragging = false; let prevX = 0, prevY = 0;
    let currentRotationX = 0, currentRotationY = 0;

    wrapper.addEventListener('mousedown', (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let deltaX = e.clientX - prevX; let deltaY = e.clientY - prevY;
        currentRotationY += deltaX * 0.6; currentRotationX -= deltaY * 0.6;
        gsap.set(globe, { rotationX: currentRotationX, rotationY: currentRotationY });
        prevX = e.clientX; prevY = e.clientY;
    });
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            gsap.to(globe, { rotationX: currentRotationX + 10, rotationY: currentRotationY + 10, duration: 1.5, ease: "power3.out" });
            currentRotationX += 10; currentRotationY += 10;
        }
    });
}

class TextScramble {
    constructor(el) { this.el = el; this.chars = '!<>-_\\/[]{}—=+*^?#________'; this.update = this.update.bind(this); }
    setText(newText) {
        const oldText = this.el.innerText; const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve); this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || ''; const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40); const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest); this.frame = 0; this.update(); return promise;
    }
    update() {
        let output = ''; let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) { complete++; output += to; }
            else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) { char = this.chars[Math.floor(Math.random() * this.chars.length)]; this.queue[i].char = char; }
                output += `<span style="opacity:0.5;color:var(--accent)">${char}</span>`;
            } else { output += from; }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) { this.resolve(); }
        else { this.frameRequest = requestAnimationFrame(this.update); this.frame++; }
    }
}

window.addEventListener('load', () => {
    const progressBar = document.createElement('div');
    progressBar.classList.add('scroll-progress');
    document.body.appendChild(progressBar);
    window.addEventListener('scroll', () => {
        let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progressBar.style.width = (winScroll / height) * 100 + "%";
    });

    let progress = { val: 0 };
    const preloaderText = document.querySelector('.preloader-text'); 
    const preloaderBar = document.querySelector('.preloader-bar-fill');
    
    const titleEl = document.querySelector('.cover-title');
    if (titleEl) titleEl.innerHTML = `<span class="scramble-text">PORTFOLIO</span><span class="script">Graphic Design</span>`;

    gsap.set(['.cover-title', '.greeting', '.hero h2', '.hero-buttons', '.hero-stack', '.glass-panel'], { opacity: 0, y: 50 });

    gsap.to(progress, { 
        val: 100, duration: 2.5, ease: "power3.inOut", 
        onUpdate: () => { 
            if(preloaderText) preloaderText.innerText = Math.round(progress.val) + '%'; 
            if(preloaderBar) preloaderBar.style.width = progress.val + '%'; 
        }, 
        onComplete: () => {
            const tl = gsap.timeline({
                onComplete: () => {
                    document.getElementById('preloader').style.display = 'none';
                    initPremiumFeatures();
                    gsap.registerPlugin(ScrollTrigger);
                    
                    if (titleEl) {
                        const fx = new TextScramble(document.querySelector('.scramble-text'));
                        fx.setText("PORTFOLIO");
                        setTimeout(() => { titleEl.setAttribute('data-text', 'PORTFOLIO'); }, 1500); 
                    }
                }
            });

            tl.to('#preloader', { opacity: 0, scale: 1.1, filter: "blur(10px)", duration: 0.8, ease: "power2.inOut" })
            .to('.cover-title', { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, "-=0.6")
            .to('.greeting', { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, "-=0.8")
            .to('.hero h2, .hero-buttons', { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }, "-=0.6")
            .to('.hero-stack', { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power3.out" }, "-=0.4")
            .to('.glass-panel', { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=0.6");
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioContent();
    const menuToggle = document.getElementById('menuToggle'); 
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle) menuToggle.addEventListener('click', () => { 
        navLinks.classList.toggle('active'); 
        menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰'; 
    });
    const year = document.getElementById('year'); 
    if (year) year.textContent = new Date().getFullYear();
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
