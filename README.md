# 🚀 FATISDA26-TaskPanel

> **Academic Hub, Multi-Class Kanban Task Management, and Discord Integration for FATISDA UNS Class of 2026**

TaskPanel FATISDA 2026 adalah platform terpadu pengelolaan kegiatan akademik, tugas perkuliahan, jadwal kuliah, dan repositori materi untuk mahasiswa **Fakultas Teknologi Informasi dan Sains Data (FATISDA) Universitas Sebelas Maret (UNS)** angkatan 2026, mencakup:
- **S-1 Informatika (Kampus Surakarta)**
- **S-1 Sains Data (Kampus Surakarta)**
- **S-1 Informatika PSDKU (Kampus Kebumen)**

Platform ini mengintegrasikan bot Discord interaktif dengan antarmuka web modern berbasis **Next.js 14 App Router**, sistem autentikasi ganda (Google Workspace UNS + Discord), manajemen repositori mata kuliah (Course Vault), forum diskusi akademik, serta konsol analytics bagi pengurus angkatan.

---

## 📑 Daftar Isi
1. [Arsitektur Monorepo](#-arsitektur-monorepo)
2. [Fitur Unggulan](#-fitur-unggulan)
3. [Tech Stack](#-tech-stack)
4. [Skema Hak Akses (RBAC)](#-skema-hak-akses-rbac)
5. [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
6. [Konfigurasi Environment Variables](#-konfigurasi-environment-variables)
7. [Daftar Perintah (Scripts)](#-daftar-perintah-scripts)
8. [Keamanan & Proteksi Data](#-keamanan--proteksi-data)
9. [Kontribusi & Pemeliharaan](#-kontribusi--pemeliharaan)

---

## 🏗 Arsitektur Monorepo

Proyek ini dibangun menggunakan arsitektur monorepo dengan **pnpm workspaces**:

```text
FATISDA26-TaskPanel/
├── apps/
│   ├── dashboard/       # Next.js 14 App Router Web Application
│   │   ├── src/
│   │   │   ├── app/     # Routing, API endpoints, & halaman Next.js
│   │   │   ├── components/ # Komponen UI, Kanban, Modals, Layouts
│   │   │   ├── hooks/   # SWR hooks (useRole, useTasks, useAdminAnalytics, dll.)
│   │   │   ├── lib/     # Prisma client, auth NextAuth, Discord sync, HMAC tokens
│   │   │   └── types/   # TypeScript definitions & interfaces
│   │   ├── public/      # PWA manifests, icons, static assets
│   │   └── package.json
│   │
│   └── bot/             # Discord.js v14 Bot Service
│       ├── src/         # Commands, event handlers, cron reminders, auto-sync
│       └── package.json
│
├── packages/
│   └── database/        # Shared Prisma ORM package
│       ├── prisma/
│       │   └── schema.prisma # Skema database PostgreSQL
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## ✨ Fitur Unggulan

### 1. Dual OAuth & Penautan Akun (Account Linking)
- **Google Workspace UNS**: Mahasiswa dapat masuk langsung menggunakan email resmi kampus (`@student.uns.ac.id`). Domain diverifikasi di tingkat OAuth server.
- **Discord OAuth2**: Sinkronisasi identitas Discord dan peran server secara otomatis.
- **HMAC-SHA256 Token Linking**: Mahasiswa yang sudah masuk dengan salah satu provider dapat menautkan akun lainnya secara aman dengan perlindungan cryptographically signed link intent cookie (bebas IDOR & tampering).

### 2. Kanban Task Manager & Kolaborasi
- **Status Workflow**: `TODO` ➔ `IN_PROGRESS` ➔ `NEED_REVIEW` ➔ `DONE`.
- **Cakupan Tugas (Task Scope)**:
  - **Tugas Kelas**: Dibuat oleh PJ Mata Kuliah, PJ Kelas, atau Admin untuk satu rombel kelas tertentu.
  - **Tugas Pribadi**: Tugas individu mahasiswa yang hanya terlihat oleh pembuatnya.
- **Collapsible Columns**: Kolom daftar tugas yang panjang (>5 item) dapat dilipat rapi untuk menjaga fokus antarmuka.
- **Komentar & Diskusi Tugas**: Kolom komentar interaktif pada tiap tugas untuk bertukar informasi atau catatan teknis.
- **Audit Log / Riwayat Aktivitas**: Setiap perubahan status atau perbaikan tugas tercatat secara otomatis demi transparansi.

### 3. Mesin Jadwal Kuliah & AI Matcher
- **Live Class Tracker**: Indikator kelas kuliah yang sedang berlangsung atau kelas berikutnya yang akan dimulai hari ini.
- **Sinkronisasi Google Sheets**: Sinkronisasi jadwal kuliah semester langsung dari spreadsheet akademik fakultas.
- **AI-Assisted Parser**: Normalisasi kode mata kuliah, nama dosen pengampu, dan ruang kelas secara otomatis.

### 4. Course Vault & CMS Pengurus
- Repositori modul, silabus, tautan folder Google Drive materi, dan tautan komunitas/grup WhatsApp per mata kuliah.
- Antarmuka CMS khusus bagi **PJ Mata Kuliah**, **PJ Kelas**, dan **Admin** untuk memperbarui link materi kapan saja tanpa perlu redeploy kode.

### 5. Forum Diskusi Mata Kuliah
- Ruang tanya-jawab terstruktur per mata kuliah untuk menanyakan materi kuliah, tips praktikum, dan kisi-kisi ujian.
- Fitur pin pengumuman penting oleh PJ dan admin.

### 6. Admin Analytics & Telemetri Pengguna
- **Statistik Adopsi Platform**:
  - Total akun mahasiswa terdaftar.
  - Rasio akun Google UNS vs akun Discord server vs Akun Tertaut Ganda (*Dual-Auth*).
- **Demografi Angkatan**:
  - Distribusi per Program Studi (Informatika Surakarta, Sains Data, Informatika PSDKU Kebumen).
  - Distribusi per rombongan belajar kelas (Kelas A sampai E).
- **Progres & Beban Tugas**:
  - Persentase tingkat penyelesaian tugas (*completion rate*).
  - Perbandingan tugas kelas vs tugas pribadi.
- **Papan Masukan / Feedback Beta**:
  - Pemantauan laporan bug, saran jadwal, usulan fitur, dan tiket masukan mahasiswa.
- **Role Guard**: Terisolasi khusus untuk akun dengan hak akses `ADMIN`, `OWNER`, dan `KETUA_ANGKATAN`.

### 7. Progressive Web App (PWA) & Offline Indicator
- Dukungan PWA penuh dengan service worker dan web app manifest. Dapat diinstal pada Windows, macOS, Android, dan iOS.
- Toast indikator koneksi jaringan (online/offline) yang non-intrusif.

---

## 🛠 Tech Stack

| Lapisan | Teknologi |
| :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript) |
| **Styling & Design System** | [Tailwind CSS v3](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/) |
| **Data Fetching & Caching** | [SWR v2](https://swr.vercel.app/) |
| **Autentikasi** | [NextAuth.js v4](https://next-auth.js.org/) (Google Provider + Discord Provider + Custom HMAC linking) |
| **Backend & Bot** | [Node.js](https://nodejs.org/), [Discord.js v14](https://discord.js.org/), [node-cron](https://github.com/kelektiv/node-cron) |
| **Database & ORM** | [PostgreSQL (Supabase)](https://supabase.com/), [Prisma ORM v5](https://www.prisma.io/) |
| **Pengujian (Testing)** | [Vitest](https://vitest.dev/), TypeScript Compiler (`tsc --noEmit`) |
| **Package Manager** | [pnpm](https://pnpm.io/) (Workspaces) |

---

## 👥 Skema Hak Akses (RBAC)

| Peran (Role) | Deskripsi | Hak Akses Utama |
| :--- | :--- | :--- |
| **OWNER** | Pemilik sistem / Lead Developer | Akses penuh: Admin Console, Analytics, Vault CMS, konfigurasi server |
| **ADMIN** | Administrator Sistem | Mengelola seluruh tugas kelas, CMS Vault, melihat analytics, moderasi feedback |
| **KETUA_ANGKATAN**| Ketua Angkatan FATISDA 2026 | Memantau statistik mahasiswa, membuat tugas angkatan, melihat feedback |
| **PJ_KELAS** | Penanggung Jawab Rombel Kelas | Membuat dan mengubah tugas kelas, memperbarui info vault kelasnya |
| **PJ_MATKUL** | Penanggung Jawab Mata Kuliah | Mengelola materi Course Vault, membuat tugas matkul, moderasi forum matkul |
| **STUDENT** | Mahasiswa Reguler | Mengakses materi, mengelola tugas pribadi, ikut diskusi, memberi feedback |

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat Sistem
- **Node.js**: Versi `>= 18.17.0` (direkomendasikan Node.js 20 LTS)
- **pnpm**: Versi `>= 9.0.0` (`npm install -g pnpm`)
- **Database PostgreSQL**: Instance PostgreSQL lokal atau proyek gratis di [Supabase](https://supabase.com).

### 2. Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/username/FATISDA26-TaskPanel.git
cd FATISDA26-TaskPanel
pnpm install
```

### 3. Konfigurasi Variabel Lingkungan
Salin contoh file `.env.example` ke file `.env` di aplikasi dashboard:
```bash
# Untuk dashboard web
cp apps/dashboard/.env.example apps/dashboard/.env

# Untuk shared database
cp apps/dashboard/.env.example packages/database/.env
```
Isi konfigurasi database, NextAuth secret, serta kredensial Discord & Google (lihat [Konfigurasi Environment Variables](#-konfigurasi-environment-variables)).

### 4. Setup Skema Database (Prisma)
Generate prisma client dan sinkronkan skema ke database:
```bash
# Generate Prisma Client
pnpm db:generate

# Push schema ke database (development)
pnpm db:push
```

### 5. Menjalankan Server Development
```bash
# Menjalankan Next.js Web Dashboard (http://localhost:3000)
pnpm dev:dashboard

# Menjalankan Discord Bot (opsional jika menguji bot)
pnpm dev:bot
```

### 6. Menjalankan Pengujian (Testing) & Type Check
```bash
# Menjalankan unit tests
pnpm --filter fatisda-dashboard test

# Type-check TypeScript
pnpm --filter fatisda-dashboard exec tsc --noEmit
```

---

## 🔐 Konfigurasi Environment Variables

Berikut adalah daftar variabel lingkungan yang dibutuhkan pada `apps/dashboard/.env`:

```env
# -------------------------------------------------------------
# DATABASE (PostgreSQL / Supabase)
# -------------------------------------------------------------
# Connection Pooler URL (Port 6543 dengan pgbouncer untuk runtime)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct URL (Port 5432 untuk Prisma migration/db push)
DIRECT_URL="postgres://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres"

# -------------------------------------------------------------
# NEXTAUTH
# -------------------------------------------------------------
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kunci-rahasia-acak-minimal-32-karakter"

# -------------------------------------------------------------
# DISCORD OAUTH & BOT INTEGRATION
# -------------------------------------------------------------
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"
DISCORD_BOT_TOKEN="your_discord_bot_token"
DISCORD_GUILD_ID="your_discord_server_id"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# -------------------------------------------------------------
# DISCORD ROLE MAPPINGS (ID Role dari Server Discord)
# -------------------------------------------------------------
DISCORD_ROLE_ADMIN="role_id_admin"
DISCORD_ROLE_KETUA_ANGKATAN="role_id_ketua_angkatan"
DISCORD_ROLE_PJ_KELAS="role_id_pj_kelas"
DISCORD_ROLE_PJ_MATKUL="role_id_pj_matkul"

DISCORD_ROLE_INFORMATIKA="role_id_prodi_if"
DISCORD_ROLE_SAINS_DATA="role_id_prodi_data"
DISCORD_ROLE_INFORMATIKA_PSDKU_KEBUMEN="role_id_prodi_psdku"

DISCORD_ROLE_KELAS_A="role_id_kelas_a"
DISCORD_ROLE_KELAS_B="role_id_kelas_b"
DISCORD_ROLE_KELAS_C="role_id_kelas_c"
DISCORD_ROLE_KELAS_D="role_id_kelas_d"
DISCORD_ROLE_KELAS_E="role_id_kelas_e"

# -------------------------------------------------------------
# GOOGLE OAUTH (@student.uns.ac.id)
# -------------------------------------------------------------
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

---

## 📜 Daftar Perintah (Scripts)

| Perintah | Keterangan |
| :--- | :--- |
| `pnpm dev:dashboard` | Menjalankan Next.js Web Dashboard dalam mode development |
| `pnpm dev:bot` | Menjalankan bot Discord dengan hot-reloading (`tsx watch`) |
| `pnpm build:dashboard` | Membangun bundle produksi Next.js Dashboard |
| `pnpm build:bot` | Mengompilasi TypeScript kode bot Discord |
| `pnpm db:generate` | Men-generate TypeScript client dari `schema.prisma` |
| `pnpm db:push` | Menerapkan perubahan schema ke database tanpa migration file |
| `pnpm db:studio` | Membuka antarmuka GUI Prisma Studio di browser |
| `pnpm --filter fatisda-dashboard test` | Menjalankan automated test suite dengan Vitest |

---

## 🛡 Keamanan & Proteksi Data

Aplikasi ini telah melalui proses audit dan hardening keamanan komprehensif:
- **Proteksi IDOR (Insecure Direct Object References)**: Setiap aksi terhadap komentar, aktivitas, dan tugas diverifikasi kepemilikan dan hak aksesnya berdasarkan sesi pengguna aktif.
- **Cryptographic Token Linking**: Penautan akun Discord dan Google diamankan dengan *HMAC-SHA256 signature* bertenggat waktu 10 menit, mencegah manipulasi cookie dan serangan CSRF.
- **Anti-Spam & Rate Limiting**: Pengiriman komentar, masukan pengguna (*feedback*), dan balasan diskusi dibatasi dengan jeda waktu (*cooldown*) untuk mencegah banjir spam.
- **HTTP Security Headers**: Dikonfigurasi dengan `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Strict-Transport-Security (HSTS)`.

---

## 🤝 Kontribusi & Pemeliharaan

Pengembangan platform TaskPanel FATISDA 2026 dikelola bersama oleh perwakilan mahasiswa dan pengurus angkatan FATISDA UNS.

1. Buat branch baru dari `main`: `git checkout -b feature/nama-fitur`.
2. Pastikan seluruh pengujian lolos: `pnpm --filter fatisda-dashboard test` dan `tsc --noEmit`.
3. Ajukan Pull Request dengan deskripsi perubahan yang jelas.

---

<p align="center">
  Dibuat dengan dedikasi untuk seluruh mahasiswa <strong>FATISDA UNS Angkatan 2026</strong>.<br />
  <em>Solutif, Kolaboratif, dan Berintegritas.</em>
</p>
