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
- Auth: Laravel Sanctum cookie SPA (`withCredentials` + `withXSRFToken`)

## Quick start

```bash
cp .env.example .env
# VITE_API_URL must use the same hostname as the browser (localhost, not 127.0.0.1 mix)

npm install
npm run dev
```

API must be running with matching `FRONTEND_URL` / `SANCTUM_STATEFUL_DOMAINS`.

Default ops user: `ops@miniloan.test` / `password`

### Ops console surfaces

| Route | Purpose |
|-------|---------|
| `/login` | Sanctum session login |
| `/customers` | List/search/create |
| `/customers/:id` | Detail + wallet + loans |
| `/products` | Flat interest products |
| `/loans` | Originate + filter |
| `/loans/:id` | Hub: approve, disburse, collect STK, installments, intents |
| `/reconciliation` | Unmatched match/reject |
| `/reports` | Portfolio KPIs + aging |

### Demo journey

1. Create customer → create product → originate loan  
2. Open loan → Approve → Disburse  
3. Collect (Payment Intent + STK)  
4. With fake Daraja, POST STK callback or use Recon if unmatched  
5. Check Reports

## Status

Full ops workspace for the lending journey is in place. Money math remains API-only.

## Git

One commit per milestone after all tasks in that milestone are complete.
