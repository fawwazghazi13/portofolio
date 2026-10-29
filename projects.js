import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadAllProjects() {
    // Mencari ID all-projects-container
    const container = document.getElementById('all-projects-container');
    if (!container) {
        console.error("Wadah 'all-projects-container' tidak ditemukan di HTML!");
        return;
    }

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

            const catNames = { social: 'Social Media', print: 'Print Media', illustration: 'Illustrations', branding: 'Branding', web: 'Web & UI' };
            container.innerHTML = '';

            for (const cat in grouped) {
                const showcase = document.createElement('div');
                showcase.className = 'showcase';
                let tilesHtml = '';
                grouped[cat].forEach((p) => {
                    tilesHtml += `
                        <a href="project.html?id=${p.id}" class="tile project-tile-custom" title="${p.title}">
                            ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : ''}
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
                container.appendChild(showcase);
            }
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<h3 style="text-align:center; color:red;">Gagal memuat projects.</h3>';
    }
}
document.addEventListener('DOMContentLoaded', loadAllProjects);
