# Production Hardening Checklist

This document is the production-readiness checklist for the AI Arbitrage Web project.

It is a technical checklist, not legal advice. Before handling real customer assets, fiat conversion, crypto deposits, crypto withdrawals, investment-like services, exchange connectivity, or profit-related representations, obtain written review from qualified legal and compliance professionals in the operating jurisdiction.

## Current Status

Implemented in this codebase:

- Single Nest server serving customer frontend, admin UI, and API on one port.
- Environment-variable based admin credentials.
- Backend-enforced admin permissions.
- JSONL persistent audit log.
- PostgreSQL initial schema.
- PostgreSQL `app_state_snapshots` persistence for full staging-flow restart tests.
- Redis and PostgreSQL production compose file.
- PostgreSQL backup script.
- KYC gate, deposit review, withdrawal review, balance ledger, VIP rules, AI order records, and audit log screens.

Not yet fully implemented:

- Business logic still uses the existing in-process state model, then persists the complete app state to PostgreSQL.
- Customer assets, ledger entries, deposits, withdrawals, KYC documents, VIP rules, and AI orders are not yet mapped to normalized transactional PostgreSQL tables.
- Redis queue topology exists, but background jobs are not yet moved to Redis/BullMQ.
- JWT refresh-token rotation is not yet fully implemented.
- File uploads are stored in the PostgreSQL app-state snapshot as data URLs for staging tests; production needs object storage or controlled disk storage.
- Real exchange order placement is still disabled until live execution credentials and legal approval are completed.

## Production Environment Variables

Use `.env.production.example` as the server template.

Mandatory before server testing:

- `PUBLIC_APP_URL`
- `DATABASE_URL`
- `PERSISTENCE_REQUIRED=true`
- `REDIS_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_PERMISSIONS`
- `AUDIT_LOG_PATH`
- `BACKUP_DIR`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

For staging, keep:

- `DISABLE_EXTERNAL_EXCHANGE_ORDER=true`
- `ENABLE_SIMULATION_ENGINE=true`

For real exchange execution, do not change these values until legal/compliance approval and sandbox tests are completed.

## Admin Permissions

Supported backend permissions:

- `admin.view`
- `customer.edit`
- `kyc.approve`
- `deposit.approve`
- `deposit.address.update`
- `withdrawal.complete`
- `balance.adjust`
- `vip.update`
- `exchange.update`
- `audit.view`

Default local admin receives all permissions. Production should set `ADMIN_PERMISSIONS` explicitly.

## PostgreSQL

Initial schema:

```text
infra/postgres/001_initial_schema.sql
```

Core tables:

- `customers`
- `customer_sessions`
- `admin_users`
- `admin_sessions`
- `kyc_documents`
- `balances`
- `ledger_entries`
- `deposit_orders`
- `withdrawal_orders`
- `simulation_opportunities`
- `simulation_orders`
- `vip_rules`
- `exchange_configs`
- `deposit_addresses`
- `support_messages`
- `invite_rewards`
- `audit_logs`
- `risk_reviews`
- `compliance_checks`

Current staging persistence:

- `app_state_snapshots`

The API writes the complete staging business state into `app_state_snapshots` when `DATABASE_URL` is configured. This is the restart-safe persistence layer for server testing before live exchange execution.

Server verification:

```bash
curl http://127.0.0.1:3000/api/v1/health
psql "$DATABASE_URL" -c "select id, version, saved_at, jsonb_array_length(state->'customers') as customers, jsonb_array_length(state->'orders') as orders from app_state_snapshots;"
pm2 restart ai-arbitrage --update-env
```

Next engineering step:

1. Add Prisma or another ORM/query layer.
2. Move customers, balances, KYC documents, deposits, withdrawals, ledger entries, VIP rules, and AI orders from the app-state snapshot into normalized repository classes.
3. Use database transactions for balance-changing operations.
4. Add idempotency keys for deposits, withdrawals, conversions, AI orders, and manual adjustments.
5. Add balance version checks for optimistic locking.

## Redis Queue

Redis is prepared in:

```text
docker-compose.production.yml
```

Recommended queues:

- `market.refresh`
- `ai.opportunity.scan`
- `ai.order.settle`
- `email.send`
- `audit.persist`
- `backup.create`
- `risk.review`

Next engineering step:

1. Add BullMQ or an equivalent queue library.
2. Move market refresh and auto-AI execution out of request-time code.
3. Add retry, dead-letter, and idempotency handling.

## Audit And Risk Control

Persistent audit log:

```text
AUDIT_LOG_PATH=.runtime/audit-log.jsonl
```

Each audit record includes:

- action
- operator
- target type
- target id
- detail
- risk level
- created timestamp

Risk levels:

- `low`: registration, login, support, normal system events
- `medium`: KYC, deposit, customer update, VIP/exchange/deposit-address settings
- `high`: withdrawal approval, manual balance adjustment, permission denial
- `critical`: reserved for future severe risk events

Recommended future controls:

- Two-person approval for withdrawal approval and manual balance decrease/increase.
- Withdrawal velocity limit per customer, asset, day, and address.
- New wallet address cooling period.
- KYC mismatch hold.
- IP/device anomaly scoring.
- High-profit AI order review threshold.
- Daily reconciliation report.
- Immutable audit table in PostgreSQL.

## PostgreSQL Backup

Backup script:

```bash
DATABASE_URL="postgresql://..." BACKUP_DIR="/var/backups/ai-arbitrage/postgres" bash scripts/backup-postgres.sh
```

Recommended cron:

```cron
15 3 * * * cd /opt/ai-arbitrage && DATABASE_URL="postgresql://..." BACKUP_DIR="/var/backups/ai-arbitrage/postgres" bash scripts/backup-postgres.sh >> /var/log/ai-arbitrage/backup.log 2>&1
```

Minimum backup policy:

- Daily backups.
- 14-day local retention.
- Weekly off-server copy.
- Monthly restore test.

## Legal And Compliance Review

Official reference starting points:

- Japan FSA crypto asset information page: https://www.fsa.go.jp/policy/virtual_currency/index.html
- Japan FSA licensed institutions list: https://www.fsa.go.jp/en/regulated/licensed/index.html
- Japan FSA crypto-asset exchange service provider list: https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf

Items requiring professional review:

- Whether the service is a crypto-asset exchange service.
- Whether fiat-to-crypto or crypto-to-fiat conversion creates registration obligations.
- Whether customer asset custody is involved.
- Whether AI arbitrage descriptions may be treated as investment solicitation, investment advice, or misleading profit representation.
- AML/CFT obligations, including customer due diligence and suspicious transaction reporting.
- Customer asset segregation.
- Risk disclosure wording.
- Terms of service.
- Privacy policy.
- Data retention and deletion policy.
- Cross-border user restrictions.
- Tax reporting and accounting treatment.

Do not launch real-money public operations until these items have written approval.

## Recommended Implementation Order

1. Keep current server test version stable.
2. Deploy PostgreSQL and Redis with `docker-compose.production.yml`.
3. Add password hashing and JWT sessions.
4. Move admin users and sessions to PostgreSQL.
5. Move customers, KYC, balances, and ledger to PostgreSQL.
6. Move deposits and withdrawals to PostgreSQL with transactional balance updates.
7. Move AI opportunities and orders to PostgreSQL.
8. Move market refresh and AI execution to Redis queues.
9. Add object storage for KYC and deposit proof images.
10. Add two-person approval and risk review screens.
11. Complete legal/compliance review.
12. Only after approval, add exchange sandbox order execution.
