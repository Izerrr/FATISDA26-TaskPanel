import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface MergeAccountUpdates {
  googleId?: string | null;
  email?: string | null;
  nim?: string | null;
  googleAvatar?: string | null;
  name?: string | null;
  avatar?: string | null;
  discordId?: string | null;
  discordUsername?: string | null;
  discordAvatar?: string | null;
}

/**
 * Reassigns all foreign-key relations from `sourceUserId` to `targetUserId`
 * within a Prisma transaction, preserving user task progress and group memberships,
 * then removes the duplicate source user record and optionally updates target fields.
 */
export async function mergeUserAccounts(
  tx: Prisma.TransactionClient,
  sourceUserId: string,
  targetUserId: string,
  targetUpdates?: MergeAccountUpdates,
): Promise<void> {
  if (!sourceUserId || !targetUserId || sourceUserId === targetUserId) {
    return;
  }

  // 1. Migrate non-unique ownership & authorship references
  await tx.task.updateMany({
    where: { createdById: sourceUserId },
    data: { createdById: targetUserId },
  });

  await tx.task.updateMany({
    where: { assignedTo: sourceUserId },
    data: { assignedTo: targetUserId },
  });

  await tx.courseVault.updateMany({
    where: { updatedById: sourceUserId },
    data: { updatedById: targetUserId },
  });

  await tx.taskComment.updateMany({
    where: { authorId: sourceUserId },
    data: { authorId: targetUserId },
  });

  await tx.taskActivity.updateMany({
    where: { userId: sourceUserId },
    data: { userId: targetUserId },
  });

  await tx.announcement.updateMany({
    where: { authorId: sourceUserId },
    data: { authorId: targetUserId },
  });

  await tx.courseDiscussion.updateMany({
    where: { authorId: sourceUserId },
    data: { authorId: targetUserId },
  });

  await tx.discussionReply.updateMany({
    where: { authorId: sourceUserId },
    data: { authorId: targetUserId },
  });

  await tx.feedback.updateMany({
    where: { authorId: sourceUserId },
    data: { authorId: targetUserId },
  });

  // 2. Preserve per-user task progress without violating @@unique([taskId, userId])
  const sourceProgress = await tx.taskUserProgress.findMany({
    where: { userId: sourceUserId },
    select: { taskId: true, status: true },
  });
  if (sourceProgress.length > 0) {
    await tx.taskUserProgress.createMany({
      data: sourceProgress.map((p) => ({
        taskId: p.taskId,
        userId: targetUserId,
        status: p.status,
      })),
      skipDuplicates: true,
    });
    await tx.taskUserProgress.deleteMany({
      where: { userId: sourceUserId },
    });
  }

  // 3. Preserve group task memberships without violating @@unique([taskId, userId])
  const sourceMemberships = await tx.taskMember.findMany({
    where: { userId: sourceUserId },
    select: { taskId: true, role: true },
  });
  if (sourceMemberships.length > 0) {
    await tx.taskMember.createMany({
      data: sourceMemberships.map((m) => ({
        taskId: m.taskId,
        userId: targetUserId,
        role: m.role,
      })),
      skipDuplicates: true,
    });
    await tx.taskMember.deleteMany({
      where: { userId: sourceUserId },
    });
  }

  // 4. Delete duplicate user first so unique fields (email, googleId, discordId) can move cleanly
  await tx.user.deleteMany({
    where: { id: sourceUserId },
  });

  // 5. Apply merged metadata to target user
  if (targetUpdates && Object.keys(targetUpdates).length > 0) {
    await tx.user.update({
      where: { id: targetUserId },
      data: {
        ...targetUpdates,
        hasAccessedApp: true,
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      },
    });
  }
}

export async function mergeUserAccountsTransaction(
  sourceUserId: string,
  targetUserId: string,
  targetUpdates?: MergeAccountUpdates,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await mergeUserAccounts(tx, sourceUserId, targetUserId, targetUpdates);
  });
}
