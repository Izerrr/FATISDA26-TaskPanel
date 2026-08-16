export type Prodi = "INFORMATIKA" | "SAINS_DATA";
export type Kelas = "A" | "B" | "C" | "D" | "E";
export type TaskScope = "PERSONAL" | "CLASS";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE";

export interface User {
  id: string;
  username: string;
  avatar: string | null;
  prodi: Prodi | null;
  kelas: Kelas | null;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  prodi: Prodi;
  kelas: Kelas | null;
}
