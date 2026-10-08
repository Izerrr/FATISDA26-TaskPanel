import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { GuildProvider } from "@/components/providers/GuildProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionManager } from "@/components/providers/SessionManager";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fatisda26-taskpanel.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "TaskPanel FATISDA 2026 — Task & Schedule Workspace",
    template: "%s | TaskPanel FATISDA 2026",
  },
  description:
    "Platform all-in-one mahasiswa Fakultas Teknologi Informasi dan Sains Data (FATISDA) UNS 2026: manajemen tugas kuliah, jadwal harian, jadwal ujian UTS & UAS, serta vault materi terintegrasi.",
  applicationName: "TaskPanel",
  authors: [{ name: "FATISDA 2026 Tech Team" }],
  generator: "Next.js",
  keywords: [
    "FATISDA",
    "FATISDA UNS",
    "TaskPanel",
    "Jadwal Kuliah UNS",
    "Jadwal UTS FATISDA",
    "Jadwal UAS FATISDA",
    "Informatika UNS",
    "Sains Data UNS",
    "Manajemen Tugas Mahasiswa",
  ],
  creator: "FATISDA UNS 2026",
  publisher: "FATISDA UNS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: appUrl,
    siteName: "TaskPanel FATISDA",
    title: "TaskPanel FATISDA 2026 — Task & Schedule Workspace",
    description:
      "Platform all-in-one mahasiswa Fakultas Teknologi Informasi dan Sains Data (FATISDA) UNS 2026: manajemen tugas kuliah, jadwal harian, jadwal ujian UTS & UAS, serta vault materi terintegrasi.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TaskPanel FATISDA 2026 Preview",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskPanel FATISDA 2026 — Task & Schedule Workspace",
    description:
      "Platform all-in-one mahasiswa Fakultas Teknologi Informasi dan Sains Data (FATISDA) UNS 2026: manajemen tugas, jadwal kuliah, UTS & UAS, dan vault materi.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TaskPanel",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('fatisda_theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <SessionManager>
              <GuildProvider>
                {children}
                <InstallPrompt />
                <NetworkStatus />
              </GuildProvider>
            </SessionManager>
          </AuthProvider>
        </ThemeProvider>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
