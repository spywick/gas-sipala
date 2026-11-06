# 📊 Dashboard SIPALA

> **Sistem Informasi Pengelolaan Administrasi, Laporan, dan Anggaran (SIPALA)**  
> Berbasis **Google Apps Script (GAS)**, **Vue.js 3**, dan **Tailwind CSS**.

Dashboard SIPALA adalah aplikasi internal berbasis web yang dirancang khusus untuk mempermudah pengelolaan kegiatan, administrasi perkantoran, anggaran, monitoring kinerja, dan dokumentasi di lingkungan **BPS Kabupaten Aceh Barat Daya**. Aplikasi ini merupakan pembaruan dan penyempurnaan modern dari versi terdahulu dengan adopsi arsitektur modular yang ringan, responsif, dan tanpa proses *build* yang rumit.

---

## 🚀 Fitur Utama

- **Navigasi & Layout Responsif:** Sidebar modular yang mendukung *collapsible submenu* (Administrasi) serta otomatis menyesuaikan tampilan pada perangkat *desktop* maupun *mobile*.
- **Jam Digital Real-time & Footer Dinamis:** Menampilkan penunjuk waktu Indonesia Barat (WIB) secara presisi serta informasi hak cipta terintegrasi.
- **Kartu Sambutan & Informasi Versi Sistem:** Pengumuman pembaruan sistem yang dilengkapi tautan langsung ke portal SIPALA versi terdahulu.
- **Modal Popup "Tentang Aplikasi":** Menyajikan informasi latar belakang pembuatan aplikasi, teknologi yang digunakan, dan kontak pengembang utama.
- ** Tracker Suasana Hati Pegawai (Daily Mood Tracker):**
  - Input ekspresi perasaan pegawai secara anonim dengan 5 pilihan mood (*Semangat, Senang, Biasa Aja, Sedih, Marah*).
  - Validasi pesan anonim/curhat minimum 3 kata secara *real-time*.
  - Kalkulasi persentase dan statistik mood harian yang terhubung langsung dengan database.
  - *Pojok Curhat & Pesan Tim* dengan batas scroll vertikal yang rapi.
- **Menu Administrasi (Submenu):**
  - **Nomor Surat:** Pencatatan dan pengelolaan penomoran surat keluar instansi.
  - **SPM Spider:** Pemantauan dan pengelolaan administrasi SPM.
- **Menu Anggaran & Modul Eksternal:** Akses cepat ke tautan modul penting pengelolaan anggaran instansi.
- **Menu Dokumentasi:** Pengelolaan arsip foto, dokumentasi kegiatan, dan laporan berkas instansi.
- **Arsip Link Aplikasi:** Direktori tautan cepat ke berbagai aplikasi internal dan eksternal BPS.
- **Monitoring Kegiatan & Kinerja:** Pemantauan progres kegiatan operasional dan capaian kinerja pegawai secara real-time.

---

## 🛠️ Arsitektur & Teknologi

Aplikasi ini dibangun menggunakan kombinasi *stack* gratis dan efisien tanpa memerlukan server berbayar maupun proses *build* (seperti Webpack/Vite):

- **Backend / Server-side:** [Google Apps Script (GAS)](https://developers.google.com/apps-script)
  - Menangani fungsi `doGet`, penyertaan file HTML modular via helper `include()`, serta interaksi database.
- **Frontend / Client-side:** [Vue.js 3 (via CDN)](https://vuejs.org/)
  - Menggunakan Composition API (`createApp`, `ref`, `computed`, `onMounted`) untuk reaktivitas komponen dan *state management*.
- **Styling UI:** [Tailwind CSS (via CDN)](https://tailwindcss.com/)
  - *Utility-first CSS framework* untuk antarmuka yang bersih, modern, dan responsif.
- **Database:** Google Spreadsheet
  - Penyimpanan data utama yang fleksibel, kolaboratif, dan mudah diakses.

---

## 📂 Struktur Proyek

Proyek dikembangkan secara modular agar setiap halaman dan komponen mudah dipelihara secara terpisah:

```text
GAS-SIPALA/
├── Code.gs                          # Backend utama (doGet, include, getData, Mood Service, dll.)
├── Index.html                       # Frontend utama (Struktur layout, Vue 3 mount, & Tailwind)
├── Sidebar.html                     # Komponen menu navigasi samping (dengan dropdown submenu)
├── Page_Beranda.html                # Halaman Beranda (Sambutan, Mood Tracker, Modal Info)
├── Page_Anggaran.html               # Halaman Pengelolaan & Menu Anggaran
├── Page_Nomor_Surat.html            # Submenu Administrasi: Manajemen Nomor Surat
├── Page_Spm_Spider.html             # Submenu Administrasi: SPM Spider
├── Page_Dokumentasi.html            # Halaman Arsip Dokumentasi & Laporan Kegiatan
├── Page_Arsip_Link.html             # Halaman Direktori Link Aplikasi BPS
├── Page_Monitoring_Kegiatan.html    # Halaman Monitoring Progres Kegiatan Operasional
├── Page_Monitoring_Kinerja.html     # Halaman Monitoring Capaian Kinerja Pegawai
├── Page_Lainnya.html                # Halaman Fitur/Menu Pendukung Lainnya
└── README.md                        # Dokumentasi resmi proyek
```

---

## ⚙️ Pengembangan Lokal & Sinkronisasi Git/Clasp

Untuk melakukan pembaruan kode secara lokal di komputer Anda dan melakukan *push* ke GitHub serta Google Apps Script:

### 1. Persiapan Clasp (Google Apps Script CLI)
Pastikan **Node.js** sudah terinstal di komputer Anda, lalu jalankan perintah berikut:

```bash
# Instal Clasp secara global
npm install @google/clasp -g

# Login ke akun Google Anda
clasp login
```

### 2. Workflow Pengembangan (Lokal <-> Cloud Apps Script)
- **Mengambil kode terbaru dari Apps Script ke Lokal:**
  ```bash
  clasp pull
  ```
- **Mengirim perubahan kode dari Lokal ke Apps Script:**
  ```bash
  clasp push
  ```

### 3. Workflow Commit & Push ke GitHub
Setiap kali selesai melakukan modifikasi di lokal, simpan riwayat perubahan ke GitHub:

```bash
# Cek status file
git status

# Tambahkan perubahan ke staging
git add .

# Buat commit
git commit -m "feat: pembaruan fitur pada Dashboard SIPALA"

# Upload/Push kode ke repository GitHub
git push -u origin main
```

---

## 👤 Pengembang Utama

* **Al Munzir** — *Tim TI BPS Kabupaten Aceh Barat Daya*  
  📧 Email: [almunzir2@gmail.com](mailto:almunzir2@gmail.com)

---

## 📄 Hak Cipta & Lisensi

Copyright &copy; 2026 **Dashboard SIPALA - BPS Kabupaten Aceh Barat Daya**.  
Dashboard ini dikembangkan secara internal. Pengembangan lanjutan atau penyalinan kode oleh pihak lain diperbolehkan dengan tetap menyantumkan rujukan serta izin dari pengembang utama.