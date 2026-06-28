# AI Arbitrage Web

Responsive Web MVP for a site-internal AI arbitrage simulation platform.

## Scope

This project implements:

- Japanese customer frontend.
- Chinese management backend.
- JPY as the main customer-facing currency.
- Tokyo time as the business time basis.
- Site-internal simulated AI arbitrage opportunities and settlement.
- Internal balance ledger, VIP rules, KYC gate, deposits, conversion, invitations, audit logs, and admin controls.

Important boundary:

- The MVP does not place real exchange buy or sell orders.
- Site-internal simulated orders must not be displayed as external exchange real fills.
- Operation rewards, manual balance adjustments, invitation rewards, and simulated profits keep separate ledger types.

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

Run both apps:

```bash
pnpm dev
```

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
| Web | http://127.0.0.1:5173 |
| API | http://127.0.0.1:3000/api/v1 |
| API Health | http://127.0.0.1:3000/api/v1/health |
| Swagger | http://127.0.0.1:3000/api-docs |

In GitHub Codespaces, open the forwarded `5173` port for the web app and `3000` for the API.

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
