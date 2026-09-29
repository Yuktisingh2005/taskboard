  # TaskBoard — Real-Time Collaborative Task Board

  A collaborative task board where multiple users can manage tasks across Todo, In Progress, and Done columns with real-time sync.

  ## Stack

  - **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand, @dnd-kit, Socket.IO client
  - **Backend:** Node.js, Express, TypeScript, MongoDB, Socket.IO
  - **Auth:** JWT + bcryptjs
  - **Testing:** Vitest + Supertest
  - **DevOps:** Docker + Docker Compose

  ---

  ## Setup

  ### With Docker

  ```bash
  # 1. Create a .env file at the project root (see .env.example)
  # 2. Start everything
  docker compose up --build

  - Frontend → http://localhost:3000
  - Backend → http://localhost:5000

  Locally

  # Backend
  cd backend && npm install && npm run dev

  # Frontend (new terminal)
  cd frontend && npm install && npm run dev

  Tests

  cd backend && npm test
  # 24 tests — no real database needed

  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  .env.example

  MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
  JWT_SECRET=your_secret_here
  JWT_EXPIRES_IN=24h
  NEXT_PUBLIC_API_URL=http://localhost:5000/api
  NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  API

  All routes except /api/auth/* require Authorization: Bearer <token>.

  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/boards
  GET    /api/boards
  GET    /api/boards/:id
  PATCH  /api/boards/:id
  DELETE /api/boards/:id
  POST   /api/boards/:id/members
  POST   /api/boards/:id/tasks
  PATCH  /api/tasks/:id          — requires { baseVersion, ...changes }
  DELETE /api/tasks/:id
  GET    /api/boards/:id/activity

  Roles: owner (full control) · editor (create/edit tasks) · viewer (read only)

  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Architecture

  Browser (Next.js + Zustand)
      │
      ├── Axios (REST writes)
      └── Socket.IO (real-time receives)
              │
          Express server
              ├── authMiddleware (JWT)
              ├── requireBoardMember (403 if not a member)
              ├── Mongoose → MongoDB Atlas
              └── Socket.IO → board rooms

  Write flow: REST call → MongoDB → emit socket event to board room → all clients update.

  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Real-Time

  - Each board is a Socket.IO room (board:<id>)
  - Client joins on page open, leaves on navigate away
  - Server emits task:created, task:updated, task:deleted, board:updated, activity:created after every write
  - On reconnect: client re-joins room and refetches board to catch up on missed events
  - A banner shows while disconnected or reconnecting

  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Concurrent Edit Handling

  Every task has a version number and a fieldVersions map per field.

  Scenario: A and B both open task at version 3. A edits the title. B edits the description.

  - A saves title → version becomes 4, fieldVersions.title = 4
  - B saves description with baseVersion: 3 → server checks fieldVersions.description (still 3) → no conflict → merges, version becomes 5
  - Result: both changes preserved

  If both edit the same field, the server returns 409 Conflict with the latest task. The frontend shows a message asking the user to review and re-save.

  This avoids silent data loss from last-write-wins. See backend/src/services/taskService.ts → applyTaskUpdate.

  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Known Limitations

  - No email verification or password reset
  - Board columns are fixed (Todo / In Progress / Done)
  - No file attachments on tasks
  - Docker requires an external MongoDB Atlas URI (no local Mongo container)
  - No frontend end-to-end tests (backend API and concurrency logic are tested)