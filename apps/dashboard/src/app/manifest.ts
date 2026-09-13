import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FATISDA26 TaskPanel",
    short_name: "TaskPanel",
    description: "Panel Tugas & Jadwal Kuliah Mahasiswa FATISDA UNS 2026",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0284c7",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
