# KshetraMap Module 2 — Windows Run Book

## Prerequisites (one-time)

- Node.js LTS installed.
- MongoDB Community Server installed as a Windows service, already running
  (`Get-Service MongoDB` should show `Running`). This is the **existing**
  service Module 1's seed script already uses — no new installation needed.
- `cd web && npm install`

## Environment

Copy `web/.env.example` to `web/.env.local` and fill in:

- `MONGODB_URI` / `MONGODB_DB` — defaults (`mongodb://127.0.0.1:27017` / `kshetramap`) match the existing local service.
- `NEXTAUTH_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev.
- `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` — the first super_admin login.

## First-time setup

```bash
cd web
npm install
npm run seed:admin
```

This creates (or updates, idempotently) the first `super_admin` user and the
`users`/`audit_log` indexes.

## Running the app

```bash
cd web
npm run dev            # development, hot reload
# or
npm run build && npm run start:server   # production-mode server
```

Open `http://localhost:3000/login` and sign in with `SEED_ADMIN_PHONE` /
`SEED_ADMIN_PASSWORD`.

## Verifying the static (GitHub Pages) build still works

```bash
cd web
npm run build:static
```

This parks every server-only route (`api`, `login`, `app`) out of `src/app`,
runs `GITHUB_PAGES=1 next build`, restores the parked directories, and leaves
the static site in `web/out/`. It never touches git or pushes anything — it's
safe to run any time. (`npm run deploy:gh` calls this internally and then
publishes `out/` to the `gh-pages` branch.)

## Locked out of admin?

The Admin Users API refuses to let a super_admin demote their own role away
from `super_admin` or deactivate their own account (self-lockout guard), but
if you're ever locked out some other way (e.g. lost credentials for the
seeded account), `npm run seed:admin` is safe to re-run at any time: it's
idempotent and will reset the account matching `SEED_ADMIN_PHONE` in
`.env.local` back to an active `super_admin` with the password from
`SEED_ADMIN_PASSWORD`, without touching any other user.

```bash
cd web
npm run seed:admin
```

## Tests / type-check

```bash
cd web
npm test              # vitest — pure-function unit tests
npx tsc --noEmit       # strict TypeScript check
```
