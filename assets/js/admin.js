// ===============================
// ADMIN PENGUMUMAN - FULL JS
// ===============================

// Ambil elemen
const btnTambah = document.getElementById("btnTambah");
const form = document.getElementById("formPengumuman");
const tabel = document.getElementById("tabelPengumuman");

// Ambil data dari localStorage
let pengumuman = JSON.parse(localStorage.getItem("pengumuman")) || [];

// ===============================
// TAMPILKAN DATA KE TABEL
// ===============================
function renderTabel() {
  tabel.innerHTML = "";

  pengumuman.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.judul}</td>
      <td>${item.tanggal}</td>
      <td>${item.kategori}</td>
      <td>
        <button class="btn-edit" onclick="editPengumuman(${index})">Edit</button>
        <button class="btn-hapus" onclick="hapusPengumuman(${index})">Hapus</button>
      </td>
    `;

    tabel.appendChild(tr);
  });
}

// ===============================
// TOMBOL TAMBAH
// ===============================
btnTambah.addEventListener("click", () => {
  form.style.display = "block";
});

// ===============================
// SIMPAN DATA BARU
// ===============================
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const judul = document.getElementById("judul").value;
  const tanggal = document.getElementById("tanggal").value;
  const kategori = document.getElementById("kategori").value;

  const dataBaru = {
    id: Date.now(), // ID otomatis
    judul,
    tanggal: formatTanggal(tanggal),
    kategori
  };

  pengumuman.unshift(dataBaru); // tampil paling atas
  localStorage.setItem("pengumuman", JSON.stringify(pengumuman));

  form.reset();
  form.style.display = "none";

  renderTabel();
});

// ===============================
// HAPUS DATA
// ===============================
function hapusPengumuman(index) {
  if (confirm("Yakin ingin menghapus pengumuman ini?")) {
    pengumuman.splice(index, 1);
    localStorage.setItem("pengumuman", JSON.stringify(pengumuman));
    renderTabel();
  }
}

// ===============================
// EDIT DATA (sederhana)
// ===============================
function editPengumuman(index) {
  const item = pengumuman[index];

  document.getElementById("judul").value = item.judul;
  document.getElementById("tanggal").value = balikTanggal(item.tanggal);
  document.getElementById("kategori").value = item.kategori;

  form.style.display = "block";

  // Hapus lama, nanti disimpan ulang
  pengumuman.splice(index, 1);
  localStorage.setItem("pengumuman", JSON.stringify(pengumuman));
  renderTabel();
}

// ===============================
// FORMAT TANGGAL
// ===============================
function formatTanggal(tgl) {
  const d = new Date(tgl);
  return d.toLocaleDateString("id-ID");
}

function balikTanggal(tgl) {
  const [day, month, year] = tgl.split("/");
  return `${year}-${month}-${day}`;
}

// ===============================
// LOAD PERTAMA KALI
// ===============================
renderTabel();
