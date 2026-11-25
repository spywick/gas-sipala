/**
 * Service Backend untuk Sinkronisasi dan Rekapitulasi Data SPBY Keuangan (Anggaran)
 */

// ID Spreadsheet Eksternal sumber data MASTER_SPBY
var EXTERNAL_SPREADSHEET_ID = "1Pd1tubb5n-2AyUei0jYeeQWFR7k-9tEFFBCe2p8G2dE";

function syncAndGetSpbyData() {
  return withLock_(function () {
    try {
      // 1. Ambil data dari Spreadsheet Eksternal
      var extSs = SpreadsheetApp.openById(EXTERNAL_SPREADSHEET_ID);
      var extSheet = extSs.getSheetByName('MASTER_SPBY');
      if (!extSheet) {
        return { status: false, message: "Sheet 'MASTER_SPBY' tidak ditemukan di spreadsheet eksternal." };
      }

      var internalSs = getDb_();
      var intSheet = internalSs.getSheetByName('DAFTAR_SPBY');
      if (!intSheet) intSheet = internalSs.insertSheet('DAFTAR_SPBY');

      var extLastRow = extSheet.getLastRow();
      var extLastCol = extSheet.getLastColumn();
      if (extLastRow <= 1 || extLastCol === 0) {
        // Sumber kosong -> salinan internal ikut dikosongkan agar tidak menampilkan data basi
        intSheet.clearContents();
        return { status: true, data: [] };
      }

      var extData = extSheet.getRange(1, 1, extLastRow, extLastCol).getValues();

      // 2. Tulis dulu, baru bersihkan sisa area lama (data lama tidak hilang jika penulisan gagal)
      intSheet.getRange(1, 1, extData.length, extData[0].length).setValues(extData);
      var maxRows = intSheet.getMaxRows();
      var maxCols = intSheet.getMaxColumns();
      if (maxRows > extData.length) {
        intSheet.getRange(extData.length + 1, 1, maxRows - extData.length, maxCols).clearContent();
      }
      if (maxCols > extData[0].length) {
        intSheet.getRange(1, extData[0].length + 1, extData.length, maxCols - extData[0].length).clearContent();
      }

      return parseSpbyData_(extData);
    } catch (error) {
      return { status: false, message: "Error syncAndGetSpbyData: " + error.message };
    }
  });
}

function getSpbyDataLocal() {
  try {
    var sheet = getDb_().getSheetByName('DAFTAR_SPBY');
    if (!sheet) {
      return syncAndGetSpbyData();
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol === 0) return { status: true, data: [] };

    var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    return parseSpbyData_(data);
  } catch (error) {
    return { status: false, message: "Error getSpbyDataLocal: " + error.message };
  }
}

// Mengubah array 2D menjadi objek terstruktur yang aman dikirim ke browser
function parseSpbyData_(data) {
  var headerIndex = {};
  data[0].forEach(function (h, i) {
    var key = normalizeHeader_(h);
    if (key && headerIndex[key] === undefined) headerIndex[key] = i;
  });

  var result = [];
  data.slice(1).forEach(function (row, index) {
    var isEmpty = row.every(function (c) { return c === '' || c === null; });
    if (isEmpty) return;

    var getVal = function () {
      for (var a = 0; a < arguments.length; a++) {
        var idx = headerIndex[arguments[a]];
        if (idx !== undefined && row[idx] !== undefined && row[idx] !== '') {
          return normalizeCell_(row[idx]);
        }
      }
      return '';
    };
    var getNum = function (name) { return parseIdNumber_(getVal(name)); };
    var str = function (v) { return v === '' ? '-' : v; };

    var bayar = getVal('sudah bayar');
    var sudahBayar = bayar === true ||
      ['true', 'ya', 'sudah', 'lunas', '1', 'yes'].indexOf(String(bayar).trim().toLowerCase()) !== -1;

    result.push({
      rowIndex: index + 2,
      sheetAsal: getVal('nama sheet asal', 'sheet asal') || 'Sheet1',
      noUrut: getVal('no') || (index + 1),
      tanggalSpby: str(getVal('tanggal spby', 'tanggal')),
      bast: str(getVal('bast')),
      noSpby: str(getVal('no. spby', 'no spby')),
      program: str(getVal('program')),
      aktifitas: str(getVal('aktifitas')),
      kro: str(getVal('kro')),
      subOutput: str(getVal('sub output')),
      akun: str(getVal('akun')),
      komponen: str(getVal('komponen')),
      detail: str(getVal('detail')),
      npwp: str(getVal('npwp penerima')),
      pembayaran: str(getVal('pembayaran')),
      jumlahBruto: getNum('jumlah bruto'),
      ppn: getNum('ppn 411211'),
      pph21: getNum('pph21 411121'),
      pph22: getNum('pph22 411122'),
      pph23: getNum('pph23 411124'),
      pphFinal: getNum('pph final 411128'),
      jumlahPajak: getNum('jumlah pajak'),
      keterangan: str(getVal('keterangan')),
      jumlahNetto: getNum('jumlah netto'),
      sudahBayar: sudahBayar,
      catatan: str(getVal('catatan'))
    });
  });

  return { status: true, data: result };
}
