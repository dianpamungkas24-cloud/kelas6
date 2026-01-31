const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const GALERI_PATH = 'assets/image/galeri';

// Fungsi untuk memuat galeri
async function loadGaleri() {
    const gallery = document.getElementById('gallery-container');
    if (!gallery) return;
    
    try {
        gallery.innerHTML = '<div class="loading">Memuat galeri foto...</div>';
        
        // Menggunakan GitHub API untuk mendapatkan daftar file
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GALERI_PATH}?ref=${GITHUB_BRANCH}`);
        
        if (!response.ok) {
            throw new Error('Gagal mengambil daftar foto');
        }
        
        const files = await response.json();
        
        // Filter hanya file gambar
        const imageFiles = files.filter(file => 
            file.type === 'file' && 
            (file.name.toLowerCase().endsWith('.jpg') || 
             file.name.toLowerCase().endsWith('.jpeg') || 
             file.name.toLowerCase().endsWith('.png'))
        );
        
        if (imageFiles.length === 0) {
            gallery.innerHTML = '<div class="no-results">Belum ada foto di galeri</div>';
            return;
        }
        
        gallery.innerHTML = '';
        
        // Buat elemen untuk setiap foto
        imageFiles.forEach(file => {
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${file.path}`;
            
            const imgDiv = document.createElement('div');
            imgDiv.className = 'gallery-item';
            imgDiv.innerHTML = `
                <img src="${rawUrl}" 
                     alt="${file.name}" 
                     loading="lazy"
                     onclick="openLightbox('${rawUrl}')">
                <p>${file.name.replace(/\.[^/.]+$/, '')}</p>
            `;
            
            gallery.appendChild(imgDiv);
        });
        
        // Tambah lazy loading observer
        setupLazyLoading();
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        gallery.innerHTML = '<div class="no-results">Gagal memuat galeri foto</div>';
    }
}

// Fungsi untuk membuka lightbox
function openLightbox(imageUrl) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    if (lightbox && lightboxImg) {
        lightboxImg.src = imageUrl;
        lightbox.style.display = 'flex';
        
        // Prevent scrolling behind lightbox
        document.body.style.overflow = 'hidden';
    }
}

// Fungsi untuk menutup lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Fungsi untuk setup lazy loading
function setupLazyLoading() {
    const images = document.querySelectorAll('.gallery-item img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => {
            img.dataset.src = img.src;
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f8f9fa"/></svg>';
            imageObserver.observe(img);
        });
    }
}

// Fungsi untuk filter galeri (jika diperlukan)
function filterGaleri(category) {
    const items = document.querySelectorAll('.gallery-item');
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load galeri
    loadGaleri();
    
    // Tambah event listener untuk menutup lightbox
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox || e.target.className === 'lightbox-close') {
                closeLightbox();
            }
        });
    }
    
    // Tambah keyboard support untuk lightbox
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
});

// Fungsi untuk menghitung jumlah foto di galeri
async function getGaleriStats() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GALERI_PATH}?ref=${GITHUB_BRANCH}`);
        if (response.ok) {
            const files = await response.json();
            const imageFiles = files.filter(file => 
                file.type === 'file' && 
                (file.name.toLowerCase().endsWith('.jpg') || 
                 file.name.toLowerCase().endsWith('.jpeg') || 
                 file.name.toLowerCase().endsWith('.png'))
            );
            return imageFiles.length;
        }
        return 0;
    } catch (error) {
        console.error('Error getting gallery stats:', error);
        return 0;
    }
}