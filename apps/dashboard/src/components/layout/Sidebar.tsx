"use client";

import { LayoutGrid, Users, Clock, BookOpen, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  courses: Array<{ id: string; code: string; name: string }>;
  // classmates: Array<User>; -> Nanti bisa ditambahkan saat API member siap
}

export function Sidebar({ courses }: SidebarProps) {
  return (
    <aside className="w-72 border-r border-slate-200 bg-white flex flex-col h-full overflow-y-auto hidden md:flex">
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
          <BookOpen className="w-4 h-4" />
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">TaskPanel</span>
      </div>

      {/* Courses / Projects Section */}
      <div className="px-4 py-4">
        <h3 className="text-xs font-semibold text-slate-800 mb-3 px-2">Mata Kuliah Aktif</h3>
        <div className="space-y-1">
          {courses.length > 0 ? (
            courses.map((course) => (
              <button key={course.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors text-sm text-left font-medium">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                <span className="truncate">{course.name}</span>
              </button>
            ))
          ) : (
            <p className="px-3 text-xs text-slate-400 italic">Menunggu sinkronisasi matkul...</p>
          )}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="px-4 py-4 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-800 mb-3 px-2">Teman Kelas</h3>
        <div className="space-y-1">
          {/* Kosong untuk sementara, dirender dari API later */}
          <p className="px-3 text-xs text-slate-400 italic">Memuat anggota kelas...</p>
        </div>
      </div>

      {/* Time Tracker Widget */}
      <div className="px-4 py-4 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-800 mb-3 px-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> Time
        </h3>
        <div className="mx-2 mt-2 border border-slate-200 rounded-xl p-4 bg-slate-50 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">TOTAL HOURS</p>
          <p className="text-2xl font-bold text-slate-800">
            -- <span className="text-sm font-medium text-slate-500">hours</span>
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">Menunggu data aktivitas</p>
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="mt-auto p-4 border-t border-slate-100">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
