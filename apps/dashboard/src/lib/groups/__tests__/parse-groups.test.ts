import { describe, expect, it } from "vitest";
import {
  buildStudentTeamSummary,
  extractTabsFromSheetHtml,
  parseSheetTabCsv,
} from "../parse-groups";

describe("parse-groups", () => {
  it("extracts document title and tabs from Google Sheets bootstrap HTML", () => {
    const sampleHtml = `
      <html>
        <head><title>Class B Infor&#39;26 - Teams - Google Spreadsheet</title></head>
        <body>
          <script>
            var data = [
              [21350203,"[0,0,\\"0\\",[{\\"1\\":[[0,0,\\"Full List\\"]]}]"],
              [21350203,"[1,0,\\"1897715766\\",[{\\"1\\":[[0,0,\\"Statprob\\"]]}]"],
              [21350203,"[2,0,\\"69044639\\",[{\\"1\\":[[0,0,\\"Calc - Presentation\\"]]}]"]
            ];
          </script>
        </body>
      </html>
    `;

    const result = extractTabsFromSheetHtml(sampleHtml);
    expect(result.documentTitle).toBe("Class B Infor'26 - Teams");
    expect(result.tabs).toEqual([
      { index: 0, gid: "0", name: "Full List" },
      { index: 1, gid: "1897715766", name: "Statprob" },
      { index: 2, gid: "69044639", name: "Calc - Presentation" },
    ]);
  });

  it("auto-detects swapped Nama & NIM columns in Full List directory tab and extracts PJ status", () => {
    const fullListCsv = [
      "No,Nama,NIM,Status",
      "1,21114012610002,ADNAN AZARIA,",
      "5,21114012610018,Ardina Nisrina Dahayu,PJ Matkul - Konsep Pemrograman",
      "12,21114012610050,Farrel Hyuga Adeyahyan,PJ Kelas",
    ].join("\n");

    const parsed = parseSheetTabCsv("Full List", "0", fullListCsv);
    expect(parsed.kind).toBe("directory");
    expect(parsed.directory).toHaveLength(3);
    expect(parsed.directory[0]).toEqual({
      no: 1,
      nim: "21114012610002",
      name: "Adnan Azaria",
      status: null,
      isPjKelas: false,
      pjMatkul: null,
    });
    expect(parsed.directory[1].pjMatkul).toBe("Konsep Pemrograman");
    expect(parsed.directory[2].isPjKelas).toBe(true);
  });

  it("parses standard team tabs and extracts URL in header as sharedLink + cell as topic", () => {
    const calcCsv = [
      "No,Kelompok,https://drive.google.com/drive/folders/1S4gdxlWbqH-WM-1fN5ZBvXkRyqPUhLjj,NIM,Nama Mahasiswa,Peran",
      "1,Tim 1,Integral tak tentu,21114012610062,Hizkia Dwi Santoso,Ketua",
      "2,Tim 1,Integral tak tentu,21114012610142,Syams La Tahzan Rubiakto,Anggota",
      "7,Tim 2,Integral tentu,21114012610006,Aisyah Farania Rinjani Siregar,Ketua",
    ].join("\n");

    const parsed = parseSheetTabCsv("Calc - Presentation", "69044639", calcCsv);
    expect(parsed.kind).toBe("groups");
    expect(parsed.sharedLink).toBe("https://drive.google.com/drive/folders/1S4gdxlWbqH-WM-1fN5ZBvXkRyqPUhLjj");
    expect(parsed.teams).toHaveLength(2);
    expect(parsed.teams[0].name).toBe("Tim 1");
    expect(parsed.teams[0].topic).toBe("Integral tak tentu");
    expect(parsed.teams[0].link).toBe("https://drive.google.com/drive/folders/1S4gdxlWbqH-WM-1fN5ZBvXkRyqPUhLjj");
    expect(parsed.teams[0].members[0].role).toBe("Ketua");
    expect(parsed.teams[0].members[1].role).toBe("Anggota");
  });

  it("tracks empty slots when template groups have no members filled yet", () => {
    const indoCsv = [
      "No,Kelompok,Kategori,NIM,Nama Mahasiswa,Topik Artikel,Peran",
      "1,Kelompok 01,Mahasiswi,,,,Ketua",
      "2,Kelompok 01,Mahasiswi,,,,Anggota",
      "3,Kelompok 01,Mahasiswi,,,,Anggota",
    ].join("\n");

    const parsed = parseSheetTabCsv("Indonesian - Artikel Ilmiah", "1260541291", indoCsv);
    expect(parsed.teams).toHaveLength(1);
    expect(parsed.teams[0].category).toBe("Mahasiswi");
    expect(parsed.teams[0].totalSlots).toBe(3);
    expect(parsed.teams[0].emptySlots).toBe(3);
    expect(parsed.teams[0].members).toHaveLength(0);
  });

  it("builds cross-tab student team summary by NIM or Name", () => {
    const statprobTab = parseSheetTabCsv(
      "Statprob",
      "1897715766",
      [
        "No,Kelompok,NIM,Nama Mahasiswa,Peran",
        "1,Team 01,21114012610054,Gusti Zaki Fernanda,Anggota",
        "2,Team 01,21114012610138,Shabrillah Rifai Akbar,Anggota",
      ].join("\n"),
    );

    const calcTab = parseSheetTabCsv(
      "Calc - Presentation",
      "69044639",
      [
        "No,Kelompok,Topik,NIM,Nama Mahasiswa,Peran",
        "1,Tim 4,Aturan Rantai,21114012610138,Shabrillah Rifai Akbar,Ketua",
      ].join("\n"),
    );

    const summaryByNim = buildStudentTeamSummary([statprobTab, calcTab], "21114012610138", null);
    expect(summaryByNim).toHaveLength(2);
    expect(summaryByNim[0].teamName).toBe("Team 01");
    expect(summaryByNim[1].teamName).toBe("Tim 4");
    expect(summaryByNim[1].role).toBe("Ketua");

    const summaryByName = buildStudentTeamSummary([statprobTab, calcTab], null, "Shabrillah Rifai");
    expect(summaryByName).toHaveLength(2);
  });
});

