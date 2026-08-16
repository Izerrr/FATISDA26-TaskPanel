# IF26-TaskPanel Dashboard Setup

## 1. Shared database package

The dashboard expects the workspace package `@if26/database` to export the Prisma client and generated enums/types.

Recommended `packages/database/src/index.ts`:

```ts
export { prisma } from "./prisma";
export { PrismaClient, Prodi, Kelas, Role, TaskScope, TaskStatus } from "@prisma/client";
```

If your database package uses another Prisma-client singleton path, export that singleton instead of creating a second client.

The canonical schema required by this dashboard is in `DATABASE_SCHEMA_REQUIRED.prisma`.

Minimum requirements:
- `Guild` model with `icon`
- `Task.guildId`
- `Task.createdById`
- `TaskStatus.NEED_REVIEW`
- `TaskScope.PERSONAL | CLASS`
- `User.roles`, `User.prodi`, `User.kelas`, `User.discordRoles`

## 2. Environment

Copy `.env.example` to `.env` in the dashboard or put the same variables in the monorepo environment used by Next.js.

Do not commit `.env`.

`DATABASE_URL` is the application/pooler connection.
`DIRECT_URL` is the direct PostgreSQL connection used by Prisma migrations.

## 3. Database migration

From the monorepo root:

```bash
pnpm --filter @if26/database prisma generate
pnpm --filter @if26/database prisma migrate dev --name dashboard-foundation
```

## 4. Workspace dependency

The dashboard package declares:

```json
"@if26/database": "workspace:*"
```

Make sure the root `pnpm-workspace.yaml` includes both `apps/*` and `packages/*`.

## 5. Discord role mapping

Set the actual Discord Role IDs in the environment variables:

- `DISCORD_ROLE_ADMIN`
- `DISCORD_ROLE_PJ_KELAS`
- `DISCORD_ROLE_PJ_MATKUL`
- `DISCORD_ROLE_INFORMATIKA`
- `DISCORD_ROLE_SAINS_DATA`
- `DISCORD_ROLE_KELAS_A` through `DISCORD_ROLE_KELAS_E`

The dashboard's Sync Discord action reads guild members through the Discord Bot API and writes:

- `User.discordRoles`
- `User.roles`
- `User.prodi`
- `User.kelas`

## 6. Discord bot permissions

The bot used by the dashboard needs access to the guild members endpoint. The bot also needs to be present in the target guild.

The dashboard currently fetches up to 1,000 members per sync. Pagination can be added later if the guild grows beyond that.
