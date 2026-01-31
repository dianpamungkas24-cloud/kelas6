// admin.js - WORKING VERSION
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const ADMIN_PASSWORD = 'kelas6admin123';

console.log('✅ Admin Panel Loaded');

// ==============================
// 1. SIMPLE GITHUB FUNCTIONS
// ==============================

async function saveToGitHub(data, message) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('❌ Token GitHub tidak ditemukan! Masukkan token di form login.');
        return false;
    }
    
    console.log('💾 Saving to GitHub:', message);
    
    try {
        // Convert data to base64
        const jsonString = JSON.stringify(data, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
        
        // Get SHA of existing file
        let sha = null;
        try {
            const getResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/data.json`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }
        } catch (e) {
            console.log('Creating new file');
        }
        
        // Upload to GitHub
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/data.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    content: base64Content,
                    sha: sha,
                    branch: GITHUB_BRANCH
                })
            }
        );
        
        if (response.ok) {
            console.log('✅ Successfully saved to GitHub');
            return true;
        } else {
            const error = await response.json();
            console.error('❌ GitHub error:', error);
            alert(`❌ Gagal menyimpan: ${error.message}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error saving to GitHub:', error);
        alert(`❌ Error: ${error.message}`);
        return false;
    }
}

async function loadData() {
    console.log('📥 Loading data from GitHub...');
    
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Data loaded successfully');
            return data;
        } else {
            console.log('📄 No data found, creating new structure');
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
// 2. PENGUMUMAN - SIMPLE VERSION
// ==============================

async function savePengumuman() {
    console.log('💾 Saving pengumuman...');
    
    // Get form values
    const judul = document.getElementById('pengumuman-judul').value;
    const konten = document.getElementById('pengumuman-konten').value;
    const kategori = document.getElementById('pengumuman-kategori').value;
    const lampiran = document.getElementById('pengumuman-lampiran').value;
    const id = document.getElementById('pengumuman-id').value;
    
    // Validation
    if (!judul || !konten) {
        alert('❌ Judul dan konten harus diisi!');
        return;
    }
    
    // Show loading
    const saveBtn = document.querySelector('#pengumuman-form button[onclick="savePengumuman()"]');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Menyimpan...';
    saveBtn.disabled = true;
    
    try {
        // Load existing data
        const data = await loadData();
        
        // Create pengumuman object
        const pengumuman = {
            id: id ? parseInt(id) : (data.pengumuman.length > 0 ? Math.max(...data.pengumuman.map(p => p.id)) + 1 : 1),
            judul: judul,
            konten: konten,
            kategori: kategori || '',
            lampiran: lampiran || '',
            tanggal: new Date().toISOString()
        };
        
        // Add or update in array
        if (id) {
            // Update existing
            const index = data.pengumuman.findIndex(p => p.id == id);
            if (index !== -1) {
                pengumuman.tanggal = data.pengumuman[index].tanggal; // Keep original date
                data.pengumuman[index] = pengumuman;
            }
        } else {
            // Add new
            data.pengumuman.push(pengumuman);
        }
        
        // Save to GitHub
        const message = id ? `Update pengumuman: ${judul}` : `Tambah pengumuman: ${judul}`;
        const success = await saveToGitHub(data, message);
        
        if (success) {
            alert('✅ Pengumuman berhasil disimpan!');
            
            // Reset form and refresh
            document.getElementById('pengumuman-form').style.display = 'none';
            document.getElementById('pengumuman-judul').value = '';
            document.getElementById('pengumuman-konten').value = '';
            document.getElementById('pengumuman-kategori').value = '';
            document.getElementById('pengumuman-lampiran').value = '';
            document.getElementById('pengumuman-id').value = '';
            
            // Refresh lists
            loadPengumumanList();
            loadDashboard();
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`❌ Gagal menyimpan: ${error.message}`);
    } finally {
        // Restore button
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

async function loadPengumumanList() {
    console.log('📋 Loading pengumuman list...');
    
    try {
        const data = await loadData();
        const container = document.getElementById('pengumuman-list');
        
        if (!data.pengumuman || data.pengumuman.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Belum ada pengumuman</p>';
            return;
        }
        
        // Sort by newest first
        const pengumumanList = [...data.pengumuman].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        // Create HTML table
        let html = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; border: 1px solid #dee2e6;">ID</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6;">Judul</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6;">Tanggal</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6;">Kategori</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        pengumumanList.forEach(p => {
            html += `
                <tr>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${p.id}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; max-width: 200px;">${p.judul}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${p.kategori || '-'}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">
                        <button onclick="editPengumuman(${p.id})" style="
                            background: #f39c12;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 5px;
                        ">Edit</button>
                        <button onclick="deletePengumuman(${p.id})" style="
                            background: #e74c3c;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Hapus</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        console.log(`✅ Loaded ${pengumumanList.length} pengumuman`);
        
    } catch (error) {
        console.error('❌ Error loading pengumuman list:', error);
        document.getElementById('pengumuman-list').innerHTML = 
            '<p style="text-align: center; color: red; padding: 20px;">Gagal memuat data</p>';
    }
}

function editPengumuman(id) {
    console.log(`✏️ Editing pengumuman ${id}`);
    
    // Load data and fill form
    loadData().then(data => {
        const pengumuman = data.pengumuman.find(p => p.id === id);
        if (pengumuman) {
            document.getElementById('pengumuman-judul').value = pengumuman.judul || '';
            document.getElementById('pengumuman-konten').value = pengumuman.konten || '';
            document.getElementById('pengumuman-kategori').value = pengumuman.kategori || '';
            document.getElementById('pengumuman-lampiran').value = pengumuman.lampiran || '';
            document.getElementById('pengumuman-id').value = pengumuman.id;
            
            document.getElementById('form-title').textContent = 'Edit Pengumuman';
            document.getElementById('pengumuman-form').style.display = 'block';
        }
    });
}

async function deletePengumuman(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
        return;
    }
    
    console.log(`🗑️ Deleting pengumuman ${id}`);
    
    try {
        const data = await loadData();
        
        // Filter out the pengumuman to delete
        data.pengumuman = data.pengumuman.filter(p => p.id !== id);
        
        // Save to GitHub
        const success = await saveToGitHub(data, `Hapus pengumuman ID: ${id}`);
        
        if (success) {
            alert('✅ Pengumuman berhasil dihapus!');
            loadPengumumanList();
            loadDashboard();
        }
        
    } catch (error) {
        console.error('❌ Error deleting pengumuman:', error);
        alert('❌ Gagal menghapus pengumuman');
    }
}

// ==============================
// 3. KUIS - SIMPLE VERSION
// ==============================

async function saveKuis() {
    console.log('💾 Saving kuis...');
    
    // Get form values
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
        alert('❌ Semua field harus diisi!');
        return;
    }
    
    if (jawaban < 0 || jawaban > 3) {
        alert('❌ Jawaban benar harus antara 0-3!');
        return;
    }
    
    // Show loading
    const saveBtn = document.querySelector('#kuis-form button[onclick="saveKuis()"]');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Menyimpan...';
    saveBtn.disabled = true;
    
    try {
        // Load existing data
        const data = await loadData();
        
        // Create kuis object
        const kuis = {
            id: id ? parseInt(id) : (data.kuis.length > 0 ? Math.max(...data.kuis.map(q => q.id)) + 1 : 1),
            pertanyaan: pertanyaan,
            pilihan: [pilihan1, pilihan2, pilihan3, pilihan4],
            jawaban: jawaban,
            penjelasan: penjelasan || '',
            kategori: kategori || '',
            level: 'Menengah'
        };
        
        // Add or update in array
        if (id) {
            // Update existing
            const index = data.kuis.findIndex(q => q.id == id);
            if (index !== -1) {
                data.kuis[index] = kuis;
            }
        } else {
            // Add new
            data.kuis.push(kuis);
        }
        
        // Save to GitHub
        const message = id ? `Update soal kuis` : `Tambah soal kuis`;
        const success = await saveToGitHub(data, message);
        
        if (success) {
            alert('✅ Soal kuis berhasil disimpan!');
            
            // Reset form and refresh
            document.getElementById('kuis-form').style.display = 'none';
            document.getElementById('kuis-pertanyaan').value = '';
            document.getElementById('pilihan1').value = '';
            document.getElementById('pilihan2').value = '';
            document.getElementById('pilihan3').value = '';
            document.getElementById('pilihan4').value = '';
            document.getElementById('jawaban-benar').value = '0';
            document.getElementById('kuis-penjelasan').value = '';
            document.getElementById('kuis-kategori').value = '';
            document.getElementById('kuis-id').value = '';
            
            // Refresh lists
            loadKuisList();
            loadDashboard();
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`❌ Gagal menyimpan: ${error.message}`);
    } finally {
        // Restore button
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

async function loadKuisList() {
    console.log('📋 Loading kuis list...');
    
    try {
        const data = await loadData();
        const container = document.getElementById('kuis-list');
        
        if (!data.kuis || data.kuis.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Belum ada soal kuis</p>';
            return;
        }
        
        // Create HTML table
        let html = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; border: 1px solid #dee2e6;">ID</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6;">Pertanyaan</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6;">Kategori</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.kuis.forEach(q => {
            html += `
                <tr>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${q.id}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; max-width: 300px;">
                        ${q.pertanyaan.substring(0, 50)}${q.pertanyaan.length > 50 ? '...' : ''}
                    </td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${q.kategori || '-'}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">
                        <button onclick="editKuis(${q.id})" style="
                            background: #f39c12;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 5px;
                        ">Edit</button>
                        <button onclick="deleteKuis(${q.id})" style="
                            background: #e74c3c;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Hapus</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        console.log(`✅ Loaded ${data.kuis.length} kuis questions`);
        
    } catch (error) {
        console.error('❌ Error loading kuis list:', error);
        container.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Gagal memuat data</p>';
    }
}

function editKuis(id) {
    console.log(`✏️ Editing kuis ${id}`);
    
    // Load data and fill form
    loadData().then(data => {
        const kuis = data.kuis.find(q => q.id === id);
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
            
            document.getElementById('kuis-form-title').textContent = 'Edit Soal Kuis';
            document.getElementById('kuis-form').style.display = 'block';
        }
    });
}

async function deleteKuis(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
        return;
    }
    
    console.log(`🗑️ Deleting kuis ${id}`);
    
    try {
        const data = await loadData();
        
        // Filter out the kuis to delete
        data.kuis = data.kuis.filter(q => q.id !== id);
        
        // Save to GitHub
        const success = await saveToGitHub(data, `Hapus soal kuis ID: ${id}`);
        
        if (success) {
            alert('✅ Soal berhasil dihapus!');
            loadKuisList();
            loadDashboard();
        }
        
    } catch (error) {
        console.error('❌ Error deleting kuis:', error);
        alert('❌ Gagal menghapus soal');
    }
}

// ==============================
// 4. SIMPLE UI FUNCTIONS
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
    } else if (sectionId === 'dashboard') {
        loadDashboard();
    }
}

function showPengumumanForm() {
    document.getElementById('form-title').textContent = 'Tambah Pengumuman Baru';
    document.getElementById('pengumuman-judul').value = '';
    document.getElementById('pengumuman-konten').value = '';
    document.getElementById('pengumuman-kategori').value = '';
    document.getElementById('pengumuman-lampiran').value = '';
    document.getElementById('pengumuman-id').value = '';
    document.getElementById('pengumuman-form').style.display = 'block';
}

function showKuisForm() {
    document.getElementById('kuis-form-title').textContent = 'Tambah Soal Kuis';
    document.getElementById('kuis-pertanyaan').value = '';
    document.getElementById('pilihan1').value = '';
    document.getElementById('pilihan2').value = '';
    document.getElementById('pilihan3').value = '';
    document.getElementById('pilihan4').value = '';
    document.getElementById('jawaban-benar').value = '0';
    document.getElementById('kuis-penjelasan').value = '';
    document.getElementById('kuis-kategori').value = '';
    document.getElementById('kuis-id').value = '';
    document.getElementById('kuis-form').style.display = 'block';
}

function cancelPengumumanForm() {
    document.getElementById('pengumuman-form').style.display = 'none';
}

function cancelKuisForm() {
    document.getElementById('kuis-form').style.display = 'none';
}

// ==============================
// 5. DASHBOARD FUNCTIONS
// ==============================

async function loadDashboard() {
    try {
        const data = await loadData();
        
        document.getElementById('stat-pengumuman').textContent = data.pengumuman?.length || 0;
        document.getElementById('stat-kuis').textContent = data.kuis?.length || 0;
        document.getElementById('stat-leaderboard').textContent = data.leaderboard?.length || 0;
        
        // Update system status
        const token = localStorage.getItem('github_token');
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="background: ${token ? '#d4edda' : '#f8d7da'}; 
                            color: ${token ? '#155724' : '#721c24'};
                            padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>Status Sistem:</strong><br>
                    • GitHub API: ${token ? '✅ Terhubung' : '⚠️ Token tidak ditemukan'}<br>
                    • Total Pengumuman: ${data.pengumuman?.length || 0}<br>
                    • Total Soal Kuis: ${data.kuis?.length || 0}<br>
                    • Terakhir Update: ${new Date().toLocaleString('id-ID')}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ==============================
// 6. INITIALIZATION
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
    
    // Test the system
    setTimeout(() => {
        console.log('✅ System ready. Try these commands:');
        console.log('1. showPengumumanForm() - Open pengumuman form');
        console.log('2. showKuisForm() - Open kuis form');
        console.log('3. loadData() - Load data from GitHub');
    }, 1000);
});

// ==============================
// 7. DEBUG FUNCTIONS
// ==============================

window.testSave = async function() {
    console.log('🧪 Testing save function...');
    
    // Test with simple data
    const testData = {
        pengumuman: [{
            id: 1,
            judul: "Test Pengumuman",
            konten: "Ini adalah test pengumuman",
            tanggal: new Date().toISOString(),
            kategori: "Test"
        }],
        kuis: [],
        leaderboard: []
    };
    
    const success = await saveToGitHub(testData, 'Test save from console');
    console.log('Test result:', success ? '✅ Success' : '❌ Failed');
    return success;
};

window.checkData = async function() {
    console.log('📊 Checking current data...');
    const data = await loadData();
    console.log('Current data:', data);
    return data;
};
