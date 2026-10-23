import { buildGoogleSheetsEditUrl, type ClassGroupSource } from "@/lib/settings-shared";
import {
  extractTabsFromSheetHtml,
  parseSheetTabCsv,
  type ParsedClassTab,
  type SheetTabMeta,
} from "./parse-groups";

export interface ClassGroupsPayload {
  spreadsheetId: string;
  defaultGid: string;
  documentTitle: string;
  sheetUrl: string;
  fetchedAt: string;
  tabs: ParsedClassTab[];
  totalStudentsInClass: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const groupsCache = new Map<string, { expiresAt: number; payload: ClassGroupsPayload }>();

export function invalidateClassGroupsCache(spreadsheetId?: string) {
  if (!spreadsheetId) {
    groupsCache.clear();
    return;
  }
  groupsCache.delete(spreadsheetId);
}

async function fetchTabCsv(spreadsheetId: string, gid: string): Promise<string> {
  const params = new URLSearchParams({
    format: "csv",
    gid,
  });
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/csv,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengunduh CSV tab (gid=${gid}): HTTP ${response.status}`);
  }

  return response.text();
}

export async function fetchClassGroupsData(
  source: ClassGroupSource,
  forceRefresh = false,
): Promise<ClassGroupsPayload> {
  const cacheKey = source.spreadsheetId;
  const now = Date.now();

  if (!forceRefresh) {
    const cached = groupsCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.payload;
    }
  }

  let documentTitle: string | null = null;
  let discoveredTabs: SheetTabMeta[] = [];

  try {
    const editUrl = `https://docs.google.com/spreadsheets/d/${source.spreadsheetId}/edit`;
    const htmlRes = await fetch(editUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FATISDA26TaskPanel/3.0)",
      },
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const extracted = extractTabsFromSheetHtml(html);
      documentTitle = extracted.documentTitle;
      discoveredTabs = extracted.tabs;
    }
  } catch (err) {
    console.warn("[fetchClassGroupsData] Auto-tab discovery fallback:", err);
  }

  if (discoveredTabs.length === 0) {
    discoveredTabs = [
      {
        index: 0,
        gid: source.gid || "0",
        name: source.label || "Kelompok Kelas",
      },
    ];
  }

  const parsedTabs = await Promise.all(
    discoveredTabs.map(async (tabMeta) => {
      try {
        const csv = await fetchTabCsv(source.spreadsheetId, tabMeta.gid);
        return parseSheetTabCsv(tabMeta.name, tabMeta.gid, csv);
      } catch (err) {
        console.warn(`[fetchClassGroupsData] Gagal memuat tab ${tabMeta.name} (${tabMeta.gid}):`, err);
        return null;
      }
    }),
  );

  const validTabs = parsedTabs.filter((t): t is ParsedClassTab => t !== null);
  if (validTabs.length === 0) {
    throw new Error(
      "Tidak dapat membaca data dari Google Spreadsheet. Pastikan akses spreadsheet diatur ke 'Siapa saja yang memiliki link dapat melihat' (Public Viewer).",
    );
  }

  const directoryTab = validTabs.find((t) => t.kind === "directory");
  const maxGroupStudents = validTabs.reduce(
    (max, t) => (t.totalStudents > max ? t.totalStudents : max),
    0,
  );
  const totalStudentsInClass = directoryTab?.totalStudents || maxGroupStudents;

  const firstGroupTab = validTabs.find((t) => t.kind === "groups");
  const defaultGid =
    validTabs.find((t) => t.gid === source.gid && t.kind === "groups")?.gid ||
    firstGroupTab?.gid ||
    validTabs[0].gid;

  const payload: ClassGroupsPayload = {
    spreadsheetId: source.spreadsheetId,
    defaultGid,
    documentTitle: documentTitle || source.label || `Kelompok ${source.prodi} Kelas ${source.kelas}`,
    sheetUrl: buildGoogleSheetsEditUrl(source.spreadsheetId, defaultGid),
    fetchedAt: new Date().toISOString(),
    tabs: validTabs,
    totalStudentsInClass,
  };

  groupsCache.set(cacheKey, {
    expiresAt: now + CACHE_TTL_MS,
    payload,
  });

  return payload;
}

