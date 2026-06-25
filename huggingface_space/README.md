---
title: Invesa Backend
emoji: 🚀
colorFrom: indigo
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# Invesa Backend

Environment variables (required):

- `DATABASE_URL` - Postgres connection string (e.g. `postgres://user:pass@localhost/invesa`)
- `JWT_SECRET` - Secret used to sign JWT tokens (must be strong and kept private)
- `PORT` - Optional; default `7860` if not set

Run locally (requires Rust toolchain and a running Postgres):

```bash
cd backend
export DATABASE_URL=postgres://localhost/invesa
export JWT_SECRET=my_super_secret_key
cargo run --release
```

Run database migrations (sqlx migrations are run automatically on startup).

Security notes:

- Do NOT commit secrets into source. Use environment variables or a secrets manager in production.
- Configure CORS and allowed origins at deployment time (avoid allowing all origins in production).
