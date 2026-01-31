README.md (Deployment Guide)
markdown
# Portal Kelas 6 - Website Interaktif dengan GitHub Integration

Website portal digital untuk kelas 6 dengan integrasi GitHub API untuk manajemen konten.

## 🚀 Deployment Steps

### 1. Persiapan Repository
1. Buat repository baru di GitHub dengan nama: `kelas6`
2. Clone repository ke komputer Anda:
   ```bash
   git clone https://github.com/dianpamungkas24-cloud/kelas6.git
   cd kelas6
2. Struktur File
Salin semua file yang telah dibuat ke dalam folder repository:

index.html

data.json

Folder assets/ dengan semua subfolder dan file

Folder page/ dengan semua halaman HTML

3. GitHub Pages Setup
Push semua file ke repository:

bash
git add .
git commit -m "Initial commit - Portal Kelas 6"
git push origin main
Aktifkan GitHub Pages:

Buka repository di GitHub

Settings → Pages

Source: Deploy from a branch

Branch: main → / (root)

Klik Save

Website akan tersedia di:

text
https://dianpamungkas24-cloud.github.io/kelas6/
4. Setup Admin Panel
Buat GitHub Personal Access Token:

GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

Generate new token → Select "repo" (Full control of private repositories)

Simpan token dengan aman

Login ke Admin Panel:

Buka /page/admin.html

Password: kelas6admin123

Masukkan GitHub Token untuk fitur upload

📁 Struktur Direktori
text
kelas6/
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── admin.css
│   ├── js/
│   │   ├── script.js
│   │   ├── admin.js
│   │   ├── jadwal.js
│   │   ├── galeri.js
│   │   └── kuis.js
│   ├── image/
│   │   ├── galeri/
│   │   │   ├── foto1.jpg
│   │   │   └── ...
│   │   ├── jadwal/
│   │   │   └── jadwal.jpg
│   │   ├── background.jpg
│   │   └── logo.png
│   ├── font/
│   └── icon/
├── page/
│   ├── admin.html
│   ├── galeri.html
│   ├── jadwal.html
│   ├── kuis.html
│   └── pengumuman.html
├── index.html
└── data.json
🔧 Fitur Utama
1. Homepage
Menu interaktif dengan 4 fitur utama

Pengumuman terbaru

Responsive design

2. Jadwal Pelajaran
Auto-update dari GitHub

Download jadwal

Refresh otomatis setiap 5 menit

3. Galeri Foto
Masonry layout

Lightbox untuk preview

Upload multi-foto via admin

4. Kuis Interaktif
10 soal acak

Timer 30 detik per soal

Leaderboard

5. Admin Panel
Login dengan password

Upload jadwal dan galeri

CRUD pengumuman dan soal kuis

Backup/restore data

🔒 Keamanan
GitHub Token disimpan di localStorage

Validasi input di semua form

Rate limiting untuk API calls

Password admin yang bisa diubah

📱 Responsive Design
Mobile-first approach

Breakpoints: 480px, 768px, 1024px

Navigation toggle untuk mobile

🛠️ Teknologi
HTML5, CSS3, Vanilla JavaScript

GitHub Pages hosting

GitHub API untuk backend

LocalStorage untuk session

🐛 Troubleshooting
Masalah Umum:
Jadwal tidak muncul

Pastikan file jadwal.jpg ada di /assets/image/jadwal/

Cek GitHub Token di admin panel

Upload gagal

Verifikasi GitHub Token memiliki permission "repo"

Cek ukuran file (max 25MB per file)

Website tidak load

Pastikan GitHub Pages aktif

Cek console untuk error

📞 Support
Untuk bantuan teknis, buka issue di repository GitHub.

📄 Lisensi
© 2024 Kelas 6 - Untuk penggunaan edukasi

text

## Cara Penggunaan:

1. **Clone repository** ini ke komputer Anda
2. **Ganti semua placeholder** sesuai kebutuhan:
   - Logo di `assets/image/logo.png`
   - Background di `assets/image/background.jpg`
   - Jadwal awal di `assets/image/jadwal/jadwal.jpg`
   - Foto galeri di `assets/image/galeri/`
   - Data awal di `data.json`

3. **Deploy ke GitHub Pages** seperti yang dijelaskan di README.md

4. **Untuk admin:**
   - Login dengan password: `kelas6admin123`
   - Buat GitHub Token dengan permission "repo"
   - Gunakan admin panel untuk upload konten

Website ini sudah lengkap dengan semua fitur yang diminta:
- ✅ Integrasi GitHub API
- ✅ Auto-update jadwal
- ✅ Galeri dengan lazy loading
- ✅ Kuis interaktif dengan leaderboard
- ✅ Admin panel untuk manajemen konten
- ✅ Responsive design
- ✅ PWA features (optional)

Semua kode sudah dioptimalkan dan siap digunakan!