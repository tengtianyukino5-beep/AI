# AI Arbitrage Web

Responsive AI arbitrage operations web app with a Japanese customer frontend and Chinese management backend.

## Scope

This project implements:

- Japanese customer frontend.
- Chinese management backend.
- JPY as the main customer-facing currency.
- Tokyo time as the business time basis.
- Market-data-driven AI arbitrage opportunities and site-internal settlement.
- Internal balance ledger, VIP rules, KYC gate, deposits, conversion, invitations, audit logs, and admin controls.

Important boundary:

- The app does not place external exchange buy or sell orders.
- Customer balances change only through the internal ledger.
- Operation rewards, manual balance adjustments, invitation rewards, and AI arbitrage profits keep separate ledger types.

## Monorepo

```text
apps/
  api/       NestJS API
  web/       Vite + React Web App
packages/
  shared/    Shared TypeScript models
docs/        Product and engineering documents
```

## Local Or Codespaces Start

Install dependencies:

```bash
pnpm install
```

Run the API in terminal 1:

```bash
pnpm codespace
```

This command builds the shared package, builds the web app, builds the API, and then starts one single server on fixed port 3000. The same Codespaces URL serves the customer frontend, the management backend UI, and the API.

Build everything:

```bash
pnpm build
```

Run type checks:

```bash
pnpm typecheck
```

## Ports

| Service | URL |
| --- | --- |
| App | http://127.0.0.1:3000 |
| API Health | http://127.0.0.1:3000/api/v1/health |
| Swagger | http://127.0.0.1:3000/api-docs |

In GitHub Codespaces, open the forwarded `3000` port once. Use the root path for the customer frontend and `/admin` for the management backend.

## Demo Accounts

Customer:

```text
email: demo@example.jp
password: 123456
```

Admin:

```text
username: yuki888
password: 123456
```

Production warning:

- The default admin account is for local and staging tests only.
- Production must modify or disable `yuki888 / 123456`.

## Main Customer Flow

```text
Register / login
-> submit KYC
-> admin approves KYC
-> VIP0 activates
-> operation_reward posts as キャンペーン報酬
-> customer runs site-internal AI arbitrage
-> JPY balance increases through ledger
-> deposit ETH / BTC / USDT
-> convert ETH/BTC -> USDT -> USD -> JPY
-> JPY available balance reaches ¥75,000
-> self-upgrade to VIP1 without balance deduction
```

## Main Admin Flow

```text
Login with yuki888 / 123456
-> review customers
-> approve KYC
-> approve deposits
-> adjust customer balances
-> edit VIP profit rules
-> edit exchange detection seconds
-> review ledger and audit logs
```

## Development Notes

The current MVP uses an in-memory API store so the user experience can be tested quickly. Restarting the API resets demo data.

The development document already defines the production-grade direction:

- PostgreSQL.
- Prisma.
- Redis / BullMQ.
- immutable ledger tables.
- idempotency keys.
- balance versions.
- audit logs.
- daily reconciliation.

See:

[AI Arbitrage Responsive Web Development Document](docs/ai-arbitrage-responsive-web-development.md)

## Production Hardening

The repository now includes the first production-hardening layer:

- Environment-variable admin credentials.
- Backend-enforced admin permissions.
- Password hashing and session expiration.
- Persistent JSONL audit log.
- PostgreSQL initial schema.
- Redis/PostgreSQL production compose file.
- PostgreSQL backup script.
- Legal/compliance technical checklist.

Files:

```text
.env.production.example
docker-compose.production.yml
infra/postgres/001_initial_schema.sql
scripts/backup-postgres.sh
docs/production-hardening-checklist.md
```

Important: the current runtime still keeps business data in memory. Use the production-hardening checklist before handling real customer assets.
