// admin.js - Simplified Version
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const ADMIN_PASSWORD = 'kelas6admin123';

console.log('🚀 Admin Panel Loaded');

// ==============================
// 1. AUTHENTICATION
// ==============================

function login() {
    const password = document.getElementById('admin-password').value;
    const token = document.getElementById('github-token').value;
    
    if (password !== ADMIN_PASSWORD) {
        alert('❌ Password salah!');
        return;
    }
    
    if (token) {
        localStorage.setItem('github_token', token);
        console.log('✅ Token saved');
    }
    
    localStorage.setItem('admin_logged_in', 'true');
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    loadDashboard();
    showSection('dashboard');
    alert('✅ Login berhasil!');
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
        showSection('dashboard');
    }
}

// ==============================
// 2. NAVIGATION
// ==============================

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(`${sectionId}-section`);
    if (section) section.classList.add('active');
    
    // Add active to nav button
    const navBtn = document.querySelector(`.nav-btn[onclick*="${sectionId}"]`);
    if (navBtn) navBtn.classList.add('active');
    
    // Load section data
    if (sectionId === 'pengumuman') {
        loadPengumumanList();
    } else if (sectionId === 'kuis') {
        loadKuisList();
    } else if (sectionId === 'galeri') {
        loadGaleriList();
    }
}

// ==============================
// 3. GITHUB API FUNCTIONS
// ==============================

async function getFileSHA(filename) {
    const token = localStorage.getItem('github_token');
    if (!token) return null;
    
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
            return data.sha;
        }
        return null;
    } catch (error) {
        console.error('Error getting SHA:', error);
        return null;
    }
}

async function saveToGitHub(filename, content, message) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('❌ Token GitHub tidak ditemukan! Silakan masukkan token.');
        return false;
    }
    
    console.log('💾 Saving to GitHub:', filename, message);
    
    try {
        // Get existing file SHA
        const sha = await getFileSHA(filename);
        
        // Convert content to base64
        const jsonString = JSON.stringify(content, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
        
        // Prepare request
        const requestBody = {
            message: message,
            content: base64Content,
            branch: GITHUB_BRANCH
        };
        
        if (sha) {
            requestBody.sha = sha;
        }
        
        // Send request
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filename}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (response.ok) {
            console.log('✅ Save successful!');
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Save failed:', error);
            alert(`❌ Gagal menyimpan: ${error.message}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`❌ Error: ${error.message}`);
        return false;
    }
}

async function loadData() {
    console.log('📥 Loading data...');
    
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Data loaded:', data);
            return data;
        } else {
            console.log('📄 Creating new data structure');
            return {
                pengumuman: [],
                kuis: [],
                leaderboard: []
            };
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
        return {
            pengumuman: [],
            kuis: [],
            leaderboard: []
        };
    }
}

// ==============================
// 4. PENGUMUMAN FUNCTIONS
// ==============================

function showPengumumanForm(id = null) {
    const form = document.getElementById('pengumuman-form');
    const title = document.getElementById('form-title');
    
    if (id) {
        title.textContent = 'Edit Pengumuman';
        loadPengumumanData(id);
    } else {
        title.textContent = 'Tambah Pengumuman Baru';
        document.getElementById('pengumuman-judul').value = '';
        document.getElementById('pengumuman-konten').value = '';
        document.getElementById('pengumuman-kategori').value = '';
        document.getElementById('pengumuman-lampiran').value = '';
        document.getElementById('pengumuman-id').value = '';
    }
    
    form.style.display = 'block';
}

async function loadPengumumanData(id) {
    try {
        const data = await loadData();
        const pengumuman = data.pengumuman?.find(p => p.id == id);
        
        if (pengumuman) {
            document.getElementById('pengumuman-judul').value = pengumuman.judul || '';
            document.getElementById('pengumuman-konten').value = pengumuman.konten || '';
            document.getElementById('pengumuman-kategori').value = pengumuman.kategori || '';
            document.getElementById('pengumuman-lampiran').value = pengumuman.lampiran || '';
            document.getElementById('pengumuman-id').value = pengumuman.id;
        }
    } catch (error) {
        console.error('Error loading pengumuman data:', error);
    }
}

async function savePengumuman() {
    console.log('💾 Saving pengumuman...');
    
    const judul = document.getElementById('pengumuman-judul').value.trim();
    const konten = document.getElementById('pengumuman-konten').value.trim();
    const kategori = document.getElementById('pengumuman-kategori').value.trim();
    const lampiran = document.getElementById('pengumuman-lampiran').value.trim();
    const id = document.getElementById('pengumuman-id').value;
    
    if (!judul || !konten) {
        alert('❌ Judul dan konten harus diisi!');
        return;
    }
    
    try {
        // Load current data
        const data = await loadData();
        
        if (!data.pengumuman) data.pengumuman = [];
        
        if (id) {
            // Update existing
            const index = data.pengumuman.findIndex(p => p.id == id);
            if (index !== -1) {
                data.pengumuman[index] = {
                    id: parseInt(id),
                    judul,
                    konten,
                    kategori,
                    lampiran: lampiran || '',
                    tanggal: data.pengumuman[index].tanggal
                };
            }
        } else {
            // Add new
            const newId = data.pengumuman.length > 0 
                ? Math.max(...data.pengumuman.map(p => p.id)) + 1 
                : 1;
            
            data.pengumuman.push({
                id: newId,
                judul,
                konten,
                kategori,
                lampiran: lampiran || '',
                tanggal: new Date().toISOString()
            });
        }
        
        // Save to GitHub
        const message = id ? `Update pengumuman: ${judul}` : `Tambah pengumuman: ${judul}`;
        const success = await saveToGitHub('data.json', data, message);
        
        if (success) {
            alert('✅ Pengumuman berhasil disimpan!');
            document.getElementById('pengumuman-form').style.display = 'none';
            loadPengumumanList();
            loadDashboard();
        }
        
    } catch (error) {
        console.error('❌ Error saving pengumuman:', error);
        alert(`❌ Gagal menyimpan: ${error.message}`);
    }
}

function cancelPengumumanForm() {
    document.getElementById('pengumuman-form').style.display = 'none';
}

async function loadPengumumanList() {
    console.log('📋 Loading pengumuman list...');
    
    try {
        const data = await loadData();
        const pengumuman = data.pengumuman || [];
        
        const container = document.getElementById('pengumuman-list');
        if (!container) return;
        
        if (pengumuman.length === 0) {
            container.innerHTML = '<p>Belum ada pengumuman</p>';
            return;
        }
        
        // Sort by date (newest first)
        pengumuman.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f2f2f2;">
                        <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Judul</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Tanggal</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Kategori</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        pengumuman.forEach(p => {
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${p.id}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${p.judul}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${p.kategori || '-'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">
                        <button onclick="showPengumumanForm(${p.id})" style="background: #f39c12; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                            Edit
                        </button>
                        <button onclick="deletePengumuman(${p.id})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading pengumuman list:', error);
        document.getElementById('pengumuman-list').innerHTML = '<p style="color: red;">Gagal memuat data</p>';
    }
}

async function deletePengumuman(id) {
    if (!confirm('Hapus pengumuman ini?')) return;
    
    try {
        const data = await loadData();
        const initialCount = data.pengumuman?.length || 0;
        
        data.pengumuman = data.pengumuman?.filter(p => p.id != id) || [];
        
        if (initialCount === data.pengumuman.length) {
            alert('Pengumuman tidak ditemukan!');
            return;
        }
        
        const success = await saveToGitHub('data.json', data, `Hapus pengumuman ID: ${id}`);
        
        if (success) {
            alert('✅ Pengumuman berhasil dihapus!');
            loadPengumumanList();
            loadDashboard();
        }
        
    } catch (error) {
        console.error('Error deleting pengumuman:', error);
        alert('❌ Gagal menghapus pengumuman');
    }
}

// ==============================
// 5. KUIS FUNCTIONS
// ==============================

function showKuisForm(id = null) {
    const form = document.getElementById('kuis-form');
    const title = document.getElementById('kuis-form-title');
    
    if (id) {
        title.textContent = 'Edit Soal Kuis';
        loadKuisData(id);
    } else {
        title.textContent = 'Tambah Soal Kuis';
        document.getElementById('kuis-pertanyaan').value = '';
        document.getElementById('pilihan1').value = '';
        document.getElementById('pilihan2').value = '';
        document.getElementById('pilihan3').value = '';
        document.getElementById('pilihan4').value = '';
        document.getElementById('jawaban-benar').value = '0';
        document.getElementById('kuis-penjelasan').value = '';
        document.getElementById('kuis-kategori').value = '';
        document.getElementById('kuis-id').value = '';
    }
    
    form.style.display = 'block';
}

async function loadKuisData(id) {
    try {
        const data = await loadData();
        const kuis = data.kuis?.find(q => q.id == id);
        
        if (kuis) {
            document.getElementById('kuis-pertanyaan').value = kuis.pertanyaan;
            document.getElementById('pilihan1').value = kuis.pilihan[0];
            document.getElementById('pilihan2').value = kuis.pilihan[1];
            document.getElementById('pilihan3').value = kuis.pilihan[2];
            document.getElementById('pilihan4').value = kuis.pilihan[3];
            document.getElementById('jawaban-benar').value = kuis.jawaban;
            document.getElementById('kuis-penjelasan').value = kuis.penjelasan || '';
            document.getElementById('kuis-kategori').value = kuis.kategori || '';
            document.getElementById('kuis-id').value = kuis.id;
        }
    } catch (error) {
        console.error('Error loading kuis data:', error);
    }
}

async function saveKuis() {
    console.log('💾 Saving kuis...');
    
    const pertanyaan = document.getElementById('kuis-pertanyaan').value.trim();
    const pilihan1 = document.getElementById('pilihan1').value.trim();
    const pilihan2 = document.getElementById('pilihan2').value.trim();
    const pilihan3 = document.getElementById('pilihan3').value.trim();
    const pilihan4 = document.getElementById('pilihan4').value.trim();
    const jawaban = parseInt(document.getElementById('jawaban-benar').value);
    const penjelasan = document.getElementById('kuis-penjelasan').value.trim();
    const kategori = document.getElementById('kuis-kategori').value.trim();
    const id = document.getElementById('kuis-id').value;
    
    if (!pertanyaan || !pilihan1 || !pilihan2 || !pilihan3 || !pilihan4) {
        alert('❌ Semua field harus diisi!');
        return;
    }
    
    try {
        const data = await loadData();
        if (!data.kuis) data.kuis = [];
        
        const kuisData = {
            pertanyaan,
            pilihan: [pilihan1, pilihan2, pilihan3, pilihan4],
            jawaban,
            penjelasan: penjelasan || '',
            kategori: kategori || '',
            level: 'Menengah'
        };
        
        if (id) {
            const index = data.kuis.findIndex(q => q.id == id);
            if (index !== -1) {
                data.kuis[index] = { ...kuisData, id: parseInt(id) };
            }
        } else {
            const newId = data.kuis.length > 0 
                ? Math.max(...data.kuis.map(q => q.id)) + 1 
                : 1;
            data.kuis.push({ ...kuisData, id: newId });
        }
        
        const message = id ? 'Update soal kuis' : 'Tambah soal kuis';
        const success = await saveToGitHub('data.json', data, message);
        
        if (success) {
            alert('✅ Soal kuis berhasil disimpan!');
            document.getElementById('kuis-form').style.display = 'none';
            loadKuisList();
            loadDashboard();
        }
        
    } catch (error) {
        console.error('❌ Error saving kuis:', error);
        alert(`❌ Gagal menyimpan: ${error.message}`);
    }
}

function cancelKuisForm() {
    document.getElementById('kuis-form').style.display = 'none';
}

async function loadKuisList() {
    console.log('📋 Loading kuis list...');
    
    try {
        const data = await loadData();
        const kuis = data.kuis || [];
        
        const container = document.getElementById('kuis-list');
        if (!container) return;
        
        if (kuis.length === 0) {
            container.innerHTML = '<p>Belum ada soal kuis</p>';
            return;
        }
        
        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f2f2f2;">
                        <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Pertanyaan</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Kategori</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        kuis.forEach(q => {
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${q.id}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${q.pertanyaan.substring(0, 50)}${q.pertanyaan.length > 50 ? '...' : ''}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${q.kategori || '-'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">
                        <button onclick="showKuisForm(${q.id})" style="background: #f39c12; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                            Edit
                        </button>
                        <button onclick="deleteKuis(${q.id})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading kuis list:', error);
        container.innerHTML = '<p style="color: red;">Gagal memuat data</p>';
    }
}

async function deleteKuis(id) {
    if (!confirm('Hapus soal ini?')) return;
    
    try {
        const data = await loadData();
        data.kuis = data.kuis.filter(q => q.id != id);
        
        const success = await saveToGitHub('data.json', data, `Hapus soal kuis ID: ${id}`);
        
        if (success) {
            alert('✅ Soal berhasil dihapus!');
            loadKuisList();
            loadDashboard();
        }
        
    } catch (error) {
        console.error('Error deleting kuis:', error);
        alert('❌ Gagal menghapus soal');
    }
}

// ==============================
// 6. DASHBOARD & GALERI
// ==============================

async function loadDashboard() {
    try {
        const data = await loadData();
        
        document.getElementById('stat-pengumuman').textContent = data.pengumuman?.length || 0;
        document.getElementById('stat-kuis').textContent = data.kuis?.length || 0;
        document.getElementById('stat-leaderboard').textContent = data.leaderboard?.length || 0;
        
        // Get gallery stats
        const galeriCount = await getGaleriStats();
        document.getElementById('stat-galeri').textContent = galeriCount;
        
        // Update status
        const token = localStorage.getItem('github_token');
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="background: ${token ? '#d4edda' : '#f8d7da'}; 
                            color: ${token ? '#155724' : '#721c24'};
                            padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>Status Sistem:</strong><br>
                    • GitHub API: ${token ? '✅ Terhubung' : '⚠️ Token tidak ditemukan'}<br>
                    • Terakhir Update: ${new Date().toLocaleString('id-ID')}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function getGaleriStats() {
    const token = localStorage.getItem('github_token');
    if (!token) return 0;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri?ref=${GITHUB_BRANCH}`
        );
        
        if (!response.ok) return 0;
        
        const files = await response.json();
        if (!Array.isArray(files)) return 0;
        
        return files.filter(file => 
            file.type === 'file' && 
            /\.(jpg|jpeg|png)$/i.test(file.name)
        ).length;
        
    } catch (error) {
        return 0;
    }
}

async function loadGaleriList() {
    const token = localStorage.getItem('github_token');
    if (!token) {
        document.getElementById('galeri-list').innerHTML = '<p>Token tidak ditemukan</p>';
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri?ref=${GITHUB_BRANCH}`
        );
        
        if (!response.ok) {
            document.getElementById('galeri-list').innerHTML = '<p>Folder tidak ditemukan</p>';
            return;
        }
        
        const files = await response.json();
        if (!Array.isArray(files)) {
            document.getElementById('galeri-list').innerHTML = '<p>Tidak ada foto</p>';
            return;
        }
        
        const imageFiles = files.filter(file => 
            file.type === 'file' && 
            /\.(jpg|jpeg|png)$/i.test(file.name)
        );
        
        const galeriList = document.getElementById('galeri-list');
        galeriList.innerHTML = '';
        
        imageFiles.forEach(file => {
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${file.path}`;
            
            const imgDiv = document.createElement('div');
            imgDiv.style.cssText = 'border: 1px solid #ddd; border-radius: 8px; padding: 10px; margin: 10px; width: 150px; display: inline-block; text-align: center;';
            
            imgDiv.innerHTML = `
                <img src="${rawUrl}" alt="${file.name}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 5px;">
                <p style="font-size: 12px; margin: 5px 0;">${file.name}</p>
                <button onclick="deleteFoto('${file.path}', '${file.sha}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; width: 100%; cursor: pointer;">
                    Hapus
                </button>
            `;
            galeriList.appendChild(imgDiv);
        });
        
    } catch (error) {
        console.error('Error loading galeri list:', error);
    }
}

async function deleteFoto(path, sha) {
    if (!confirm('Hapus foto ini?')) return;
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('Token tidak ditemukan');
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Hapus foto: ${path.split('/').pop()}`,
                    sha: sha,
                    branch: GITHUB_BRANCH
                })
            }
        );
        
        if (response.ok) {
            alert('✅ Foto berhasil dihapus');
            loadGaleriList();
            loadDashboard();
        } else {
            alert('❌ Gagal menghapus foto');
        }
        
    } catch (error) {
        console.error('Error deleting foto:', error);
        alert('❌ Gagal menghapus foto');
    }
}

// ==============================
// 7. OTHER FUNCTIONS
// ==============================

function previewJadwal(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('jadwal-preview');
        const img = document.getElementById('preview-image');
        
        if (preview && img) {
            img.src = e.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

async function uploadJadwal() {
    const fileInput = document.getElementById('jadwal-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Pilih file jadwal terlebih dahulu');
        return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('Token tidak ditemukan');
        return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async function() {
        const base64Content = reader.result.split(',')[1];
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/jadwal/jadwal.jpg`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Update jadwal`,
                        content: base64Content,
                        branch: GITHUB_BRANCH
                    })
                }
            );
            
            if (response.ok) {
                alert('✅ Jadwal berhasil diupdate!');
                fileInput.value = '';
                document.getElementById('jadwal-preview').style.display = 'none';
            } else {
                alert('❌ Gagal mengupload jadwal');
            }
            
        } catch (error) {
            console.error('Error uploading jadwal:', error);
            alert('❌ Gagal mengupload jadwal');
        }
    };
}

async function backupData() {
    try {
        const data = await loadData();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-kelas6-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Backup berhasil didownload!');
        
    } catch (error) {
        console.error('Error backing up data:', error);
        alert('❌ Gagal melakukan backup');
    }
}

async function restoreData() {
    const fileInput = document.getElementById('backup-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Pilih file backup terlebih dahulu');
        return;
    }
    
    if (!confirm('Restore akan mengganti semua data. Lanjutkan?')) return;
    
    const reader = new FileReader();
    reader.readAsText(file);
    
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.kuis || !data.pengumuman) {
                alert('Format file backup tidak valid');
                return;
            }
            
            const success = await saveToGitHub('data.json', data, 'Restore data');
            
            if (success) {
                alert('✅ Restore berhasil!');
                fileInput.value = '';
                loadDashboard();
                loadPengumumanList();
                loadKuisList();
            }
            
        } catch (error) {
            alert('File JSON tidak valid');
        }
    };
}

async function resetData() {
    if (!confirm('PERINGATAN: Ini akan menghapus SEMUA data. Lanjutkan?')) return;
    if (!confirm('YAKIN? Data yang dihapus tidak dapat dikembalikan!')) return;
    
    const defaultData = {
        pengumuman: [],
        kuis: [],
        leaderboard: []
    };
    
    const success = await saveToGitHub('data.json', defaultData, 'Reset semua data');
    
    if (success) {
        alert('✅ Data berhasil direset!');
        loadDashboard();
        loadPengumumanList();
        loadKuisList();
    }
}

// ==============================
// 8. INITIALIZATION
// ==============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Panel Initialized');
    checkLogin();
    
    // Setup enter key for login
    document.getElementById('admin-password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('github-token')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
});

// ==============================
// 9. DEBUG FUNCTIONS
// ==============================

window.testSystem = async function() {
    console.log('🧪 TESTING SYSTEM...');
    
    // Test token
    const token = localStorage.getItem('github_token');
    console.log('Token:', token ? '✅ Found' : '❌ Not found');
    
    if (token) {
        // Test GitHub API
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${token}` }
            });
            console.log('GitHub API:', response.ok ? '✅ OK' : '❌ Failed');
        } catch (error) {
            console.error('GitHub API error:', error);
        }
    }
    
    // Test data loading
    const data = await loadData();
    console.log('Data loaded:', data);
    
    console.log('🧪 TEST COMPLETE');
};

window.manualTest = function() {
    console.log('🧪 MANUAL TEST');
    console.log('1. Cek apakah fungsi terdefinisi:');
    console.log('   savePengumuman:', typeof savePengumuman);
    console.log('   saveKuis:', typeof saveKuis);
    console.log('   saveToGitHub:', typeof saveToGitHub);
    
    console.log('\n2. Cek apakah form ada:');
    console.log('   pengumuman-form:', document.getElementById('pengumuman-form'));
    console.log('   kuis-form:', document.getElementById('kuis-form'));
    
    console.log('\n3. Test dengan mengetik di console:');
    console.log('   testSystem() - untuk test sistem');
    console.log('   showPengumumanForm() - untuk buka form pengumuman');
    console.log('   showKuisForm() - untuk buka form kuis');
};

// Run manual test on load
setTimeout(() => {
    console.log('\n\n=== ADMIN PANEL READY ===');
    manualTest();
}, 1000);
