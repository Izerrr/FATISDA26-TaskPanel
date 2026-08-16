export interface Task {
  id: string;
  guildId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  assignedTo: string | null;
  assignee: { id: string; username: string; avatar: string | null } | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const COLUMNS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export const COLUMN_META: Record<string, { label: string; badge: string; border: string }> = {
  TODO: { label: "Belum Dimulai", badge: "bg-black/[0.04] text-liquid-text-secondary", border: "border-black/[0.04]" },
  IN_PROGRESS: { label: "Dikerjakan", badge: "bg-liquid-accent/10 text-liquid-accent", border: "border-liquid-accent/20" },
  REVIEW: { label: "Menunggu Review", badge: "bg-liquid-warning/10 text-liquid-warning", border: "border-liquid-warning/20" },
  DONE: { label: "Selesai", badge: "bg-liquid-success/10 text-liquid-success", border: "border-liquid-success/20" },
};
