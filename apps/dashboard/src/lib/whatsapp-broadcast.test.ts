import { describe, expect, it } from "vitest";
import {
  buildWhatsAppShareUrl,
  detectDefaultTiming,
  generateCourseBroadcast,
  generateDaySummaryBroadcast,
} from "./whatsapp-broadcast";
import { parseGoogleSheetsUrl } from "./settings-shared";
import { resolveCampusBuilding } from "./campus-buildings";

describe("parseGoogleSheetsUrl", () => {
  it("extracts spreadsheetId and gid from full Google Sheets edit URL", () => {
    const res = parseGoogleSheetsUrl(
      "https://docs.google.com/spreadsheets/d/1zLsq5rA_s5no2oMH_hhyek1XA_f-0Mpc/edit?gid=524464654#gid=524464654",
    );
    expect(res).toEqual({
      spreadsheetId: "1zLsq5rA_s5no2oMH_hhyek1XA_f-0Mpc",
      gid: "524464654",
      hasExplicitGid: true,
    });
  });

  it("defaults gid to 0 when not present in URL", () => {
    const res = parseGoogleSheetsUrl(
      "https://docs.google.com/spreadsheets/d/1EYSnoXx4qwEs-g5_nrS-SFaGSYZY0e0I/edit?usp=sharing",
    );
    expect(res).toEqual({
      spreadsheetId: "1EYSnoXx4qwEs-g5_nrS-SFaGSYZY0e0I",
      gid: "0",
      hasExplicitGid: false,
    });
  });

  it("returns null for non-Google-Sheets strings", () => {
    expect(parseGoogleSheetsUrl("1zLsq5rA_s5no2oMH_hhyek1XA_f-0Mpc")).toBeNull();
  });
});

describe("whatsapp-broadcast", () => {
  it("generates exact PJ Matkul H-1 (tomorrow) casual English broadcast", () => {
    const text = generateCourseBroadcast({
      mode: "course",
      kelas: "B",
      courseName: "Bahasa Indonesia",
      startTime: "09:20",
      endTime: "11:05",
      room: "B4-11",
      timing: "tomorrow",
      tone: "casual_en",
    });

    expect(text).toContain("Hello, Members of Class B!");
    expect(text).toContain("Hope you're doing well and ready for tomorrow! ✨");
    expect(text).toContain("Just a little reminder, tomorrow we have:");
    expect(text).toContain("📚 Bahasa Indonesia");
    expect(text).toContain("⏰ 09.20 - 11.05");
    expect(text).toContain("📍 B4-11");
    expect(text).toContain("See you tomorrow, everyone! 👋");
  });

  it("generates Hari-H (today) casual English broadcast", () => {
    const text = generateCourseBroadcast({
      mode: "course",
      kelas: "B",
      courseName: "Bahasa Indonesia",
      startTime: "09:20",
      endTime: "11:05",
      room: "B4-11",
      timing: "today",
      tone: "casual_en",
    });

    expect(text).toContain("Hope you're doing well and ready for today's class! ✨");
    expect(text).toContain("Just a little reminder, today we have:");
    expect(text).toContain("See you in class, everyone! 👋");
  });

  it("includes lecturer and active tasks when enabled", () => {
    const text = generateCourseBroadcast({
      mode: "course",
      kelas: "A",
      courseName: "Struktur Data",
      startTime: "07:30",
      endTime: "10:10",
      room: "B.4.05",
      lecturer: "Dr. Sari",
      includeLecturer: true,
      includeTasks: true,
      tasks: [{ title: "Implementasi AVL Tree" }],
      timing: "tomorrow",
      tone: "casual_en",
    });

    expect(text).toContain("👨‍🏫 Dr. Sari");
    expect(text).toContain("📝 Task Reminder:");
    expect(text).toContain("• Implementasi AVL Tree");
  });

  it("detects today vs tomorrow timing accurately", () => {
    const fakeNow = new Date(2026, 3, 6, 10, 0, 0); // Monday Apr 6, 2026 (day=1)
    expect(detectDefaultTiming({ dayNum: 1 }, fakeNow)).toBe("today");
    expect(detectDefaultTiming({ dayNum: 2 }, fakeNow)).toBe("tomorrow");
  });

  it("generates full day summary broadcast", () => {
    const summary = generateDaySummaryBroadcast({
      kelas: "B",
      dayName: "Selasa",
      timing: "tomorrow",
      tone: "casual_en",
      items: [
        { courseName: "Bahasa Indonesia", startTime: "09:20", endTime: "11:05", room: "B4-11" },
        { courseName: "Basis Data", startTime: "13:00", endTime: "14:45", room: "B.4.04" },
      ],
    });
    expect(summary).toContain("1️⃣ 📚 Bahasa Indonesia");
    expect(summary).toContain("2️⃣ 📚 Basis Data");
  });

  it("builds valid wa.me share URL", () => {
    const url = buildWhatsAppShareUrl("Hello Class B!");
    expect(url).toBe("https://wa.me/?text=Hello%20Class%20B!");
  });
});

describe("resolveCampusBuilding", () => {
  it("resolves Pasca, UPT TIK, and Gedung B rooms", () => {
    expect(resolveCampusBuilding("Pasca 1312 (Lt.3)")?.code).toBe("PASCA");
    expect(resolveCampusBuilding("UPT TIK")?.code).toBe("UPT_TIK");
    expect(resolveCampusBuilding("B4-11")?.code).toBe("GEDUNG_B");
    expect(resolveCampusBuilding("B.4.05 (Lab. Dasar Informatika 2)")?.code).toBe("GEDUNG_B");
  });
});

