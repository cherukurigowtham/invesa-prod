# Invesa

Invesa is an idea-sharing platform where founders can post startup ideas publicly and interested users can open direct chats with them.

## Stack

- Frontend: React + Tailwind CSS + Vite
- Backend: Go HTTP API
- Database: Neon Postgres

## Product flow

- A user registers, signs in, and gets a secure session cookie.
- A signed-in user posts an idea with title, summary, category, stage, and tags.
- Every idea is visible in the public feed.
- Interested users can send a first message from the idea card.
- The message opens a conversation thread for follow-up chat.

## Frontend

```bash
cd /Users/gowthamcherukuri/Desktop/invesa-go/frontend
npm install
npm run dev
```

## Backend

```bash
cd /Users/gowthamcherukuri/Desktop/invesa-go/backend
export DATABASE_URL="postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require"
export PORT="8080"
export FRONTEND_URL="http://localhost:5173"
go run ./cmd/api
```

If `DATABASE_URL` is not set, the API falls back to an in-memory store. Demo credentials in memory mode:

- `aarav@invesa.app` / `password123`
- `nikhil@invesa.app` / `password123`

## Neon setup

1. Create a Neon project and copy the connection string.
2. Set `DATABASE_URL` in your environment or `.env`.
3. The API auto-applies [schema.sql](/Users/gowthamcherukuri/Desktop/invesa-go/backend/schema.sql) on startup.
4. Start the Go API, then start the React frontend.

## API routes

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/ideas`
- `POST /api/ideas`
- `POST /api/ideas/:ideaId/interest`
- `GET /api/conversations`
- `POST /api/conversations/:conversationId/messages`
