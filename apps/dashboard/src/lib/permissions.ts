import type { User } from "@/types";

/**
 * Memeriksa apakah user masuk menggunakan akun Google (@student.uns.ac.id).
 * User Google memiliki akses terbatas (hanya STUDENT, tidak dapat mengelola tugas kelas atau role).
 */
export function isGoogleUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.provider === "google" || user.id.startsWith("google_");
}

/**
 * Memeriksa apakah user dapat membuat atau mengubah tugas dengan scope CLASS.
 * User Google dibatasi hanya untuk tugas PERSONAL.
 */
export function canCreateClassTask(user: User | null | undefined): boolean {
  if (!user || isGoogleUser(user)) return false;
  return user.roles.some((role) => ["PJ_KELAS", "PJ_MATKUL", "ADMIN", "OWNER"].includes(role));
}

/**
 * Memeriksa apakah user dapat mengubah materi / vault mata kuliah.
 */
export function canEditVault(user: User | null | undefined): boolean {
  if (!user || isGoogleUser(user)) return false;
  return user.roles.some((role) => ["PJ_MATKUL", "ADMIN", "OWNER"].includes(role));
}

/**
 * Memeriksa apakah user berhak mengelola hak akses / role anggota.
 */
export function canManageRoles(user: User | null | undefined): boolean {
  if (!user || isGoogleUser(user)) return false;
  return user.roles.some((role) => ["ADMIN", "OWNER"].includes(role));
}
