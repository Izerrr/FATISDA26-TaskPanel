"use client";

import { useState } from "react";
import { X, Calendar, BookOpen, Users, User } from "lucide-react";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRoles: string[]; // e.g., ["STUDENT", "PJ_KELAS"]
}

export function NewTaskModal({ isOpen, onClose, userRoles }: NewTaskModalProps) {
  const [scope, setScope] = useState<"PERSONAL" | "CLASS">("PERSONAL");
  const isPJ = userRoles.includes("PJ_KELAS") || userRoles.includes("PJ_MATKUL");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Create New Task</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          {/* Scope Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScope("PERSONAL")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-sm transition-all ${
                scope === "PERSONAL" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <User className="w-4 h-4" /> Tugas Pribadi
            </button>
            <button
              type="button"
              onClick={() => setScope("CLASS")}
              disabled={!isPJ}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-sm transition-all ${
                scope === "CLASS" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              } ${!isPJ && "opacity-50 cursor-not-allowed bg-slate-50"}`}
            >
              <Users className="w-4 h-4" /> Tugas Kelas {isPJ ? "" : "(PJ Only)"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Judul Tugas</label>
              <input
                type="text"
                placeholder="Contoh: Laporan Praktikum Modul 3"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Mata Kuliah</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none">
                    <option value="">Pilih Matkul...</option>
                    <option value="if-3">Basis Data</option>
                    <option value="sd-4">Pemrograman Python</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Deadline</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="date" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Deskripsi (Opsional)</label>
              <textarea
                placeholder="Tambahkan detail tugas..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Batal
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition-all">
              {scope === "CLASS" ? "Publish ke Kelas" : "Simpan Tugas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
