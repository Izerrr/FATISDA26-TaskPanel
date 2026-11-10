import { describe, expect, it } from "vitest";
import { getUrgency } from "../due-date";
import { getDayLabel, sortSchedules } from "../schedule-utils";
import { KANBAN_COLUMNS, KANBAN_META } from "../../components/kanban/types";

describe("Kanban columns & WAITING status", () => {
  it("orders columns as TODO, WAITING, IN_PROGRESS, NEED_REVIEW, DONE", () => {
    expect(KANBAN_COLUMNS).toEqual(["TODO", "WAITING", "IN_PROGRESS", "NEED_REVIEW", "DONE"]);
    expect(KANBAN_META.WAITING.label).toBe("Waiting List");
  });

  it("evaluates due urgency for WAITING and DONE tasks accurately", () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    expect(getUrgency(pastDate, "WAITING")).toBe("overdue");
    expect(getUrgency(soonDate, "WAITING")).toBe("dueSoon");
    expect(getUrgency(pastDate, "DONE")).toBe("onTrack");
  });

  it("sorts schedules chronologically by startTime and formats day labels for calendar", () => {
    const sorted = sortSchedules([
      { id: "2", prodi: "INFORMATIKA", kelas: "A", courseId: null, courseName: "Alpro", day: 1, startTime: "13:00", endTime: "14:40", room: "A1", lecturer: null },
      { id: "1", prodi: "INFORMATIKA", kelas: "A", courseId: null, courseName: "Kalkulus", day: 1, startTime: "07:30", endTime: "09:10", room: "A2", lecturer: null },
    ]);
    expect(sorted.map((s) => s.id)).toEqual(["1", "2"]);
    expect(getDayLabel(1)).toBe("Senin");
    expect(getDayLabel(7)).toBe("Minggu");
  });
});
