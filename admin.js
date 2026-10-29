import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const IMGBB_API_KEY = "MASUKKAN_API_KEY_IMGBB_KAMU_DI_SINI";

const loginScreen = document.getElementById('login-screen');
const dashboard   = document.getElementById('dashboard');
const loginError  = document.getElementById('login-error');
const userEmail   = document.getElementById('user-email');
const toastEl     = document.getElementById('toast');

let toastTimeout;
function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.className = 'toast ' + type + ' show';
    toastTimeout = setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
}
function esc(str) { const div = document.createElement('div'); div.textContent = str || ''; return div.innerHTML; }
function setBtnLoading(btn, loading, originalText) {
    if (loading) { btn.dataset.originalText = btn.textContent; btn.disabled = true; btn.textContent = 'Memproses...'; } 
    else { btn.disabled = false; btn.textContent = originalText || btn.dataset.originalText || 'Simpan'; }
}

async function uploadImage(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('image', file);
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) return data.data.url;
        throw new Error('Gagal upload ke ImgBB');
    } catch (error) { console.error(error); throw error; }
}

document.getElementById('google-login-btn').addEventListener('click', async () => {
    loginError.textContent = '';
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { loginError.textContent = 'Gagal: ' + err.message; }
});
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginScreen.style.display = 'none'; dashboard.style.display = 'grid'; userEmail.textContent = user.email;
        await loadAllData();
    } else {
        loginScreen.style.display = 'flex'; dashboard.style.display = 'none';
    }
});

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active'); document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        document.getElementById('page-title').textContent = btn.textContent.trim().replace(/^[^\s]+\s/, '');
    });
});

async function loadAllData() { await Promise.all([loadProfile(), loadSkills(), loadSoftware(), loadProjects(), loadContact()]); }

// PROFILE
async function loadProfile() {
    const snap = await getDoc(doc(db, 'portfolio', 'about'));
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById('profile-name').value = d.name || '';
        document.getElementById('profile-greeting').value = d.greeting || '';
        document.getElementById('profile-title').value = d.title || '';
        document.getElementById('profile-description').value = d.description || '';
        document.getElementById('profile-about-text').value = d.aboutText || '';
        document.getElementById('profile-image').value = d.profileImage || '';
        updateImagePreview('profile-image', 'profile-image-preview');
    }
}
document.getElementById('profile-image').addEventListener('input', () => updateImagePreview('profile-image', 'profile-image-preview'));
document.getElementById('profile-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onload = (e) => { document.getElementById('profile-image-preview').innerHTML = `<img src="${e.target.result}">`; }; reader.readAsDataURL(file); }
});
function updateImagePreview(inputId, previewId) {
    const url = document.getElementById(inputId).value.trim(); const preview = document.getElementById(previewId); preview.innerHTML = '';
    if (!url) return; const img = document.createElement('img'); img.src = url; img.onerror = () => preview.innerHTML = '<span style="color:red;font-size:0.8rem;">URL Invalid</span>'; preview.appendChild(img);
}
document.getElementById('form-profile').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = e.target.querySelector('.btn-save'); setBtnLoading(btn, true);
    try {
        let finalImageUrl = document.getElementById('profile-image').value.trim();
        const fileInput = document.getElementById('profile-image-file');
        if (fileInput.files.length > 0) { showToast('Mengupload foto...', 'success'); finalImageUrl = await uploadImage(fileInput.files[0]); }
        await setDoc(doc(db, 'portfolio', 'about'), {
            name: document.getElementById('profile-name').value.trim(), greeting: document.getElementById('profile-greeting').value.trim(),
            title: document.getElementById('profile-title').value.trim(), description: document.getElementById('profile-description').value.trim(),
            aboutText: document.getElementById('profile-about-text').value.trim(), profileImage: finalImageUrl, updatedAt: new Date()
        }, { merge: true }); 
        document.getElementById('profile-image').value = finalImageUrl; fileInput.value = ''; showToast('✅ Profile disimpan!');
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); } finally { setBtnLoading(btn, false); }
});

// SKILLS & SOFTWARE
let skillsItems = [];
async function loadSkills() { const snap = await getDoc(doc(db, 'portfolio', 'skills')); skillsItems = snap.exists() ? (snap.data().items || []) : []; renderSkills(); }
function renderSkills() {
    const container = document.getElementById('skills-list'); container.innerHTML = '';
    if (skillsItems.length === 0) { container.innerHTML = '<div class="empty-state">Belum ada skill.</div>'; return; }
    skillsItems.forEach((item, i) => {
        const card = document.createElement('div'); card.className = 'list-card';
        card.innerHTML = `<div class="list-card-header"><span class="list-card-title">Skill #${i + 1}</span><button type="button" class="btn-icon" data-remove-skill="${i}">✕</button></div>
            <div class="form-group"><label>Judul</label><input type="text" class="skill-title" value="${esc(item.title)}"></div>
            <div class="form-group"><label>Deskripsi</label><textarea class="skill-desc" rows="2">${esc(item.description)}</textarea></div>`;
        container.appendChild(card);
    });
    container.querySelectorAll('[data-remove-skill]').forEach(btn => btn.addEventListener('click', (e) => { if (confirm('Hapus?')) { skillsItems.splice(parseInt(e.currentTarget.dataset.removeSkill), 1); renderSkills(); } }));
}
document.getElementById('add-skill-btn').addEventListener('click', () => { skillsItems.push({ title: '', description: '' }); renderSkills(); });
document.getElementById('save-skills-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget; const items = [];
    document.querySelectorAll('#skills-list .list-card').forEach(card => { const title = card.querySelector('.skill-title').value.trim(); if (title) items.push({ title, description: card.querySelector('.skill-desc').value.trim() }); });
    setBtnLoading(btn, true); try { await setDoc(doc(db, 'portfolio', 'skills'), { items }); skillsItems = items; showToast('✅ Disimpan!'); } catch (err) { showToast('Gagal', 'error'); } finally { setBtnLoading(btn, false); }
});

let softwareItems = [];
async function loadSoftware() { const snap = await getDoc(doc(db, 'portfolio', 'software')); softwareItems = snap.exists() ? (snap.data().items || []) : []; renderSoftware(); }
function renderSoftware() {
    const container = document.getElementById('software-list'); container.innerHTML = '';
    if (softwareItems.length === 0) { container.innerHTML = '<div class="empty-state">Belum ada software.</div>'; return; }
    softwareItems.forEach((item, i) => {
        const card = document.createElement('div'); card.className = 'list-card';
        card.innerHTML = `<div class="list-card-header"><span class="list-card-title">Software #${i + 1}</span><button type="button" class="btn-icon" data-remove-sw="${i}">✕</button></div>
            <div class="form-row"><div class="form-group" style="max-width:120px;"><label>Label</label><input type="text" class="sw-label" value="${esc(item.label)}"></div>
            <div class="form-group"><label>Nama</label><input type="text" class="sw-name" value="${esc(item.name)}"></div>
            <div class="form-group" style="max-width:120px;"><label>Warna</label><input type="color" class="sw-color" value="${item.color || '#f5a31a'}"></div></div>`;
        container.appendChild(card);
    });
    container.querySelectorAll('[data-remove-sw]').forEach(btn => btn.addEventListener('click', (e) => { if (confirm('Hapus?')) { softwareItems.splice(parseInt(e.currentTarget.dataset.removeSw), 1); renderSoftware(); } }));
}
document.getElementById('add-software-btn').addEventListener('click', () => { softwareItems.push({ label: '', name: '', color: '#f5a31a' }); renderSoftware(); });
document.getElementById('save-software-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget; const items = [];
    document.querySelectorAll('#software-list .list-card').forEach(card => { const label = card.querySelector('.sw-label').value.trim(); const name = card.querySelector('.sw-name').value.trim(); if (label && name) items.push({ label, name, color: card.querySelector('.sw-color').value }); });
    setBtnLoading(btn, true); try { await setDoc(doc(db, 'portfolio', 'software'), { items }); softwareItems = items; showToast('✅ Disimpan!'); } catch (err) { showToast('Gagal', 'error'); } finally { setBtnLoading(btn, false); }
});

// PROJECTS (DENGAN VIDEO & AUTO-THUMBNAIL)
let projectItems = [];
const CATEGORIES = [
    { value: 'social', label: 'Social Media' }, { value: 'print', label: 'Print Media' }, 
    { value: 'illustration', label: 'Illustrations' }, { value: 'branding', label: 'Branding' }, 
    { value: 'web', label: 'Web & UI' }, { value: 'video', label: 'Video & Motion' } 
];

async function loadProjects() { const snap = await getDoc(doc(db, 'portfolio', 'projects')); projectItems = snap.exists() ? (snap.data().items || []) : []; renderProjects(); }

function renderProjects() {
    const container = document.getElementById('projects-list'); container.innerHTML = '';
    if (projectItems.length === 0) { container.innerHTML = '<div class="empty-state">Belum ada project.</div>'; return; }
    projectItems.forEach((item, i) => {
        const catOptions = CATEGORIES.map(c => `<option value="${c.value}" ${c.value === item.category ? 'selected' : ''}>${c.label}</option>`).join('');
        const card = document.createElement('div'); card.className = 'list-card';
        card.innerHTML = `
            <input type="hidden" class="proj-id" value="${item.id || 'proj_' + Date.now()}">
            <div class="list-card-header"><span class="list-card-title">Project #${i + 1}</span><button type="button" class="btn-icon" data-remove-proj="${i}" title="Hapus">✕</button></div>
            <div class="form-row">
                <div class="form-group" style="max-width:200px;"><label>Kategori</label><select class="proj-category">${catOptions}</select></div>
                <div class="form-group"><label>Judul (Wajib)</label><input type="text" class="proj-title" value="${esc(item.title)}"></div>
            </div>
            <div class="form-group"><label>Deskripsi</label><textarea class="proj-desc" rows="2">${esc(item.description)}</textarea></div>
            <div class="form-group"><label>Tags</label><input type="text" class="proj-tags" value="${esc(item.tags)}"></div>
            
            <div class="form-group">
                <label>URL Video YouTube</label>
                <input type="text" class="proj-video" value="${esc(item.videoUrl)}" placeholder="https://www.youtube.com/watch?v=xxxxx">
                <div style="margin-top: 5px; font-size: 0.75rem; color: #888;">Kosongkan gambar di bawah jika ingin otomatis mengambil gambar dari YouTube.</div>
            </div>

            <div class="form-group">
                <label>Gambar Project</label>
                <input type="file" class="proj-image-file" accept="image/*">
                <div style="margin-top: 5px; font-size: 0.8rem; color: #888;">Atau masukkan URL manual:</div>
                <input type="text" class="proj-image" value="${esc(item.imageUrl)}" style="margin-top: 8px;">
                <div class="img-preview proj-preview"></div>
            </div>
        `;
        container.appendChild(card);
        
        const imgInput = card.querySelector('.proj-image');
        const fileInput = card.querySelector('.proj-image-file');
        const videoInput = card.querySelector('.proj-video');
        const preview = card.querySelector('.proj-preview');
        
        // Tampilkan preview gambar jika sudah ada
        if (imgInput.value) renderProjPreview(imgInput.value, preview); 
        
        // Update preview jika URL diketik manual
        imgInput.addEventListener('input', () => renderProjPreview(imgInput.value, preview));
        
        // Update preview jika upload file
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) { const reader = new FileReader(); reader.onload = (e) => { preview.innerHTML = `<img src="${e.target.result}">`; }; reader.readAsDataURL(file); }
        });

        // FITUR AJAIB: Jika user mengetik link YouTube, otomatis isi URL gambar dengan thumbnail
        videoInput.addEventListener('blur', () => {
            const url = videoInput.value;
            if (url && !imgInput.value) { // Hanya isi jika kolom gambar masih kosong
                let videoId = '';
                if (url.includes('watch?v=')) videoId = url.split('v=')[1].split('&')[0];
                else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
                
                if (videoId) {
                    const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    imgInput.value = thumbUrl;
                    renderProjPreview(thumbUrl, preview);
                }
            }
        });
    });
    
    container.querySelectorAll('[data-remove-proj]').forEach(btn => btn.addEventListener('click', async (e) => {
        if (confirm('⚠️ Yakin hapus project ini?')) {
            projectItems.splice(parseInt(e.currentTarget.dataset.removeProj), 1); renderProjects();
            try {
                const updatedItems = [];
                document.querySelectorAll('#projects-list .list-card').forEach(card => {
                    const title = card.querySelector('.proj-title').value.trim();
                    if (title) updatedItems.push({ id: card.querySelector('.proj-id').value, category: card.querySelector('.proj-category').value, title, description: card.querySelector('.proj-desc').value.trim(), tags: card.querySelector('.proj-tags').value.trim(), imageUrl: card.querySelector('.proj-image').value.trim(), videoUrl: card.querySelector('.proj-video').value.trim() });
                });
                await setDoc(doc(db, 'portfolio', 'projects'), { items: updatedItems }); projectItems = updatedItems; showToast('🗑️ Project dihapus!');
            } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
        }
    }));
}

function renderProjPreview(url, container) {
    container.innerHTML = ''; if (!url || !url.trim()) return; const img = document.createElement('img'); img.src = url.trim();
    img.onerror = () => container.innerHTML = '<span style="color:red;font-size:0.8rem;">URL Invalid</span>'; container.appendChild(img);
}

document.getElementById('add-project-btn').addEventListener('click', () => { projectItems.push({ id: 'proj_' + Date.now(), category: 'web', title: '', description: '', tags: '', imageUrl: '', videoUrl: '' }); renderProjects(); });

document.getElementById('save-projects-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget; setBtnLoading(btn, true);
    const cards = document.querySelectorAll('#projects-list .list-card'); const items = []; let adaYangKosong = false;
    for (const card of cards) {
        const title = card.querySelector('.proj-title').value.trim(); if (!title) { adaYangKosong = true; continue; }
        let finalImageUrl = card.querySelector('.proj-image').value.trim();
        const fileInput = card.querySelector('.proj-image-file');
        if (fileInput.files.length > 0) {
            showToast(`Mengupload gambar untuk: ${title}...`, 'success');
            try { finalImageUrl = await uploadImage(fileInput.files[0]); card.querySelector('.proj-image').value = finalImageUrl; } catch (error) { showToast(`Gagal upload gambar ${title}`, 'error'); }
        }
        items.push({ id: card.querySelector('.proj-id').value, category: card.querySelector('.proj-category').value, title, description: card.querySelector('.proj-desc').value.trim(), tags: card.querySelector('.proj-tags').value.trim(), imageUrl: finalImageUrl, videoUrl: card.querySelector('.proj-video').value.trim() });
    }
    if (adaYangKosong) { showToast('⚠️ Judul project tidak boleh kosong!', 'error'); setBtnLoading(btn, false); return; }
    try { await setDoc(doc(db, 'portfolio', 'projects'), { items }); projectItems = items; showToast('✅ Projects disimpan!'); renderProjects(); } 
    catch (err) { showToast('Gagal: ' + err.message, 'error'); } finally { setBtnLoading(btn, false); }
});

// CONTACT
async function loadContact() {
    const snap = await getDoc(doc(db, 'portfolio', 'contact'));
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById('contact-email').value = d.email || '';
        document.getElementById('contact-instagram').value = d.instagram || '';
        document.getElementById('contact-github').value = d.github || '';
        document.getElementById('contact-whatsapp').value = d.whatsapp || '';
        document.getElementById('contact-footer').value = d.footerText || '';
    }
}
document.getElementById('form-contact').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = e.target.querySelector('.btn-save'); setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'contact'), { email: document.getElementById('contact-email').value.trim(), instagram: document.getElementById('contact-instagram').value.trim(), github: document.getElementById('contact-github').value.trim(), whatsapp: document.getElementById('contact-whatsapp').value.trim(), footerText: document.getElementById('contact-footer').value.trim(), updatedAt: new Date() }, { merge: true });
        showToast('✅ Contact disimpan!');
    } catch (err) { showToast('Gagal', 'error'); } finally { setBtnLoading(btn, false); }
});
