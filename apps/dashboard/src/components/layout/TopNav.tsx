import { Menu, Moon, Plus, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { ProfileMenu } from "./ProfileMenu";
import { GlobalSearch } from "./GlobalSearch";
import { AnnouncementPopover } from "./AnnouncementPopover";

interface TopNavProps {
  onToggleMobileMenu?: () => void;
  onNewTask?: () => void;
}

export function TopNav({ onToggleMobileMenu, onNewTask }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-liquid-border bg-white/90 px-4 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 md:px-6">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-liquid-text-secondary transition hover:bg-black/[0.04] hover:text-liquid-text dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-liquid-text-tertiary dark:text-slate-400">FATISDA 2026</p>
          <h1 className="text-sm font-bold text-liquid-text dark:text-slate-100">Task &amp; Schedule Workspace</h1>
        </div>

        <div className="md:hidden">
          <span className="text-sm font-bold text-liquid-text dark:text-slate-100">TaskPanel</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <GlobalSearch />

        {onNewTask && (
          <button
            type="button"
            onClick={onNewTask}
            className="flex h-9 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl bg-liquid-accent px-3 text-xs font-bold text-white shadow-xs transition hover:brightness-95 active:scale-95"
            title="Tambah Tugas Baru"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tugas Baru</span>
          </button>
        )}

        {/* Animated Dark Mode Toggle Button */}
        <button
          type="button"
          data-theme-anim
          onClick={toggleTheme}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.03] text-liquid-text-secondary transition-all duration-300 hover:bg-black/[0.06] hover:text-liquid-text active:scale-90 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-300 overflow-hidden"
          aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
          title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
        >
          <div className="relative h-4 w-4">
            <Sun className={`absolute inset-0 h-4 w-4 text-amber-400 transition-all duration-500 ease-out transform ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
            <Moon className={`absolute inset-0 h-4 w-4 text-slate-600 transition-all duration-500 ease-out transform ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
          </div>
        </button>

        {/* Interactive Announcement & Notification Popover */}
        <AnnouncementPopover />

        {/* User Profile Menu */}
        <ProfileMenu />
      </div>
    </header>
  );
}
