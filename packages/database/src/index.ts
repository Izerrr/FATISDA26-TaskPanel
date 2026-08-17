import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export { Prodi, Kelas, Role, TaskScope, TaskStatus } from "@prisma/client";

export type { User, Guild, Course, Task, Schedule, ScheduleSync, TaskStatus as TaskStatusType } from "@prisma/client";
