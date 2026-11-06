/**
 * Service Backend untuk Sinkronisasi dan Rekapitulasi Data SPBY Keuangan (Anggaran)
 */

// Ganti dengan ID Spreadsheet Eksternal sumber data MASTER_SPBY Anda
var EXTERNAL_SPREADSHEET_ID = "1Pd1tubb5n-2AyUei0jYeeQWFR7k-9tEFFBCe2p8G2dE";

function syncAndGetSpbyData() {
  try {
    var internalSs = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Ambil data dari Spreadsheet Eksternal
    var extSs = SpreadsheetApp.openById(EXTERNAL_SPREADSHEET_ID);
    var extSheet = extSs.getSheetByName('MASTER_SPBY');
    if (!extSheet) {
      return { status: false, message: "Sheet 'MASTER_SPBY' tidak ditemukan di spreadsheet eksternal." };
    }
    
    var extLastRow = extSheet.getLastRow();
    var extLastCol = extSheet.getLastColumn();
    if (extLastRow <= 1 || extLastCol === 0) {
      return { status: true, data: [] };
    }
    
    var extData = extSheet.getRange(1, 1, extLastRow, extLastCol).getValues();
    
    // 2. Simpan/Sinkronkan ke Sheet Internal (DAFTAR_SPBY)
    var intSheet = internalSs.getSheetByName('DAFTAR_SPBY');
    if (!intSheet) {
      intSheet = internalSs.insertSheet('DAFTAR_SPBY');
    }
    
    intSheet.clear();
    intSheet.getRange(1, 1, extData.length, extData[0].length).setValues(extData);
    
    return parseSpbyData(extData);
  } catch (error) {
    return { status: false, message: "Error syncAndGetSpbyData: " + error.message };
  }
}

function getSpbyDataLocal() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DAFTAR_SPBY');
    if (!sheet) {
      return syncAndGetSpbyData();
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol === 0) return { status: true, data: [] };
    
    var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    return parseSpbyData(data);
  } catch (error) {
    return { status: false, message: "Error getSpbyDataLocal: " + error.message };
  }
}

// Fungsi bantu untuk mengubah array 2D menjadi Objek Berstrukutur
function parseSpbyData(data) {
  var headers = data[0].map(function(h) { return h.toString().trim().toLowerCase(); });
  var rows = data.slice(1);
  
  var result = rows.map(function(row, index) {
    var getVal = function(headerName) {
      var idx = headers.indexOf(headerName.toLowerCase());
      return (idx !== -1 && row[idx] !== undefined) ? row[idx] : '';
    };
    
    var getNum = function(headerName) {
      var val = getVal(headerName);
      return typeof val === 'number' ? val : (parseFloat(val) || 0);
    };

    return {
      rowIndex: index + 2,
      sheetAsal: getVal('nama sheet asal') || getVal('sheet asal') || 'Sheet1',
      noUrut: getVal('no') || (index + 1),
      tanggalSpby: getVal('tanggal spby') || getVal('tanggal') || '-',
      bast: getVal('bast') || '-',
      noSpby: getVal('no. spby') || getVal('no spby') || '-',
      program: getVal('program') || '-',
      aktifitas: getVal('aktifitas') || '-',
      kro: getVal('kro') || '-',
      subOutput: getVal('sub output') || '-',
      akun: getVal('akun') || '-',
      komponen: getVal('komponen') || '-',
      detail: getVal('detail') || '-',
      npwp: getVal('npwp penerima') || '-',
      pembayaran: getVal('pembayaran') || '-',
      jumlahBruto: getNum('jumlah bruto'),
      ppn: getNum('ppn 411211'),
      pph21: getNum('pph21 411121'),
      pph22: getNum('pph22 411122'),
      pph23: getNum('pph23 411124'),
      pphFinal: getNum('pph final 411128'),
      jumlahPajak: getNum('jumlah pajak'),
      keterangan: getVal('keterangan') || '-',
      jumlahNetto: getNum('jumlah netto'),
      sudahBayar: getVal('sudah bayar') !== '' ? getVal('sudah bayar') : 'false',
      catatan: getVal('catatan') || '-'
    };
  });
  
  return { status: true, data: result };
}