create extension if not exists pgcrypto;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role_name text not null default 'super_admin',
  permissions text[] not null default array[]::text[],
  status text not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  status text not null default 'active',
  kyc_status text not null default 'not_submitted',
  vip_level text not null default 'VIP0',
  auto_ai_enabled boolean not null default false,
  credit_score integer not null default 80,
  manual_daily_limit integer,
  success_rate_percent integer,
  ai_running boolean not null default false,
  invite_code text not null unique,
  invited_by uuid references customers(id),
  campaign_reward_posted boolean not null default false,
  withdrawal_bank_account text,
  withdrawal_usdt_trc20_address text,
  withdrawal_usdt_erc20_address text,
  withdrawal_btc_address text,
  withdrawal_eth_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  token_hash text not null unique,
  user_agent text,
  ip_address inet,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references admin_users(id),
  token_hash text not null unique,
  permissions text[] not null default array[]::text[],
  user_agent text,
  ip_address inet,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists kyc_documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  full_name text not null,
  document_no text not null,
  document_front_name text,
  document_front_storage_key text,
  document_front_data_url text,
  status text not null default 'pending',
  reviewer text,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

create table if not exists balances (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  asset text not null,
  available numeric(36, 18) not null default 0,
  frozen numeric(36, 18) not null default 0,
  balance_version bigint not null default 1,
  updated_at timestamptz not null default now(),
  unique (customer_id, asset)
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  business_no text not null unique,
  customer_id uuid not null references customers(id),
  asset text not null,
  ledger_type text not null,
  direction text not null,
  amount numeric(36, 18) not null,
  balance_after numeric(36, 18) not null,
  ledger_status text not null,
  title_ja text not null,
  title_zh text not null,
  note text,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists deposit_addresses (
  id text primary key,
  asset text not null,
  network text not null,
  label_ja text not null,
  label_zh text not null,
  address text not null,
  memo text,
  min_confirmations integer not null default 1,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists deposit_orders (
  id uuid primary key default gen_random_uuid(),
  business_no text not null unique,
  customer_id uuid not null references customers(id),
  asset text not null,
  network text,
  deposit_address_id text references deposit_addresses(id),
  deposit_address_snapshot text,
  amount numeric(36, 18) not null,
  status text not null default 'pending',
  proof_text text not null,
  proof_image_name text,
  proof_image_storage_key text,
  unit_price_jpy numeric(36, 8),
  valuation_jpy numeric(36, 8),
  price_source text,
  price_source_label_ja text,
  price_source_detail_ja text,
  price_updated_at timestamptz,
  market_exchange text,
  market_pair text,
  reviewer text,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

create table if not exists withdrawal_orders (
  id uuid primary key default gen_random_uuid(),
  business_no text not null unique,
  customer_id uuid not null references customers(id),
  asset text not null,
  amount numeric(36, 18) not null,
  status text not null default 'pending',
  destination_type text not null,
  network text,
  destination_text text not null,
  note text,
  unit_price_jpy numeric(36, 8),
  valuation_jpy numeric(36, 8),
  price_source text,
  price_source_label_ja text,
  price_source_detail_ja text,
  price_updated_at timestamptz,
  market_exchange text,
  market_pair text,
  reviewer text,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

create table if not exists vip_rules (
  level text primary key,
  daily_limit integer not null,
  min_balance_jpy numeric(36, 8) not null,
  upgrade_balance_jpy numeric(36, 8) not null,
  ai_power integer not null,
  high_profit_threshold_jpy numeric(36, 8) not null,
  high_profit_probability integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists exchange_configs (
  id text primary key,
  name text not null,
  category text not null,
  api_provider text not null,
  api_url text,
  interval_seconds numeric(18, 6) not null default 1,
  enabled boolean not null default true,
  last_status text,
  last_error text,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  real_api_pair_count integer not null default 0,
  fallback_pair_count integer not null default 0,
  unsupported_pair_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists simulation_opportunities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  pair text not null,
  base_asset text not null,
  exchanges text[] not null,
  status text not null,
  spread_percent numeric(18, 8) not null,
  principal_jpy numeric(36, 8) not null,
  estimated_profit_jpy numeric(36, 8) not null,
  quote_payload jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  missed_reason_ja text,
  missed_detail_ja text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists simulation_orders (
  id uuid primary key default gen_random_uuid(),
  business_no text not null unique,
  customer_id uuid not null references customers(id),
  opportunity_id uuid references simulation_opportunities(id),
  mode text not null,
  status text not null,
  pair text not null,
  base_asset text not null,
  buy_exchange text,
  sell_exchange text,
  executed_quantity numeric(36, 18),
  executed_buy_jpy numeric(36, 8),
  executed_sell_jpy numeric(36, 8),
  gross_profit_jpy numeric(36, 8),
  total_cost_jpy numeric(36, 8),
  net_profit_jpy numeric(36, 8),
  failure_reason_ja text,
  failure_detail_ja text,
  admin_note_ja text,
  execution_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_no text not null,
  customer_id uuid not null references customers(id),
  sender text not null,
  category text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists invite_rewards (
  id uuid primary key default gen_random_uuid(),
  inviter_customer_id uuid not null references customers(id),
  invitee_customer_id uuid not null references customers(id),
  amount_jpy numeric(36, 8) not null,
  status text not null default 'frozen',
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  operator text not null,
  target_type text not null,
  target_id text not null,
  detail text not null,
  risk_level text not null default 'low',
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists risk_reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  source_type text not null,
  source_id text not null,
  risk_level text not null,
  status text not null default 'open',
  reason text not null,
  reviewer text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists compliance_checks (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  requirement text not null,
  status text not null default 'pending',
  owner text,
  evidence_url text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ledger_customer_created on ledger_entries(customer_id, created_at desc);
create index if not exists idx_deposit_customer_created on deposit_orders(customer_id, created_at desc);
create index if not exists idx_withdrawal_customer_created on withdrawal_orders(customer_id, created_at desc);
create index if not exists idx_sim_orders_customer_created on simulation_orders(customer_id, created_at desc);
create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_audit_risk on audit_logs(risk_level, created_at desc);
create index if not exists idx_risk_reviews_status on risk_reviews(status, risk_level, created_at desc);
