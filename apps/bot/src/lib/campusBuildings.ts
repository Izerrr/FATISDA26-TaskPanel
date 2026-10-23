export interface CampusBuildingInfo {
  code: string;
  name: string;
  facultyOrUnit: string;
  floorHint?: string;
  description: string;
  mapsUrl: string;
}

export function resolveCampusBuilding(room: string | null | undefined): CampusBuildingInfo | null {
  if (!room) return null;
  const trimmed = room.trim();
  if (!trimmed || trimmed === "-") return null;

  const normalized = trimmed.toLowerCase();

  if (normalized.includes("daring") || normalized.includes("online") || normalized.includes("zoom")) {
    return {
      code: "ONLINE",
      name: "Perkuliahan / Ujian Daring",
      facultyOrUnit: "Online Meeting / SPADA UNS",
      description: "Dilaksanakan daring (online). Cek link di SPADA UNS atau grup kelas.",
      mapsUrl: "https://spada.uns.ac.id",
    };
  }

  if (normalized.includes("pasca")) {
    const floorMatch = trimmed.match(/lt\.?\s*(\d+)/i) || trimmed.match(/1(\d)\d{2}/);
    const floor = floorMatch?.[1] ? `Lantai ${floorMatch[1]}` : "Lantai 3";
    return {
      code: "PASCA",
      name: "Gedung Sekolah Pascasarjana UNS",
      facultyOrUnit: "Kampus UNS Kentingan (Sisi Timur)",
      floorHint: floor,
      description: `Gedung Sekolah Pascasarjana UNS (${floor}), dekat Gerbang Timur / Medical Center UNS.`,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sekolah+Pascasarjana+UNS+Surakarta",
    };
  }

  if (/\b(upt\s*tik|lab\.?\s*tik)\b/i.test(trimmed)) {
    return {
      code: "UPT_TIK",
      name: "Gedung UPT TIK (Puskom UNS)",
      facultyOrUnit: "Unit Pelaksana Teknis TIK UNS",
      floorHint: "Area Pusat Komputer",
      description: "Gedung UPT TIK / Pusat Komputer UNS, sebelah barat Perpustakaan Pusat UNS.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=UPT+TIK+UNS+Surakarta",
    };
  }

  if (/^b[\s.-]?\d/i.test(trimmed) || normalized.includes("gedung b")) {
    const digitMatch = trimmed.match(/^b[\s.-]?(\d)/i);
    const floor = digitMatch?.[1] ? `Lantai ${digitMatch[1]}` : undefined;
    const isLab = normalized.includes("lab");
    return {
      code: "GEDUNG_B",
      name: "Gedung B FMIPA / FATISDA UNS",
      facultyOrUnit: "Fakultas Teknologi Informasi dan Sains Data",
      floorHint: floor,
      description: `${isLab ? "Laboratorium Komputer di " : "Ruang kelas di "}Gedung B FMIPA / FATISDA UNS${floor ? ` (${floor})` : ""}.`,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gedung+B+FMIPA+UNS+Surakarta",
    };
  }

  if (/^a[\s.-]?\d/i.test(trimmed) || normalized.includes("gedung a")) {
    const digitMatch = trimmed.match(/^a[\s.-]?(\d)/i);
    const floor = digitMatch?.[1] ? `Lantai ${digitMatch[1]}` : undefined;
    return {
      code: "GEDUNG_A",
      name: "Gedung A FMIPA UNS",
      facultyOrUnit: "Kompleks FMIPA / FATISDA UNS",
      floorHint: floor,
      description: `Gedung A FMIPA UNS${floor ? ` (${floor})` : ""}, Kompleks Saintek UNS Kentingan.`,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=FMIPA+UNS+Surakarta",
    };
  }

  if (/^c[\s.-]?\d/i.test(trimmed) || normalized.includes("gedung c")) {
    const digitMatch = trimmed.match(/^c[\s.-]?(\d)/i);
    const floor = digitMatch?.[1] ? `Lantai ${digitMatch[1]}` : undefined;
    return {
      code: "GEDUNG_C",
      name: "Gedung C FMIPA UNS",
      facultyOrUnit: "Kompleks FMIPA / FATISDA UNS",
      floorHint: floor,
      description: `Gedung C FMIPA UNS${floor ? ` (${floor})` : ""}, Kompleks Saintek UNS Kentingan.`,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gedung+C+FMIPA+UNS+Surakarta",
    };
  }

  if (normalized.includes("kebumen")) {
    return {
      code: "KEBUMEN",
      name: "Kampus PSDKU UNS Kebumen",
      facultyOrUnit: "Informatika PSDKU Kebumen",
      description: "Kampus PSDKU Universitas Sebelas Maret di Kabupaten Kebumen.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=UNS+Kampus+Kebumen",
    };
  }

  return {
    code: "CAMPUS",
    name: `Ruang ${trimmed}`,
    facultyOrUnit: "Kampus UNS Kentingan",
    description: `Ruang perkuliahan/ujian ${trimmed} di lingkungan Kampus UNS.`,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=FATISDA+FMIPA+UNS+Surakarta",
  };
}

export function formatRoomWithLocation(room: string | null | undefined): string {
  if (!room || !room.trim() || room.trim() === "-") {
    return "🏛️ **Ruang:** -";
  }
  const building = resolveCampusBuilding(room);
  if (!building) {
    return `🏛️ **Ruang:** ${room}`;
  }
  const floor = building.floorHint ? ` (${building.floorHint})` : "";
  return `🏛️ **Ruang:** ${room} • [${building.name}${floor}](${building.mapsUrl})`;
}

