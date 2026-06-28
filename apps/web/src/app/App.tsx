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

type CustomerPage = 'dashboard' | 'kyc' | 'deposit' | 'convert' | 'ai' | 'vip' | 'invite' | 'ledger';
type AdminPage = 'overview' | 'customers' | 'kyc' | 'deposits' | 'balances' | 'rules' | 'audit';

const customerNav: Array<{ key: CustomerPage; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'ホーム', icon: LayoutDashboard },
  { key: 'kyc', label: '本人確認', icon: ShieldCheck },
  { key: 'deposit', label: '入金', icon: Wallet },
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

  async function call<T>(path: string, options: RequestInit = {}, token?: string) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
        {props.page === 'deposit' ? <DepositPage token={props.token} call={props.call} run={props.run} /> : null}
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
  const strongestTicker = dashboard.marketTickers[0];
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
            <span>{dashboard.marketScanner.dominantPair}</span>
            <span>{strongestTicker ? `${strongestTicker.exchangeName} ${formatJpy(strongestTicker.lastJpy)}` : 'Market standby'}</span>
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
        <Metric icon={Wallet} label="JPY利用可能残高" value={formatJpy(jpy.available)} note={`balanceVersion ${jpy.balanceVersion}`} />
        <Metric icon={BadgeCheck} label="VIPレベル" value={dashboard.customer.vipLevel} note={`${dashboard.todayUsed}/${dashboard.todayLimit} 本日利用`} />
        <Metric icon={ShieldCheck} label="本人確認" value={kycLabelJa(dashboard.customer.kycStatus)} note={autoDisabled ? 'AI裁定はロック中' : 'AI裁定を利用できます'} />
        <Metric icon={Gauge} label="AI算力" value={vipRule(dashboard).aiPower} note={`${dashboard.marketScanner.fastestIntervalSeconds} - ${dashboard.marketScanner.slowestIntervalSeconds} 秒検出`} />
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
          <div className="scanner-grid">
            <div>
              <span>取引所プール</span>
              <strong>{dashboard.marketScanner.enabledExchangeCount}</strong>
            </div>
            <div>
              <span>検出ウィンドウ</span>
              <strong>{dashboard.marketScanner.fastestIntervalSeconds}s - {dashboard.marketScanner.slowestIntervalSeconds}s</strong>
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
          東京自然日、現在のVIP設定、利用可能残高、内蔵取引所プールの検出秒数、直近ボラティリティ、流動性スコアをもとに、AI裁定機会を評価しています。
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
          <small>{ticker.intervalSeconds}s / {ticker.source === 'real_api' ? 'API' : '予備'}</small>
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
    </section>
  );
}

function DepositPage(props: {
  token: string;
  call: <T>(path: string, options?: RequestInit, token?: string) => Promise<T>;
  run: <T>(task: () => Promise<T>, success?: string) => Promise<T | null>;
}) {
  const [asset, setAsset] = useState<Exclude<Asset, 'JPY'>>('ETH');
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
    if (!proofText.trim()) {
      await props.run(() => Promise.reject(new Error('送金TxIDまたは受付番号を入力してください。')));
      return;
    }
    await props.run(
      () =>
        props.call(
          '/customer/deposits',
          { method: 'POST', body: JSON.stringify({ asset, amount, proofText, proofImageName: proofFileName }) },
          props.token,
        ),
      '入金申請を送信しました。審査完了までお待ちください。',
    );
  }

  function selectProof(file?: File) {
    if (!file) {
      setProofFileName('');
      setProofPreview('');
      return;
    }
    setProofFileName(file.name);
    setProofPreview(URL.createObjectURL(file));
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
          <select value={asset} onChange={(event) => setAsset(event.target.value as Exclude<Asset, 'JPY'>)}>
            <option value="ETH">ETH</option>
            <option value="BTC">BTC</option>
            <option value="USDT">USDT</option>
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
        <button className="primary-button" type="submit">
          入金申請
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
        <label>
          変換元資産
          <select value={fromAsset} onChange={(event) => setFromAsset(event.target.value as Exclude<Asset, 'JPY'>)}>
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
        <div className="asset-list compact">
          {props.dashboard.balances.filter((item) => item.asset !== 'JPY').map((balance) => (
            <div key={balance.asset}>
              <span>{balance.asset}</span>
              <strong>{balance.available}</strong>
            </div>
          ))}
        </div>
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
              <span>レート源</span>
              <strong>{rateSourceLabel(quote.rateSource)}</strong>
              <span>更新</span>
              <strong>{formatTime(quote.rateUpdatedAt)}</strong>
              <span>有効期限</span>
              <strong>{formatTime(quote.expiresAt)}</strong>
            </div>
            <p>{fromAsset === 'USDT' ? 'USDT は USD -> JPY の順でJPY残高へ反映されます。' : `${fromAsset} は内部換算で USDT -> USD -> JPY の順にJPY残高へ反映されます。`}</p>
            <button className="primary-button" type="button" onClick={execute}>
              変換を確定
            </button>
          </div>
        ) : (
          <div className="conversion-help">
            <div className="quote-hero muted">
              <span>{fromAsset}/JPY</span>
              <strong>{amount || '0'} {fromAsset} ≒ {formatJpy(estimatedAssetJpy(fromAsset, amount || '0', props.dashboard.marketTickers))}</strong>
              <small>市場レートは数秒ごとに更新されます。</small>
            </div>
            <p>主レート源、予備レート源、手動レート兜底の優先順位で見積もりを作成します。見積もり取得後、有効期限内に確定してください。</p>
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

  async function execute(opportunityId: string) {
    const result = await props.run(
      () =>
        props.call<{ order: SimulationOrder; dashboard: DashboardData }>(
          '/customer/simulation/orders',
          { method: 'POST', body: JSON.stringify({ opportunityId }) },
          props.token,
        ),
      'AI裁定利益が残高に反映されました。',
    );
    if (result) {
      setLastOrder(result.order);
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
            <span>最速/最遅</span>
            <strong>{props.dashboard.marketScanner.fastestIntervalSeconds}s / {props.dashboard.marketScanner.slowestIntervalSeconds}s</strong>
          </div>
          <div>
            <span>検出ペア</span>
            <strong>{props.dashboard.marketScanner.dominantPair}</strong>
          </div>
        </div>
        <MarketTickerStrip tickers={props.dashboard.marketTickers.slice(0, 6)} />
      </div>
      <div className="panel">
      <div className="cards-list">
        {props.dashboard.opportunities.length === 0 ? <EmptyState text="現在利用可能な裁定機会はありません。" /> : null}
        {props.dashboard.opportunities.map((opportunity) => (
          <article className="opportunity-card" key={opportunity.id}>
            <div>
              <strong>{opportunity.pair} / {opportunity.spreadPercent}%</strong>
              <p>{`${opportunity.exchanges[0]} -> ${opportunity.exchanges[1]}`}</p>
              <small>{opportunity.aiSummaryJa}</small>
              <div className="opportunity-detail-grid">
                <span>買付参考 {formatJpy(opportunity.buyReferenceJpy)}</span>
                <span>売却参考 {formatJpy(opportunity.sellReferenceJpy)}</span>
                <span>AI信頼度 {opportunity.confidencePercent}%</span>
                <span>流動性 {opportunity.liquidityScore}</span>
                <span>予定処理 {opportunity.executionSeconds} 秒</span>
                <span>東京日 {opportunity.businessDateTokyo}</span>
              </div>
            </div>
            <div className="opportunity-metrics">
              <span>{opportunity.spreadPercent}%</span>
              <strong>{formatJpy(opportunity.estimatedProfitJpy)}</strong>
              <button className="primary-button" disabled={opportunity.status !== 'available'} type="button" onClick={() => setSelected(opportunity)}>
                詳細を確認
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
            <span>想定利益</span>
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
            <button className="primary-button" type="button" onClick={() => void execute(selected.id)}>
              この内容で実行
            </button>
            <button className="ghost-button" type="button" onClick={() => setSelected(null)}>
              閉じる
            </button>
          </div>
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
            <span>元本</span>
            <strong>{formatJpy(lastOrder.principalJpy)}</strong>
            <span>利益</span>
            <strong>{formatJpy(lastOrder.profitJpy)}</strong>
            <span>VIP</span>
            <strong>{lastOrder.vipLevel}</strong>
            <span>状態</span>
            <strong>{lastOrder.status}</strong>
            <span>残高版数</span>
            <strong>{`${lastOrder.balanceVersionBefore} -> ${lastOrder.balanceVersionAfter}`}</strong>
          </div>
        </div>
      ) : null}
      <h3>注文履歴</h3>
      <DataTable
        columns={['業務番号', '状態', '元本', '利益', 'VIP', '時刻']}
        rows={props.dashboard.orders.map((order) => [
          order.businessNo,
          order.status,
          formatJpy(order.principalJpy),
          formatJpy(order.profitJpy),
          order.vipLevel,
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
  async function upgrade() {
    const result = await props.run(
      () => props.call<DashboardData>('/customer/vip/upgrade', { method: 'POST' }, props.token),
      'VIPレベルが更新されました。残高は控除されません。',
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
          <h2>VIPと利益ルール</h2>
        </div>
        <BadgeCheck size={22} />
      </div>
      <button className="primary-button" type="button" onClick={upgrade}>
        自助アップグレード
      </button>
      <div className="vip-grid">
        {props.dashboard.vipRules.map((rule) => (
          <div className={props.dashboard.customer.vipLevel === rule.level ? 'vip-card active' : 'vip-card'} key={rule.level}>
            <strong>{rule.level}</strong>
            <span>必要残高 {formatJpy(rule.minBalanceJpy)}</span>
            <span>机会 {rule.dailyLimit} / 日</span>
            <span>AI算力 {rule.aiPower}</span>
            <span>利益 {formatJpy(rule.profitFloorJpy)} - {formatJpy(rule.profitCapJpy)}</span>
            <small>80%確率で {formatJpy(rule.highProfitThresholdJpy)} 以上</small>
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
          <p>{info.inviteUrl}</p>
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
        {props.page === 'customers' ? <AdminCustomers state={props.adminState} /> : null}
        {props.page === 'kyc' ? <AdminKyc state={props.adminState} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
        {props.page === 'deposits' ? <AdminDeposits state={props.adminState} token={props.token} call={props.call} run={props.run} refresh={props.refresh} /> : null}
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
        <Metric icon={UserRound} label="客户总数" value={state.summary.totalCustomers} note="本地内存数据" />
        <Metric icon={Activity} label="今日AI裁定利润" value={formatJpy(state.summary.simulationProfitToday)} note="东京自然日" />
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>日终对账</h2>
          <CheckCircle2 size={22} />
        </div>
        <p>
          {state.reconciliation.businessDateTokyo} / checked {state.reconciliation.checkedBalances} / mismatch {state.reconciliation.mismatchCount}
        </p>
        <p>{state.reconciliation.note}</p>
      </section>
    </>
  );
}

function AdminCustomers({ state }: { state: AdminState }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>客户信息</h2>
        <UserRound size={22} />
      </div>
      <DataTable
        columns={['邮箱', 'KYC', 'VIP', '状态', 'JPY', '邀请码']}
        rows={state.customers.map((customer) => [
          customer.email,
          customer.kycStatus,
          customer.vipLevel,
          customer.status,
          formatJpy(balanceOf(state.balances[customer.id] ?? [], 'JPY').available),
          customer.inviteCode,
        ])}
      />
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
              <p>{customer.name} / {customer.kycStatus}</p>
              <p>驾驶证正面：{customer.kycDocumentFrontName || '未上传'}</p>
            </div>
            <div className="row-actions">
              <button className="secondary-button" type="button" onClick={() => void action(customer.id, 'approve')}>
                通过
              </button>
              <button className="ghost-button" type="button" onClick={() => void action(customer.id, 'reject')}>
                驳回
              </button>
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
          deposit.asset,
          deposit.amount,
          deposit.proofImageName || deposit.proofText || '未上传',
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
  const [asset, setAsset] = useState<Asset>('JPY');
  const [amount, setAmount] = useState('10000');
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [reason, setReason] = useState('后台测试调账');

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
          客户
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            {props.state.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.email}</option>
            ))}
          </select>
        </label>
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

  useEffect(() => {
    setExchangeDrafts(Object.fromEntries(props.state.exchanges.map((exchange) => [exchange.id, String(exchange.intervalSeconds)])));
  }, [props.state.exchanges]);

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

  async function updateVip(rule: VipRule, profitCapJpy: number) {
    const result = await props.run(
      () =>
        props.call<AdminState>(
          `/admin/vip/${rule.level}`,
          { method: 'PATCH', body: JSON.stringify({ ...rule, profitCapJpy }) },
          props.token,
        ),
      'VIP 利润规则已更新。',
    );
    if (result) await props.refresh();
  }

  return (
    <section className="two-column">
      <div className="panel">
        <div className="panel-head">
          <h2>VIP / 利润规则</h2>
          <BadgeCheck size={22} />
        </div>
        <div className="admin-list">
          {props.state.vipRules.map((rule) => (
            <article className="admin-row" key={rule.level}>
              <div>
                <strong>{rule.level}</strong>
                <p>{formatJpy(rule.minBalanceJpy)} / {rule.dailyLimit} 次 / cap {formatJpy(rule.profitCapJpy)}</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => void updateVip(rule, rule.profitCapJpy + 1000)}>
                封顶 +1000
              </button>
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
          <SlidersHorizontal size={22} />
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

function vipRule(dashboard: DashboardData) {
  return dashboard.vipRules.find((rule) => rule.level === dashboard.customer.vipLevel) ?? dashboard.vipRules[0];
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
