# Mini Loan MS — Web

Vue 3 ops UI for the **Mini Loan Management System** (Demulla technical assessment).

This repository is the **presentation layer** only. Create/view customers, products, loans, trigger disbursement/STK, and operate manual reconciliation — all by calling the API.

**Do not** implement allocation, wallet math, or reconciliation matching in the frontend.

## Companion repository

| Repo | Path | Role |
|------|------|------|
| API (engine + docs) | [`../mini-loan-ms-api`](../mini-loan-ms-api) | Domain, Daraja, reconciliation, primary docs |
| Web (this repo) | `.` | Ops console UI |

Remote: https://github.com/Morexex/mini-loan-ms-web

## Stack

- Vue 3 · TypeScript · Pinia · Vue Router · Vite · Axios
- Auth: Laravel Sanctum cookie SPA (`withCredentials`)

## Quick start

```bash
cp .env.example .env
# VITE_API_URL=http://localhost:8000

npm install
npm run dev
```

API must be running (`php artisan serve`) with:

- `FRONTEND_URL=http://localhost:5173`
- `SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173`

Default ops user (from API seeder): `ops@miniloan.test` / `password`

### Milestone 13 surfaces

- `/login` — Sanctum session login
- `/reconciliation` — unmatched webhook queue, match to Payment Intent (reason required), reject with reason

## Documentation (lives in the API repo)

- [Project understanding](../mini-loan-ms-api/docs/01-project-understanding.md)
- [System design](../mini-loan-ms-api/docs/02-system-design.md)
- [Reconciliation engine](../mini-loan-ms-api/docs/05-reconciliation-engine.md)
- [API README](../mini-loan-ms-api/README.md)

## Status

Milestones 0–13: Vue ops shell with Sanctum login + manual reconciliation workspace. Broader CRUD screens can follow; allocation remains API-only.

## Git

One commit per milestone after all tasks in that milestone are complete.
