import type { Prodi } from "./types";

import { getScheduleSource, type ScheduleSource } from "./sources";

function buildCsvUrl(source: ScheduleSource): string {
  const params = new URLSearchParams({
    format: "csv",
    gid: source.gid,
  });

  return `https://docs.google.com/spreadsheets/d/${source.spreadsheetId}/export?${params.toString()}`;
}

export async function fetchScheduleCsv(source: ScheduleSource): Promise<string> {
  const url = buildCsvUrl(source);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/csv,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil ${source.label}: HTTP ${response.status}`);
  }

  const csv = await response.text();

  if (!csv.trim()) {
    throw new Error(`${source.label} mengembalikan CSV kosong.`);
  }

  return csv;
}

export async function fetchScheduleCsvByProdi(prodi: Prodi): Promise<string> {
  const source = getScheduleSource(prodi);

  if (!source) {
    throw new Error(`Belum ada sumber jadwal untuk prodi ${prodi}.`);
  }

  return fetchScheduleCsv(source);
}
