const JADWAL_IMAGE_URL = 'https://raw.githubusercontent.com/dianpamungkas24-cloud/kelas6/main/assets/image/jadwal/jadwal.jpg';

let refreshInterval;

// Fungsi untuk memuat jadwal
async function loadJadwal() {
    const img = document.getElementById('jadwal-image');
    const updateInfo = document.getElementById('last-updated');
    
    if (!img || !updateInfo) return;
    
    try {
        // Tambah timestamp untuk cache busting
        const timestamp = new Date().getTime();
        const imageUrl = `${JADWAL_IMAGE_URL}?v=${timestamp}`;
        
        // Load image
        img.src = imageUrl;
        img.onload = function() {
            updateInfo.textContent = `Jadwal dimuat pada: ${new Date().toLocaleString('id-ID')}`;
        };
        
        img.onerror = function() {
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f8f9fa"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-family="sans-serif">Jadwal tidak ditemukan</text></svg>';
            updateInfo.textContent = 'Jadwal belum tersedia. Admin dapat mengupload jadwal melalui panel admin.';
        };
        
    } catch (error) {
        console.error('Error loading jadwal:', error);
        if (updateInfo) {
            updateInfo.textContent = 'Gagal memuat jadwal. Silakan coba lagi.';
        }
    }
}

// Fungsi untuk mendownload jadwal
function downloadJadwal() {
    const img = document.getElementById('jadwal-image');
    if (!img || !img.src || img.src.startsWith('data:')) {
        alert('Jadwal belum tersedia untuk didownload.');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `jadwal-kelas6-${new Date().toISOString().split('T')[0]}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Jadwal berhasil didownload!', 'success');
    } catch (error) {
        console.error('Error downloading jadwal:', error);
        showNotification('Gagal mendownload jadwal', 'error');
    }
}

// Fungsi untuk memulai auto-refresh
function startAutoRefresh() {
    // Refresh setiap 5 menit (300000 ms)
    refreshInterval = setInterval(loadJadwal, 5 * 60 * 1000);
}

// Fungsi untuk menghentikan auto-refresh
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load jadwal pertama kali
    loadJadwal();
    
    // Mulai auto-refresh
    startAutoRefresh();
    
    // Tambah event listener untuk download button
    const downloadBtn = document.querySelector('button[onclick="downloadJadwal()"]');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadJadwal);
    }
    
    // Handle page visibility change
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            startAutoRefresh();
            loadJadwal(); // Refresh jadwal saat kembali ke tab
        }
    });
});

// Cleanup saat page unload
window.addEventListener('beforeunload', stopAutoRefresh);

// Fungsi untuk mengecek update jadwal dari GitHub
async function checkForUpdates() {
    try {
        const response = await fetch(JADWAL_IMAGE_URL, { method: 'HEAD' });
        const lastModified = response.headers.get('last-modified');
        
        if (lastModified) {
            const lastUpdate = new Date(lastModified);
            const now = new Date();
            const diffInMinutes = Math.floor((now - lastUpdate) / (1000 * 60));
            
            if (diffInMinutes < 5) { // Jika update kurang dari 5 menit yang lalu
                loadJadwal(); // Refresh jadwal
            }
        }
    } catch (error) {
        console.log('Tidak bisa mengecek update jadwal:', error);
    }
}

// Cek update secara berkala (setiap menit)
setInterval(checkForUpdates, 60 * 1000);