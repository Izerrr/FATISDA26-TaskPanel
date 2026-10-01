import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowLeft, 
  FileText, 
  Users, 
  KeyRound, 
  Lock, 
  AlertTriangle, 
  HelpCircle, 
  BookOpen, 
  Sparkles,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan | FATISDA 26 TaskPanel",
  description: "Syarat dan Ketentuan Penggunaan Layanan Panel Tugas dan Jadwal FATISDA UNS Angkatan 2026.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-liquid-bg dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      {/* Glow background accent */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full bg-liquid-accent/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-liquid-teal/10 blur-[120px]" />

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
            <span>Edisi Closed Beta 2026</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative mx-auto max-w-4xl px-4 sm:px-8 py-10 sm:py-14">
        {/* Header Hero */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/40 px-3.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Dokumen Resmi Ketentuan Pengguna</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Syarat &amp; Ketentuan Layanan (Terms of Service)
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Selamat datang di <strong>FATISDA26-TaskPanel</strong>. Dokumen ini mengatur hak, tanggung jawab, dan aturan penggunaan platform manajemen tugas, jadwal kuliah, dan materi akademik bagi mahasiswa Fakultas Teknologi Informasi dan Sains Data (FATISDA) Universitas Sebelas Maret Angkatan 2026.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>📅 Terakhir Diperbarui: <strong>1 Oktober 2026</strong></span>
            <span>•</span>
            <span>Versi: <strong>1.2 (Multi-Auth &amp; Academic Shield)</strong></span>
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Bagian 1: Ketentuan Umum */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                1. Penerimaan Ketentuan
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Dengan mengakses atau menggunakan platform FATISDA26-TaskPanel melalui peramban web atau aplikasi terpasang (PWA), Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat &amp; Ketentuan ini.
              </p>
              <p>
                Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda dipersilakan untuk tidak menggunakan platform atau segera keluar dari sesi akun Anda.
              </p>
            </div>
          </section>

          {/* Bagian 2: Akun Mahasiswa & Autentikasi */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                2. Akun Mahasiswa &amp; Metode Masuk
              </h2>
            </div>
            <div className="space-y-4 text-slate-600 dark:text-slate-300">
              <p>
                FATISDA26-TaskPanel menyediakan 2 (dua) metode autentikasi resmi dengan pembagian wewenang yang jelas:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                  <div className="font-semibold text-slate-900 dark:text-white text-xs mb-1.5 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Google Workspace UNS (@student.uns.ac.id)
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Ditujukan untuk seluruh mahasiswa aktif FATISDA 2026. Memberikan akses personal untuk memantau jadwal kuliah, melihat tugas kelas, mengakses materi Course Vault, dan mencatat tugas pribadi (personal scope).
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                  <div className="font-semibold text-slate-900 dark:text-white text-xs mb-1.5 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    Discord Server FATISDA 2026
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Digunakan untuk verifikasi peran kepengurusan (Admin, PJ Kelas, PJ Mata Kuliah, Ketua Angkatan). Memberikan hak membuat tugas kelas, mempublikasikan pengumuman resmi, dan mengelola Course Vault.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengguna bertanggung jawab penuh atas keamanan perangkat dan kredensial akun pihak ketiga (Google &amp; Discord) yang digunakan untuk masuk ke platform ini.
              </p>
            </div>
          </section>

          {/* Bagian 3: Penautan Akun */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                3. Penautan Akun (Account Linking)
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Mahasiswa berhak menautkan akun Google UNS dan akun Discord mereka melalui menu Pengaturan Profil untuk menyatukan data tugas pribadi dan peran kepengurusan dalam satu identitas terpadu.
              </p>
              <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-xs space-y-1.5">
                <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Keamanan Kriptografis Penautan
                </div>
                <p className="text-amber-800/90 dark:text-amber-300">
                  Setiap proses penautan akun dilindungi tanda tangan HMAC kriptografis satu kali pakai dengan masa kedaluwarsa 5 menit. Penautan yang tidak sah atau manipulasi token intent akan ditolak otomatis oleh sistem untuk mencegah pengambilalihan akun (account takeover).
                </p>
              </div>
            </div>
          </section>

          {/* Bagian 4: Kode Etik & Acceptable Use Policy */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                4. Aturan Penggunaan &amp; Etika Berkomunikasi
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>Dalam menggunakan fitur diskusi mata kuliah, komentar tugas, dan form laporan:</p>
              <ul className="space-y-2 text-xs sm:text-sm pl-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Integritas Akademik:</strong> Wajib menjaga kesopanan, etika mahasiswa, dan saling mendukung kelancaran studi sesama rekan angkatan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Larangan Konten Negatif:</strong> Dilarang memuat ujaran kebencian, pelecehan, perundungan, konten berbau SARA, atau pornografi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Larangan Spam &amp; Eksploitasi:</strong> Dilarang melakukan flooding pesan, pengiriman otomatis berlebihan (botting spam), atau upaya peretasan sistem. Pelanggaran rate-limiting akan memicu pemblokiran akses sementara secara otomatis.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Bagian 5: Privasi & Kerahasiaan Data */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                5. Privasi &amp; Perlindungan Data Pribadi
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Kami menghargai privasi setiap mahasiswa. Data yang dikumpulkan platform ini meliputi:
              </p>
              <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 pl-1 text-slate-600 dark:text-slate-400">
                <li>Nama lengkap, alamat email Google UNS, dan NIM (yang tertera pada profil akademik).</li>
                <li>Identitas Discord (username, avatar, dan role di server angkatan).</li>
                <li>Data pilihan Program Studi, Kelas, dan Semester aktif.</li>
                <li>Tugas pribadi, balasan diskusi, dan catatan belajar yang Anda unggah secara sadar.</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data Anda <strong>tidak akan pernah diperjualbelikan</strong>, disewakan, ataupun dibagikan ke entitas komersial di luar keperluan koordinasi akademik angkatan 2026 FATISDA UNS.
              </p>
            </div>
          </section>

          {/* Bagian 6: Materi Perkuliahan & Course Vault */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                6. Materi Kuliah &amp; Hak Kekayaan Intelektual
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Tautan silabus, modul, slide kuliah, dan Google Drive yang tercantum di fitur <strong>Course Vault</strong> disediakan semata-mata untuk memudahkan mahasiswa belajar.
              </p>
              <p>
                Hak cipta materi perkuliahan tetap berada pada masing-masing Dosen Pengampu dan Universitas Sebelas Maret. Mahasiswa dilarang mengomersialkan materi perkuliahan tersebut kepada pihak luar.
              </p>
            </div>
          </section>

          {/* Bagian 7: Batasan Tanggung Jawab */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                7. Batasan Tanggung Jawab &amp; Status Closed Beta
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                FATISDA26-TaskPanel dikembangkan oleh inisiatif perwakilan mahasiswa sebagai alat bantu koordinasi mandiri dan saat ini beroperasi dalam fase <strong>Closed Beta</strong>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Meskipun pengelola berupaya maksimal menjaga akurasi jadwal dan notifikasi tugas, mahasiswa tetap diwajibkan untuk memverifikasi instruksi resmi, tenggat waktu pengumpulan (deadline), dan pengumuman dari Sistem Informasi Akademik UNS (SIAKAD) maupun Dosen Pengampu masing-masing.
              </p>
            </div>
          </section>

          {/* Bagian 8: Kontak & Dukungan */}
          <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                8. Hubungi Kami &amp; Masukan Pengguna
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Jika Anda memiliki pertanyaan mengenai Syarat &amp; Ketentuan ini, menemukan kerentanan keamanan, atau ingin melaporkan kendala pada platform, silakan gunakan tombol <strong>Lapor Bug &amp; Masukan Beta</strong> yang tersedia di dashboard atau hubungi tim pengurus di server Discord resmi FATISDA 2026.
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
