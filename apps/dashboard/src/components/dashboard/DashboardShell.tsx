"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { BoardHero } from "@/components/layout/BoardHero";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { NewTaskSheet } from "@/components/kanban/NewTaskSheet";

export function DashboardShell() {
  const [showNewTask, setShowNewTask] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-liquid-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav onNewTask={() => setShowNewTask(true)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <BoardHero />
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
            <KanbanBoard />
          </div>
        </main>
      </div>
      {showNewTask && <NewTaskSheet onClose={() => setShowNewTask(false)} />}
    </div>
  );
}
