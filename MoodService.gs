/**
 * Menyimpan pilihan mood pegawai ke sheet 'log_mood'
 */
function submitMood(selectedMood, pesanAnonim) {
  try {
    if (!pesanAnonim || pesanAnonim.trim() === '') {
      return { status: false, message: 'Pesan anonim wajib diisi!' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('log_mood');
    
    // Jika sheet belum ada, buat otomatis beserta header-nya
    if (!sheet) {
      sheet = ss.insertSheet('log_mood');
      sheet.appendRow(['timestamp', 'mood', 'pesan_anonim']);
    }

    const timestamp = new Date();
    sheet.appendRow([timestamp, selectedMood, pesanAnonim.trim()]);

    return { status: true, message: 'Terima kasih atas partisipasimu hari ini!' };
  } catch (error) {
    return { status: false, message: 'Gagal menyimpan mood: ' + error.message };
  }
}

/**
 * Mengambil ringkasan & persentase mood khusus untuk HARI INI
 */
function getDailyMoodSummary() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('log_mood');
    
    const moodCounts = {
      semangat: 0,
      senang: 0,
      biasa: 0,
      sedih: 0,
      gakmood: 0
    };
    
    let totalVotes = 0;
    const todayQuotes = [];

    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const todayStr = new Date().toDateString();

      // Baris 0 adalah header, loop dari baris 1
      for (let i = 1; i < data.length; i++) {
        const rawDate = new Date(data[i][0]);
        const mood = data[i][1];
        const pesan = data[i][2];

        // Filter hanya data hari ini
        if (rawDate.toDateString() === todayStr) {
          if (moodCounts.hasOwnProperty(mood)) {
            moodCounts[mood]++;
            totalVotes++;
          }
          if (pesan && pesan !== '-' && pesan.trim() !== '') {
            // Format waktu (Contoh: 14:35 WIB)
            const timeStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), 'HH:mm') + ' WIB';
            todayQuotes.push({ mood: mood, text: pesan, time: timeStr });
          }
        }
      }
    }

    // Menentukan Moodbooster Utama (Mood terbanyak)
    let dominantMood = 'semangat';
    let maxCount = -1;
    for (const [key, count] of Object.entries(moodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = key;
      }
    }

    // Hitung Persentase masing-masing mood
    const percentages = {};
    for (const key in moodCounts) {
      percentages[key] = totalVotes > 0 
        ? Math.round((moodCounts[key] / totalVotes) * 100) 
        : 0;
    }

    return {
      status: true,
      totalVotes: totalVotes,
      counts: moodCounts,
      percentages: percentages,
      dominantMood: dominantMood,
      recentQuotes: todayQuotes.reverse() // 5 pesan anonim terbaru beserta waktunya
    };
  } catch (error) {
    return { status: false, message: error.message };
  }
}