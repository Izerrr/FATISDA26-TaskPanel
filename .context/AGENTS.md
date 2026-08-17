# IF26 TaskPanel — Codex Project Context

## Project

IF26 TaskPanel is a task-management dashboard for FATISDA 2026.

Stack:

- Next.js 14
- TypeScript
- Prisma 5.22
- PostgreSQL / Supabase
- NextAuth
- pnpm monorepo
- Tailwind CSS

Repository:
apps/dashboard
packages/database

## Current architecture

The dashboard is designed for a single Discord/FATISDA workspace,
not multiple user-selectable servers.

Main concepts:

- Dashboard / Overview
- Tasks / Kanban
- Schedule
- Courses
- User profile / roles

The old "server selector" concept should eventually be removed
from the main navigation because this application is intended for
one workspace only.

## Database

Prisma database is connected to Supabase.

Current migration status:

- Database schema is up to date.
- Prisma migrations exist and have been successfully applied.
- Schedule model has been added.

Important models include:

- User
- Guild
- Course
- Task
- Schedule
- ScheduleSync

Enums include:

- Prodi
- Kelas
- Role
- TaskScope
- TaskStatus

Prodi must support:

- INFORMATIKA
- SAINS_DATA
- INFORMATIKA_PSDKU_KEBUMEN

## Schedule

Schedule is already integrated into the dashboard Overview.

There is:
apps/dashboard/src/app/dashboard/schedule/page.tsx

There is also:
apps/dashboard/src/app/api/schedule/sync/route.ts

ScheduleSyncPanel should live at:
apps/dashboard/src/components/schedule/ScheduleSyncPanel.tsx

Only ADMIN should be able to synchronize schedules.

## Current validation

This command currently passes:

pnpm --filter fatisda-dashboard build

The dashboard build has previously succeeded.

Use this for TypeScript checking:

pnpm --filter fatisda-dashboard exec tsc --noEmit

Do NOT run `pnpm exec tsc` or `pnpm exec prisma` from the repository root
if the required binaries are only available in the dashboard/database package.

For Prisma commands use the database package context, e.g.:

cd packages/database
pnpm prisma generate

## Important recent fixes

A large number of old/duplicate Kanban components caused TypeScript
errors. The clean v1 implementation was retained and conflicting
legacy components were removed/replaced.

Do not reintroduce duplicate Kanban type definitions.

There was also a duplicate Prisma Schedule model which was fixed.
Do not define Schedule twice.

## Current task

Before implementing new features, fix the user type layer so that
useRole() exposes:

user.prodi
user.kelas

with the proper Prisma enum types.

Do NOT solve this with repeated type assertions/casts inside
DashboardShell.

After that:

1. Run TypeScript check.
2. Run production build.
3. Redesign sidebar/navigation for a single workspace.
4. Keep Schedule integrated into Overview.
5. Ensure desktop and mobile responsiveness.

## Product direction

The sidebar should no longer emphasize "Server" because there is
only one workspace.

Suggested navigation:

- Overview
- Tugas
- Jadwal
- Mata Kuliah

User/profile/settings should be separated from academic navigation.

The UI should remain responsive for:

- Desktop
- Tablet
- Mobile

## Working style

Do not blindly modify unrelated files.

Before changing architecture:

- inspect existing implementation
- identify the source of truth
- avoid duplicate types
- preserve working functionality
- run tsc after meaningful changes
- run build before declaring the task complete

When fixing TypeScript errors, fix the underlying type/API mismatch
instead of using `any` or unnecessary type assertions.
