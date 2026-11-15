export interface TaskAccessSubject {
  scope: string;
  createdById: string;
  assignedTo?: string | null;
  members?: Array<{ userId: string }>;
}

export const PRIVILEGED_TASK_ROLES = [
  "ADMIN",
  "OWNER",
  "KETUA_ANGKATAN",
  "PJ_KELAS",
  "PJ_MATKUL",
] as const;

export function hasPrivilegedTaskRole(roles: readonly string[] = []): boolean {
  return roles.some((r) => (PRIVILEGED_TASK_ROLES as readonly string[]).includes(String(r)));
}

/**
 * Checks whether an authenticated user is authorized to view, comment on, or read activity for a task.
 */
export function canAccessTask(task: TaskAccessSubject, userId: string): boolean {
  if (!userId) {
    return false;
  }

  if (task.scope === "PERSONAL") {
    return task.createdById === userId || task.assignedTo === userId;
  }

  if (task.scope === "GROUP") {
    return (
      task.createdById === userId ||
      Boolean(task.members?.some((member) => member.userId === userId))
    );
  }

  return true;
}

/**
 * Checks whether an authenticated user may add, toggle, reorder, or delete subtasks on a task.
 * CLASS subtasks are shared across the class so only managers/PJ roles may mutate them.
 */
export function canManageTaskSubtasks(
  task: TaskAccessSubject,
  userId: string,
  roles: readonly string[] = [],
): boolean {
  if (!userId) return false;
  if (task.scope === "CLASS") {
    return hasPrivilegedTaskRole(roles);
  }
  return canAccessTask(task, userId);
}

/**
 * Detects Prisma missing-table error (P2021) so core endpoints remain resilient before db push runs.
 */
export function isMissingTableError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2021",
  );
}
