// admin.js
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
        showSection('dashboard');
    }
}

function showSection(sectionId) {
    // Sembunyikan semua section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Hilangkan active class dari semua tombol nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Tampilkan section yang dipilih
    document.getElementById(`${sectionId}-section`).classList.add('active');
    
    // Tambah active class ke tombol nav
    const activeBtn = document.querySelector(`.nav-btn[onclick*="${sectionId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Load data section jika diperlukan
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'pengumuman':
            loadPengumumanList();
            break;
        case 'kuis':
            loadKuisList();
            break;
        case 'galeri':
            loadGaleriList();
            break;
    }
}

// ==============================
// FUNGSI SAVE TO GITHUB
// ==============================

async function saveToGitHub(filename, content, message) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('❌ GitHub Token tidak ditemukan! Masukkan token di form login.');
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
                console.log('📄 File ditemukan');
            }
        } catch (e) {
            console.log('📄 File belum ada, akan dibuat baru');
        }
        
        // 2. Konversi konten ke base64
        const jsonString = JSON.stringify(content, null, 2);
        
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
        
        console.log('📤 Mengirim ke GitHub...');
        
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
            alert(`❌ Gagal menyimpan: ${result.message}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`❌ Error: ${error.message}`);
        return false;
    }
}

// ==============================
// FUNGSI DASHBOARD
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
        
        // Get gallery stats
        const galeriCount = await getGaleriStats();
        document.getElementById('stat-galeri').textContent = galeriCount;
        
        // Update status sistem
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

// ==============================
// FUNGSI PENGUMUMAN
// ==============================

function showPengumumanForm(id = null) {
    const form = document.getElementById('pengumuman-form');
    const title = document.getElementById('form-title');
    
    if (id) {
        // Edit mode
        title.textContent = 'Edit Pengumuman';
        loadPengumumanData(id);
    } else {
        // Add mode
        title.textContent = 'Tambah Pengumuman Baru';
        
        // Reset form
        document.getElementById('pengumuman-judul').value = '';
        document.getElementById('pengumuman-konten').value = '';
        document.getElementById('pengumuman-kategori').value = '';
        document.getElementById('pengumuman-lampiran').value = '';
        document.getElementById('pengumuman-id').value = '';
    }
    
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

async function loadPengumumanData(id) {
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
        }
    } catch (error) {
        console.error('Error loading pengumuman data:', error);
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
                console.log('📥 Data saat ini dimuat');
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
            data = {
                pengumuman: [],
                kuis: [],
                leaderboard: []
            };
            console.log('📄 Membuat data baru karena error');
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
                    kategori: kategori || '',
                    lampiran: lampiran || '',
                    tanggal: data.pengumuman[index].tanggal // Pertahankan tanggal lama
                };
                console.log('✏️ Mengupdate pengumuman ID:', id);
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
                kategori: kategori || '',
                lampiran: lampiran || '',
                tanggal: new Date().toISOString()
            };
            
            data.pengumuman.push(newPengumuman);
            console.log('➕ Menambah pengumuman baru ID:', newId);
        }
        
        // 3. Simpan ke GitHub
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
        
        const container = document.getElementById('pengumuman-list');
        if (!container) {
            console.error('❌ Container tidak ditemukan');
            return;
        }
        
        if (pengumuman.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">Belum ada pengumuman</p>';
            return;
        }
        
        // Urutkan berdasarkan tanggal terbaru
        pengumuman.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Judul</th>
                        <th>Tanggal</th>
                        <th>Kategori</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        pengumuman.forEach(p => {
            html += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.judul}</td>
                    <td>${new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${p.kategori || '-'}</td>
                    <td>
                        <button onclick="showPengumumanForm(${p.id})" class="action-btn edit-btn">Edit</button>
                        <button onclick="deletePengumuman(${p.id})" class="action-btn delete-btn">Hapus</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error memuat pengumuman:', error);
        document.getElementById('pengumuman-list').innerHTML = 
            '<p style="text-align: center; color: red; padding: 20px;">Gagal memuat data</p>';
    }
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
        
        // 2. Filter out pengumuman yang akan dihapus
        const originalCount = data.pengumuman?.length || 0;
        data.pengumuman = data.pengumuman?.filter(p => p.id != id) || [];
        const newCount = data.pengumuman.length;
        
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
// FUNGSI KUIS
// ==============================

function showKuisForm(id = null) {
    const form = document.getElementById('kuis-form');
    const title = document.getElementById('kuis-form-title');
    
    if (id) {
        title.textContent = 'Edit Soal Kuis';
        loadKuisData(id);
    } else {
        title.textContent = 'Tambah Soal Kuis';
        
        // Reset form
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
    form.scrollIntoView({ behavior: 'smooth' });
}

async function loadKuisData(id) {
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        const data = await response.json();
        
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
    const pertanyaan = document.getElementById('kuis-pertanyaan').value.trim();
    const pilihan1 = document.getElementById('pilihan1').value.trim();
    const pilihan2 = document.getElementById('pilihan2').value.trim();
    const pilihan3 = document.getElementById('pilihan3').value.trim();
    const pilihan4 = document.getElementById('pilihan4').value.trim();
    const jawaban = parseInt(document.getElementById('jawaban-benar').value);
    const penjelasan = document.getElementById('kuis-penjelasan').value.trim();
    const kategori = document.getElementById('kuis-kategori').value.trim();
    const id = document.getElementById('kuis-id').value;
    
    // Validation
    if (!pertanyaan || !pilihan1 || !pilihan2 || !pilihan3 || !pilihan4) {
        alert('Semua field harus diisi!');
        return;
    }
    
    if (jawaban < 0 || jawaban > 3) {
        alert('Jawaban benar harus antara 0-3!');
        return;
    }
    
    try {
        // Load current data
        let data;
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
            );
            
            if (response.ok) {
                data = await response.json();
            } else {
                data = {
                    pengumuman: [],
                    kuis: [],
                    leaderboard: []
                };
            }
        } catch (error) {
            data = {
                pengumuman: [],
                kuis: [],
                leaderboard: []
            };
        }
        
        if (!data.kuis) {
            data.kuis = [];
        }
        
        const kuisData = {
            pertanyaan,
            pilihan: [pilihan1, pilihan2, pilihan3, pilihan4],
            jawaban,
            penjelasan: penjelasan || '',
            kategori: kategori || '',
            level: 'Menengah'
        };
        
        if (id) {
            // Update existing
            const index = data.kuis.findIndex(q => q.id == id);
            if (index !== -1) {
                data.kuis[index] = { ...kuisData, id: parseInt(id) };
            } else {
                alert('Soal tidak ditemukan!');
                return;
            }
        } else {
            // Add new
            const newId = data.kuis.length > 0 
                ? Math.max(...data.kuis.map(q => q.id)) + 1 
                : 1;
            data.kuis.push({ ...kuisData, id: newId });
        }
        
        // Save to GitHub
        const message = id ? `Update soal kuis` : `Tambah soal kuis`;
        const success = await saveToGitHub('data.json', data, message);
        
        if (success) {
            alert(`✅ Soal kuis berhasil ${id ? 'diupdate' : 'ditambahkan'}!`);
            cancelKuisForm();
            loadKuisList();
            loadDashboard();
        } else {
            alert('❌ Gagal menyimpan soal kuis');
        }
        
    } catch (error) {
        console.error('Error saving kuis:', error);
        alert(`Gagal menyimpan: ${error.message}`);
    }
}

function cancelKuisForm() {
    document.getElementById('kuis-form').style.display = 'none';
}

async function loadKuisList() {
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        const data = await response.json();
        
        const container = document.getElementById('kuis-list');
        if (!data.kuis || data.kuis.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">Belum ada soal kuis</p>';
            return;
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Pertanyaan</th>
                        <th>Kategori</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.kuis.forEach(q => {
            html += `
                <tr>
                    <td>${q.id}</td>
                    <td>${q.pertanyaan.substring(0, 50)}${q.pertanyaan.length > 50 ? '...' : ''}</td>
                    <td>${q.kategori || '-'}</td>
                    <td>
                        <button onclick="showKuisForm(${q.id})" class="action-btn edit-btn">Edit</button>
                        <button onclick="deleteKuis(${q.id})" class="action-btn delete-btn">Hapus</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading kuis list:', error);
        container.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Gagal memuat data</p>';
    }
}

async function deleteKuis(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        const data = await response.json();
        
        data.kuis = data.kuis.filter(q => q.id != id);
        
        const success = await saveToGitHub('data.json', data, `Hapus soal kuis ID: ${id}`);
        
        if (success) {
            alert('✅ Soal berhasil dihapus!');
            loadKuisList();
            loadDashboard();
        } else {
            alert('❌ Gagal menghapus soal');
        }
        
    } catch (error) {
        console.error('Error deleting kuis:', error);
        alert(`Gagal menghapus: ${error.message}`);
    }
}

// ==============================
// FUNGSI GALERI
// ==============================

async function getGaleriStats() {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri?ref=${GITHUB_BRANCH}&t=${Date.now()}`
        );
        
        if (!response.ok) {
            return 0;
        }
        
        const files = await response.json();
        
        if (!Array.isArray(files)) {
            return 0;
        }
        
        return files.filter(file => 
            file.type === 'file' && 
            (file.name.toLowerCase().endsWith('.jpg') || 
             file.name.toLowerCase().endsWith('.jpeg') || 
             file.name.toLowerCase().endsWith('.png'))
        ).length;
    } catch (error) {
        return 0;
    }
}

async function loadGaleriList() {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri?ref=${GITHUB_BRANCH}&t=${Date.now()}`
        );
        const files = await response.json();
        
        const galeriList = document.getElementById('galeri-list');
        galeriList.innerHTML = '';
        
        if (!Array.isArray(files)) {
            galeriList.innerHTML = '<p>Folder galeri kosong atau tidak ditemukan</p>';
            return;
        }
        
        const imageFiles = files.filter(file => 
            file.type === 'file' && 
            (file.name.toLowerCase().endsWith('.jpg') || 
             file.name.toLowerCase().endsWith('.jpeg') || 
             file.name.toLowerCase().endsWith('.png'))
        );
        
        if (imageFiles.length === 0) {
            galeriList.innerHTML = '<p>Belum ada foto di galeri</p>';
            return;
        }
        
        imageFiles.forEach(file => {
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${file.path}`;
            
            const imgDiv = document.createElement('div');
            imgDiv.innerHTML = `
                <img src="${rawUrl}" 
                     alt="${file.name}" 
                     style="width: 100%; height: 100px; object-fit: cover; border-radius: 5px;">
                <p style="font-size: 12px; margin: 5px 0; text-align: center; word-break: break-all;">${file.name}</p>
                <button onclick="deleteFoto('${file.path}', '${file.sha}')" 
                        style="background: #e74c3c; color: white; border: none; padding: 5px; border-radius: 3px; width: 100%; cursor: pointer; font-size: 12px;">
                    Hapus
                </button>
            `;
            galeriList.appendChild(imgDiv);
        });
        
    } catch (error) {
        console.error('Error loading galeri list:', error);
        document.getElementById('galeri-list').innerHTML = '<p>Gagal memuat daftar galeri</p>';
    }
}

async function deleteFoto(path, sha) {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('GitHub Token tidak ditemukan');
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
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
            const errorData = await response.json();
            alert(`❌ Gagal menghapus foto: ${errorData.message}`);
        }
        
    } catch (error) {
        console.error('Error deleting foto:', error);
        alert('❌ Gagal menghapus foto');
    }
}

function previewJadwal(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('jadwal-preview');
        const img = document.getElementById('preview-image');
        
        img.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

async function uploadJadwal() {
    const fileInput = document.getElementById('jadwal-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('❌ Pilih file jadwal terlebih dahulu');
        return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('❌ GitHub Token tidak ditemukan. Masukkan token di form login.');
        return;
    }
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async function() {
            const base64Content = reader.result.split(',')[1];
            
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/jadwal/jadwal.jpg`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: `Update jadwal - ${new Date().toLocaleString('id-ID')}`,
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
                const error = await response.json();
                alert(`❌ Gagal mengupload: ${error.message}`);
            }
        };
        
    } catch (error) {
        console.error('Error uploading jadwal:', error);
        alert('❌ Gagal mengupload jadwal');
    }
}

async function uploadGaleri() {
    const fileInput = document.getElementById('galeri-files');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('❌ Pilih foto terlebih dahulu');
        return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('❌ GitHub Token tidak ditemukan');
        return;
    }
    
    const progressElement = document.getElementById('upload-progress');
    progressElement.innerHTML = `<div style="padding: 10px; background: #d1ecf1; border-radius: 5px;">Memulai upload ${files.length} foto...</div>`;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            const base64Content = await readFileAsBase64(file);
            const filename = `${Date.now()}-${file.name}`;
            const path = `assets/image/galeri/${filename}`;
            
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: `Upload foto galeri: ${filename}`,
                        content: base64Content,
                        branch: GITHUB_BRANCH
                    })
                }
            );
            
            if (response.ok) {
                successCount++;
                progressElement.innerHTML += `<div style="padding: 5px; background: #d4edda; margin: 5px 0; border-radius: 3px;">✅ Berhasil: ${filename}</div>`;
            } else {
                errorCount++;
                progressElement.innerHTML += `<div style="padding: 5px; background: #f8d7da; margin: 5px 0; border-radius: 3px;">❌ Gagal: ${filename}</div>`;
            }
            
        } catch (error) {
            console.error('Error uploading file:', error);
            errorCount++;
        }
    }
    
    fileInput.value = '';
    document.getElementById('foto-kategori').value = '';
    
    progressElement.innerHTML += `<div style="padding: 10px; background: ${errorCount === 0 ? '#d4edda' : '#f8d7da'}; margin-top: 10px; border-radius: 5px;">
        Upload selesai: ${successCount} berhasil, ${errorCount} gagal
    </div>`;
    
    setTimeout(() => {
        loadGaleriList();
        loadDashboard();
    }, 1000);
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function() {
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
    });
}

// ==============================
// FUNGSI BACKUP & RESTORE
// ==============================

async function backupData() {
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        const data = await response.json();
        
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
        alert('❌ Pilih file backup terlebih dahulu');
        return;
    }
    
    if (!confirm('Restore akan mengganti semua data yang ada. Lanjutkan?')) {
        return;
    }
    
    try {
        const reader = new FileReader();
        reader.readAsText(file);
        
        reader.onload = async function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.kuis || !data.pengumuman) {
                    alert('❌ Format file backup tidak valid');
                    return;
                }
                
                const success = await saveToGitHub('data.json', data, 'Restore data dari backup');
                
                if (success) {
                    alert('✅ Restore berhasil!');
                    fileInput.value = '';
                    loadDashboard();
                    loadPengumumanList();
                    loadKuisList();
                } else {
                    alert('❌ Gagal melakukan restore');
                }
            } catch (parseError) {
                alert('❌ File JSON tidak valid');
            }
        };
        
    } catch (error) {
        console.error('Error restoring data:', error);
        alert('❌ Gagal melakukan restore');
    }
}

async function resetData() {
    if (!confirm('PERINGATAN: Ini akan menghapus SEMUA data. Lanjutkan?')) {
        return;
    }
    
    if (!confirm('YAKIN? Data yang dihapus tidak dapat dikembalikan!')) {
        return;
    }
    
    try {
        const defaultData = {
            pengumuman: [],
            kuis: [],
            leaderboard: []
        };
        
        const success = await saveToGitHub('data.json', defaultData, 'Reset semua data');
        
        if (success) {
            alert('✅ Data berhasil direset!');
            loadDashboard();
            if (document.getElementById('pengumuman-section').classList.contains('active')) {
                loadPengumumanList();
            }
            if (document.getElementById('kuis-section').classList.contains('active')) {
                loadKuisList();
            }
        } else {
            alert('❌ Gagal mereset data');
        }
        
    } catch (error) {
        console.error('Error resetting data:', error);
        alert('❌ Gagal mereset data');
    }
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
});

// Tambahkan CSS untuk action button
const style = document.createElement('style');
style.textContent = `
    .action-btn {
        padding: 5px 10px;
        margin: 0 5px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .edit-btn {
        background: #f39c12;
        color: white;
    }
    
    .delete-btn {
        background: #e74c3c;
        color: white;
    }
    
    .action-btn:hover {
        opacity: 0.9;
    }
`;
document.head.appendChild(style);
