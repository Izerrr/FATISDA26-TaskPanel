import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { GuildProvider } from "@/components/providers/GuildProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FATISDA 26 — Panel Tugas",
  description: "Panel tugas PKKMB FATISDA UNS 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-liquid-bg">
        <AuthProvider>
          <GuildProvider>{children}</GuildProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
