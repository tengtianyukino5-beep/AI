import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowRightLeft,
  BadgeCheck,
  Banknote,
  Bot,
  CheckCircle2,
  Clock3,
  Coins,
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

type CustomerPage = 'dashboard' | 'kyc' | 'deposit' | 'withdraw' | 'convert' | 'ai' | 'vip' | 'invite' | 'ledger';
type AdminPage = 'overview' | 'customers' | 'kyc' | 'deposits' | 'withdrawals' | 'balances' | 'rules' | 'audit';
type VipDraftKey = 'dailyLimit' | 'minBalanceJpy' | 'upgradeBalanceJpy' | 'highProfitProbability' | 'aiPower';

const customerNav: Array<{ key: CustomerPage; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'ホーム', icon: LayoutDashboard },
  { key: 'kyc', label: '本人確認', icon: ShieldCheck },
  { key: 'deposit', label: '入金', icon: Wallet },
  { key: 'withdraw', label: '出金', icon: Banknote },
  { key: 'convert', label: '変換', icon: ArrowRightLeft },
  { key: 'ai', label: 'AI裁定', icon: Bot },
  { key: 'vip', label: 'VIP', icon: BadgeCheck },
  { key: 'invite', label: '招待', icon: Gift },
  { key: 'ledger', label: '履歴', icon: History },
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
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customerToken) {
      void loadDashboard(customerToken);
    }
  }, [customerToken]);

  useEffect(() => {
    if (!customerToken) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      void loadDashboard(customerToken);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [customerToken]);

  useEffect(() => {
    if (adminToken) {
      void loadAdmin(adminToken);
    }
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      void loadAdmin(adminToken);
    }, 3500);
    return () => window.clearInterval(timer);
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
  if (!props.token || !props.dashboard) {
    return <CustomerAuth call={props.call} onLogin={props.onLogin} run={props.run} />;
  }

  return (
    <section className="layout">
      <aside className="sidebar customer-sidebar">
        <div className="profile-card">
          <span className="avatar">{props.dashboard.customer.name.slice(0, 2).toUpperCase()}</span>
          <strong>{props.dashboard.customer.email}</strong>
          <small>{props.dashboard.customer.vipLevel} / {kycLabelJa(props.dashboard.customer.kycStatus)}</small>
        </div>
        <nav className="side-nav">
          {customerNav.map((item) => {
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
          ログアウト
        </button>
      </aside>
      <div className="content">
        <CustomerHeader dashboard={props.dashboard} />
        {props.page === 'dashboard' ? <CustomerDashboard dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'kyc' ? <KycPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'deposit' ? <DepositPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'withdraw' ? <WithdrawalPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'convert' ? <ConversionPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'ai' ? <AiPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'vip' ? <VipPage dashboard={props.dashboard} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'invite' ? <InvitePage token={props.token} call={props.call} run={props.run} /> : null}
        {props.page === 'ledger' ? <LedgerPage ledger={props.dashboard.ledger} /> : null}
      </div>
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
        <p>AI分析、資産変換、VIPレベル、招待報酬、裁定履歴を一つの画面で確認できます。処理結果と残高はリアルタイムに反映されます。</p>
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
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
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
                type="button"
                onClick={() =>
                  void props.run(
                    () =>
                      props.call('/auth/email-code/send', {
                        method: 'POST',
                        body: JSON.stringify({ email }),
                      }),
                    '認証コードを送信しました。',
                  )
                }
              >
                送信
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
        <h1>こんにちは、{dashboard.customer.name}。</h1>
        <p>AI分析、VIP設定、利用可能残高、東京自然日に基づいて裁定処理を管理します。利益と残高は資金台帳に即時反映されます。</p>
      </div>
      <div className="headline-side">
        <div className="balance-pill">
          <Wallet size={18} />
          <span>{formatJpy(jpy.available)}</span>
        </div>
        <div className="market-card" aria-label="AI signal">
          <div className="market-card-top">
            <span>AI Signal</span>
            <strong>{dashboard.marketScanner.signalState === 'opportunity' ? 'LIVE' : 'SCAN'}</strong>
          </div>
          <div className="spark-bars" aria-hidden="true">
            {[42, 64, 51, 78, 69, 88, 74, 96].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="market-card-bottom">
            <span>{signalTicker?.pair ?? dashboard.marketScanner.dominantPair}</span>
            <span>{signalTicker ? `${signalTicker.exchangeName} ${formatJpy(signalTicker.lastJpy)}` : 'Market standby'}</span>
          </div>
        </div>
      </div>
    </section>
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
              <p className="eyebrow">AI Market Scanner</p>
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
            <h2>AI分析摘要</h2>
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
          { method: 'POST', body: JSON.stringify({ fullName, documentNo, documentFrontName: licenseFile }) },
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
            <p>AI裁定、資産変換、VIPアップグレードをご利用いただけます。追加提出は必要ありません。</p>
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
      <form className="form-grid" onSubmit={submit}>
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
            onChange={(event) => setLicenseFile(event.target.files?.[0]?.name ?? '')}
          />
        </label>
        {licenseFile ? <p className="upload-note">選択済み：{licenseFile}</p> : <p className="upload-note">jpg / png / webp、文字が鮮明な画像を選択してください。</p>}
        <button className="primary-button" type="submit">
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
                network,
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

  const depositGuide = depositGuideFor(asset);

  return (
    <section className="two-column">
      <form className="panel deposit-panel" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Deposit</p>
            <h2>USDT / BTC / ETH 入金</h2>
          </div>
          <Wallet size={22} />
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
            <p className="eyebrow">Transfer Detail</p>
            <h2>入金案内</h2>
          </div>
          <LineChart size={22} />
        </div>
        <div className="deposit-address">
          <span>{asset} Network</span>
          <strong>{depositGuide.network}</strong>
          <span>受取アドレス</span>
          <code>{depositGuide.address}</code>
          <span>最低確認</span>
          <strong>{depositGuide.confirmations}</strong>
        </div>
        <div className="flow-steps deposit-steps">
          <span className="active">1. 送金</span>
          <span className={proofFileName ? 'active' : ''}>2. 写真提出</span>
          <span>3. 残高反映</span>
        </div>
        <p>入金申請後、管理部門の確認が完了すると対象資産の残高へ反映されます。証明写真が不鮮明な場合は再提出が必要です。</p>
      </aside>
      <section className="panel deposit-history-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Deposit Status</p>
            <h2>入金申請履歴</h2>
          </div>
          <History size={22} />
        </div>
        <DataTable
          columns={['受付番号', '資産', 'ネットワーク', '数量', '状態', '証明', '申請時刻']}
          rows={props.dashboard.deposits.map((deposit) => [
            deposit.businessNo,
            deposit.asset,
            deposit.network ?? '-',
            deposit.amount,
            depositStatusJa(deposit.status),
            deposit.proofImageName || deposit.proofText,
            formatTime(deposit.createdAt),
          ])}
        />
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
  const [destinationText, setDestinationText] = useState('');
  const [note, setNote] = useState('');
  const selectedBalance = balanceOf(props.dashboard.balances, asset);

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
              destinationText: asset === 'JPY' ? destinationText : `${network} / ${destinationText}`,
              note,
            }),
          },
          props.token,
        ),
      '出金申請を送信しました。審査完了までお待ちください。',
    );
    if (result) {
      setDestinationText('');
      setNote('');
      await props.refresh();
    }
  }

  return (
    <section className="two-column withdrawal-workspace">
      <form className="panel" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Withdrawal</p>
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
            <p className="eyebrow">Withdrawal Status</p>
            <h2>出金履歴</h2>
          </div>
          <History size={22} />
        </div>
        <DataTable
          columns={['受付番号', '資産', '数量', '出金先', '状態', '申請時刻']}
          rows={props.dashboard.withdrawals.map((withdrawal) => [
            withdrawal.businessNo,
            withdrawal.asset,
            withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : withdrawal.amount,
            withdrawal.destinationText,
            withdrawalStatusJa(withdrawal.status),
            formatTime(withdrawal.createdAt),
          ])}
        />
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
  const [fromAsset, setFromAsset] = useState<Exclude<Asset, 'JPY'>>('ETH');
  const [amount, setAmount] = useState('0.2');
  const [quote, setQuote] = useState<ConversionQuote | null>(null);
  const selectedBalance = balanceOf(props.dashboard.balances, fromAsset);
  const liveUnitPrice = estimatedAssetJpy(fromAsset, '1', props.dashboard.marketTickers);
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
      'レート見積もりを取得しました。',
    );
    if (result) {
      setQuote(result);
    }
  }

  async function execute() {
    if (!quote) return;
    const result = await props.run(
      () => props.call<DashboardData>('/customer/conversions', { method: 'POST', body: JSON.stringify({ quoteId: quote.id }) }, props.token),
      '変換が完了しました。',
    );
    if (result) {
      setQuote(null);
      await props.refresh();
    }
  }

  return (
    <section className="two-column conversion-workspace">
      <form className="panel conversion-panel" onSubmit={createQuote}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Conversion</p>
            <h2>{fromAsset} を JPY へ変換</h2>
          </div>
          <ArrowRightLeft size={22} />
        </div>
        <div className="pair-board">
          <div>
            <span>変換ペア</span>
            <strong>{fromAsset} → JPY</strong>
          </div>
          <div>
            <span>参考レート</span>
            <strong>1 {fromAsset} = {formatJpy(liveUnitPrice)}</strong>
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
              }}
            >
              <span>{balance.asset}</span>
              <strong>{balance.available}</strong>
              <small>{formatJpy(estimatedAssetJpy(balance.asset, balance.available, props.dashboard.marketTickers))}</small>
            </button>
          ))}
        </div>
        <label>
          変換元資産
          <select value={fromAsset} onChange={(event) => { setFromAsset(event.target.value as Exclude<Asset, 'JPY'>); setQuote(null); }}>
            <option value="ETH">ETH</option>
            <option value="BTC">BTC</option>
            <option value="USDT">USDT</option>
          </select>
        </label>
        <label>
          数量
          <input value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <div className="balance-hint">
          <span>利用可能</span>
          <strong>{selectedBalance.available} {fromAsset}</strong>
          <small>概算 {formatJpy(estimatedAssetJpy(fromAsset, selectedBalance.available, props.dashboard.marketTickers))}</small>
        </div>
        <button className="primary-button" type="submit">
          見積もり取得
        </button>
        <div className="flow-steps">
          <span className="active">1. 資産選択</span>
          <span className={quote ? 'active' : ''}>2. レート確認</span>
          <span>3. JPY反映</span>
        </div>
        <p className="conversion-note">
          保有している暗号資産を選択し、数量を入力してJPY見積を取得してください。確定すると選択資産が減少し、JPY残高が増加します。
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
            <p>
              {fromAsset === 'USDT' ? 'USDT は USD -> JPY の順でJPY残高へ反映されます。' : `${fromAsset} は USDT -> USD -> JPY の順に換算され、JPY残高へ反映されます。`}
              レートは見積取得時点の市場データに基づき、有効期限内のみ確定できます。
            </p>
            <button className="primary-button" type="button" onClick={execute}>
              変換を確定
            </button>
          </div>
        ) : (
          <div className="conversion-help">
            <div className="quote-hero muted">
              <span>{fromAsset}/JPY</span>
              <strong>{amount || '0'} {fromAsset} ≒ {formatJpy(estimatedAssetJpy(fromAsset, amount || '0', props.dashboard.marketTickers))}</strong>
              <small>最新市場レートに基づいて更新されます。</small>
            </div>
            <p>選択した資産数量に対してJPY受取見積を作成します。見積もり取得後、有効期限内に確定してください。</p>
          </div>
        )}
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
  const [lastOrder, setLastOrder] = useState<SimulationOrder | null>(null);
  const [selected, setSelected] = useState<SimulationOpportunity | null>(null);
  const [missedSelected, setMissedSelected] = useState<SimulationOpportunity | null>(null);
  const autoDisabled = props.dashboard.customer.kycStatus !== 'approved';
  const dailyLimitReached = props.dashboard.todayUsed >= props.dashboard.todayLimit;

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
      }
      if (result.missedOpportunity) {
        setMissedSelected(result.missedOpportunity);
      }
      setSelected(null);
      await props.refresh();
    }
  }

  return (
    <section className="ai-workspace">
      <div className="panel ai-command-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">AI Market Scanner</p>
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
            <span>行情レイヤー</span>
            <strong>{props.dashboard.tradingRuntime.marketDataMode === 'real_public_api' ? '公共API優先' : 'バックアップ併用'}</strong>
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
      <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Live Opportunities</p>
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
        {props.dashboard.opportunities.length === 0 ? <EmptyState text={props.dashboard.autoAiRuntime.stage === 'settled' ? '直近のAI裁定は処理済みです。次の市場シグナルを監視しています。' : '現在利用可能な裁定機会はありません。'} /> : null}
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
              <p className="eyebrow">AI Analysis Detail</p>
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
      <h3>失敗履歴</h3>
      <div className="cards-list compact-list">
        {props.dashboard.missedOpportunities.length === 0 ? <EmptyState text="失敗した裁定機会はまだありません。" /> : null}
        {props.dashboard.missedOpportunities.map((opportunity) => (
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
      {missedSelected ? (
        <div className="execution-result missed-detail">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Missed Opportunity</p>
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
      {lastOrder ? (
        <div className="execution-result">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Execution Result</p>
              <h3>AI裁定処理が完了しました</h3>
            </div>
            <CheckCircle2 size={22} />
          </div>
          <div className="result-grid">
            <span>注文番号</span>
            <strong>{lastOrder.businessNo}</strong>
            <span>実行レイヤー</span>
            <strong>{executionVenueJa(lastOrder.executionVenue)}</strong>
            <span>行情ソース</span>
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
          <p>{lastOrder.disclosureJa}</p>
        </div>
      ) : null}
      <h3>注文履歴</h3>
        <DataTable
        columns={['業務番号', '結果', 'AI实行', '行情', '取引所', '資産', '元本', '粗利益', '控除', '純利益', '理由', '時刻']}
        rows={props.dashboard.orders.map((order) => [
          order.businessNo,
          order.status === 'settled' ? '成功' : order.status === 'failed' ? '失敗' : orderStatusJa(order.status),
          executionVenueJa(order.executionVenue),
          marketSourceJa(order.marketSource),
          `${order.buyExchange ?? '-'} -> ${order.sellExchange ?? '-'}`,
          order.baseAsset ?? '-',
          formatJpy(order.principalJpy),
          formatJpy(order.grossProfitJpy ?? '0'),
          formatJpy(order.totalCostJpy ?? '0'),
          formatJpy(order.profitJpy),
          order.failureReasonJa ?? (order.status === 'settled' ? '残高反映済み' : '-'),
          formatTime(order.createdAt),
        ])}
      />
      </div>
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

function LedgerPage({ ledger }: { ledger: LedgerEntry[] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ledger</p>
          <h2>資金履歴</h2>
        </div>
        <History size={22} />
      </div>
      <DataTable
        columns={['種別', '資産', '金額', '残高', '状態', '時刻']}
        rows={ledger.map((entry) => [
          entry.titleJa,
          entry.asset,
          entry.asset === 'JPY' ? formatJpy(entry.amount) : entry.amount,
          entry.asset === 'JPY' ? formatJpy(entry.balanceAfter) : entry.balanceAfter,
          entry.ledgerStatus,
          formatTime(entry.createdAt),
        ])}
      />
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
          <button className="secondary-button" type="button" onClick={() => void props.refresh()}>
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
              <p>VIP 只控制每日机会次数。利润由实时行情价差、双边手续费 0.15%、滑点 0.1%、风险缓冲 0.05% 计算。成功率 90% 时，每 10 次机会约 1 次见送り。</p>
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
        {props.state.customers.map((customer) => (
          <article className="admin-row" key={customer.id}>
            <div>
              <strong>{customer.email}</strong>
              <p>{customer.name} / {customer.kycStatus === 'approved' ? '已通过' : customer.kycStatus === 'pending' ? '待审核' : customer.kycStatus}</p>
              <p>驾驶证正面：{customer.kycDocumentFrontName || '未上传'}</p>
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

  async function action(depositId: string, type: 'approve' | 'reject') {
    const result = await props.run(
      () => props.call<AdminState>(`/admin/deposits/${depositId}/${type}`, { method: 'POST' }, props.token),
      type === 'approve' ? '入金已确认，客户余额已增加。' : '入金已驳回。',
    );
    if (result) await props.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>入金管理</h2>
        <Wallet size={22} />
      </div>
      <DataTable
        columns={['单号', '客户', '资产', '数量', '凭证', '状态', '操作']}
        rows={props.state.deposits.map((deposit) => [
          deposit.businessNo,
          customerEmail(props.state, deposit.customerId),
          `${deposit.asset}${deposit.network ? ` / ${deposit.network}` : ''}`,
          deposit.amount,
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
            <strong>{selectedDeposit.asset}</strong>
            <span>数量</span>
            <strong>{selectedDeposit.amount}</strong>
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
      <DataTable
        columns={['单号', '客户', '资产', '数量', '出金先', '状态', '操作']}
        rows={props.state.withdrawals.map((withdrawal) => [
          withdrawal.businessNo,
          customerEmail(props.state, withdrawal.customerId),
          withdrawal.asset,
          withdrawal.asset === 'JPY' ? formatJpy(withdrawal.amount) : withdrawal.amount,
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
    setExchangeDrafts(Object.fromEntries(props.state.exchanges.map((exchange) => [exchange.id, String(exchange.intervalSeconds)])));
  }, [props.state.exchanges]);

  useEffect(() => {
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
  }, [props.state.vipRules]);

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
    if (result) await props.refresh();
  }

  function setVipDraft(level: VipLevel, key: VipDraftKey, value: string) {
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
    if (result) await props.refresh();
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
                  />
                </label>
                <label>
                  升级费用JPY
                  <input
                    min="0"
                    type="number"
                    value={vipDrafts[rule.level]?.upgradeBalanceJpy ?? String(rule.upgradeBalanceJpy)}
                    onChange={(event) => setVipDraft(rule.level, 'upgradeBalanceJpy', event.target.value)}
                  />
                </label>
                <label>
                  最低余额JPY
                  <input
                    min="0"
                    type="number"
                    value={vipDrafts[rule.level]?.minBalanceJpy ?? String(rule.minBalanceJpy)}
                    onChange={(event) => setVipDraft(rule.level, 'minBalanceJpy', event.target.value)}
                  />
                </label>
                <label>
                  高收益概率%
                  <input
                    min="0"
                    max="100"
                    type="number"
                    value={vipDrafts[rule.level]?.highProfitProbability ?? String(rule.highProfitProbability)}
                    onChange={(event) => setVipDraft(rule.level, 'highProfitProbability', event.target.value)}
                  />
                </label>
                <label>
                  AI算力
                  <input
                    value={vipDrafts[rule.level]?.aiPower ?? rule.aiPower}
                    onChange={(event) => setVipDraft(rule.level, 'aiPower', event.target.value)}
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
          <p>0.001 秒代表几乎同步，系统不会触发裁定机会；1 秒及以上代表存在采样窗口，前台会稳定出现可判断的 AI 裁定机会。每个交易所可单独设置。</p>
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
                    onChange={(event) => setExchangeDrafts((drafts) => ({ ...drafts, [exchange.id]: event.target.value }))}
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
      <DataTable
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Lock size={18} />
      <span>{text}</span>
    </div>
  );
}

function balanceOf(balances: AssetBalance[], asset: Asset) {
  return balances.find((balance) => balance.asset === asset) ?? { asset, available: '0', frozen: '0', balanceVersion: 0 };
}

function estimatedAssetJpy(asset: Asset, amount: string | number, tickers: MarketTicker[]) {
  if (asset === 'JPY') {
    return Number(amount) || 0;
  }
  const pair = asset === 'BTC' ? 'BTC/JPY' : asset === 'ETH' ? 'ETH/JPY' : null;
  if (pair) {
    const ticker = tickers.find((item) => item.pair === pair);
    return Math.floor((Number(amount) || 0) * (Number(ticker?.lastJpy) || 0));
  }
  const usdt = tickers.find((item) => item.pair === 'BTC/JPY');
  const fallbackUsdJpy = usdt ? Number(usdt.lastJpy) / 64000 : 157;
  return Math.floor((Number(amount) || 0) * fallbackUsdJpy);
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
    manual: '手動レート兜底',
  };
  return labels[source];
}

function depositStatusJa(status: DepositOrder['status']) {
  const labels: Record<DepositOrder['status'], string> = {
    pending: '確認中',
    approved: '反映済み',
    rejected: '差戻し',
  };
  return labels[status];
}

function withdrawalStatusJa(status: WithdrawalOrder['status']) {
  const labels: Record<WithdrawalOrder['status'], string> = {
    pending: '審査中',
    approved: '出金完了',
    rejected: '差戻し',
  };
  return labels[status];
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

function executionModeJa(mode?: DashboardData['tradingRuntime']['executionMode']) {
  const labels: Record<DashboardData['tradingRuntime']['executionMode'], string> = {
    internal_test: '内部AI実行',
    live_exchange_disabled: 'ライブ発注未設定',
    live_exchange: 'ライブ取引所発注',
  };
  return mode ? labels[mode] : '-';
}

function executionModeZh(mode?: DashboardData['tradingRuntime']['executionMode']) {
  const labels: Record<DashboardData['tradingRuntime']['executionMode'], string> = {
    internal_test: '内部测试执行',
    live_exchange_disabled: '真实下单未启用',
    live_exchange: '真实交易所下单',
  };
  return mode ? labels[mode] : '-';
}

function executionVenueJa(venue?: SimulationOrder['executionVenue']) {
  const labels: Record<NonNullable<SimulationOrder['executionVenue']>, string> = {
    internal_test: 'AI实行完了',
    live_exchange: '取引所AI实行完了',
  };
  return venue ? labels[venue] : '-';
}

function marketSourceJa(source?: SimulationOrder['marketSource']) {
  const labels: Record<NonNullable<SimulationOrder['marketSource']>, string> = {
    real_api: '公共API',
    fallback: '予備データ',
    manual: '手動',
    mixed: '混合',
  };
  return source ? labels[source] : '-';
}

function customerEmail(state: AdminState, customerId: string) {
  return state.customers.find((customer) => customer.id === customerId)?.email ?? customerId;
}

function depositGuideFor(asset: Exclude<Asset, 'JPY'>) {
  const guides: Record<Exclude<Asset, 'JPY'>, { network: string; address: string; confirmations: string }> = {
    ETH: {
      network: 'Ethereum / ERC-20',
      address: '0xA8F4...92C1...7B50',
      confirmations: '12 confirmations',
    },
    BTC: {
      network: 'Bitcoin',
      address: 'bc1q8k...ai7x...p0m9',
      confirmations: '3 confirmations',
    },
    USDT: {
      network: 'TRC-20 / ERC-20',
      address: 'TQx9...USDT...Kp31',
      confirmations: '20 confirmations',
    },
  };
  return guides[asset];
}
