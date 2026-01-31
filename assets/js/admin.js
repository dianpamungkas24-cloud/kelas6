// admin.js
// Konfigurasi
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const ADMIN_PASSWORD = 'kelas6admin123'; // Password default

let currentPengumumanId = null;
let currentKuisId = null;

// Fungsi untuk login
function login() {
    const password = document.getElementById('admin-password').value;
    const token = document.getElementById('github-token').value;
    
    if (password !== ADMIN_PASSWORD) {
        alert('Password salah!');
        return;
    }
    
    // Simpan token jika diberikan
    if (token) {
        localStorage.setItem('github_token', token);
    }
    
    // Simpan status login
    localStorage.setItem('admin_logged_in', 'true');
    
    // Tampilkan panel admin
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    // Load data awal
    loadDashboard();
    debugSystem(); // Debug info
}

// Fungsi untuk logout
function logout() {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('github_token');
    window.location.reload();
}

// Fungsi untuk cek login status
function checkLogin() {
    if (localStorage.getItem('admin_logged_in') === 'true') {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadDashboard();
        debugSystem();
    }
}

// Fungsi untuk menampilkan section
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
    document.querySelector(`.nav-btn[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
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

// Fungsi untuk load dashboard
async function loadDashboard() {
    try {
        // Load data dari GitHub
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        const data = await response.json();
        
        // Update stats
        document.getElementById('stat-pengumuman').textContent = data.pengumuman?.length || 0;
        document.getElementById('stat-kuis').textContent = data.kuis?.length || 0;
        document.getElementById('stat-leaderboard').textContent = data.leaderboard?.length || 0;
        
        // Get gallery stats
        const galeriCount = await getGaleriStats();
        document.getElementById('stat-galeri').textContent = galeriCount;
        
        // Update system status
        const statusElement = document.getElementById('system-status');
        const token = localStorage.getItem('github_token');
        
        statusElement.innerHTML = `
            <div style="
                background: ${token ? '#d4edda' : '#f8d7da'};
                color: ${token ? '#155724' : '#721c24'};
                padding: 15px;
                border-radius: 8px;
                margin-top: 10px;
            ">
                <strong>Status Sistem:</strong><br>
                • GitHub API: ${token ? '✅ Terhubung' : '⚠️ Token tidak ditemukan'}<br>
                • Total Data: ${Object.keys(data).length} jenis data<br>
                • Total Pengumuman: ${data.pengumuman?.length || 0}<br>
                • Total Kuis: ${data.kuis?.length || 0}<br>
                • Terakhir Update: ${new Date().toLocaleString('id-ID')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showStatus('error', 'Gagal memuat data dashboard');
    }
}

// Fungsi untuk upload jadwal
async function uploadJadwal() {
    const fileInput = document.getElementById('jadwal-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('error', 'Pilih file jadwal terlebih dahulu');
        return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        showStatus('error', 'GitHub Token tidak ditemukan. Masukkan token di form login.');
        return;
    }
    
    try {
        // Read file as base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async function() {
            const base64Content = reader.result.split(',')[1];
            
            // Upload to GitHub
            const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/jadwal/jadwal.jpg`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Update jadwal - ${new Date().toLocaleString('id-ID')}`,
                    content: base64Content,
                    branch: GITHUB_BRANCH
                })
            });
            
            if (response.ok) {
                showStatus('success', 'Jadwal berhasil diupdate!');
                fileInput.value = '';
                document.getElementById('jadwal-preview').style.display = 'none';
            } else {
                const error = await response.json();
                showStatus('error', `Gagal mengupload: ${error.message}`);
            }
        };
        
    } catch (error) {
        console.error('Error uploading jadwal:', error);
        showStatus('error', 'Gagal mengupload jadwal');
    }
}

// Fungsi untuk preview jadwal
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

// Fungsi untuk upload galeri
async function uploadGaleri() {
    const fileInput = document.getElementById('galeri-files');
    const files = fileInput.files;
    const kategori = document.getElementById('foto-kategori').value;
    
    if (files.length === 0) {
        showStatus('error', 'Pilih foto terlebih dahulu');
        return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        showStatus('error', 'GitHub Token tidak ditemukan');
        return;
    }
    
    const progressElement = document.getElementById('upload-progress');
    progressElement.innerHTML = `<div class="status status-info">Memulai upload ${files.length} foto...</div>`;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            // Read file as base64
            const base64Content = await readFileAsBase64(file);
            
            // Upload to GitHub
            const filename = `${Date.now()}-${file.name}`;
            const path = `assets/image/galeri/${filename}`;
            
            const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Upload foto galeri: ${filename}`,
                    content: base64Content,
                    branch: GITHUB_BRANCH
                })
            });
            
            if (response.ok) {
                successCount++;
                progressElement.innerHTML += `<div class="status status-success">✅ Berhasil: ${filename}</div>`;
            } else {
                errorCount++;
                progressElement.innerHTML += `<div class="status status-error">❌ Gagal: ${filename}</div>`;
            }
            
        } catch (error) {
            console.error('Error uploading file:', error);
            errorCount++;
            progressElement.innerHTML += `<div class="status status-error">❌ Error: ${file.name}</div>`;
        }
    }
    
    // Reset form
    fileInput.value = '';
    document.getElementById('foto-kategori').value = '';
    
    // Show final status
    progressElement.innerHTML += `<div class="status ${errorCount === 0 ? 'status-success' : 'status-error'}">
        Upload selesai: ${successCount} berhasil, ${errorCount} gagal
    </div>`;
    
    // Reload galeri list
    setTimeout(() => {
        loadGaleriList();
    }, 1000);
}

// Fungsi untuk membaca file sebagai base64
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

// Fungsi untuk load galeri list
async function loadGaleriList() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri?ref=${GITHUB_BRANCH}&t=${Date.now()}`);
        const files = await response.json();
        
        const galeriList = document.getElementById('galeri-list');
        galeriList.innerHTML = '';
        
        // Jika folder kosong atau tidak ditemukan
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
            imgDiv.className = 'galeri-item';
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

// Fungsi untuk delete foto
async function deleteFoto(path, sha) {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        showStatus('error', 'GitHub Token tidak ditemukan');
        return;
    }
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Hapus foto: ${path.split('/').pop()}`,
                sha: sha,
                branch: GITHUB_BRANCH
            })
        });
        
        if (response.ok) {
            showStatus('success', 'Foto berhasil dihapus');
            setTimeout(() => {
                loadGaleriList();
            }, 1000);
        } else {
            const errorData = await response.json();
            showStatus('error', `Gagal menghapus foto: ${errorData.message}`);
        }
        
    } catch (error) {
        console.error('Error deleting foto:', error);
        showStatus('error', 'Gagal menghapus foto');
    }
}

// Fungsi untuk show pengumuman form
function showPengumumanForm(id = null) {
    const form = document.getElementById('pengumuman-form');
    const title = document.getElementById('form-title');
    const formTitle = document.getElementById('pengumuman-judul');
    const formContent = document.getElementById('pengumuman-konten');
    const formKategori = document.getElementById('pengumuman-kategori');
    const formLampiran = document.getElementById('pengumuman-lampiran');
    const formId = document.getElementById('pengumuman-id');
    
    if (id) {
        // Edit mode
        title.textContent = 'Edit Pengumuman';
        currentPengumumanId = id;
        
        // Load data pengumuman
        loadPengumumanData(id);
    } else {
        // Add mode
        title.textContent = 'Tambah Pengumuman Baru';
        currentPengumumanId = null;
        
        // Reset form
        formTitle.value = '';
        formContent.value = '';
        formKategori.value = '';
        formLampiran.value = '';
        formId.value = '';
    }
    
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

// Fungsi untuk load pengumuman data
async function loadPengumumanData(id) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        
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
        } else {
            showStatus('error', 'Data pengumuman tidak ditemukan');
        }
    } catch (error) {
        console.error('Error loading pengumuman data:', error);
        showStatus('error', 'Gagal memuat data pengumuman');
    }
}

// Fungsi untuk save pengumuman
async function savePengumuman() {
    const judul = document.getElementById('pengumuman-judul').value;
    const konten = document.getElementById('pengumuman-konten').value;
    const kategori = document.getElementById('pengumuman-kategori').value;
    const lampiran = document.getElementById('pengumuman-lampiran').value;
    const id = document.getElementById('pengumuman-id').value;
    
    if (!judul || !konten) {
        showStatus('error', 'Judul dan konten harus diisi');
        return;
    }
    
    try {
        // Load current data
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        let data;
        
        if (response.ok) {
            data = await response.json();
        } else {
            // Jika file tidak ada, buat yang baru
            data = {
                pengumuman: [],
                kuis: [],
                leaderboard: []
            };
        }
        
        if (!data.pengumuman) {
            data.pengumuman = [];
        }
        
        if (id) {
            // Update existing
            const index = data.pengumuman.findIndex(p => p.id == id);
            if (index !== -1) {
                data.pengumuman[index] = {
                    id: parseInt(id),
                    judul,
                    konten,
                    kategori,
                    lampiran: lampiran || null,
                    tanggal: data.pengumuman[index].tanggal // Keep original date
                };
            } else {
                showStatus('error', 'Pengumuman tidak ditemukan');
                return;
            }
        } else {
            // Add new
            const newId = data.pengumuman.length > 0 ? 
                Math.max(...data.pengumuman.map(p => p.id)) + 1 : 1;
            
            data.pengumuman.push({
                id: newId,
                judul,
                konten,
                kategori,
                lampiran: lampiran || null,
                tanggal: new Date().toISOString()
            });
        }
        
        // Save to GitHub
        const success = await saveToGitHub('data.json', data, 
            `${id ? 'Update' : 'Tambah'} pengumuman: ${judul}`);
        
        if (success) {
            showStatus('success', `Pengumuman berhasil ${id ? 'diupdate' : 'ditambahkan'}!`);
            cancelPengumumanForm();
            setTimeout(() => {
                loadPengumumanList();
                loadDashboard();
            }, 1000);
        } else {
            showStatus('error', 'Gagal menyimpan pengumuman');
        }
        
    } catch (error) {
        console.error('Error saving pengumuman:', error);
        showStatus('error', 'Gagal menyimpan pengumuman');
    }
}

// Fungsi untuk cancel pengumuman form
function cancelPengumumanForm() {
    document.getElementById('pengumuman-form').style.display = 'none';
    currentPengumumanId = null;
}

// Fungsi untuk load pengumuman list
async function loadPengumumanList() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        const data = await response.json();
        
        const container = document.getElementById('pengumuman-list');
        if (!data.pengumuman || data.pengumuman.length === 0) {
            container.innerHTML = '<p>Belum ada pengumuman</p>';
            return;
        }
        
        // Sort by date descending
        const sortedPengumuman = [...data.pengumuman].sort((a, b) => 
            new Date(b.tanggal) - new Date(a.tanggal)
        );
        
        const html = `
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
                    ${sortedPengumuman.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${p.judul}</td>
                            <td>${new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                            <td>${p.kategori || '-'}</td>
                            <td>
                                <button class="action-btn edit-btn" onclick="showPengumumanForm(${p.id})">Edit</button>
                                <button class="action-btn delete-btn" onclick="deletePengumuman(${p.id})">Hapus</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading pengumuman list:', error);
        showStatus('error', 'Gagal memuat daftar pengumuman');
    }
}

// Fungsi untuk delete pengumuman
async function deletePengumuman(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        const data = await response.json();
        
        data.pengumuman = data.pengumuman.filter(p => p.id != id);
        
        const success = await saveToGitHub('data.json', data, `Hapus pengumuman ID: ${id}`);
        
        if (success) {
            showStatus('success', 'Pengumuman berhasil dihapus!');
            setTimeout(() => {
                loadPengumumanList();
                loadDashboard();
            }, 1000);
        } else {
            showStatus('error', 'Gagal menghapus pengumuman');
        }
        
    } catch (error) {
        console.error('Error deleting pengumuman:', error);
        showStatus('error', 'Gagal menghapus pengumuman');
    }
}

// Fungsi untuk show kuis form
function showKuisForm(id = null) {
    const form = document.getElementById('kuis-form');
    const title = document.getElementById('kuis-form-title');
    
    if (id) {
        // Edit mode
        title.textContent = 'Edit Soal Kuis';
        currentKuisId = id;
        loadKuisData(id);
    } else {
        // Add mode
        title.textContent = 'Tambah Soal Kuis';
        currentKuisId = null;
        
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

// Fungsi untuk load kuis data
async function loadKuisData(id) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
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

// Fungsi untuk save kuis
async function saveKuis() {
    const pertanyaan = document.getElementById('kuis-pertanyaan').value;
    const pilihan1 = document.getElementById('pilihan1').value;
    const pilihan2 = document.getElementById('pilihan2').value;
    const pilihan3 = document.getElementById('pilihan3').value;
    const pilihan4 = document.getElementById('pilihan4').value;
    const jawaban = parseInt(document.getElementById('jawaban-benar').value);
    const penjelasan = document.getElementById('kuis-penjelasan').value;
    const kategori = document.getElementById('kuis-kategori').value;
    const id = document.getElementById('kuis-id').value;
    
    // Validation
    if (!pertanyaan || !pilihan1 || !pilihan2 || !pilihan3 || !pilihan4) {
        showStatus('error', 'Semua field harus diisi');
        return;
    }
    
    if (jawaban < 0 || jawaban > 3) {
        showStatus('error', 'Jawaban benar harus antara 0-3');
        return;
    }
    
    try {
        // Load current data
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        let data;
        
        if (response.ok) {
            data = await response.json();
        } else {
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
                showStatus('error', 'Soal tidak ditemukan');
                return;
            }
        } else {
            // Add new
            const newId = data.kuis.length > 0 ? 
                Math.max(...data.kuis.map(q => q.id)) + 1 : 1;
            data.kuis.push({ ...kuisData, id: newId });
        }
        
        // Save to GitHub
        const success = await saveToGitHub('data.json', data, 
            `${id ? 'Update' : 'Tambah'} soal kuis`);
        
        if (success) {
            showStatus('success', `Soal kuis berhasil ${id ? 'diupdate' : 'ditambahkan'}!`);
            cancelKuisForm();
            setTimeout(() => {
                loadKuisList();
                loadDashboard();
            }, 1000);
        } else {
            showStatus('error', 'Gagal menyimpan soal kuis');
        }
        
    } catch (error) {
        console.error('Error saving kuis:', error);
        showStatus('error', 'Gagal menyimpan soal kuis');
    }
}

// Fungsi untuk cancel kuis form
function cancelKuisForm() {
    document.getElementById('kuis-form').style.display = 'none';
    currentKuisId = null;
}

// Fungsi untuk load kuis list
async function loadKuisList() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        const data = await response.json();
        
        const container = document.getElementById('kuis-list');
        if (!data.kuis || data.kuis.length === 0) {
            container.innerHTML = '<p>Belum ada soal kuis</p>';
            return;
        }
        
        const html = `
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
                    ${data.kuis.map(q => `
                        <tr>
                            <td>${q.id}</td>
                            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${q.pertanyaan.substring(0, 50)}${q.pertanyaan.length > 50 ? '...' : ''}</td>
                            <td>${q.kategori || '-'}</td>
                            <td>
                                <button class="action-btn edit-btn" onclick="showKuisForm(${q.id})">Edit</button>
                                <button class="action-btn delete-btn" onclick="deleteKuis(${q.id})">Hapus</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading kuis list:', error);
        showStatus('error', 'Gagal memuat daftar soal kuis');
    }
}

// Fungsi untuk delete kuis
async function deleteKuis(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        const data = await response.json();
        
        data.kuis = data.kuis.filter(q => q.id != id);
        
        const success = await saveToGitHub('data.json', data, `Hapus soal kuis ID: ${id}`);
        
        if (success) {
            showStatus('success', 'Soal berhasil dihapus!');
            setTimeout(() => {
                loadKuisList();
                loadDashboard();
            }, 1000);
        } else {
            showStatus('error', 'Gagal menghapus soal');
        }
        
    } catch (error) {
        console.error('Error deleting kuis:', error);
        showStatus('error', 'Gagal menghapus soal');
    }
}

// Fungsi untuk backup data
async function backupData() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
        const data = await response.json();
        
        // Create blob and download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-kelas6-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus('success', 'Backup berhasil didownload!');
        
    } catch (error) {
        console.error('Error backing up data:', error);
        showStatus('error', 'Gagal melakukan backup');
    }
}

// Fungsi untuk restore data
async function restoreData() {
    const fileInput = document.getElementById('backup-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('error', 'Pilih file backup terlebih dahulu');
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
                
                // Validasi struktur data
                if (!data.kuis || !data.pengumuman) {
                    showStatus('error', 'Format file backup tidak valid');
                    return;
                }
                
                const success = await saveToGitHub('data.json', data, 'Restore data dari backup');
                
                if (success) {
                    showStatus('success', 'Restore berhasil!');
                    fileInput.value = '';
                    setTimeout(() => {
                        loadDashboard();
                        loadPengumumanList();
                        loadKuisList();
                    }, 1000);
                } else {
                    showStatus('error', 'Gagal melakukan restore');
                }
            } catch (parseError) {
                showStatus('error', 'File JSON tidak valid');
            }
        };
        
    } catch (error) {
        console.error('Error restoring data:', error);
        showStatus('error', 'Gagal melakukan restore');
    }
}

// Fungsi untuk reset data
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
            showStatus('success', 'Data berhasil direset!');
            setTimeout(() => {
                loadDashboard();
                if (document.getElementById('pengumuman-section').classList.contains('active')) {
                    loadPengumumanList();
                }
                if (document.getElementById('kuis-section').classList.contains('active')) {
                    loadKuisList();
                }
            }, 1000);
        } else {
            showStatus('error', 'Gagal mereset data');
        }
        
    } catch (error) {
        console.error('Error resetting data:', error);
        showStatus('error', 'Gagal mereset data');
    }
}

// FUNGSI UTAMA: save to GitHub
async function saveToGitHub(path, data, message) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        showStatus('error', 'GitHub Token tidak ditemukan');
        return false;
    }
    
    try {
        console.log('Starting saveToGitHub:', { path, message, dataLength: JSON.stringify(data).length });
        
        // 1. Get current file SHA
        let sha = null;
        try {
            const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
                console.log('Got existing file SHA:', sha.substring(0, 20) + '...');
            } else if (getResponse.status === 404) {
                console.log('File does not exist yet, will create new');
            } else {
                const errorData = await getResponse.json();
                console.error('Error getting file:', errorData);
            }
        } catch (e) {
            console.log('Error getting file SHA, will create new file');
        }
        
        // 2. Convert data to base64 (CARA YANG BENAR)
        const jsonString = JSON.stringify(data, null, 2);
        console.log('JSON string length:', jsonString.length);
        
        // Menggunakan cara yang lebih aman untuk base64 encoding
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
        console.log('Base64 content length:', base64Content.length);
        
        // 3. Upload to GitHub
        const updateResponse = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: message,
                content: base64Content,
                sha: sha, // null jika file baru
                branch: GITHUB_BRANCH
            })
        });
        
        const result = await updateResponse.json();
        console.log('GitHub response:', result);
        
        if (updateResponse.ok) {
            console.log('✅ Save successful!');
            return true;
        } else {
            console.error('❌ GitHub error:', result.message);
            showStatus('error', `GitHub: ${result.message}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error saving to GitHub:', error);
        showStatus('error', 'Gagal menyimpan ke GitHub');
        return false;
    }
}

// Fungsi untuk get galeri stats
async function getGaleriStats() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri?ref=${GITHUB_BRANCH}&t=${Date.now()}`);
        
        if (!response.ok) {
            return 0;
        }
        
        const files = await response.json();
        
        // Pastikan files adalah array
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

// Fungsi untuk menampilkan status
function showStatus(type, message) {
    // Cari section aktif
    const activeSection = document.querySelector('.section.active');
    if (!activeSection) {
        // Fallback ke dashboard
        const statusElement = document.getElementById('dashboard-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="status status-${type}">
                    ${type === 'success' ? '✅' : '❌'} ${message}
                </div>
            `;
            setTimeout(() => {
                statusElement.innerHTML = '';
            }, 5000);
        }
        return;
    }
    
    const sectionId = activeSection.id.replace('-section', '');
    const statusElement = document.getElementById(`${sectionId}-status`);
    
    if (statusElement) {
        statusElement.innerHTML = `
            <div class="status status-${type}">
                ${type === 'success' ? '✅' : '❌'} ${message}
            </div>
        `;
        
        // Auto-hide setelah 5 detik
        setTimeout(() => {
            if (statusElement) {
                statusElement.innerHTML = '';
            }
        }, 5000);
    }
}

// Fungsi debugging untuk mengecek token dan koneksi
async function debugSystem() {
    console.log('=== DEBUG SYSTEM ===');
    console.log('Token exists:', !!localStorage.getItem('github_token'));
    console.log('Token:', localStorage.getItem('github_token')?.substring(0, 10) + '...');
    console.log('Logged in:', localStorage.getItem('admin_logged_in'));
    
    // Test GitHub API
    const token = localStorage.getItem('github_token');
    if (token) {
        try {
            const testResponse = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('GitHub repo access:', testResponse.status, testResponse.statusText);
            
            if (testResponse.ok) {
                const repoInfo = await testResponse.json();
                console.log('Repository:', repoInfo.full_name);
                console.log('Default branch:', repoInfo.default_branch);
            }
            
            // Test read data.json
            const dataResponse = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`);
            console.log('Data.json exists:', dataResponse.ok);
            
        } catch (error) {
            console.error('Debug error:', error);
        }
    }
    console.log('=== END DEBUG ===');
}

// Fungsi test untuk mengecek saveToGitHub
async function testSave() {
    console.log('=== TEST SAVE FUNCTION ===');
    const testData = {
        pengumuman: [{
            id: 1,
            judul: "Test",
            konten: "Test content",
            tanggal: new Date().toISOString()
        }],
        kuis: [],
        leaderboard: []
    };
    
    const result = await saveToGitHub('test.json', testData, 'Test save function');
    console.log('Test result:', result);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLogin();
    
    // Event listeners untuk enter key pada form login
    document.getElementById('admin-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('github-token').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Auto-focus pada input password
    if (document.getElementById('admin-password')) {
        document.getElementById('admin-password').focus();
    }
});

// Tambahkan CSS untuk status
const style = document.createElement('style');
style.textContent = `
    .status {
        padding: 10px 15px;
        border-radius: 5px;
        margin: 10px 0;
        font-weight: bold;
    }
    
    .status-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .status-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .status-info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    .galeri-item {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        margin: 10px;
        width: 150px;
        display: inline-block;
        vertical-align: top;
    }
    
    .action-btn {
        padding: 5px 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin: 2px;
    }
    
    .edit-btn {
        background-color: #3498db;
        color: white;
    }
    
    .delete-btn {
        background-color: #e74c3c;
        color: white;
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
`;
document.head.appendChild(style);
