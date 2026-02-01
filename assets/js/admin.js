// admin.js - GITHUB REST API VERSION
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const ADMIN_PASSWORD = 'kelas6admin123';
const DATA_FILE = 'data.json';

console.log('🚀 Admin Panel Loaded - GITHUB REST API VERSION');

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
    
    if (!token) {
        alert('⚠️ Token GitHub diperlukan untuk menyimpan data!');
        return;
    }
    
    localStorage.setItem('github_token', token);
    localStorage.setItem('admin_logged_in', 'true');
    
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    // Test connection first
    testGitHubConnection().then(success => {
        if (success) {
            loadDashboard();
            loadPengumumanList();
            showSection('dashboard');
            alert('✅ Login berhasil! Koneksi GitHub OK.');
        } else {
            alert('⚠️ Login berhasil tapi koneksi GitHub bermasalah.');
        }
    });
}

async function testGitHubConnection() {
    const token = localStorage.getItem('github_token');
    if (!token) return false;
    
    try {
        console.log('🔗 Testing GitHub REST API connection...');
        
        // Test 1: Check if token is valid
        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!userResponse.ok) {
            console.error('❌ Token tidak valid');
            return false;
        }
        
        // Test 2: Check if repo exists
        const repoUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}`;
        const repoResponse = await fetch(repoUrl, {
            headers: { 
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!repoResponse.ok) {
            console.error('❌ Repository tidak ditemukan');
            return false;
        }
        
        // Test 3: Check branch
        const branchUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/branches/${GITHUB_BRANCH}`;
        const branchResponse = await fetch(branchUrl, {
            headers: { 
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!branchResponse.ok) {
            console.error('❌ Branch tidak ditemukan');
            return false;
        }
        
        console.log('✅ GitHub REST API connection test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return false;
    }
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
        loadPengumumanList();
        showSection('dashboard');
    }
}

// ==============================
// 2. GITHUB REST API FUNCTIONS
// ==============================

class GitHubAPI {
    constructor() {
        this.token = localStorage.getItem('github_token');
        this.baseURL = 'https://api.github.com';
        this.headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }
    
    async getReference() {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${GITHUB_USER}/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`,
                { headers: this.headers }
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Got reference SHA:', data.object.sha.substring(0, 8));
                return data.object.sha; // Latest commit SHA
            } else if (response.status === 404) {
                console.log('❌ Branch reference not found');
                return null;
            } else {
                throw new Error(`Failed to get reference: ${response.status}`);
            }
        } catch (error) {
            console.error('Error getting reference:', error);
            throw error;
        }
    }
    
    async getTree(commitSHA) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${GITHUB_USER}/${GITHUB_REPO}/git/commits/${commitSHA}`,
                { headers: this.headers }
            );
            
            if (response.ok) {
                const commit = await response.json();
                return commit.tree.sha; // Tree SHA
            } else {
                throw new Error(`Failed to get tree: ${response.status}`);
            }
        } catch (error) {
            console.error('Error getting tree:', error);
            throw error;
        }
    }
    
    async createBlob(content) {
        try {
            const jsonString = JSON.stringify(content, null, 2);
            const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
            
            const response = await fetch(
                `${this.baseURL}/repos/${GITHUB_USER}/${GITHUB_REPO}/git/blobs`,
                {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify({
                        content: base64Content,
                        encoding: 'base64'
                    })
                }
            );
            
            if (response.ok) {
                const blob = await response.json();
                console.log('✅ Created blob SHA:', blob.sha.substring(0, 8));
                return blob.sha;
            } else {
                const error = await response.json();
                throw new Error(`Failed to create blob: ${error.message}`);
            }
        } catch (error) {
            console.error('Error creating blob:', error);
            throw error;
        }
    }
    
    async createTree(baseTreeSHA, blobSHA, filename) {
        try {
            const treeData = {
                base_tree: baseTreeSHA,
                tree: [
                    {
                        path: filename,
                        mode: '100644', // File mode
                        type: 'blob',
                        sha: blobSHA
                    }
                ]
            };
            
            const response = await fetch(
                `${this.baseURL}/repos/${GITHUB_USER}/${GITHUB_REPO}/git/trees`,
                {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(treeData)
                }
            );
            
            if (response.ok) {
                const tree = await response.json();
                console.log('✅ Created tree SHA:', tree.sha.substring(0, 8));
                return tree.sha;
            } else {
                const error = await response.json();
                throw new Error(`Failed to create tree: ${error.message}`);
            }
        } catch (error) {
            console.error('Error creating tree:', error);
            throw error;
        }
    }
    
    async createCommit(treeSHA, parentCommitSHA, message) {
        try {
            const commitData = {
                message: message,
                tree: treeSHA,
                parents: parentCommitSHA ? [parentCommitSHA] : []
            };
            
            const response = await fetch(
                `${this.baseURL}/repos/${GITHUB_USER}/${GITHUB_REPO}/git/commits`,
                {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(commitData)
                }
            );
            
            if (response.ok) {
                const commit = await response.json();
                console.log('✅ Created commit SHA:', commit.sha.substring(0, 8));
                return commit.sha;
            } else {
                const error = await response.json();
                throw new Error(`Failed to create commit: ${error.message}`);
            }
        } catch (error) {
            console.error('Error creating commit:', error);
            throw error;
        }
    }
    
    async updateReference(commitSHA) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${GITHUB_USER}/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`,
                {
                    method: 'PATCH',
                    headers: this.headers,
                    body: JSON.stringify({
                        sha: commitSHA,
                        force: false
                    })
                }
            );
            
            if (response.ok) {
                const ref = await response.json();
                console.log('✅ Updated reference to commit:', ref.object.sha.substring(0, 8));
                return true;
            } else {
                const error = await response.json();
                throw new Error(`Failed to update reference: ${error.message}`);
            }
        } catch (error) {
            console.error('Error updating reference:', error);
            throw error;
        }
    }
    
    async saveFile(filename, content, message) {
        console.log(`💾 Saving ${filename} via GitHub REST API...`);
        console.log(`📝 Commit message: ${message}`);
        
        try {
            // 1. Get latest commit SHA
            const latestCommitSHA = await this.getReference();
            if (!latestCommitSHA) {
                throw new Error('Could not get latest commit');
            }
            
            // 2. Get tree SHA from commit
            const baseTreeSHA = await this.getTree(latestCommitSHA);
            
            // 3. Create blob (file content)
            const blobSHA = await this.createBlob(content);
            
            // 4. Create new tree with updated file
            const newTreeSHA = await this.createTree(baseTreeSHA, blobSHA, filename);
            
            // 5. Create new commit
            const newCommitSHA = await this.createCommit(newTreeSHA, latestCommitSHA, message);
            
            // 6. Update branch reference
            await this.updateReference(newCommitSHA);
            
            console.log('✅ File saved successfully via REST API!');
            return {
                success: true,
                commitSHA: newCommitSHA,
                message: 'File berhasil disimpan menggunakan GitHub REST API'
            };
            
        } catch (error) {
            console.error('❌ Error saving file via REST API:', error);
            return {
                success: false,
                error: error.message,
                details: error
            };
        }
    }
    
    async getFileContent(filename) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filename}?ref=${GITHUB_BRANCH}`,
                { headers: this.headers }
            );
            
            if (response.ok) {
                const fileData = await response.json();
                
                if (fileData.encoding === 'base64') {
                    const content = decodeURIComponent(escape(atob(fileData.content)));
                    return JSON.parse(content);
                } else {
                    return JSON.parse(fileData.content);
                }
            } else if (response.status === 404) {
                console.log('📄 File not found, returning empty structure');
                return {
                    pengumuman: [],
                    kuis: [],
                    leaderboard: [],
                    galeri: []
                };
            } else {
                throw new Error(`Failed to get file: ${response.status}`);
            }
        } catch (error) {
            console.error('Error getting file content:', error);
            throw error;
        }
    }
}

// ==============================
// 3. SAVE TO GITHUB FUNCTION
// ==============================

async function saveToGitHub(filename, content, message) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('❌ Token GitHub tidak ditemukan! Silakan login kembali.');
        return { success: false, error: 'No token' };
    }
    
    console.log(`💾 Saving to GitHub: ${filename}`);
    console.log(`📝 Commit message: ${message}`);
    
    try {
        const githubAPI = new GitHubAPI();
        
        // Try REST API first
        const result = await githubAPI.saveFile(filename, content, message);
        
        if (result.success) {
            console.log('✅ Save successful via REST API');
            return { success: true, data: result };
        } else {
            console.warn('⚠️ REST API failed, trying legacy method');
            
            // Fallback to legacy method
            return await saveToGitHubLegacy(filename, content, message);
        }
        
    } catch (error) {
        console.error('❌ Error saving:', error);
        return { 
            success: false, 
            error: `Error: ${error.message}` 
        };
    }
}

// Legacy method as fallback
async function saveToGitHubLegacy(filename, content, message) {
    const token = localStorage.getItem('github_token');
    
    try {
        // Get existing file SHA
        let sha = null;
        try {
            const shaResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filename}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (shaResponse.ok) {
                const shaData = await shaResponse.json();
                sha = shaData.sha;
            }
        } catch (e) {
            console.log('No existing file found');
        }
        
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
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        const responseData = await response.json();
        
        if (response.ok) {
            console.log('✅ Save successful via legacy method');
            return { success: true, data: responseData };
        } else {
            console.error('❌ Legacy save failed:', responseData);
            return { 
                success: false, 
                error: responseData.message || 'Unknown error',
                details: responseData
            };
        }
        
    } catch (error) {
        console.error('❌ Legacy save error:', error);
        return { 
            success: false, 
            error: `Legacy error: ${error.message}` 
        };
    }
}

async function loadData() {
    console.log('📥 Loading data from GitHub...');
    
    try {
        const token = localStorage.getItem('github_token');
        
        if (token) {
            // Try REST API first
            try {
                const githubAPI = new GitHubAPI();
                const data = await githubAPI.getFileContent(DATA_FILE);
                console.log('✅ Data loaded via REST API');
                return data;
            } catch (apiError) {
                console.log('⚠️ REST API failed, trying raw URL');
            }
        }
        
        // Fallback to raw URL
        const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${DATA_FILE}?t=${Date.now()}`;
        console.log(`🔗 Fetching from: ${url}`);
        
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Data loaded via raw URL');
            return data;
        } else if (response.status === 404) {
            console.log('📄 File not found, returning empty structure');
            return {
                pengumuman: [],
                kuis: [],
                leaderboard: [],
                galeri: []
            };
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
        return {
            pengumuman: [],
            kuis: [],
            leaderboard: [],
            galeri: []
        };
    }
}

// ==============================
// 4. PENGUMUMAN FUNCTIONS
// ==============================

function showSection(sectionId) {
    console.log(`🔍 Showing section: ${sectionId}`);
    
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
    if (section) {
        section.classList.add('active');
    }
    
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
    } else if (sectionId === 'dashboard') {
        loadDashboard();
    }
}

function showPengumumanForm(id = null) {
    console.log(`📝 Opening pengumuman form for ID: ${id || 'new'}`);
    
    const form = document.getElementById('pengumuman-form');
    const title = document.getElementById('form-title');
    
    if (!form) {
        console.error('❌ Form element not found!');
        return;
    }
    
    if (id) {
        title.textContent = 'Edit Pengumuman';
        loadPengumumanData(id);
    } else {
        title.textContent = 'Tambah Pengumuman Baru';
        document.getElementById('pengumuman-judul').value = '';
        document.getElementById('pengumuman-konten').value = '';
        document.getElementById('pengumuman-kategori').value = 'Umum';
        document.getElementById('pengumuman-lampiran').value = '';
        document.getElementById('pengumuman-id').value = '';
    }
    
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

async function loadPengumumanData(id) {
    console.log(`📋 Loading pengumuman data for ID: ${id}`);
    
    try {
        const data = await loadData();
        const pengumuman = data.pengumuman?.find(p => p.id == id);
        
        if (pengumuman) {
            document.getElementById('pengumuman-judul').value = pengumuman.judul || '';
            document.getElementById('pengumuman-konten').value = pengumuman.konten || '';
            document.getElementById('pengumuman-kategori').value = pengumuman.kategori || 'Umum';
            document.getElementById('pengumuman-lampiran').value = pengumuman.lampiran || '';
            document.getElementById('pengumuman-id').value = pengumuman.id;
        } else {
            alert('Pengumuman tidak ditemukan!');
        }
    } catch (error) {
        console.error('Error loading pengumuman data:', error);
        alert('Gagal memuat data pengumuman');
    }
}

async function savePengumuman() {
    console.log('💾 Saving pengumuman via REST API...');
    
    const judul = document.getElementById('pengumuman-judul').value.trim();
    const konten = document.getElementById('pengumuman-konten').value.trim();
    const kategori = document.getElementById('pengumuman-kategori').value.trim();
    const lampiran = document.getElementById('pengumuman-lampiran').value.trim();
    const id = document.getElementById('pengumuman-id').value;
    
    console.log('Form data:', { judul, konten, kategori, lampiran, id });
    
    if (!judul || !konten) {
        alert('❌ Judul dan konten harus diisi!');
        return;
    }
    
    // Show loading state
    const saveBtn = document.querySelector('#pengumuman-form button[onclick="savePengumuman()"]');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '⏳ Menyimpan...';
    saveBtn.disabled = true;
    
    // Show progress
    const progressDiv = document.createElement('div');
    progressDiv.id = 'save-progress';
    progressDiv.innerHTML = `
        <div style="background: #3498db; color: white; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px;">
            <div>🔄 Menyimpan ke GitHub...</div>
            <div id="progress-steps" style="margin-top: 5px; font-size: 12px;"></div>
        </div>
    `;
    saveBtn.parentNode.appendChild(progressDiv);
    
    try {
        // Load current data
        updateProgress('Mengambil data saat ini...');
        const data = await loadData();
        
        if (!data.pengumuman) data.pengumuman = [];
        
        const now = new Date().toISOString();
        
        if (id) {
            // Update existing
            const index = data.pengumuman.findIndex(p => p.id == id);
            if (index !== -1) {
                data.pengumuman[index] = {
                    ...data.pengumuman[index],
                    judul,
                    konten,
                    kategori: kategori || 'Umum',
                    lampiran: lampiran || '',
                    tanggal: data.pengumuman[index].tanggal || now
                };
                console.log(`Updated pengumuman ID ${id}`);
            } else {
                console.warn('Pengumuman not found, adding as new');
                const newId = data.pengumuman.length > 0 
                    ? Math.max(...data.pengumuman.map(p => p.id)) + 1 
                    : 1;
                
                data.pengumuman.push({
                    id: newId,
                    judul,
                    konten,
                    kategori: kategori || 'Umum',
                    lampiran: lampiran || '',
                    tanggal: now
                });
            }
        } else {
            // Add new
            const newId = data.pengumuman.length > 0 
                ? Math.max(...data.pengumuman.map(p => p.id)) + 1 
                : 1;
            
            console.log(`Adding new pengumuman with ID: ${newId}`);
            
            data.pengumuman.push({
                id: newId,
                judul,
                konten,
                kategori: kategori || 'Umum',
                lampiran: lampiran || '',
                tanggal: now
            });
        }
        
        updateProgress('Menyimpan ke GitHub...');
        
        // Save to GitHub
        const message = id ? `Update pengumuman: ${judul}` : `Tambah pengumuman: ${judul}`;
        const result = await saveToGitHub(DATA_FILE, data, message);
        
        // Remove progress
        const progressElement = document.getElementById('save-progress');
        if (progressElement) {
            progressElement.remove();
        }
        
        if (result.success) {
            alert('✅ Pengumuman berhasil disimpan!\n\n' + 
                  (result.data?.message || 'Data telah disimpan ke GitHub.'));
            
            document.getElementById('pengumuman-form').style.display = 'none';
            
            // Refresh data
            updateProgress('Memperbarui tampilan...');
            await loadPengumumanList();
            await loadDashboard();
            
            console.log('✅ Data reloaded after save');
            
        } else {
            alert(`❌ Gagal menyimpan pengumuman:\n\n${result.error}\n\nCoba lagi atau periksa token GitHub Anda.`);
            console.error('Save failed:', result);
        }
        
    } catch (error) {
        console.error('❌ Error saving pengumuman:', error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        // Restore button
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        
        // Remove progress if still exists
        const progressElement = document.getElementById('save-progress');
        if (progressElement) {
            progressElement.remove();
        }
    }
}

function updateProgress(message) {
    const progressSteps = document.getElementById('progress-steps');
    if (progressSteps) {
        const step = document.createElement('div');
        step.textContent = `• ${message}`;
        progressSteps.appendChild(step);
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
        
        console.log(`Found ${pengumuman.length} pengumuman`);
        
        const container = document.getElementById('pengumuman-list');
        if (!container) {
            console.error('❌ Container not found');
            return;
        }
        
        if (pengumuman.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p style="font-size: 18px; margin-bottom: 10px;">📭 Belum ada pengumuman</p>
                    <p>Klik "Tambah Pengumuman" untuk membuat yang pertama</p>
                </div>
            `;
            return;
        }
        
        // Sort by date
        pengumuman.sort((a, b) => {
            const dateA = new Date(a.tanggal || Date.now());
            const dateB = new Date(b.tanggal || Date.now());
            return dateB - dateA;
        });
        
        let html = `
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: #3498db; color: white;">
                        <th style="padding: 12px; text-align: left; width: 60px;">ID</th>
                        <th style="padding: 12px; text-align: left;">Judul</th>
                        <th style="padding: 12px; text-align: left; width: 120px;">Tanggal</th>
                        <th style="padding: 12px; text-align: left; width: 100px;">Kategori</th>
                        <th style="padding: 12px; text-align: left; width: 150px;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        pengumuman.forEach(p => {
            const date = new Date(p.tanggal);
            const formattedDate = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            
            html += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px;">${p.id}</td>
                    <td style="padding: 12px;">
                        <div style="font-weight: 500; color: #2c3e50;">${p.judul}</div>
                        <div style="font-size: 12px; color: #7f8c8d; margin-top: 2px;">
                            ${p.konten.substring(0, 60)}${p.konten.length > 60 ? '...' : ''}
                        </div>
                    </td>
                    <td style="padding: 12px;">${formattedDate}</td>
                    <td style="padding: 12px;">
                        <span style="background: #e8f4fc; color: #3498db; padding: 3px 10px; border-radius: 12px; font-size: 12px;">
                            ${p.kategori || 'Umum'}
                        </span>
                    </td>
                    <td style="padding: 12px;">
                        <button onclick="showPengumumanForm(${p.id})" style="background: #f39c12; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 13px;">
                            ✏️ Edit
                        </button>
                        <button onclick="deletePengumuman(${p.id})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            🗑️ Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        console.log('✅ Pengumuman list loaded');
        
    } catch (error) {
        console.error('Error loading pengumuman list:', error);
        const container = document.getElementById('pengumuman-list');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #e74c3c;">
                    <p style="font-size: 16px; margin-bottom: 10px;">❌ Gagal memuat data</p>
                    <button onclick="loadPengumumanList()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        🔄 Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

async function deletePengumuman(id) {
    if (!confirm(`Yakin ingin menghapus pengumuman ID: ${id}?`)) return;
    
    console.log(`🗑️ Deleting pengumuman ID: ${id}`);
    
    const deleteBtn = event.target;
    const originalText = deleteBtn.textContent;
    deleteBtn.textContent = '⏳ Menghapus...';
    deleteBtn.disabled = true;
    
    try {
        const data = await loadData();
        const initialCount = data.pengumuman?.length || 0;
        
        data.pengumuman = data.pengumuman?.filter(p => p.id != id) || [];
        
        if (initialCount === data.pengumuman.length) {
            alert('❌ Pengumuman tidak ditemukan!');
            return;
        }
        
        const message = `Hapus pengumuman ID: ${id}`;
        const result = await saveToGitHub(DATA_FILE, data, message);
        
        if (result.success) {
            alert('✅ Pengumuman berhasil dihapus!');
            await loadPengumumanList();
            await loadDashboard();
        } else {
            alert(`❌ Gagal menghapus: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Error deleting pengumuman:', error);
        alert('❌ Gagal menghapus pengumuman');
    } finally {
        deleteBtn.textContent = originalText;
        deleteBtn.disabled = false;
    }
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
                            padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid ${token ? '#c3e6cb' : '#f5c6cb'};">
                    <strong>Status Sistem:</strong><br>
                    • GitHub API: ${token ? '✅ REST API Terhubung' : '⚠️ Token tidak ditemukan'}<br>
                    • Terakhir Update: ${new Date().toLocaleString('id-ID')}<br>
                    • Mode Penyimpanan: GitHub REST API<br>
                    • Total Data: ${(data.pengumuman?.length || 0) + (data.kuis?.length || 0)} item
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ==============================
// 6. DEBUG & TEST FUNCTIONS
// ==============================

window.testGitHubAPI = async function() {
    console.log('🧪 Testing GitHub REST API...');
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('Token tidak ditemukan');
        return;
    }
    
    try {
        const githubAPI = new GitHubAPI();
        
        // Test 1: Get reference
        console.log('1. Testing getReference...');
        const refSHA = await githubAPI.getReference();
        console.log('Reference SHA:', refSHA);
        
        if (refSHA) {
            // Test 2: Get tree
            console.log('2. Testing getTree...');
            const treeSHA = await githubAPI.getTree(refSHA);
            console.log('Tree SHA:', treeSHA);
            
            // Test 3: Create a test blob
            console.log('3. Testing createBlob...');
            const testData = { test: 'data', timestamp: Date.now() };
            const blobSHA = await githubAPI.createBlob(testData);
            console.log('Blob SHA:', blobSHA);
            
            alert(`✅ GitHub REST API berfungsi!\n\n` +
                  `Reference: ${refSHA.substring(0, 8)}...\n` +
                  `Tree: ${treeSHA.substring(0, 8)}...\n` +
                  `Blob: ${blobSHA.substring(0, 8)}...`);
        } else {
            alert('⚠️ Tidak bisa mendapatkan reference. Repository mungkin kosong.');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        alert(`❌ Test gagal: ${error.message}`);
    }
};

window.forceRefreshAll = function() {
    console.log('🔄 Force refreshing all data...');
    loadDashboard();
    loadPengumumanList();
    loadKuisList();
    alert('Semua data diperbarui!');
};

// ==============================
// 7. OTHER FUNCTIONS (SIMPLE VERSIONS)
// ==============================

async function getGaleriStats() {
    const token = localStorage.getItem('github_token');
    if (!token) return 0;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/assets/image/galeri`,
            { headers: { 'Authorization': `token ${token}` } }
        );
        
        if (!response.ok) return 0;
        
        const files = await response.json();
        if (!Array.isArray(files)) return 0;
        
        return files.filter(file => 
            file.type === 'file' && 
            /\.(jpg|jpeg|png|gif)$/i.test(file.name)
        ).length;
        
    } catch (error) {
        return 0;
    }
}

// Simple versions of other functions
function showKuisForm(id = null) {
    alert('Fitur kuis akan datang...');
}

async function loadKuisList() {
    // Implementation for kuis
}

async function loadGaleriList() {
    // Implementation for galeri
}

// ==============================
// 8. INITIALIZATION
// ==============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Panel Initialized - GitHub REST API Version');
    
    // Check login
    checkLogin();
    
    // Setup enter key for login
    document.getElementById('admin-password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('github-token')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    // Check connection on startup
    if (localStorage.getItem('admin_logged_in') === 'true') {
        console.log('Checking GitHub connection...');
    }
    
    // Debug info
    console.log('GitHub REST API Admin Panel Ready!');
    console.log('Available commands:');
    console.log('- testGitHubAPI() - Test REST API connection');
    console.log('- forceRefreshAll() - Refresh all data');
    console.log('- checkLogin() - Check login status');
});
