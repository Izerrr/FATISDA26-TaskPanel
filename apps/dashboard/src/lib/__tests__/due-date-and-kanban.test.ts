import { describe, expect, it } from "vitest";
import { getUrgency } from "../due-date";
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
});
