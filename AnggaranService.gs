/**
 * Service Backend untuk Sinkronisasi dan Rekapitulasi Data SPBY Keuangan (Anggaran)
 */

// ID Spreadsheet Eksternal sumber data rekap
var EXTERNAL_SPREADSHEET_ID = "1AZaI7NbB74Sfb6c2R9SoUrWKnHhGQFGOTI48vuRj4IE";
var EXTERNAL_SHEET_NAME = "rekap";
var EXTERNAL_HEADER_ROW = 7; // Header berada di baris ke-7 pada sheet 'rekap'

// Daftar 37 Header Kolom Baru untuk sheet DAFTAR_SPBY
var DAFTAR_SPBY_HEADERS = [
  'sheet_asal',
  'No',
  'in_ppk_day',
  'in_ppk_month',
  'in_ppk_year',
  'date_spby/SPP',
  'gaji_non',
  'cara_bayar',
  'no_spp',
  'no_cara_bayar',
  'bast_spby',
  'no_spby',
  'mak_program',
  'mak_keg',
  'mak_kro',
  'mak_suboutput',
  'mak_komponen',
  'mak_subkomponen',
  'mak_akun',
  'mak_detail',
  'pengusul',
  'npwp_penerima',
  'rincian_pembayaran',
  'jmlah_rp',
  'pajak_ppn',
  'pajak_pph21',
  'pajak_pph22',
  'pajak_pph23',
  'pajak_pphfinal',
  'jumlah_pajak',
  'keterangan_bayar',
  'jml_netto_rp',
  'chelist_bayar',
  'catatan',
  'no_wa_pengusul',
  'isi_boradcast',
  'catatan_pengajuan',
  'checklist_rup',
  'link_dok_rup'
];

function syncAndGetSpbyData() {
  return withLock_(function () {
    try {
      // 1. Ambil data dari Spreadsheet Eksternal pada sheet 'rekap' mulai baris ke-7
      var extSs = SpreadsheetApp.openById(EXTERNAL_SPREADSHEET_ID);
      var extSheet = extSs.getSheetByName(EXTERNAL_SHEET_NAME);
      if (!extSheet) {
        return { status: false, message: "Sheet '" + EXTERNAL_SHEET_NAME + "' tidak ditemukan di spreadsheet eksternal." };
      }

      var internalSs = getDb_();
      var intSheet = internalSs.getSheetByName('DAFTAR_SPBY');
      if (!intSheet) intSheet = internalSs.insertSheet('DAFTAR_SPBY');

      var extLastRow = extSheet.getLastRow();
      var extLastCol = extSheet.getLastColumn();
      if (extLastRow <= EXTERNAL_HEADER_ROW || extLastCol === 0) {
        // Sumber kosong -> salinan internal dikosongkan dan hanya diisi header standar
        intSheet.clearContents();
        intSheet.getRange(1, 1, 1, DAFTAR_SPBY_HEADERS.length).setValues([DAFTAR_SPBY_HEADERS]);
        return { status: true, data: [] };
      }

      var numRows = extLastRow - EXTERNAL_HEADER_ROW + 1;
      var rawExtData = extSheet.getRange(EXTERNAL_HEADER_ROW, 1, numRows, extLastCol).getValues();

      // Petakan kolom dari sheet 'rekap' ke urutan standar 37 kolom DAFTAR_SPBY_HEADERS
      var srcHeaderIndex = {};
      rawExtData[0].forEach(function (h, i) {
        var key = normalizeHeader_(h);
        if (key && srcHeaderIndex[key] === undefined) srcHeaderIndex[key] = i;
      });

      var normalizedRows = [];
      rawExtData.slice(1).forEach(function (row) {
        var isEmpty = row.every(function (c) { return c === '' || c === null; });
        if (isEmpty) return;

        var mappedRow = DAFTAR_SPBY_HEADERS.map(function (colName) {
          var idx = srcHeaderIndex[normalizeHeader_(colName)];
          return (idx !== undefined && idx < row.length && row[idx] !== null && row[idx] !== undefined)
            ? row[idx]
            : '';
        });
        normalizedRows.push(mappedRow);
      });

      var finalSheetData = [DAFTAR_SPBY_HEADERS].concat(normalizedRows);

      // 2. Tulis dulu ke DAFTAR_SPBY, baru bersihkan sisa area lama
      intSheet.getRange(1, 1, finalSheetData.length, DAFTAR_SPBY_HEADERS.length).setValues(finalSheetData);
      var maxRows = intSheet.getMaxRows();
      var maxCols = intSheet.getMaxColumns();
      if (maxRows > finalSheetData.length) {
        intSheet.getRange(finalSheetData.length + 1, 1, maxRows - finalSheetData.length, maxCols).clearContent();
      }
      if (maxCols > DAFTAR_SPBY_HEADERS.length) {
        intSheet.getRange(1, DAFTAR_SPBY_HEADERS.length + 1, finalSheetData.length, maxCols - DAFTAR_SPBY_HEADERS.length).clearContent();
      }

      return parseSpbyData_(finalSheetData);
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

// Mengubah array 2D menjadi objek terstruktur untuk frontend (37 atribut lengkap)
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
        var idx = headerIndex[normalizeHeader_(arguments[a])];
        if (idx !== undefined && row[idx] !== undefined && row[idx] !== '') {
          return normalizeCell_(row[idx]);
        }
      }
      return '';
    };
    var getNum = function (name) { return parseIdNumber_(getVal(name)); };
    var str = function (v) { return v === '' ? '-' : v; };

    var bayar = getVal('chelist_bayar', 'cheklist_bayar', 'checklist_bayar', 'sudah bayar');
    var sudahBayar = bayar === true ||
      ['true', 'ya', 'sudah', 'lunas', '1', 'yes', 'v', '✓', '✔'].indexOf(String(bayar).trim().toLowerCase()) !== -1;

    result.push({
      rowIndex: index + 2,
      sheetAsal: getVal('sheet_asal', 'nama sheet asal', 'sheet asal') || 'Sheet1',
      noUrut: getVal('No', 'no') || (index + 1),
      inPpkDay: str(getVal('in_ppk_day')),
      inPpkMonth: str(getVal('in_ppk_month')),
      inPpkYear: str(getVal('in_ppk_year')),
      tanggalSpby: str(getVal('date_spby/SPP', 'date_spby/spp', 'tanggal spby', 'tanggal')),
      gajiNon: str(getVal('gaji_non')),
      caraBayar: str(getVal('cara_bayar')),
      noSpp: str(getVal('no_spp')),
      noCaraBayar: str(getVal('no_cara_bayar')),
      bast: str(getVal('bast_spby', 'bast')),
      noSpby: str(getVal('no_spby', 'no. spby', 'no spby')),
      program: str(getVal('mak_program', 'program')),
      aktifitas: str(getVal('mak_keg', 'aktifitas')),
      kro: str(getVal('mak_kro', 'kro')),
      subOutput: str(getVal('mak_suboutput', 'sub output')),
      komponen: str(getVal('mak_komponen', 'komponen')),
      subKomponen: str(getVal('mak_subkomponen', 'sub komponen')),
      akun: str(getVal('mak_akun', 'akun')),
      detail: str(getVal('mak_detail', 'detail')),
      pengusul: str(getVal('pengusul')),
      npwp: str(getVal('npwp_penerima', 'npwp penerima')),
      pembayaran: str(getVal('rincian_pembayaran', 'pembayaran')),
      jumlahBruto: getNum('jmlah_rp'),
      ppn: getNum('pajak_ppn'),
      pph21: getNum('pajak_pph21'),
      pph22: getNum('pajak_pph22'),
      pph23: getNum('pajak_pph23'),
      pphFinal: getNum('pajak_pphfinal'),
      jumlahPajak: getNum('jumlah_pajak'),
      keterangan: str(getVal('keterangan_bayar', 'keterangan')),
      jumlahNetto: getNum('jml_netto_rp'),
      sudahBayar: sudahBayar,
      catatan: str(getVal('catatan')),
      noWaPengusul: str(getVal('no_wa_pengusul')),
      isiBroadcast: str(getVal('isi_boradcast')),
      catatanPengajuan: str(getVal('catatan_pengajuan')),
      checkListRup: str(getVal('checklist_rup')),
      linkDokRup: str(getVal('link_dok_rup'))
    });
  });

  return { status: true, data: result };
}