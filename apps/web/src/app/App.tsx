import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowRightLeft,
  BadgeCheck,
  Banknote,
  Bot,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Coins,
  Copy,
  Gauge,
  Gift,
  History,
  LayoutDashboard,
  Lock,
  LogIn,
  LineChart,
  Search,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserRound,
  Wallet,
} from 'lucide-react';
import type {
  AdminSummary,
  ApiResponse,
  Asset,
  AssetBalance,
  ConversionQuote,
  CustomerProfile,
  DashboardData,
  DepositAddressConfig,
  DepositOrder,
  ExchangeConfig,
  LedgerEntry,
  MarketTicker,
  SimulationOpportunity,
  SimulationOrder,
  VipLevel,
  VipRule,
  WithdrawalOrder,
} from '@twodays/shared';

const API_BASE = '/api/v1';

type CustomerSession = {
  token: string;
  customer: CustomerProfile;
  dashboard: DashboardData;
};

type AdminState = {
  summary: AdminSummary;
  customers: CustomerProfile[];
  balances: Record<string, AssetBalance[]>;
  ledger: LedgerEntry[];
  deposits: DepositOrder[];
  withdrawals: WithdrawalOrder[];
  depositAddresses: DepositAddressConfig[];
  opportunities: SimulationOpportunity[];
  orders: SimulationOrder[];
  vipRules: VipRule[];
  exchanges: ExchangeConfig[];
  inviteRewards: Array<{
    id: string;
    inviterCustomerId: string;
    inviteeCustomerId: string;
    amountJpy: string;
    status: string;
    createdAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    operator: string;
    targetType: string;
    targetId: string;
    detail: string;
    createdAt: string;
  }>;
  reconciliation: {
    businessDateTokyo: string;
    checkedBalances: number;
    mismatchCount: number;
    status: string;
    generatedAt: string;
    note: string;
  };
};

type CustomerPage = 'dashboard' | 'kyc' | 'deposit' | 'withdraw' | 'convert' | 'funds' | 'ai' | 'vip' | 'invite' | 'ledger' | 'activity' | 'my';
type AdminPage = 'overview' | 'customers' | 'kyc' | 'deposits' | 'withdrawals' | 'balances' | 'rules' | 'audit';
type VipDraftKey = 'dailyLimit' | 'minBalanceJpy' | 'upgradeBalanceJpy' | 'highProfitProbability' | 'aiPower';
type AdminRealtimeState = 'offline' | 'connecting' | 'live' | 'fallback';
type HistoryFilter = {
  query: string;
  status: string;
  asset: string;
  fromDate: string;
  toDate: string;
};

const customerNav: Array<{ key: CustomerPage; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'ホーム', icon: LayoutDashboard },
  { key: 'ai', label: 'AI裁定', icon: Bot },
  { key: 'funds', label: '入出金', icon: Wallet },
  { key: 'vip', label: 'VIP', icon: BadgeCheck },
  { key: 'my', label: 'マイページ', icon: UserRound },
];
const adminNav: Array<{ key: AdminPage; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'overview', label: '总览', icon: LayoutDashboard },
  { key: 'customers', label: '客户', icon: UserRound },
  { key: 'kyc', label: 'KYC', icon: ShieldCheck },
  { key: 'deposits', label: '入金', icon: Wallet },
  { key: 'withdrawals', label: '出金', icon: Banknote },
  { key: 'balances', label: '调账', icon: Banknote },
  { key: 'rules', label: '规则', icon: SlidersHorizontal },
  { key: 'audit', label: '审计', icon: History },
];
export function App() {
  const [area] = useState<'customer' | 'admin'>(() => (window.location.pathname.startsWith('/admin') ? 'admin' : 'customer'));
  const [customerPage, setCustomerPage] = useState<CustomerPage>('dashboard');
  const [adminPage, setAdminPage] = useState<AdminPage>('overview');
  const [customerToken, setCustomerToken] = useState(() => localStorage.getItem('customerToken') ?? '');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') ?? '');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [adminState, setAdminState] = useState<AdminState | null>(null);
  const [adminRealtimeState, setAdminRealtimeState] = useState<AdminRealtimeState>('offline');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customerToken) {
      void loadDashboard(customerToken).catch(() => {
        localStorage.removeItem('customerToken');
        setCustomerToken('');
        setDashboard(null);
        setToast('セッションの有効期限が切れました。もう一度ログインしてください。');
      });
    }
  }, [customerToken]);

  useEffect(() => {
    if (!customerToken) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      void loadDashboard(customerToken).catch(() => {
        localStorage.removeItem('customerToken');
        setCustomerToken('');
        setDashboard(null);
        setToast('セッションの有効期限が切れました。もう一度ログインしてください。');
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [customerToken]);

  useEffect(() => {
    if (adminToken) {
      void loadAdmin(adminToken).catch(() => {
        localStorage.removeItem('adminToken');
        setAdminToken('');
        setAdminState(null);
        setToast('管理セッションの有効期限が切れました。もう一度ログインしてください。');
      });
    }
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken) {
      setAdminRealtimeState('offline');
      return undefined;
    }
    setAdminRealtimeState('connecting');
    if (typeof EventSource === 'undefined') {
      setAdminRealtimeState('fallback');
      const timer = window.setInterval(() => {
        void loadAdmin(adminToken);
      }, 3500);
      return () => window.clearInterval(timer);
    }

    let fallbackTimer: number | undefined;
    const source = new EventSource(`${API_BASE}/admin/state/stream?token=${encodeURIComponent(adminToken)}`);
    const startFallback = () => {
      if (fallbackTimer) return;
      setAdminRealtimeState('fallback');
      void loadAdmin(adminToken);
      fallbackTimer = window.setInterval(() => {
        void loadAdmin(adminToken);
      }, 3500);
    };
    const handleState = (event: MessageEvent<string>) => {
      try {
        setAdminState(JSON.parse(event.data) as AdminState);
        setAdminRealtimeState('live');
        if (fallbackTimer) {
          window.clearInterval(fallbackTimer);
          fallbackTimer = undefined;
        }
      } catch {
        startFallback();
      }
    };
    source.addEventListener('admin-state', handleState as EventListener);
    source.onerror = startFallback;
    return () => {
      source.close();
      if (fallbackTimer) {
        window.clearInterval(fallbackTimer);
      }
    };
  }, [adminToken]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function call<T>(path: string, options: RequestInit = {}, token?: string) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    const json = (await response.json()) as ApiResponse<T>;
    if (json.code !== 'OK') {
      throw new Error(json.message);
    }
    return json.data;
  }

  async function run<T>(task: () => Promise<T>, success?: string) {
    setBusy(true);
    setToast('');
    try {
      const result = await task();
      if (success) {
        setToast(success);
      }
      return result;
    } catch (error) {
      setToast(error instanceof Error ? error.message : '操作に失敗しました');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function loadDashboard(token = customerToken) {
    const data = await call<DashboardData>('/customer/dashboard', {}, token);
    setDashboard(data);
    return data;
  }

  async function loadAdmin(token = adminToken) {
    const data = await call<AdminState>('/admin/state', {}, token);
    setAdminState(data);
    return data;
  }

  function customerLoginDone(session: CustomerSession) {
    localStorage.setItem('customerToken', session.token);
    setCustomerToken(session.token);
    setDashboard(session.dashboard);
    setCustomerPage('dashboard');
    setToast('ログインしました。');
  }

  function adminLoginDone(result: { token: string }) {
    localStorage.setItem('adminToken', result.token);
    setAdminToken(result.token);
    setAdminPage('overview');
    setToast('管理后台登录成功。');
  }

  function logoutCustomer() {
    localStorage.removeItem('customerToken');
    setCustomerToken('');
    setDashboard(null);
  }

  function logoutAdmin() {
    localStorage.removeItem('adminToken');
    setAdminToken('');
    setAdminState(null);
  }

  const content = area === 'customer' ? (
    <CustomerApp
      busy={busy}
      dashboard={dashboard}
      page={customerPage}
      setPage={setCustomerPage}
      token={customerToken}
      onLogin={customerLoginDone}
      onLogout={logoutCustomer}
      call={call}
      run={run}
      refresh={loadDashboard}
    />
  ) : (
    <AdminApp
      adminState={adminState}
      busy={busy}
      page={adminPage}
      setPage={setAdminPage}
      token={adminToken}
      onLogin={adminLoginDone}
      onLogout={logoutAdmin}
      realtimeState={adminRealtimeState}
      call={call}
      run={run}
      refresh={loadAdmin}
    />
  );

  return (
    <main className={`app-shell ${area === 'admin' ? 'admin-shell' : 'customer-shell'}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AI</span>
          <div>
            <strong>AI Arbitrage Pro</strong>
            <small>{area === 'admin' ? '管理后台' : 'AI裁定アカウント'}</small>
          </div>
        </div>
      </header>

      {toast ? (
        <div className="toast" role="status">
          {busy ? <RefreshCw size={16} className="spin" /> : <CheckCircle2 size={16} />}
          <span>{toast}</span>
        </div>
      ) : null}

      {content}
    </main>
  );
}

function CustomerApp(props: {
  busy: boolean;
  dashboard: DashboardData | null;
  page: CustomerPage;
  setPage: (page: CustomerPage) => void;
  token: string;
  onLogin: (session: CustomerSession) => void;
  onLogout: () => void;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
}) {
  const [lastPage, setLastPage] = useState<CustomerPage>('dashboard');

  if (!props.token || !props.dashboard) {
    return <CustomerAuth call={props.call} onLogin={props.onLogin} run={props.run} />;
  }

  const navigate = (page: CustomerPage) => {
    if (page !== props.page) {
      setLastPage(props.page);
    }
    props.setPage(page);
  };
  const backTarget = customerBackTarget(props.page, lastPage);
  const showCustomerHeader = props.page === 'dashboard' || props.page === 'my';

  return (
    <section className="layout">
      <aside className="sidebar customer-sidebar">
        <div className="profile-card">
          <span className="avatar">{customerInitials(props.dashboard.customer)}</span>
          <strong>{props.dashboard.customer.email}</strong>
          <small>{props.dashboard.customer.vipLevel} / {kycLabelJa(props.dashboard.customer.kycStatus)}</small>
        </div>
        <nav className="side-nav">
          {customerNav.map((item) => {
            const Icon = item.icon;
            const active = isCustomerNavActive(item.key, props.page);
            return (
              <button key={item.key} className={active ? 'active' : ''} type="button" onClick={() => navigate(item.key)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="ghost-button full" type="button" onClick={props.onLogout}>
          ログアウト
        </button>
      </aside>
      <div className="content">
        {showCustomerHeader ? <CustomerHeader dashboard={props.dashboard} /> : null}
        <CustomerMobileToolbar page={props.page} onBack={() => navigate(backTarget)} />
        {props.page === 'dashboard' ? <CustomerDashboard dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'kyc' ? <KycPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'deposit' ? <DepositPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'withdraw' ? <WithdrawalPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'convert' ? <ConversionPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'funds' ? <FundsPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} navigate={navigate} /> : null}
        {props.page === 'ai' ? <AiPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'vip' ? <VipPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'invite' ? <InvitePage token={props.token} call={props.call} run={props.run} /> : null}
        {props.page === 'ledger' ? <LedgerPage dashboard={props.dashboard} /> : null}
        {props.page === 'activity' ? <ActivitySearchPage dashboard={props.dashboard} /> : null}
        {props.page === 'my' ? <MyPage dashboard={props.dashboard} navigate={navigate} onLogout={props.onLogout} /> : null}
      </div>
      <CustomerBottomNav page={props.page} setPage={navigate} />
    </section>
  );
}

function CustomerAuth(props: {
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  onLogin: (session: CustomerSession) => void;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [emailCodeSending, setEmailCodeSending] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const path = mode === 'login' ? '/auth/login' : '/auth/register';
    const result = await props.run(
      () =>
        props.call<CustomerSession>(path, {
          method: 'POST',
          body: JSON.stringify({ email, password, code, inviteCode }),
        }),
      mode === 'login' ? 'ログインしました。' : '登録が完了しました。',
    );
    if (result) {
      props.onLogin(result);
    }
  }

  async function sendEmailCode() {
    if (!email.trim()) {
      await props.run(() => Promise.reject(new Error('メールアドレスを入力してください。')));
      return;
    }
    setEmailCodeSending(true);
    const result = await props.run(
      () =>
        props.call('/auth/email-code/send', {
          method: 'POST',
          body: JSON.stringify({ email }),
        }),
      '認証コードを送信しました。',
    );
    setEmailCodeSending(false);
    setEmailCodeSent(Boolean(result));
  }

  return (
    <section className="auth-grid">
      <div className="auth-hero">
        <div className="hero-visual">
          <div className="hero-orbit">
            <span>JPY</span>
            <span>BTC</span>
            <span>ETH</span>
            <span>AI</span>
          </div>
          <div className="hero-chart" aria-hidden="true">
            {[24, 44, 38, 62, 58, 81, 72, 94, 86, 100].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
        <p className="eyebrow">AI裁定 Web</p>
        <h1>東京時間に基づくAI裁定アカウント</h1>
        <p>AI分析、資産交換、VIPレベル、招待報酬、裁定履歴を一つの画面で確認できます。処理結果と残高はリアルタイムに反映されます。</p>
        <div className="disclosure">
          <ShieldCheck size={18} />
          <span>本人確認後にAI裁定機能をご利用いただけます。</span>
        </div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            ログイン
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
            新規登録
          </button>
        </div>
        <label>
          メール
          <input
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailCodeSent(false);
            }}
          />
        </label>
        <label>
          パスワード
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {mode === 'register' ? (
          <>
            <div className="inline-fields">
              <label>
                認証コード
                <input value={code} onChange={(event) => setCode(event.target.value)} />
              </label>
              <button
                className="secondary-button"
                disabled={emailCodeSending}
                type="button"
                onClick={() => void sendEmailCode()}
              >
                {emailCodeSending ? '送信中...' : emailCodeSent ? '送信済み' : '送信'}
              </button>
            </div>
            <label>
              招待コード
              <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="任意" />
            </label>
          </>
        ) : null}
        <button className="primary-button" type="submit">
          <LogIn size={18} />
          {mode === 'login' ? 'ログイン' : '登録する'}
        </button>
        <p className="hint">認証コードを受け取り、本人確認完了後にAI裁定を利用できます。</p>
      </form>
    </section>
  );
}

function CustomerHeader({ dashboard }: { dashboard: DashboardData }) {
  const jpy = balanceOf(dashboard.balances, 'JPY');
  const signalTicker = rotatingSignalTicker(dashboard.marketTickers);
  return (
    <section className="page-head">
      <div>
        <p className="eyebrow">東京時間 {dashboard.tokyoNow}</p>
        <h1>こんにちは、{customerDisplayNameJa(dashboard.customer)}。</h1>
        <p>AI分析、VIP設定、利用可能残高、東京自然日に基づいて裁定処理を管理します。利益と残高は資金台帳に即時反映されます。</p>
      </div>
      <div className="headline-side">
        <div className="balance-pill">
          <Wallet size={18} />
          <span>{formatJpy(jpy.available)}</span>
        </div>
        <div className="market-card" aria-label="AI signal">
          <div className="market-card-top">
            <span>AIシグナル</span>
            <strong>{dashboard.marketScanner.signalState === 'opportunity' ? '検出' : '監視'}</strong>
          </div>
          <div className="spark-bars" aria-hidden="true">
            {[42, 64, 51, 78, 69, 88, 74, 96].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="market-card-bottom">
            <span>{signalTicker?.pair ?? dashboard.marketScanner.dominantPair}</span>
            <span>{signalTicker ? `${signalTicker.exchangeName} ${formatJpy(signalTicker.lastJpy)}` : '監視待機'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomerBottomNav({ page, setPage }: { page: CustomerPage; setPage: (page: CustomerPage) => void }) {
  return (
    <nav className="customer-bottom-nav" aria-label="顧客メインナビゲーション">
      {customerNav.map((item) => {
        const Icon = item.icon;
        const active = isCustomerNavActive(item.key, page);
        return (
          <button key={item.key} className={active ? 'active' : ''} type="button" onClick={() => setPage(item.key)}>
            <span className="bottom-nav-orbit">
              <Icon size={20} />
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function CustomerMobileToolbar({ page, onBack }: { page: CustomerPage; onBack: () => void }) {
  const mainPages: CustomerPage[] = ['dashboard', 'ai', 'funds', 'vip', 'my'];
  if (mainPages.includes(page)) {
    return null;
  }
  return (
    <div className="customer-mobile-toolbar">
      <button className="ghost-button" type="button" onClick={onBack}>
        <ChevronLeft size={18} />
        戻る
      </button>
      <strong>{customerPageTitle(page)}</strong>
    </div>
  );
}

function CustomerDashboard(props: {
  dashboard: DashboardData;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
}) {
  const { dashboard } = props;
  const jpy = balanceOf(dashboard.balances, 'JPY');
  const autoDisabled = dashboard.customer.kycStatus !== 'approved';

  async function toggleAuto() {
    const next = !dashboard.customer.autoAiEnabled;
    const data = await props.run(
      () =>
        props.call<DashboardData>(
          '/customer/simulation/auto-toggle',
          { method: 'POST', body: JSON.stringify({ enabled: next }) },
          props.token,
        ),
      next ? '自動AI裁定が有効になりました。' : '自動AI裁定が無効になりました。',
    );
    if (data) {
      await props.refresh();
    }
  }

  return (
    <>
      <MarketTickerStrip tickers={dashboard.marketTickers} />

      <section className="metric-grid">
        <Metric icon={Wallet} label="JPY利用可能残高" value={formatJpy(jpy.available)} note="JPY残高に即時反映" />
        <Metric icon={LineChart} label="本日収益" value={formatJpy(dashboard.todayProfitJpy)} note="AI裁定の実績利益" />
        <Metric icon={BadgeCheck} label="VIPレベル" value={dashboard.customer.vipLevel} note={`${dashboard.todayUsed}/${dashboard.todayLimit} 本日利用`} />
        <Metric icon={ShieldCheck} label="本人確認" value={kycLabelJa(dashboard.customer.kycStatus)} note={autoDisabled ? 'AI裁定はロック中' : 'AI裁定を利用できます'} />
        <Metric
          icon={Gauge}
          label="AI算力"
          value={aiPowerScore(dashboard)}
          note={autoDisabled ? '本人確認後に利用可能' : `信用${dashboard.customer.creditScore ?? 80} / 残り${Math.max(0, dashboard.todayLimit - dashboard.todayUsed)}回`}
        />
      </section>

      <section className="two-column">
        <div className="panel scanner-panel">
          <div className="panel-head">
            <div>
            <p className="eyebrow">AI裁定モニター</p>
              <h2>自動AI裁定</h2>
            </div>
            <button className={dashboard.customer.autoAiEnabled ? 'toggle on' : 'toggle'} disabled={autoDisabled} type="button" onClick={toggleAuto}>
              {dashboard.customer.autoAiEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <p>{autoDisabled ? '本人確認が完了していないため、自動AI裁定を利用できません。' : 'VIP設定、東京自然日、利用可能残高に基づいてAI裁定を自動実行します。'}</p>
          {dashboard.autoAiRuntime.stage === 'settled' ? (
            <div className="runtime-banner">
              <CheckCircle2 size={18} />
              <span>
                {dashboard.autoAiRuntime.lastOrderNo} / {formatJpy(dashboard.autoAiRuntime.lastProfitJpy ?? '0')} 反映済み
              </span>
            </div>
          ) : null}
          <div className="scanner-grid">
            <div>
              <span>取引所プール</span>
              <strong>{dashboard.marketScanner.enabledExchangeCount}</strong>
            </div>
            <div>
              <span>市場監視</span>
              <strong>{dashboard.marketScanner.signalState === 'opportunity' ? '裁定検出' : '監視中'}</strong>
            </div>
            <div>
              <span>検出中ペア</span>
              <strong>{dashboard.marketScanner.dominantPair}</strong>
            </div>
            <div>
              <span>利用可能機会</span>
              <strong>{dashboard.marketScanner.activeOpportunityCount}</strong>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Assets</p>
              <h2>資産残高</h2>
            </div>
            <Coins size={22} />
          </div>
          <div className="asset-list">
            {dashboard.balances.map((balance) => (
              <div key={balance.asset}>
                <span>{balance.asset}</span>
                <strong>{balance.asset === 'JPY' ? formatJpy(balance.available) : `${balance.available} ${balance.asset}`}</strong>
                {balance.asset !== 'JPY' ? <small>{formatJpy(estimatedAssetJpy(balance.asset, balance.available, dashboard.marketTickers))}</small> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">AI Summary</p>
            <h2>AI分析サマリー</h2>
          </div>
          <Sparkles size={22} />
        </div>
        <p>
          東京自然日、現在のVIP設定、利用可能残高、市場監視シグナル、直近ボラティリティ、流動性スコアをもとに、AI裁定機会を評価しています。
          利益はJPY残高へ反映され、履歴で確認できます。
        </p>
      </section>
    </>
  );
}

function MarketTickerStrip({ tickers }: { tickers: MarketTicker[] }) {
  const visible = tickers.slice(0, 8);
  return (
    <section className="ticker-strip" aria-label="market tickers">
      {visible.map((ticker) => (
        <div className="ticker-chip" key={`${ticker.exchangeId}-${ticker.pair}`}>
          <span>{ticker.exchangeName}</span>
          <strong>{ticker.pair}</strong>
          <em>{formatJpy(ticker.lastJpy)}</em>
          <small>{tickerStatusLabel(ticker)}</small>
        </div>
      ))}
    </section>
  );
}

function KycPage(props: {
  dashboard: DashboardData;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
}) {
  const [fullName, setFullName] = useState(props.dashboard.customer.name);
  const [documentNo, setDocumentNo] = useState('');
  const [licenseFile, setLicenseFile] = useState('');
  const [licensePreview, setLicensePreview] = useState('');
  const approved = props.dashboard.customer.kycStatus === 'approved';

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!licenseFile) {
      await props.run(() => Promise.reject(new Error('運転免許証の表面写真をアップロードしてください。')));
      return;
    }
    const result = await props.run(
      () =>
        props.call<CustomerProfile>(
          '/customer/kyc',
          { method: 'POST', body: JSON.stringify({ fullName, documentNo, documentFrontName: licenseFile, kycDocumentFrontDataUrl: licensePreview }) },
          props.token,
        ),
      '本人確認書類を提出しました。審査完了までお待ちください。',
    );
    if (result) {
      await props.refresh();
    }
  }

  return (
    <section className="panel narrow">
      <div className="panel-head">
        <div>
          <p className="eyebrow">KYC</p>
          <h2>本人確認</h2>
        </div>
        <ShieldCheck size={22} />
      </div>
      <p>現在の状態：{kycLabelJa(props.dashboard.customer.kycStatus)}</p>
      {approved ? (
        <div className="approval-card">
          <CheckCircle2 size={28} />
          <div>
            <strong>本人確認は承認済みです</strong>
            <p>AI裁定、資産交換、VIPアップグレードをご利用いただけます。追加提出は必要ありません。</p>
          </div>
        </div>
      ) : (
        <>
      <div className="requirement-box">
        <ShieldCheck size={18} />
        <div>
          <strong>運転免許証の表面写真が必要です</strong>
          <p>氏名、生年月日、住所、免許証番号が鮮明に見える写真をアップロードしてください。画像はぼやけ、反射、切れがない状態にしてください。</p>
        </div>
      </div>
      <form className="form-grid kyc-form" onSubmit={submit}>
        <label>
          氏名
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <label>
          書類番号
          <input value={documentNo} onChange={(event) => setDocumentNo(event.target.value)} />
        </label>
        <label>
          運転免許証 表面写真
          <input
            accept="image/jpeg,image/png,image/webp"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setLicenseFile(file?.name ?? '');
              setLicensePreview('');
              if (file) {
                void compactImage(file)
                  .then(setLicensePreview)
                  .catch((error) => props.run(() => Promise.reject(error)));
              }
            }}
          />
        </label>
        {licenseFile ? <p className="upload-note">選択済み：{licenseFile}</p> : <p className="upload-note">jpg / png / webp、文字が鮮明な画像を選択してください。</p>}
        {licensePreview ? (
          <div className="proof-preview has-image kyc-preview">
            <img alt="運転免許証 表面写真" src={licensePreview} />
          </div>
        ) : null}
        <button className="primary-button kyc-submit-button" type="submit">
          本人確認を提出
        </button>
      </form>
        </>
      )}
    </section>
  );
}

function DepositPage(props: {
  dashboard: DashboardData;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [asset, setAsset] = useState<Exclude<Asset, 'JPY'>>('ETH');
  const [network, setNetwork] = useState<'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum'>('Ethereum');
  const [amount, setAmount] = useState('1');
  const [proofText, setProofText] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [proofPreview, setProofPreview] = useState('');
  const [depositStep, setDepositStep] = useState<'address' | 'request'>('address');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositOrder | null>(null);
  const selectedNetwork = networkForAsset(asset, network);
  const depositAddress = depositAddressFor(props.dashboard.depositAddresses, asset, selectedNetwork);
  const enabledAddresses = props.dashboard.depositAddresses.filter((address) => address.enabled);
  const depositTotalJpy = sumValuationJpy(props.dashboard.deposits);
  const latestDepositAt = latestRecordTime(props.dashboard.deposits);
  const depositRecords = props.dashboard.deposits;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!proofFileName) {
      await props.run(() => Promise.reject(new Error('送金証明写真をアップロードしてください。')));
      return;
    }
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      await props.run(() => Promise.reject(new Error('入金数量を入力してください。')));
      return;
    }
    if (!proofText.trim()) {
      await props.run(() => Promise.reject(new Error('送金TxIDまたは受付番号を入力してください。')));
      return;
    }
    setSubmitting(true);
    try {
      const result = await props.run(
        () =>
          props.call(
            '/customer/deposits',
            {
              method: 'POST',
              body: JSON.stringify({
                asset,
                amount,
                network: selectedNetwork,
                proofText,
                proofImageName: proofFileName,
                proofImageDataUrl: proofPreview.length <= 60000 ? proofPreview : undefined,
              }),
            },
            props.token,
          ),
        '入金申請を送信しました。審査完了までお待ちください。',
      );
      if (result) {
        setProofText('');
        setProofFileName('');
        setProofPreview('');
        await props.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function selectProof(file?: File) {
    if (!file) {
      setProofFileName('');
      setProofPreview('');
      return;
    }
    setProofFileName(file.name);
    void compactImage(file).then(setProofPreview).catch(() => setProofPreview(''));
  }

  return (
    <section className="deposit-workspace">
      <div className="deposit-step-flow panel">
        <button className={depositStep === 'address' ? 'active' : ''} type="button" onClick={() => setDepositStep('address')}>
          <span>STEP 1</span>
          <strong>入金アドレス</strong>
          <small>送金先を確認・コピー</small>
        </button>
        <button className={depositStep === 'request' ? 'active' : ''} type="button" onClick={() => setDepositStep('request')}>
          <span>STEP 2</span>
          <strong>入金申請</strong>
          <small>数量と証明を提出</small>
        </button>
      </div>

      {depositStep === 'address' ? (
      <section className="panel deposit-address-page">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Deposit Address</p>
            <h2>入金アドレス</h2>
          </div>
          <Wallet size={22} />
        </div>
        <div className="deposit-address-selector">
          <label>
            資産
            <select
              value={asset}
              onChange={(event) => {
                const nextAsset = event.target.value as Exclude<Asset, 'JPY'>;
                setAsset(nextAsset);
                setNetwork(defaultNetworkForAsset(nextAsset));
              }}
            >
              <option value="ETH">ETH</option>
              <option value="BTC">BTC</option>
              <option value="USDT">USDT</option>
            </select>
          </label>
          <label>
            ネットワーク
            <select
              value={networkForAsset(asset, network)}
              onChange={(event) => setNetwork(event.target.value as typeof network)}
            >
              {asset === 'USDT' ? (
                <>
                  <option value="TRC-20">USDT TRC-20</option>
                  <option value="ERC-20">USDT ERC-20</option>
                </>
              ) : asset === 'BTC' ? (
                <option value="Bitcoin">Bitcoin</option>
              ) : (
                <option value="Ethereum">Ethereum</option>
              )}
            </select>
          </label>
        </div>
        <div className="deposit-address-hero">
          <div>
            <span>選択中</span>
            <strong>{asset} / {selectedNetwork}</strong>
            <small>最低確認 {depositAddress ? `${depositAddress.minConfirmations} confirmations` : '-'}</small>
          </div>
          <code>{depositAddress?.address ?? '現在このネットワークの入金アドレスは準備中です。'}</code>
          {depositAddress?.memo ? <p>メモ：{depositAddress.memo}</p> : null}
          <div className="row-actions deposit-step-actions">
            <button className="secondary-button" disabled={!depositAddress?.address} type="button" onClick={() => void copyToClipboard(depositAddress?.address ?? '')}>
              <Copy size={16} />
              アドレスをコピー
            </button>
            <button className="primary-button" type="button" onClick={() => setDepositStep('request')}>
              入金申請へ進む
            </button>
          </div>
        </div>
        <div className="address-card-grid compact">
          {enabledAddresses.map((address) => (
            <button
              className={address.asset === asset && address.network === selectedNetwork ? 'address-mini-card active' : 'address-mini-card'}
              key={address.id}
              type="button"
              onClick={() => {
                setAsset(address.asset);
                setNetwork(address.network);
              }}
            >
              <span>{address.asset}</span>
              <strong>{address.network}</strong>
              <small>{address.labelJa}</small>
            </button>
          ))}
        </div>
      </section>
      ) : null}

      {depositStep === 'request' ? (
      <section className="two-column deposit-form-grid">
      <form className="panel deposit-panel" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">入金</p>
            <h2>入金申請</h2>
          </div>
          <Wallet size={22} />
        </div>
        <div className="request-address-summary">
          <span>STEP 1で確認した入金先</span>
          <strong>{asset} / {selectedNetwork}</strong>
          <code>{depositAddress?.address ?? '入金アドレス設定待ち'}</code>
          <button className="ghost-button" type="button" onClick={() => setDepositStep('address')}>
            アドレスを変更
          </button>
        </div>
        <label>
          資産
          <select
            value={asset}
            onChange={(event) => {
              const nextAsset = event.target.value as Exclude<Asset, 'JPY'>;
              setAsset(nextAsset);
              setNetwork(defaultNetworkForAsset(nextAsset));
            }}
          >
            <option value="ETH">ETH</option>
            <option value="BTC">BTC</option>
            <option value="USDT">USDT</option>
          </select>
        </label>
        <label>
          ネットワーク
          <select
            value={networkForAsset(asset, network)}
            onChange={(event) => setNetwork(event.target.value as typeof network)}
          >
            {asset === 'USDT' ? (
              <>
                <option value="TRC-20">USDT TRC-20</option>
                <option value="ERC-20">USDT ERC-20</option>
              </>
            ) : asset === 'BTC' ? (
              <option value="Bitcoin">Bitcoin</option>
            ) : (
              <option value="Ethereum">Ethereum</option>
            )}
          </select>
        </label>
        <label>
          数量
          <input value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label>
          送金TxID / 受付メモ
          <input value={proofText} onChange={(event) => setProofText(event.target.value)} placeholder="TxID または受付番号" />
        </label>
        <label>
          送金証明写真
          <input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => selectProof(event.target.files?.[0])} />
        </label>
        <div className={proofPreview ? 'proof-preview has-image' : 'proof-preview'}>
          {proofPreview ? (
            <img alt="送金証明写真プレビュー" src={proofPreview} />
          ) : (
            <div>
              <Upload size={26} />
              <strong>転送明細、ウォレット送金画面、または取引完了画面をアップロード</strong>
              <span>金額、資産、日時、送金先が確認できる画像を選択してください。</span>
            </div>
          )}
        </div>
        {proofFileName ? <p className="upload-note">選択済み：{proofFileName}</p> : null}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? '送信中...' : '入金申請'}
        </button>
      </form>
      <aside className="panel deposit-guide">
        <div className="panel-head">
          <div>
            <p className="eyebrow">送金情報</p>
            <h2>入金案内</h2>
          </div>
          <LineChart size={22} />
        </div>
        <div className="deposit-address">
          <span>資産 / ネットワーク</span>
          <strong>{asset} / {selectedNetwork}</strong>
          <span>受取アドレス</span>
          <code>{depositAddress?.address ?? '現在このネットワークの入金アドレスは準備中です。'}</code>
          <span>最低確認</span>
          <strong>{depositAddress ? `${depositAddress.minConfirmations} confirmations` : '-'}</strong>
          {depositAddress?.memo ? (
            <>
              <span>メモ</span>
              <strong>{depositAddress.memo}</strong>
            </>
          ) : null}
        </div>
        <button
          className="secondary-button full"
          disabled={!depositAddress?.address}
          type="button"
          onClick={() => void copyToClipboard(depositAddress?.address ?? '')}
        >
          受取アドレスをコピー
        </button>
        <div className="flow-steps deposit-steps">
          <span className="active">1. 送金</span>
          <span className={proofFileName ? 'active' : ''}>2. 写真提出</span>
          <span>3. 残高反映</span>
        </div>
        <p>入金申請後、管理部門の確認が完了すると対象資産の残高へ反映されます。証明写真が不鮮明な場合は再提出が必要です。</p>
      </aside>
      </section>
      ) : null}
      <section className="panel deposit-history-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">入金状況</p>
            <h2>入金申請履歴</h2>
          </div>
          <History size={22} />
        </div>
        <HistorySummary
          items={[
            { label: '総申請', value: props.dashboard.deposits.length, note: '全ネットワーク' },
            { label: '確認中', value: countByStatus(props.dashboard.deposits, 'pending'), note: '管理確認待ち', tone: 'warning' },
            { label: '反映済み', value: countByStatus(props.dashboard.deposits, 'approved'), note: '残高反映済み', tone: 'success' },
            { label: '申請時評価額', value: formatJpy(depositTotalJpy), note: latestDepositAt ? `最新 ${formatTime(latestDepositAt)}` : '記録なし' },
          ]}
        />
        <MobileRecordPager
          className="mobile-records"
          emptyText="入金申請履歴はまだありません。"
          items={depositRecords}
          renderItem={(deposit) => (
            <button className="mobile-record-card" key={deposit.id} type="button" onClick={() => setSelectedDeposit(deposit)}>
              <div>
                <RecordCode primary={deposit.businessNo} secondary={deposit.network ?? '-'} />
                <StatusBadge label={depositStatusJa(deposit.status)} tone={depositStatusTone(deposit.status)} />
              </div>
              <div className="mobile-record-main">
                <strong>{deposit.asset} {deposit.amount}</strong>
                <span>{deposit.valuationJpy ? formatJpy(deposit.valuationJpy) : '評価額確認中'}</span>
              </div>
              <small>{deposit.priceSourceLabelJa ?? priceSourceLabelJa(deposit.priceSource)} / {formatTime(deposit.createdAt)}</small>
            </button>
          )}
        />
        <PaginatedTable
          columns={['受付番号', '資産', 'ネットワーク', '数量', '申請時評価額', '価格ソース', '状態', '証明', '申請時刻', '詳細']}
          rows={depositRecords.map((deposit) => [
            <RecordCode key={`${deposit.id}-no`} primary={deposit.businessNo} secondary={deposit.depositAddressSnapshot ? 'アドレス確認済み' : 'アドレス未設定'} />,
            <AssetBadge key={`${deposit.id}-asset`} asset={deposit.asset} network={deposit.network} />,
            deposit.network ?? '-',
            deposit.amount,
            deposit.valuationJpy ? formatJpy(deposit.valuationJpy) : '-',
            deposit.priceSourceLabelJa ?? priceSourceLabelJa(deposit.priceSource),
            <StatusBadge key={`${deposit.id}-status`} label={depositStatusJa(deposit.status)} tone={depositStatusTone(deposit.status)} />,
            deposit.proofImageName || deposit.proofText,
            formatTime(deposit.createdAt),
            <button className="table-action-button" key={`${deposit.id}-detail`} type="button" onClick={() => setSelectedDeposit(deposit)}>
              詳細
            </button>,
          ])}
        />
        {selectedDeposit ? <DepositDetailPanel deposit={selectedDeposit} onClose={() => setSelectedDeposit(null)} /> : null}
      </section>
    </section>
  );
}

function WithdrawalPage(props: {
  dashboard: DashboardData;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
}) {
  const [asset, setAsset] = useState<Asset>('JPY');
  const [network, setNetwork] = useState<'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum' | 'Bank'>('Bank');
  const [amount, setAmount] = useState('10000');
  const [destinationType, setDestinationType] = useState<'bank' | 'wallet'>('bank');
  const [destinationText, setDestinationText] = useState(() => withdrawalDestinationFor(props.dashboard.customer, 'JPY', 'Bank'));
  const [note, setNote] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalOrder | null>(null);
  const selectedBalance = balanceOf(props.dashboard.balances, asset);
  const withdrawalTotalJpy = sumValuationJpy(props.dashboard.withdrawals);
  const latestWithdrawalAt = latestRecordTime(props.dashboard.withdrawals);
  const withdrawalRecords = props.dashboard.withdrawals;

  useEffect(() => {
    setDestinationText(withdrawalDestinationFor(props.dashboard.customer, asset, network));
  }, [asset, network]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await props.run(
      () =>
        props.call(
          '/customer/withdrawals',
          {
              method: 'POST',
              body: JSON.stringify({
                asset,
                amount,
                destinationType,
                network,
                destinationText,
                note,
              }),
            },
            props.token,
        ),
      '出金申請を送信しました。審査完了までお待ちください。',
    );
    if (result) {
      setNote('');
      await props.refresh();
    }
  }

  return (
    <section className="two-column withdrawal-workspace">
      <form className="panel" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">出金</p>
            <h2>出金申請</h2>
          </div>
          <Banknote size={22} />
        </div>
        <div className="asset-picker">
          {props.dashboard.balances.map((balance) => (
            <button
              className={asset === balance.asset ? 'asset-option active' : 'asset-option'}
              key={balance.asset}
              type="button"
              onClick={() => {
                setAsset(balance.asset);
                setNetwork(defaultNetworkForWithdraw(balance.asset));
                setDestinationType(balance.asset === 'JPY' ? 'bank' : 'wallet');
              }}
            >
              <span>{balance.asset}</span>
              <strong>{balance.asset === 'JPY' ? formatJpy(balance.available) : balance.available}</strong>
              <small>凍結 {balance.frozen} {balance.asset}</small>
            </button>
          ))}
        </div>
        <label>
          出金資産
          <select
            value={asset}
            onChange={(event) => {
              const nextAsset = event.target.value as Asset;
              setAsset(nextAsset);
              setNetwork(defaultNetworkForWithdraw(nextAsset));
              setDestinationType(nextAsset === 'JPY' ? 'bank' : 'wallet');
            }}
          >
            <option value="JPY">JPY</option>
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
        </label>
        {asset !== 'JPY' ? (
          <label>
            ネットワーク
            <select value={network} onChange={(event) => setNetwork(event.target.value as typeof network)}>
              {asset === 'USDT' ? (
                <>
                  <option value="TRC-20">USDT TRC-20</option>
                  <option value="ERC-20">USDT ERC-20</option>
                </>
              ) : asset === 'BTC' ? (
                <option value="Bitcoin">Bitcoin</option>
              ) : (
                <option value="Ethereum">Ethereum</option>
              )}
            </select>
          </label>
        ) : null}
        <label>
          数量
          <input value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label>
          出金先種別
          <select value={destinationType} onChange={(event) => setDestinationType(event.target.value as 'bank' | 'wallet')}>
            <option value="bank">銀行口座</option>
            <option value="wallet">ウォレット</option>
          </select>
        </label>
        <label>
          出金先
          <input
            value={destinationText}
            onChange={(event) => setDestinationText(event.target.value)}
            placeholder={destinationType === 'bank' ? '銀行名 / 支店 / 口座番号 / 名義' : `${network} / ウォレットアドレス`}
          />
        </label>
        <p className="upload-note">登録済みの出金先を自動反映します。必要に応じて手入力で上書きできます。</p>
        <label>
          備考
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="任意" />
        </label>
        <div className="balance-hint">
          <span>利用可能</span>
          <strong>{asset === 'JPY' ? formatJpy(selectedBalance.available) : `${selectedBalance.available} ${asset}`}</strong>
          <small>申請後は審査完了まで凍結されます。</small>
        </div>
        <button className="primary-button" type="submit">
          出金申請
        </button>
      </form>
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">出金状況</p>
            <h2>出金履歴</h2>
          </div>
          <History size={22} />
        </div>
        <HistorySummary
          items={[
            { label: '総申請', value: props.dashboard.withdrawals.length, note: 'JPY / 暗号資産' },
            { label: '審査中', value: countByStatus(props.dashboard.withdrawals, 'pending'), note: '処理待ち', tone: 'warning' },
            { label: '出金完了', value: countByStatus(props.dashboard.withdrawals, 'approved'), note: '承認済み', tone: 'success' },
            { label: '申請時評価額', value: formatJpy(withdrawalTotalJpy), note: latestWithdrawalAt ? `最新 ${formatTime(latestWithdrawalAt)}` : '記録なし' },
          ]}
        />
        <MobileRecordPager
          className="mobile-records"
          emptyText="出金履歴はまだありません。"
          items={withdrawalRecords}
          renderItem={(withdrawal) => (
            <button className="mobile-record-card" key={withdrawal.id} type="button" onClick={() => setSelectedWithdrawal(withdrawal)}>
              <div>
                <RecordCode primary={withdrawal.businessNo} secondary={withdrawal.destinationType === 'bank' ? '銀行口座' : withdrawal.network ?? 'ウォレット'} />
                <StatusBadge label={withdrawalStatusJa(withdrawal.status)} tone={withdrawalStatusTone(withdrawal.status)} />
              </div>
              <div className="mobile-record-main">
                <strong>{withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : `${withdrawal.amount} ${withdrawal.asset}`}</strong>
                <span>{withdrawal.valuationJpy ? formatJpy(withdrawal.valuationJpy) : withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : '評価額確認中'}</span>
              </div>
              <small>{withdrawal.priceSourceLabelJa ?? priceSourceLabelJa(withdrawal.priceSource)} / {formatTime(withdrawal.createdAt)}</small>
            </button>
          )}
        />
        <PaginatedTable
          columns={['受付番号', '資産', 'ネットワーク', '数量', '申請時評価額', '価格ソース', '出金先', '状態', '申請時刻', '詳細']}
          rows={withdrawalRecords.map((withdrawal) => [
            <RecordCode key={`${withdrawal.id}-no`} primary={withdrawal.businessNo} secondary={withdrawal.destinationType === 'bank' ? '銀行口座' : 'ウォレット'} />,
            <AssetBadge key={`${withdrawal.id}-asset`} asset={withdrawal.asset} network={withdrawal.network} />,
            withdrawal.network ?? '-',
            withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : withdrawal.amount,
            withdrawal.valuationJpy ? formatJpy(withdrawal.valuationJpy) : '-',
            withdrawal.priceSourceLabelJa ?? priceSourceLabelJa(withdrawal.priceSource),
            withdrawal.destinationText,
            <StatusBadge key={`${withdrawal.id}-status`} label={withdrawalStatusJa(withdrawal.status)} tone={withdrawalStatusTone(withdrawal.status)} />,
            formatTime(withdrawal.createdAt),
            <button className="table-action-button" key={`${withdrawal.id}-detail`} type="button" onClick={() => setSelectedWithdrawal(withdrawal)}>
              詳細
            </button>,
          ])}
        />
        {selectedWithdrawal ? <WithdrawalDetailPanel withdrawal={selectedWithdrawal} onClose={() => setSelectedWithdrawal(null)} /> : null}
      </section>
    </section>
  );
}

function ConversionPage(props: {
  dashboard: DashboardData;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
}) {
  const [conversionStep, setConversionStep] = useState<'asset' | 'quote' | 'execute'>('asset');
  const [fromAsset, setFromAsset] = useState<Exclude<Asset, 'JPY'>>('ETH');
  const [amount, setAmount] = useState('0.2');
  const [quote, setQuote] = useState<ConversionQuote | null>(null);
  const selectedBalance = balanceOf(props.dashboard.balances, fromAsset);
  const liveUnitPrice = estimatedAssetJpy(fromAsset, '1', props.dashboard.marketTickers);
  const quoteUnitPrice = quote?.fromAsset === fromAsset ? Number(quote.unitPriceJpy) : liveUnitPrice;
  const quoteEstimatedJpy = quote?.fromAsset === fromAsset ? Number(quote.receivedJpy) : estimatedAssetJpy(fromAsset, amount || '0', props.dashboard.marketTickers);
  const convertibleBalances = props.dashboard.balances.filter((item) => item.asset !== 'JPY' && Number(item.available) > 0);

  async function createQuote(event: FormEvent) {
    event.preventDefault();
    const result = await props.run(
      () =>
        props.call<ConversionQuote>(
          '/customer/conversions/quote',
          { method: 'POST', body: JSON.stringify({ fromAsset, amount }) },
          props.token,
        ),
      '交換レートを確認しました。',
    );
    if (result) {
      setQuote(result);
      setConversionStep('quote');
    }
  }

  async function execute() {
    if (!quote) return;
    const result = await props.run(
      () => props.call<DashboardData>('/customer/conversions', { method: 'POST', body: JSON.stringify({ quoteId: quote.id }) }, props.token),
      '資産交換が完了しました。',
    );
    if (result) {
      setQuote(null);
      setConversionStep('asset');
      await props.refresh();
    }
  }

  return (
    <section className="conversion-page">
    <CustomerStepFlow
      steps={[
        { key: 'asset', label: '資産数量', note: `${fromAsset} / 利用可能 ${selectedBalance.available}` },
        { key: 'quote', label: 'レート確認', note: quote ? `受取 ${formatJpy(quote.receivedJpy)}` : '見積取得待ち', disabled: !quote },
        { key: 'execute', label: '交換実行', note: quote ? '最終確認' : '見積後に実行', disabled: !quote },
      ]}
      value={conversionStep}
      onChange={(value) => {
        if (value !== 'asset' && !quote) return;
        setConversionStep(value);
      }}
    />
    <section className="two-column conversion-workspace">
      <form className="panel conversion-panel" onSubmit={createQuote}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Asset Exchange</p>
            <h2>{fromAsset} を JPY へ交換</h2>
          </div>
          <ArrowRightLeft size={22} />
        </div>
        <div className="pair-board">
          <div>
            <span>交換ペア</span>
            <strong>{fromAsset} → JPY</strong>
          </div>
          <div>
            <span>{quote?.fromAsset === fromAsset ? '今回の見積レート' : '参考レート'}</span>
            <strong>1 {fromAsset} = {formatJpy(quoteUnitPrice)}</strong>
          </div>
        </div>
        <div className="asset-picker">
          {convertibleBalances.map((balance) => (
            <button
              className={fromAsset === balance.asset ? 'asset-option active' : 'asset-option'}
              key={balance.asset}
              type="button"
              onClick={() => {
                setFromAsset(balance.asset as Exclude<Asset, 'JPY'>);
                setAmount(String(Math.min(Number(balance.available), Number(amount) || Number(balance.available))));
                setQuote(null);
                setConversionStep('asset');
              }}
            >
              <span>{balance.asset}</span>
              <strong>{balance.available}</strong>
              <small>{formatJpy(estimatedAssetJpy(balance.asset, balance.available, props.dashboard.marketTickers))}</small>
            </button>
          ))}
        </div>
        <label>
          交換元資産
          <select value={fromAsset} onChange={(event) => { setFromAsset(event.target.value as Exclude<Asset, 'JPY'>); setQuote(null); setConversionStep('asset'); }}>
            <option value="ETH">ETH</option>
            <option value="BTC">BTC</option>
            <option value="USDT">USDT</option>
          </select>
        </label>
        <label>
          数量
          <input value={amount} onChange={(event) => { setAmount(event.target.value); setQuote(null); setConversionStep('asset'); }} />
        </label>
        <div className="balance-hint">
          <span>利用可能</span>
          <strong>{selectedBalance.available} {fromAsset}</strong>
          <small>概算 {formatJpy(estimatedAssetJpy(fromAsset, selectedBalance.available, props.dashboard.marketTickers))}</small>
        </div>
        <button className="primary-button" type="submit">
          レートを確認
        </button>
        <div className="flow-steps">
          <span className="active">1. 資産選択</span>
          <span className={quote ? 'active' : ''}>2. レート確認</span>
          <span>3. JPY反映</span>
        </div>
        <p className="conversion-note">
          保有している暗号資産を選択し、数量を入力してJPY受取額を確認してください。確定すると選択資産が減少し、JPY残高へ反映されます。
        </p>
      </form>
      <div className="panel rate-panel">
        <div className="panel-head">
          <h2>JPY受取見積</h2>
          <Clock3 size={22} />
        </div>
        {quote ? (
          <div className="quote-card">
            <div className="quote-hero">
              <span>{quote.displayPair}</span>
              <strong>{quote.fromAmount} {quote.fromAsset} = {formatJpy(quote.receivedJpy)}</strong>
              <small>1 {quote.fromAsset} = {formatJpy(quote.unitPriceJpy)}</small>
            </div>
            <div className="quote-breakdown">
              <div>
                <span>概算JPY</span>
                <strong>{formatJpy(quote.estimatedJpy)}</strong>
              </div>
              <div>
                <span>手数料</span>
                <strong>{formatJpy(quote.feeJpy)}</strong>
              </div>
              <div>
                <span>受取予定</span>
                <strong>{formatJpy(quote.receivedJpy)}</strong>
              </div>
            </div>
            <div className="conversion-route">
              {quote.path.map((step, index) => (
                <span className="active" key={`${step}-${index}`}>{step}</span>
              ))}
            </div>
            <div className="rate-meta-grid">
              <span>価格ソース</span>
              <strong>{quote.priceSourceLabelJa ?? rateSourceLabel(quote.rateSource)}</strong>
              <span>取得市場</span>
              <strong>{quote.marketExchange ?? '-'}</strong>
              <span>取引ペア</span>
              <strong>{quote.marketPair ?? quote.displayPair}</strong>
              <span>Bid / Ask</span>
              <strong>{quote.marketBidJpy && quote.marketAskJpy ? `${formatJpy(quote.marketBidJpy)} / ${formatJpy(quote.marketAskJpy)}` : '-'}</strong>
              <span>Last</span>
              <strong>{quote.marketLastJpy ? formatJpy(quote.marketLastJpy) : '-'}</strong>
              <span>暗号資産/USDT</span>
              <strong>{quote.snapshot.cryptoToUsdt}</strong>
              <span>USDT/USD</span>
              <strong>{quote.snapshot.usdtToUsd}</strong>
              <span>USD/JPY</span>
              <strong>{quote.snapshot.usdToJpy}</strong>
              <span>更新</span>
              <strong>{formatTime(quote.rateUpdatedAt)}</strong>
              <span>有効期限</span>
              <strong>{formatTime(quote.expiresAt)}</strong>
            </div>
            <p className="market-source-note">{quote.priceSourceDetailJa ?? '見積取得時点の市場データに基づいてJPY評価額を算出しています。'}</p>
            <p>
              {fromAsset === 'USDT' ? 'USDT は USD -> JPY の順でJPY残高へ反映されます。' : `${fromAsset} は USDT -> USD -> JPY の順に換算され、JPY残高へ反映されます。`}
              レートは見積取得時点の市場データに基づき、有効期限内のみ確定できます。
            </p>
            {conversionStep === 'execute' ? (
              <button className="primary-button" type="button" onClick={execute}>
                交換を実行
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={() => setConversionStep('execute')}>
                交換内容を確認
              </button>
            )}
          </div>
        ) : (
          <div className="conversion-help">
            <div className="quote-hero muted">
              <span>{fromAsset}/JPY</span>
              <strong>{amount || '0'} {fromAsset} ≒ {formatJpy(quoteEstimatedJpy)}</strong>
              <small>レート確認後、価格ソースと有効期限を表示します。</small>
            </div>
            <p>選択した資産数量に対してJPY受取額を確認します。レート取得後、有効期限内に交換を実行してください。</p>
          </div>
        )}
      </div>
    </section>
    </section>
  );
}

function FundsPage(props: {
  dashboard: DashboardData;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
  navigate: (page: CustomerPage) => void;
}) {
  const jpy = balanceOf(props.dashboard.balances, 'JPY');
  const cryptoTotalJpy = props.dashboard.balances
    .filter((balance) => balance.asset !== 'JPY')
    .reduce((sum, balance) => sum + estimatedAssetJpy(balance.asset, balance.available, props.dashboard.marketTickers), 0);
  const latestDeposit = props.dashboard.deposits[0];
  const latestWithdrawal = props.dashboard.withdrawals[0];
  const latestOrder = props.dashboard.orders[0];
  const enabledAddresses = props.dashboard.depositAddresses.filter((address) => address.enabled);

  return (
    <section className="funds-workspace">
      <div className="funds-hero panel">
        <div>
          <p className="eyebrow">Assets</p>
          <h2>入出金・交換</h2>
          <p>資産の入金先確認、入金申請、出金申請、JPY交換を必要な画面だけ開いて操作できます。</p>
        </div>
        <div className="funds-balance-grid">
          <div>
            <span>JPY利用可能</span>
            <strong>{formatJpy(jpy.available)}</strong>
          </div>
          <div>
            <span>暗号資産評価額</span>
            <strong>{formatJpy(cryptoTotalJpy)}</strong>
          </div>
          <div>
            <span>入金確認待ち</span>
            <strong>{countByStatus(props.dashboard.deposits, 'pending')}</strong>
          </div>
          <div>
            <span>出金審査中</span>
            <strong>{countByStatus(props.dashboard.withdrawals, 'pending')}</strong>
          </div>
        </div>
      </div>

      <div className="funds-action-grid">
        {[
          { key: 'deposit', label: '入金', icon: Wallet, note: latestDeposit ? depositStatusJa(latestDeposit.status) : 'アドレス確認・申請' },
          { key: 'withdraw', label: '出金', icon: Banknote, note: latestWithdrawal ? withdrawalStatusJa(latestWithdrawal.status) : '申請作成' },
          { key: 'convert', label: '資産交換', icon: ArrowRightLeft, note: '暗号資産をJPYへ' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className="mobile-action"
              type="button"
              onClick={() => props.navigate(item.key as CustomerPage)}
            >
              <Icon size={20} />
              <strong>{item.label}</strong>
              <span>{item.note}</span>
            </button>
          );
        })}
      </div>

      <div className="funds-dashboard-grid">
        <section className="panel funds-address-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Deposit Address</p>
              <h2>入金アドレス</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => props.navigate('deposit')}>
              詳細
            </button>
          </div>
          <div className="address-card-grid">
            {enabledAddresses.length === 0 ? <EmptyState text="入金アドレスは管理側の設定待ちです。" /> : null}
            {enabledAddresses.slice(0, 4).map((address) => (
              <article className="address-copy-card" key={address.id}>
                <div>
                  <span>{address.labelJa}</span>
                  <strong>{address.asset} / {address.network}</strong>
                </div>
                <code>{address.address}</code>
                <button className="secondary-button" type="button" onClick={() => void copyToClipboard(address.address)}>
                  <Copy size={16} />
                  コピー
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel funds-recent-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h2>最新状況</h2>
            </div>
            <History size={22} />
          </div>
          <div className="funds-recent-list">
            <button type="button" onClick={() => props.navigate('deposit')}>
              <span>最新入金</span>
              <strong>{latestDeposit ? latestDeposit.businessNo : '記録なし'}</strong>
              <small>{latestDeposit ? `${latestDeposit.asset} ${latestDeposit.amount} / ${depositStatusJa(latestDeposit.status)}` : '入金申請を作成できます'}</small>
            </button>
            <button type="button" onClick={() => props.navigate('withdraw')}>
              <span>最新出金</span>
              <strong>{latestWithdrawal ? latestWithdrawal.businessNo : '記録なし'}</strong>
              <small>{latestWithdrawal ? `${latestWithdrawal.asset} ${latestWithdrawal.amount} / ${withdrawalStatusJa(latestWithdrawal.status)}` : '出金申請を作成できます'}</small>
            </button>
            <button type="button" onClick={() => props.navigate('ai')}>
              <span>最新AI注文</span>
              <strong>{latestOrder ? latestOrder.businessNo : '記録なし'}</strong>
              <small>{latestOrder ? `${orderStatusJa(latestOrder.status)} / ${formatJpy(latestOrder.profitJpy)}` : 'AI裁定後に表示されます'}</small>
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function AiPage(props: {
  dashboard: DashboardData;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
}) {
  const [aiStep, setAiStep] = useState<'scan' | 'opportunities' | 'orders'>('scan');
  const [lastOrder, setLastOrder] = useState<SimulationOrder | null>(null);
  const [selected, setSelected] = useState<SimulationOpportunity | null>(null);
  const [missedSelected, setMissedSelected] = useState<SimulationOpportunity | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SimulationOrder | null>(null);
  const [missedPage, setMissedPage] = useState(1);
  const autoDisabled = props.dashboard.customer.kycStatus !== 'approved';
  const dailyLimitReached = props.dashboard.todayUsed >= props.dashboard.todayLimit;
  const missedPageSize = 10;
  const missedTotalPages = Math.max(1, Math.ceil(props.dashboard.missedOpportunities.length / missedPageSize));
  const safeMissedPage = Math.min(missedPage, missedTotalPages);
  const missedStart = (safeMissedPage - 1) * missedPageSize;
  const visibleMissed = props.dashboard.missedOpportunities.slice(missedStart, missedStart + missedPageSize);
  const orderProfitJpy = props.dashboard.orders.reduce((sum, order) => sum + Number(order.profitJpy || 0), 0);
  const latestOrderAt = latestRecordTime(props.dashboard.orders);
  const orderRecords = props.dashboard.orders;
  const noOpportunityMessage = opportunityEmptyStateText(props.dashboard);
  const missedPager =
    props.dashboard.missedOpportunities.length > missedPageSize ? (
      <PaginationControls
        page={safeMissedPage}
        totalPages={missedTotalPages}
        totalItems={props.dashboard.missedOpportunities.length}
        start={missedStart}
        pageSize={missedPageSize}
        onPrev={() => setMissedPage((value) => Math.max(1, value - 1))}
        onNext={() => setMissedPage((value) => Math.min(missedTotalPages, value + 1))}
      />
    ) : null;

  useEffect(() => {
    if (missedPage > missedTotalPages) {
      setMissedPage(missedTotalPages);
    }
  }, [missedPage, missedTotalPages]);

  async function toggleAuto() {
    const next = !props.dashboard.customer.autoAiEnabled;
    const data = await props.run(
      () =>
        props.call<DashboardData>(
          '/customer/simulation/auto-toggle',
          { method: 'POST', body: JSON.stringify({ enabled: next }) },
          props.token,
        ),
      next ? '自動AI裁定を開始しました。' : '自動AI裁定を停止しました。',
    );
    if (data) {
      await props.refresh();
    }
  }

  async function execute(opportunityId: string) {
    const result = await props.run(
      () =>
        props.call<{ order: SimulationOrder | null; missedOpportunity: SimulationOpportunity | null; dashboard: DashboardData }>(
          '/customer/simulation/orders',
          { method: 'POST', body: JSON.stringify({ opportunityId }) },
          props.token,
        ),
      'AI裁定の判定が完了しました。',
    );
    if (result) {
      if (result.order) {
        setLastOrder(result.order);
        setAiStep('orders');
      }
      if (result.missedOpportunity) {
        setMissedSelected(result.missedOpportunity);
        setAiStep('opportunities');
      }
      setSelected(null);
      await props.refresh();
    }
  }

  return (
    <section className="ai-workspace">
      <CustomerStepFlow
        steps={[
          { key: 'scan', label: '市場監視', note: props.dashboard.customer.autoAiEnabled ? '自動AI稼働中' : '手動確認' },
          { key: 'opportunities', label: '裁定機会', note: `${props.dashboard.opportunities.length}件 / 失敗${props.dashboard.missedOpportunities.length}件` },
          { key: 'orders', label: '実行履歴', note: `${props.dashboard.orders.length}件` },
        ]}
        value={aiStep}
        onChange={(value) => setAiStep(value)}
      />
      {aiStep === 'scan' ? (
      <div className="panel ai-command-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">AI裁定モニター</p>
            <h2>裁定機会</h2>
          </div>
          <Bot size={22} />
        </div>
        <div className="ai-start-row">
          <div>
            <strong>{props.dashboard.customer.autoAiEnabled ? '自動AI裁定 稼働中' : '自動AI裁定 停止中'}</strong>
            <span>{props.dashboard.autoAiRuntime.nextRunHintJa}</span>
          </div>
          <button className={props.dashboard.customer.autoAiEnabled ? 'toggle on' : 'toggle'} disabled={autoDisabled} type="button" onClick={toggleAuto}>
            {props.dashboard.customer.autoAiEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {props.dashboard.autoAiRuntime.lastOrderNo ? (
          <div className="runtime-banner light">
            <CheckCircle2 size={18} />
            <span>
              最新処理 {props.dashboard.autoAiRuntime.lastOrderNo} / 利益 {formatJpy(props.dashboard.autoAiRuntime.lastProfitJpy ?? '0')}
            </span>
          </div>
        ) : null}
        {props.dashboard.autoAiRuntime.stage === 'missed' ? (
          <button
            className="runtime-banner light warning-runtime"
            type="button"
            onClick={() => {
              const missed = props.dashboard.missedOpportunities.find((item) => item.id === props.dashboard.autoAiRuntime.lastMissedOpportunityId);
              if (missed) setMissedSelected(missed);
            }}
          >
            <Clock3 size={18} />
            <span>{props.dashboard.autoAiRuntime.lastMissedReasonJa ?? '直近の裁定機会は失敗となりました。'}</span>
          </button>
        ) : null}
        <div className="scanner-grid">
          <div>
            <span>状態</span>
            <strong>{props.dashboard.marketScanner.signalState === 'opportunity' ? '検出中' : props.dashboard.marketScanner.signalState === 'locked' ? 'ロック中' : 'スキャン中'}</strong>
          </div>
          <div>
            <span>取引所</span>
            <strong>{props.dashboard.marketScanner.enabledExchangeCount}</strong>
          </div>
          <div>
            <span>市場監視</span>
            <strong>{dailyLimitReached ? '本日上限到達' : props.dashboard.marketScanner.signalState === 'opportunity' ? '裁定検出' : '監視中'}</strong>
          </div>
          <div>
            <span>検出ペア</span>
            <strong>{props.dashboard.marketScanner.dominantPair}</strong>
          </div>
        </div>
        <div className="runtime-status-card">
          <div>
            <span>相場レイヤー</span>
            <strong>{props.dashboard.tradingRuntime.marketDataMode === 'real_public_api' ? '公開API優先' : 'バックアップ併用'}</strong>
          </div>
          <div>
            <span>実行レイヤー</span>
            <strong>{executionModeJa(props.dashboard.tradingRuntime.executionMode)}</strong>
          </div>
          <div>
            <span>API / 予備</span>
            <strong>
              {props.dashboard.tradingRuntime.realApiTickerCount} / {props.dashboard.tradingRuntime.fallbackTickerCount}
            </strong>
          </div>
          <p>{props.dashboard.tradingRuntime.messageJa}</p>
        </div>
        <MarketTickerStrip tickers={props.dashboard.marketTickers.slice(0, 6)} />
      </div>
      ) : null}
      {aiStep === 'opportunities' ? (
      <div className="panel" id="ai-opportunities">
      <div className="panel-head">
        <div>
          <p className="eyebrow">裁定機会</p>
          <h2>利用可能な裁定機会</h2>
        </div>
        <Search size={22} />
      </div>
        <div className="cards-list">
        {dailyLimitReached ? (
          <div className="runtime-banner light warning-runtime">
            <Clock3 size={18} />
            <span>本日の利用回数は完了しました。市場シグナルは監視表示のみ更新され、東京時間の翌日から実行できます。</span>
          </div>
        ) : null}
        {props.dashboard.opportunities.length === 0 ? <EmptyState text={noOpportunityMessage} /> : null}
        {props.dashboard.opportunities.map((opportunity) => (
          <article className="opportunity-card" key={opportunity.id}>
            <div>
              <strong>{opportunity.pair} / {opportunity.spreadPercent}%</strong>
              <p>{`${opportunity.exchanges[0]} -> ${opportunity.exchanges[1]}`}</p>
              <small>{opportunity.aiSummaryJa}</small>
              <div className="opportunity-detail-grid">
                <span>買付参考 {formatJpy(opportunity.buyReferenceJpy)}</span>
                <span>売却参考 {formatJpy(opportunity.sellReferenceJpy)}</span>
                <span>数量 {opportunity.quantity} {opportunity.baseAsset}</span>
                <span>粗利益 {formatJpy(opportunity.grossProfitJpy)}</span>
                <span>コスト {formatJpy(opportunity.totalCostJpy)}</span>
                <span>AI信頼度 {opportunity.confidencePercent}%</span>
                <span>流動性 {opportunity.liquidityScore}</span>
                <span>処理見込み 即時反映</span>
                <span>東京日 {opportunity.businessDateTokyo}</span>
              </div>
            </div>
            <div className="opportunity-metrics">
              <span>{opportunity.spreadPercent}%</span>
              <strong>{formatJpy(opportunity.estimatedProfitJpy)}</strong>
              <button className="primary-button" disabled={opportunity.status !== 'available'} type="button" onClick={() => setSelected(opportunity)}>
                {dailyLimitReached ? '詳細を確認' : '詳細を確認'}
              </button>
            </div>
          </article>
        ))}
      </div>
      {selected ? (
        <div className="execution-result">
          <div className="panel-head">
            <div>
              <p className="eyebrow">AI分析詳細</p>
              <h3>{selected.pair} 裁定詳細</h3>
            </div>
            <Search size={22} />
          </div>
          <div className="result-grid">
            <span>取引所</span>
            <strong>{`${selected.exchanges[0]} -> ${selected.exchanges[1]}`}</strong>
            <span>対象元本</span>
            <strong>{formatJpy(selected.principalJpy)}</strong>
            <span>対象数量</span>
            <strong>{selected.quantity} {selected.baseAsset}</strong>
            <span>買付価格</span>
            <strong>{formatJpy(selected.buyReferenceJpy)}</strong>
            <span>売却価格</span>
            <strong>{formatJpy(selected.sellReferenceJpy)}</strong>
            <span>粗利益</span>
            <strong>{formatJpy(selected.grossProfitJpy)}</strong>
            <span>買付手数料</span>
            <strong>{formatJpy(selected.buyFeeJpy)}</strong>
            <span>売却手数料</span>
            <strong>{formatJpy(selected.sellFeeJpy)}</strong>
            <span>スリッページ</span>
            <strong>{formatJpy(selected.slippageCostJpy)}</strong>
            <span>リスクバッファ</span>
            <strong>{formatJpy(selected.riskBufferJpy)}</strong>
            <span>控除合計</span>
            <strong>{formatJpy(selected.totalCostJpy)}</strong>
            <span>純利益</span>
            <strong>{formatJpy(selected.estimatedProfitJpy)}</strong>
            <span>価格差</span>
            <strong>{selected.spreadPercent}%</strong>
            <span>AI信頼度</span>
            <strong>{selected.confidencePercent}%</strong>
            <span>流動性</span>
            <strong>{selected.liquidityScore}</strong>
            <span>24h変動率</span>
            <strong>{selected.volatility24hPercent}%</strong>
            <span>リスク</span>
            <strong>{selected.riskLevelJa}</strong>
            <span>東京日</span>
            <strong>{selected.businessDateTokyo}</strong>
          </div>
          <p>{selected.aiSummaryJa}</p>
          <div className="flow-steps">
            <span className="active">1. AI分析</span>
            <span className="active">2. 条件照合</span>
            <span className="active">3. 利益反映</span>
          </div>
          <div className="row-actions">
            <button className="primary-button" disabled={dailyLimitReached} type="button" onClick={() => void execute(selected.id)}>
              {dailyLimitReached ? '本日上限に到達' : 'この内容で実行'}
            </button>
            <button className="ghost-button" type="button" onClick={() => setSelected(null)}>
              閉じる
            </button>
          </div>
        </div>
      ) : null}
      <h3 id="ai-missed">失敗記録</h3>
      {missedPager}
      <div className="cards-list compact-list">
        {props.dashboard.missedOpportunities.length === 0 ? <EmptyState text="失敗した裁定機会はまだありません。" /> : null}
        {visibleMissed.map((opportunity) => (
          <article className="opportunity-card missed-card" key={opportunity.id}>
            <div>
              <strong>{opportunity.pair} / {opportunity.spreadPercent}%</strong>
              <p>{`${opportunity.exchanges[0]} -> ${opportunity.exchanges[1]}`}</p>
              <small>{opportunity.missedReasonJa ?? '市場条件の変動により失敗となりました。'}</small>
            </div>
            <div className="opportunity-metrics">
              <span>失敗</span>
              <strong>{formatTime(opportunity.missedAt ?? opportunity.createdAt)}</strong>
              <button className="ghost-button" type="button" onClick={() => setMissedSelected(opportunity)}>
                詳細
              </button>
            </div>
          </article>
        ))}
      </div>
      {missedPager}
      {missedSelected ? (
        <div className="execution-result missed-detail">
          <div className="panel-head">
            <div>
              <p className="eyebrow">失敗詳細</p>
              <h3>{missedSelected.pair} 失敗詳細</h3>
            </div>
            <Clock3 size={22} />
          </div>
          <div className="result-grid">
            <span>取引所</span>
            <strong>{`${missedSelected.exchanges[0]} -> ${missedSelected.exchanges[1]}`}</strong>
            <span>対象元本</span>
            <strong>{formatJpy(missedSelected.principalJpy)}</strong>
            <span>対象数量</span>
            <strong>{missedSelected.quantity} {missedSelected.baseAsset}</strong>
            <span>買付価格</span>
            <strong>{formatJpy(missedSelected.buyReferenceJpy)}</strong>
            <span>売却価格</span>
            <strong>{formatJpy(missedSelected.sellReferenceJpy)}</strong>
            <span>粗利益</span>
            <strong>{formatJpy(missedSelected.grossProfitJpy)}</strong>
            <span>控除合計</span>
            <strong>{formatJpy(missedSelected.totalCostJpy)}</strong>
            <span>想定純利益</span>
            <strong>{formatJpy(missedSelected.estimatedProfitJpy)}</strong>
            <span>価格差</span>
            <strong>{missedSelected.spreadPercent}%</strong>
            <span>AI信頼度</span>
            <strong>{missedSelected.confidencePercent}%</strong>
            <span>流動性</span>
            <strong>{missedSelected.liquidityScore}</strong>
            <span>失敗時刻</span>
            <strong>{formatTime(missedSelected.missedAt ?? missedSelected.createdAt)}</strong>
          </div>
          <p>{missedSelected.missedDetailJa ?? missedSelected.missedReasonJa ?? missedSelected.aiSummaryJa}</p>
          <div className="flow-steps">
            <span className="active">1. AI検出</span>
            <span className="active">2. 条件再照合</span>
            <span>3. 利益反映なし</span>
          </div>
          <button className="ghost-button" type="button" onClick={() => setMissedSelected(null)}>
            閉じる
          </button>
        </div>
      ) : null}
      </div>
      ) : null}
      {aiStep === 'orders' ? (
      <div className="panel ai-orders-panel">
      {lastOrder ? (
        <div className="execution-result">
          <div className="panel-head">
            <div>
              <p className="eyebrow">実行結果</p>
              <h3>AI裁定処理が完了しました</h3>
            </div>
            <CheckCircle2 size={22} />
          </div>
          <div className="result-grid">
            <span>注文番号</span>
            <strong>{lastOrder.businessNo}</strong>
            <span>実行レイヤー</span>
            <strong>{executionVenueJa(lastOrder.executionVenue)}</strong>
            <span>市場ソース</span>
            <strong>{marketSourceJa(lastOrder.marketSource)}</strong>
            <span>買付取引所</span>
            <strong>{lastOrder.buyExchange ?? '-'}</strong>
            <span>売却取引所</span>
            <strong>{lastOrder.sellExchange ?? '-'}</strong>
            <span>買付注文ID</span>
            <strong>{lastOrder.buyOrderId ?? '-'}</strong>
            <span>売却注文ID</span>
            <strong>{lastOrder.sellOrderId ?? '-'}</strong>
            <span>約定数量</span>
            <strong>{lastOrder.executedQuantity ?? '-'} {lastOrder.baseAsset ?? ''}</strong>
            <span>約定買付価格</span>
            <strong>{formatJpy(lastOrder.executedBuyJpy ?? '0')}</strong>
            <span>約定売却価格</span>
            <strong>{formatJpy(lastOrder.executedSellJpy ?? '0')}</strong>
            <span>元本</span>
            <strong>{formatJpy(lastOrder.principalJpy)}</strong>
            <span>利益</span>
            <strong>{formatJpy(lastOrder.profitJpy)}</strong>
            <span>粗利益</span>
            <strong>{formatJpy(lastOrder.grossProfitJpy ?? '0')}</strong>
            <span>控除合計</span>
            <strong>{formatJpy(lastOrder.totalCostJpy ?? '0')}</strong>
            <span>対象資産</span>
            <strong>{lastOrder.baseAsset ?? '-'}</strong>
            <span>VIP</span>
            <strong>{lastOrder.vipLevel}</strong>
            <span>状態</span>
            <strong>{orderStatusJa(lastOrder.status)}</strong>
            <span>完了時刻</span>
            <strong>{formatTime(lastOrder.settledAt ?? lastOrder.createdAt)}</strong>
          </div>
        </div>
      ) : null}
      <div className="operations-history-block" id="ai-orders">
        <div className="panel-head compact-head">
          <div>
            <p className="eyebrow">Execution Ledger</p>
            <h3>注文履歴</h3>
          </div>
          <History size={20} />
        </div>
        <HistorySummary
          items={[
            { label: '総注文', value: props.dashboard.orders.length, note: '手動 / 自動' },
            { label: '成功', value: countByStatus(props.dashboard.orders, 'settled'), note: '残高反映済み', tone: 'success' },
            { label: '失敗', value: countByStatus(props.dashboard.orders, 'failed'), note: '利益反映なし', tone: 'warning' },
            { label: '純利益合計', value: formatJpy(orderProfitJpy), note: latestOrderAt ? `最新 ${formatTime(latestOrderAt)}` : '記録なし' },
          ]}
        />
        <MobileRecordPager
          className="mobile-records"
          emptyText="注文履歴はまだありません。"
          items={orderRecords}
          renderItem={(order) => (
            <button className="mobile-record-card" key={order.id} type="button" onClick={() => setSelectedOrder(order)}>
              <div>
                <RecordCode primary={order.businessNo} secondary={order.baseAsset ?? '-'} />
                <StatusBadge
                  label={order.status === 'settled' ? '成功' : order.status === 'failed' ? '失敗' : orderStatusJa(order.status)}
                  tone={orderStatusTone(order.status)}
                />
              </div>
              <div className="mobile-record-main">
                <strong>{formatJpy(order.profitJpy)}</strong>
                <span>{`${order.buyExchange ?? '-'} -> ${order.sellExchange ?? '-'}`}</span>
              </div>
              <small>{order.failureReasonJa ?? marketSourceJa(order.marketSource)} / {formatTime(order.createdAt)}</small>
            </button>
          )}
        />
        <PaginatedTable
          columns={['業務番号', '結果', 'AI実行', '市場', '取引所', '資産', '元本', '粗利益', '控除', '純利益', '理由', '時刻', '詳細']}
          rows={orderRecords.map((order) => [
            <RecordCode key={`${order.id}-no`} primary={order.businessNo} secondary={order.opportunityId} />,
            <StatusBadge
              key={`${order.id}-status`}
              label={order.status === 'settled' ? '成功' : order.status === 'failed' ? '失敗' : orderStatusJa(order.status)}
              tone={orderStatusTone(order.status)}
            />,
            executionVenueJa(order.executionVenue),
            marketSourceJa(order.marketSource),
            `${order.buyExchange ?? '-'} -> ${order.sellExchange ?? '-'}`,
            order.baseAsset ?? '-',
            formatJpy(order.principalJpy),
            formatJpy(order.grossProfitJpy ?? '0'),
            formatJpy(order.totalCostJpy ?? '0'),
            <strong className={Number(order.profitJpy) > 0 ? 'profit-cell' : 'muted-cell'} key={`${order.id}-profit`}>
              {formatJpy(order.profitJpy)}
            </strong>,
            order.failureReasonJa ?? (order.status === 'settled' ? '残高反映済み' : '-'),
            formatTime(order.createdAt),
            <button className="table-action-button" key={`${order.id}-detail`} type="button" onClick={() => setSelectedOrder(order)}>
              詳細
            </button>,
          ])}
        />
        {selectedOrder ? <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
      </div>
      </div>
      ) : null}
    </section>
  );
}

function VipPage(props: {
  dashboard: DashboardData;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<DashboardData>;
}) {
  const levels: VipLevel[] = ['VIP0', 'VIP1', 'VIP2', 'VIP3'];
  const currentIndex = levels.indexOf(props.dashboard.customer.vipLevel);
  const nextLevel = currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  const nextRule = nextLevel ? props.dashboard.vipRules.find((rule) => rule.level === nextLevel) : null;
  const jpy = Number(balanceOf(props.dashboard.balances, 'JPY').available);

  async function upgrade() {
    const result = await props.run(
      () => props.call<DashboardData>('/customer/vip/upgrade', { method: 'POST' }, props.token),
      nextRule ? `${nextRule.level}へアップグレードしました。費用はJPY残高から控除されました。` : 'VIPレベルを確認しました。',
    );
    if (result) {
      await props.refresh();
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">VIP</p>
          <h2>VIPと利用回数</h2>
        </div>
        <BadgeCheck size={22} />
      </div>
      <button className="primary-button" type="button" onClick={upgrade}>
        {nextRule ? `${nextRule.level}へアップグレード` : '最高VIPレベル'}
      </button>
      {nextRule ? (
        <div className="rule-note">
          <strong>次のアップグレード費用：{formatJpy(nextRule.upgradeBalanceJpy)}</strong>
          <p>現在のJPY残高：{formatJpy(jpy)}。アップグレード成功時、費用はJPY残高から即時控除され、本日の利用上限は新しいVIP回数へ更新されます。</p>
        </div>
      ) : null}
      <div className="vip-grid">
        {props.dashboard.vipRules.map((rule) => (
          <div className={props.dashboard.customer.vipLevel === rule.level ? 'vip-card active' : 'vip-card'} key={rule.level}>
            <strong>{rule.level}</strong>
            <span>最低残高 {formatJpy(rule.minBalanceJpy)}</span>
            <span>アップグレード費用 {formatJpy(rule.upgradeBalanceJpy)}</span>
            <span>機会 {rule.dailyLimit} / 日</span>
            <span>AI算力 {rule.aiPower}</span>
            <span>東京自然日 00:00 - 23:59</span>
            <small>利益は市場価格差、手数料、スリッページ、リスクバッファから算出されます。</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function InvitePage(props: {
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
}) {
  const [info, setInfo] = useState<{
    inviteCode: string;
    inviteUrl: string;
    invited: CustomerProfile[];
    rewards: Array<{ id: string; amountJpy: string; status: string; createdAt: string }>;
    rule: string;
  } | null>(null);

  useEffect(() => {
    void props.run(() => props.call<typeof info>('/customer/invites', {}, props.token)).then((result) => {
      if (result) setInfo(result);
    });
  }, [props]);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Invite</p>
          <h2>招待報酬</h2>
        </div>
        <Gift size={22} />
      </div>
      {info ? (
        <>
          <div className="code-box">{info.inviteCode}</div>
          <p>{`${window.location.origin}${info.inviteUrl}`}</p>
          <p>{info.rule}</p>
          <DataTable
            columns={['報酬ID', '金額', '状態', '時刻']}
            rows={info.rewards.map((reward) => [reward.id, formatJpy(reward.amountJpy), reward.status, formatTime(reward.createdAt)])}
          />
        </>
      ) : (
        <EmptyState text="招待情報を読み込み中です。" />
      )}
    </section>
  );
}

function MyPage({
  dashboard,
  navigate,
  onLogout,
}: {
  dashboard: DashboardData;
  navigate: (page: CustomerPage) => void;
  onLogout: () => void;
}) {
  const latestLedger = dashboard.ledger[0];
  const menuItems: Array<{ label: string; page: CustomerPage; icon: typeof Wallet; note: string }> = [
    { label: '入金', page: 'deposit', icon: Wallet, note: '資産を入金' },
    { label: '出金', page: 'withdraw', icon: Banknote, note: '出金申請' },
    { label: '記録', page: 'ledger', icon: History, note: '履歴確認' },
    { label: '全履歴検索', page: 'activity', icon: Search, note: '入金・出金・AI注文' },
    { label: '招待', page: 'invite', icon: Gift, note: 'コード確認' },
    { label: '本人確認', page: 'kyc', icon: ShieldCheck, note: kycLabelJa(dashboard.customer.kycStatus) },
  ];

  return (
    <section className="my-page">
      <div className="panel my-profile-card">
        <div className="my-avatar-ring">
          <UserRound size={32} />
        </div>
        <div>
          <p className="eyebrow">My Page</p>
          <h2>{customerDisplayNameJa(dashboard.customer)}</h2>
          <p>{dashboard.customer.email}</p>
          <div className="my-status-row">
            <StatusBadge label={dashboard.customer.vipLevel} tone="success" />
            <StatusBadge label={kycLabelJa(dashboard.customer.kycStatus)} tone={dashboard.customer.kycStatus === 'approved' ? 'success' : 'warning'} />
            <StatusBadge label={`信用 ${dashboard.customer.creditScore}`} />
          </div>
        </div>
      </div>

      <div className="my-menu-grid">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button className="my-menu-button" key={item.label} type="button" onClick={() => navigate(item.page)}>
              <span>
                <Icon size={24} />
              </span>
              <strong>{item.label}</strong>
              <small>{item.note}</small>
            </button>
          );
        })}
      </div>

      <div className="panel account-log-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Account Log</p>
            <h2>アカウント記録</h2>
          </div>
          <History size={22} />
        </div>
        <div className="account-log-list">
          <div>
            <span>本人確認</span>
            <strong>{kycLabelJa(dashboard.customer.kycStatus)}</strong>
            <small>{dashboard.customer.kycDocumentFrontName ?? '運転免許証提出待ち'}</small>
          </div>
          <div>
            <span>AI裁定</span>
            <strong>{dashboard.customer.autoAiEnabled ? '稼働中' : '停止中'}</strong>
            <small>{dashboard.autoAiRuntime.nextRunHintJa}</small>
          </div>
          <div>
            <span>最新記録</span>
            <strong>{latestLedger?.titleJa ?? '記録なし'}</strong>
            <small>{latestLedger ? formatTime(latestLedger.createdAt) : '操作後に表示されます'}</small>
          </div>
        </div>
        <button className="ghost-button full" type="button" onClick={onLogout}>
          ログアウト
        </button>
      </div>
    </section>
  );
}

function LedgerPage({ dashboard }: { dashboard: DashboardData }) {
  const ledger = dashboard.ledger;
  return (
    <section className="ledger-workspace">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Ledger</p>
            <h2>資金履歴</h2>
          </div>
          <History size={22} />
        </div>
        <MobileRecordPager
          className="mobile-records"
          emptyText="資金履歴はまだありません。"
          items={ledger}
          renderItem={(entry) => (
            <article className="mobile-record-card static" key={entry.id}>
              <div>
                <RecordCode primary={entry.businessNo} secondary={entry.titleJa} />
                <StatusBadge label={ledgerStatusJa(entry.ledgerStatus)} tone={ledgerStatusTone(entry.ledgerStatus)} />
              </div>
              <div className="mobile-record-main">
                <strong>{entry.asset === 'JPY' ? formatJpy(entry.amount) : `${entry.amount} ${entry.asset}`}</strong>
                <span>残高 {entry.asset === 'JPY' ? formatJpy(entry.balanceAfter) : `${entry.balanceAfter} ${entry.asset}`}</span>
              </div>
              <small>{formatTime(entry.createdAt)}</small>
            </article>
          )}
        />
        <PaginatedTable
          columns={['種別', '資産', '金額', '残高', '状態', '時刻']}
          rows={ledger.map((entry) => [
            entry.titleJa,
            entry.asset,
            entry.asset === 'JPY' ? formatJpy(entry.amount) : entry.amount,
            entry.asset === 'JPY' ? formatJpy(entry.balanceAfter) : entry.balanceAfter,
            ledgerStatusJa(entry.ledgerStatus),
            formatTime(entry.createdAt),
          ])}
        />
      </section>
    </section>
  );
}

function ActivitySearchPage({ dashboard }: { dashboard: DashboardData }) {
  type ActivityKind = 'deposit' | 'withdrawal' | 'order' | 'ledger';
  type ActivityRecord = {
    id: string;
    kind: ActivityKind;
    kindLabel: string;
    businessNo: string;
    title: string;
    subtitle: string;
    asset: string;
    status: string;
    statusLabel: string;
    statusTone: 'default' | 'success' | 'warning' | 'danger';
    amountText: string;
    createdAt: string;
    searchValues: Array<string | number | undefined>;
  };

  const [category, setCategory] = useState<'all' | ActivityKind>('all');
  const [filter, setFilter] = useState<HistoryFilter>(() => emptyHistoryFilter());
  const [selected, setSelected] = useState<{ kind: ActivityKind; id: string } | null>(null);
  const records: ActivityRecord[] = [
    ...dashboard.deposits.map((deposit) => ({
      id: deposit.id,
      kind: 'deposit' as const,
      kindLabel: '入金',
      businessNo: deposit.businessNo,
      title: `${deposit.asset} ${deposit.amount}`,
      subtitle: `${deposit.network ?? '-'} / ${deposit.priceSourceLabelJa ?? priceSourceLabelJa(deposit.priceSource)}`,
      asset: deposit.asset,
      status: deposit.status,
      statusLabel: depositStatusJa(deposit.status),
      statusTone: depositStatusTone(deposit.status),
      amountText: deposit.valuationJpy ? formatJpy(deposit.valuationJpy) : `${deposit.amount} ${deposit.asset}`,
      createdAt: deposit.createdAt,
      searchValues: [
        deposit.businessNo,
        deposit.asset,
        deposit.network,
        deposit.amount,
        deposit.proofText,
        deposit.proofImageName,
        deposit.depositAddressSnapshot,
        deposit.priceSourceLabelJa,
        deposit.marketExchange,
        deposit.marketPair,
        deposit.adminNote,
      ],
    })),
    ...dashboard.withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      kind: 'withdrawal' as const,
      kindLabel: '出金',
      businessNo: withdrawal.businessNo,
      title: withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : `${withdrawal.amount} ${withdrawal.asset}`,
      subtitle: `${withdrawal.destinationType === 'bank' ? '銀行口座' : withdrawal.network ?? 'ウォレット'} / ${withdrawal.priceSourceLabelJa ?? priceSourceLabelJa(withdrawal.priceSource)}`,
      asset: withdrawal.asset,
      status: withdrawal.status,
      statusLabel: withdrawalStatusJa(withdrawal.status),
      statusTone: withdrawalStatusTone(withdrawal.status),
      amountText: withdrawal.valuationJpy ? formatJpy(withdrawal.valuationJpy) : withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : `${withdrawal.amount} ${withdrawal.asset}`,
      createdAt: withdrawal.createdAt,
      searchValues: [
        withdrawal.businessNo,
        withdrawal.asset,
        withdrawal.network,
        withdrawal.amount,
        withdrawal.destinationType,
        withdrawal.destinationText,
        withdrawal.note,
        withdrawal.priceSourceLabelJa,
        withdrawal.marketExchange,
        withdrawal.marketPair,
        withdrawal.adminNote,
      ],
    })),
    ...dashboard.orders.map((order) => ({
      id: order.id,
      kind: 'order' as const,
      kindLabel: 'AI注文',
      businessNo: order.businessNo,
      title: order.status === 'settled' ? `利益 ${formatJpy(order.profitJpy)}` : order.failureReasonJa ?? orderStatusJa(order.status),
      subtitle: `${order.baseAsset ?? '-'} / ${order.buyExchange ?? '-'} -> ${order.sellExchange ?? '-'}`,
      asset: order.baseAsset ?? '',
      status: order.status,
      statusLabel: order.status === 'settled' ? '成功' : order.status === 'failed' ? '失敗' : orderStatusJa(order.status),
      statusTone: orderStatusTone(order.status),
      amountText: formatJpy(order.profitJpy),
      createdAt: order.createdAt,
      searchValues: [
        order.businessNo,
        order.opportunityId,
        order.status,
        order.executionVenue,
        order.marketSource,
        order.buyExchange,
        order.sellExchange,
        order.baseAsset,
        order.principalJpy,
        order.profitJpy,
        order.failureReasonJa,
        order.failureDetailJa,
        order.adminNoteJa,
        order.aiSummaryJa,
      ],
    })),
    ...dashboard.ledger.map((entry) => ({
      id: entry.id,
      kind: 'ledger' as const,
      kindLabel: '資金',
      businessNo: entry.businessNo,
      title: entry.titleJa,
      subtitle: entry.note,
      asset: entry.asset,
      status: entry.ledgerStatus,
      statusLabel: ledgerStatusJa(entry.ledgerStatus),
      statusTone: ledgerStatusTone(entry.ledgerStatus),
      amountText: entry.asset === 'JPY' ? formatJpy(entry.amount) : `${entry.amount} ${entry.asset}`,
      createdAt: entry.createdAt,
      searchValues: [entry.businessNo, entry.asset, entry.ledgerType, entry.direction, entry.amount, entry.balanceAfter, entry.titleJa, entry.note],
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredRecords = records.filter(
    (record) =>
      (category === 'all' || record.kind === category) &&
      matchHistoryFilter(filter, {
        status: record.status,
        asset: record.asset,
        createdAt: record.createdAt,
        values: [record.kindLabel, record.businessNo, record.title, record.subtitle, record.amountText, ...record.searchValues],
      }),
  );
  const selectedDeposit = selected?.kind === 'deposit' ? dashboard.deposits.find((item) => item.id === selected.id) : undefined;
  const selectedWithdrawal = selected?.kind === 'withdrawal' ? dashboard.withdrawals.find((item) => item.id === selected.id) : undefined;
  const selectedOrder = selected?.kind === 'order' ? dashboard.orders.find((item) => item.id === selected.id) : undefined;
  const selectedLedger = selected?.kind === 'ledger' ? dashboard.ledger.find((item) => item.id === selected.id) : undefined;

  return (
    <section className="activity-search-page">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Activity Search</p>
            <h2>全履歴検索</h2>
          </div>
          <Search size={22} />
        </div>
        <HistorySummary
          items={[
            { label: '入金', value: dashboard.deposits.length, note: '入金申請' },
            { label: '出金', value: dashboard.withdrawals.length, note: '出金申請' },
            { label: 'AI注文', value: dashboard.orders.length, note: '成功 / 失敗' },
            { label: '資金', value: dashboard.ledger.length, note: '残高履歴' },
          ]}
        />
        <div className="segmented activity-type-tabs">
          {[
            { key: 'all', label: 'すべて' },
            { key: 'deposit', label: '入金' },
            { key: 'withdrawal', label: '出金' },
            { key: 'order', label: 'AI注文' },
            { key: 'ledger', label: '資金' },
          ].map((item) => (
            <button
              className={category === item.key ? 'active' : ''}
              key={item.key}
              type="button"
              onClick={() => setCategory(item.key as typeof category)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <HistoryFilterBar
          assetOptions={assetFilterOptions(['JPY', 'USDT', 'BTC', 'ETH', 'XRP', 'SOL', 'DOT', 'DOGE', 'LTC', 'MONA', 'BCC', 'XLM'])}
          filter={filter}
          placeholder="業務番号、TxID、取引所、出金先、備考で検索"
          resultCount={filteredRecords.length}
          statusOptions={[
            { value: 'pending', label: '処理中 / 確認中' },
            { value: 'approved', label: '承認済み' },
            { value: 'rejected', label: '差戻し' },
            { value: 'settled', label: 'AI成功' },
            { value: 'failed', label: '失敗' },
            { value: 'posted', label: '残高反映済み' },
            { value: 'reversed', label: '取消済み' },
          ]}
          totalCount={records.length}
          onChange={setFilter}
        />
        <MobileRecordPager
          className="mobile-records activity-records"
          emptyText="条件に一致する履歴はありません。"
          items={filteredRecords}
          renderItem={(record) => (
            <button className="mobile-record-card" key={`${record.kind}-${record.id}`} type="button" onClick={() => setSelected({ kind: record.kind, id: record.id })}>
              <div>
                <RecordCode primary={record.businessNo} secondary={record.kindLabel} />
                <StatusBadge label={record.statusLabel} tone={record.statusTone} />
              </div>
              <div className="mobile-record-main">
                <strong>{record.amountText}</strong>
                <span>{record.title}</span>
              </div>
              <small>{record.subtitle} / {formatTime(record.createdAt)}</small>
            </button>
          )}
        />
        <PaginatedTable
          columns={['区分', '業務番号', '内容', '資産', '金額', '状態', '時刻', '詳細']}
          rows={filteredRecords.map((record) => [
            record.kindLabel,
            <RecordCode key={`${record.kind}-${record.id}-no`} primary={record.businessNo} secondary={record.subtitle} />,
            record.title,
            record.asset || '-',
            record.amountText,
            <StatusBadge key={`${record.kind}-${record.id}-status`} label={record.statusLabel} tone={record.statusTone} />,
            formatTime(record.createdAt),
            <button className="table-action-button" key={`${record.kind}-${record.id}-detail`} type="button" onClick={() => setSelected({ kind: record.kind, id: record.id })}>
              詳細
            </button>,
          ])}
        />
      </section>
      {selectedDeposit ? <DepositDetailPanel deposit={selectedDeposit} onClose={() => setSelected(null)} /> : null}
      {selectedWithdrawal ? <WithdrawalDetailPanel withdrawal={selectedWithdrawal} onClose={() => setSelected(null)} /> : null}
      {selectedOrder ? <OrderDetailPanel order={selectedOrder} onClose={() => setSelected(null)} /> : null}
      {selectedLedger ? (
        <CustomerDetailPanel eyebrow="Ledger Detail" title={`資金履歴 ${selectedLedger.businessNo}`} onClose={() => setSelected(null)}>
          <DetailGrid
            items={[
              { label: '業務番号', value: selectedLedger.businessNo },
              { label: '種別', value: selectedLedger.titleJa },
              { label: '資産', value: selectedLedger.asset },
              { label: '金額', value: selectedLedger.asset === 'JPY' ? formatJpy(selectedLedger.amount) : `${selectedLedger.amount} ${selectedLedger.asset}` },
              { label: '残高', value: selectedLedger.asset === 'JPY' ? formatJpy(selectedLedger.balanceAfter) : `${selectedLedger.balanceAfter} ${selectedLedger.asset}` },
              { label: '状態', value: <StatusBadge label={ledgerStatusJa(selectedLedger.ledgerStatus)} tone={ledgerStatusTone(selectedLedger.ledgerStatus)} /> },
              { label: '時刻', value: formatFullTime(selectedLedger.createdAt) },
              { label: '備考', value: selectedLedger.note || '-', wide: true },
            ]}
          />
        </CustomerDetailPanel>
      ) : null}
    </section>
  );
}

function AdminApp(props: {
  adminState: AdminState | null;
  busy: boolean;
  page: AdminPage;
  setPage: (page: AdminPage) => void;
  token: string;
  onLogin: (result: { token: string }) => void;
  onLogout: () => void;
  realtimeState: AdminRealtimeState;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<AdminState>;
}) {
  if (!props.token || !props.adminState) {
    return <AdminLogin call={props.call} onLogin={props.onLogin} run={props.run} />;
  }

  return (
    <section className="layout admin-layout">
      <aside className="sidebar">
        <div className="profile-card">
          <span className="avatar">管</span>
          <strong>yuki888</strong>
          <small>超级管理员 / 本地测试账号</small>
        </div>
        <nav className="side-nav">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={props.page === item.key ? 'active' : ''} type="button" onClick={() => props.setPage(item.key)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="ghost-button full" type="button" onClick={props.onLogout}>
          退出登录
        </button>
      </aside>
      <div className="content">
        <section className="page-head admin-head">
          <div>
            <p className="eyebrow">管理后台</p>
            <h1>运营与资金管理</h1>
            <p>后台保留真实业务类型、资金流水、权限校验和审计日志。</p>
          </div>
          <div className="admin-visual">
            <span>Risk OK</span>
            <strong>¥ {Number(props.adminState.summary.totalJpy).toLocaleString('ja-JP')}</strong>
            <small>全站 JPY 可用余额</small>
          </div>
          <div className="admin-stream-status">
            <span>后台同步</span>
            <strong>{adminRealtimeLabel(props.realtimeState)}</strong>
            <small>{props.realtimeState === 'live' ? '客户提交后自动更新' : '异常时自动兜底刷新'}</small>
          </div>
          <button className="secondary-button" type="button" onClick={() => void refreshAdminState()}>
            <RefreshCw size={16} />
            刷新
          </button>
        </section>
        {props.page === 'overview' ? <AdminOverview state={props.adminState} /> : null}
        {props.page === 'customers' ? <AdminCustomers state={props.adminState} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'kyc' ? <AdminKyc state={props.adminState} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'deposits' ? <AdminDeposits state={props.adminState} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'withdrawals' ? <AdminWithdrawals state={props.adminState} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'balances' ? <AdminBalanceAdjust state={props.adminState} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'rules' ? <AdminRules state={props.adminState} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'audit' ? <AdminAudit state={props.adminState} /> : null}
      </div>
    </section>
  );

  async function refreshAdminState() {
    const result = await props.run(
      () => props.call<AdminState>('/admin/exchanges/refresh', { method: 'POST' }, props.token),
      '交易所行情 API 已刷新。',
    );
    if (result) {
      await props.refresh();
    }
  }
}

function AdminLogin(props: {
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  onLogin: (result: { token: string }) => void;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
}) {
  const [username, setUsername] = useState('yuki888');
  const [password, setPassword] = useState('123456');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await props.run(
      () =>
        props.call<{ token: string }>('/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        }),
      '管理后台登录成功。',
    );
    if (result) props.onLogin(result);
  }

  return (
    <form className="auth-card admin-login" onSubmit={submit}>
      <p className="eyebrow">Admin</p>
      <h1>管理后台登录</h1>
      <label>
        账号
        <input value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <label>
        密码
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button className="primary-button" type="submit">
        登录
      </button>
      <p className="hint">本地测试账号：yuki888 / 123456。生产环境必须修改或禁用。</p>
    </form>
  );
}

function AdminOverview({ state }: { state: AdminState }) {
  return (
    <>
      <section className="metric-grid">
        <Metric icon={ShieldCheck} label="KYC 待审核" value={state.summary.pendingKyc} note="身份认证审核" />
        <Metric icon={Wallet} label="入金待审核" value={state.summary.pendingDeposits} note="USDT/BTC/ETH" />
        <Metric icon={Banknote} label="出金待审核" value={state.summary.pendingWithdrawals} note="冻结余额待处理" />
        <Metric icon={UserRound} label="客户总数" value={state.summary.totalCustomers} note="本地内存数据" />
      </section>
      <section className="metric-grid">
        <Metric icon={LineChart} label="真实行情 API" value={state.summary.realApiTickerCount} note="公共交易所 ticker" />
        <Metric icon={Activity} label="备用行情" value={state.summary.fallbackTickerCount} note="API 不支持或失败时使用" />
        <Metric icon={Bot} label="下单执行层" value={executionModeZh(state.summary.executionMode)} note="当前为透明测试执行" />
        <Metric icon={Gauge} label="今日利润" value={formatJpy(state.summary.simulationProfitToday)} note="订单账本汇总" />
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>日终对账</h2>
          <CheckCircle2 size={22} />
        </div>
        <p>
          {state.reconciliation.businessDateTokyo} / checked {state.reconciliation.checkedBalances} / mismatch {state.reconciliation.mismatchCount}
        </p>
        <p>今日AI裁定利润：{formatJpy(state.summary.simulationProfitToday)}</p>
        <p>{state.reconciliation.note}</p>
      </section>
    </>
  );
}

function AdminCustomers(props: {
  state: AdminState;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<AdminState>;
}) {
  const [selectedId, setSelectedId] = useState(props.state.customers[0]?.id ?? '');
  const selected = props.state.customers.find((customer) => customer.id === selectedId) ?? props.state.customers[0];
  const [draft, setDraft] = useState({
    name: selected?.name ?? '',
    status: selected?.status ?? 'active',
    vipLevel: selected?.vipLevel ?? 'VIP0',
    creditScore: String(selected?.creditScore ?? 80),
    manualDailyLimit: selected?.manualDailyLimit === undefined ? '' : String(selected.manualDailyLimit),
    successRatePercent: String(selected?.successRatePercent ?? 90),
    withdrawalBankAccount: selected?.withdrawalBankAccount ?? '',
    withdrawalUsdtTrc20Address: selected?.withdrawalUsdtTrc20Address ?? '',
    withdrawalUsdtErc20Address: selected?.withdrawalUsdtErc20Address ?? '',
    withdrawalBtcAddress: selected?.withdrawalBtcAddress ?? '',
    withdrawalEthAddress: selected?.withdrawalEthAddress ?? '',
  });

  useEffect(() => {
    if (!selected) return;
    setDraft({
      name: selected.name,
      status: selected.status,
      vipLevel: selected.vipLevel,
      creditScore: String(selected.creditScore ?? 80),
      manualDailyLimit: selected.manualDailyLimit === undefined ? '' : String(selected.manualDailyLimit),
      successRatePercent: String(selected.successRatePercent ?? 90),
      withdrawalBankAccount: selected.withdrawalBankAccount ?? '',
      withdrawalUsdtTrc20Address: selected.withdrawalUsdtTrc20Address ?? '',
      withdrawalUsdtErc20Address: selected.withdrawalUsdtErc20Address ?? '',
      withdrawalBtcAddress: selected.withdrawalBtcAddress ?? '',
      withdrawalEthAddress: selected.withdrawalEthAddress ?? '',
    });
  }, [selected?.id]);

  async function saveCustomer() {
    if (!selected) return;
    const result = await props.run(
      () =>
        props.call<AdminState>(
          `/admin/customers/${selected.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              name: draft.name,
              status: draft.status,
              vipLevel: draft.vipLevel,
              creditScore: draft.creditScore,
              manualDailyLimit: draft.manualDailyLimit === '' ? null : draft.manualDailyLimit,
              successRatePercent: draft.successRatePercent,
              withdrawalBankAccount: draft.withdrawalBankAccount,
              withdrawalUsdtTrc20Address: draft.withdrawalUsdtTrc20Address,
              withdrawalUsdtErc20Address: draft.withdrawalUsdtErc20Address,
              withdrawalBtcAddress: draft.withdrawalBtcAddress,
              withdrawalEthAddress: draft.withdrawalEthAddress,
            }),
          },
          props.token,
        ),
      '客户参数已保存，并同步到客户前台。',
    );
    if (result) await props.refresh();
  }

  return (
    <section className="two-column admin-customer-workspace">
      <div className="panel">
        <div className="panel-head">
          <h2>客户信息</h2>
          <UserRound size={22} />
        </div>
        <DataTable
          columns={['邮箱', 'KYC', 'VIP', '状态', 'JPY', '信用分', '成功率', '次数', '操作']}
          rows={props.state.customers.map((customer) => [
            customer.email,
            customer.kycStatus,
            customer.vipLevel,
            customer.status,
            formatJpy(balanceOf(props.state.balances[customer.id] ?? [], 'JPY').available),
            customer.creditScore ?? 80,
            `${customer.successRatePercent ?? 90}%`,
            customer.manualDailyLimit ?? adminVipLimit(props.state, customer.vipLevel),
            <button className="link-button" type="button" onClick={() => setSelectedId(customer.id)}>
              编辑
            </button>,
          ])}
        />
      </div>
      <div className="panel customer-editor-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Customer Control</p>
            <h2>客户运营参数</h2>
          </div>
          <SlidersHorizontal size={22} />
        </div>
        {selected ? (
          <>
            <div className="editor-summary">
              <strong>{selected.email}</strong>
              <span>KYC：{selected.kycStatus} / 邀请码：{selected.inviteCode}</span>
            </div>
            <div className="form-grid">
              <label>
                客户姓名
                <input value={draft.name} onChange={(event) => setDraft((item) => ({ ...item, name: event.target.value }))} />
              </label>
              <label>
                账号状态
                <select value={draft.status} onChange={(event) => setDraft((item) => ({ ...item, status: event.target.value as CustomerProfile['status'] }))}>
                  <option value="active">active</option>
                  <option value="frozen">frozen</option>
                  <option value="disabled">disabled</option>
                  <option value="finance_review_required">finance_review_required</option>
                </select>
              </label>
              <label>
                VIP等级
                <select value={draft.vipLevel} onChange={(event) => setDraft((item) => ({ ...item, vipLevel: event.target.value as VipLevel }))}>
                  <option value="VIP0">VIP0</option>
                  <option value="VIP1">VIP1</option>
                  <option value="VIP2">VIP2</option>
                  <option value="VIP3">VIP3</option>
                </select>
              </label>
              <label>
                信用分
                <input min="0" max="100" type="number" value={draft.creditScore} onChange={(event) => setDraft((item) => ({ ...item, creditScore: event.target.value }))} />
              </label>
              <label>
                单客户每日套利次数
                <input
                  min="0"
                  type="number"
                  value={draft.manualDailyLimit}
                  placeholder={`默认 ${adminVipLimit(props.state, draft.vipLevel as VipLevel)} 次`}
                  onChange={(event) => setDraft((item) => ({ ...item, manualDailyLimit: event.target.value }))}
                />
              </label>
              <label>
                成功率 %
                <input
                  min="0"
                  max="100"
                  type="number"
                  value={draft.successRatePercent}
                  onChange={(event) => setDraft((item) => ({ ...item, successRatePercent: event.target.value }))}
                />
              </label>
            </div>
            <div className="rule-note">
              <strong>规则说明</strong>
              <p>VIP 只控制每日机会次数。利润由实时行情价差、双边手续费 0.15%、滑点 0.1%、风险缓冲 0.05% 计算。成功率 90% 时，每 10 次机会约 1 次失败记录。</p>
            </div>
            <div className="rule-note">
              <strong>出金地址闭环</strong>
              <p>客户前台提交新的出金地址后会自动保存到客户资料；后台在这里修改后，客户下次选择对应资产和网络时会自动带入。</p>
            </div>
            <div className="form-grid">
              <label>
                出金銀行口座
                <input value={draft.withdrawalBankAccount} onChange={(event) => setDraft((item) => ({ ...item, withdrawalBankAccount: event.target.value }))} />
              </label>
              <label>
                USDT TRC-20 出金アドレス
                <input
                  value={draft.withdrawalUsdtTrc20Address}
                  onChange={(event) => setDraft((item) => ({ ...item, withdrawalUsdtTrc20Address: event.target.value }))}
                />
              </label>
              <label>
                USDT ERC-20 出金アドレス
                <input
                  value={draft.withdrawalUsdtErc20Address}
                  onChange={(event) => setDraft((item) => ({ ...item, withdrawalUsdtErc20Address: event.target.value }))}
                />
              </label>
              <label>
                BTC 出金アドレス
                <input value={draft.withdrawalBtcAddress} onChange={(event) => setDraft((item) => ({ ...item, withdrawalBtcAddress: event.target.value }))} />
              </label>
              <label>
                ETH 出金アドレス
                <input value={draft.withdrawalEthAddress} onChange={(event) => setDraft((item) => ({ ...item, withdrawalEthAddress: event.target.value }))} />
              </label>
            </div>
            <button className="primary-button" type="button" onClick={() => void saveCustomer()}>
              保存客户参数
            </button>
          </>
        ) : (
          <EmptyState text="请选择客户。" />
        )}
      </div>
    </section>
  );
}

function AdminKyc(props: {
  state: AdminState;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<AdminState>;
}) {
  const submittedCustomers = props.state.customers.filter((customer) => customer.kycStatus !== 'not_submitted');
  const [proofCustomer, setProofCustomer] = useState<CustomerProfile | null>(null);

  async function action(customerId: string, type: 'approve' | 'reject') {
    const result = await props.run(
      () => props.call<AdminState>(`/admin/kyc/${customerId}/${type}`, { method: 'POST' }, props.token),
      type === 'approve' ? 'KYC 已通过，客户自动激活 VIP0。' : 'KYC 已驳回。',
    );
    if (result) await props.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>KYC 审核</h2>
        <ShieldCheck size={22} />
      </div>
      <div className="admin-list">
        {submittedCustomers.length === 0 ? <EmptyState text="客户提交本人确认资料后，会显示在这里。" /> : null}
        {submittedCustomers.map((customer) => (
          <article className="admin-row" key={customer.id}>
            <div>
              <strong>{customer.email}</strong>
              <p>{customer.name} / {customer.kycStatus === 'approved' ? '已通过' : customer.kycStatus === 'pending' ? '待审核' : customer.kycStatus}</p>
              <p>驾驶证正面：{customer.kycDocumentFrontName || '未上传'}</p>
              {customer.kycDocumentFrontDataUrl ? (
                <button className="kyc-proof-thumb" type="button" onClick={() => setProofCustomer(customer)}>
                  <img alt={`${customer.email} 驾驶证正面`} src={customer.kycDocumentFrontDataUrl} />
                  <span>点击查看驾驶证凭证</span>
                </button>
              ) : (
                <small className="warning-text">暂无驾驶证图片凭证</small>
              )}
            </div>
            <div className="row-actions">
              {customer.kycStatus === 'approved' ? (
                <span className="status-pill ok">已通过</span>
              ) : (
                <>
                  <button className="secondary-button" type="button" onClick={() => void action(customer.id, 'approve')}>
                    通过
                  </button>
                  <button className="ghost-button" type="button" onClick={() => void action(customer.id, 'reject')}>
                    驳回
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {proofCustomer?.kycDocumentFrontDataUrl ? (
        <div className="admin-proof-modal" role="dialog" aria-modal="true" aria-label="驾驶证凭证预览">
          <div className="admin-proof-viewer">
            <div className="panel-head">
              <div>
                <p className="eyebrow">KYC Proof</p>
                <h3>{proofCustomer.email}</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => setProofCustomer(null)}>
                关闭
              </button>
            </div>
            <img alt={`${proofCustomer.email} 驾驶证正面凭证`} src={proofCustomer.kycDocumentFrontDataUrl} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AdminDeposits(props: {
  state: AdminState;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<AdminState>;
}) {
  const [selectedDeposit, setSelectedDeposit] = useState<DepositOrder | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressDrafts, setAddressDrafts] = useState<Record<string, { address: string; memo: string; minConfirmations: string; enabled: boolean }>>(() =>
    Object.fromEntries(
      props.state.depositAddresses.map((item) => [
        item.id,
        {
          address: item.address,
          memo: item.memo ?? '',
          minConfirmations: String(item.minConfirmations),
          enabled: item.enabled,
        },
      ]),
    ),
  );

  useEffect(() => {
    if (editingAddressId) return;
    setAddressDrafts(
      Object.fromEntries(
        props.state.depositAddresses.map((item) => [
          item.id,
          {
            address: item.address,
            memo: item.memo ?? '',
            minConfirmations: String(item.minConfirmations),
            enabled: item.enabled,
          },
        ]),
      ),
    );
  }, [props.state.depositAddresses, editingAddressId]);

  async function action(depositId: string, type: 'approve' | 'reject') {
    const result = await props.run(
      () => props.call<AdminState>(`/admin/deposits/${depositId}/${type}`, { method: 'POST' }, props.token),
      type === 'approve' ? '入金已确认，客户余额已增加。' : '入金已驳回。',
    );
    if (result) await props.refresh();
  }

  function setAddressDraft(id: string, key: 'address' | 'memo' | 'minConfirmations' | 'enabled', value: string | boolean) {
    setEditingAddressId(id);
    setAddressDrafts((drafts) => ({
      ...drafts,
      [id]: {
        address: drafts[id]?.address ?? '',
        memo: drafts[id]?.memo ?? '',
        minConfirmations: drafts[id]?.minConfirmations ?? '1',
        enabled: drafts[id]?.enabled ?? true,
        [key]: value,
      },
    }));
  }

  async function saveAddress(address: DepositAddressConfig) {
    const draft = addressDrafts[address.id] ?? {
      address: address.address,
      memo: address.memo ?? '',
      minConfirmations: String(address.minConfirmations),
      enabled: address.enabled,
    };
    const result = await props.run(
      () =>
        props.call<AdminState>(
          `/admin/deposit-addresses/${address.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              address: draft.address,
              memo: draft.memo,
              minConfirmations: draft.minConfirmations,
              enabled: draft.enabled,
            }),
          },
          props.token,
        ),
      '入金地址配置已保存，并会同步到客户前台。',
    );
    if (result) {
      setEditingAddressId(null);
      await props.refresh();
    }
  }

  return (
    <section className="two-column admin-funds-workspace">
      <div className="panel">
        <div className="panel-head">
          <h2>入金管理</h2>
          <Wallet size={22} />
        </div>
        <PaginatedTable
          columns={['单号', '客户', '资产', '数量', '日元估值', '价格来源', '凭证', '状态', '操作']}
          rows={props.state.deposits.map((deposit) => [
            deposit.businessNo,
            customerEmail(props.state, deposit.customerId),
            `${deposit.asset}${deposit.network ? ` / ${deposit.network}` : ''}`,
            deposit.amount,
            deposit.valuationJpy ? formatJpy(deposit.valuationJpy) : '-',
            deposit.priceSourceLabelJa ?? priceSourceLabelJa(deposit.priceSource),
            <button className="link-button" type="button" onClick={() => setSelectedDeposit(deposit)}>
              查看凭证
            </button>,
            deposit.status,
            deposit.status === 'pending' ? (
              <span className="inline-actions" key={deposit.id}>
                <button type="button" onClick={() => void action(deposit.id, 'approve')}>确认</button>
                <button type="button" onClick={() => void action(deposit.id, 'reject')}>驳回</button>
              </span>
            ) : (
              '已处理'
            ),
          ])}
        />
        {selectedDeposit ? (
          <div className="admin-detail-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Deposit Proof</p>
                <h3>{selectedDeposit.businessNo}</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => setSelectedDeposit(null)}>
                关闭
              </button>
            </div>
            <div className="result-grid">
              <span>客户</span>
              <strong>{customerEmail(props.state, selectedDeposit.customerId)}</strong>
              <span>资产</span>
              <strong>{selectedDeposit.asset} / {selectedDeposit.network ?? '-'}</strong>
              <span>入金地址快照</span>
              <strong>{selectedDeposit.depositAddressSnapshot ?? '-'}</strong>
              <span>数量</span>
              <strong>{selectedDeposit.amount}</strong>
              <span>申请时日元估值</span>
              <strong>{selectedDeposit.valuationJpy ? formatJpy(selectedDeposit.valuationJpy) : '-'}</strong>
              <span>单位价格</span>
              <strong>{selectedDeposit.unitPriceJpy ? `1 ${selectedDeposit.asset} = ${formatJpy(selectedDeposit.unitPriceJpy)}` : '-'}</strong>
              <span>价格来源</span>
              <strong>{selectedDeposit.priceSourceLabelJa ?? priceSourceLabelJa(selectedDeposit.priceSource)}</strong>
              <span>来源详情</span>
              <strong>{selectedDeposit.priceSourceDetailJa ?? '-'}</strong>
              <span>价格更新时间</span>
              <strong>{selectedDeposit.priceUpdatedAt ? formatTime(selectedDeposit.priceUpdatedAt) : '-'}</strong>
              <span>TxID / 备注</span>
              <strong>{selectedDeposit.proofText}</strong>
              <span>上传文件</span>
              <strong>{selectedDeposit.proofImageName || '未上传'}</strong>
              <span>状态</span>
              <strong>{selectedDeposit.status}</strong>
            </div>
            <div className="proof-placeholder">
              {selectedDeposit.proofImageDataUrl ? (
                <img alt="入金凭证" src={selectedDeposit.proofImageDataUrl} />
              ) : (
                <>
                  <Upload size={24} />
                  <span>{selectedDeposit.proofImageName || '未上传凭证图片'}</span>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
      <div className="panel deposit-address-admin-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Wallet Address</p>
            <h2>入金地址配置</h2>
          </div>
          <SlidersHorizontal size={22} />
        </div>
        <div className="admin-list">
          {props.state.depositAddresses.map((address) => {
            const draft = addressDrafts[address.id] ?? {
              address: address.address,
              memo: address.memo ?? '',
              minConfirmations: String(address.minConfirmations),
              enabled: address.enabled,
            };
            return (
              <article className="admin-row deposit-address-row" key={address.id}>
                <div>
                  <strong>{address.asset} / {address.network}</strong>
                  <p>{address.labelZh}</p>
                  <small>客户前台只读显示；修改后新入金申请会使用最新地址，旧订单保留地址快照。</small>
                </div>
                <div className="address-editor">
                  <label>
                    地址
                    <input
                      value={draft.address}
                      onChange={(event) => setAddressDraft(address.id, 'address', event.target.value)}
                      onFocus={() => setEditingAddressId(address.id)}
                    />
                  </label>
                  <label>
                    备注
                    <input
                      value={draft.memo}
                      onChange={(event) => setAddressDraft(address.id, 'memo', event.target.value)}
                      onFocus={() => setEditingAddressId(address.id)}
                      placeholder="可选，例如专用Memo"
                    />
                  </label>
                  <label>
                    确认数
                    <input
                      min="1"
                      type="number"
                      value={draft.minConfirmations}
                      onChange={(event) => setAddressDraft(address.id, 'minConfirmations', event.target.value)}
                      onFocus={() => setEditingAddressId(address.id)}
                    />
                  </label>
                  <label className="checkbox-label">
                    <input
                      checked={draft.enabled}
                      type="checkbox"
                      onChange={(event) => setAddressDraft(address.id, 'enabled', event.target.checked)}
                    />
                    启用
                  </label>
                  <button className="secondary-button" type="button" onClick={() => void saveAddress(address)}>
                    保存地址
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AdminWithdrawals(props: {
  state: AdminState;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<AdminState>;
}) {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalOrder | null>(null);

  async function action(withdrawalId: string, type: 'approve' | 'reject') {
    const result = await props.run(
      () => props.call<AdminState>(`/admin/withdrawals/${withdrawalId}/${type}`, { method: 'POST' }, props.token),
      type === 'approve' ? '出金已完成，冻结余额已扣除。' : '出金已驳回，冻结余额已返还。',
    );
    if (result) await props.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>出金管理</h2>
        <Banknote size={22} />
      </div>
      <PaginatedTable
        columns={['单号', '客户', '资产', '数量', '日元估值', '价格来源', '出金先', '状态', '操作']}
        rows={props.state.withdrawals.map((withdrawal) => [
          withdrawal.businessNo,
          customerEmail(props.state, withdrawal.customerId),
          withdrawal.asset,
          withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : withdrawal.amount,
          withdrawal.valuationJpy ? formatJpy(withdrawal.valuationJpy) : '-',
          withdrawal.priceSourceLabelJa ?? priceSourceLabelJa(withdrawal.priceSource),
          <button className="link-button" type="button" onClick={() => setSelectedWithdrawal(withdrawal)}>
            查看详情
          </button>,
          withdrawal.status,
          withdrawal.status === 'pending' ? (
            <span className="inline-actions" key={withdrawal.id}>
              <button type="button" onClick={() => void action(withdrawal.id, 'approve')}>完成</button>
              <button type="button" onClick={() => void action(withdrawal.id, 'reject')}>驳回</button>
            </span>
          ) : (
            '已处理'
          ),
        ])}
      />
      {selectedWithdrawal ? (
        <div className="admin-detail-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Withdrawal Detail</p>
              <h3>{selectedWithdrawal.businessNo}</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => setSelectedWithdrawal(null)}>
              关闭
            </button>
          </div>
          <div className="result-grid">
            <span>客户</span>
            <strong>{customerEmail(props.state, selectedWithdrawal.customerId)}</strong>
            <span>资产</span>
            <strong>{selectedWithdrawal.asset}</strong>
            <span>数量</span>
            <strong>{selectedWithdrawal.asset === 'JPY' ? formatJpy(selectedWithdrawal.amount) : selectedWithdrawal.amount}</strong>
            <span>申请时日元估值</span>
            <strong>{selectedWithdrawal.valuationJpy ? formatJpy(selectedWithdrawal.valuationJpy) : '-'}</strong>
            <span>单位价格</span>
            <strong>{selectedWithdrawal.unitPriceJpy ? `1 ${selectedWithdrawal.asset} = ${formatJpy(selectedWithdrawal.unitPriceJpy)}` : '-'}</strong>
            <span>价格来源</span>
            <strong>{selectedWithdrawal.priceSourceLabelJa ?? priceSourceLabelJa(selectedWithdrawal.priceSource)}</strong>
            <span>来源详情</span>
            <strong>{selectedWithdrawal.priceSourceDetailJa ?? '-'}</strong>
            <span>价格更新时间</span>
            <strong>{selectedWithdrawal.priceUpdatedAt ? formatTime(selectedWithdrawal.priceUpdatedAt) : '-'}</strong>
            <span>类型</span>
            <strong>{selectedWithdrawal.destinationType === 'bank' ? '银行口座' : '钱包地址'}</strong>
            <span>出金先</span>
            <strong>{selectedWithdrawal.destinationText}</strong>
            <span>备注</span>
            <strong>{selectedWithdrawal.note || '-'}</strong>
            <span>状态</span>
            <strong>{selectedWithdrawal.status}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AdminBalanceAdjust(props: {
  state: AdminState;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<AdminState>;
}) {
  const [customerId, setCustomerId] = useState(props.state.customers[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [asset, setAsset] = useState<Asset>('JPY');
  const [amount, setAmount] = useState('10000');
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [reason, setReason] = useState('后台测试调账');
  const filteredCustomers = props.state.customers.filter((customer) => {
    const text = `${customer.id} ${customer.email} ${customer.name} ${customer.inviteCode}`.toLowerCase();
    return text.includes(query.toLowerCase().trim());
  });
  const selectedCustomer = props.state.customers.find((customer) => customer.id === customerId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await props.run(
      () =>
        props.call<AdminState>(
          '/admin/balances/adjust',
          { method: 'POST', body: JSON.stringify({ customerId, asset, amount, direction, reason }) },
          props.token,
        ),
      '余额调整已同步到客户前台。',
    );
    if (result) await props.refresh();
  }

  return (
    <section className="two-column">
      <form className="panel" onSubmit={submit}>
        <div className="panel-head">
          <h2>余额增加 / 减少</h2>
          <Banknote size={22} />
        </div>
        <label>
          搜索客户 UID / 邮箱 / 邀请码 / 姓名
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入 UID、邮箱、邀请码或姓名" />
        </label>
        <div className="customer-search-list">
          {filteredCustomers.slice(0, 8).map((customer) => (
            <button className={customer.id === customerId ? 'active' : ''} key={customer.id} type="button" onClick={() => setCustomerId(customer.id)}>
              <strong>{customer.email}</strong>
              <span>UID {customer.id}</span>
              <small>{customer.name} / {customer.vipLevel} / 邀请码 {customer.inviteCode}</small>
            </button>
          ))}
        </div>
        <label>
          已选客户
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            {props.state.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.email} / {customer.id}</option>
            ))}
          </select>
        </label>
        {selectedCustomer ? (
          <div className="rule-note">
            <strong>{selectedCustomer.email}</strong>
            <p>UID：{selectedCustomer.id} / VIP：{selectedCustomer.vipLevel} / 邀请码：{selectedCustomer.inviteCode}</p>
          </div>
        ) : null}
        <label>
          资产
          <select value={asset} onChange={(event) => setAsset(event.target.value as Asset)}>
            <option value="JPY">JPY</option>
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
        </label>
        <label>
          方向
          <select value={direction} onChange={(event) => setDirection(event.target.value as 'credit' | 'debit')}>
            <option value="credit">增加</option>
            <option value="debit">减少</option>
          </select>
        </label>
        <label>
          金额
          <input value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label>
          原因
          <input value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <button className="primary-button" type="submit">提交调账</button>
      </form>
      <section className="panel">
        <h2>最近资金流水</h2>
        <DataTable
          columns={['类型', '客户', '资产', '金额', '余额']}
          rows={props.state.ledger.slice(0, 8).map((entry) => [
            entry.titleZh,
            customerEmail(props.state, entry.customerId),
            entry.asset,
            entry.asset === 'JPY' ? formatJpy(entry.amount) : entry.amount,
            entry.asset === 'JPY' ? formatJpy(entry.balanceAfter) : entry.balanceAfter,
          ])}
        />
      </section>
    </section>
  );
}

function AdminRules(props: {
  state: AdminState;
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
  refresh: (token?: string) => Promise<AdminState>;
}) {
  const [exchangeDrafts, setExchangeDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(props.state.exchanges.map((exchange) => [exchange.id, String(exchange.intervalSeconds)])),
  );
  const [editingVipLevel, setEditingVipLevel] = useState<VipLevel | null>(null);
  const [editingExchangeId, setEditingExchangeId] = useState<string | null>(null);
  const [vipDrafts, setVipDrafts] = useState<Record<VipLevel, Partial<Record<VipDraftKey, string>>>>(() =>
    Object.fromEntries(
      props.state.vipRules.map((rule) => [
        rule.level,
        {
          dailyLimit: String(rule.dailyLimit),
          minBalanceJpy: String(rule.minBalanceJpy),
          upgradeBalanceJpy: String(rule.upgradeBalanceJpy),
          highProfitProbability: String(rule.highProfitProbability),
          aiPower: rule.aiPower,
        },
      ]),
    ) as Record<VipLevel, Partial<Record<VipDraftKey, string>>>,
  );

  useEffect(() => {
    if (editingExchangeId) return;
    setExchangeDrafts(Object.fromEntries(props.state.exchanges.map((exchange) => [exchange.id, String(exchange.intervalSeconds)])));
  }, [props.state.exchanges, editingExchangeId]);

  useEffect(() => {
    if (editingVipLevel) return;
    setVipDrafts(
      Object.fromEntries(
        props.state.vipRules.map((rule) => [
          rule.level,
          {
            dailyLimit: String(rule.dailyLimit),
            minBalanceJpy: String(rule.minBalanceJpy),
            upgradeBalanceJpy: String(rule.upgradeBalanceJpy),
            highProfitProbability: String(rule.highProfitProbability),
            aiPower: rule.aiPower,
          },
        ]),
      ) as Record<VipLevel, Partial<Record<VipDraftKey, string>>>,
    );
  }, [props.state.vipRules, editingVipLevel]);

  async function updateExchange(exchange: ExchangeConfig, intervalSeconds: number, enabled = exchange.enabled) {
    const result = await props.run(
      () =>
        props.call<AdminState>(
          `/admin/exchanges/${exchange.id}`,
          { method: 'PATCH', body: JSON.stringify({ intervalSeconds, enabled }) },
          props.token,
        ),
      '交易所检测秒数已更新。',
    );
    if (result) {
      setEditingExchangeId(null);
      await props.refresh();
    }
  }

  function setVipDraft(level: VipLevel, key: VipDraftKey, value: string) {
    setEditingVipLevel(level);
    setVipDrafts((drafts) => ({ ...drafts, [level]: { ...(drafts[level] ?? {}), [key]: value } }));
  }

  async function updateVip(rule: VipRule) {
    const draft = vipDrafts[rule.level] ?? {};
    const payload = {
      ...rule,
      dailyLimit: Number(draft.dailyLimit ?? rule.dailyLimit),
      minBalanceJpy: Number(draft.minBalanceJpy ?? rule.minBalanceJpy),
      upgradeBalanceJpy: Number(draft.upgradeBalanceJpy ?? rule.upgradeBalanceJpy),
      highProfitProbability: Number(draft.highProfitProbability ?? rule.highProfitProbability),
      aiPower: draft.aiPower ?? rule.aiPower,
    };
    const result = await props.run(
      () =>
        props.call<AdminState>(
          `/admin/vip/${rule.level}`,
          { method: 'PATCH', body: JSON.stringify(payload) },
          props.token,
        ),
      'VIP 规则已保存，并会同步到客户前台。',
    );
    if (result) {
      setEditingVipLevel(null);
      await props.refresh();
    }
  }

  async function refreshMarkets() {
    const result = await props.run(
      () => props.call<AdminState>('/admin/exchanges/refresh', { method: 'POST' }, props.token),
      '交易所行情 API 已刷新。',
    );
    if (result) await props.refresh();
  }

  return (
    <section className="two-column">
      <div className="panel">
        <div className="panel-head">
          <h2>VIP / 次数规则</h2>
          <BadgeCheck size={22} />
        </div>
        <div className="admin-list">
          {props.state.vipRules.map((rule) => (
            <article className="admin-row" key={rule.level}>
              <div>
                <strong>{rule.level}</strong>
                <p>{formatJpy(rule.minBalanceJpy)} / {rule.dailyLimit} 次 / 日 / AI {rule.aiPower}</p>
                <small>VIP 控制东京自然日内的套利机会次数；利润由行情价差、手续费、滑点和风险缓冲计算。</small>
              </div>
              <div className="vip-limit-editor">
                <label>
                  每日次数
                  <input
                    min="0"
                    type="number"
                    value={vipDrafts[rule.level]?.dailyLimit ?? String(rule.dailyLimit)}
                    onChange={(event) => setVipDraft(rule.level, 'dailyLimit', event.target.value)}
                    onFocus={() => setEditingVipLevel(rule.level)}
                  />
                </label>
                <label>
                  升级费用JPY
                  <input
                    min="0"
                    type="number"
                    value={vipDrafts[rule.level]?.upgradeBalanceJpy ?? String(rule.upgradeBalanceJpy)}
                    onChange={(event) => setVipDraft(rule.level, 'upgradeBalanceJpy', event.target.value)}
                    onFocus={() => setEditingVipLevel(rule.level)}
                  />
                </label>
                <label>
                  最低余额JPY
                  <input
                    min="0"
                    type="number"
                    value={vipDrafts[rule.level]?.minBalanceJpy ?? String(rule.minBalanceJpy)}
                    onChange={(event) => setVipDraft(rule.level, 'minBalanceJpy', event.target.value)}
                    onFocus={() => setEditingVipLevel(rule.level)}
                  />
                </label>
                <label>
                  成功率/高收益概率%
                  <input
                    min="0"
                    max="100"
                    type="number"
                    value={vipDrafts[rule.level]?.highProfitProbability ?? String(rule.highProfitProbability)}
                    onChange={(event) => setVipDraft(rule.level, 'highProfitProbability', event.target.value)}
                    onFocus={() => setEditingVipLevel(rule.level)}
                  />
                </label>
                <label>
                  AI算力
                  <input
                    value={vipDrafts[rule.level]?.aiPower ?? rule.aiPower}
                    onChange={(event) => setVipDraft(rule.level, 'aiPower', event.target.value)}
                    onFocus={() => setEditingVipLevel(rule.level)}
                    placeholder="例：2x"
                  />
                </label>
                <button className="secondary-button" type="button" onClick={() => void updateVip(rule)}>
                  保存
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Exchange Pool</p>
            <h2>默认内置交易所列表</h2>
          </div>
          <div className="row-actions">
            <button className="secondary-button" type="button" onClick={() => void refreshMarkets()}>
              <RefreshCw size={16} />
              刷新行情API
            </button>
            <SlidersHorizontal size={22} />
          </div>
        </div>
        <div className="rule-note">
          <strong>采样秒数规则</strong>
          <p>低于 0.01 秒代表几乎同步，系统不会触发裁定机会；0.01 秒及以上会稳定出现可判断的 AI 裁定机会。每个交易所可单独设置。</p>
        </div>
        <div className="admin-list exchange-admin-list">
          {props.state.exchanges.map((exchange) => (
            <article className="admin-row exchange-admin-row" key={exchange.id}>
              <div>
                <strong>{exchange.name}</strong>
                <p>{exchange.category} / {exchange.apiProvider} / {exchange.sourcePriority} / {exchange.lastStatus}</p>
                <small>{exchange.apiUrl || '备用行情源，等待正式公开 API 接入'}</small>
                <small>{exchange.lastCheckedAt ? `最近检查：${formatTime(exchange.lastCheckedAt)}` : '最近检查：未执行'}</small>
                <small>
                  真实API成功：{exchange.realApiPairCount ?? 0} / 备用：{exchange.fallbackPairCount ?? 0} / 未公开支持：
                  {exchange.unsupportedPairCount ?? 0}
                </small>
                {exchange.lastSuccessAt ? <small className="success-text">最近真实API成功：{formatTime(exchange.lastSuccessAt)}</small> : null}
                {exchange.lastError ? <small className="warning-text">{exchange.lastError}</small> : null}
              </div>
              <div className="exchange-controls">
                <label>
                  检测秒数
                  <input
                    min={exchange.minIntervalSeconds}
                    max={exchange.maxIntervalSeconds}
                    step="0.001"
                    type="number"
                    value={exchangeDrafts[exchange.id] ?? String(exchange.intervalSeconds)}
                    onChange={(event) => {
                      setEditingExchangeId(exchange.id);
                      setExchangeDrafts((drafts) => ({ ...drafts, [exchange.id]: event.target.value }));
                    }}
                    onFocus={() => setEditingExchangeId(exchange.id)}
                  />
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void updateExchange(exchange, Number(exchangeDrafts[exchange.id] ?? exchange.intervalSeconds))}
                >
                  保存
                </button>
                <button
                  className={exchange.enabled ? 'ghost-button' : 'secondary-button'}
                  type="button"
                  onClick={() => void updateExchange(exchange, Number(exchangeDrafts[exchange.id] ?? exchange.intervalSeconds), !exchange.enabled)}
                >
                  {exchange.enabled ? '停用' : '启用'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminAudit({ state }: { state: AdminState }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>审计日志</h2>
        <History size={22} />
      </div>
      <PaginatedTable
        columns={['动作', '操作人', '对象', '详情', '时间']}
        rows={state.auditLogs.map((log) => [log.action, log.operator, `${log.targetType}:${log.targetId}`, log.detail, formatTime(log.createdAt)])}
      />
    </section>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof LayoutDashboard; label: string; value: string | number; note: string }) {
  return (
    <div className="metric-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function CustomerStepFlow<T extends string>({
  steps,
  value,
  onChange,
}: {
  steps: Array<{ key: T; label: string; note: string; disabled?: boolean }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={`customer-step-flow steps-${steps.length}`}>
      {steps.map((step, index) => (
        <button
          className={value === step.key ? 'active' : ''}
          disabled={step.disabled}
          key={step.key}
          type="button"
          onClick={() => onChange(step.key)}
        >
          <span>STEP {index + 1}</span>
          <strong>{step.label}</strong>
          <small>{step.note}</small>
        </button>
      ))}
    </div>
  );
}

function HistoryFilterBar({
  filter,
  onChange,
  statusOptions,
  assetOptions,
  placeholder,
  resultCount,
  totalCount,
}: {
  filter: HistoryFilter;
  onChange: (filter: HistoryFilter) => void;
  statusOptions: Array<{ value: string; label: string }>;
  assetOptions: Array<{ value: string; label: string }>;
  placeholder: string;
  resultCount: number;
  totalCount: number;
}) {
  const update = (key: keyof HistoryFilter, value: string) => onChange({ ...filter, [key]: value });
  return (
    <div className="history-filter-bar">
      <label>
        検索
        <input value={filter.query} onChange={(event) => update('query', event.target.value)} placeholder={placeholder} />
      </label>
      <label>
        状態
        <select value={filter.status} onChange={(event) => update('status', event.target.value)}>
          <option value="all">すべて</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        資産
        <select value={filter.asset} onChange={(event) => update('asset', event.target.value)}>
          <option value="all">すべて</option>
          {assetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        開始日
        <input type="date" value={filter.fromDate} onChange={(event) => update('fromDate', event.target.value)} />
      </label>
      <label>
        終了日
        <input type="date" value={filter.toDate} onChange={(event) => update('toDate', event.target.value)} />
      </label>
      <div className="history-filter-result">
        <span>表示件数</span>
        <strong>{resultCount} / {totalCount}</strong>
        <button className="ghost-button" type="button" onClick={() => onChange(emptyHistoryFilter())}>
          条件クリア
        </button>
      </div>
    </div>
  );
}

function DetailGrid({ items }: { items: Array<{ label: string; value: ReactNode; wide?: boolean }> }) {
  return (
    <div className="detail-grid">
      {items.map((item) => (
        <div className={item.wide ? 'detail-item wide' : 'detail-item'} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function CustomerDetailPanel({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="customer-detail-panel">
      <div className="panel-head compact-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <button className="ghost-button" type="button" onClick={onClose}>
          閉じる
        </button>
      </div>
      {children}
    </div>
  );
}

function DepositDetailPanel({ deposit, onClose }: { deposit: DepositOrder; onClose: () => void }) {
  return (
    <CustomerDetailPanel eyebrow="Deposit Detail" title={`入金申請 ${deposit.businessNo}`} onClose={onClose}>
      <DetailGrid
        items={[
          { label: '業務番号', value: deposit.businessNo },
          { label: '審査状態', value: <StatusBadge label={depositStatusJa(deposit.status)} tone={depositStatusTone(deposit.status)} /> },
          { label: '資産 / ネットワーク', value: `${deposit.asset} / ${deposit.network ?? '-'}` },
          { label: '数量', value: deposit.amount },
          { label: '申請時評価額', value: deposit.valuationJpy ? formatJpy(deposit.valuationJpy) : '-' },
          { label: '単位価格', value: deposit.unitPriceJpy ? `1 ${deposit.asset} = ${formatJpy(deposit.unitPriceJpy)}` : '-' },
          { label: '価格ソース', value: deposit.priceSourceLabelJa ?? priceSourceLabelJa(deposit.priceSource) },
          { label: 'API更新時刻', value: deposit.priceUpdatedAt ? formatFullTime(deposit.priceUpdatedAt) : '-' },
          { label: '参照市場', value: [deposit.marketExchange, deposit.marketPair].filter(Boolean).join(' / ') || '-' },
          { label: '申請時刻', value: formatFullTime(deposit.createdAt) },
          { label: '審査時刻', value: deposit.reviewedAt ? formatFullTime(deposit.reviewedAt) : '-' },
          { label: '管理メモ', value: deposit.adminNote ?? '管理部門の確認待ちです。', wide: true },
          { label: '受取アドレス', value: deposit.depositAddressSnapshot ?? '-', wide: true },
          { label: 'TxID / 受付メモ', value: deposit.proofText || '-', wide: true },
        ]}
      />
      <div className="detail-proof-block">
        <span>送金証明</span>
        {deposit.proofImageDataUrl ? (
          <img alt="送金証明" src={deposit.proofImageDataUrl} />
        ) : (
          <strong>{deposit.proofImageName || '証明写真は保存されていません。'}</strong>
        )}
      </div>
    </CustomerDetailPanel>
  );
}

function WithdrawalDetailPanel({ withdrawal, onClose }: { withdrawal: WithdrawalOrder; onClose: () => void }) {
  return (
    <CustomerDetailPanel eyebrow="Withdrawal Detail" title={`出金申請 ${withdrawal.businessNo}`} onClose={onClose}>
      <DetailGrid
        items={[
          { label: '業務番号', value: withdrawal.businessNo },
          { label: '審査状態', value: <StatusBadge label={withdrawalStatusJa(withdrawal.status)} tone={withdrawalStatusTone(withdrawal.status)} /> },
          { label: '資産 / ネットワーク', value: `${withdrawal.asset} / ${withdrawal.network ?? '-'}` },
          { label: '数量', value: withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : withdrawal.amount },
          { label: '申請時評価額', value: withdrawal.valuationJpy ? formatJpy(withdrawal.valuationJpy) : '-' },
          { label: '単位価格', value: withdrawal.unitPriceJpy ? `1 ${withdrawal.asset} = ${formatJpy(withdrawal.unitPriceJpy)}` : '-' },
          { label: '価格ソース', value: withdrawal.priceSourceLabelJa ?? priceSourceLabelJa(withdrawal.priceSource) },
          { label: 'API更新時刻', value: withdrawal.priceUpdatedAt ? formatFullTime(withdrawal.priceUpdatedAt) : '-' },
          { label: '参照市場', value: [withdrawal.marketExchange, withdrawal.marketPair].filter(Boolean).join(' / ') || '-' },
          { label: '申請時刻', value: formatFullTime(withdrawal.createdAt) },
          { label: '完了 / 差戻し時刻', value: withdrawal.completedAt ? formatFullTime(withdrawal.completedAt) : '-' },
          { label: '出金先種別', value: withdrawal.destinationType === 'bank' ? '銀行口座' : 'ウォレット' },
          { label: '管理メモ', value: withdrawal.adminNote ?? '管理部門の確認待ちです。', wide: true },
          { label: '出金先', value: withdrawal.destinationText || '-', wide: true },
          { label: '備考', value: withdrawal.note || '-', wide: true },
        ]}
      />
    </CustomerDetailPanel>
  );
}

function OrderDetailPanel({ order, onClose }: { order: SimulationOrder; onClose: () => void }) {
  return (
    <CustomerDetailPanel eyebrow="AI Order Detail" title={`AI裁定 ${order.businessNo}`} onClose={onClose}>
      <DetailGrid
        items={[
          { label: '業務番号', value: order.businessNo },
          { label: '結果', value: <StatusBadge label={order.status === 'settled' ? '成功' : order.status === 'failed' ? '失敗' : orderStatusJa(order.status)} tone={orderStatusTone(order.status)} /> },
          { label: 'AI実行', value: executionVenueJa(order.executionVenue) },
          { label: '市場ソース', value: marketSourceJa(order.marketSource) },
          { label: 'API参照時刻', value: formatFullTime(order.settledAt ?? order.createdAt) },
          { label: '取引所', value: `${order.buyExchange ?? '-'} -> ${order.sellExchange ?? '-'}` },
          { label: '対象資産', value: order.baseAsset ?? '-' },
          { label: '約定数量', value: `${order.executedQuantity ?? '-'} ${order.baseAsset ?? ''}` },
          { label: '買付価格', value: formatJpy(order.executedBuyJpy ?? '0') },
          { label: '売却価格', value: formatJpy(order.executedSellJpy ?? '0') },
          { label: '元本', value: formatJpy(order.principalJpy) },
          { label: '粗利益', value: formatJpy(order.grossProfitJpy ?? '0') },
          { label: '控除合計', value: formatJpy(order.totalCostJpy ?? '0') },
          { label: '純利益', value: formatJpy(order.profitJpy) },
          { label: 'VIP', value: order.vipLevel },
          { label: '残高Version', value: `${order.balanceVersionBefore} -> ${order.balanceVersionAfter}` },
          { label: '買付注文ID', value: order.buyOrderId ?? '-', wide: true },
          { label: '売却注文ID', value: order.sellOrderId ?? '-', wide: true },
          { label: '管理メモ', value: order.adminNoteJa ?? (order.status === 'settled' ? '残高反映済みです。' : '利益反映なしとして記録されています。'), wide: true },
          { label: 'AI分析摘要', value: order.aiSummaryJa, wide: true },
        ]}
      />
    </CustomerDetailPanel>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<ReactNode>> }) {
  if (rows.length === 0) {
    return <EmptyState text="データがありません。" />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistorySummary({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; note: string; tone?: 'default' | 'success' | 'warning' | 'danger' }>;
}) {
  return (
    <div className="history-summary-grid">
      {items.map((item) => (
        <div className={item.tone ? `history-summary-card ${item.tone}` : 'history-summary-card'} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.note}</small>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  return <span className={`status-badge ${tone}`}>{label}</span>;
}

function RecordCode({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <span className="record-code">
      <strong>{primary}</strong>
      {secondary ? <small>{secondary}</small> : null}
    </span>
  );
}

function AssetBadge({ asset, network }: { asset: Asset; network?: string }) {
  return (
    <span className="asset-badge">
      <strong>{asset}</strong>
      {network ? <small>{network}</small> : null}
    </span>
  );
}

function PaginatedTable({ columns, rows, pageSize = 10 }: { columns: string[]; rows: Array<Array<ReactNode>>; pageSize?: number }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visibleRows = rows.slice(start, start + pageSize);
  const pager =
    rows.length > pageSize ? (
      <PaginationControls
        page={safePage}
        totalPages={totalPages}
        totalItems={rows.length}
        start={start}
        pageSize={pageSize}
        onPrev={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(totalPages, value + 1))}
      />
    ) : null;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="paged-table">
      {pager}
      <DataTable columns={columns} rows={visibleRows} />
      {pager}
    </div>
  );
}

function MobileRecordPager<T,>({
  items,
  renderItem,
  pageSize = 10,
  emptyText,
  className = '',
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  pageSize?: number;
  emptyText: string;
  className?: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visibleItems = items.slice(start, start + pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (items.length === 0) {
    return (
      <div className={className}>
        <EmptyState text={emptyText} />
      </div>
    );
  }

  const pager =
    items.length > pageSize ? (
      <PaginationControls
        page={safePage}
        totalPages={totalPages}
        totalItems={items.length}
        start={start}
        pageSize={pageSize}
        onPrev={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(totalPages, value + 1))}
      />
    ) : null;

  return (
    <div className={className}>
      {pager}
      <div className="mobile-record-list">{visibleItems.map(renderItem)}</div>
      {pager}
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  start,
  pageSize,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  start: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="pagination-row">
      <span>
        {totalItems}件中 {start + 1}-{Math.min(start + pageSize, totalItems)}件
      </span>
      <div className="inline-actions">
        <button disabled={page <= 1} type="button" onClick={onPrev}>
          前へ
        </button>
        <strong>
          {page} / {totalPages}
        </strong>
        <button disabled={page >= totalPages} type="button" onClick={onNext}>
          次へ
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Lock size={18} />
      <span>{text}</span>
    </div>
  );
}

function emptyHistoryFilter(): HistoryFilter {
  return {
    query: '',
    status: 'all',
    asset: 'all',
    fromDate: '',
    toDate: '',
  };
}

function assetFilterOptions(assets: string[]) {
  return assets.map((asset) => ({ value: asset, label: asset }));
}

function filterDeposits(items: DepositOrder[], filter: HistoryFilter) {
  return items.filter((deposit) =>
    matchHistoryFilter(filter, {
      status: deposit.status,
      asset: deposit.asset,
      createdAt: deposit.createdAt,
      values: [
        deposit.businessNo,
        deposit.asset,
        deposit.network,
        deposit.amount,
        deposit.proofText,
        deposit.proofImageName,
        deposit.depositAddressSnapshot,
        deposit.priceSourceLabelJa,
        deposit.priceSourceDetailJa,
        deposit.marketExchange,
        deposit.marketPair,
        deposit.adminNote,
      ],
    }),
  );
}

function filterWithdrawals(items: WithdrawalOrder[], filter: HistoryFilter) {
  return items.filter((withdrawal) =>
    matchHistoryFilter(filter, {
      status: withdrawal.status,
      asset: withdrawal.asset,
      createdAt: withdrawal.createdAt,
      values: [
        withdrawal.businessNo,
        withdrawal.asset,
        withdrawal.network,
        withdrawal.amount,
        withdrawal.destinationType,
        withdrawal.destinationText,
        withdrawal.note,
        withdrawal.priceSourceLabelJa,
        withdrawal.priceSourceDetailJa,
        withdrawal.marketExchange,
        withdrawal.marketPair,
        withdrawal.adminNote,
      ],
    }),
  );
}

function filterOrders(items: SimulationOrder[], filter: HistoryFilter) {
  return items.filter((order) =>
    matchHistoryFilter(filter, {
      status: order.status,
      asset: order.baseAsset ?? '',
      createdAt: order.createdAt,
      values: [
        order.businessNo,
        order.opportunityId,
        order.status,
        order.executionVenue,
        order.marketSource,
        order.buyExchange,
        order.sellExchange,
        order.baseAsset,
        order.principalJpy,
        order.profitJpy,
        order.failureReasonJa,
        order.failureDetailJa,
        order.adminNoteJa,
        order.aiSummaryJa,
      ],
    }),
  );
}

function matchHistoryFilter(
  filter: HistoryFilter,
  record: { status: string; asset: string; createdAt: string; values: Array<string | number | undefined> },
) {
  if (filter.status !== 'all' && record.status !== filter.status) {
    return false;
  }
  if (filter.asset !== 'all' && record.asset !== filter.asset) {
    return false;
  }
  const dateKey = tokyoDateKey(record.createdAt);
  if (filter.fromDate && dateKey < filter.fromDate) {
    return false;
  }
  if (filter.toDate && dateKey > filter.toDate) {
    return false;
  }
  const query = normalizeSearch(filter.query);
  if (!query) {
    return true;
  }
  return normalizeSearch(record.values.filter(Boolean).join(' ')).includes(query);
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function customerBackTarget(page: CustomerPage, lastPage: CustomerPage): CustomerPage {
  if (['deposit', 'withdraw', 'convert'].includes(page)) {
    return lastPage === 'deposit' || lastPage === 'withdraw' || lastPage === 'convert' ? 'funds' : lastPage || 'funds';
  }
  if (page === 'ledger' || page === 'activity') {
    return 'my';
  }
  if (page === 'kyc' || page === 'invite') {
    return 'my';
  }
  return lastPage || 'dashboard';
}

function customerPageTitle(page: CustomerPage) {
  const labels: Record<CustomerPage, string> = {
    dashboard: 'ホーム',
    ai: 'AI裁定',
    funds: '入出金',
    deposit: '入金',
    withdraw: '出金',
    convert: '資産交換',
    ledger: '履歴',
    activity: '全履歴検索',
    my: 'マイページ',
    kyc: '本人確認',
    vip: 'VIP',
    invite: '招待',
  };
  return labels[page];
}

function isCustomerNavActive(navKey: CustomerPage, page: CustomerPage) {
  if (navKey === 'funds') {
    return ['funds', 'deposit', 'withdraw', 'convert'].includes(page);
  }
  if (navKey === 'vip') {
    return page === 'vip';
  }
  if (navKey === 'my') {
    return ['my', 'kyc', 'invite', 'ledger', 'activity'].includes(page);
  }
  return navKey === page;
}

async function copyToClipboard(value: string) {
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function balanceOf(balances: AssetBalance[], asset: Asset) {
  return balances.find((balance) => balance.asset === asset) ?? { asset, available: '0', frozen: '0', balanceVersion: 0 };
}

function estimatedAssetJpy(asset: Asset, amount: string | number, tickers: MarketTicker[]) {
  if (asset === 'JPY') {
    return Number(amount) || 0;
  }
  const pair = `${asset}/JPY`;
  const pairTickers = tickers.filter((item) => item.pair === pair);
  const realApiTickers = pairTickers.filter((item) => item.source === 'real_api');
  const pricePool = realApiTickers.length ? realApiTickers : pairTickers;
  if (pricePool.length) {
    const prices = pricePool
      .map((item) => Number(item.lastJpy))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)] ?? 0;
    return Math.floor((Number(amount) || 0) * median);
  }
  return 0;
}

function compactImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('画像を圧縮できませんでした。'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const maxEdge = 520;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('画像処理に失敗しました。'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.52));
      };
      image.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  });
}

function networkForAsset(asset: Exclude<Asset, 'JPY'>, selected: 'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum') {
  if (asset === 'BTC') {
    return 'Bitcoin';
  }
  if (asset === 'ETH') {
    return 'Ethereum';
  }
  return selected === 'ERC-20' ? 'ERC-20' : 'TRC-20';
}

function defaultNetworkForAsset(asset: Exclude<Asset, 'JPY'>) {
  if (asset === 'BTC') {
    return 'Bitcoin' as const;
  }
  if (asset === 'ETH') {
    return 'Ethereum' as const;
  }
  return 'TRC-20' as const;
}

function defaultNetworkForWithdraw(asset: Asset) {
  if (asset === 'JPY') {
    return 'Bank' as const;
  }
  return defaultNetworkForAsset(asset);
}

function tickerStatusLabel(ticker: MarketTicker) {
  const spread = Number(ticker.spreadPercent);
  if (ticker.source === 'real_api' && spread < 0.25) {
    return '高流動性';
  }
  if (ticker.source === 'real_api') {
    return '市場監視中';
  }
  return '裁定候補';
}

function vipRule(dashboard: DashboardData) {
  return dashboard.vipRules.find((rule) => rule.level === dashboard.customer.vipLevel) ?? dashboard.vipRules[0];
}

function adminVipLimit(state: AdminState, level: VipLevel) {
  return state.vipRules.find((rule) => rule.level === level)?.dailyLimit ?? 0;
}

function aiPowerScore(dashboard: DashboardData) {
  const rule = vipRule(dashboard);
  return rule.aiPower;
}

function opportunityEmptyStateText(dashboard: DashboardData) {
  if (dashboard.customer.kycStatus !== 'approved') {
    return '本人確認が完了すると、AI裁定機会を確認できます。';
  }
  if (dashboard.todayLimit <= 0) {
    return '本日の利用上限が0回に設定されています。VIP設定を確認してください。';
  }
  if (dashboard.todayUsed >= dashboard.todayLimit) {
    return '本日の利用回数は完了しました。東京時間の翌日から再度利用できます。';
  }
  const jpyBalance = Number(balanceOf(dashboard.balances, 'JPY').available);
  if (!Number.isFinite(jpyBalance) || jpyBalance < 10000) {
    return `JPY利用可能残高が不足しています。現在 ${formatJpy(jpyBalance)}、AI裁定には最低 ${formatJpy(10000)} が必要です。`;
  }
  if (dashboard.marketScanner.slowestIntervalSeconds < dashboard.marketScanner.opportunityThresholdSeconds) {
    return `取引所APIの検出秒数が ${dashboard.marketScanner.opportunityThresholdSeconds}秒未満のため、裁定機会は監視のみです。`;
  }
  if (dashboard.autoAiRuntime.stage === 'settled') {
    return '直近のAI裁定は処理済みです。次の市場シグナルを監視しています。';
  }
  return '市場シグナルを監視しています。条件が成立すると裁定機会が表示されます。';
}

function rotatingSignalTicker(tickers: MarketTicker[]) {
  if (!tickers.length) {
    return undefined;
  }
  const bucket = Math.floor(Date.now() / 5000);
  const realApi = tickers.filter((ticker) => ticker.source === 'real_api');
  const pool = realApi.length ? realApi : tickers;
  return pool[bucket % pool.length];
}

function formatJpy(value: string | number) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatFullTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function tokyoDateKey(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function adminRealtimeLabel(state: AdminRealtimeState) {
  const labels: Record<AdminRealtimeState, string> = {
    offline: '未连接',
    connecting: '连接中',
    live: '实时推送中',
    fallback: '轮询兜底中',
  };
  return labels[state];
}

function customerDisplayNameJa(customer: CustomerProfile) {
  const rawName = (customer.name || customer.email.split('@')[0] || 'お客様').trim();
  if (customer.kycStatus !== 'approved') {
    return rawName;
  }
  const normalized = rawName.replace(/様$/u, '').trim();
  const parts = normalized.split(/[\s　]+/u).filter(Boolean);
  const surname = parts[0] ?? normalized;
  if (/^[A-Za-z0-9._-]+$/u.test(surname)) {
    return `${surname.split(/[._-]/u)[0] || surname}様`;
  }
  return `${surname.length > 3 ? surname.slice(0, 2) : surname}様`;
}

function customerInitials(customer: CustomerProfile) {
  const displayName = customerDisplayNameJa(customer).replace(/様$/u, '');
  return displayName.slice(0, 2).toUpperCase();
}

function kycLabelJa(status: CustomerProfile['kycStatus']) {
  const labels: Record<CustomerProfile['kycStatus'], string> = {
    not_submitted: '未提出',
    pending: '審査中',
    approved: '承認済み',
    rejected: '否認',
    need_more_info: '追加資料',
  };
  return labels[status];
}

function rateSourceLabel(source: ConversionQuote['rateSource']) {
  const labels: Record<ConversionQuote['rateSource'], string> = {
    primary: '主レート源',
    backup: '予備レート源',
    manual: '手動レート補完',
  };
  return labels[source];
}

function priceSourceLabelJa(source?: 'real_api' | 'fallback' | 'manual' | 'mixed') {
  const labels: Record<'real_api' | 'fallback' | 'manual' | 'mixed', string> = {
    real_api: '公開API価格',
    fallback: 'バックアップ価格',
    manual: '手動補完価格',
    mixed: '混合価格',
  };
  return source ? labels[source] : '-';
}

function depositStatusJa(status: DepositOrder['status']) {
  const labels: Record<DepositOrder['status'], string> = {
    pending: '確認中',
    approved: '反映済み',
    rejected: '差戻し',
  };
  return labels[status];
}

function depositStatusTone(status: DepositOrder['status']) {
  const tones: Record<DepositOrder['status'], 'success' | 'warning' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return tones[status];
}

function withdrawalStatusJa(status: WithdrawalOrder['status']) {
  const labels: Record<WithdrawalOrder['status'], string> = {
    pending: '審査中',
    approved: '出金完了',
    rejected: '差戻し',
  };
  return labels[status];
}

function withdrawalStatusTone(status: WithdrawalOrder['status']) {
  const tones: Record<WithdrawalOrder['status'], 'success' | 'warning' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return tones[status];
}

function ledgerStatusJa(status: LedgerEntry['ledgerStatus']) {
  const labels: Record<LedgerEntry['ledgerStatus'], string> = {
    pending: '処理中',
    posted: '反映済み',
    failed: '失敗',
    reversed: '取消済み',
  };
  return labels[status];
}

function ledgerStatusTone(status: LedgerEntry['ledgerStatus']) {
  const tones: Record<LedgerEntry['ledgerStatus'], 'default' | 'success' | 'warning' | 'danger'> = {
    pending: 'warning',
    posted: 'success',
    failed: 'danger',
    reversed: 'default',
  };
  return tones[status];
}

function orderStatusJa(status: SimulationOrder['status']) {
  const labels: Record<SimulationOrder['status'], string> = {
    created: '作成済み',
    analyzing: '分析中',
    executing: '処理中',
    settled: '反映済み',
    failed: '失敗',
    cancelled: '取消',
  };
  return labels[status];
}

function orderStatusTone(status: SimulationOrder['status']) {
  const tones: Record<SimulationOrder['status'], 'default' | 'success' | 'warning' | 'danger'> = {
    created: 'default',
    analyzing: 'warning',
    executing: 'warning',
    settled: 'success',
    failed: 'danger',
    cancelled: 'danger',
  };
  return tones[status];
}

function countByStatus<T extends { status: string }>(items: T[], status: T['status']) {
  return items.filter((item) => item.status === status).length;
}

function sumValuationJpy(items: Array<{ valuationJpy?: string }>) {
  return items.reduce((sum, item) => sum + Number(item.valuationJpy || 0), 0);
}

function latestRecordTime(items: Array<{ createdAt: string; completedAt?: string; settledAt?: string }>) {
  const latest = items
    .map((item) => item.settledAt ?? item.completedAt ?? item.createdAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  return latest;
}

function executionModeJa(mode?: DashboardData['tradingRuntime']['executionMode']) {
  const labels: Record<DashboardData['tradingRuntime']['executionMode'], string> = {
    internal_test: 'AI注文処理',
    live_exchange_disabled: 'ライブ発注未設定',
    live_exchange: 'ライブ取引所発注',
  };
  return mode ? labels[mode] : '-';
}

function executionModeZh(mode?: DashboardData['tradingRuntime']['executionMode']) {
  const labels: Record<DashboardData['tradingRuntime']['executionMode'], string> = {
    internal_test: 'AI订单处理',
    live_exchange_disabled: '真实下单未启用',
    live_exchange: '真实交易所下单',
  };
  return mode ? labels[mode] : '-';
}

function executionVenueJa(venue?: SimulationOrder['executionVenue']) {
  const labels: Record<NonNullable<SimulationOrder['executionVenue']>, string> = {
    internal_test: 'AI実行完了',
    live_exchange: '取引所AI実行完了',
  };
  return venue ? labels[venue] : '-';
}

function marketSourceJa(source?: SimulationOrder['marketSource']) {
  const labels: Record<NonNullable<SimulationOrder['marketSource']>, string> = {
    real_api: '公開API',
    fallback: '予備データ',
    manual: '手動',
    mixed: '混合',
  };
  return source ? labels[source] : '-';
}

function customerEmail(state: AdminState, customerId: string) {
  return state.customers.find((customer) => customer.id === customerId)?.email ?? customerId;
}

function depositAddressFor(addresses: DepositAddressConfig[], asset: Exclude<Asset, 'JPY'>, network: DepositAddressConfig['network']) {
  return addresses.find((item) => item.asset === asset && item.network === network && item.enabled);
}

function withdrawalDestinationFor(customer: CustomerProfile, asset: Asset, network: WithdrawalOrder['network']) {
  if (asset === 'JPY') {
    return customer.withdrawalBankAccount ?? '';
  }
  if (asset === 'BTC') {
    return customer.withdrawalBtcAddress ?? '';
  }
  if (asset === 'ETH') {
    return customer.withdrawalEthAddress ?? '';
  }
  if (network === 'ERC-20') {
    return customer.withdrawalUsdtErc20Address ?? '';
  }
  return customer.withdrawalUsdtTrc20Address ?? '';
}

