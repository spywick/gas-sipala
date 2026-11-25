/**
 * Service Backend Daily Mood Tracker (sheet log_mood: timestamp | mood | pesan_anonim)
 * Dipanggil dari Page_Beranda: getDailyMoodSummary() dan submitMood(mood, pesan).
 */

var MOOD_SHEET = 'log_mood'; // dicari tanpa peduli huruf besar/kecil (findSheet_)
var MOOD_VALUES = ['semangat', 'senang', 'biasa', 'sedih', 'gakmood'];
var MOOD_MIN_WORDS = 3;
var MOOD_MAX_CHARS = 150;
var MOOD_MAX_QUOTES = 50;
var MOOD_SCAN_ROWS = 1000; // log bersifat append-only (kronologis): cukup baca ujung bawah

function getDailyMoodSummary() {
  try {
    var counts = {};
    MOOD_VALUES.forEach(function (m) { counts[m] = 0; });
    var quotes = [];
    var total = 0;

    var sheet = findSheet_(getDb_(), MOOD_SHEET);
    if (sheet && sheet.getLastRow() > 1) {
      var lastRow = sheet.getLastRow();
      var n = Math.min(lastRow - 1, MOOD_SCAN_ROWS);
      var values = sheet.getRange(lastRow - n + 1, 1, n, 3).getValues();
      var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

      values.forEach(function (r, i) {
        var ts = r[0] instanceof Date ? r[0] : new Date(r[0]);
        if (isNaN(ts.getTime())) return;
        if (Utilities.formatDate(ts, TZ, 'yyyy-MM-dd') !== today) return;
        var mood = String(r[1]).trim().toLowerCase();
        if (counts[mood] === undefined) return;
        counts[mood]++;
        total++;
        var text = String(r[2] === null || r[2] === undefined ? '' : r[2]).trim();
        if (text) {
          quotes.push({ ts: ts.getTime(), i: i, mood: mood, text: text, time: Utilities.formatDate(ts, TZ, 'HH:mm') });
        }
      });
    }

    quotes.sort(function (a, b) { return (b.ts - a.ts) || (b.i - a.i); }); // seri waktu -> baris lebih bawah = lebih baru
    quotes = quotes.slice(0, MOOD_MAX_QUOTES).map(function (q) {
      return { mood: q.mood, text: q.text, time: q.time };
    });

    return {
      status: true,
      totalVotes: total,
      counts: counts,
      percentages: computePercentages_(counts, total),
      dominantMood: total > 0 ? findDominantMood_(counts) : '',
      recentQuotes: quotes
    };
  } catch (error) {
    return { status: false, message: 'Error getDailyMoodSummary: ' + error.message };
  }
}

function submitMood(mood, pesan) {
  try {
    mood = String(mood || '').trim().toLowerCase();
    if (MOOD_VALUES.indexOf(mood) === -1) {
      return { status: false, message: 'Pilihan mood tidak valid.' };
    }
    pesan = String(pesan || '').replace(/\s+/g, ' ').trim();
    var words = pesan ? pesan.split(' ').length : 0;
    if (words < MOOD_MIN_WORDS) {
      return { status: false, message: 'Pesan minimal ' + MOOD_MIN_WORDS + ' kata.' };
    }
    if (pesan.length > MOOD_MAX_CHARS) {
      return { status: false, message: 'Pesan maksimal ' + MOOD_MAX_CHARS + ' karakter.' };
    }

    return withLock_(function () {
      var ss = getDb_();
      var sheet = findSheet_(ss, MOOD_SHEET);
      if (!sheet) {
        sheet = ss.insertSheet(MOOD_SHEET);
        sheet.appendRow(['timestamp', 'mood', 'pesan_anonim']);
      }
      sheet.appendRow([new Date(), mood, sanitizeCell_(pesan)]);
      return { status: true, message: 'Terima kasih, perasaanmu sudah tercatat!' };
    });
  } catch (error) {
    return { status: false, message: 'Error submitMood: ' + error.message };
  }
}

/** Persentase bulat yang selalu berjumlah tepat 100 (metode sisa terbesar). */
function computePercentages_(counts, total) {
  var pct = {};
  var sum = 0;
  var remainders = [];
  MOOD_VALUES.forEach(function (k) {
    var raw = total > 0 ? counts[k] * 100 / total : 0;
    pct[k] = Math.floor(raw);
    sum += pct[k];
    remainders.push({ k: k, r: raw - pct[k] });
  });
  remainders.sort(function (a, b) { return b.r - a.r; });
  for (var i = 0; total > 0 && i < 100 - sum; i++) pct[remainders[i].k]++;
  return pct;
}

/** Mood terbanyak; jika seri, dipilih yang lebih dulu di MOOD_VALUES. */
function findDominantMood_(counts) {
  var best = MOOD_VALUES[0];
  MOOD_VALUES.forEach(function (k) { if (counts[k] > counts[best]) best = k; });
  return best;
}
