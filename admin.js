// ===========================================================
// ADMIN PANEL SCRIPT (DENGAN FITUR HAPUS INSTAN)
// ===========================================================

import { auth, db } from './firebase-config.js';
import {
    GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function setBtnLoading(btn, loading, originalText) {
    if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';
    } else {
        btn.disabled = false;
        btn.textContent = originalText || btn.dataset.originalText || 'Simpan';
    }
}

// ===========================================================
// AUTH
// ===========================================================
document.getElementById('google-login-btn').addEventListener('click', async () => {
    loginError.textContent = '';
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (err) {
        loginError.textContent = 'Login gagal: ' + err.message;
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'grid';
        userEmail.textContent = user.email;
        await loadAllData();
    } else {
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
    }
});

// ===========================================================
// TAB NAVIGATION
// ===========================================================
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        const label = btn.textContent.trim().replace(/^[^\s]+\s/, '');
        document.getElementById('page-title').textContent = label;
    });
});

// ===========================================================
// LOAD ALL DATA
// ===========================================================
async function loadAllData() {
    await Promise.all([loadProfile(), loadSkills(), loadSoftware(), loadProjects(), loadContact()]);
}

// ===========================================================
// PROFILE
// ===========================================================
async function loadProfile() {
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'about'));
        if (snap.exists()) {
            const d = snap.data();
            document.getElementById('profile-name').value        = d.name || '';
            document.getElementById('profile-greeting').value    = d.greeting || '';
            document.getElementById('profile-title').value       = d.title || '';
            document.getElementById('profile-description').value = d.description || '';
            document.getElementById('profile-about-text').value  = d.aboutText || '';
            document.getElementById('profile-image').value       = d.profileImage || '';
            updateImagePreview('profile-image', 'profile-image-preview');
        }
    } catch (err) { showToast('Gagal memuat profile', 'error'); }
}

document.getElementById('profile-image').addEventListener('input', () => {
    updateImagePreview('profile-image', 'profile-image-preview');
});

function updateImagePreview(inputId, previewId) {
    const url = document.getElementById(inputId).value.trim();
    const preview = document.getElementById(previewId);
    preview.innerHTML = '';
    if (!url) return;
    const img = document.createElement('img');
    img.src = url;
    img.onerror = () => { preview.innerHTML = '<span style="color:var(--danger);font-size:0.8rem;">URL Gambar tidak valid</span>'; };
    preview.appendChild(img);
}

document.getElementById('form-profile').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-save');
    setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'about'), {
            name:         document.getElementById('profile-name').value.trim(),
            greeting:     document.getElementById('profile-greeting').value.trim(),
            title:        document.getElementById('profile-title').value.trim(),
            description:  document.getElementById('profile-description').value.trim(),
            aboutText:    document.getElementById('profile-about-text').value.trim(),
            profileImage: document.getElementById('profile-image').value.trim(),
            updatedAt:    new Date()
        }, { merge: true });
        showToast('✅ Profile berhasil disimpan!');
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); } 
    finally { setBtnLoading(btn, false); }
});

// ===========================================================
// SKILLS
// ===========================================================
let skillsItems = [];
async function loadSkills() {
    const snap = await getDoc(doc(db, 'portfolio', 'skills'));
    skillsItems = snap.exists() ? (snap.data().items || []) : [];
    renderSkills();
}

function renderSkills() {
    const container = document.getElementById('skills-list');
    container.innerHTML = '';
    if (skillsItems.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada skill.</div>';
        return;
    }
    skillsItems.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div class="list-card-header">
                <span class="list-card-title">Skill #${i + 1}</span>
                <button type="button" class="btn-icon" data-remove-skill="${i}">✕</button>
            </div>
            <div class="form-group">
                <label>Judul Skill</label>
                <input type="text" class="skill-title" value="${esc(item.title)}">
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea class="skill-desc" rows="2">${esc(item.description)}</textarea>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Hapus skill
    container.querySelectorAll('[data-remove-skill]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const i = parseInt(e.currentTarget.dataset.removeSkill);
            if (confirm('Hapus skill ini?')) { skillsItems.splice(i, 1); renderSkills(); }
        });
    });
}

document.getElementById('add-skill-btn').addEventListener('click', () => {
    skillsItems.push({ title: '', description: '' });
    renderSkills();
});

document.getElementById('save-skills-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const cards = document.querySelectorAll('#skills-list .list-card');
    const items = [];
    cards.forEach(card => {
        const title = card.querySelector('.skill-title').value.trim();
        if (title) items.push({ title, description: card.querySelector('.skill-desc').value.trim() });
    });
    setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'skills'), { items, updatedAt: new Date() });
        skillsItems = items; showToast('✅ Skills disimpan!');
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); } 
    finally { setBtnLoading(btn, false); }
});

// ===========================================================
// SOFTWARE
// ===========================================================
let softwareItems = [];
async function loadSoftware() {
    const snap = await getDoc(doc(db, 'portfolio', 'software'));
    softwareItems = snap.exists() ? (snap.data().items || []) : [];
    renderSoftware();
}

function renderSoftware() {
    const container = document.getElementById('software-list');
    container.innerHTML = '';
    if (softwareItems.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada software.</div>';
        return;
    }
    softwareItems.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div class="list-card-header">
                <span class="list-card-title">Software #${i + 1}</span>
                <button type="button" class="btn-icon" data-remove-sw="${i}">✕</button>
            </div>
            <div class="form-row">
                <div class="form-group" style="max-width:120px;">
                    <label>Label</label>
                    <input type="text" class="sw-label" value="${esc(item.label)}">
                </div>
                <div class="form-group">
                    <label>Nama</label>
                    <input type="text" class="sw-name" value="${esc(item.name)}">
                </div>
                <div class="form-group" style="max-width:120px;">
                    <label>Warna</label>
                    <input type="color" class="sw-color" value="${item.color || '#f5a31a'}">
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Hapus software
    container.querySelectorAll('[data-remove-sw]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const i = parseInt(e.currentTarget.dataset.removeSw);
            if (confirm('Hapus software ini?')) { softwareItems.splice(i, 1); renderSoftware(); }
        });
    });
}

document.getElementById('add-software-btn').addEventListener('click', () => {
    softwareItems.push({ label: '', name: '', color: '#f5a31a' });
    renderSoftware();
});

document.getElementById('save-software-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const cards = document.querySelectorAll('#software-list .list-card');
    const items = [];
    cards.forEach(card => {
        const label = card.querySelector('.sw-label').value.trim();
        const name  = card.querySelector('.sw-name').value.trim();
        if (label && name) items.push({ label, name, color: card.querySelector('.sw-color').value });
    });
    setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'software'), { items, updatedAt: new Date() });
        softwareItems = items; showToast('✅ Software disimpan!');
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); } 
    finally { setBtnLoading(btn, false); }
});

// ===========================================================
// PROJECTS (DENGAN FITUR HAPUS INSTAN)
// ===========================================================
let projectItems = [];
const CATEGORIES = [
    { value: 'social',       label: 'Social Media' },
    { value: 'print',        label: 'Print Media' },
    { value: 'illustration', label: 'Illustrations' },
    { value: 'branding',     label: 'Branding' },
    { value: 'web',          label: 'Web & UI' }
];

async function loadProjects() {
    const snap = await getDoc(doc(db, 'portfolio', 'projects'));
    projectItems = snap.exists() ? (snap.data().items || []) : [];
    renderProjects();
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    container.innerHTML = '';
    if (projectItems.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada project.</div>';
        return;
    }
    projectItems.forEach((item, i) => {
        const catOptions = CATEGORIES.map(c =>
            `<option value="${c.value}" ${c.value === item.category ? 'selected' : ''}>${c.label}</option>`
        ).join('');

        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div class="list-card-header">
                <span class="list-card-title">Project #${i + 1}</span>
                <button type="button" class="btn-icon" data-remove-proj="${i}" title="Hapus Permanen">✕</button>
            </div>
            <div class="form-row">
                <div class="form-group" style="max-width:200px;">
                    <label>Kategori</label>
                    <select class="proj-category">${catOptions}</select>
                </div>
                <div class="form-group">
                    <label>Judul (Wajib diisi)</label>
                    <input type="text" class="proj-title" value="${esc(item.title)}" placeholder="Judul project">
                </div>
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea class="proj-desc" rows="2">${esc(item.description)}</textarea>
            </div>
            <div class="form-group">
                <label>Tags (pisahkan dengan koma)</label>
                <input type="text" class="proj-tags" value="${esc(item.tags)}" placeholder="HTML, CSS, JavaScript">
            </div>
            <div class="form-group">
                <label>URL Gambar (Link dari internet)</label>
                <input type="text" class="proj-image" value="${esc(item.imageUrl)}" placeholder="https://contoh.com/gambar.jpg">
                <div class="img-preview proj-preview"></div>
            </div>
        `;
        container.appendChild(card);

        const imgInput = card.querySelector('.proj-image');
        const preview  = card.querySelector('.proj-preview');
        if (imgInput.value) renderProjPreview(imgInput.value, preview);
        imgInput.addEventListener('input', () => renderProjPreview(imgInput.value, preview));
    });

    // FITUR HAPUS INSTAN UNTUK PROJECT
    container.querySelectorAll('[data-remove-proj]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const i = parseInt(e.currentTarget.dataset.removeProj);
            if (confirm('⚠️ Yakin ingin menghapus project ini secara permanen? Data akan langsung hilang dari web publik.')) {
                // 1. Hapus dari array lokal
                projectItems.splice(i, 1);
                // 2. Render ulang tampilan
                renderProjects();

                // 3. Simpan langsung ke Firebase
                try {
                    const cards = document.querySelectorAll('#projects-list .list-card');
                    const updatedItems = [];
                    cards.forEach(card => {
                        const title = card.querySelector('.proj-title').value.trim();
                        if (title) {
                            updatedItems.push({
                                category:    card.querySelector('.proj-category').value,
                                title,
                                description: card.querySelector('.proj-desc').value.trim(),
                                tags:        card.querySelector('.proj-tags').value.trim(),
                                imageUrl:    card.querySelector('.proj-image').value.trim()
                            });
                        }
                    });
                    
                    await setDoc(doc(db, 'portfolio', 'projects'), { items: updatedItems, updatedAt: new Date() });
                    projectItems = updatedItems;
                    showToast('🗑️ Project berhasil dihapus permanen!');
                } catch (err) {
                    showToast('Gagal menghapus: ' + err.message, 'error');
                }
            }
        });
    });
}

function renderProjPreview(url, container) {
    container.innerHTML = '';
    if (!url || !url.trim()) return;
    const img = document.createElement('img');
    img.src = url.trim();
    img.onerror = () => { container.innerHTML = '<span style="color:var(--danger);font-size:0.8rem;">URL Gambar tidak valid</span>'; };
    container.appendChild(img);
}

document.getElementById('add-project-btn').addEventListener('click', () => {
    projectItems.push({ category: 'web', title: '', description: '', tags: '', imageUrl: '' });
    renderProjects();
});

document.getElementById('save-projects-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const cards = document.querySelectorAll('#projects-list .list-card');
    const items = [];
    let adaYangKosong = false;

    cards.forEach(card => {
        const title = card.querySelector('.proj-title').value.trim();
        if (!title) { adaYangKosong = true; return; }
        
        items.push({
            category:    card.querySelector('.proj-category').value,
            title,
            description: card.querySelector('.proj-desc').value.trim(),
            tags:        card.querySelector('.proj-tags').value.trim(),
            imageUrl:    card.querySelector('.proj-image').value.trim()
        });
    });

    if (adaYangKosong) {
        showToast('⚠️ Ada project yang Judulnya kosong! Harap isi judul.', 'error');
        return;
    }

    setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'projects'), { items, updatedAt: new Date() });
        projectItems = items;
        showToast('✅ Projects berhasil disimpan!');
    } catch (err) { 
        showToast('Gagal: ' + err.message, 'error'); 
    } finally { 
        setBtnLoading(btn, false); 
    }
});

// ===========================================================
// CONTACT
// ===========================================================
async function loadContact() {
    const snap = await getDoc(doc(db, 'portfolio', 'contact'));
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById('contact-email').value     = d.email || '';
        document.getElementById('contact-instagram').value = d.instagram || '';
        document.getElementById('contact-github').value    = d.github || '';
        document.getElementById('contact-whatsapp').value  = d.whatsapp || '';
        document.getElementById('contact-footer').value    = d.footerText || '';
    }
}

document.getElementById('form-contact').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-save');
    setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'contact'), {
            email:      document.getElementById('contact-email').value.trim(),
            instagram:  document.getElementById('contact-instagram').value.trim(),
            github:     document.getElementById('contact-github').value.trim(),
            whatsapp:   document.getElementById('contact-whatsapp').value.trim(),
            footerText: document.getElementById('contact-footer').value.trim(),
            updatedAt:  new Date()
        }, { merge: true });
        showToast('✅ Contact disimpan!');
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); } 
    finally { setBtnLoading(btn, false); }
});
