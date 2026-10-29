import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadProjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const container = document.getElementById('project-content');

    if (!projectId) {
        container.innerHTML = '<h1>Project tidak ditemukan.</h1><a href="projects.html" class="btn primary" style="margin-top:20px;">Kembali</a>';
        return;
    }

    try {
        const snap = await getDoc(doc(db, 'portfolio', 'projects'));
        if (snap.exists()) {
            const items = snap.data().items || [];
            const project = items.find(p => p.id === projectId);

            if (project) {
                let videoHtml = '';
                if (project.videoUrl) {
                    let videoId = '';
                    if (project.videoUrl.includes('watch?v=')) videoId = project.videoUrl.split('v=')[1].split('&')[0];
                    else if (project.videoUrl.includes('youtu.be/')) videoId = project.videoUrl.split('youtu.be/')[1].split('?')[0];
                    
                    if (videoId) {
                        videoHtml = `
                            <div class="video-container">
                                <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                            </div>
                        `;
                    }
                }

                document.title = project.title + " | Portofolio";
                container.innerHTML = `
                    <a href="projects.html" style="color: var(--accent); text-decoration: none; font-weight: bold;">&larr; Kembali ke Projects</a>
                    <h1 style="font-family: var(--font-heading); font-size: 3rem; margin: 20px 0 10px; color: #fff;">${project.title}</h1>
                    <p style="color: var(--accent); margin-bottom: 20px;">Kategori: ${project.category.toUpperCase()} | Tags: ${project.tags}</p>
                    ${project.imageUrl ? `<img src="${project.imageUrl}" class="project-detail-image" alt="${project.title}">` : ''}
                    <p style="color: var(--muted); font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px;">${project.description}</p>
                    ${videoHtml}
                `;
            } else {
                container.innerHTML = '<h1>Project tidak ditemukan.</h1><a href="projects.html" class="btn primary" style="margin-top:20px;">Kembali</a>';
            }
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<h1>Terjadi kesalahan saat memuat data.</h1>';
    }
}
document.addEventListener('DOMContentLoaded', loadProjectDetail);