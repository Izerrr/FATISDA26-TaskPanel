import { getDueUrgency, formatDueDate } from "@/lib/due-date";

interface Props {
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
}

export function TaskDueBadge({ dueDate, status }: Props) {
  const urgency = getDueUrgency(dueDate, status);
  const label = formatDueDate(dueDate);

  const styles = {
    none: "bg-fsd-surface text-fsd-muted",
    onTrack: "bg-fsd-accent/20 text-fsd-accent",
    dueSoon: "bg-fsd-gold/20 text-fsd-gold",
    overdue: "bg-fsd-alert/20 text-fsd-alert",
  };

  return (
    <span className={`fsd-meta px-2 py-0.5 rounded-sm text-[10px] ${styles[urgency]}`}>
      {label}
    </span>
  );
}
