import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Eye, 
  Database, 
  Server, 
  FileCheck, 
  CheckCircle2, 
  Cookie, 
  HelpCircle 
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | FATISDA 26 TaskPanel",
  description: "Kebijakan Privasi dan Perlindungan Data Mahasiswa FATISDA UNS Angkatan 2026.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-liquid-bg dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-liquid-border dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kerahasiaan Terjamin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-4xl px-4 sm:px-8 py-10 sm:py-14">
        {/* Header Hero */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-900/60 bg-teal-50 dark:bg-teal-950/40 px-3.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Perlindungan Data Mahasiswa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kebijakan Privasi (Privacy Policy)
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Platform <strong>FATISDA26-TaskPanel</strong> menghormati dan melindungi data pribadi mahasiswa Fakultas Teknologi Informasi dan Sains Data (FATISDA) Universitas Sebelas Maret. Halaman ini menjelaskan bagaimana data Anda dikumpulkan, disimpan, dan dilindungi.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>📅 Terakhir Diperbarui: <strong>1 Oktober 2026</strong></span>
            <span>•</span>
            <span>Versi: <strong>1.1 (Academic Shield Compliant)</strong></span>
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Bagian 1: Data yang Dikumpulkan */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                1. Data Pribadi yang Kami Kumpulkan
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Ketika Anda menggunakan layanan TaskPanel, kami hanya mengumpulkan informasi yang esensial untuk keperluan koordinasi akademik:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm pl-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Identitas Google Workspace UNS:</strong> Nama lengkap, alamat email resmi (@student.uns.ac.id), Nomor Induk Mahasiswa (NIM), dan foto profil default akun kampus.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Identitas Discord:</strong> Discord User ID, username, avatar, dan daftar peran (roles) di server Discord resmi angkatan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Preferensi Perkuliahan:</strong> Pilihan Program Studi (Informatika, Sains Data, dll.), Kelas (A, B, C, D), dan Semester aktif yang Anda tetapkan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Konten Akademik Mandiri:</strong> Tugas personal, status penyelesaian (TODO, In Progress, Done), komentar tugas, dan diskusi mata kuliah yang Anda unggah.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Bagian 2: Tujuan Pemrosesan Data */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Eye className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                2. Tujuan Penggunaan Data
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>Informasi yang dikumpulkan digunakan secara eksklusif untuk:</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1 text-slate-600 dark:text-slate-400">
                <li>Menampilkan jadwal kuliah dan ruangan yang sesuai dengan kelas dan semester Anda.</li>
                <li>Memverifikasi wewenang pengurus (PJ Mata Kuliah, PJ Kelas, Admin) sebelum memberikan izin membuat tugas kelas atau mengubah Course Vault.</li>
                <li>Menyediakan papan tugas Kanban yang sinkron antar perangkat mahasiswa.</li>
                <li>Mengirimkan notifikasi pengumuman tugas baru ke kanal Discord kelas terkait.</li>
              </ul>
            </div>
          </section>

          {/* Bagian 3: Keamanan & Enkripsi */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                3. Protokol Keamanan &amp; Perlindungan Akun
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>Platform menerapkan standar keamanan aplikasi web modern:</p>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">Enkripsi Token Sesi</div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Sesi login dilindungi JSON Web Token (JWT) terenkripsi dengan atribut cookie httpOnly dan SameSite=Lax.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">HMAC Penautan Akun</div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Penautan akun Google dan Discord diverifikasi menggunakan HMAC SHA-256 bertenggat waktu 5 menit untuk mencegah Account Takeover.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">Proteksi IDOR Tugas Pribadi</div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Tugas berkategori PERSONAL diproteksi di tingkat basis data dan tidak dapat diakses atau dibaca oleh pengguna lain.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">Anti-Spam &amp; Rate Limit</div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Setiap endpoint penulisan data dilengkapi jeda cooldown otomatis untuk mencegah serangan DDoS dan banjir spam.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Bagian 4: Berbagi Data Pihak Ketiga */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Server className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                4. Tidak Ada Penjualan Data / Pihak Ketiga Komersial
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Kami menegaskan bahwa <strong>FATISDA26-TaskPanel TIDAK PERNAH dan TIDAK AKAN PERNAH</strong> menjual, meminjamkan, menyewakan, atau memberikan data pribadi mahasiswa kepada pengiklan, broker data, atau pihak ketiga komersial mana pun.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data hanya diteruskan kepada penyedia otentikasi resmi (Google LLC dan Discord Inc.) sebatas pertukaran token protokol OAuth 2.0 yang Anda setujui saat proses masuk.
              </p>
            </div>
          </section>

          {/* Bagian 5: Penyimpanan Cookie & Cache */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Cookie className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                5. Cookie &amp; Penyimpanan Lokal Peramban
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>Platform menggunakan penyimpanan peramban lokal secara terbatas untuk fungsionalitas murni:</p>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-1 text-slate-600 dark:text-slate-400">
                <li><strong>Local Storage (`fatisda_theme`):</strong> Menyimpan pilihan tema tampilan (Terang / Gelap) agar konsisten saat halaman dimuat ulang.</li>
                <li><strong>Session Cookie (`next-auth.session-token`):</strong> Menyimpan token sesi aktif secara aman.</li>
                <li><strong>Service Worker Cache:</strong> Menyimpan aset ikon dan manifest agar aplikasi dapat dibuka cepat sebagai Progressive Web App (PWA).</li>
              </ul>
            </div>
          </section>

          {/* Bagian 6: Hak Pengguna & Penghapusan Sesi */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <FileCheck className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                6. Hak Pengguna atas Data
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>Setiap mahasiswa memiliki kendali penuh atas akunnya:</p>
              <ul className="space-y-1.5 text-xs sm:text-sm pl-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Hak Akses &amp; Koreksi:</strong> Anda dapat meninjau dan memperbarui kelas, prodi, dan semester kapan saja di menu Pengaturan Profil.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Hak Penghapusan Tugas:</strong> Tugas personal dapat Anda hapus secara permanen dari server kapan pun Anda inginkan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Pengakhiran Sesi:</strong> Anda dapat mengklik tombol "Keluar dari Akun" untuk menghapus seluruh jejak cookie sesi pada perangkat yang digunakan.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Bagian 7: Pertanyaan & Kontak */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                7. Pertanyaan Mengenai Privasi
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini atau penanganan data di platform FATISDA26-TaskPanel, silakan kirimkan pesan melalui fitur <strong>Lapor Bug &amp; Masukan Beta</strong> di bilah samping dashboard atau hubungi tim pengurus di server Discord resmi FATISDA 2026.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-liquid-border dark:border-slate-800 pt-6 text-xs text-slate-500 dark:text-slate-400">
          <div>
            &copy; 2026 FATISDA TaskPanel • Fakultas Teknologi Informasi dan Sains Data UNS
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition">
              Syarat &amp; Ketentuan (T&amp;C)
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition">
              Halaman Masuk
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition">
              Buka Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
