/**
 * Helper parsing input tanggal deadline dalam WIB (Asia/Jakarta, UTC+7).
 * Mendukung format:
 * - "besok", "besok 23:59", "besok 18:00"
 * - "lusa", "lusa 23:59"
 * - "hari ini", "hari ini 23:59"
 * - "2026-10-25 23:59", "2026-10-25"
 * - "25-10-2026 23:59", "25/10/2026 23:59", "25-10-2026", "25/10/2026"
 */
export function parseWibDeadline(input: string | null | undefined): Date | null {
  if (!input || typeof input !== "string") return null;
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // Waktu saat ini di WIB
  const nowUtc = Date.now();
  const wibTime = new Date(nowUtc + 7 * 3600000);

  let targetYear = wibTime.getUTCFullYear();
  let targetMonth = wibTime.getUTCMonth(); // 0-indexed
  let targetDate = wibTime.getUTCDate();
  let targetHours = 23;
  let targetMinutes = 59;

  // Cek kata kunci waktu relatif: "besok", "lusa", "hari ini"
  const relativeMatch = raw.match(/^(hari\s*ini|besok|lusa)(?:\s+(\d{1,2})[:.](\d{2}))?$/i);
  if (relativeMatch) {
    const keyword = relativeMatch[1].toLowerCase().replace(/\s+/g, "");
    if (keyword === "besok") {
      targetDate += 1;
    } else if (keyword === "lusa") {
      targetDate += 2;
    }
    if (relativeMatch[2] && relativeMatch[3]) {
      targetHours = parseInt(relativeMatch[2], 10);
      targetMinutes = parseInt(relativeMatch[3], 10);
    }
    // Bentuk UTC Date yang sesuai dengan WIB
    return new Date(Date.UTC(targetYear, targetMonth, targetDate, targetHours - 7, targetMinutes, 0));
  }

  // Format ISO: YYYY-MM-DD [HH:mm]
  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s+(\d{1,2})[:.](\d{2}))?$/);
  if (isoMatch) {
    targetYear = parseInt(isoMatch[1], 10);
    targetMonth = parseInt(isoMatch[2], 10) - 1;
    targetDate = parseInt(isoMatch[3], 10);
    if (isoMatch[4] && isoMatch[5]) {
      targetHours = parseInt(isoMatch[4], 10);
      targetMinutes = parseInt(isoMatch[5], 10);
    }
    return new Date(Date.UTC(targetYear, targetMonth, targetDate, targetHours - 7, targetMinutes, 0));
  }

  // Format Indonesia: DD-MM-YYYY atau DD/MM/YYYY [HH:mm]
  const idMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2})[:.](\d{2}))?$/);
  if (idMatch) {
    targetDate = parseInt(idMatch[1], 10);
    targetMonth = parseInt(idMatch[2], 10) - 1;
    targetYear = parseInt(idMatch[3], 10);
    if (idMatch[4] && idMatch[5]) {
      targetHours = parseInt(idMatch[4], 10);
      targetMinutes = parseInt(idMatch[5], 10);
    }
    return new Date(Date.UTC(targetYear, targetMonth, targetDate, targetHours - 7, targetMinutes, 0));
  }

  // Fallback ke native Date parser jika input valid ISO
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

