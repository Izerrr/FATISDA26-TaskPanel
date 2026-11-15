import { describe, it, expect, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { mergeUserAccounts } from "../user-merge";

describe("mergeUserAccounts (atomic account linking)", () => {
  function createMockTx() {
    return {
      task: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      courseVault: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      taskComment: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
      taskActivity: { updateMany: vi.fn().mockResolvedValue({ count: 3 }) },
      announcement: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      courseDiscussion: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      discussionReply: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      feedback: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      taskUserProgress: {
        findMany: vi.fn().mockResolvedValue([{ taskId: "task-1", status: "IN_PROGRESS" }]),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      taskMember: {
        findMany: vi.fn().mockResolvedValue([{ taskId: "group-1", role: "MEMBER" }]),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({ id: "target-user" }),
      },
    };
  }

  it("no-ops when sourceUserId equals targetUserId", async () => {
    const tx = createMockTx();
    await mergeUserAccounts(tx as unknown as Prisma.TransactionClient, "same", "same");
    expect(tx.task.updateMany).not.toHaveBeenCalled();
    expect(tx.user.deleteMany).not.toHaveBeenCalled();
  });

  it("migrates all relations, preserves progress and group memberships, deletes source, and updates target", async () => {
    const tx = createMockTx();

    await mergeUserAccounts(tx as unknown as Prisma.TransactionClient, "google_123", "discord_999", {
      googleId: "123",
      email: "mhs@student.uns.ac.id",
      nim: "L0124001",
    });

    expect(tx.task.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.courseVault.updateMany).toHaveBeenCalledWith({
      where: { updatedById: "google_123" },
      data: { updatedById: "discord_999" },
    });
    expect(tx.taskComment.updateMany).toHaveBeenCalledWith({
      where: { authorId: "google_123" },
      data: { authorId: "discord_999" },
    });
    expect(tx.taskActivity.updateMany).toHaveBeenCalledWith({
      where: { userId: "google_123" },
      data: { userId: "discord_999" },
    });
    expect(tx.announcement.updateMany).toHaveBeenCalledWith({
      where: { authorId: "google_123" },
      data: { authorId: "discord_999" },
    });
    expect(tx.courseDiscussion.updateMany).toHaveBeenCalledWith({
      where: { authorId: "google_123" },
      data: { authorId: "discord_999" },
    });
    expect(tx.discussionReply.updateMany).toHaveBeenCalledWith({
      where: { authorId: "google_123" },
      data: { authorId: "discord_999" },
    });
    expect(tx.feedback.updateMany).toHaveBeenCalledWith({
      where: { authorId: "google_123" },
      data: { authorId: "discord_999" },
    });

    expect(tx.taskUserProgress.createMany).toHaveBeenCalledWith({
      data: [{ taskId: "task-1", userId: "discord_999", status: "IN_PROGRESS" }],
      skipDuplicates: true,
    });
    expect(tx.taskMember.createMany).toHaveBeenCalledWith({
      data: [{ taskId: "group-1", userId: "discord_999", role: "MEMBER" }],
      skipDuplicates: true,
    });

    expect(tx.user.deleteMany).toHaveBeenCalledWith({ where: { id: "google_123" } });
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "discord_999" },
        data: expect.objectContaining({
          googleId: "123",
          email: "mhs@student.uns.ac.id",
          nim: "L0124001",
          hasAccessedApp: true,
        }),
      }),
    );
  });
});
