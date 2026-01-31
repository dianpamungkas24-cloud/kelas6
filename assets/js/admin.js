// admin.js - Fixed Version
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const ADMIN_PASSWORD = 'kelas6admin123';

console.log('✅ admin.js loaded');
console.log('Config:', { GITHUB_USER, GITHUB_REPO, GITHUB_BRANCH });

// ==============================
// UTILITY FUNCTIONS
// ==============================

function showAlert(type, message) {
    const colors = {
        success: '#d4edda',
        error: '#f8d7da',
        info: '#d1ecf1'
    };
    
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${colors[type] || colors.info};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 400px;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ==============================
// AUTH FUNCTIONS
// ==============================

function login() {
    console.log('🔐 Login attempt');
    const password = document.getElementById('admin-password').value;
    const token = document.getElementById('github-token').value;
    
    if (password !== ADMIN_PASSWORD) {
        showAlert('error', 'Password salah!');
        return;
    }
    
    if (token) {
        localStorage.setItem('github_token', token);
        console.log('Token saved to localStorage');
    } else {
        console.warn('No token provided');
    }
    
    localStorage.setItem('admin_logged_in', 'true');
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    showAlert('success', 'Login berhasil!');
    loadDashboard();
    showSection('dashboard');
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
        console.log('User already logged in');
    }
}

function showSection(sectionId) {
    console.log(`Showing section: ${sectionId}`);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(`${sectionId}-section`);
    if (section) {
        section.classList.add('active');
    } else {
        console.error(`Section ${sectionId}-section not found`);
    }
    
    // Add active to nav button
    const navBtn = document.querySelector(`.nav-btn[onclick*="${sectionId}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }
    
    // Load section data
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
// GITHUB API FUNCTIONS
// ==============================

async function saveToGitHub(filename, content, message) {
    const token = localStorage.getItem('github_token');
    console.log(`💾 saveToGitHub called: ${filename}`, { hasToken: !!token, message });
    
    if (!token) {
        showAlert('error', 'GitHub Token tidak ditemukan! Silakan masukkan token di form login.');
        return false;
    }
    
    try {
        // Get file SHA if exists
        let sha = null;
        try {
            console.log('Fetching existing file...');
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filename}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                sha = data.sha;
                console.log('Got SHA:', sha?.substring(0, 20) + '...');
            } else if (response.status === 404) {
                console.log('File does not exist yet');
            } else {
                const error = await response.json();
                console.error('Error getting file:', error);
            }
        } catch (error) {
            console.error('Error getting SHA:', error);
        }
        
        // Convert content to base64
        const jsonString = JSON.stringify(content, null, 2);
        console.log('JSON to save:', jsonString.substring(0, 100) + '...');
        
        // Base64 encoding
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
        
        // Prepare request body
        const requestBody = {
            message: message,
            content: base64Content,
            branch: GITHUB_BRANCH
        };
        
        if (sha) {
            requestBody.sha = sha;
        }
        
        console.log('Sending request to GitHub...');
        
        // Send to GitHub
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filename}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        const result = await response.json();
        console.log('GitHub response:', result);
        
        if (response.ok) {
            console.log('✅ Save successful!');
            return true;
        } else {
            console.error('❌ Save failed:', result.message);
            showAlert('error', `Gagal menyimpan: ${result.message}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error in saveToGitHub:', error);
        showAlert('error', `Error: ${error.message}`);
        return false;
    }
}

// ==============================
// PENGUMUMAN FUNCTIONS
// ==============================

async function loadPengumumanList() {
    console.log('📋 Loading pengumuman list...');
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Data loaded:', data);
        
        const pengumuman = data.pengumuman || [];
        console.log(`Found ${pengumuman.length} pengumuman`);
        
        const container = document.getElementById('pengumuman-list');
        if (!container) {
            console.error('Container #pengumuman-list not found');
            return;
        }
        
        if (pengumuman.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Belum ada pengumuman</p>';
            return;
        }
        
        // Sort by date (newest first)
        pengumuman.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f2f2f2;">
                        <th style="padding: 12px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 12px; border: 1px solid #ddd;">Judul</th>
                        <th style="padding: 12px; border: 1px solid #ddd;">Tanggal</th>
                        <th style="padding: 12px; border: 1px solid #ddd;">Kategori</th>
                        <th style="padding: 12px; border: 1px solid #ddd;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        pengumuman.forEach(p => {
            html += `
                <tr>
                    <td style="padding: 12px; border: 1px solid #ddd;">${p.id}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${p.judul}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${p.kategori || '-'}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">
                        <button onclick="editPengumuman(${p.id})" 
                                style="background: #f39c12; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                            Edit
                        </button>
                        <button onclick="deletePengumuman(${p.id})" 
                                style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        console.log('✅ Pengumuman list loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading pengumuman list:', error);
        const container = document.getElementById('pengumuman-list');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <h3>Gagal memuat data</h3>
                    <p>${error.message}</p>
                    <button onclick="loadPengumumanList()" 
                            style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                        Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

function showPengumumanForm(id = null) {
    console.log(`📝 Show pengumuman form for id: ${id || 'new'}`);
    const form = document.getElementById('pengumuman-form');
    const title = document.getElementById('form-title');
    
    if (id) {
        title.textContent = 'Edit Pengumuman';
        loadPengumumanData(id);
    } else {
        title.textContent = 'Tambah Pengumuman Baru';
        resetPengumumanForm();
    }
    
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

function resetPengumumanForm() {
    document.getElementById('pengumuman-judul').value = '';
    document.getElementById('pengumuman-konten').value = '';
    document.getElementById('pengumuman-kategori').value = '';
    document.getElementById('pengumuman-lampiran').value = '';
    document.getElementById('pengumuman-id').value = '';
}

async function loadPengumumanData(id) {
    console.log(`📥 Loading pengumuman data for id: ${id}`);
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
            console.log('✅ Form filled with data');
        } else {
            showAlert('error', 'Pengumuman tidak ditemukan');
        }
    } catch (error) {
        console.error('Error loading pengumuman data:', error);
        showAlert('error', 'Gagal memuat data pengumuman');
    }
}

async function savePengumuman() {
    console.log('💾 Saving pengumuman...');
    
    const judul = document.getElementById('pengumuman-judul').value.trim();
    const konten = document.getElementById('pengumuman-konten').value.trim();
    const kategori = document.getElementById('pengumuman-kategori').value.trim();
    const lampiran = document.getElementById('pengumuman-lampiran').value.trim();
    const id = document.getElementById('pengumuman-id').value;
    
    console.log('Form data:', { judul, konten, kategori, lampiran, id });
    
    if (!judul || !konten) {
        showAlert('error', 'Judul dan konten harus diisi!');
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
                console.log('Current data loaded:', data);
            } else {
                // Create new structure if file doesn't exist
                data = {
                    pengumuman: [],
                    kuis: [],
                    leaderboard: []
                };
                console.log('Created new data structure');
            }
        } catch (error) {
            data = {
                pengumuman: [],
                kuis: [],
                leaderboard: []
            };
            console.log('Created new data structure due to error');
        }
        
        if (!data.pengumuman) {
            data.pengumuman = [];
        }
        
        if (id && id !== '') {
            // Update existing
            const index = data.pengumuman.findIndex(p => p.id == id);
            if (index !== -1) {
                data.pengumuman[index] = {
                    id: parseInt(id),
                    judul,
                    konten,
                    kategori: kategori || '',
                    lampiran: lampiran || '',
                    tanggal: data.pengumuman[index].tanggal
                };
                console.log(`Updated pengumuman at index ${index}`);
            } else {
                showAlert('error', 'Pengumuman tidak ditemukan!');
                return;
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
                kategori: kategori || '',
                lampiran: lampiran || '',
                tanggal: new Date().toISOString()
            });
            console.log(`Added new pengumuman with id ${newId}`);
        }
        
        // Save to GitHub
        const message = id ? `Update pengumuman: ${judul}` : `Tambah pengumuman: ${judul}`;
        console.log('Saving with message:', message);
        
        const success = await saveToGitHub('data.json', data, message);
        
        if (success) {
            showAlert('success', '✅ Pengumuman berhasil disimpan!');
            cancelPengumumanForm();
            setTimeout(() => {
                loadPengumumanList();
                loadDashboard();
            }, 1000);
        } else {
            showAlert('error', '❌ Gagal menyimpan pengumuman');
        }
        
    } catch (error) {
        console.error('❌ Error saving pengumuman:', error);
        showAlert('error', `Gagal menyimpan: ${error.message}`);
    }
}

function cancelPengumumanForm() {
    document.getElementById('pengumuman-form').style.display = 'none';
    resetPengumumanForm();
}

async function deletePengumuman(id) {
    console.log(`🗑️ Deleting pengumuman id: ${id}`);
    
    if (!confirm(`Apakah Anda yakin ingin menghapus pengumuman ini?`)) {
        return;
    }
    
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        if (!response.ok) {
            throw new Error('Gagal memuat data');
        }
        
        const data = await response.json();
        const initialCount = data.pengumuman?.length || 0;
        
        data.pengumuman = data.pengumuman?.filter(p => p.id != id) || [];
        const newCount = data.pengumuman.length;
        
        if (initialCount === newCount) {
            showAlert('error', 'Pengumuman tidak ditemukan!');
            return;
        }
        
        const success = await saveToGitHub('data.json', data, `Hapus pengumuman ID: ${id}`);
        
        if (success) {
            showAlert('success', '✅ Pengumuman berhasil dihapus!');
            setTimeout(() => {
                loadPengumumanList();
                loadDashboard();
            }, 1000);
        } else {
            showAlert('error', '❌ Gagal menghapus pengumuman');
        }
        
    } catch (error) {
        console.error('❌ Error deleting pengumuman:', error);
        showAlert('error', `Gagal menghapus: ${error.message}`);
    }
}

// ==============================
// GALERI FUNCTIONS
// ==============================

async function getGaleriStats() {
    console.log('📊 Getting galeri stats...');
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri?ref=${GITHUB_BRANCH}&t=${Date.now()}`
        );
        
        console.log('Galeri response status:', response.status);
        
        if (!response.ok) {
            console.log('Galeri folder not found or empty');
            return 0;
        }
        
        const files = await response.json();
        console.log('Galeri files:', files);
        
        if (!Array.isArray(files)) {
            return 0;
        }
        
        const imageCount = files.filter(file => 
            file.type === 'file' && 
            (file.name.toLowerCase().endsWith('.jpg') || 
             file.name.toLowerCase().endsWith('.jpeg') || 
             file.name.toLowerCase().endsWith('.png'))
        ).length;
        
        console.log(`Found ${imageCount} images in galeri`);
        return imageCount;
        
    } catch (error) {
        console.error('Error getting galeri stats:', error);
        return 0;
    }
}

async function loadGaleriList() {
    console.log('🖼️ Loading galeri list...');
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri?ref=${GITHUB_BRANCH}&t=${Date.now()}`
        );
        
        console.log('Galeri list response:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const files = await response.json();
        console.log('Galeri files:', files);
        
        const galeriList = document.getElementById('galeri-list');
        if (!galeriList) {
            console.error('Element #galeri-list not found');
            return;
        }
        
        if (!Array.isArray(files)) {
            galeriList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Folder galeri kosong atau tidak ditemukan</p>';
            return;
        }
        
        const imageFiles = files.filter(file => 
            file.type === 'file' && 
            (file.name.toLowerCase().endsWith('.jpg') || 
             file.name.toLowerCase().endsWith('.jpeg') || 
             file.name.toLowerCase().endsWith('.png'))
        );
        
        console.log(`Found ${imageFiles.length} image files`);
        
        if (imageFiles.length === 0) {
            galeriList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Belum ada foto di galeri</p>';
            return;
        }
        
        galeriList.innerHTML = '';
        
        imageFiles.forEach(file => {
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${file.path}`;
            
            const imgDiv = document.createElement('div');
            imgDiv.style.cssText = `
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 10px;
                margin: 10px;
                width: 150px;
                display: inline-block;
                vertical-align: top;
                text-align: center;
            `;
            
            imgDiv.innerHTML = `
                <img src="${rawUrl}" 
                     alt="${file.name}" 
                     style="width: 100%; height: 100px; object-fit: cover; border-radius: 5px;">
                <p style="font-size: 12px; margin: 5px 0; word-break: break-all;">${file.name}</p>
                <button onclick="deleteFoto('${file.path}', '${file.sha}')" 
                        style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; width: 100%; cursor: pointer; font-size: 12px;">
                    Hapus
                </button>
            `;
            galeriList.appendChild(imgDiv);
        });
        
        console.log('✅ Galeri list loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading galeri list:', error);
        const galeriList = document.getElementById('galeri-list');
        if (galeriList) {
            galeriList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <h3>Gagal memuat galeri</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 12px; color: #666;">
                        Pastikan folder "assets/image/galeri" ada di repository
                    </p>
                    <button onclick="loadGaleriList()" 
                            style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                        Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

async function deleteFoto(path, sha) {
    console.log(`🗑️ Deleting photo: ${path}`);
    
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        showAlert('error', 'GitHub Token tidak ditemukan');
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`,
            {
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
            }
        );
        
        if (response.ok) {
            showAlert('success', '✅ Foto berhasil dihapus');
            setTimeout(() => {
                loadGaleriList();
                loadDashboard();
            }, 1000);
        } else {
            const errorData = await response.json();
            console.error('Delete error:', errorData);
            showAlert('error', `❌ Gagal menghapus foto: ${errorData.message}`);
        }
        
    } catch (error) {
        console.error('Error deleting foto:', error);
        showAlert('error', '❌ Gagal menghapus foto');
    }
}

async function uploadGaleri() {
    console.log('📤 Uploading galeri...');
    
    const fileInput = document.getElementById('galeri-files');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showAlert('error', '❌ Pilih foto terlebih dahulu');
        return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        showAlert('error', '❌ GitHub Token tidak ditemukan');
        return;
    }
    
    const progressElement = document.getElementById('upload-progress');
    if (!progressElement) {
        console.error('Progress element not found');
        return;
    }
    
    progressElement.innerHTML = `<div style="padding: 10px; background: #d1ecf1; border-radius: 5px; margin-bottom: 10px;">
        Memulai upload ${files.length} foto...
    </div>`;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            const base64Content = await readFileAsBase64(file);
            const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
            const path = `assets/image/galeri/${filename}`;
            
            console.log(`Uploading ${filename}...`);
            
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`,
                {
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
                }
            );
            
            const result = await response.json();
            
            if (response.ok) {
                successCount++;
                progressElement.innerHTML += `<div style="padding: 5px; background: #d4edda; margin: 5px 0; border-radius: 3px;">
                    ✅ Berhasil: ${filename}
                </div>`;
            } else {
                errorCount++;
                progressElement.innerHTML += `<div style="padding: 5px; background: #f8d7da; margin: 5px 0; border-radius: 3px;">
                    ❌ Gagal: ${filename} - ${result.message}
                </div>`;
            }
            
        } catch (error) {
            console.error('Error uploading file:', error);
            errorCount++;
            progressElement.innerHTML += `<div style="padding: 5px; background: #f8d7da; margin: 5px 0; border-radius: 3px;">
                ❌ Error: ${file.name}
            </div>`;
        }
    }
    
    // Reset form
    fileInput.value = '';
    
    // Show final status
    progressElement.innerHTML += `<div style="padding: 10px; background: ${errorCount === 0 ? '#d4edda' : '#f8d7da'}; margin-top: 10px; border-radius: 5px;">
        <strong>Upload selesai:</strong> ${successCount} berhasil, ${errorCount} gagal
    </div>`;
    
    // Reload galeri list
    setTimeout(() => {
        loadGaleriList();
        loadDashboard();
    }, 2000);
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
// DASHBOARD FUNCTIONS
// ==============================

async function loadDashboard() {
    console.log('📊 Loading dashboard...');
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('Dashboard data:', data);
            
            document.getElementById('stat-pengumuman').textContent = data.pengumuman?.length || 0;
            document.getElementById('stat-kuis').textContent = data.kuis?.length || 0;
            document.getElementById('stat-leaderboard').textContent = data.leaderboard?.length || 0;
        } else {
            console.log('Data.json not found, using default values');
            document.getElementById('stat-pengumuman').textContent = '0';
            document.getElementById('stat-kuis').textContent = '0';
            document.getElementById('stat-leaderboard').textContent = '0';
        }
        
        // Get gallery stats
        const galeriCount = await getGaleriStats();
        document.getElementById('stat-galeri').textContent = galeriCount;
        console.log(`Galeri count: ${galeriCount}`);
        
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
                    • Repository: ${GITHUB_USER}/${GITHUB_REPO}<br>
                    • Branch: ${GITHUB_BRANCH}<br>
                    • Terakhir Update: ${new Date().toLocaleString('id-ID')}
                </div>
            `;
        }
        
        console.log('✅ Dashboard loaded successfully');
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('stat-pengumuman').textContent = '0';
        document.getElementById('stat-kuis').textContent = '0';
        document.getElementById('stat-leaderboard').textContent = '0';
        document.getElementById('stat-galeri').textContent = '0';
    }
}

// ==============================
// OTHER FUNCTIONS (Jadwal, Kuis, Backup)
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
        showAlert('error', '❌ Pilih file jadwal terlebih dahulu');
        return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        showAlert('error', '❌ GitHub Token tidak ditemukan');
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
                        'Authorization': `Bearer ${token}`,
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
                showAlert('success', '✅ Jadwal berhasil diupdate!');
                fileInput.value = '';
                const preview = document.getElementById('jadwal-preview');
                if (preview) {
                    preview.style.display = 'none';
                }
            } else {
                const error = await response.json();
                showAlert('error', `❌ Gagal mengupload: ${error.message}`);
            }
        };
        
    } catch (error) {
        console.error('Error uploading jadwal:', error);
        showAlert('error', '❌ Gagal mengupload jadwal');
    }
}

// ==============================
// INITIALIZATION
// ==============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin panel initialized');
    checkLogin();
    
    // Setup event listeners
    const adminPassword = document.getElementById('admin-password');
    const githubToken = document.getElementById('github-token');
    
    if (adminPassword) {
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    }
    
    if (githubToken) {
        githubToken.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    }
    
    // Add CSS for better UI
    const style = document.createElement('style');
    style.textContent = `
        .action-btn {
            padding: 5px 10px;
            margin: 2px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            transition: opacity 0.2s;
        }
        
        .action-btn:hover {
            opacity: 0.8;
        }
        
        .edit-btn {
            background: #f39c12;
            color: white;
        }
        
        .delete-btn {
            background: #e74c3c;
            color: white;
        }
        
        .loading {
            color: #666;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
    
    // Test functions for debugging
    window.testLoadData = async function() {
        console.log('🧪 TEST: Loading data...');
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data.json?t=${Date.now()}`
            );
            console.log('Test response:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Test data:', data);
                return data;
            }
            return null;
        } catch (error) {
            console.error('Test error:', error);
            return null;
        }
    };
    
    window.testToken = function() {
        const token = localStorage.getItem('github_token');
        console.log('🔑 Token check:', token ? `Found (${token.substring(0, 10)}...)` : 'Not found');
        return !!token;
    };
});

console.log('✅ admin.js loaded and ready');
