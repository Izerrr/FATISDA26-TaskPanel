import { describe, expect, it } from "vitest";
import { parseExamCsv } from "../parse-exam";

describe("parseExamCsv", () => {
  const sampleCsv = `
,,,,,,,,,,,
,,B4-11,B4-12,Pasca 1301 (Lt.3),UPT TIK Lt 3,,,,,,,
Selasa,1,Pemrograman Berori...(3) (A),Fisika (1) (D),SD,Pemrograman Berori...(3) (C) dan (D),,,,,,,
13 Okt 2026,2,Pemrograman Berori...(3) (A),Fisika (1) (D),SD,Pemrograman Berori...(3) (C) dan (D),,,,,,,
,3,Basis Data (3) (A),,SD,,,,,,,,
`;

  it("should parse rooms, days, dates and merge contiguous exam slots", () => {
    const records = parseExamCsv(sampleCsv, "INFORMATIKA", "UTS");

    expect(records.length).toBeGreaterThan(0);

    // Pemrograman Berorientasi Objek for Kelas A (slots 1 & 2 merged)
    const pboA = records.find(
      (r) => r.courseName === "Pemrograman Berorientasi Objek" && r.kelas === "A",
    );
    expect(pboA).toBeDefined();
    expect(pboA?.room).toBe("B4-11");
    expect(pboA?.startTime).toBe("07:30");
    expect(pboA?.endTime).toBe("09:15");
    expect(pboA?.dayName).toBe("Selasa");
    expect(pboA?.semester).toBe(3);

    // Fisika for Kelas D (slots 1 & 2 merged)
    const fisikaD = records.find((r) => r.courseName === "Fisika" && r.kelas === "D");
    expect(fisikaD).toBeDefined();
    expect(fisikaD?.room).toBe("B4-12");
    expect(fisikaD?.startTime).toBe("07:30");
    expect(fisikaD?.endTime).toBe("09:15");

    // Combined classes: Pemrograman Berori...(3) (C) dan (D) should emit both C and D
    const pboC = records.find(
      (r) => r.courseName === "Pemrograman Berorientasi Objek" && r.kelas === "C",
    );
    const pboD = records.find(
      (r) => r.courseName === "Pemrograman Berorientasi Objek" && r.kelas === "D",
    );
    expect(pboC).toBeDefined();
    expect(pboD).toBeDefined();
    expect(pboC?.room).toBe("UPT TIK Lt 3");
    expect(pboD?.room).toBe("UPT TIK Lt 3");
  });

  it("should ignore SD room placeholder cells", () => {
    const records = parseExamCsv(sampleCsv, "INFORMATIKA", "UTS");
    const sdRecords = records.filter((r) => r.courseName === "SD");
    expect(sdRecords.length).toBe(0);
  });
});

