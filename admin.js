// ===========================================================
// ADMIN PANEL SCRIPT
// ===========================================================

import { auth, db } from './firebase-config.js';
import {
    GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---- DOM refs ----
const loginScreen = document.getElementById('login-screen');
const dashboard   = document.getElementById('dashboard');
const loginError  = document.getElementById('login-error');
const userEmail   = document.getElementById('user-email');
const toastEl     = document.getElementById('toast');

// ---- Helper: Toast notification ----
let toastTimeout;
function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.className = 'toast ' + type + ' show';
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// ---- Helper: escape HTML ----
function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// ---- Helper: set loading state ----
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
// AUTH (LOGIN & LOGOUT)
// ===========================================================
document.getElementById('google-login-btn').addEventListener('click', async () => {
    loginError.textContent = '';
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (err) {
        loginError.textContent = 'Login gagal: ' + err.message;
        console.error(err);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log('✅ Logged in as:', user.email, '| UID:', user.uid);
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
        const tabId = 'tab-' + btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');

        const label = btn.textContent.trim().replace(/^[^\s]+\s/, '');
        document.getElementById('page-title').textContent = label;
    });
});

// ===========================================================
// LOAD ALL DATA
// ===========================================================
async function loadAllData() {
    await Promise.all([
        loadProfile(),
        loadSkills(),
        loadSoftware(),
        loadProjects(),
        loadContact()
    ]);
}

// ===========================================================
// PROFILE & ABOUT
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
    } catch (err) {
        showToast('Gagal memuat profile: ' + err.message, 'error');
    }
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
    img.alt = 'Preview';
    img.onerror = () => { preview.innerHTML = '<span style="color:var(--danger);font-size:0.8rem;">Gambar tidak ditemukan</span>'; };
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
    } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
    } finally {
        setBtnLoading(btn, false);
    }
});

// ===========================================================
// SKILLS
// ===========================================================
let skillsItems = [];

async function loadSkills() {
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'skills'));
        skillsItems = snap.exists() ? (snap.data().items || []) : [];
        renderSkills();
    } catch (err) {
        showToast('Gagal memuat skills: ' + err.message, 'error');
    }
}

function renderSkills() {
    const container = document.getElementById('skills-list');
    container.innerHTML = '';

    if (skillsItems.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada skill. Klik "+ Tambah Skill" untuk menambahkan.</div>';
        return;
    }

    skillsItems.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div class="list-card-header">
                <span class="list-card-title">Skill #${i + 1}</span>
                <button type="button" class="btn-icon" data-remove-skill="${i}" title="Hapus">✕</button>
            </div>
            <div class="form-group">
                <label>Judul Skill</label>
                <input type="text" class="skill-title" value="${esc(item.title)}" placeholder="Contoh: HTML & CSS">
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea class="skill-desc" rows="2" placeholder="Contoh: Building website structures...">${esc(item.description)}</textarea>
            </div>
        `;
        container.appendChild(card);
    });

    container.querySelectorAll('[data-remove-skill]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const i = parseInt(e.currentTarget.dataset.removeSkill);
            if (confirm('Hapus skill ini?')) {
                skillsItems.splice(i, 1);
                renderSkills();
            }
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
        const description = card.querySelector('.skill-desc').value.trim();
        if (title) items.push({ title, description });
    });

    setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'skills'), {
            items,
            updatedAt: new Date()
        });
        skillsItems = items;
        showToast('✅ Skills berhasil disimpan!');
    } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
    } finally {
        setBtnLoading(btn, false);
    }
});

// ===========================================================
// SOFTWARE
// ===========================================================
let softwareItems = [];

async function loadSoftware() {
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'software'));
        softwareItems = snap.exists() ? (snap.data().items || []) : [];
        renderSoftware();
    } catch (err) {
        showToast('Gagal memuat software: ' + err.message, 'error');
    }
}

function renderSoftware() {
    const container = document.getElementById('software-list');
    container.innerHTML = '';

    if (softwareItems.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada software. Klik "+ Tambah Software" untuk menambahkan.</div>';
        return;
    }

    softwareItems.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div class="list-card-header">
                <span class="list-card-title">Software #${i + 1}</span>
                <button type="button" class="btn-icon" data-remove-sw="${i}" title="Hapus">✕</button>
            </div>
            <div class="form-row">
                <div class="form-group" style="max-width:120px;">
                    <label>Label</label>
                    <input type="text" class="sw-label" maxlength="4" value="${esc(item.label)}" placeholder="Ps">
                </div>
                <div class="form-group">
                    <label>Nama</label>
                    <input type="text" class="sw-name" value="${esc(item.name)}" placeholder="Photoshop">
                </div>
                <div class="form-group" style="max-width:120px;">
                    <label>Warna</label>
                    <input type="color" class="sw-color" value="${item.color || '#f5a31a'}">
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    container.querySelectorAll('[data-remove-sw]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const i = parseInt(e.currentTarget.dataset.removeSw);
            if (confirm('Hapus software ini?')) {
                softwareItems.splice(i, 1);
                renderSoftware();
            }
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
        const color = card.querySelector('.sw-color').value;
        if (label && name) items.push({ label, name, color });
    });

    setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'software'), {
            items,
            updatedAt: new Date()
        });
        softwareItems = items;
        showToast('✅ Software berhasil disimpan!');
    } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
    } finally {
        setBtnLoading(btn, false);
    }
});

// ===========================================================
// PROJECTS
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
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'projects'));
        projectItems = snap.exists() ? (snap.data().items || []) : [];
        renderProjects();
    } catch (err) {
        showToast('Gagal memuat projects: ' + err.message, 'error');
    }
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    container.innerHTML = '';

    if (projectItems.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada project. Klik "+ Tambah Project" untuk menambahkan.</div>';
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
                <button type="button" class="btn-icon" data-remove-proj="${i}" title="Hapus">✕</button>
            </div>
            <div class="form-row">
                <div class="form-group" style="max-width:200px;">
                    <label>Kategori</label>
                    <select class="proj-category">${catOptions}</select>
                </div>
                <div class="form-group">
                    <label>Judul</label>
                    <input type="text" class="proj-title" value="${esc(item.title)}" placeholder="Judul project">
                </div>
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea class="proj-desc" rows="2" placeholder="Deskripsi singkat">${esc(item.description)}</textarea>
            </div>
            <div class="form-group">
                <label>Tags (pisahkan dengan koma)</label>
                <input type="text" class="proj-tags" value="${esc(item.tags)}" placeholder="HTML, CSS, JavaScript">
            </div>
            <div class="form-group">
                <label>URL Gambar (opsional)</label>
                <input type="text" class="proj-image" value="${esc(item.imageUrl)}" placeholder="https://... atau images/gambar.jpg">
                <div class="img-preview proj-preview"></div>
            </div>
        `;
        container.appendChild(card);

        const imgInput = card.querySelector('.proj-image');
        const preview  = card.querySelector('.proj-preview');
        if (imgInput.value) renderProjPreview(imgInput.value, preview);
        imgInput.addEventListener('input', () => renderProjPreview(imgInput.value, preview));
    });

    container.querySelectorAll('[data-remove-proj]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const i = parseInt(e.currentTarget.dataset.removeProj);
            if (confirm('Hapus project ini?')) {
                projectItems.splice(i, 1);
                renderProjects();
            }
        });
    });
}

function renderProjPreview(url, container) {
    container.innerHTML = '';
    if (!url.trim()) return;
    const img = document.createElement('img');
    img.src = url.trim();
    img.onerror = () => { container.innerHTML = '<span style="color:var(--danger);font-size:0.8rem;">Gambar tidak ditemukan</span>'; };
    container.appendChild(img);
}

document.getElementById('add-project-btn').addEventListener('click', () => {
    projectItems.push({
        category: 'web',
        title: '',
        description: '',
        tags: '',
        imageUrl: ''
    });
    renderProjects();
});

document.getElementById('save-projects-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const cards = document.querySelectorAll('#projects-list .list-card');
    const items = [];
    cards.forEach(card => {
        const title = card.querySelector('.proj-title').value.trim();
        if (!title) return;
        items.push({
            category:    card.querySelector('.proj-category').value,
            title,
            description: card.querySelector('.proj-desc').value.trim(),
            tags:        card.querySelector('.proj-tags').value.trim(),
            imageUrl:    card.querySelector('.proj-image').value.trim()
        });
    });

    setBtnLoading(btn, true);
    try {
        await setDoc(doc(db, 'portfolio', 'projects'), {
            items,
            updatedAt: new Date()
        });
        projectItems = items;
        showToast('✅ Projects berhasil disimpan!');
    } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
    } finally {
        setBtnLoading(btn, false);
    }
});

// ===========================================================
// CONTACT & FOOTER
// ===========================================================
async function loadContact() {
    try {
        const snap = await getDoc(doc(db, 'portfolio', 'contact'));
        if (snap.exists()) {
            const d = snap.data();
            document.getElementById('contact-email').value     = d.email || '';
            document.getElementById('contact-instagram').value = d.instagram || '';
            document.getElementById('contact-github').value    = d.github || '';
            document.getElementById('contact-whatsapp').value  = d.whatsapp || '';
            document.getElementById('contact-footer').value    = d.footerText || '';
        }
    } catch (err) {
        showToast('Gagal memuat contact: ' + err.message, 'error');
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
        showToast('✅ Contact berhasil disimpan!');
    } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
    } finally {
        setBtnLoading(btn, false);
    }
});

// ===========================================================
// SEED DEFAULT DATA (TOMBOL ISI DATA DEFAULT)
// ===========================================================
const SEED_DATA = {
    about: {
        name: 'M Ghazi Fawwaz El Aqiel',
        greeting: 'HELLO, WELCOME TO MY WEBSITE',
        title: 'Student | Designer | Developer',
        description: 'I enjoy learning technology, creating designs, and developing creative projects. Welcome to my personal portfolio.',
        aboutText: 'Hello! My name is M Ghazi Fawwaz El Aqiel. I am a student in IDN Boarding School who is interested in graphic design and web development. I enjoy exploring new ideas, learning new skills, and turning creative concepts into real projects. This website is where I showcase my work and progress.',
        profileImage: 'images/profile.png'
    },
    skills: {
        items: [
            { title: 'HTML & CSS',     description: 'Building website structures and designing layouts.' },
            { title: 'JavaScript',     description: 'Creating interactive website features.' },
            { title: 'UI/UX Design',   description: 'Designing user interfaces and user experiences.' },
            { title: 'Graphic Design', description: 'Creating posters, digital graphics, and visual content.' }
        ]
    },
    software: {
        items: [
            { label: 'Ps',  name: 'Photoshop',     color: '#31a8ff' },
            { label: 'Ai',  name: 'Illustrator',   color: '#ff9a00' },
            { label: 'Pr',  name: 'Premiere Pro',  color: '#9999ff' },
            { label: 'Fg',  name: 'Figma',         color: '#f24e1e' },
            { label: 'JS',  name: 'JavaScript',    color: '#f7df1e' },
            { label: '</>', name: 'HTML & CSS',    color: '#f5a31a' }
        ]
    },
    projects: {
        items: [
            { category: 'web', title: 'Portfolio Website', description: 'A personal website built with HTML, CSS, and JavaScript.', tags: 'HTML, CSS, JavaScript', imageUrl: '' },
            { category: 'web', title: 'UI/UX Design',      description: 'A modern application interface designed in Figma.',       tags: 'Figma, UI/UX',           imageUrl: '' },
            { category: 'web', title: 'AquaSense',         description: 'A dashboard concept for monitoring water quality sensors.', tags: 'JavaScript, IoT, Firebase', imageUrl: '' }
        ]
    },
    contact: {
        email: 'yourname@email.com',
        instagram: '',
        github: '',
        whatsapp: '',
        footerText: 'M Ghazi Fawwaz El Aqiel'
    }
};

document.getElementById('seed-btn').addEventListener('click', async () => {
    if (!confirm('⚠️ Ini akan MENGISI data default ke Firestore. Data yang sudah ada akan ditimpa. Lanjutkan?')) return;

    const btn = document.getElementById('seed-btn');
    btn.disabled = true;
    btn.textContent = 'Mengisi...';
    try {
        await setDoc(doc(db, 'portfolio', 'about'),    SEED_DATA.about);
        await setDoc(doc(db, 'portfolio', 'skills'),   SEED_DATA.skills);
        await setDoc(doc(db, 'portfolio', 'software'), SEED_DATA.software);
        await setDoc(doc(db, 'portfolio', 'projects'), SEED_DATA.projects);
        await setDoc(doc(db, 'portfolio', 'contact'),  SEED_DATA.contact);
        showToast('✅ Data default berhasil diisi!');
        await loadAllData();
    } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Isi Data Default';
    }
});