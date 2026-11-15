import { describe, expect, it } from "vitest";
import {
  buildStudyTaskPresetForExam,
  findMatchingVaultForExam,
  getSafeExamMaterialLinks,
  normalizeExamCourseName,
} from "../exam-readiness";

describe("exam-readiness helpers", () => {
  it("normalizes exam course names by stripping parenthetical codes", () => {
    expect(normalizeExamCourseName("Pemrograman Web (IF-201)")).toBe("pemrograman web");
  });

  it("matches Course Vault entries by exact or partial course name and filters unsafe URLs", () => {
    const vaults = [
      {
        courseId: "c-web",
        courseName: "Pemrograman Web",
        driveUrl: "https://drive.google.com/drive/folders/abc",
        modulUrl: "javascript:alert(1)",
        silabusUrl: "docs.uns.ac.id/silabus.pdf",
      },
    ];

    const matched = findMatchingVaultForExam(vaults, "Pemrograman Web (Kelas A)");
    expect(matched?.courseId).toBe("c-web");

    const links = getSafeExamMaterialLinks(vaults, "Pemrograman Web");
    expect(links).toEqual({
      courseId: "c-web",
      driveUrl: "https://drive.google.com/drive/folders/abc",
      modulUrl: null,
      silabusUrl: "https://docs.uns.ac.id/silabus.pdf",
    });
  });

  it("builds a PERSONAL study task preset targeted at H-1 20:00 WIB for upcoming exams", () => {
    const preset = buildStudyTaskPresetForExam({
      type: "UAS",
      courseName: "Struktur Data",
      date: "2099-12-20T00:00:00.000Z",
      dayName: "Minggu",
      dateStr: "20 Des 2099",
      startTime: "09:00",
      endTime: "10:30",
      room: "R.401",
    });

    expect(preset.scope).toBe("PERSONAL");
    expect(preset.title).toBe("Persiapan UAS: Struktur Data");
    expect(preset.courseName).toBe("Struktur Data");
    expect(preset.dueDate).toBe("2099-12-19T20:00");
    expect(preset.description).toContain("Ruang R.401");
  });
});
