export type Prodi = "INFORMATIKA" | "SAINS_DATA" | "INFORMATIKA_PSDKU_KEBUMEN";

export type Kelas = "A" | "B" | "C" | "D" | "E";

export type Role = "STUDENT" | "PJ_KELAS" | "PJ_MATKUL" | "KETUA_ANGKATAN" | "ADMIN" | "OWNER";

export type TaskScope = "PERSONAL" | "CLASS";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE";

export interface User {
  id: string;
  provider?: "discord" | "google";
  email?: string | null;
  nim?: string | null;
  discordId?: string | null;
  googleId?: string | null;
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
  rawClassCode?: string | null;

  course?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export type ExamType = "UTS" | "UAS";

export interface ExamSchedule {
  id: string;
  type: ExamType;
  prodi: Prodi;
  semester: number;
  kelas: Kelas;
  courseName: string;
  date: string;
  dateStr: string;
  dayName: string;
  dayNum: number;
  startTime: string;
  endTime: string;
  room: string;
  rawText?: string | null;
  sourceSlots: number[];
  createdAt: string;
  updatedAt: string;
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

export interface AnalyticsUserSummary {
  total: number;
  discordGuildMembersTotal: number;
  googleOnly: number;
  discordOnly: number;
  linkedBoth: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byProdi: {
    INFORMATIKA: number;
    SAINS_DATA: number;
    INFORMATIKA_PSDKU_KEBUMEN: number;
    UNASSIGNED: number;
  };
  byKelas: Record<string, number>;
  byRole: {
    ADMIN: number;
    OWNER: number;
    KETUA_ANGKATAN: number;
    PJ_KELAS: number;
    PJ_MATKUL: number;
    STUDENT: number;
  };
  recentUsers: Array<{
    id: string;
    username: string;
    email: string | null;
    nim: string | null;
    avatar: string | null;
    provider: string;
    googleId: string | null;
    discordId: string | null;
    prodi: Prodi | null;
    kelas: Kelas | null;
    roles: Role[];
    createdAt: string;
    lastActiveAt?: string | null;
  }>;
}

export interface AnalyticsTaskSummary {
  total: number;
  byStatus: {
    TODO: number;
    IN_PROGRESS: number;
    NEED_REVIEW: number;
    DONE: number;
  };
  byScope: {
    CLASS: number;
    PERSONAL: number;
  };
  completionRate: number;
  totalComments: number;
  totalActivities: number;
}

export interface AnalyticsCommunitySummary {
  totalDiscussions: number;
  totalReplies: number;
  totalVaults: number;
  feedback: {
    total: number;
    open: number;
    resolved: number;
    byCategory: Record<string, number>;
    recent: Array<{
      id: string;
      category: string;
      message: string;
      authorName: string | null;
      status: string;
      createdAt: string;
      pageUrl: string | null;
    }>;
  };
}

export interface AnalyticsData {
  users: AnalyticsUserSummary;
  tasks: AnalyticsTaskSummary;
  community: AnalyticsCommunitySummary;
  generatedAt: string;
}

