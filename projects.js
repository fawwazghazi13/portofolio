import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadAllProjects() {
    const container = document.getElementById('all-projects-container');
    if (!container) return;

    try {
        const snap = await getDoc(doc(db, 'portfolio', 'projects'));
        if (snap.exists()) {
            const items = snap.data().items || [];
            if(items.length === 0) {
                container.innerHTML = '<h3 style="text-align:center; color:var(--muted);">Belum ada project.</h3>';
                return;
            }

            const grouped = {};
            items.forEach(p => {
                if (!grouped[p.category]) grouped[p.category] = [];
                grouped[p.category].push(p);
            });

            const catNames = { 
                social: 'Social Media', print: 'Print Media', illustration: 'Illustrations', 
                branding: 'Branding', web: 'Web & UI', video: 'Video & Motion' 
            };
            
            container.innerHTML = '';

            for (const cat in grouped) {
                const showcase = document.createElement('div');
                showcase.className = 'showcase';

                // ==========================================
                // LOGIKA KHUSUS UNTUK KATEGORI VIDEO (MARQUEE)
                // ==========================================
                if (cat === 'video') {
                    let videoCardsHtml = '';
                    
                    grouped[cat].forEach((p) => {
                        let displayImage = p.imageUrl;
                        if (!displayImage && p.videoUrl) {
                            let vid = getYouTubeId(p.videoUrl);
                            if (vid) displayImage = `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`;
                        }

                        videoCardsHtml += `
                            <a href="project.html?id=${p.id}" class="video-item-card" title="Tonton: ${p.title}">
                                ${displayImage ? `<img src="${displayImage}" alt="${p.title}" onerror="this.src='https://img.youtube.com/vi/${getYouTubeId(p.videoUrl)}/hqdefault.jpg'">` : ''}
                                <div class="play-icon">▶</div>
                                <span style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.8); color:#fff; padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:bold; z-index:2;">${p.title}</span>
                            </a>
                        `;
                    });

                    // KUNCI LOOPING: Kita duplikasi card-nya 2x lipat agar animasinya tidak putus
                    const duplicatedCards = videoCardsHtml + videoCardsHtml;

                    showcase.innerHTML = `
                        <div class="slide-head"><span>Portfolio</span><span>${catNames[cat] || cat}</span></div>
                        <h3 class="showcase-title">${catNames[cat]} <span class="script">Showreel</span></h3>
                        <div class="video-marquee-wrapper">
                            <div class="video-marquee-track">
                                ${duplicatedCards}
                            </div>
                        </div>
                    `;
                } 
                // ==========================================
                // LOGIKA NORMAL UNTUK KATEGORI LAIN (GRID)
                // ==========================================
                else {
                    let tilesHtml = '';
                    grouped[cat].forEach((p) => {
                        let displayImage = p.imageUrl;
                        tilesHtml += `
                            <a href="project.html?id=${p.id}" class="tile project-tile-custom" title="${p.title}">
                                ${displayImage ? `<img src="${displayImage}" alt="${p.title}">` : ''}
                                <span>${p.title}</span>
                            </a>
                        `;
                    });

                    showcase.innerHTML = `
                        <div class="slide-head"><span>Portfolio</span><span>${catNames[cat] || cat}</span></div>
                        <h3 class="showcase-title">${catNames[cat]} <span class="script">Projects</span></h3>
                        <div class="collage" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; grid-auto-rows: auto;">
                            ${tilesHtml}
                        </div>
                    `;
                }
                
                container.appendChild(showcase);
            }
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<h3 style="text-align:center; color:red;">Gagal memuat projects.</h3>';
    }
}

// Fungsi bantuan ID YouTube
function getYouTubeId(url) {
    if (!url) return '';
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    return '';
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllProjects();

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
