# DEVLOG SIPALA — catatan serah-terima

> Baca file ini PERTAMA saat melanjutkan pengembangan di sesi baru. Perbarui bagian "Status" setiap selesai satu tahap.

## Status (25 Nov 2026)
Tahap 1 — **Audit & perbaikan logika: SELESAI** (diterapkan ke sipala_1.zip = commit 116c1ed) (belum di-commit, belum di-deploy ke Apps Script).
Tahap 2 — Modernisasi UI/UX: BELUM DIMULAI (lihat Backlog).

## Arsitektur singkat
GAS web app + Vue 3 (CDN, template string per halaman) + Tailwind CDN + Google Sheets sebagai DB.
`Index.html` memuat semua `Page_*.html` lewat `include()`, tiap halaman = satu objek komponen global (`const PageXxx`),
didaftarkan manual di blok `app.component(...)` di Index.html. Halaman dicache `<keep-alive>`.
Sheet DB: `LOG_MOOD`, `DOKUMENTASI`, `DAFTAR_SPBY` (salinan dari MASTER_SPBY eksternal), `LINK_APLIKASI`, `PENGGUNA` (kosong).
Konvensi: fungsi backend berakhiran `_` = privat (tidak terpanggil dari browser); semua respons `{status, message|data}`.
Mengirim `Date` lewat google.script.run membuat respons jadi `null` → selalu lewatkan `normalizeCell_`.

## Yang sudah diperbaiki (Tahap 1)
| # | Masalah | Dampak sebelumnya | Perbaikan |
|---|---------|-------------------|-----------|
| 1 | `Page_Monitoring_Kegiatan.html` kosong, tapi `PageMonitoringKegiatan` didaftarkan di Index | `ReferenceError` → **seluruh aplikasi blank** | Diisi komponen placeholder |
| 2 | `MoodService.gs` kosong; Beranda memanggil `getDailyMoodSummary` & `submitMood` | Mood Tracker tidak berfungsi | Diimplementasi (WIB, validasi, persen total=100, tie-break) |
| 3 | Header pajak SPBY memuat spasi ganda (`PPh21      411121`) tapi dicocokkan dengan `pph21 411121` | PPN/PPh21/22/23/Final di Detail **selalu Rp0** | `normalizeHeader_` melebur spasi |
| 4 | `Date` dari Sheet ikut dikirim ke browser | Respons `null` → halaman error | `normalizeCell_` → teks "12 Oktober 2026" |
| 5 | Tanggal/Tahun Dokumentasi campur teks (`"07"`) & angka; select form memakai angka | Edit 157 baris lama: dropdown kosong + `required` → **tidak bisa disimpan** | Disamakan jadi angka di server |
| 6 | VPN Link disimpan teks `"false"`, select memakai boolean | Edit link: dropdown VPN kosong, tak bisa disimpan | Server selalu kirim boolean |
| 7 | Halaman aktif tidak ikut turun saat data menyusut | Hapus item terakhir di hal. terakhir / sinkron → tabel kosong | `watch(totalPages)` di 3 halaman |
| 8 | `rowIndex` = nomor baris; bergeser bila ada pengguna lain tambah/hapus | Bisa **menghapus/menimpa baris yang salah** | Signature baris dicek server + `LockService` |
| 9 | Status bayar: `'belum lunas'.includes('lunas')` → hijau; label mentah "true/false" | Status menyesatkan | Boolean + label "Sudah/Belum Dibayar" |
| 10 | Sinkron: `clear()` dulu baru tulis; sumber kosong tidak mengosongkan salinan | Data hilang bila gagal di tengah; data basi | Tulis dulu, bersihkan sisanya; sumber kosong → kosongkan |
| 11 | `parseFloat("1.500.000")` = 1.5 | Nominal salah bila sel berformat teks Indonesia | `parseIdNumber_` |
| 12 | Link bebas skema (`javascript:` lolos `type=url`); teks berawalan `=` jadi rumus | XSS/formula injection (aplikasi tanpa login) | Validasi http(s) + `sanitizeCell_` |
| 13 | 31 Februari bisa disimpan | Tanggal tidak valid | Validasi hari per bulan/tahun |
| 14 | Jam header pakai zona perangkat tapi berlabel "WIB" | Salah di perangkat luar WIB | `timeZone: 'Asia/Jakarta'` |
| 15 | Moodbooster menampilkan "semangat (0%)" saat belum ada suara | Informasi menyesatkan | "Belum ada suara" |
| 16 | Vue `@3` tanpa pin + build dev | Rawan berubah sendiri, lebih lambat | Pin `3.5.13` build prod |
| 17 | Beranda hanya memuat mood saat pertama dibuka (keep-alive) | Data basi | `onActivated` |

| 18 | Kode memakai sheet `'log_mood'` sedangkan xlsx `LOG_MOOD` (getSheetByName peka huruf) | Mood bisa membuat sheet baru / gagal baca data lama | `findSheet_()` tanpa peduli huruf |
| 19 | Teks `*real-time*` tampil dengan tanda bintang di SPM Spider & Monitoring Kegiatan | Kosmetik | `<em>` |

Diuji: sintaks semua JS + 22 pengecekan logika backend dengan stub Apps Script memakai data asli `SIPALA.xlsx` (semua lulus).
**Belum diuji**: render di browser / deploy nyata di Apps Script (tidak bisa dijalankan dari sini).

## Langkah deploy & uji manual (urut)
1. `clasp pull` dulu (repo ini tidak memuat `appsscript.json`; jangan timpa manifest di cloud), lalu salin file hasil perbaikan, `clasp push`.
2. Apps Script → Deploy → Manage deployments → edit → **New version** → Deploy.
3. Cek manual: Beranda (kirim mood, angka berubah) · Anggaran → Detail (PPh tidak 0) · Dokumentasi: Edit baris lama (dropdown tanggal terisi), Tambah, Hapus di halaman terakhir · Arsip Link: Edit (VPN terisi).
4. Jika script **standalone** (bukan terikat Sheet): isi Script Property `SPREADSHEET_ID`.

## Pertanyaan terbuka untuk pemilik sistem
1. **Kolom DAFTAR_SPBY tampak bergeser** di snapshot xlsx: kolom `No. SPBy` kosong, sedangkan `00514` ada di bawah header `Program`, dan kode `054.01.WA` di bawah `Aktifitas`. Cek sheet MASTER_SPBY eksternal: apakah header & data sejajar? Parser sengaja belum diubah karena sumbernya tidak terlihat.
2. Kolom `Tanggal SPBy` berisi `Lama`/`lama` (6 baris) — disengaja? (hanya ditampilkan apa adanya).
3. `SIPALA.xlsx` (nama vendor/penerima, log mood) dan ID spreadsheet/folder Drive ikut ter-commit. Jika repo GitHub **publik**, pertimbangkan: hapus dari repo (`git rm --cached`), pindahkan ID ke Script Properties.

## Backlog Tahap 2 (urut prioritas, kerjakan satu per sesi)
1. Struktur: pecah komponen berulang (tabel + pagination + modal hapus + toast disalin 3x) jadi komponen/composable bersama.
2. State & UX: skeleton loading, toast global menggantikan `alert()` di Anggaran, empty-state, validasi form inline, dark mode.
3. Performa: cache hasil `google.script.run` (CacheService / stale-while-revalidate), sinkron SPBY terjadwal (time trigger) alih-alih tombol manual.
4. Ganti Tailwind CDN dengan CSS terkompilasi; font & ikon konsisten (satu set ikon).
5. Halaman kosong: Monitoring Kegiatan, Monitoring Kinerja (dinonaktifkan di sidebar).
6. Hapus `Page_Administrasi.html` (tidak dipakai) atau gunakan.
7. Saat autentikasi dibutuhkan: Session.getActiveUser + sheet PENGGUNA (sudah ada kolom NO/NAMA/EMAIL/STATUS).

## Cara melanjutkan di chat baru
Unggah ZIP proyek terbaru + sebut: "Lanjutkan dari DEVLOG.md, kerjakan Backlog nomor N". Perbarui tabel Status di atas setelah tiap tahap.
