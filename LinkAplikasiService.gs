/**
 * Service Backend khusus untuk Pengelolaan Link Aplikasi
 * Sheet LINK_APLIKASI: TAHUN | NAMA | LINK | KATEGORI | VPN | DESKRIPSI | KETERANGAN
 */

var SHEET_LINK = 'LINK_APLIKASI';

function getLinkAplikasiData() {
  try {
    var sheet = getDb_().getSheetByName(SHEET_LINK);
    if (!sheet) return { status: false, message: "Sheet 'LINK_APLIKASI' tidak ditemukan." };

    var rows = readTable_(sheet).rows.map(function (obj) {
      obj.tahun = toIntIfNumeric_(obj.tahun);
      // Sheet bisa menyimpan teks "false"/"true" atau boolean -> selalu boolean ke browser
      obj.vpn = obj.vpn === true || String(obj.vpn).trim().toLowerCase() === 'true';
      return obj;
    });
    return { status: true, data: rows };
  } catch (error) {
    return { status: false, message: "Error getLinkAplikasiData: " + error.message };
  }
}

function saveLinkAplikasi(formData) {
  try {
    formData = formData || {};
    var tahun = Number(formData.tahun);
    var nama = String(formData.nama || '').trim();
    var link = String(formData.link || '').trim();
    var deskripsi = String(formData.deskripsi || '').trim();
    var keterangan = String(formData.keterangan || '').trim();
    var kategori = String(formData.kategori || 'Link').trim();
    var vpn = formData.vpn === true || String(formData.vpn).toLowerCase() === 'true';
    var rowIndex = formData.rowIndex === undefined || formData.rowIndex === null ? '' : formData.rowIndex;

    if (!tahun || !nama || !link || !deskripsi) {
      return { status: false, message: "Semua field wajib diisi kecuali Keterangan!" };
    }
    if (tahun < 2000 || tahun > 2100) return { status: false, message: "Tahun tidak valid." };
    if (['Link', 'Aplikasi'].indexOf(kategori) === -1) return { status: false, message: "Kategori tidak valid." };
    if (!isSafeUrl_(link)) return { status: false, message: "Link harus diawali http:// atau https://" };

    var values = {
      'tahun': tahun,
      'nama': sanitizeCell_(nama),
      'link': link,
      'kategori': kategori,
      'vpn': vpn,
      'deskripsi': sanitizeCell_(deskripsi),
      'keterangan': sanitizeCell_(keterangan)
    };

    return withLock_(function () {
      var sheet = getDb_().getSheetByName(SHEET_LINK);
      if (!sheet) return { status: false, message: "Sheet 'LINK_APLIKASI' tidak ditemukan." };

      var lastCol = sheet.getLastColumn();
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizeHeader_);

      if (rowIndex !== '' && Number(rowIndex) > 1) {
        var rIndex = Number(rowIndex);
        if (rIndex > sheet.getLastRow()) {
          return { status: false, message: "Data sudah tidak ada. Muat ulang halaman." };
        }
        var current = sheet.getRange(rIndex, 1, 1, lastCol).getValues()[0];
        if (!rowStillMatches_(current, headers, formData._orig, 'nama', 'link')) {
          return { status: false, message: "Data ini sudah diubah/dihapus pengguna lain. Muat ulang lalu coba lagi." };
        }
        // Kolom di luar form dipertahankan (versi lama mengosongkannya)
        var merged = headers.map(function (key, i) {
          return values.hasOwnProperty(key) ? values[key] : current[i];
        });
        sheet.getRange(rIndex, 1, 1, merged.length).setValues([merged]);
        return { status: true, message: "Data berhasil diperbarui!" };
      }

      var newRow = headers.map(function (key) { return values.hasOwnProperty(key) ? values[key] : ''; });
      sheet.appendRow(newRow);
      return { status: true, message: "Data berhasil ditambahkan!" };
    });
  } catch (error) {
    return { status: false, message: "Error saveLinkAplikasi: " + error.message };
  }
}

/** expected (opsional) = { nama, link } saat data dimuat. */
function deleteLinkAplikasi(rowIndex, expected) {
  try {
    return withLock_(function () {
      var sheet = getDb_().getSheetByName(SHEET_LINK);
      if (!sheet) return { status: false, message: "Sheet tidak ditemukan." };
      var r = Number(rowIndex);
      if (!(r > 1) || r > sheet.getLastRow()) {
        return { status: false, message: "Data sudah tidak ada. Muat ulang halaman." };
      }
      var lastCol = sheet.getLastColumn();
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizeHeader_);
      var current = sheet.getRange(r, 1, 1, lastCol).getValues()[0];
      if (!rowStillMatches_(current, headers, expected, 'nama', 'link')) {
        return { status: false, message: "Data ini sudah diubah/dihapus pengguna lain. Muat ulang lalu coba lagi." };
      }
      sheet.deleteRow(r);
      return { status: true, message: "Data berhasil dihapus!" };
    });
  } catch (error) {
    return { status: false, message: "Error deleteLinkAplikasi: " + error.message };
  }
}
