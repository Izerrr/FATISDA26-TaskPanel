import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { GuildProvider } from "@/components/providers/GuildProvider";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "FATISDA 26 | TaskPanel",
  description: "Task management dashboard untuk FATISDA UNS 2026.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TaskPanel",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <GuildProvider>
            {children}
            <InstallPrompt />
          </GuildProvider>
        </AuthProvider>

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
