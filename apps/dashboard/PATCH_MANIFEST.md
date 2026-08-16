# Dashboard Rewrite Manifest

This archive is a dashboard-only rewrite for IF26-TaskPanel.
The Discord bot is intentionally not modified.

## Core changes

- Unified task status: `TODO`, `IN_PROGRESS`, `NEED_REVIEW`, `DONE`
- Unified task scopes: `PERSONAL`, `CLASS`
- Dashboard workspace is based on the selected Discord guild
- Personal tasks are visible only to their creator
- Class tasks are visible to guild users who can access the workspace
- Server-side permission checks for creating, editing, moving, and deleting tasks
- Create task modal is connected to `POST /api/tasks`
- Edit task modal is connected to `PATCH /api/tasks/:id`
- Delete task action is connected to `DELETE /api/tasks/:id`
- Kanban drag-and-drop is connected to task status updates
- Overview statistics are calculated from live task data
- Course selector is populated through `/api/courses`
- Discord guild selection uses OAuth guild permissions
- Manual Discord sync updates guild metadata and user role/profile mapping
- Discord Role IDs can map to application role, prodi, and kelas
- Dashboard uses the shared `@if26/database` workspace package
- No production `.env`, secrets, `.next`, or `node_modules` are included

## Important integration point

The database package must expose the Prisma singleton and generated enums from its workspace package. See `DASHBOARD_SETUP.md` and `DATABASE_SCHEMA_REQUIRED.prisma`.
