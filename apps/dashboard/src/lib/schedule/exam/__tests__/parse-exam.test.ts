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

  it("should correctly map MKU rombel tokens: A1->A, A2->B, B1->C, B2->D", () => {
    const mkuCsv = `
,,,,,,,,,,,
,,B4-11,B4-12,Pasca 1301 (Lt.3),Pasca 1302,,,,,,,
Senin,1,Pendidikan Pancasila (3) (A1),Pendidikan Pancasila (3) (A2),Pendidikan Pancasila (3) (B1),Pendidikan Pancasila (3) (B2),,,,,,,
19 Okt 2026,2,Bahasa Indonesia (1) (A1) dan (A2),Bahasa Indonesia (1) (B1) dan (B2),,,,,,,,,
`;
    const records = parseExamCsv(mkuCsv, "INFORMATIKA", "UTS");

    // A1 -> A
    const pancasilaA = records.find((r) => r.courseName === "Pendidikan Pancasila" && r.kelas === "A");
    expect(pancasilaA).toBeDefined();
    expect(pancasilaA?.room).toBe("B4-11");

    // A2 -> B
    const pancasilaB = records.find((r) => r.courseName === "Pendidikan Pancasila" && r.kelas === "B");
    expect(pancasilaB).toBeDefined();
    expect(pancasilaB?.room).toBe("B4-12");

    // B1 -> C
    const pancasilaC = records.find((r) => r.courseName === "Pendidikan Pancasila" && r.kelas === "C");
    expect(pancasilaC).toBeDefined();
    expect(pancasilaC?.room).toBe("Pasca 1301 (Lt.3)");

    // B2 -> D
    const pancasilaD = records.find((r) => r.courseName === "Pendidikan Pancasila" && r.kelas === "D");
    expect(pancasilaD).toBeDefined();
    expect(pancasilaD?.room).toBe("Pasca 1302");

    // Combined MKU (A1) dan (A2) -> Kelas A & B
    const bindoA = records.find((r) => r.courseName === "Bahasa Indonesia" && r.kelas === "A");
    const bindoB = records.find((r) => r.courseName === "Bahasa Indonesia" && r.kelas === "B");
    expect(bindoA).toBeDefined();
    expect(bindoB).toBeDefined();

    // Combined MKU (B1) dan (B2) -> Kelas C & D
    const bindoC = records.find((r) => r.courseName === "Bahasa Indonesia" && r.kelas === "C");
    const bindoD = records.find((r) => r.courseName === "Bahasa Indonesia" && r.kelas === "D");
    expect(bindoC).toBeDefined();
    expect(bindoD).toBeDefined();
  });

  it("should sort records starting from Senin (Monday) even if Tuesday date is earlier", () => {
    const multiDayCsv = `
,,,,,,,,,,,
,,B4-11,B4-12,,,,,,,,,
Selasa,1,Basis Data (3) (A),,,,,,,,,,,
13 Okt 2026,,,,,,,,,,,,,
Senin,1,Kalkulus I (1) (A),,,,,,,,,,,
19 Okt 2026,,,,,,,,,,,,,
`;
    const records = parseExamCsv(multiDayCsv, "INFORMATIKA", "UTS");
    expect(records.length).toBe(2);

    // First item must be from Senin (Monday), even though 13 Okt (Selasa) is numerically before 19 Okt
    expect(records[0].dayName).toBe("Senin");
    expect(records[0].courseName).toBe("Kalkulus I");
    expect(records[1].dayName).toBe("Selasa");
    expect(records[1].courseName).toBe("Basis Data");
  });
});

