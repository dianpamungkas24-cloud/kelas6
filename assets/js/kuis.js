let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 30;
let quizData = [];
let userAnswers = [];

// Konfigurasi GitHub
const GITHUB_USER = 'dianpamungkas24-cloud';
const GITHUB_REPO = 'kelas6';
const GITHUB_BRANCH = 'main';
const DATA_PATH = 'data.json';

// Fungsi untuk memulai kuis
async function startQuiz() {
    try {
        // Reset state
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];
        
        // Load data dari GitHub
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${DATA_PATH}`);
        const data = await response.json();
        
        if (!data.kuis || data.kuis.length === 0) {
            alert('Belum ada soal kuis. Admin dapat menambah soal melalui panel admin.');
            return;
        }
        
        // Acak urutan soal
        quizData = [...data.kuis].sort(() => Math.random() - 0.5).slice(0, 10);
        
        // Tampilkan container kuis
        document.getElementById('quiz-container').style.display = 'block';
        document.getElementById('result-container').style.display = 'none';
        
        // Reset timer
        timeLeft = 30;
        updateTimerDisplay();
        
        // Tampilkan soal pertama
        showQuestion();
        
        // Update tampilan tombol
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Gagal memuat soal kuis. Silakan coba lagi.');
    }
}

// Fungsi untuk menampilkan soal
function showQuestion() {
    if (currentQuestionIndex >= quizData.length) {
        showResults();
        return;
    }
    
    const question = quizData[currentQuestionIndex];
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    
    // Update progress
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = quizData.length;
    
    // Tampilkan pertanyaan
    questionElement.textContent = question.pertanyaan;
    
    // Tampilkan pilihan jawaban
    optionsElement.innerHTML = '';
    question.pilihan.forEach((pilihan, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = pilihan;
        optionDiv.onclick = () => selectAnswer(index);
        optionsElement.appendChild(optionDiv);
    });
    
    // Reset seleksi jawaban
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Reset timer
    clearInterval(timer);
    timeLeft = 30;
    updateTimerDisplay();
    
    // Mulai timer
    timer = setInterval(updateTimer, 1000);
}

// Fungsi untuk memilih jawaban
function selectAnswer(selectedIndex) {
    const options = document.querySelectorAll('.option');
    
    // Hapus seleksi sebelumnya
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Tambah seleksi baru
    options[selectedIndex].classList.add('selected');
    
    // Simpan jawaban user
    userAnswers[currentQuestionIndex] = selectedIndex;
}

// Fungsi untuk update timer
function updateTimer() {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
        clearInterval(timer);
        nextQuestion();
    }
}

// Fungsi untuk update display timer
function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = timeLeft;
        
        // Ubah warna timer berdasarkan waktu
        if (timeLeft <= 10) {
            timerElement.style.color = '#e74c3c';
        } else if (timeLeft <= 20) {
            timerElement.style.color = '#f39c12';
        } else {
            timerElement.style.color = '#27ae60';
        }
    }
}

// Fungsi untuk lanjut ke soal berikutnya
function nextQuestion() {
    clearInterval(timer);
    
    // Hitung skor jika user sudah memilih jawaban
    if (userAnswers[currentQuestionIndex] !== undefined) {
        const correctAnswer = quizData[currentQuestionIndex].jawaban;
        if (userAnswers[currentQuestionIndex] === correctAnswer) {
            score += 10;
        }
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < quizData.length) {
        showQuestion();
    } else {
        showResults();
    }
}

// Fungsi untuk menampilkan hasil
function showResults() {
    clearInterval(timer);
    
    // Hitung skor akhir
    const finalScore = (score / (quizData.length * 10)) * 100;
    
    // Tampilkan hasil
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';
    document.getElementById('final-score').textContent = Math.round(finalScore);
    
    // Tampilkan pesan berdasarkan skor
    const messageElement = document.getElementById('result-message');
    if (finalScore >= 80) {
        messageElement.textContent = 'Luar biasa! Kamu benar-benar memahami materi! 🎉';
    } else if (finalScore >= 60) {
        messageElement.textContent = 'Bagus! Kamu sudah memahami sebagian besar materi. 👍';
    } else {
        messageElement.textContent = 'Jangan menyerah! Pelajari lagi materinya dan coba lagi. 💪';
    }
    
    // Simpan ke leaderboard
    saveToLeaderboard(finalScore);
    
    // Load leaderboard
    loadLeaderboard();
}

// Fungsi untuk menyimpan ke leaderboard
async function saveToLeaderboard(score) {
    const nama = prompt('Masukkan nama untuk leaderboard:') || 'Anonim';
    
    try {
        // Load data yang sudah ada
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${DATA_PATH}`);
        const data = await response.json();
        
        // Tambah entry baru
        const newEntry = {
            nama: nama.substring(0, 20),
            skor: Math.round(score),
            tanggal: new Date().toISOString().split('T')[0]
        };
        
        if (!data.leaderboard) {
            data.leaderboard = [];
        }
        
        data.leaderboard.push(newEntry);
        
        // Urutkan berdasarkan skor (descending)
        data.leaderboard.sort((a, b) => b.skor - a.skor);
        
        // Simpan hanya 10 teratas
        data.leaderboard = data.leaderboard.slice(0, 10);
        
        // Save back to GitHub (jika ada token admin)
        const token = localStorage.getItem('github_token');
        if (token) {
            await saveToGitHub(DATA_PATH, data, `Update leaderboard - ${new Date().toLocaleString()}`);
        }
        
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
    }
}

// Fungsi untuk load leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${DATA_PATH}`);
        const data = await response.json();
        
        const leaderboardBody = document.getElementById('leaderboard-body');
        if (!leaderboardBody) return;
        
        if (!data.leaderboard || data.leaderboard.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada data leaderboard</td></tr>';
            return;
        }
        
        const html = data.leaderboard.map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.nama}</td>
                <td>${entry.skor}</td>
                <td>${entry.tanggal}</td>
            </tr>
        `).join('');
        
        leaderboardBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Fungsi untuk save to GitHub (reuse from script.js)
async function saveToGitHub(path, data, message) {
    const token = localStorage.getItem('github_token');
    if (!token) return false;
    
    try {
        // 1. Get current file SHA
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
        
        return updateResponse.ok;
    } catch (error) {
        console.error('Error saving to GitHub:', error);
        return false;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load leaderboard saat halaman dimuat
    loadLeaderboard();
    
    // Tambah event listeners untuk tombol
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', startQuiz);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
    }
    
    // Tambah keyboard support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.getElementById('quiz-container').style.display !== 'none') {
            nextQuestion();
        }
        
        // Pilih jawaban dengan angka 1-4
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            const options = document.querySelectorAll('.option');
            if (index < options.length) {
                selectAnswer(index);
            }
        }
    });
});