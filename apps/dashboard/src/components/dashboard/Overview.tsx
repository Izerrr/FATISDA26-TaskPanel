"use client";

import { Clock, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { SCHEDULE_DATA } from "../../lib/schedule-data";

export function Overview() {
  // Simulasi: Filter jadwal untuk hari "Senin" dan "Selasa" sebagai contoh "terdekat"
  // Di real app, kamu bisa bandingkan dengan new Date().getDay()
  const upcomingSchedules = SCHEDULE_DATA.filter((s) => s.day === "Senin" || s.day === "Selasa").slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Personal Tasks Done", val: "12", icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Active Class Tasks", val: "3", icon: Clock, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Nearing Deadline", val: "1", icon: AlertCircle, bg: "bg-rose-50", color: "text-rose-600" },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{stat.val}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardcoded Schedule List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">Upcoming Schedule</h3>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">Semester Gasal 2024/2025</span>
          </div>

          <div className="space-y-4">
            {upcomingSchedules.map((schedule) => (
              <div key={schedule.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all flex justify-between items-center group">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{schedule.courseName}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      {schedule.prodi} KLS {schedule.kelas}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> {schedule.time} <span className="text-slate-300">•</span> {schedule.room}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${schedule.day === "Senin" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}>{schedule.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global/Class Announcements */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-6">Class Notes</h3>
          <div className="flex-1 flex flex-col gap-3">
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-semibold text-blue-700">@SainsData-A</span> Jangan lupa besok ada kuis Pengantar Sains Data di R. Sidang 2.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700">@Informatika-B</span> Modul praktikum Jarkom sudah diupload di e-learning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
