/**
 * Service Backend khusus untuk Pengelolaan Link Aplikasi
 */

function getLinkAplikasiData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LINK_APLIKASI');
  if (!sheet) {
    return { status: false, message: "Sheet 'LINK_APLIKASI' tidak ditemukan." };
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: true, data: [] };
  
  var headers = data[0];
  var rows = data.slice(1);
  
  var result = rows.map(function(row, index) {
    var obj = { rowIndex: index + 2 };
    headers.forEach(function(header, i) {
      // Menggunakan key bersih tanpa spasi untuk memudahkan binding
      var cleanHeader = header.toString().trim().toLowerCase();
      obj[cleanHeader] = row[i];
    });
    return obj;
  });
  
  return { status: true, data: result };
}

function saveLinkAplikasi(formData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LINK_APLIKASI');
  if (!sheet) {
    return { status: false, message: "Sheet 'LINK_APLIKASI' tidak ditemukan." };
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Validasi field wajib terisi (Tahun, Nama, Link, Deskripsi)
  if (!formData.tahun || !formData.nama || !formData.link || !formData.deskripsi) {
    return { status: false, message: "Semua field wajib diisi kecuali Keterangan!" };
  }
  
  if (formData.rowIndex && formData.rowIndex !== '') {
    var rowIndex = Number(formData.rowIndex);
    var rowValues = headers.map(function(header) {
      var key = header.toString().trim().toLowerCase();
      return formData[key] !== undefined ? formData[key] : '';
    });
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    return { status: true, message: "Data berhasil diperbarui!" };
  } else {
    var newRow = headers.map(function(header) {
      var key = header.toString().trim().toLowerCase();
      return formData[key] !== undefined ? formData[key] : '';
    });
    sheet.appendRow(newRow);
    return { status: true, message: "Data berhasil ditambahkan!" };
  }
}

function deleteLinkAplikasi(rowIndex) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LINK_APLIKASI');
  if (!sheet) {
    return { status: false, message: "Sheet tidak ditemukan." };
  }
  sheet.deleteRow(Number(rowIndex));
  return { status: true, message: "Data berhasil dihapus!" };
}