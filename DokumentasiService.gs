/**
 * Service Backend khusus untuk Pengelolaan Dokumentasi SIPALA
 * Sheet DOKUMENTASI: TANGGAL | BULAN | TAHUN | DESKRIPSI | LINK_DOKUMENTASI | KETERANGAN | TAGS
 */

var SHEET_DOKUMENTASI = 'DOKUMENTASI';

function getDokumentasiData() {
  try {
    var sheet = getDb_().getSheetByName(SHEET_DOKUMENTASI);
    if (!sheet) {
      return { status: false, message: "Sheet 'DOKUMENTASI' tidak ditemukan. Pastikan tab sheet sudah dibuat." };
    }
    var rows = readTable_(sheet).rows.map(function (obj) {
      // Data lama bercampur teks ("07", "2022") dan angka -> seragamkan jadi angka
      obj.tanggal = toIntIfNumeric_(obj.tanggal);
      obj.tahun = toIntIfNumeric_(obj.tahun);
      return obj;
    });
    return { status: true, data: rows };
  } catch (error) {
    return { status: false, message: "Error getDokumentasiData: " + error.message };
  }
}

function saveDokumentasi(formData) {
  try {
    formData = formData || {};
    var tanggal = Number(formData.tanggal);
    var bulan = String(formData.bulan || '').trim();
    var tahun = Number(formData.tahun);
    var deskripsi = String(formData.deskripsi || '').trim();
    var link = String(formData.link_dokumentasi || formData.link || '').trim();
    var keterangan = String(formData.keterangan || '').trim();
    var tags = String(formData.tags || '').trim();
    var rowIndex = formData.rowIndex === undefined || formData.rowIndex === null ? '' : formData.rowIndex;

    if (!tanggal || !bulan || !tahun || !deskripsi || !link) {
      return { status: false, message: "Field Tanggal, Bulan, Tahun, Deskripsi, dan Link Dokumentasi wajib diisi!" };
    }
    var bulanIdx = BULAN_ID.indexOf(bulan);
    if (bulanIdx === -1) return { status: false, message: "Bulan tidak valid." };
    if (tahun < 2000 || tahun > 2100) return { status: false, message: "Tahun tidak valid." };
    var hariMaks = new Date(tahun, bulanIdx + 1, 0).getDate();
    if (tanggal < 1 || tanggal > hariMaks || tanggal % 1 !== 0) {
      return { status: false, message: "Tanggal tidak valid: " + bulan + " " + tahun + " hanya punya " + hariMaks + " hari." };
    }
    if (!isSafeUrl_(link)) {
      return { status: false, message: "Link Dokumentasi harus diawali http:// atau https://" };
    }

    var values = {
      'tanggal': tanggal,
      'bulan': bulan,
      'tahun': tahun,
      'deskripsi': sanitizeCell_(deskripsi),
      'link_dokumentasi': link,
      'keterangan': sanitizeCell_(keterangan),
      'tags': sanitizeCell_(tags)
    };

    return withLock_(function () {
      var sheet = getDb_().getSheetByName(SHEET_DOKUMENTASI);
      if (!sheet) return { status: false, message: "Sheet 'DOKUMENTASI' tidak ditemukan." };

      var lastCol = sheet.getLastColumn();
      if (lastCol === 0) return { status: false, message: "Header sheet 'DOKUMENTASI' belum diatur." };
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizeHeader_);

      if (rowIndex !== '' && Number(rowIndex) > 1) {
        // === EDIT ===
        var rIndex = Number(rowIndex);
        if (rIndex > sheet.getLastRow()) {
          return { status: false, message: "Data sudah tidak ada. Muat ulang halaman." };
        }
        var current = sheet.getRange(rIndex, 1, 1, lastCol).getValues()[0];
        if (!rowStillMatches_(current, headers, formData._orig, 'deskripsi', 'link_dokumentasi')) {
          return { status: false, message: "Data ini sudah diubah/dihapus pengguna lain. Muat ulang lalu coba lagi." };
        }
        var merged = headers.map(function (key, i) {
          return values.hasOwnProperty(key) ? values[key] : current[i];
        });
        sheet.getRange(rIndex, 1, 1, merged.length).setValues([merged]);
        return { status: true, message: "Data dokumentasi berhasil diperbarui!" };
      }

      // === TAMBAH ===
      var newRow = headers.map(function (key) { return values.hasOwnProperty(key) ? values[key] : ''; });
      sheet.appendRow(newRow);
      return { status: true, message: "Data dokumentasi berhasil ditambahkan!" };
    });
  } catch (error) {
    return { status: false, message: "Error saveDokumentasi: " + error.message };
  }
}

/** expected (opsional) = { deskripsi, link_dokumentasi } saat data dimuat; dipakai untuk mencegah hapus baris yang salah. */
function deleteDokumentasi(rowIndex, expected) {
  try {
    return withLock_(function () {
      var sheet = getDb_().getSheetByName(SHEET_DOKUMENTASI);
      if (!sheet) return { status: false, message: "Sheet 'DOKUMENTASI' tidak ditemukan." };
      var r = Number(rowIndex);
      if (!(r > 1) || r > sheet.getLastRow()) {
        return { status: false, message: "Data sudah tidak ada. Muat ulang halaman." };
      }
      var lastCol = sheet.getLastColumn();
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizeHeader_);
      var current = sheet.getRange(r, 1, 1, lastCol).getValues()[0];
      if (!rowStillMatches_(current, headers, expected, 'deskripsi', 'link_dokumentasi')) {
        return { status: false, message: "Data ini sudah diubah/dihapus pengguna lain. Muat ulang lalu coba lagi." };
      }
      sheet.deleteRow(r);
      return { status: true, message: "Data dokumentasi berhasil dihapus!" };
    });
  } catch (error) {
    return { status: false, message: "Error deleteDokumentasi: " + error.message };
  }
}

/** Pastikan baris di sheet masih baris yang dilihat pengguna (nomor baris bergeser bila ada yang menambah/menghapus). */
function rowStillMatches_(rowValues, headers, expected, keyA, keyB) {
  if (!expected) return true; // klien lama tanpa signature
  var get = function (key) {
    var i = headers.indexOf(key);
    return i === -1 ? '' : String(normalizeCell_(rowValues[i])).trim();
  };
  var clean = function (s) { return String(s || '').replace(/^'/, '').trim(); };
  return get(keyA) === clean(expected[keyA]) && get(keyB) === clean(expected[keyB]);
}
