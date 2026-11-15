export interface TaskAccessSubject {
  scope: string;
  createdById: string;
  assignedTo?: string | null;
  members?: Array<{ userId: string }>;
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
