// ==============================
// ADMIN.JS - FINAL STABLE VERSION
// ==============================

// 🔧 KONFIGURASI
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const ADMIN_PASSWORD = 'kelas6admin123';

let isSaving = false;

console.log('✅ Admin Panel Loaded');

// ==============================
// UTILITIES
// ==============================

function notify(message, type = 'success') {
  const div = document.createElement('div');
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
    color: white;
    padding: 12px 18px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function generateId(list) {
  return list.length ? Math.max(...list.map(i => i.id || 0)) + 1 : 1;
}

// ==============================
// LOAD DATA (ANTI ERROR)
// ==============================

async function loadData() {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?cache=${Date.now()}`
    );
    if (!res.ok) throw new Error('File not found');

    const data = await res.json();
    return {
      pengumuman: Array.isArray(data.pengumuman) ? data.pengumuman : [],
      kuis: Array.isArray(data.kuis) ? data.kuis : [],
      leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : []
    };
  } catch (e) {
    console.warn('⚠️ Data kosong / baru dibuat');
    return { pengumuman: [], kuis: [], leaderboard: [] };
  }
}

// ==============================
// SAVE TO GITHUB
// ==============================

async function saveToGitHub(data, message) {
  const token = localStorage.getItem('github_token');
  if (!token) {
    notify('Token GitHub belum diisi', 'error');
    return false;
  }

  try {
    const json = JSON.stringify(data, null, 2);
    const content = btoa(unescape(encodeURIComponent(json)));

    let sha = null;
    const check = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/data.json`,
      {
        headers: { Authorization: `token ${token}` }
      }
    );

    if (check.ok) {
      const file = await check.json();
      sha = file.sha;
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/data.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          content,
          sha,
          branch: GITHUB_BRANCH
        })
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    return true;
  } catch (err) {
    console.error(err);
    notify('Gagal menyimpan ke GitHub', 'error');
    return false;
  }
}

// ==============================
// PENGUMUMAN
// ==============================

async function savePengumuman() {
  if (isSaving) return;
  isSaving = true;

  const judul = document.getElementById('pengumuman-judul').value.trim();
  const konten = document.getElementById('pengumuman-konten').value.trim();
  const kategori = document.getElementById('pengumuman-kategori').value.trim();
  const lampiran = document.getElementById('pengumuman-lampiran').value.trim();
  const id = document.getElementById('pengumuman-id').value;

  if (!judul || !konten) {
    notify('Judul dan konten wajib diisi', 'error');
    isSaving = false;
    return;
  }

  const data = await loadData();

  const pengumuman = {
    id: id ? parseInt(id) : generateId(data.pengumuman),
    judul,
    konten,
    kategori,
    lampiran: lampiran || '',
    tanggal: new Date().toISOString()
  };

  if (id) {
    const index = data.pengumuman.findIndex(p => p.id == id);
    if (index !== -1) data.pengumuman[index] = pengumuman;
  } else {
    data.pengumuman.push(pengumuman);
  }

  const success = await saveToGitHub(
    data,
    id ? 'Update pengumuman' : 'Tambah pengumuman'
  );

  if (success) {
    notify('Pengumuman berhasil disimpan');
    cancelPengumumanForm();
    loadPengumumanList();
    loadDashboard();
  }

  isSaving = false;
}

async function loadPengumumanList() {
  const data = await loadData();
  const container = document.getElementById('pengumuman-list');

  if (!data.pengumuman.length) {
    container.innerHTML = '<p>Belum ada pengumuman</p>';
    return;
  }

  data.pengumuman.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  container.innerHTML = data.pengumuman.map(p => `
    <div style="border:1px solid #ddd;padding:10px;margin-bottom:10px;border-radius:6px">
      <strong>${p.judul}</strong><br>
      <small>${new Date(p.tanggal).toLocaleString('id-ID')}</small><br>
      <em>${p.kategori || '-'}</em>
      <div style="margin-top:8px">
        <button onclick="editPengumuman(${p.id})">Edit</button>
        <button onclick="deletePengumuman(${p.id})">Hapus</button>
      </div>
    </div>
  `).join('');
}

function editPengumuman(id) {
  loadData().then(data => {
    const p = data.pengumuman.find(x => x.id === id);
    if (!p) return;
    document.getElementById('pengumuman-judul').value = p.judul;
    document.getElementById('pengumuman-konten').value = p.konten;
    document.getElementById('pengumuman-kategori').value = p.kategori;
    document.getElementById('pengumuman-lampiran').value = p.lampiran;
    document.getElementById('pengumuman-id').value = p.id;
    document.getElementById('pengumuman-form').style.display = 'block';
  });
}

async function deletePengumuman(id) {
  if (!confirm('Hapus pengumuman ini?')) return;
  const data = await loadData();
  data.pengumuman = data.pengumuman.filter(p => p.id !== id);
  if (await saveToGitHub(data, 'Hapus pengumuman')) {
    notify('Pengumuman dihapus');
    loadPengumumanList();
    loadDashboard();
  }
}

// ==============================
// LOGIN & DASHBOARD
// ==============================

function login() {
  const password = document.getElementById('admin-password').value;
  const token = document.getElementById('github-token').value;

  if (password !== ADMIN_PASSWORD) {
    notify('Password salah', 'error');
    return;
  }

  if (token) localStorage.setItem('github_token', token);
  localStorage.setItem('admin_logged_in', 'true');

  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';

  loadDashboard();
  loadPengumumanList();
  notify('Login berhasil');
}

function logout() {
  localStorage.clear();
  location.reload();
}

async function loadDashboard() {
  const data = await loadData();
  document.getElementById('stat-pengumuman').textContent = data.pengumuman.length;
  document.getElementById('stat-kuis').textContent = data.kuis.length;
  document.getElementById('stat-leaderboard').textContent = data.leaderboard.length;
}

// ==============================
// INIT
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('admin_logged_in') === 'true') {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadDashboard();
    loadPengumumanList();
  }
});
