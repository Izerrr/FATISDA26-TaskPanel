import { describe, expect, it } from "vitest";
import {
  canAccessTask,
  canManageTaskSubtasks,
  hasPrivilegedTaskRole,
  isMissingTableError,
  PRIVILEGED_TASK_ROLES,
} from "../task-access";

describe("task-access helpers", () => {
  it("identifies privileged task roles", () => {
    expect(PRIVILEGED_TASK_ROLES).toContain("PJ_MATKUL");
    expect(hasPrivilegedTaskRole(["MAHASISWA"])).toBe(false);
    expect(hasPrivilegedTaskRole(["PJ_KELAS"])).toBe(true);
    expect(hasPrivilegedTaskRole(["ADMIN"])).toBe(true);
  });

  it("enforces PERSONAL task access and subtask management only for owner/assignee", () => {
    const personalTask = {
      scope: "PERSONAL" as const,
      createdById: "user-1",
      assignedTo: null,
      members: [],
    };

    expect(canAccessTask(personalTask, "user-1")).toBe(true);
    expect(canAccessTask(personalTask, "user-2")).toBe(false);

    expect(canManageTaskSubtasks(personalTask, "user-1", ["MAHASISWA"])).toBe(true);
    expect(canManageTaskSubtasks(personalTask, "user-2", ["ADMIN"])).toBe(false);
  });

  it("allows GROUP task access & subtask management for creator and members only", () => {
    const groupTask = {
      scope: "GROUP" as const,
      createdById: "leader-1",
      assignedTo: null,
      members: [{ userId: "member-2" }, { userId: "member-3" }],
    };

    expect(canAccessTask(groupTask, "leader-1")).toBe(true);
    expect(canAccessTask(groupTask, "member-2")).toBe(true);
    expect(canAccessTask(groupTask, "outsider-9")).toBe(false);

    expect(canManageTaskSubtasks(groupTask, "leader-1", ["MAHASISWA"])).toBe(true);
    expect(canManageTaskSubtasks(groupTask, "member-3", ["MAHASISWA"])).toBe(true);
    expect(canManageTaskSubtasks(groupTask, "outsider-9", ["ADMIN"])).toBe(false);
  });

  it("allows all authenticated users to read CLASS tasks, but restricts subtask edits to creator/privileged roles", () => {
    const classTask = {
      scope: "CLASS" as const,
      createdById: "pj-1",
      assignedTo: null,
      members: [],
    };

    expect(canAccessTask(classTask, "student-5")).toBe(true);
    expect(canManageTaskSubtasks(classTask, "student-5", ["MAHASISWA"])).toBe(false);
    expect(canManageTaskSubtasks(classTask, "pj-1", ["MAHASISWA"])).toBe(false);
    expect(canManageTaskSubtasks(classTask, "pj-other", ["PJ_MATKUL"])).toBe(true);
  });

  it("detects Prisma missing-table error code P2021 safely", () => {
    expect(isMissingTableError({ code: "P2021", message: "The table does not exist" })).toBe(true);
    expect(isMissingTableError({ code: "P2002", message: "Unique constraint" })).toBe(false);
    expect(isMissingTableError(new Error("random failure"))).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
  });
});
