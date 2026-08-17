import type { Kelas, Prodi, Role, TaskScope, TaskStatus } from "@prisma/client";

export type { Kelas, Prodi, Role, TaskScope, TaskStatus };

export interface User {
  id: string;
  username: string;
  avatar: string | null;
  prodi: Prodi | null;
  kelas: Kelas | null;
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
  courseId: string | null;

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
