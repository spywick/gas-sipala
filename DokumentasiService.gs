/**
 * Service Backend khusus untuk Pengelolaan Dokumentasi SIPALA
 */

function getDokumentasiData() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DOKUMENTASI');
    if (!sheet) {
      return { status: false, message: "Sheet 'DOKUMENTASI' tidak ditemukan. Pastikan tab sheet sudah dibuat." };
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol === 0) return { status: true, data: [] };
    
    var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = data[0];
    var rows = data.slice(1);
    
    var result = rows.map(function(row, index) {
      var obj = { rowIndex: index + 2 };
      headers.forEach(function(header, i) {
        if (header) {
          var cleanHeader = header.toString().trim().toLowerCase();
          obj[cleanHeader] = row[i] !== undefined ? row[i] : '';
        }
      });
      return obj;
    });
    
    return { status: true, data: result };
  } catch (error) {
    return { status: false, message: "Error getDokumentasiData: " + error.message };
  }
}

function saveDokumentasi(formData) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DOKUMENTASI');
    if (!sheet) {
      return { status: false, message: "Sheet 'DOKUMENTASI' tidak ditemukan." };
    }
    
    var tanggal = formData.tanggal || '';
    var bulan = formData.bulan || '';
    var tahun = formData.tahun || '';
    var deskripsi = formData.deskripsi || '';
    var link_dokumentasi = formData.link_dokumentasi || formData.link || '';
    var keterangan = formData.keterangan || '';
    var tags = formData.tags || '';
    var rowIndex = formData.rowIndex || '';

    // Validasi field wajib terisi
    if (!tanggal || !bulan || !tahun || !deskripsi || !link_dokumentasi) {
      return { status: false, message: "Field Tanggal, Bulan, Tahun, Deskripsi, dan Link Dokumentasi wajib diisi!" };
    }
    
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      return { status: false, message: "Header sheet 'DOKUMENTASI' belum diatur." };
    }
    
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    if (rowIndex !== '' && Number(rowIndex) > 1) {
      // === PROSES EDIT DATA ===
      var rIndex = Number(rowIndex);
      var currentValues = sheet.getRange(rIndex, 1, 1, lastCol).getValues()[0];
      
      var rowValues = headers.map(function(header, i) {
        var key = header.toString().trim().toLowerCase();
        var existingVal = currentValues[i] !== undefined ? currentValues[i] : '';
        
        if (key === 'tanggal') return tanggal;
        if (key === 'bulan') return bulan;
        if (key === 'tahun') return tahun;
        if (key === 'deskripsi') return deskripsi;
        if (key === 'link_dokumentasi') return link_dokumentasi;
        if (key === 'keterangan') return keterangan;
        if (key === 'tags') return tags;
        
        return existingVal;
      });
      
      sheet.getRange(rIndex, 1, 1, rowValues.length).setValues([rowValues]);
      return { status: true, message: "Data dokumentasi berhasil diperbarui!" };
      
    } else {
      // === PROSES TAMBAH DATA BARU ===
      var rowValues = headers.map(function(header) {
        var key = header.toString().trim().toLowerCase();
        
        if (key === 'tanggal') return tanggal;
        if (key === 'bulan') return bulan;
        if (key === 'tahun') return tahun;
        if (key === 'deskripsi') return deskripsi;
        if (key === 'link_dokumentasi') return link_dokumentasi;
        if (key === 'keterangan') return keterangan;
        if (key === 'tags') return tags;
        
        return '';
      });
      
      sheet.appendRow(rowValues);
      return { status: true, message: "Data dokumentasi berhasil ditambahkan!" };
    }
  } catch (error) {
    return { status: false, message: "Error saveDokumentasi: " + error.message };
  }
}

function deleteDokumentasi(rowIndex) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DOKUMENTASI');
    if (!sheet) {
      return { status: false, message: "Sheet 'DOKUMENTASI' tidak ditemukan." };
    }
    sheet.deleteRow(Number(rowIndex));
    return { status: true, message: "Data dokumentasi berhasil dihapus!" };
  } catch (error) {
    return { status: false, message: "Error deleteDokumentasi: " + error.message };
  }
}