# 📊 Dashboard SIPALA

> Sistem Informasi Pengelolaan Administrasi, Laporan, dan Anggaran (SIPALA) berbasis **Google Apps Script** dan **Vue.js**.

Dashboard SIPALA adalah aplikasi berbasis web internal yang dirancang khusus untuk membantu pengelolaan kegiatan, administrasi, anggaran, dan dokumentasi di lingkungan **BPS Kabupaten Aceh Barat Daya**. Aplikasi ini merupakan pengembangan modern dari versi sebelumnya, dengan mengadopsi arsitektur modular yang lebih responsif dan interaktif.

---

## 🚀 Fitur Utama

- **Sidebar Navigasi Responsif:** Menu yang terorganisir dengan baik, mendukung tampilan *mobile* maupun *desktop*.
- **Manajemen Beranda:** Dilengkapi dengan informasi ringkas, *embed* Looker Studio, serta fitur informasi tentang versi aplikasi.
- **Menu Anggaran & Modul Eksternal:** Akses cepat ke tautan modul penting untuk pengelolaan anggaran.
- **Administrasi (Nomor Surat & SPM Spider):** Pencatatan dan pemantauan data administrasi perkantoran.
- **Dokumentasi & Arsip Link:** Penyimpanan dan akses cepat terhadap tautan serta dokumen penting instansi.
- **Monitoring Kegiatan & Kinerja:** Pemantauan progres kegiatan serta capaian kinerja organik.

---

## 🛠️ Teknologi yang Digunakan

Proyek ini sengaja dibangun menggunakan *tools* yang ringan, fleksibel, dan tanpa proses *build* yang rumit agar mudah dipelajari serta dikembangkan:
- **Backend:** [Google Apps Script (GAS)](https://developers.google.com/apps-script) - Menangani logika server-side dan berinteraksi langsung dengan Google Sheets.
- **Frontend Framework:** [Vue.js 3 (via CDN)](https://vuejs.org/) - Memberikan reaktivitas dan arsitektur berbasis komponen.
- **Styling:** [Tailwind CSS (via CDN)](https://tailwindcss.com/) - Kerangka kerja CSS untuk desain antarmuka yang modern dan rapi.
- **Database:** Google Spreadsheet - Penyimpanan data yang fleksibel dan kolaboratif.

---

## 📂 Struktur Proyek

```text
GAS-SIPALA/
├── Code.gs                 # Backend utama (fungsi doGet, include, dll.)
├── MitraService.gs         # Backend service untuk data mitra (opsional/modular)
├── Index.html              # Frontend utama (Struktur kerangka, Vue 3, & Tailwind)
├── Sidebar.html            # Komponen menu navigasi samping
├── Page_Beranda.html       # Halaman Beranda
├── Page_Anggaran.html      # Halaman Anggaran
├── Page_Nomor_Surat.html   # Halaman Manajemen Nomor Surat
├── Page_Spm_Spider.html    # Halaman SPM Spider
├── Page_Dokumentasi.html   # Halaman Dokumentasi
├── Page_Arsip_Link.html    # Halaman Arsip Link Aplikasi
├── Page_Monitoring_Kegiatan.html # Halaman Monitoring Kegiatan
├── Page_Monitoring_Kinerja.html  # Halaman Monitoring Kinerja
└── Page_Lainnya.html       # Halaman Lainnya