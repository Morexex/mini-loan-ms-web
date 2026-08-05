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

## Documentation (lives in the API repo)

Start here:

- [Project understanding (Milestone 0)](../mini-loan-ms-api/docs/01-project-understanding.md)
- [System design (Milestone 1)](../mini-loan-ms-api/docs/02-system-design.md)
- [ERD (Milestone 2)](../mini-loan-ms-api/docs/03-erd.md)
- [API README](../mini-loan-ms-api/README.md)

Especially:

- [Personas](../mini-loan-ms-api/docs/01-project-understanding.md#3-personas) — Ops Officer is the only UI user
- [FR-U Ops UI](../mini-loan-ms-api/docs/01-project-understanding.md#413-fr-u--ops-ui-presentation-only)
- [Reconciliation ranking](../mini-loan-ms-api/docs/01-project-understanding.md#11-reconciliation-strategy-ranking) — understand what the UI must surface (intents, unmatched queue), not re-implement

## Stack (planned)

- Vue 3 · TypeScript · Pinia · Vue Router
- Vuetify · Tailwind CSS
- Auth against API via Laravel Sanctum (SPA)

## Status

Milestones 0–12: API reconciles STK/SMS evidence into payments, installment allocations, and wallet overpay. Vue app scaffold still deferred; manual recon UI is Milestone 13.

## Git

One commit per milestone after all tasks in that milestone are complete. Milestone 0’s substantive docs commit lands on the API repo; this repo commits when its README/scaffold changes with that milestone.
