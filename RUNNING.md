# Running WhoIsFake

The project has two parts:

| Part | Folder | Stack | Port |
|------|--------|-------|------|
| Web client | `/` (root) | Vite + React + Tailwind (pnpm) | 5173 |
| Realtime server | `/server` | Node + Express + Socket.IO (npm) | 4000 |

## First-time setup

```bash
# client deps (root)
pnpm install

# server deps
cd server && npm install && cd ..
```

## Start (two terminals)

```bash
# terminal 1 — realtime server
cd server && npm run dev

# terminal 2 — web client
pnpm dev
```

Open http://localhost:5173.

## Data layer

- **Game rooms** are in-memory on the server (ephemeral, auto-swept).
- **Accounts & friends** are durable: stored in **Redis** when `REDIS_URL` is set
  (`server/.env`), otherwise in a local JSON file fallback at `server/data/db.json`.
- Copy `server/.env.example` → `server/.env` to configure `JWT_SECRET`, `REDIS_URL`, etc.

### Redis via Docker

This machine already runs another project's Redis on the default port 6379, so
WhoIsFake uses its own container on host port **6380**:

```bash
docker run -d --name whoisfake-redis -p 6380:6379 --restart unless-stopped redis:7-alpine
```

`server/.env` then points at it:

```
REDIS_URL=redis://127.0.0.1:6380
```

`GET /health` reports the active backend (`{"store":"redis"}` or `{"store":"file"}`).
Stop/remove with `docker rm -f whoisfake-redis`. If Redis is unreachable the server
automatically falls back to the JSON file store.

## Auth model

- **Guest play** — no account needed; entering a nickname on Create/Join spins up a
  temporary guest identity (matches the landing page's "2 clicks to play").
- **Accounts** — register/sign in from the floating account button (bottom-right).
  Required for the **friends** system (add by username, presence, invite-to-lobby).

## Testing multiplayer locally

A browser shares `localStorage` (the auth token) across tabs of the same origin, so
multiple tabs = the same player. To play several players on one machine, use separate
browser profiles or incognito windows (or different devices on your network).
