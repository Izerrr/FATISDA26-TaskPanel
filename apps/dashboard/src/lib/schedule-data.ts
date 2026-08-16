export interface CourseSchedule {
  id: string;
  courseName: string;
  room: string;
  time: string;
  day: string;
  prodi: "INFORMATIKA" | "SAINS_DATA";
  kelas: string;
}

// Data diambil dari jadwal resmi prodi[cite: 3, 4]
export const SCHEDULE_DATA: CourseSchedule[] = [
  // --- INFORMATIKA[cite: 4] ---
  { id: "if-1", courseName: "Jaringan Komputer", room: "Lab Komp 1", time: "07:30 - 09:10", day: "Senin", prodi: "INFORMATIKA", kelas: "A" },
  { id: "if-2", courseName: "Interaksi Manusia dan Komputer", room: "R. Teori 1", time: "09:20 - 11:00", day: "Senin", prodi: "INFORMATIKA", kelas: "B" },
  { id: "if-3", courseName: "Basis Data", room: "Lab Komp 2", time: "07:30 - 09:10", day: "Selasa", prodi: "INFORMATIKA", kelas: "A" },
  { id: "if-4", courseName: "Pemrograman Berorientasi Objek", room: "Lab Komp 1", time: "13:00 - 14:40", day: "Rabu", prodi: "INFORMATIKA", kelas: "C" },

  // --- SAINS DATA[cite: 3] ---
  { id: "sd-1", courseName: "Pengantar Sains Data", room: "R. Sidang 2", time: "07:30 - 09:10", day: "Senin", prodi: "SAINS_DATA", kelas: "A" },
  { id: "sd-2", courseName: "Aljabar Linier", room: "R. Teori 2", time: "09:20 - 11:00", day: "Senin", prodi: "SAINS_DATA", kelas: "B" },
  { id: "sd-3", courseName: "Metode Statistika", room: "R. Teori 3", time: "07:30 - 09:10", day: "Selasa", prodi: "SAINS_DATA", kelas: "A" },
  { id: "sd-4", courseName: "Pemrograman Python", room: "Lab Komp 3", time: "13:00 - 14:40", day: "Rabu", prodi: "SAINS_DATA", kelas: "C" },
];
