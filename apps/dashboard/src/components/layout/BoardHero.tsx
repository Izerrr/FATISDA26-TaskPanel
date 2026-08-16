"use client";

import { useTasks } from "@/hooks/useTasks";
import { useGuild } from "@/components/providers/GuildProvider";
import { useRole } from "@/hooks/useRole";
import { CheckCircle2, Clock, AlertCircle, ListTodo, Crown, Shield, User } from "lucide-react";

export function BoardHero() {
  const { selectedGuild } = useGuild();
  const { tasks } = useTasks(selectedGuild);
  const { role } = useRole();

  const stats = [
    { label: "Total", value: tasks.length, icon: ListTodo, color: "text-liquid-accent", bg: "bg-liquid-accent/10" },
    { label: "Selesai", value: tasks.filter((t) => t.status === "DONE").length, icon: CheckCircle2, color: "text-liquid-success", bg: "bg-liquid-success/10" },
    { label: "Berjalan", value: tasks.filter((t) => t.status === "IN_PROGRESS").length, icon: Clock, color: "text-liquid-warning", bg: "bg-liquid-warning/10" },
    { label: "Terlambat", value: tasks.filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < new Date()).length, icon: AlertCircle, color: "text-liquid-danger", bg: "bg-liquid-danger/10" },
  ];

  const roleConfig = {
    admin: { label: "PJ Kelas", icon: Crown, color: "bg-liquid-purple-soft text-liquid-purple" },
    moderator: { label: "PJ Matkul", icon: Shield, color: "bg-liquid-teal-soft text-liquid-teal" },
    member: { label: "Anggota", icon: User, color: "bg-black/[0.03] text-liquid-text-secondary" },
  };
  const rc = roleConfig[role];
  const RoleIcon = rc.icon;

  return (
    <div className="px-6 py-5">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-liquid-text">Papan Tugas</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${rc.color}`}>
              <RoleIcon className="h-3 w-3" />
              {rc.label}
            </span>
          </div>
          <p className="text-[13px] text-liquid-text-secondary">Kelola tugas FATISDA 2026</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 transition-shadow hover:shadow-glass-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-liquid-text-secondary">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-liquid-text">{s.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
