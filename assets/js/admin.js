// admin.js - Versi Sederhana & Diperbaiki
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const ADMIN_PASSWORD = 'kelas6admin123';

// ==============================
// FUNGSI UTAMA
// ==============================

function login() {
    const password = document.getElementById('admin-password').value;
    const token = document.getElementById('github-token').value;
    
    if (password !== ADMIN_PASSWORD) {
        alert('Password salah!');
        return;
    }
    
    if (token) {
        localStorage.setItem('github_token', token);
    }
    
    localStorage.setItem('admin_logged_in', 'true');
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadDashboard();
}

function logout() {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('github_token');
    window.location.reload();
}

function checkLogin() {
    if (localStorage.getItem('admin_logged_in') === 'true') {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadDashboard();
    }
}

// ==============================
// FUNGSI SAVE TO GITHUB (DIPERBAIKI)
// ==============================

async function saveToGitHub(filename, content, message) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        console.error('❌ Token tidak ditemukan');
        return false;
    }
    
    try {
        console.log(`💾 Menyimpan ${filename}...`);
        
        // 1. Dapatkan SHA file jika sudah ada
        let sha = null;
        try {
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filename}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                sha = data.sha;
                console.log('📄 File ditemukan, SHA:', sha?.substring(0, 20) + '...');
            }
        } catch (e) {
            console.log('📄 File belum ada, akan dibuat baru');
        }
        
        // 2. Konversi konten ke base64
        const jsonString = JSON.stringify(content, null, 2);
        console.log('Konten JSON:', jsonString);
        
        // Base64 encoding yang benar
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
        
        // 3. Kirim ke GitHub
        const requestBody = {
            message: message,
            content: base64Content,
            branch: GITHUB_BRANCH
        };
        
        if (sha) {
            requestBody.sha = sha;
        }
        
        console.log('📤 Mengirim ke GitHub...', requestBody.message);
        
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filename}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        const result = await response.json();
        console.log('📥 Response GitHub:', result);
        
        if (response.ok) {
            console.log('✅ Berhasil disimpan!');
            return true;
        } else {
            console.error('❌ Gagal menyimpan:', result.message);
            alert(`Gagal menyimpan: ${result.message}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`Error: ${error.message}`);
        return false;
    }
}

// ==============================
// FUNGSI PENGUMUMAN
// ==============================

async function loadPengumumanList() {
    try {
        console.log('📥 Memuat daftar pengumuman...');
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        if (!response.ok) {
            throw new Error('Gagal memuat data');
        }
        
        const data = await response.json();
        const pengumuman = data.pengumuman || [];
        
        console.log('📊 Data pengumuman:', pengumuman);
        
        const container = document.getElementById('pengumuman-list');
        if (!container) {
            console.error('❌ Container tidak ditemukan');
            return;
        }
        
        if (pengumuman.length === 0) {
            container.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada pengumuman</td></tr>';
            return;
        }
        
        // Urutkan berdasarkan tanggal terbaru
        pengumuman.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        let html = '';
        pengumuman.forEach(p => {
            html += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.judul}</td>
                    <td>${new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${p.kategori || '-'}</td>
                    <td>
                        <button onclick="editPengumuman(${p.id})" class="action-btn edit-btn">Edit</button>
                        <button onclick="deletePengumuman(${p.id})" class="action-btn delete-btn">Hapus</button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error memuat pengumuman:', error);
        document.getElementById('pengumuman-list').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; color: red;">Gagal memuat data</td></tr>';
    }
}

function showPengumumanForm() {
    document.getElementById('pengumuman-form').style.display = 'block';
    document.getElementById('form-title').textContent = 'Tambah Pengumuman Baru';
    
    // Reset form
    document.getElementById('pengumuman-judul').value = '';
    document.getElementById('pengumuman-konten').value = '';
    document.getElementById('pengumuman-kategori').value = '';
    document.getElementById('pengumuman-lampiran').value = '';
    document.getElementById('pengumuman-id').value = '';
}

async function editPengumuman(id) {
    console.log(`✏️ Mengedit pengumuman ID: ${id}`);
    
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        if (!response.ok) {
            throw new Error('Gagal memuat data');
        }
        
        const data = await response.json();
        const pengumuman = data.pengumuman?.find(p => p.id == id);
        
        if (pengumuman) {
            document.getElementById('pengumuman-judul').value = pengumuman.judul || '';
            document.getElementById('pengumuman-konten').value = pengumuman.konten || '';
            document.getElementById('pengumuman-kategori').value = pengumuman.kategori || '';
            document.getElementById('pengumuman-lampiran').value = pengumuman.lampiran || '';
            document.getElementById('pengumuman-id').value = pengumuman.id;
            
            document.getElementById('pengumuman-form').style.display = 'block';
            document.getElementById('form-title').textContent = 'Edit Pengumuman';
            
            console.log('✅ Form diisi dengan data:', pengumuman);
        } else {
            alert('Pengumuman tidak ditemukan!');
        }
    } catch (error) {
        console.error('❌ Error memuat data edit:', error);
        alert('Gagal memuat data pengumuman');
    }
}

async function savePengumuman() {
    console.log('💾 Menyimpan pengumuman...');
    
    const judul = document.getElementById('pengumuman-judul').value.trim();
    const konten = document.getElementById('pengumuman-konten').value.trim();
    const kategori = document.getElementById('pengumuman-kategori').value.trim();
    const lampiran = document.getElementById('pengumuman-lampiran').value.trim();
    const id = document.getElementById('pengumuman-id').value;
    
    console.log('Data form:', { judul, konten, kategori, lampiran, id });
    
    if (!judul || !konten) {
        alert('Judul dan konten harus diisi!');
        return;
    }
    
    try {
        // 1. Load data saat ini
        let data;
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
            );
            
            if (response.ok) {
                data = await response.json();
                console.log('📥 Data saat ini:', data);
            } else {
                // Buat struktur baru jika file tidak ada
                data = {
                    pengumuman: [],
                    kuis: [],
                    leaderboard: []
                };
                console.log('📄 Membuat data baru');
            }
        } catch (error) {
            // Jika error, buat data baru
            data = {
                pengumuman: [],
                kuis: [],
                leaderboard: []
            };
            console.log('📄 Membuat data baru karena error:', error);
        }
        
        if (!data.pengumuman) {
            data.pengumuman = [];
        }
        
        // 2. Cek apakah edit atau tambah baru
        if (id && id !== '') {
            // EDIT: Update pengumuman yang ada
            const index = data.pengumuman.findIndex(p => p.id == id);
            if (index !== -1) {
                data.pengumuman[index] = {
                    id: parseInt(id),
                    judul,
                    konten,
                    kategori,
                    lampiran: lampiran || null,
                    tanggal: data.pengumuman[index].tanggal // Pertahankan tanggal lama
                };
                console.log('✏️ Mengupdate pengumuman:', data.pengumuman[index]);
            } else {
                alert('Pengumuman tidak ditemukan!');
                return;
            }
        } else {
            // TAMBAH BARU: Buat ID baru
            const newId = data.pengumuman.length > 0 
                ? Math.max(...data.pengumuman.map(p => p.id)) + 1 
                : 1;
            
            const newPengumuman = {
                id: newId,
                judul,
                konten,
                kategori,
                lampiran: lampiran || null,
                tanggal: new Date().toISOString()
            };
            
            data.pengumuman.push(newPengumuman);
            console.log('➕ Menambah pengumuman baru:', newPengumuman);
        }
        
        // 3. Simpan ke GitHub
        console.log('💾 Menyimpan data lengkap:', data);
        const message = id ? `Update pengumuman: ${judul}` : `Tambah pengumuman: ${judul}`;
        const success = await saveToGitHub('data.json', data, message);
        
        if (success) {
            alert('✅ Pengumuman berhasil disimpan!');
            
            // Reset form dan refresh data
            document.getElementById('pengumuman-form').style.display = 'none';
            loadPengumumanList();
            loadDashboard();
        } else {
            alert('❌ Gagal menyimpan pengumuman');
        }
        
    } catch (error) {
        console.error('❌ Error menyimpan pengumuman:', error);
        alert(`Gagal menyimpan: ${error.message}`);
    }
}

function cancelPengumumanForm() {
    document.getElementById('pengumuman-form').style.display = 'none';
}

async function deletePengumuman(id) {
    console.log(`🗑️ Menghapus pengumuman ID: ${id}`);
    
    if (!confirm(`Apakah Anda yakin ingin menghapus pengumuman ini?`)) {
        return;
    }
    
    try {
        // 1. Load data saat ini
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        if (!response.ok) {
            throw new Error('Gagal memuat data');
        }
        
        const data = await response.json();
        console.log('Data sebelum hapus:', data);
        
        // 2. Filter out pengumuman yang akan dihapus
        const originalCount = data.pengumuman?.length || 0;
        data.pengumuman = data.pengumuman?.filter(p => p.id != id) || [];
        const newCount = data.pengumuman.length;
        
        console.log(`Menghapus: ${originalCount} -> ${newCount} pengumuman`);
        
        if (originalCount === newCount) {
            alert('Pengumuman tidak ditemukan!');
            return;
        }
        
        // 3. Simpan ke GitHub
        const success = await saveToGitHub('data.json', data, `Hapus pengumuman ID: ${id}`);
        
        if (success) {
            alert('✅ Pengumuman berhasil dihapus!');
            loadPengumumanList();
            loadDashboard();
        } else {
            alert('❌ Gagal menghapus pengumuman');
        }
        
    } catch (error) {
        console.error('❌ Error menghapus pengumuman:', error);
        alert(`Gagal menghapus: ${error.message}`);
    }
}

// ==============================
// FUNGSI DASHBOARD & LAINNYA
// ==============================

async function loadDashboard() {
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('stat-pengumuman').textContent = data.pengumuman?.length || 0;
            document.getElementById('stat-kuis').textContent = data.kuis?.length || 0;
            document.getElementById('stat-leaderboard').textContent = data.leaderboard?.length || 0;
        }
        
        // Update status sistem
        const token = localStorage.getItem('github_token');
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="background: ${token ? '#d4edda' : '#f8d7da'}; 
                            color: ${token ? '#155724' : '#721c24'};
                            padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <strong>Status:</strong> ${token ? '✅ Terhubung ke GitHub' : '⚠️ Token tidak ditemukan'}
                    <br><small>Terakhir update: ${new Date().toLocaleTimeString('id-ID')}</small>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function showSection(sectionId) {
    // Sembunyikan semua section
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Tampilkan section yang dipilih
    document.getElementById(`${sectionId}-section`).style.display = 'block';
    
    // Load data jika diperlukan
    if (sectionId === 'pengumuman') {
        loadPengumumanList();
    } else if (sectionId === 'dashboard') {
        loadDashboard();
    }
}

// ==============================
// FUNGSI TESTING & DEBUG
// ==============================

async function testSystem() {
    console.log('🧪 TESTING SYSTEM...');
    
    // 1. Cek token
    const token = localStorage.getItem('github_token');
    console.log('1. Token:', token ? '✅ Ada' : '❌ Tidak ada');
    
    if (token) {
        // 2. Cek koneksi ke GitHub
        try {
            const response = await fetch(`https://api.github.com/user`, {
                headers: { 'Authorization': `token ${token}` }
            });
            console.log('2. GitHub connection:', response.ok ? '✅ OK' : '❌ Gagal');
        } catch (error) {
            console.error('2. GitHub connection error:', error);
        }
        
        // 3. Cek repository
        try {
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}`,
                { headers: { 'Authorization': `token ${token}` } }
            );
            console.log('3. Repository access:', response.ok ? '✅ OK' : '❌ Gagal');
        } catch (error) {
            console.error('3. Repository error:', error);
        }
    }
    
    // 4. Cek data.json
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json`
        );
        console.log('4. data.json exists:', response.ok ? '✅ Ya' : '❌ Tidak');
        
        if (response.ok) {
            const data = await response.json();
            console.log('   Data structure:', {
                pengumuman: data.pengumuman?.length || 0,
                kuis: data.kuis?.length || 0
            });
        }
    } catch (error) {
        console.error('4. data.json error:', error);
    }
    
    console.log('🧪 TEST COMPLETE');
}

// ==============================
// INISIALISASI
// ==============================

document.addEventListener('DOMContentLoaded', function() {
    checkLogin();
    
    // Event listener untuk login
    document.getElementById('admin-password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('github-token')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    // Setup navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(sectionId);
        });
    });
    
    // Setup form events
    document.getElementById('save-pengumuman-btn')?.addEventListener('click', savePengumuman);
    document.getElementById('cancel-pengumuman-btn')?.addEventListener('click', cancelPengumumanForm);
    
    // Auto show dashboard jika sudah login
    if (localStorage.getItem('admin_logged_in') === 'true') {
        showSection('dashboard');
    }
    
    // Test sistem saat load
    setTimeout(testSystem, 1000);
});

// Tambahkan CSS inline
const style = document.createElement('style');
style.textContent = `
    .section {
        display: none;
    }
    
    .section.active {
        display: block;
    }
    
    .action-btn {
        padding: 5px 10px;
        margin: 2px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .edit-btn {
        background: #3498db;
        color: white;
    }
    
    .delete-btn {
        background: #e74c3c;
        color: white;
    }
    
    .action-btn:hover {
        opacity: 0.9;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }
    
    th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    
    th {
        background-color: #f2f2f2;
    }
    
    tr:hover {
        background-color: #f5f5f5;
    }
    
    .form-container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin: 20px 0;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    
    .form-group input,
    .form-group textarea,
    .form-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    }
    
    .form-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }
    
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }
    
    .btn-primary {
        background: #3498db;
        color: white;
    }
    
    .btn-secondary {
        background: #95a5a6;
        color: white;
    }
    
    .btn-danger {
        background: #e74c3c;
        color: white;
    }
`;
document.head.appendChild(style);

// Export fungsi untuk debugging di console
window.testSystem = testSystem;
window.loadPengumumanList = loadPengumumanList;
window.savePengumuman = savePengumuman;
window.editPengumuman = editPengumuman;
window.deletePengumuman = deletePengumuman;
