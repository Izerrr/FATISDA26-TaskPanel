export interface SheetTabMeta {
  index: number;
  gid: string;
  name: string;
}

export interface GroupMember {
  nim: string;
  name: string;
  role: "Ketua" | "Anggota";
  rawRole?: string;
}

export interface ClassTeam {
  id: string;
  name: string;
  category: string | null;
  topic: string | null;
  link: string | null;
  members: GroupMember[];
  totalSlots: number;
  emptySlots: number;
}

export interface ClassStudentDirectoryItem {
  no: number;
  nim: string;
  name: string;
  status: string | null;
  isPjKelas: boolean;
  pjMatkul: string | null;
}

export interface ParsedClassTab {
  gid: string;
  name: string;
  kind: "groups" | "directory";
  sharedLink: string | null;
  teams: ClassTeam[];
  directory: ClassStudentDirectoryItem[];
  totalStudents: number;
}

export interface StudentTeamAssignment {
  tabGid: string;
  tabName: string;
  teamName: string;
  role: "Ketua" | "Anggota";
  topic: string | null;
  link: string | null;
  memberCount: number;
}

/**
 * Parses CSV text into a 2D array of trimmed strings, handling quoted fields with commas/newlines.
 */
export function parseCsvLines(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const normalized = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (ch === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += ch;
      }
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((cell) => cell !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Extracts document title and all worksheet tabs (name + gid) from Google Sheets /edit HTML.
 */
export function extractTabsFromSheetHtml(html: string): {
  documentTitle: string | null;
  tabs: SheetTabMeta[];
} {
  let documentTitle: string | null = null;
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    documentTitle = titleMatch[1]
      .replace(/\s*-\s*Google\s+Spreadsheets?$/i, "")
      .replace(/\s*-\s*Google\s+Sheets?$/i, "")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .trim();
  }

  const tabs: SheetTabMeta[] = [];
  const seenGids = new Set<string>();

  // Pattern 1: Escaped bootstrapData array [21350203,"[<index>,0,\"<gid>\",[{\"1\":[[0,0,\"<name>\"]
  const escapedRegex = /\[21350203,"\[(\d+),0,\\"(\d+)\\",\[\{\\"1\\":\[\[0,0,\\"([^\\"]+)\\"/g;
  let match: RegExpExecArray | null;
  while ((match = escapedRegex.exec(html)) !== null) {
    const index = parseInt(match[1], 10);
    const gid = match[2];
    const name = match[3];
    if (gid && name && !seenGids.has(gid)) {
      seenGids.add(gid);
      tabs.push({ index, gid, name });
    }
  }

  // Pattern 2: Unescaped variant
  if (tabs.length === 0) {
    const unescapedRegex = /\[(\d+),0,"(\d+)",\[\{"1":\[\[0,0,"([^"]+)"\]/g;
    while ((match = unescapedRegex.exec(html)) !== null) {
      const index = parseInt(match[1], 10);
      const gid = match[2];
      const name = match[3];
      if (gid && name && !seenGids.has(gid)) {
        seenGids.add(gid);
        tabs.push({ index, gid, name });
      }
    }
  }

  tabs.sort((a, b) => a.index - b.index);
  return { documentTitle, tabs };
}

/**
 * Checks whether a value looks like a student ID (NIM) rather than a person's name.
 */
export function isLikelyNim(val: string): boolean {
  const clean = val.trim();
  if (!clean) return false;
  // Matches numeric NIMs (e.g. 21114012610054) or alphanumeric UNS NIMs (e.g. M0524001, L0124010)
  return /^[A-Z]{0,2}\d{6,18}$/i.test(clean);
}

/**
 * Normalizes ALL-CAPS student names into readable Title Case while preserving initials like "M."
 */
export function normalizeStudentName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Only convert if the string is mostly uppercase
  const upperCount = (trimmed.match(/[A-Z]/g) || []).length;
  const lowerCount = (trimmed.match(/[a-z]/g) || []).length;
  if (lowerCount > upperCount) {
    return trimmed;
  }

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.includes(".")) {
        return word
          .split(".")
          .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ""))
          .join(".");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Parses a single tab's CSV into either structured study/project groups or a class student directory.
 */
export function parseSheetTabCsv(tabName: string, gid: string, csv: string): ParsedClassTab {
  const rows = parseCsvLines(csv);
  if (rows.length === 0) {
    return {
      gid,
      name: tabName,
      kind: "groups",
      sharedLink: null,
      teams: [],
      directory: [],
      totalStudents: 0,
    };
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const colGroup = headers.findIndex((h) => /kelompok|group|team|tim\b/i.test(h));
  const colCategory = headers.findIndex((h) => /kategori|jenis|gender/i.test(h));
  const colRole = headers.findIndex((h) => /peran|role|jabatan|posisi/i.test(h));
  const colStatus = headers.findIndex((h) => /status|keterangan|pj/i.test(h));

  // Detect URL in header (such as Calc - Presentation where column header is a Google Drive URL)
  const colUrlHeader = headers.findIndex((h) => /^https?:\/\//i.test(h));
  const sharedLink = colUrlHeader !== -1 ? headers[colUrlHeader] : null;

  // Topic column: explicit "topik/judul/materi" header, OR the column whose header was a Drive URL
  let colTopic = headers.findIndex((h) => /topik|judul|materi|proyek|project|tema/i.test(h));
  if (colTopic === -1 && colUrlHeader !== -1) {
    colTopic = colUrlHeader;
  }

  const colLink = headers.findIndex(
    (h, idx) => idx !== colUrlHeader && /link|url|drive|repo|pengumpulan/i.test(h),
  );

  // Detect NIM & Name columns (and auto-correct if the spreadsheet swapped their headers)
  let colNim = headers.findIndex((h) => /\bnim\b|nomor\s*induk/i.test(h));
  let colName = headers.findIndex((h) => /nama|mahasiswa|anggota/i.test(h));

  if (colNim !== -1 && colName !== -1 && dataRows.length > 0) {
    const sampleRow = dataRows.find((r) => (r[colNim] && r[colNim].trim()) || (r[colName] && r[colName].trim()));
    if (sampleRow) {
      const valAtNim = sampleRow[colNim] ?? "";
      const valAtName = sampleRow[colName] ?? "";
      if (isLikelyNim(valAtName) && !isLikelyNim(valAtNim)) {
        const tmp = colNim;
        colNim = colName;
        colName = tmp;
      }
    }
  }

  const isDirectoryTab =
    colGroup === -1 &&
    (/full\s*list|daftar|mahasiswa|anggota\s*kelas/i.test(tabName) || (colNim !== -1 && colName !== -1));

  if (isDirectoryTab) {
    const directory: ClassStudentDirectoryItem[] = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rawNim = colNim !== -1 ? (row[colNim] ?? "").trim() : "";
      const rawName = colName !== -1 ? (row[colName] ?? "").trim() : "";
      if (!rawNim && !rawName) continue;

      const statusVal = colStatus !== -1 ? (row[colStatus] ?? "").trim() : "";
      const noVal = parseInt(row[0] ?? "", 10);
      const isPjKelas = /pj\s*kelas|ketua\s*kelas|komti/i.test(statusVal);
      const pjMatkulMatch = statusVal.match(/pj\s*matkul\s*[-:]?\s*(.+)/i);
      const pjMatkul = pjMatkulMatch?.[1]?.trim() || null;

      directory.push({
        no: !Number.isNaN(noVal) ? noVal : directory.length + 1,
        nim: rawNim,
        name: normalizeStudentName(rawName),
        status: statusVal || null,
        isPjKelas,
        pjMatkul,
      });
    }

    return {
      gid,
      name: tabName,
      kind: "directory",
      sharedLink,
      teams: [],
      directory,
      totalStudents: directory.length,
    };
  }

  // Group / Team tab parsing
  const teamsMap = new Map<string, ClassTeam>();
  let totalStudents = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rawGroup = colGroup !== -1 ? (row[colGroup] ?? "").trim() : "";
    if (!rawGroup) continue;

    const rawNim = colNim !== -1 ? (row[colNim] ?? "").trim() : "";
    const rawName = colName !== -1 ? (row[colName] ?? "").trim() : "";
    const rawRole = colRole !== -1 ? (row[colRole] ?? "").trim() : "";
    const rawCategory = colCategory !== -1 ? (row[colCategory] ?? "").trim() : "";
    const rawTopic = colTopic !== -1 ? (row[colTopic] ?? "").trim() : "";
    const rawLink = colLink !== -1 ? (row[colLink] ?? "").trim() : "";

    let team = teamsMap.get(rawGroup);
    if (!team) {
      team = {
        id: `${gid}-${rawGroup.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: rawGroup,
        category: rawCategory || null,
        topic: rawTopic && !/^https?:\/\//i.test(rawTopic) ? rawTopic : null,
        link: /^https?:\/\//i.test(rawLink)
          ? rawLink
          : /^https?:\/\//i.test(rawTopic)
            ? rawTopic
            : sharedLink,
        members: [],
        totalSlots: 0,
        emptySlots: 0,
      };
      teamsMap.set(rawGroup, team);
    } else {
      if (!team.category && rawCategory) team.category = rawCategory;
      if (!team.topic && rawTopic && !/^https?:\/\//i.test(rawTopic)) team.topic = rawTopic;
      if (!team.link && /^https?:\/\//i.test(rawLink)) team.link = rawLink;
    }

    team.totalSlots += 1;

    if (rawName || rawNim) {
      const normalizedRole: "Ketua" | "Anggota" = /ketua|leader|koordinator/i.test(rawRole)
        ? "Ketua"
        : "Anggota";
      team.members.push({
        nim: rawNim,
        name: normalizeStudentName(rawName),
        role: normalizedRole,
        rawRole: rawRole || undefined,
      });
      totalStudents += 1;
    } else {
      team.emptySlots += 1;
    }
  }

  return {
    gid,
    name: tabName,
    kind: "groups",
    sharedLink,
    teams: Array.from(teamsMap.values()),
    directory: [],
    totalStudents,
  };
}

/**
 * Finds all team assignments across all parsed tabs for a specific student (by NIM or name).
 */
export function buildStudentTeamSummary(
  tabs: ParsedClassTab[],
  studentNim?: string | null,
  studentName?: string | null,
): StudentTeamAssignment[] {
  const cleanNim = (studentNim ?? "").trim().toLowerCase();
  const cleanName = (studentName ?? "").trim().toLowerCase();
  if (!cleanNim && !cleanName) return [];

  const nameTokens = cleanName
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  const assignments: StudentTeamAssignment[] = [];

  for (const tab of tabs) {
    if (tab.kind !== "groups") continue;

    for (const team of tab.teams) {
      const matchedMember = team.members.find((m) => {
        if (cleanNim && m.nim.toLowerCase() === cleanNim) return true;
        if (!cleanName) return false;
        const memberNameLower = m.name.toLowerCase();
        if (memberNameLower === cleanName) return true;
        if (cleanName.length >= 4 && memberNameLower.includes(cleanName)) return true;
        if (nameTokens.length >= 2 && nameTokens.every((tok) => memberNameLower.includes(tok))) {
          return true;
        }
        return false;
      });

      if (matchedMember) {
        assignments.push({
          tabGid: tab.gid,
          tabName: tab.name,
          teamName: team.name,
          role: matchedMember.role,
          topic: team.topic,
          link: team.link,
          memberCount: team.members.length,
        });
        break;
      }
    }
  }

  return assignments;
}

