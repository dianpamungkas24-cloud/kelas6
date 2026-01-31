// Konfigurasi GitHub
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';

// Fungsi untuk toggle menu mobile
function toggleMenu() {
    const nav = document.querySelector('nav');
    nav.classList.toggle('active');
}

// Fungsi untuk fetch data dari GitHub
async function fetchFromGitHub(path) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`);
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
    } catch (error) {
        console.error('Error fetching from GitHub:', error);
        return null;
    }
}

// Fungsi untuk menyimpan data ke GitHub
async function saveToGitHub(path, data, message) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        console.error('GitHub token not found');
        return false;
    }
    
    try {
        // 1. Get current file SHA (if exists)
        let sha = null;
        try {
            const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }
        } catch (e) {
            // File doesn't exist yet
        }
        
        // 2. Convert data to base64
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
        
        // 3. Upload to GitHub
        const updateResponse = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: message,
                content: content,
                sha: sha,
                branch: GITHUB_BRANCH
            })
        });
        
        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            throw new Error(error.message);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving to GitHub:', error);
        return false;
    }
}

// Fungsi untuk load pengumuman terbaru di homepage
async function loadPengumumanTerbaru() {
    try {
        const data = await fetchFromGitHub('data.json');
        if (!data || !data.pengumuman) return;
        
        const pengumumanList = data.pengumuman
            .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
            .slice(0, 4); // Ambil 4 terbaru
        
        const container = document.getElementById('pengumuman-list');
        if (!container) return;
        
        if (pengumumanList.length === 0) {
            container.innerHTML = '<div class="loading">Belum ada pengumuman</div>';
            return;
        }
        
        const html = pengumumanList.map(item => `
            <div class="pengumuman-card" onclick="showPengumumanDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div class="pengumuman-date">
                    ${new Date(item.tanggal).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    })}
                </div>
                <h3>${item.judul}</h3>
                <p>${item.konten.substring(0, 100)}${item.konten.length > 100 ? '...' : ''}</p>
            </div>
        `).join('');
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading pengumuman:', error);
    }
}

// Fungsi untuk menampilkan detail pengumuman di modal
function showPengumumanDetail(pengumuman) {
    const modalHtml = `
        <div class="modal" id="pengumuman-modal">
            <div class="modal-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">${pengumuman.judul}</h2>
                    <button onclick="closeModal()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    ">&times;</button>
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    color: #666;
                ">
                    <strong>Tanggal:</strong> ${new Date(pengumuman.tanggal).toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                    ${pengumuman.kategori ? ` | <strong>Kategori:</strong> ${pengumuman.kategori}` : ''}
                </div>
                
                <div style="line-height: 1.8; color: #333; margin-bottom: 20px;">
                    ${pengumuman.konten.replace(/\n/g, '<br>')}
                </div>
                
                ${pengumuman.lampiran ? `
                    <div style="margin-top: 20px;">
                        <strong>Lampiran:</strong>
                        <a href="${pengumuman.lampiran}" target="_blank" style="
                            color: #3498db;
                            text-decoration: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                            margin-left: 10px;
                        ">
                            <span>📎</span>
                            <span>${pengumuman.lampiran.split('/').pop()}</span>
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Tambah event listener untuk menutup modal
    const modal = document.getElementById('pengumuman-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Fungsi untuk menutup modal
function closeModal() {
    const modal = document.getElementById('pengumuman-modal');
    if (modal) {
        modal.remove();
    }
}

// Event listeners untuk homepage
document.addEventListener('DOMContentLoaded', function() {
    // Load pengumuman terbaru
    loadPengumumanTerbaru();
    
    // Tambah event listener untuk semua card
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            const url = this.getAttribute('onclick')?.match(/location\.href='([^']+)'/)?.[1];
            if (url) {
                window.location.href = url;
            }
        });
    });
});

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Tambah style untuk animasi notifikasi
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Fungsi untuk format tanggal
function formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
}

// Fungsi untuk validasi input
function validateInput(input, type = 'text') {
    if (!input || input.trim() === '') {
        return false;
    }
    
    if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input);
    }
    
    if (type === 'url') {
        try {
            new URL(input);
            return true;
        } catch {
            return false;
        }
    }
    
    return true;
}