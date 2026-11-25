/**
 * Helper bersama untuk semua Service SIPALA.
 * Fungsi berakhiran "_" bersifat privat: tidak bisa dipanggil dari browser (google.script.run).
 */

var TZ = 'Asia/Jakarta';
var BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/**
 * Mengambil Spreadsheet database.
 * Container-bound -> getActiveSpreadsheet(). Jika script standalone (null), isi
 * Script Property "SPREADSHEET_ID" (Project Settings > Script Properties).
 */
function getDb_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error("Spreadsheet database tidak ditemukan. Isi Script Property 'SPREADSHEET_ID'.");
  return SpreadsheetApp.openById(id);
}

/** Cari sheet tanpa peduli huruf besar/kecil ('log_mood' = 'LOG_MOOD'). Mengembalikan null jika tidak ada. */
function findSheet_(ss, name) {
  var target = String(name).toLowerCase();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase() === target) return sheets[i];
  }
  return null;
}

/** Header sheet -> kunci seragam: spasi berulang dilebur, trim, huruf kecil. */
function normalizeHeader_(h) {
  return String(h === null || h === undefined ? '' : h).replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Objek Date TIDAK bisa dikirim ke browser lewat google.script.run
 * (seluruh respons menjadi null). Ubah ke teks "12 Oktober 2026".
 */
function normalizeCell_(v) {
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    return Number(Utilities.formatDate(v, TZ, 'd')) + ' ' +
      BULAN_ID[Number(Utilities.formatDate(v, TZ, 'M')) - 1] + ' ' +
      Utilities.formatDate(v, TZ, 'yyyy');
  }
  return v;
}

/** "07", "2022", 2022.0 -> angka. Selain itu dibiarkan apa adanya. */
function toIntIfNumeric_(v) {
  if (typeof v === 'number') return v;
  var s = String(v === null || v === undefined ? '' : v).trim();
  return /^\d+(\.0+)?$/.test(s) ? Number(s) : v;
}

/** Angka format Indonesia: "Rp 1.500.000,50" -> 1500000.5 ; "1.500.000" -> 1500000 */
function parseIdNumber_(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  var s = String(val === null || val === undefined ? '' : val).replace(/rp|\s/gi, '');
  if (s === '') return 0;
  if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  } else if (s.indexOf(',') !== -1) {
    s = s.replace(',', '.');
  }
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/** Cegah formula injection: teks yang diawali = + @ (atau -teks) akan dieksekusi Sheets sebagai rumus. */
function sanitizeCell_(v) {
  if (typeof v !== 'string') return v;
  var s = v.trim();
  return (/^[=+@]/.test(s) || /^-\S/.test(s)) ? "'" + s : s;
}

function isSafeUrl_(u) {
  return /^https?:\/\/[^\s]+$/i.test(String(u || '').trim());
}

/** Satu penulis pada satu waktu agar rowIndex dan appendRow tidak saling timpa. */
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { status: false, message: 'Sistem sedang sibuk, silakan coba lagi sebentar lagi.' };
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Membaca sheet bertabel -> { headers: [kunci seragam], rows: [{rowIndex, ...kolom}] }.
 * Baris kosong dilewati (rowIndex tetap nomor baris asli di sheet).
 */
function readTable_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return { headers: [], rows: [] };
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0].map(normalizeHeader_);
  var rows = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var empty = row.every(function (c) { return c === '' || c === null; });
    if (empty) continue;
    var obj = { rowIndex: r + 1 };
    for (var c = 0; c < headers.length; c++) {
      if (headers[c]) obj[headers[c]] = normalizeCell_(row[c] === undefined ? '' : row[c]);
    }
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}
