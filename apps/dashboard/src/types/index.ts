export type Prodi = "INFORMATIKA" | "SAINS_DATA" | "INFORMATIKA_PSDKU_KEBUMEN";

export type Kelas = "A" | "B" | "C" | "D" | "E";

export type Role = "STUDENT" | "PJ_KELAS" | "PJ_MATKUL" | "ADMIN";

export type TaskScope = "PERSONAL" | "CLASS";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE";

export interface User {
  id: string;
  username: string;
  avatar: string | null;
  prodi: Prodi | null;
  kelas: Kelas | null;
  semester: number | null;
  roles: Role[];
  discordRoles: string[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  prodi: Prodi;
  kelas: Kelas | null;
  pjMatkulId: string | null;
}
export interface Schedule {
  id: string;
  prodi: Prodi;
  kelas: Kelas;
  semester?: number | null;
  courseId: string | null;
  courseName?: string;

  day: number;
  startTime: string;
  endTime: string;

  room: string | null;
  lecturer: string | null;

  course?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface Task {
  id: string;
  guildId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  scope: TaskScope;
  prodi: Prodi | null;
  kelas: Kelas | null;
  courseId: string | null;
  createdById: string;
  assignedTo: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;

  createdBy: {
    id: string;
    username: string;
    avatar: string | null;
  };

  assignee: {
    id: string;
    username: string;
    avatar: string | null;
  } | null;

  course: Course | null;
}
