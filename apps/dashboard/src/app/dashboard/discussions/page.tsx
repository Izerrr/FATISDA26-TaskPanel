"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function DiscussionsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "discussions");
    router.replace(`/dashboard/class?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-400" />
      <p className="text-xs font-medium">Mengalihkan ke Forum di Ruang Kelas...</p>
    </div>
  );
}

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-white/50 dark:bg-slate-900/50" />}>
      <DiscussionsRedirect />
    </Suspense>
  );
}
