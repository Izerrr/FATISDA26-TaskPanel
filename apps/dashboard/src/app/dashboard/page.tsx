import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DashboardShell />
    </Suspense>
  );
}

function Skeleton() {
  return (
    <div className="flex h-screen bg-liquid-bg">
      <div className="w-20 animate-pulse bg-liquid-surface-solid" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 animate-pulse bg-liquid-surface-solid" />
        <div className="flex-1 p-6">
          <div className="h-32 animate-pulse rounded-3xl bg-liquid-surface-solid" />
        </div>
      </div>
    </div>
  );
}
