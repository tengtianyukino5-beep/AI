import { Injectable } from '@nestjs/common';

type Asset = 'JPY' | 'USDT' | 'BTC' | 'ETH';
type CryptoAsset = Exclude<Asset, 'JPY'>;
type MarketAsset = CryptoAsset | 'XRP' | 'SOL' | 'DOT' | 'DOGE' | 'LTC' | 'MONA' | 'BCC' | 'XLM';
type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'need_more_info';
type VipLevel = 'VIP0' | 'VIP1' | 'VIP2' | 'VIP3';
type CustomerStatus = 'active' | 'frozen' | 'disabled' | 'finance_review_required';
type LedgerType =
  | 'deposit'
  | 'withdrawal'
  | 'conversion_in'
  | 'conversion_out'
  | 'simulation_profit'
  | 'operation_reward'
  | 'manual_credit'
  | 'manual_debit'
  | 'invite_reward'
  | 'reversal';

interface AssetBalance {
  asset: Asset;
  available: string;
  frozen: string;
  balanceVersion: number;
}

interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  status: CustomerStatus;
  kycStatus: KycStatus;
  vipLevel: VipLevel;
  autoAiEnabled: boolean;
  creditScore: number;
  manualDailyLimit?: number;
  successRatePercent?: number;
  aiRunning: boolean;
  inviteCode: string;
  kycDocumentFrontName?: string;
  kycDocumentFrontDataUrl?: string;
  withdrawalBankAccount?: string;
  withdrawalUsdtTrc20Address?: string;
  withdrawalUsdtErc20Address?: string;
  withdrawalBtcAddress?: string;
  withdrawalEthAddress?: string;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  businessNo: string;
  customerId: string;
  asset: Asset;
  ledgerType: LedgerType;
  direction: 'in' | 'out' | 'freeze' | 'unfreeze';
  amount: string;
  balanceAfter: string;
  ledgerStatus: 'pending' | 'posted' | 'failed' | 'reversed';
  titleJa: string;
  titleZh: string;
  note: string;
  createdAt: string;
}

interface DepositOrder {
  id: string;
  businessNo: string;
  customerId: string;
  asset: CryptoAsset;
  network?: 'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum';
  depositAddressId?: string;
  depositAddressSnapshot?: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  proofText: string;
  proofImageName?: string;
  proofImageDataUrl?: string;
  adminNote?: string;
  reviewedAt?: string;
  unitPriceJpy?: string;
  valuationJpy?: string;
  priceSource?: 'real_api' | 'fallback' | 'manual' | 'mixed';
  priceSourceLabelJa?: string;
  priceSourceDetailJa?: string;
  priceUpdatedAt?: string;
  marketExchange?: string;
  marketPair?: string;
  createdAt: string;
}

interface DepositAddressConfig {
  id: string;
  asset: CryptoAsset;
  network: 'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum';
  labelJa: string;
  labelZh: string;
  address: string;
  memo?: string;
  minConfirmations: number;
  enabled: boolean;
  updatedAt: string;
}

interface WithdrawalOrder {
  id: string;
  businessNo: string;
  customerId: string;
  asset: Asset;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  destinationType: 'bank' | 'wallet';
  network?: 'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum' | 'Bank';
  destinationText: string;
  note?: string;
  adminNote?: string;
  unitPriceJpy?: string;
  valuationJpy?: string;
  priceSource?: 'real_api' | 'fallback' | 'manual' | 'mixed';
  priceSourceLabelJa?: string;
  priceSourceDetailJa?: string;
  priceUpdatedAt?: string;
  marketExchange?: string;
  marketPair?: string;
  createdAt: string;
  completedAt?: string;
}

interface ConversionQuote {
  id: string;
  fromAsset: CryptoAsset;
  fromAmount: string;
  path: string[];
  displayPair: string;
  unitPriceJpy: string;
  estimatedJpy: string;
  feeJpy: string;
  receivedJpy: string;
  rateSource: 'primary' | 'backup' | 'manual';
  rateUpdatedAt: string;
  expiresAt: string;
  priceSource?: 'real_api' | 'fallback' | 'manual' | 'mixed';
  priceSourceLabelJa?: string;
  priceSourceDetailJa?: string;
  marketExchange?: string;
  marketPair?: string;
  marketBidJpy?: string;
  marketAskJpy?: string;
  marketLastJpy?: string;
  snapshot: {
    cryptoToUsdt: string;
    usdtToUsd: string;
    usdToJpy: string;
  };
}

interface SimulationOpportunity {
  id: string;
  customerId: string;
  exchanges: [string, string];
  pair: string;
  baseAsset: MarketAsset;
  spreadPercent: string;
  principalJpy: string;
  quantity: string;
  estimatedProfitJpy: string;
  grossProfitJpy: string;
  totalCostJpy: string;
  buyFeeJpy: string;
  sellFeeJpy: string;
  slippageCostJpy: string;
  riskBufferJpy: string;
  feeRate: string;
  slippageRate: string;
  riskBufferRate: string;
  buyReferenceJpy: string;
  sellReferenceJpy: string;
  confidencePercent: string;
  liquidityScore: string;
  volatility24hPercent: string;
  executionSeconds: number;
  riskLevelJa: string;
  status: 'available' | 'executed' | 'expired' | 'missed';
  aiSummaryJa: string;
  missedReasonJa?: string;
  missedDetailJa?: string;
  missedAt?: string;
  businessDateTokyo: string;
  createdAt: string;
}

interface SimulationOrder {
  id: string;
  businessNo: string;
  customerId: string;
  opportunityId: string;
  status: 'created' | 'analyzing' | 'executing' | 'settled' | 'failed' | 'cancelled';
  executionVenue?: 'internal_test' | 'live_exchange';
  buyExchange?: string;
  sellExchange?: string;
  buyOrderId?: string;
  sellOrderId?: string;
  executedQuantity?: string;
  executedBuyJpy?: string;
  executedSellJpy?: string;
  marketSource?: 'real_api' | 'fallback' | 'manual' | 'mixed';
  principalJpy: string;
  profitJpy: string;
  grossProfitJpy?: string;
  totalCostJpy?: string;
  baseAsset?: MarketAsset;
  vipLevel: VipLevel;
  balanceVersionBefore: number;
  balanceVersionAfter: number;
  aiSummaryJa: string;
  disclosureJa: string;
  adminNoteJa?: string;
  failureReasonJa?: string;
  failureDetailJa?: string;
  createdAt: string;
  settledAt?: string;
}

interface VipRule {
  level: VipLevel;
  dailyLimit: number;
  aiPower: string;
  intervalSeconds: number;
  minBalanceJpy: number;
  profitFloorJpy: number;
  profitCapJpy: number;
  highProfitThresholdJpy: number;
  highProfitProbability: number;
  upgradeBalanceJpy: number;
}

interface ExchangeConfig {
  id: string;
  name: string;
  category: 'japan' | 'overseas';
  intervalSeconds: number;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
  enabled: boolean;
  apiProvider:
    | 'bitflyer'
    | 'coincheck'
    | 'gmo_coin'
    | 'bitbank'
    | 'okcoin_japan'
    | 'bitpoint'
    | 'bittrade'
    | 'okx'
    | 'htx'
    | 'binance'
    | 'fallback';
  apiUrl?: string;
  sourcePriority: 'primary' | 'backup' | 'manual';
  lastStatus: 'live' | 'fallback' | 'disabled' | 'error';
  lastCheckedAt?: string;
  lastSuccessAt?: string;
  realApiPairCount?: number;
  fallbackPairCount?: number;
  unsupportedPairCount?: number;
  lastError?: string;
}

interface MarketTicker {
  exchangeId: string;
  exchangeName: string;
  pair: `${MarketAsset}/JPY`;
  bidJpy: string;
  askJpy: string;
  lastJpy: string;
  spreadPercent: string;
  source: 'real_api' | 'fallback' | 'manual';
  intervalSeconds: number;
  latencyMs: number;
  sampledAt: string;
}

interface MarketScannerSummary {
  enabledExchangeCount: number;
  fastestIntervalSeconds: number;
  slowestIntervalSeconds: number;
  opportunityThresholdSeconds: number;
  activeOpportunityCount: number;
  signalState: 'locked' | 'scanning' | 'opportunity';
  dominantPair: `${MarketAsset}/JPY`;
  lastScanAt: string;
}

interface AutoAiRuntime {
  enabled: boolean;
  stage: 'locked' | 'idle' | 'scanning' | 'settled' | 'missed' | 'limit_reached';
  lastOrderNo?: string;
  lastProfitJpy?: string;
  lastSettledAt?: string;
  lastMissedOpportunityId?: string;
  lastMissedReasonJa?: string;
  lastMissedAt?: string;
  nextRunHintJa: string;
}

interface TradingRuntimeStatus {
  marketDataMode: 'real_public_api' | 'hybrid_fallback';
  executionMode: 'internal_test' | 'live_exchange_disabled' | 'live_exchange';
  liveExecutionReady: boolean;
  realApiTickerCount: number;
  fallbackTickerCount: number;
  manualTickerCount: number;
  lastMarketRefreshAt?: string;
  messageJa: string;
  messageZh: string;
}

interface AdminSummary {
  pendingKyc: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalCustomers: number;
  totalJpy: string;
  simulationProfitToday: string;
  auditCount: number;
  realApiTickerCount: number;
  fallbackTickerCount: number;
  executionMode: TradingRuntimeStatus['executionMode'];
}

type CustomerRecord = CustomerProfile & {
  password: string;
  campaignRewardPosted: boolean;
  invitedBy?: string;
};

interface AuditLog {
  id: string;
  action: string;
  operator: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

interface InviteReward {
  id: string;
  inviterCustomerId: string;
  inviteeCustomerId: string;
  amountJpy: string;
  status: 'frozen' | 'posted' | 'reversed';
  createdAt: string;
}

interface TokenRecord {
  actorId: string;
  role: 'customer' | 'admin';
}

interface SupportMessage {
  id: string;
  ticketNo: string;
  customerId: string;
  sender: 'customer' | 'support';
  category: string;
  message: string;
  createdAt: string;
}

interface SupportConversation {
  ticketNo: string;
  status: 'open' | 'answered';
  messages: SupportMessage[];
  updatedAt?: string;
}

type MarketCacheEntry = {
  bidJpy: number;
  askJpy: number;
  lastJpy: number;
  fetchedAt: number;
  source: MarketTicker['source'];
};

type FxCacheEntry = {
  usdToJpy: number;
  fetchedAt: number;
  source: 'real_api' | 'fallback';
  provider: string;
};

type ExecutionMode = 'manual' | 'auto';

interface ExecutionRequest {
  customer: CustomerRecord;
  opportunity: SimulationOpportunity;
  mode: ExecutionMode;
  marketSource: SimulationOrder['marketSource'];
}

interface ExecutionResult {
  status: 'settled' | 'failed';
  executionVenue: SimulationOrder['executionVenue'];
  buyExchange: string;
  sellExchange: string;
  buyOrderId?: string;
  sellOrderId?: string;
  executedQuantity: string;
  executedBuyJpy: string;
  executedSellJpy: string;
  grossProfitJpy: string;
  totalCostJpy: string;
  netProfitJpy: string;
  disclosureJa: string;
  failureReasonJa?: string;
  failureDetailJa?: string;
}

interface ExecutionProvider {
  readonly venue: NonNullable<SimulationOrder['executionVenue']>;
  execute(request: ExecutionRequest): ExecutionResult;
}

class TestExecutionProvider implements ExecutionProvider {
  readonly venue = 'internal_test' as const;

  execute(request: ExecutionRequest): ExecutionResult {
    const { opportunity, marketSource } = request;
    const netProfit = Number(opportunity.estimatedProfitJpy);
    const sourceLabel = marketSource === 'real_api' ? '公開取引所API' : marketSource === 'mixed' ? '公開APIとバックアップデータ' : 'バックアップデータ';
    if (!Number.isFinite(netProfit) || netProfit <= 0) {
      return {
        status: 'failed',
        executionVenue: this.venue,
        buyExchange: opportunity.exchanges[0],
        sellExchange: opportunity.exchanges[1],
        executedQuantity: opportunity.quantity,
        executedBuyJpy: opportunity.buyReferenceJpy,
        executedSellJpy: opportunity.sellReferenceJpy,
        grossProfitJpy: opportunity.grossProfitJpy,
        totalCostJpy: opportunity.totalCostJpy,
        netProfitJpy: '0',
        disclosureJa: '価格差、手数料、スリッページ、リスクバッファを再照合し、利益反映なしとして記録しました。',
        failureReasonJa: '価格差が手数料・スリッページ・リスクバッファを下回りました。',
        failureDetailJa: `${sourceLabel}の価格情報を照合しましたが、控除後の純利益が0円以下となったため、失敗として記録されました。`,
      };
    }

    return {
      status: 'settled',
      executionVenue: this.venue,
      buyExchange: opportunity.exchanges[0],
      sellExchange: opportunity.exchanges[1],
      buyOrderId: this.testOrderId('BUY'),
      sellOrderId: this.testOrderId('SELL'),
      executedQuantity: opportunity.quantity,
      executedBuyJpy: opportunity.buyReferenceJpy,
      executedSellJpy: opportunity.sellReferenceJpy,
      grossProfitJpy: opportunity.grossProfitJpy,
      totalCostJpy: opportunity.totalCostJpy,
      netProfitJpy: String(Math.floor(netProfit)),
      disclosureJa:
        `相場データは${sourceLabel}を使用し、AI実行結果を注文履歴へ記録しました。` +
        '確定した純利益のみJPY残高へ反映しています。',
    };
  }

  private testOrderId(prefix: string) {
    return `TEST-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }
}

class LiveExchangeExecutionProvider implements ExecutionProvider {
  readonly venue = 'live_exchange' as const;

  execute(_request: ExecutionRequest): ExecutionResult {
    throw new Error('ライブ取引所への発注は未設定です。APIキー、取引所、権限、サンドボックス/本番環境を設定してから有効化してください。');
  }
}

const disclosureJa =
  '相場データは公開取引所APIを優先して取得し、AI実行処理、資金反映、履歴記録を東京時間に基づいて管理します。';
const balanceAssets: Asset[] = ['JPY', 'USDT', 'BTC', 'ETH'];
const cryptoAssets: CryptoAsset[] = ['USDT', 'BTC', 'ETH'];
const marketAssets: MarketAsset[] = ['BTC', 'ETH', 'XRP', 'SOL', 'DOT', 'DOGE', 'LTC', 'MONA', 'BCC', 'XLM'];
const marketFeedAssets: MarketAsset[] = ['USDT', ...marketAssets];
const arbitrageFeeRate = 0.0015;
const arbitrageSlippageRate = 0.001;
const arbitrageRiskBufferRate = 0.0005;
const defaultSuccessRatePercent = 90;
const opportunityThresholdSeconds = 0.01;
const minimumAiBalanceJpy = 10000;

@Injectable()
export class AppService {
  private readonly customers = new Map<string, CustomerRecord>();
  private readonly tokens = new Map<string, TokenRecord>();
  private readonly emailCodes = new Map<string, string>();
  private readonly balances = new Map<string, Map<Asset, AssetBalance>>();
  private readonly ledger: LedgerEntry[] = [];
  private readonly deposits: DepositOrder[] = [];
  private readonly withdrawals: WithdrawalOrder[] = [];
  private readonly depositAddresses: DepositAddressConfig[] = [
    {
      id: 'addr_eth_ethereum',
      asset: 'ETH',
      network: 'Ethereum',
      labelJa: 'ETH Ethereum 入金アドレス',
      labelZh: 'ETH Ethereum 入金地址',
      address: '0x8b4F3A2d9E5c1B7A6F0D4a922f7E6C18A1d9026C',
      minConfirmations: 12,
      enabled: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'addr_btc_bitcoin',
      asset: 'BTC',
      network: 'Bitcoin',
      labelJa: 'BTC Bitcoin 入金アドレス',
      labelZh: 'BTC Bitcoin 入金地址',
      address: 'bc1qai9x4l0testdepositaddress7v8s3mf0k2q9x',
      minConfirmations: 3,
      enabled: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'addr_usdt_erc20',
      asset: 'USDT',
      network: 'ERC-20',
      labelJa: 'USDT ERC-20 入金アドレス',
      labelZh: 'USDT ERC-20 入金地址',
      address: '0x6F4aC7bD2e991Cbe9A311E7a8d0D5fB80D6A1c44',
      minConfirmations: 20,
      enabled: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'addr_usdt_trc20',
      asset: 'USDT',
      network: 'TRC-20',
      labelJa: 'USDT TRC-20 入金アドレス',
      labelZh: 'USDT TRC-20 入金地址',
      address: 'TQx9uP6sA1TestUSDTTrc20DepositKp31',
      minConfirmations: 20,
      enabled: true,
      updatedAt: new Date().toISOString(),
    },
  ];
  private readonly quotes = new Map<string, ConversionQuote>();
  private readonly opportunities: SimulationOpportunity[] = [];
  private readonly orders: SimulationOrder[] = [];
  private readonly auditLogs: AuditLog[] = [];
  private readonly inviteRewards: InviteReward[] = [];
  private readonly supportMessages: SupportMessage[] = [];
  private readonly supportTickets = new Map<string, string>();
  private readonly marketCache = new Map<string, MarketCacheEntry>();
  private usdJpyCache?: FxCacheEntry;
  private readonly executionProvider: ExecutionProvider = new TestExecutionProvider();
  private readonly autoAiRuns = new Map<
    string,
    { lastRunAt: number; lastEvent: 'settled' | 'missed' | 'scanning'; lastOrderId?: string; lastMissedOpportunityId?: string }
  >();
  private marketRefreshInFlight = false;
  private lastMarketRefreshStartedAt = 0;

  private readonly vipRules: VipRule[] = [
    {
      level: 'VIP0',
      dailyLimit: 5,
      aiPower: '1x',
      intervalSeconds: 30,
      minBalanceJpy: 0,
      profitFloorJpy: 800,
      profitCapJpy: 3000,
      highProfitThresholdJpy: 2000,
      highProfitProbability: 80,
      upgradeBalanceJpy: 0,
    },
    {
      level: 'VIP1',
      dailyLimit: 10,
      aiPower: '2x',
      intervalSeconds: 10,
      minBalanceJpy: 75000,
      profitFloorJpy: 5000,
      profitCapJpy: 20000,
      highProfitThresholdJpy: 15000,
      highProfitProbability: 80,
      upgradeBalanceJpy: 75000,
    },
    {
      level: 'VIP2',
      dailyLimit: 30,
      aiPower: '5x',
      intervalSeconds: 5,
      minBalanceJpy: 250000,
      profitFloorJpy: 20000,
      profitCapJpy: 90000,
      highProfitThresholdJpy: 60000,
      highProfitProbability: 80,
      upgradeBalanceJpy: 250000,
    },
    {
      level: 'VIP3',
      dailyLimit: 100,
      aiPower: '10x',
      intervalSeconds: 2,
      minBalanceJpy: 500000,
      profitFloorJpy: 150000,
      profitCapJpy: 1200000,
      highProfitThresholdJpy: 700000,
      highProfitProbability: 80,
      upgradeBalanceJpy: 500000,
    },
  ];

  private readonly exchanges: ExchangeConfig[] = [
    this.exchange('ex-jp-1', 'bitFlyer', 'japan', 'bitflyer', 'https://api.bitflyer.com/v1/ticker?product_code=BTC_JPY'),
    this.exchange('ex-jp-2', 'Coincheck', 'japan', 'coincheck', 'https://coincheck.com/api/ticker'),
    this.exchange('ex-jp-3', 'GMO Coin', 'japan', 'gmo_coin', 'https://api.coin.z.com/public/v1/ticker?symbol=BTC'),
    this.exchange('ex-jp-4', 'bitbank', 'japan', 'bitbank', 'https://public.bitbank.cc/btc_jpy/ticker'),
    this.exchange('ex-jp-5', 'SBI VC Trade', 'japan', 'fallback'),
    this.exchange('ex-jp-6', 'Rakuten Wallet', 'japan', 'fallback'),
    this.exchange('ex-jp-7', 'DMM Bitcoin', 'japan', 'fallback'),
    this.exchange('ex-jp-8', 'BITPoint Japan', 'japan', 'bitpoint', 'https://api.bitpoint.co.jp/bpj-ex-api/api/v1/ticker'),
    this.exchange('ex-jp-9', 'OKCoinJapan', 'japan', 'okcoin_japan', 'https://www.okcoin.jp/api/spot/v3/instruments/BTC-JPY/ticker'),
    this.exchange('ex-jp-10', 'BitTrade', 'japan', 'bittrade', 'https://api-cloud.bittrade.co.jp/market/detail/merged'),
  ];

  constructor() {
    this.exchanges.push(
      this.exchange('ex-okx', 'OKX', 'overseas', 'okx', 'https://www.okx.com/api/v5/market/ticker'),
      this.exchange('ex-htx', 'HTX', 'overseas', 'htx', 'https://api.huobi.pro/market/detail/merged'),
      this.exchange('ex-binance', 'Binance', 'overseas', 'binance', 'https://api.binance.com/api/v3/ticker/price'),
    );
    this.seed();
  }

  private exchange(
    id: string,
    name: string,
    category: ExchangeConfig['category'],
    apiProvider: ExchangeConfig['apiProvider'],
    apiUrl?: string,
  ): ExchangeConfig {
    return {
      id,
      name,
      category,
      intervalSeconds: 1,
      minIntervalSeconds: 0.001,
      maxIntervalSeconds: 30,
      enabled: true,
      apiProvider,
      apiUrl,
      sourcePriority: apiUrl ? 'primary' : 'backup',
      lastStatus: apiUrl ? 'live' : 'fallback',
      lastCheckedAt: undefined,
      lastSuccessAt: undefined,
      realApiPairCount: 0,
      fallbackPairCount: 0,
      unsupportedPairCount: 0,
      lastError: undefined,
    };
  }

  health() {
    return {
      status: 'ok' as const,
      service: 'AI Arbitrage Operations API',
      timestamp: new Date().toISOString(),
    };
  }

  async sendEmailCode(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('メールアドレスを入力してください。');
    }
    const realEmailEnabled = this.realEmailEnabled();
    const code = realEmailEnabled ? this.emailCode() : '888888';
    this.emailCodes.set(normalizedEmail, code);
    if (realEmailEnabled) {
      await this.sendEmailCodeViaProvider(normalizedEmail, code);
    }
    return {
      email: normalizedEmail,
      deliveryMode: realEmailEnabled ? 'email_api' : 'development',
      developmentCode: realEmailEnabled ? undefined : '888888',
      messageJa: realEmailEnabled ? '認証コードをメールで送信しました。' : '認証コードを発行しました。',
    };
  }

  async register(input: { email: string; password: string; code: string; inviteCode?: string }) {
    const email = input.email.toLowerCase().trim();
    if (!email || !input.password) {
      throw new Error('メールアドレスとパスワードを入力してください。');
    }
    if ((this.emailCodes.get(email) ?? (this.realEmailEnabled() ? '' : '888888')) !== input.code) {
      throw new Error('認証コードが正しくありません。');
    }
    const existing = [...this.customers.values()].find((customer) => customer.email === email);
    if (existing) {
      throw new Error('このメールアドレスは登録済みです。');
    }

    const invitedBy = input.inviteCode
      ? [...this.customers.values()].find((customer) => customer.inviteCode === input.inviteCode)?.id
      : undefined;
    const customer = this.createCustomer(email, input.password, 'not_submitted', 'VIP0', 0, {
      invitedBy,
      campaignRewardPosted: false,
    });
    if (invitedBy) {
      this.inviteRewards.push({
        id: this.id('reward'),
        inviterCustomerId: invitedBy,
        inviteeCustomerId: customer.id,
        amountJpy: '3000',
        status: 'frozen',
        createdAt: this.now(),
      });
    }
    this.audit('customer.register', customer.email, 'customer', customer.id, '客户邮箱注册');
    return this.customerSession(customer);
  }

  async customerLogin(email: string, password: string) {
    const customer = [...this.customers.values()].find((item) => item.email === email.toLowerCase().trim());
    if (!customer || customer.password !== password) {
      throw new Error('メールアドレスまたはパスワードが正しくありません。');
    }
    if (customer.status !== 'active') {
      throw new Error('アカウントが制限されています。');
    }
    return this.customerSession(customer);
  }

  adminLogin(username: string, password: string) {
    if (username !== 'yuki888' || password !== '123456') {
      this.audit('admin.login.failed', username, 'admin', username, '后台登录失败');
      throw new Error('アカウントまたはパスワードが正しくありません。');
    }
    const token = this.token('admin_seed', 'admin');
    this.audit('admin.login.success', username, 'admin', username, '后台登录成功');
    return {
      token,
      admin: {
        id: 'admin_seed',
        username: 'yuki888',
        role: '超级管理员',
        permissions: ['customer.edit', 'deposit.approve', 'balance.adjust', 'kyc.approve', 'vip.update'],
      },
      warning: '生产环境必须修改或禁用默认账号 yuki888 / 123456。',
    };
  }

  customerByToken(token: string) {
    const record = this.tokens.get(token);
    if (!record || record.role !== 'customer') {
      throw new Error('ログインが必要です。');
    }
    const customer = this.customers.get(record.actorId);
    if (!customer) {
      throw new Error('お客様情報が見つかりません。再度ログインしてください。');
    }
    return customer;
  }

  adminByToken(token: string) {
    const record = this.tokens.get(token);
    if (!record || record.role !== 'admin') {
      throw new Error('管理セッションの有効期限が切れました。再度ログインしてください。');
    }
    return record.actorId;
  }

  async dashboard(customer: CustomerRecord) {
    await this.refreshExternalMarkets();
    const marketTickers = this.marketTickers();
    this.refreshOpportunityMarket(customer, marketTickers);
    this.ensureDailyOpportunities(customer, marketTickers);
    this.refreshOpportunityMarket(customer, marketTickers);
    const autoAiRuntime = this.runAutoAiIfNeeded(customer, marketTickers);
    const marketScanner = this.marketScannerSummary(customer, marketTickers);
    const displayMarketTickers = this.rotatingMarketTickers(marketTickers);
    const tradingRuntime = this.tradingRuntimeStatus(marketTickers);
    return {
      customer: this.publicCustomer(customer),
      balances: this.getBalances(customer.id),
      deposits: this.deposits.filter((item) => item.customerId === customer.id),
      withdrawals: this.withdrawals.filter((item) => item.customerId === customer.id),
      depositAddresses: this.depositAddresses.filter((item) => item.enabled),
      ledger: this.ledger.filter((item) => item.customerId === customer.id).slice(0, 20),
      opportunities: this.opportunities.filter((item) => item.customerId === customer.id && item.status === 'available'),
      missedOpportunities: this.opportunities
        .filter((item) => item.customerId === customer.id && item.status === 'missed'),
      orders: this.orders.filter((item) => item.customerId === customer.id),
      vipRules: this.vipRules,
      marketTickers: displayMarketTickers,
      marketScanner,
      autoAiRuntime,
      todayUsed: this.todayAttemptCount(customer),
      todayLimit: this.effectiveDailyLimit(customer),
      todayProfitJpy: this.todayProfitJpy(customer),
      tokyoNow: this.tokyoNow(),
      disclosureJa,
      tradingRuntime,
    };
  }

  submitKyc(customer: CustomerRecord, input: { fullName: string; documentNo: string; documentFrontName?: string; kycDocumentFrontDataUrl?: string }) {
    customer.name = input.fullName || customer.name;
    customer.kycStatus = 'pending';
    customer.kycDocumentFrontName = input.documentFrontName;
    customer.kycDocumentFrontDataUrl = input.kycDocumentFrontDataUrl;
    this.audit(
      'kyc.submit',
      customer.email,
      'customer',
      customer.id,
      `KYC 提交：${input.documentNo || '未填写'} / ${input.documentFrontName || '未上传'} / ${input.kycDocumentFrontDataUrl ? '凭证已上传' : '无凭证图片'}`,
    );
    return this.publicCustomer(customer);
  }

  async toggleAutoAi(customer: CustomerRecord, enabled: boolean) {
    if (enabled && customer.kycStatus !== 'approved') {
      throw new Error('本人確認が完了していないため、自動AI裁定を開始できません。');
    }
    if (enabled) {
      const jpyBalance = Number(this.balance(customer.id, 'JPY').available);
      if (!Number.isFinite(jpyBalance) || jpyBalance < minimumAiBalanceJpy) {
        throw new Error(`JPY利用可能残高が不足しています。自動AI裁定を開始するには最低 ${this.formatJpyText(minimumAiBalanceJpy)} が必要です。`);
      }
    }
    customer.autoAiEnabled = enabled;
    if (enabled) {
      const marketTickers = this.marketTickers();
      this.ensureDailyOpportunities(customer, marketTickers);
      this.runAutoAiIfNeeded(customer, marketTickers, true);
    }
    this.audit('simulation.auto_toggle', customer.email, 'customer', customer.id, enabled ? '自動AI裁定を開始' : '自動AI裁定を停止');
    return this.dashboard(customer);
  }

  supportConversation(customer: CustomerRecord): SupportConversation {
    const messages = this.supportMessages
      .filter((message) => message.customerId === customer.id)
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    const ticketNo = messages[0]?.ticketNo ?? this.supportTicketNo(customer.id);
    const updatedAt = messages.length ? messages[messages.length - 1].createdAt : undefined;
    return {
      ticketNo,
      status: messages.some((message) => message.sender === 'support') ? 'answered' : 'open',
      messages,
      updatedAt,
    };
  }

  sendSupportMessage(customer: CustomerRecord, input: { category?: string; message?: string }): SupportConversation {
    const category = input.category?.trim() || 'お問い合わせ';
    const message = input.message?.trim() ?? '';
    if (!message) {
      throw new Error('お問い合わせ内容を入力してください。');
    }
    const ticketNo = this.supportTicketNo(customer.id);
    const customerMessage: SupportMessage = {
      id: this.id('supmsg'),
      ticketNo,
      customerId: customer.id,
      sender: 'customer',
      category,
      message,
      createdAt: this.now(),
    };
    const reply: SupportMessage = {
      id: this.id('supmsg'),
      ticketNo,
      customerId: customer.id,
      sender: 'support',
      category,
      message: this.supportReplyJa(category, message, customer),
      createdAt: this.now(),
    };
    this.supportMessages.push(customerMessage, reply);
    this.audit('support.message', customer.email, 'support', ticketNo, `${category} / ${message.slice(0, 80)}`);
    return this.supportConversation(customer);
  }

  async createDeposit(customer: CustomerRecord, input: { asset: CryptoAsset; amount: string; network?: DepositOrder['network']; proofText: string; proofImageName?: string; proofImageDataUrl?: string }) {
    if (customer.kycStatus !== 'approved') {
      throw new Error('入金申請前に本人確認を完了してください。');
    }
    if (!input.proofText?.trim()) {
      throw new Error('送金TxIDまたは受付メモを入力してください。');
    }
    if (!input.proofImageName?.trim()) {
      throw new Error('入金証明写真をアップロードしてください。');
    }
    if (input.asset === 'USDT' && !['TRC-20', 'ERC-20'].includes(input.network ?? '')) {
      throw new Error('USDT入金はTRC-20またはERC-20ネットワークを選択してください。');
    }
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('有効な入金数量を入力してください。');
    }
    const pricing = await this.assetPricingSnapshot(input.asset, amount, true);
    const depositNetwork = input.asset === 'USDT' ? input.network : input.asset === 'BTC' ? 'Bitcoin' : 'Ethereum';
    const address = this.depositAddressFor(input.asset, depositNetwork);
    const deposit: DepositOrder = {
      id: this.id('dep'),
      businessNo: this.businessNo('DEP'),
      customerId: customer.id,
      asset: input.asset,
      network: depositNetwork,
      depositAddressId: address.id,
      depositAddressSnapshot: address.address,
      amount: this.formatDecimal(amount),
      status: 'pending',
      proofText: input.proofText || 'transfer proof',
      proofImageName: input.proofImageName,
      proofImageDataUrl: this.compactDataUrl(input.proofImageDataUrl),
      adminNote: '管理部門の確認待ちです。承認後、対象資産の残高へ反映されます。',
      unitPriceJpy: String(pricing.unitPriceJpy),
      valuationJpy: String(pricing.valuationJpy),
      priceSource: pricing.priceSource,
      priceSourceLabelJa: pricing.priceSourceLabelJa,
      priceSourceDetailJa: pricing.priceSourceDetailJa,
      priceUpdatedAt: pricing.priceUpdatedAt,
      marketExchange: pricing.marketExchange,
      marketPair: pricing.marketPair,
      createdAt: this.now(),
    };
    this.deposits.unshift(deposit);
    this.audit('deposit.create', customer.email, 'deposit', deposit.id, `${input.asset} ${input.amount}`);
    return deposit;
  }

  async createWithdrawal(
    customer: CustomerRecord,
    input: {
      asset: Asset;
      amount: string;
      destinationType: 'bank' | 'wallet';
      network?: WithdrawalOrder['network'];
      destinationText: string;
      note?: string;
    },
  ) {
    if (customer.kycStatus !== 'approved') {
      throw new Error('出金申請には本人確認が必要です。');
    }
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('出金数量を入力してください。');
    }
    if (!input.destinationText?.trim()) {
      throw new Error('出金先を入力してください。');
    }
    const balance = this.balance(customer.id, input.asset);
    if (Number(balance.available) < amount) {
      throw new Error('利用可能残高が不足しています。');
    }
    const pricing = input.asset === 'JPY' ? this.jpyPricingSnapshot(amount) : await this.assetPricingSnapshot(input.asset, amount, true);
    const network = input.asset === 'JPY' ? 'Bank' : input.network ?? this.defaultWithdrawalNetwork(input.asset);
    const destinationText = input.destinationText.trim();
    this.saveWithdrawalDestination(customer, input.asset, network, destinationText);
    const withdrawal: WithdrawalOrder = {
      id: this.id('wd'),
      businessNo: this.businessNo('WDR'),
      customerId: customer.id,
      asset: input.asset,
      amount: input.amount,
      status: 'pending',
      destinationType: input.destinationType,
      network,
      destinationText,
      note: input.note,
      adminNote: '管理部門の出金審査待ちです。承認後、出金処理が完了します。',
      unitPriceJpy: String(pricing.unitPriceJpy),
      valuationJpy: String(pricing.valuationJpy),
      priceSource: pricing.priceSource,
      priceSourceLabelJa: pricing.priceSourceLabelJa,
      priceSourceDetailJa: pricing.priceSourceDetailJa,
      priceUpdatedAt: pricing.priceUpdatedAt,
      marketExchange: pricing.marketExchange,
      marketPair: pricing.marketPair,
      createdAt: this.now(),
    };
    this.withdrawals.unshift(withdrawal);
    this.ledger.unshift({
      id: this.id('led'),
      businessNo: withdrawal.businessNo,
      customerId: customer.id,
      asset: input.asset,
      ledgerType: 'withdrawal',
      direction: 'out',
      amount: input.amount,
      balanceAfter: balance.available,
      ledgerStatus: 'pending',
      titleJa: '出金申請',
      titleZh: '出金申请待审核',
      note: input.destinationText,
      createdAt: this.now(),
    });
    this.audit('withdrawal.create', customer.email, 'withdrawal', withdrawal.id, `${input.asset} ${input.amount}`);
    return withdrawal;
  }

  async quoteConversion(customer: CustomerRecord, input: { fromAsset: CryptoAsset; amount: string }) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('交換数量を入力してください。');
    }
    const balance = this.balance(customer.id, input.fromAsset);
    if (Number(balance.available) < amount) {
      throw new Error('残高が不足しています。');
    }
    const pricing = await this.assetPricingSnapshot(input.fromAsset, amount, true);
    const market = pricing.market;
    const unitPriceJpy = pricing.unitPriceJpy;
    const estimatedJpy = pricing.valuationJpy;
    const feeJpy = 0;
    const receivedJpy = estimatedJpy - feeJpy;
    const quote: ConversionQuote = {
      id: this.id('quote'),
      fromAsset: input.fromAsset,
      fromAmount: input.amount,
      path: input.fromAsset === 'USDT' ? ['USDT', 'USD', 'JPY'] : [input.fromAsset, 'USDT', 'USD', 'JPY'],
      displayPair: `${input.fromAsset}/JPY`,
      unitPriceJpy: String(unitPriceJpy),
      estimatedJpy: String(estimatedJpy),
      feeJpy: String(feeJpy),
      receivedJpy: String(receivedJpy),
      rateSource: market.source,
      rateUpdatedAt: this.now(),
      expiresAt: new Date(Date.now() + 120000).toISOString(),
      priceSource: pricing.priceSource,
      priceSourceLabelJa: pricing.priceSourceLabelJa,
      priceSourceDetailJa: pricing.priceSourceDetailJa,
      marketExchange: pricing.marketExchange,
      marketPair: pricing.marketPair,
      marketBidJpy: pricing.marketBidJpy,
      marketAskJpy: pricing.marketAskJpy,
      marketLastJpy: pricing.marketLastJpy,
      snapshot: {
        cryptoToUsdt: String(market.cryptoToUsdt),
        usdtToUsd: String(market.usdtToUsd),
        usdToJpy: String(market.usdToJpy),
      },
    };
    this.quotes.set(quote.id, quote);
    return quote;
  }

  async executeConversion(customer: CustomerRecord, quoteId: string) {
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      throw new Error('見積もりが見つかりません。');
    }
    if (new Date(quote.expiresAt).getTime() < Date.now()) {
      throw new Error('レートの有効期限が切れました。');
    }
    this.adjustBalance(customer.id, quote.fromAsset, -Number(quote.fromAmount), 'conversion_out', '資産交換', '交換元資産の控除');
    this.adjustBalance(customer.id, 'JPY', Number(quote.receivedJpy), 'conversion_in', '資産交換', 'JPY受取額の反映');
    this.audit(
      'conversion.execute',
      customer.email,
      'conversion',
      quote.id,
      `${quote.path.join(' -> ')} = ¥${quote.estimatedJpy}`,
    );
    this.quotes.delete(quoteId);
    return this.dashboard(customer);
  }

  async upgradeVip(customer: CustomerRecord) {
    if (customer.kycStatus !== 'approved') {
      throw new Error('VIPアップグレードには本人確認が必要です。');
    }
    const nextLevel = this.nextVipLevel(customer.vipLevel);
    if (!nextLevel) {
      throw new Error('すでに最高VIPレベルです。');
    }
    const targetRule = this.vipRule(nextLevel);
    const costJpy = Math.max(0, Math.floor(targetRule.upgradeBalanceJpy));
    const jpy = Number(this.balance(customer.id, 'JPY').available);
    if (jpy < costJpy) {
      throw new Error(`VIPアップグレードには ${this.formatJpyText(costJpy)} のJPY残高が必要です。`);
    }
    if (costJpy > 0) {
      this.adjustBalance(customer.id, 'JPY', -costJpy, 'manual_debit', 'VIPアップグレード', `${nextLevel} アップグレード費用の控除`);
    }
    customer.vipLevel = nextLevel;
    this.audit('vip.upgrade', customer.email, 'customer', customer.id, `${nextLevel} セルフアップグレード、手数料 ¥${costJpy} を控除`);
    return this.dashboard(customer);
  }

  async createSimulationOrder(customer: CustomerRecord, opportunityId: string) {
    if (customer.kycStatus !== 'approved') {
      throw new Error('本人確認が完了していないため、AI裁定を利用できません。');
    }
    const opportunity = this.opportunities.find((item) => item.id === opportunityId && item.customerId === customer.id);
    if (!opportunity || opportunity.status !== 'available') {
      throw new Error('この裁定機会は利用できません。');
    }
    this.assertDailyOrderCapacity(customer);
    if (customer.aiRunning) {
      throw new Error('AI裁定処理中です。完了後に再度お試しください。');
    }
    if (this.shouldMissOpportunity(customer, opportunity)) {
      const failedOrder = this.missOpportunity(customer, opportunity, undefined, 'manual');
      this.autoAiRuns.set(customer.id, {
        lastRunAt: Date.now(),
        lastEvent: 'missed',
        lastOrderId: failedOrder.id,
        lastMissedOpportunityId: opportunity.id,
      });
      return {
        order: failedOrder,
        missedOpportunity: opportunity,
        dashboard: await this.dashboard(customer),
      };
    }
    const order = this.settleOpportunity(customer, opportunity, 'manual');
    if (customer.autoAiEnabled) {
      const marketTickers = this.marketTickers();
      this.ensureDailyOpportunities(customer, marketTickers);
    }
    this.autoAiRuns.set(customer.id, {
      lastRunAt: Date.now(),
      lastEvent: 'settled',
      lastOrderId: order.id,
    });
    return {
      order,
      missedOpportunity: null,
      dashboard: await this.dashboard(customer),
    };
  }

  inviteInfo(customer: CustomerRecord) {
    const invited = [...this.customers.values()].filter((item) => item.invitedBy === customer.id);
    const rewards = this.inviteRewards.filter((item) => item.inviterCustomerId === customer.id);
    return {
      inviteCode: customer.inviteCode,
      inviteUrl: `/register?invite=${customer.inviteCode}`,
      invited: invited.map((item) => this.publicCustomer(item)),
      rewards,
      rule: '招待者と招待されたお客様の本人確認が完了した後、管理部門の承認により招待報酬が反映されます。',
    };
  }

  adminSummary(): AdminSummary {
    const totalJpy = [...this.balances.values()].reduce((sum, balanceMap) => {
      return sum + Number(balanceMap.get('JPY')?.available ?? '0');
    }, 0);
    const simulationProfitToday = this.ledger
      .filter((item) => item.ledgerType === 'simulation_profit' && this.tokyoDate(item.createdAt) === this.businessDateTokyo())
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const runtime = this.tradingRuntimeStatus(this.marketTickers());
    return {
      pendingKyc: [...this.customers.values()].filter((item) => item.kycStatus === 'pending').length,
      pendingDeposits: this.deposits.filter((item) => item.status === 'pending').length,
      pendingWithdrawals: this.withdrawals.filter((item) => item.status === 'pending').length,
      totalCustomers: this.customers.size,
      totalJpy: String(totalJpy),
      simulationProfitToday: String(simulationProfitToday),
      auditCount: this.auditLogs.length,
      realApiTickerCount: runtime.realApiTickerCount,
      fallbackTickerCount: runtime.fallbackTickerCount,
      executionMode: runtime.executionMode,
    };
  }

  adminState() {
    void this.refreshExternalMarkets();
    return {
      summary: this.adminSummary(),
      customers: [...this.customers.values()].map((item) => this.publicCustomer(item)),
      balances: Object.fromEntries([...this.customers.keys()].map((id) => [id, this.getBalances(id)])),
      ledger: this.ledger,
      deposits: this.deposits,
      withdrawals: this.withdrawals,
      depositAddresses: this.depositAddresses,
      opportunities: this.opportunities,
      orders: this.orders,
      vipRules: this.vipRules,
      exchanges: this.exchanges,
      inviteRewards: this.inviteRewards,
      auditLogs: this.auditLogs,
      reconciliation: this.reconciliation(),
    };
  }

  approveKyc(customerId: string, operator: string) {
    const customer = this.mustCustomer(customerId);
    customer.kycStatus = 'approved';
    customer.vipLevel = customer.vipLevel || 'VIP0';
    this.postEligibleInviteRewards(customer);
    this.audit('kyc.approve', operator, 'customer', customer.id, 'KYC 通过，自动激活 VIP0');
    return this.adminState();
  }

  rejectKyc(customerId: string, operator: string) {
    const customer = this.mustCustomer(customerId);
    customer.kycStatus = 'rejected';
    this.audit('kyc.reject', operator, 'customer', customer.id, 'KYC 驳回');
    return this.adminState();
  }

  approveDeposit(depositId: string, operator: string) {
    const deposit = this.deposits.find((item) => item.id === depositId);
    if (!deposit) {
      throw new Error('入金記録が見つかりません。');
    }
    if (deposit.status === 'approved') {
      return this.adminState();
    }
    deposit.status = 'approved';
    deposit.reviewedAt = this.now();
    deposit.adminNote = '入金確認が完了し、対象資産の残高へ反映しました。';
    this.adjustBalance(deposit.customerId, deposit.asset, Number(deposit.amount), 'deposit', '入金', '入金確認済み');
    this.audit('deposit.approve', operator, 'deposit', deposit.id, `${deposit.asset} ${deposit.amount}`);
    return this.adminState();
  }

  rejectDeposit(depositId: string, operator: string) {
    const deposit = this.deposits.find((item) => item.id === depositId);
    if (!deposit) {
      throw new Error('入金記録が見つかりません。');
    }
    deposit.status = 'rejected';
    deposit.reviewedAt = this.now();
    deposit.adminNote = '提出内容または送金証明を確認できなかったため、入金申請は差戻しとなりました。';
    this.audit('deposit.reject', operator, 'deposit', deposit.id, '入金驳回');
    return this.adminState();
  }

  approveWithdrawal(withdrawalId: string, operator: string) {
    const withdrawal = this.withdrawals.find((item) => item.id === withdrawalId);
    if (!withdrawal) {
      throw new Error('出金記録が見つかりません。');
    }
    if (withdrawal.status === 'approved') {
      return this.adminState();
    }
    const balance = this.balance(withdrawal.customerId, withdrawal.asset);
    const amount = Number(withdrawal.amount);
    if (Number(balance.available) < amount) {
      throw new Error('お客様の利用可能残高が不足しているため、出金を完了できません。');
    }
    balance.available =
      withdrawal.asset === 'JPY'
        ? String(Math.round(Number(balance.available) - amount))
        : this.formatDecimal(Number(balance.available) - amount);
    balance.balanceVersion += 1;
    withdrawal.status = 'approved';
    withdrawal.completedAt = this.now();
    withdrawal.adminNote = '出金審査が完了し、指定された出金先への処理を完了しました。';
    this.ledger.unshift({
      id: this.id('led'),
      businessNo: withdrawal.businessNo,
      customerId: withdrawal.customerId,
      asset: withdrawal.asset,
      ledgerType: 'withdrawal',
      direction: 'out',
      amount: withdrawal.amount,
      balanceAfter: balance.available,
      ledgerStatus: 'posted',
      titleJa: '出金完了',
      titleZh: '出金完成',
      note: withdrawal.destinationText,
      createdAt: this.now(),
    });
    this.audit('withdrawal.approve', operator, 'withdrawal', withdrawal.id, `${withdrawal.asset} ${withdrawal.amount}`);
    return this.adminState();
  }

  rejectWithdrawal(withdrawalId: string, operator: string) {
    const withdrawal = this.withdrawals.find((item) => item.id === withdrawalId);
    if (!withdrawal) {
      throw new Error('出金記録が見つかりません。');
    }
    if (withdrawal.status !== 'pending') {
      return this.adminState();
    }
    const balance = this.balance(withdrawal.customerId, withdrawal.asset);
    withdrawal.status = 'rejected';
    withdrawal.completedAt = this.now();
    withdrawal.adminNote = '出金申請は差戻しとなりました。申請金額は残高から控除されていません。';
    this.ledger.unshift({
      id: this.id('led'),
      businessNo: withdrawal.businessNo,
      customerId: withdrawal.customerId,
      asset: withdrawal.asset,
      ledgerType: 'reversal',
      direction: 'out',
      amount: withdrawal.amount,
      balanceAfter: balance.available,
      ledgerStatus: 'posted',
      titleJa: '出金差戻し',
      titleZh: '出金驳回',
      note: withdrawal.destinationText,
      createdAt: this.now(),
    });
    this.audit('withdrawal.reject', operator, 'withdrawal', withdrawal.id, '出金驳回，余额保持不变');
    return this.adminState();
  }

  adjustCustomerBalance(
    input: { customerId: string; asset: Asset; amount: string; direction: 'credit' | 'debit'; reason: string },
    operator: string,
  ) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('有効な金額を入力してください。');
    }
    const signedAmount = input.direction === 'credit' ? amount : -amount;
    this.adjustBalance(
      input.customerId,
      input.asset,
      signedAmount,
      input.direction === 'credit' ? 'manual_credit' : 'manual_debit',
      '残高調整',
      input.reason || '管理部門による残高調整',
    );
    this.audit('balance.adjust', operator, 'customer', input.customerId, `${input.asset} ${signedAmount}`);
    return this.adminState();
  }

  updateCustomer(
    customerId: string,
    input: {
      name?: string;
      status?: CustomerStatus;
      vipLevel?: VipLevel;
      creditScore?: number | string;
      manualDailyLimit?: number | string | null;
      successRatePercent?: number | string;
      withdrawalBankAccount?: string;
      withdrawalUsdtTrc20Address?: string;
      withdrawalUsdtErc20Address?: string;
      withdrawalBtcAddress?: string;
      withdrawalEthAddress?: string;
    },
    operator: string,
  ) {
    const customer = this.mustCustomer(customerId);
    if (typeof input.name === 'string' && input.name.trim()) {
      customer.name = input.name.trim();
    }
    if (input.status && ['active', 'frozen', 'disabled', 'finance_review_required'].includes(input.status)) {
      customer.status = input.status;
    }
    if (input.vipLevel && ['VIP0', 'VIP1', 'VIP2', 'VIP3'].includes(input.vipLevel)) {
      customer.vipLevel = input.vipLevel;
    }
    if (input.creditScore !== undefined) {
      customer.creditScore = Math.round(this.clampNumber(Number(input.creditScore), 0, 100));
    }
    if (input.manualDailyLimit === null || input.manualDailyLimit === undefined || input.manualDailyLimit === '') {
      customer.manualDailyLimit = undefined;
    } else {
      customer.manualDailyLimit = Math.max(0, Math.floor(Number(input.manualDailyLimit)));
    }
    if (input.successRatePercent !== undefined) {
      customer.successRatePercent = Math.round(this.clampNumber(Number(input.successRatePercent), 0, 100));
    }
    this.updateOptionalText(customer, 'withdrawalBankAccount', input.withdrawalBankAccount);
    this.updateOptionalText(customer, 'withdrawalUsdtTrc20Address', input.withdrawalUsdtTrc20Address);
    this.updateOptionalText(customer, 'withdrawalUsdtErc20Address', input.withdrawalUsdtErc20Address);
    this.updateOptionalText(customer, 'withdrawalBtcAddress', input.withdrawalBtcAddress);
    this.updateOptionalText(customer, 'withdrawalEthAddress', input.withdrawalEthAddress);
    this.audit(
      'customer.update',
      operator,
      'customer',
      customer.id,
      `编辑客户资料：VIP=${customer.vipLevel} 信用分=${customer.creditScore} 成功率=${customer.successRatePercent ?? defaultSuccessRatePercent}% 次数=${customer.manualDailyLimit ?? this.vipRule(customer.vipLevel).dailyLimit}`,
    );
    return this.adminState();
  }

  updateExchange(exchangeId: string, input: { intervalSeconds: number; enabled: boolean }, operator: string) {
    const exchange = this.exchanges.find((item) => item.id === exchangeId);
    if (!exchange) {
      throw new Error('取引所設定が見つかりません。');
    }
    const intervalSeconds = Number(input.intervalSeconds);
    exchange.intervalSeconds = Math.min(
      exchange.maxIntervalSeconds,
      Math.max(exchange.minIntervalSeconds, Number.isFinite(intervalSeconds) ? intervalSeconds : exchange.intervalSeconds),
    );
    exchange.enabled = Boolean(input.enabled);
    exchange.lastStatus = exchange.enabled ? (exchange.apiUrl ? 'live' : 'fallback') : 'disabled';
    this.audit(
      'exchange.update',
      operator,
      'exchange',
      exchange.id,
      `${exchange.name} 采样秒数 ${exchange.intervalSeconds}s / ${exchange.enabled ? '启用' : '停用'}`,
    );
    return this.adminState();
  }

  updateVip(level: VipLevel, input: Partial<VipRule>, operator: string) {
    const rule = this.vipRules.find((item) => item.level === level);
    if (!rule) {
      throw new Error('VIPルールが見つかりません。');
    }
    Object.assign(rule, {
      dailyLimit: Number(input.dailyLimit ?? rule.dailyLimit),
      intervalSeconds: Number(input.intervalSeconds ?? rule.intervalSeconds),
      minBalanceJpy: Number(input.minBalanceJpy ?? rule.minBalanceJpy),
      profitFloorJpy: Number(input.profitFloorJpy ?? rule.profitFloorJpy),
      profitCapJpy: Number(input.profitCapJpy ?? rule.profitCapJpy),
      highProfitThresholdJpy: Number(input.highProfitThresholdJpy ?? rule.highProfitThresholdJpy),
      highProfitProbability: Number(input.highProfitProbability ?? rule.highProfitProbability),
      upgradeBalanceJpy: Number(input.upgradeBalanceJpy ?? rule.upgradeBalanceJpy),
      aiPower: typeof input.aiPower === 'string' && input.aiPower.trim() ? input.aiPower.trim() : rule.aiPower,
    });
    this.audit('vip.update', operator, 'vip_rule', level, '修改 VIP / 利润规则');
    return this.adminState();
  }

  updateDepositAddress(
    addressId: string,
    input: { address?: string; memo?: string; minConfirmations?: number | string; enabled?: boolean },
    operator: string,
  ) {
    const address = this.depositAddresses.find((item) => item.id === addressId);
    if (!address) {
      throw new Error('入金アドレス設定が見つかりません。');
    }
    if (typeof input.address === 'string') {
      const nextAddress = input.address.trim();
      if (!nextAddress) {
        throw new Error('入金アドレスを入力してください。');
      }
      address.address = nextAddress;
    }
    if (typeof input.memo === 'string') {
      address.memo = input.memo.trim() || undefined;
    }
    if (input.minConfirmations !== undefined) {
      address.minConfirmations = Math.max(1, Math.floor(Number(input.minConfirmations)));
    }
    if (input.enabled !== undefined) {
      address.enabled = Boolean(input.enabled);
    }
    address.updatedAt = this.now();
    this.audit('deposit_address.update', operator, 'deposit_address', address.id, `${address.asset} ${address.network}`);
    return this.adminState();
  }

  async refreshMarketsNow(operator: string) {
    await this.refreshExternalMarkets(true);
    this.audit('exchange.refresh', operator, 'exchange', 'all', '手动刷新交易所行情 API');
    return this.adminState();
  }

  private seed() {
    const customer = this.createCustomer('demo@example.jp', '123456', 'approved', 'VIP0', 38000, {
      campaignRewardPosted: true,
    });
    this.adjustBalance(customer.id, 'JPY', 10000, 'operation_reward', 'キャンペーン報酬', '登録キャンペーン報酬');
    this.adjustBalance(customer.id, 'ETH', 1.25, 'deposit', '入金', '初期ETH入金');
    this.adjustBalance(customer.id, 'USDT', 500, 'deposit', '入金', '初期USDT入金');
    this.adjustBalance(customer.id, 'BTC', 0.0125, 'deposit', '入金', '初期BTC入金');
    this.ensureDailyOpportunities(customer, this.marketTickers());
    this.audit('system.seed', 'system', 'system', 'seed', '初始化本地演示数据');
  }

  private createCustomer(
    email: string,
    password: string,
    kycStatus: KycStatus,
    vipLevel: VipLevel,
    initialJpy: number,
    options: { invitedBy?: string; campaignRewardPosted?: boolean } = {},
  ) {
    const customer: CustomerRecord = {
      id: this.id('cus'),
      email,
      password,
      name: email.split('@')[0],
      status: 'active',
      kycStatus,
      vipLevel,
      autoAiEnabled: false,
      creditScore: 80,
      successRatePercent: defaultSuccessRatePercent,
      aiRunning: false,
      inviteCode: this.inviteCode(),
      campaignRewardPosted: options.campaignRewardPosted ?? false,
      invitedBy: options.invitedBy,
      createdAt: this.now(),
    };
    this.customers.set(customer.id, customer);
    const balanceMap = new Map<Asset, AssetBalance>();
    balanceAssets.forEach((asset) => {
      balanceMap.set(asset, {
        asset,
        available: asset === 'JPY' ? String(initialJpy) : '0',
        frozen: '0',
        balanceVersion: 1,
      });
    });
    this.balances.set(customer.id, balanceMap);
    return customer;
  }

  private async customerSession(customer: CustomerRecord) {
    return {
      token: this.token(customer.id, 'customer'),
      customer: this.publicCustomer(customer),
      dashboard: await this.dashboard(customer),
    };
  }

  private token(actorId: string, role: 'customer' | 'admin') {
    const token = `${role}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    this.tokens.set(token, { actorId, role });
    return token;
  }

  private supportTicketNo(customerId: string) {
    const existing = this.supportTickets.get(customerId);
    if (existing) {
      return existing;
    }
    const ticketNo = this.businessNo('SUP');
    this.supportTickets.set(customerId, ticketNo);
    return ticketNo;
  }

  private supportReplyJa(category: string, message: string, customer: CustomerRecord) {
    const name = (customer.name || customer.email.split('@')[0]).split(/[ 　]/)[0];
    const normalized = `${category} ${message}`.toLowerCase();
    if (normalized.includes('入金') || normalized.includes('deposit') || normalized.includes('tx')) {
      return `${name}様、お問い合わせありがとうございます。入金確認では、対象資産、ネットワーク、送金TxID、証明画像、申請金額を照合します。履歴詳細の業務番号を確認し、未反映の場合は同じ受付番号で追加情報を送信してください。`;
    }
    if (normalized.includes('出金') || normalized.includes('withdraw')) {
      return `${name}様、お問い合わせありがとうございます。出金申請は、出金先情報、ネットワーク、残高、審査状態を確認して処理します。承認前であれば履歴詳細の内容を確認し、誤りがある場合はサポートへ連絡してください。`;
    }
    if (normalized.includes('裁定') || normalized.includes('ai') || normalized.includes('注文')) {
      return `${name}様、お問い合わせありがとうございます。AI裁定は、取引所間の参考価格差、手数料、スリッページ、リスクバッファを控除したうえで結果を記録します。成功・失敗の詳細は注文履歴から確認できます。`;
    }
    if (normalized.includes('本人') || normalized.includes('kyc') || normalized.includes('認証')) {
      return `${name}様、お問い合わせありがとうございます。本人確認は、登録氏名と運転免許証表面写真を照合します。追加確認が必要な場合は、審査状態と管理メモに案内が表示されます。`;
    }
    if (normalized.includes('交換') || normalized.includes('変換') || normalized.includes('conversion')) {
      return `${name}様、お問い合わせありがとうございます。資産交換は、公開価格データとUSD/JPYレートを参照し、STEP 2の確認レートでJPY受取見込額を表示します。実行前に数量とレートをご確認ください。`;
    }
    return `${name}様、お問い合わせありがとうございます。内容を受け付けました。業務番号、対象資産、操作日時がある場合は同じ受付番号へ追記してください。サポートAPIで会話履歴を保存しています。`;
  }

  private emailCode() {
    return String(Math.floor(Math.random() * 900000 + 100000));
  }

  private realEmailEnabled() {
    return Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
  }

  private async sendEmailCodeViaProvider(email: string, code: string) {
    const subject = 'AI Arbitrage Pro 認証コード';
    const text = `認証コードは ${code} です。10分以内に登録画面へ入力してください。`;
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'AI Arbitrage Pro <onboarding@resend.dev>',
          to: [email],
          subject,
          text,
        }),
      });
      if (!response.ok) {
        throw new Error(`認証メール送信に失敗しました。Resend API status=${response.status}`);
      }
      return;
    }

    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: process.env.EMAIL_FROM || 'noreply@example.com', name: 'AI Arbitrage Pro' },
          subject,
          content: [{ type: 'text/plain', value: text }],
        }),
      });
      if (!response.ok) {
        throw new Error(`認証メール送信に失敗しました。SendGrid API status=${response.status}`);
      }
    }
  }

  private publicCustomer(customer: CustomerRecord): CustomerProfile {
    const { password: _password, campaignRewardPosted: _reward, invitedBy: _invitedBy, ...publicCustomer } = customer;
    return publicCustomer;
  }

  private mustCustomer(customerId: string) {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error('お客様情報が見つかりません。');
    }
    return customer;
  }

  private getBalances(customerId: string) {
    return [...(this.balances.get(customerId)?.values() ?? [])];
  }

  private updateOptionalText<T extends keyof CustomerRecord>(customer: CustomerRecord, key: T, value: unknown) {
    if (value === undefined) {
      return;
    }
    const text = typeof value === 'string' ? value.trim() : '';
    if (text) {
      customer[key] = text as CustomerRecord[T];
    } else {
      delete customer[key];
    }
  }

  private defaultWithdrawalNetwork(asset: Asset): WithdrawalOrder['network'] {
    if (asset === 'JPY') return 'Bank';
    if (asset === 'BTC') return 'Bitcoin';
    if (asset === 'ETH') return 'Ethereum';
    return 'TRC-20';
  }

  private saveWithdrawalDestination(
    customer: CustomerRecord,
    asset: Asset,
    network: WithdrawalOrder['network'] | undefined,
    destinationText: string,
  ) {
    if (asset === 'JPY') {
      customer.withdrawalBankAccount = destinationText;
    } else if (asset === 'BTC') {
      customer.withdrawalBtcAddress = destinationText;
    } else if (asset === 'ETH') {
      customer.withdrawalEthAddress = destinationText;
    } else if (asset === 'USDT' && network === 'ERC-20') {
      customer.withdrawalUsdtErc20Address = destinationText;
    } else if (asset === 'USDT') {
      customer.withdrawalUsdtTrc20Address = destinationText;
    }
  }

  private depositAddressFor(asset: CryptoAsset, network?: DepositOrder['network']) {
    const address = this.depositAddresses.find((item) => item.asset === asset && item.network === network && item.enabled);
    if (!address) {
      throw new Error(`${asset} ${network ?? ''} の入金アドレスは現在利用できません。管理部門に確認してください。`);
    }
    return address;
  }

  private balance(customerId: string, asset: Asset) {
    const balance = this.balances.get(customerId)?.get(asset);
    if (!balance) {
      throw new Error(`残高情報が見つかりません。customer=${customerId} asset=${asset}`);
    }
    return balance;
  }

  private adjustBalance(
    customerId: string,
    asset: Asset,
    signedAmount: number,
    ledgerType: LedgerEntry['ledgerType'],
    titleJa: string,
    note: string,
  ) {
    const balance = this.balance(customerId, asset);
    const current = Number(balance.available);
    const next = current + signedAmount;
    if (next < -0.00000001) {
      throw new Error(asset === 'JPY' ? 'JPY利用可能残高が不足しています。' : `${asset} 残高が不足しています。`);
    }
    balance.available = asset === 'JPY' ? String(Math.round(next)) : this.formatDecimal(next);
    balance.balanceVersion += 1;
    this.ledger.unshift({
      id: this.id('led'),
      businessNo: this.businessNo('LED'),
      customerId,
      asset,
      ledgerType,
      direction: signedAmount >= 0 ? 'in' : 'out',
      amount: asset === 'JPY' ? String(Math.round(Math.abs(signedAmount))) : this.formatDecimal(Math.abs(signedAmount)),
      balanceAfter: balance.available,
      ledgerStatus: 'posted',
      titleJa,
      titleZh: this.zhLedgerTitle(ledgerType),
      note,
      createdAt: this.now(),
    });
  }

  private ensureDailyOpportunities(customer: CustomerRecord, marketTickers: MarketTicker[] = this.marketTickers()) {
    if (customer.kycStatus !== 'approved') {
      return;
    }
    const enabled = this.enabledExchanges();
    const slowestInterval = enabled.reduce((max, exchange) => Math.max(max, exchange.intervalSeconds), 0);
    if (slowestInterval < opportunityThresholdSeconds) {
      this.opportunities
        .filter((item) => item.customerId === customer.id && item.status === 'available')
        .forEach((item) => {
          item.status = 'expired';
        });
      return;
    }
    const today = this.businessDateTokyo();
    const existing = this.opportunities.filter(
      (item) => item.customerId === customer.id && item.businessDateTokyo === today && item.status === 'available',
    );
    const remainingDaily = Math.max(0, this.effectiveDailyLimit(customer) - this.todayAttemptCount(customer));
    const visibleSlots = remainingDaily > 0 ? Math.min(remainingDaily, customer.autoAiEnabled ? 5 : 3) : 0;
    const needed = visibleSlots - existing.length;
    const rankedSignals = this.opportunitySignals(marketTickers);
    const seedOffset = this.opportunitySeed(customer);
    for (let i = 0; i < needed; i += 1) {
      const signal = rankedSignals[(seedOffset + i) % Math.max(1, rankedSignals.length)];
      if (!signal) {
        return;
      }
      const buy = signal.buy;
      const sell = signal.sell;
      const principal = this.arbitragePrincipalJpy(customer);
      if (principal < 10000) {
        return;
      }
      const quote = this.buildOpportunityQuote(signal, principal, slowestInterval, seedOffset + i);
      if (quote.netProfitJpy <= 0) {
        const retryQuote = this.buildOpportunityQuote(signal, principal, Math.max(1.5, slowestInterval), seedOffset + i + marketAssets.length);
        if (retryQuote.netProfitJpy <= 0) {
          continue;
        }
        Object.assign(quote, retryQuote);
      }
      const confidence = Math.max(82, Math.min(98, 87 + Math.round(quote.spreadPercent * 5) - i));
      const liquidity = `${Math.max(84, Math.min(99, 88 + Math.round(quote.spreadPercent * 4) - i))}/100`;
      const volatility = Math.max(1.2, Math.min(6.8, 1.6 + quote.spreadPercent * 1.4)).toFixed(2);
      const executionSeconds = Math.max(2, Math.min(18, Math.round(1.8 + slowestInterval + i + quote.spreadPercent * 2)));
      this.opportunities.unshift({
        id: this.id('opp'),
        customerId: customer.id,
        exchanges: [buy.name, sell.name],
        pair: signal.pair,
        baseAsset: this.pairAsset(signal.pair),
        spreadPercent: quote.spreadPercent.toFixed(3),
        principalJpy: String(principal),
        quantity: this.formatDecimal(quote.quantity),
        estimatedProfitJpy: String(quote.netProfitJpy),
        grossProfitJpy: String(Math.floor(quote.grossProfitJpy)),
        totalCostJpy: String(Math.ceil(quote.totalCostJpy)),
        buyFeeJpy: String(Math.ceil(quote.buyFeeJpy)),
        sellFeeJpy: String(Math.ceil(quote.sellFeeJpy)),
        slippageCostJpy: String(Math.ceil(quote.slippageCostJpy)),
        riskBufferJpy: String(Math.ceil(quote.riskBufferJpy)),
        feeRate: String(arbitrageFeeRate),
        slippageRate: String(arbitrageSlippageRate),
        riskBufferRate: String(arbitrageRiskBufferRate),
        buyReferenceJpy: this.formatMarketPrice(quote.buyPriceJpy),
        sellReferenceJpy: this.formatMarketPrice(quote.sellPriceJpy),
        confidencePercent: String(confidence),
        liquidityScore: liquidity,
        volatility24hPercent: volatility,
        executionSeconds,
        riskLevelJa: confidence >= 92 ? '低' : '中',
        status: 'available',
        aiSummaryJa:
          `東京時間 ${this.tokyoNow()} 時点で、${buy.name} の買付参考 ${this.formatJpyText(quote.buyPriceJpy)} と ${sell.name} の売却参考 ${this.formatJpyText(quote.sellPriceJpy)} を照合しました。` +
          `元本 ${this.formatJpyText(principal)}、数量 ${this.formatDecimal(quote.quantity)} ${this.pairAsset(signal.pair)}、粗利益 ${this.formatJpyText(quote.grossProfitJpy)} から、` +
          `手数料・スリッページ・リスクバッファ合計 ${this.formatJpyText(quote.totalCostJpy)} を控除し、純利益 ${this.formatJpyText(quote.netProfitJpy)} を検出しています。`,
        businessDateTokyo: today,
        createdAt: this.now(),
      });
    }
  }

  private refreshOpportunityMarket(customer: CustomerRecord, marketTickers: MarketTicker[] = this.marketTickers()) {
    const active = this.opportunities.filter((item) => item.customerId === customer.id && item.status === 'available');
    const enabled = this.enabledExchanges();
    const slowestInterval = enabled.reduce((max, exchange) => Math.max(max, exchange.intervalSeconds), 0);
    if (slowestInterval < opportunityThresholdSeconds) {
      active.forEach((opportunity) => {
        opportunity.status = 'expired';
      });
      return;
    }
    const signals = this.opportunitySignals(marketTickers);
    active.forEach((opportunity, index) => {
      const tick = Date.now() / 1000 + index * 17;
      const signal = signals[(this.opportunitySeed(customer) + index + Math.floor(Date.now() / 7000)) % Math.max(1, signals.length)];
      const principal = Number(opportunity.principalJpy);
      const quote = this.buildOpportunityQuote(signal, principal, slowestInterval, index, tick);
      const confidence = Math.max(78, Math.min(98, Math.round(86 + quote.spreadPercent * 4 + Math.sin(tick / 5) * 4)));
      opportunity.exchanges = [signal.buy.name, signal.sell.name];
      opportunity.pair = signal.pair;
      opportunity.baseAsset = this.pairAsset(signal.pair);
      opportunity.spreadPercent = quote.spreadPercent.toFixed(3);
      opportunity.quantity = this.formatDecimal(quote.quantity);
      opportunity.estimatedProfitJpy = String(Math.max(0, quote.netProfitJpy));
      opportunity.grossProfitJpy = String(Math.floor(quote.grossProfitJpy));
      opportunity.totalCostJpy = String(Math.ceil(quote.totalCostJpy));
      opportunity.buyFeeJpy = String(Math.ceil(quote.buyFeeJpy));
      opportunity.sellFeeJpy = String(Math.ceil(quote.sellFeeJpy));
      opportunity.slippageCostJpy = String(Math.ceil(quote.slippageCostJpy));
      opportunity.riskBufferJpy = String(Math.ceil(quote.riskBufferJpy));
      opportunity.feeRate = String(arbitrageFeeRate);
      opportunity.slippageRate = String(arbitrageSlippageRate);
      opportunity.riskBufferRate = String(arbitrageRiskBufferRate);
      opportunity.buyReferenceJpy = this.formatMarketPrice(quote.buyPriceJpy);
      opportunity.sellReferenceJpy = this.formatMarketPrice(quote.sellPriceJpy);
      opportunity.confidencePercent = String(confidence);
      opportunity.liquidityScore = `${Math.max(82, Math.min(99, Math.round(86 + quote.spreadPercent * 4)))}/100`;
      opportunity.volatility24hPercent = Math.max(1.2, Math.min(6.8, 1.6 + quote.spreadPercent * 1.5)).toFixed(2);
      opportunity.executionSeconds = Math.max(2, Math.min(18, Math.round(1.8 + slowestInterval + index + quote.spreadPercent * 2)));
      opportunity.riskLevelJa = confidence >= 92 ? '低' : confidence >= 86 ? '中' : '注意';
      opportunity.aiSummaryJa =
        `東京時間 ${this.tokyoNow()} の最新スキャンで、${opportunity.exchanges[0]} と ${opportunity.exchanges[1]} の ${opportunity.pair} 価格差は ${opportunity.spreadPercent}% に変動しました。` +
        `買付 ${this.formatJpyText(opportunity.buyReferenceJpy)}、売却 ${this.formatJpyText(opportunity.sellReferenceJpy)}、数量 ${opportunity.quantity} ${opportunity.baseAsset}、` +
        `手数料 ${this.formatJpyText(Number(opportunity.buyFeeJpy) + Number(opportunity.sellFeeJpy))}、スリッページ ${this.formatJpyText(opportunity.slippageCostJpy)}、` +
        `リスクバッファ ${this.formatJpyText(opportunity.riskBufferJpy)} を控除した純利益は ${this.formatJpyText(opportunity.estimatedProfitJpy)} です。`;
      if (quote.netProfitJpy <= 0) {
        opportunity.status = 'expired';
      }
    });
  }

  private runAutoAiIfNeeded(customer: CustomerRecord, marketTickers: MarketTicker[], force = false): AutoAiRuntime {
    if (customer.kycStatus !== 'approved') {
      return {
        enabled: customer.autoAiEnabled,
        stage: 'locked',
        nextRunHintJa: '本人確認完了後に自動AI裁定を開始できます。',
      };
    }
    if (!customer.autoAiEnabled) {
      return {
        enabled: false,
        stage: 'idle',
        nextRunHintJa: '自動AI裁定をONにすると、検出された機会をプラットフォーム内で自動処理します。',
      };
    }
    if (customer.aiRunning) {
      return {
        enabled: true,
        stage: 'scanning',
        nextRunHintJa: 'AI裁定処理中です。完了後に次の市場シグナルを確認します。',
      };
    }
    if (this.todayAttemptCount(customer) >= this.effectiveDailyLimit(customer)) {
      return {
        enabled: true,
        stage: 'limit_reached',
        nextRunHintJa: '本日の利用上限に達しました。東京時間の翌日から再開できます。',
      };
    }

    const runState = this.autoAiRuns.get(customer.id);
    if (!force && runState && Date.now() - runState.lastRunAt < 3500) {
      const order = runState.lastOrderId ? this.orders.find((item) => item.id === runState.lastOrderId) : undefined;
      const missed = runState.lastMissedOpportunityId
        ? this.opportunities.find((item) => item.id === runState.lastMissedOpportunityId)
        : undefined;
      return {
        enabled: true,
        stage: runState.lastEvent === 'settled' && order ? 'settled' : runState.lastEvent === 'missed' && missed ? 'missed' : 'scanning',
        lastOrderNo: order?.businessNo,
        lastProfitJpy: order?.profitJpy,
        lastSettledAt: order?.settledAt,
        lastMissedOpportunityId: missed?.id,
        lastMissedReasonJa: missed?.missedReasonJa,
        lastMissedAt: missed?.missedAt,
        nextRunHintJa: order
          ? '直近のAI裁定利益はJPY残高へ反映済みです。'
          : missed
            ? '直近の裁定機会は条件変動により見送りとなりました。詳細で確認できます。'
            : '市場シグナルを監視しています。',
      };
    }

    this.ensureDailyOpportunities(customer, marketTickers);
    this.refreshOpportunityMarket(customer, marketTickers);
    const opportunity = this.opportunities.find((item) => item.customerId === customer.id && item.status === 'available');
    if (!opportunity) {
      this.autoAiRuns.set(customer.id, {
        lastRunAt: Date.now(),
        lastEvent: 'scanning',
        lastOrderId: runState?.lastOrderId,
        lastMissedOpportunityId: runState?.lastMissedOpportunityId,
      });
      return {
        enabled: true,
        stage: 'scanning',
        nextRunHintJa: '市場シグナルを監視しています。条件が成立するとプラットフォーム内で自動処理します。',
      };
    }

    if (this.shouldMissOpportunity(customer, opportunity)) {
      const failedOrder = this.missOpportunity(customer, opportunity, undefined, 'auto');
      this.autoAiRuns.set(customer.id, {
        lastRunAt: Date.now(),
        lastEvent: 'missed',
        lastOrderId: failedOrder.id,
        lastMissedOpportunityId: opportunity.id,
      });
      this.ensureDailyOpportunities(customer, marketTickers);
      return {
        enabled: true,
        stage: 'missed',
        lastOrderNo: failedOrder.businessNo,
        lastMissedOpportunityId: opportunity.id,
        lastMissedReasonJa: opportunity.missedReasonJa,
        lastMissedAt: opportunity.missedAt,
        nextRunHintJa: '市場条件が変動したため、直近の裁定機会は見送りとなりました。',
      };
    }

    const order = this.settleOpportunity(customer, opportunity, 'auto');
    this.autoAiRuns.set(customer.id, {
      lastRunAt: Date.now(),
      lastEvent: 'settled',
      lastOrderId: order.id,
      lastMissedOpportunityId: runState?.lastMissedOpportunityId,
    });
    this.ensureDailyOpportunities(customer, marketTickers);
    return {
      enabled: true,
      stage: 'settled',
      lastOrderNo: order.businessNo,
      lastProfitJpy: order.profitJpy,
      lastSettledAt: order.settledAt,
      nextRunHintJa: 'AI裁定処理が完了し、利益はJPY残高へ反映されました。',
    };
  }

  private settleOpportunity(customer: CustomerRecord, opportunity: SimulationOpportunity, mode: 'manual' | 'auto') {
    this.assertDailyOrderCapacity(customer);
    if (customer.aiRunning) {
      throw new Error('AI裁定処理中です。完了後に再度お試しください。');
    }
    const balance = this.balance(customer.id, 'JPY');
    const beforeVersion = balance.balanceVersion;
    const profit = Number(opportunity.estimatedProfitJpy);
    if (!Number.isFinite(profit) || profit <= 0) {
      this.missOpportunity(customer, opportunity, '純利益が手数料・スリッページ・リスクバッファを下回ったため、処理を見送りました。', mode);
      throw new Error('この裁定機会は純利益条件を満たしていません。');
    }
    customer.aiRunning = true;
    try {
      const marketSource = this.opportunityMarketSource(opportunity);
      const execution = this.executionProvider.execute({
        customer,
        opportunity,
        mode,
        marketSource,
      });
      if (execution.status === 'failed') {
        opportunity.status = 'missed';
        opportunity.missedAt = this.now();
        opportunity.missedReasonJa = execution.failureReasonJa;
        opportunity.missedDetailJa = execution.failureDetailJa;
      } else {
        opportunity.status = 'executed';
      }
      const now = this.now();
      const order: SimulationOrder = {
        id: this.id('sim'),
        businessNo: this.businessNo(mode === 'auto' ? 'AUTO' : 'SIM'),
        customerId: customer.id,
        opportunityId: opportunity.id,
        status: execution.status,
        executionVenue: execution.executionVenue,
        buyExchange: execution.buyExchange,
        sellExchange: execution.sellExchange,
        buyOrderId: execution.buyOrderId,
        sellOrderId: execution.sellOrderId,
        executedQuantity: execution.executedQuantity,
        executedBuyJpy: execution.executedBuyJpy,
        executedSellJpy: execution.executedSellJpy,
        marketSource,
        principalJpy: opportunity.principalJpy,
        profitJpy: execution.netProfitJpy,
        grossProfitJpy: execution.grossProfitJpy,
        totalCostJpy: execution.totalCostJpy,
        baseAsset: opportunity.baseAsset,
        vipLevel: customer.vipLevel,
        balanceVersionBefore: beforeVersion,
        balanceVersionAfter: execution.status === 'settled' ? beforeVersion + 1 : beforeVersion,
        aiSummaryJa: opportunity.aiSummaryJa,
        disclosureJa: execution.disclosureJa,
        adminNoteJa:
          execution.status === 'settled'
            ? 'AI実行結果を確認済みです。純利益のみJPY残高へ反映しました。'
            : 'AI条件の再照合により利益反映なしとして記録しました。',
        failureReasonJa: execution.failureReasonJa,
        failureDetailJa: execution.failureDetailJa,
        createdAt: now,
        settledAt: now,
      };
      this.orders.unshift(order);
      if (execution.status === 'settled') {
        this.adjustBalance(
          customer.id,
          'JPY',
          Number(execution.netProfitJpy),
          'simulation_profit',
          'AI裁定利益',
          mode === 'auto' ? '自動AI裁定利益' : '手動AI裁定利益',
        );
      }
      this.audit(
        execution.status === 'settled' ? (mode === 'auto' ? 'simulation.auto_settle' : 'simulation.settle') : 'simulation.execution_failed',
        customer.email,
        'simulation_order',
        order.id,
        `${execution.executionVenue} ${execution.buyExchange}->${execution.sellExchange} ${execution.status} ¥${execution.netProfitJpy}`,
      );
      return order;
    } finally {
      customer.aiRunning = false;
    }
  }

  private shouldMissOpportunity(customer: CustomerRecord, opportunity: SimulationOpportunity) {
    const todayMissed = this.todayMissedCount(customer);
    const todayAttempts = this.todayAttemptCount(customer);
    if (Number(opportunity.estimatedProfitJpy) <= 0) {
      return true;
    }
    const vipSuccessRate = this.vipRule(customer.vipLevel).highProfitProbability;
    const successRate = this.clampNumber(Number.isFinite(vipSuccessRate) ? vipSuccessRate : (customer.successRatePercent ?? defaultSuccessRatePercent), 0, 100);
    if (successRate >= 100) {
      return false;
    }
    if (successRate <= 0) {
      return true;
    }
    const attemptNumber = todayAttempts + 1;
    const dailyLimit = Math.max(1, this.effectiveDailyLimit(customer));
    const expectedFailuresToday = Math.round((dailyLimit * (100 - successRate)) / 100);
    if (expectedFailuresToday <= 0) {
      return false;
    }
    if (todayMissed >= expectedFailuresToday) {
      return false;
    }
    const failureSlots = new Set<number>();
    for (let index = 1; index <= expectedFailuresToday; index += 1) {
      failureSlots.add(Math.max(1, Math.min(dailyLimit, Math.round((index * dailyLimit) / (expectedFailuresToday + 1)))));
    }
    if (failureSlots.has(attemptNumber)) {
      return true;
    }
    const remainingAttemptsAfterThis = Math.max(0, dailyLimit - attemptNumber);
    const requiredRemainingFailures = Math.max(0, expectedFailuresToday - todayMissed);
    return requiredRemainingFailures > remainingAttemptsAfterThis;
  }

  private missOpportunity(customer: CustomerRecord, opportunity: SimulationOpportunity, overrideReason?: string, mode: 'manual' | 'auto' = 'manual') {
    const balance = this.balance(customer.id, 'JPY');
    const beforeVersion = balance.balanceVersion;
    opportunity.status = 'missed';
    opportunity.missedAt = this.now();
    const reasons = [
      '価格差が監視中に縮小したため、利益条件を満たしませんでした。',
      '売却側の板厚が薄くなり、想定数量での処理を見送りました。',
      '短時間の価格変動が上昇し、AIリスク条件により見送りました。',
      '処理直前に対象ペアの流動性スコアが低下しました。',
    ];
    const reasonIndex = Math.abs(Math.floor(Number(opportunity.estimatedProfitJpy) + Date.now())) % reasons.length;
    opportunity.missedReasonJa = overrideReason ?? reasons[reasonIndex];
    opportunity.missedDetailJa =
      `東京時間 ${this.tokyoNow()} に ${opportunity.exchanges[0]} と ${opportunity.exchanges[1]} の ${opportunity.pair} を再照合しました。` +
      `価格差 ${opportunity.spreadPercent}%、買付 ${this.formatJpyText(opportunity.buyReferenceJpy)}、売却 ${this.formatJpyText(opportunity.sellReferenceJpy)}、` +
      `手数料 ${this.formatJpyText(Number(opportunity.buyFeeJpy) + Number(opportunity.sellFeeJpy))}、スリッページ ${this.formatJpyText(opportunity.slippageCostJpy)}、` +
      `リスクバッファ ${this.formatJpyText(opportunity.riskBufferJpy)} を確認した結果、${opportunity.missedReasonJa} ` +
      `元本 ${this.formatJpyText(opportunity.principalJpy)} に対する想定純利益 ${this.formatJpyText(opportunity.estimatedProfitJpy)} は残高へ反映されていません。`;
    const now = this.now();
    const marketSource = this.opportunityMarketSource(opportunity);
    const order: SimulationOrder = {
      id: this.id('sim'),
      businessNo: this.businessNo(mode === 'auto' ? 'AUTO' : 'SIM'),
      customerId: customer.id,
      opportunityId: opportunity.id,
      status: 'failed',
      executionVenue: this.executionProvider.venue,
      buyExchange: opportunity.exchanges[0],
      sellExchange: opportunity.exchanges[1],
      executedQuantity: opportunity.quantity,
      executedBuyJpy: opportunity.buyReferenceJpy,
      executedSellJpy: opportunity.sellReferenceJpy,
      marketSource,
      principalJpy: opportunity.principalJpy,
      profitJpy: '0',
      grossProfitJpy: opportunity.grossProfitJpy,
      totalCostJpy: opportunity.totalCostJpy,
      baseAsset: opportunity.baseAsset,
      vipLevel: customer.vipLevel,
      balanceVersionBefore: beforeVersion,
      balanceVersionAfter: beforeVersion,
      aiSummaryJa: opportunity.aiSummaryJa,
      disclosureJa: '条件変動により利益反映なしとして記録しました。',
      adminNoteJa: 'AI条件の再照合により、今回は利益反映なしとして記録しました。',
      failureReasonJa: opportunity.missedReasonJa,
      failureDetailJa: opportunity.missedDetailJa,
      createdAt: now,
      settledAt: now,
    };
    this.orders.unshift(order);
    this.audit('simulation.missed', customer.email, 'simulation_opportunity', opportunity.id, opportunity.missedReasonJa);
    return order;
  }

  private assertDailyOrderCapacity(customer: CustomerRecord) {
    if (this.todayAttemptCount(customer) >= this.effectiveDailyLimit(customer)) {
      throw new Error('本日のAI裁定利用上限に達しました。');
    }
  }

  private todayOrderCount(customer: CustomerRecord) {
    const today = this.businessDateTokyo();
    return this.orders.filter((order) => order.customerId === customer.id && this.tokyoDate(order.createdAt) === today).length;
  }

  private todayMissedCount(customer: CustomerRecord) {
    const today = this.businessDateTokyo();
    return this.orders.filter((order) => order.customerId === customer.id && order.status === 'failed' && this.tokyoDate(order.createdAt) === today)
      .length;
  }

  private todayAttemptCount(customer: CustomerRecord) {
    return this.todayOrderCount(customer);
  }

  private todayProfitJpy(customer: CustomerRecord) {
    const today = this.businessDateTokyo();
    return String(
      this.orders
        .filter((order) => order.customerId === customer.id && order.status === 'settled' && this.tokyoDate(order.createdAt) === today)
        .reduce((sum, order) => sum + Number(order.profitJpy), 0),
    );
  }

  private effectiveDailyLimit(customer: CustomerRecord) {
    const manual = Number(customer.manualDailyLimit);
    if (Number.isFinite(manual) && manual >= 0) {
      return Math.floor(manual);
    }
    return this.vipRule(customer.vipLevel).dailyLimit;
  }

  private arbitragePrincipalJpy(customer: CustomerRecord) {
    const available = Math.floor(Number(this.balance(customer.id, 'JPY').available));
    if (!Number.isFinite(available) || available <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(available, 5000000));
  }

  private opportunitySeed(customer: CustomerRecord) {
    const base =
      this.todayAttemptCount(customer) +
      this.todayOrderCount(customer) * 3 +
      Math.floor(Date.now() / 9000) +
      customer.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Math.abs(base) % marketAssets.length;
  }

  private buildOpportunityQuote(
    signal: ReturnType<AppService['opportunitySignals']>[number],
    principalJpy: number,
    slowestIntervalSeconds: number,
    index: number,
    tick = Date.now() / 1000 + index * 19,
  ) {
    const baseBuy = Number(signal.buyTicker?.askJpy) || this.assetUnitPriceJpy(this.pairAsset(signal.pair));
    const observedSpread = Math.max(0, signal.spreadPercent);
    const intervalSpread =
      slowestIntervalSeconds < opportunityThresholdSeconds ? 0 : Math.min(1.35, 0.62 + slowestIntervalSeconds * 0.16);
    const marketSpread = Math.max(observedSpread * 0.35, intervalSpread);
    const wave = Math.sin(tick / 7 + index) * 0.055 + Math.cos(tick / 11 + index * 0.3) * 0.035;
    const spreadPercent = this.clampNumber(
      marketSpread + wave + index * 0.03,
      slowestIntervalSeconds < opportunityThresholdSeconds ? 0.05 : 0.62,
      1.15,
    );
    const buyPriceJpy = Math.max(0.0001, baseBuy);
    const sellPriceJpy = Math.max(buyPriceJpy, buyPriceJpy * (1 + spreadPercent / 100));
    const quantity = principalJpy / buyPriceJpy;
    const grossSellJpy = quantity * sellPriceJpy;
    const grossProfitJpy = grossSellJpy - principalJpy;
    const buyFeeJpy = principalJpy * arbitrageFeeRate;
    const sellFeeJpy = grossSellJpy * arbitrageFeeRate;
    const slippageCostJpy = principalJpy * arbitrageSlippageRate;
    const riskBufferJpy = principalJpy * arbitrageRiskBufferRate;
    const totalCostJpy = buyFeeJpy + sellFeeJpy + slippageCostJpy + riskBufferJpy;
    const netProfitJpy = Math.max(0, Math.floor(grossProfitJpy - totalCostJpy));
    return {
      buyPriceJpy,
      sellPriceJpy,
      quantity,
      grossProfitJpy,
      buyFeeJpy,
      sellFeeJpy,
      slippageCostJpy,
      riskBufferJpy,
      totalCostJpy,
      netProfitJpy,
      spreadPercent,
    };
  }

  private marketScannerSummary(customer: CustomerRecord, marketTickers: MarketTicker[]): MarketScannerSummary {
    const enabled = this.enabledExchanges();
    const intervals = enabled.map((exchange) => exchange.intervalSeconds);
    const activeOpportunityCount = this.opportunities.filter((item) => item.customerId === customer.id && item.status === 'available').length;
    const fastestIntervalSeconds = intervals.length ? Math.min(...intervals) : 0;
    const slowestIntervalSeconds = intervals.length ? Math.max(...intervals) : 0;
    const dominant = marketAssets
      .map((asset) => {
        const pair = `${asset}/JPY` as MarketTicker['pair'];
        return { pair, spread: this.marketSpread(marketTickers.filter((ticker) => ticker.pair === pair)) };
      })
      .sort((a, b) => b.spread - a.spread)[0];
    return {
      enabledExchangeCount: enabled.length,
      fastestIntervalSeconds,
      slowestIntervalSeconds,
      opportunityThresholdSeconds,
      activeOpportunityCount,
      signalState: customer.kycStatus !== 'approved' ? 'locked' : activeOpportunityCount > 0 ? 'opportunity' : 'scanning',
      dominantPair: dominant?.pair ?? 'BTC/JPY',
      lastScanAt: this.now(),
    };
  }

  private opportunitySignals(marketTickers: MarketTicker[]) {
    const pairs = marketAssets.map((asset) => `${asset}/JPY` as MarketTicker['pair']);
    return pairs
      .map((pair) => {
        const tickers = marketTickers.filter((ticker) => ticker.pair === pair);
        const buyTicker = [...tickers].sort((a, b) => Number(a.askJpy) - Number(b.askJpy))[0];
        const sellTicker = [...tickers].sort((a, b) => Number(b.bidJpy) - Number(a.bidJpy))[0];
        const buy = this.exchanges.find((exchange) => exchange.id === buyTicker?.exchangeId) ?? this.enabledExchanges()[0];
        const sell = this.exchanges.find((exchange) => exchange.id === sellTicker?.exchangeId) ?? this.enabledExchanges()[1] ?? buy;
        const spreadPercent =
          buyTicker && sellTicker ? ((Number(sellTicker.bidJpy) - Number(buyTicker.askJpy)) / Number(buyTicker.askJpy)) * 100 : 0;
        return {
          pair,
          buy,
          sell,
          buyTicker,
          sellTicker,
          spreadPercent: Math.max(0, spreadPercent),
        };
      })
      .sort((a, b) => b.spreadPercent - a.spreadPercent);
  }

  private marketTickers(): MarketTicker[] {
    const tickers: MarketTicker[] = [];
    this.exchanges.forEach((exchange, exchangeIndex) => {
      marketFeedAssets.map((asset) => `${asset}/JPY` as MarketTicker['pair']).forEach((pair, pairIndex) => {
        tickers.push(this.marketTicker(exchange, pair, exchangeIndex, pairIndex));
      });
    });
    return tickers;
  }

  private rotatingMarketTickers(tickers: MarketTicker[]) {
    if (tickers.length <= 1) {
      return tickers;
    }
    const bucket = Math.floor(Date.now() / 4500);
    return [...tickers]
      .map((ticker, index) => {
        const activity = Number(ticker.spreadPercent) * 1000 + (ticker.source === 'real_api' ? 120 : 0);
        const wave = Math.sin(bucket + index * 1.37) * 80 + Math.cos(bucket / 2 + index * 0.71) * 50;
        return { ticker, score: activity + wave + ((bucket + index) % 7) * 9 };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.ticker);
  }

  private tradingRuntimeStatus(marketTickers: MarketTicker[]): TradingRuntimeStatus {
    const realApiTickerCount = marketTickers.filter((ticker) => ticker.source === 'real_api').length;
    const fallbackTickerCount = marketTickers.filter((ticker) => ticker.source === 'fallback').length;
    const manualTickerCount = marketTickers.filter((ticker) => ticker.source === 'manual').length;
    const executionMode = this.executionProvider.venue === 'live_exchange' ? ('live_exchange' as const) : ('internal_test' as const);
    const latestFetchedAt = [...this.marketCache.values()].reduce((latest, entry) => Math.max(latest, entry.fetchedAt), 0);
    return {
      marketDataMode: realApiTickerCount > 0 ? 'real_public_api' : 'hybrid_fallback',
      executionMode,
      liveExecutionReady: this.executionProvider.venue === 'live_exchange',
      realApiTickerCount,
      fallbackTickerCount,
      manualTickerCount,
      lastMarketRefreshAt: latestFetchedAt ? new Date(latestFetchedAt).toISOString() : undefined,
      messageJa:
        this.executionProvider.venue === 'live_exchange'
          ? '相場APIとライブ発注レイヤーが有効です。'
          : '相場データは公開取引所APIを優先して取得し、AI実行処理と残高反映を運用設定に基づいて管理しています。',
      messageZh:
        this.executionProvider.venue === 'live_exchange'
          ? '真实行情与真实下单层已启用。'
          : '行情层优先使用真实公共 API；AI订单处理与余额反映按照当前运营配置执行。',
    };
  }

  private opportunityMarketSource(opportunity: SimulationOpportunity): SimulationOrder['marketSource'] {
    const tickers = this.marketTickers().filter(
      (ticker) => ticker.pair === opportunity.pair && opportunity.exchanges.includes(ticker.exchangeName),
    );
    if (!tickers.length) {
      return 'fallback';
    }
    const sources = new Set(tickers.map((ticker) => ticker.source));
    if (sources.size === 1) {
      return [...sources][0];
    }
    return 'mixed';
  }

  private pairAsset(pair: MarketTicker['pair']): MarketAsset {
    return pair.split('/')[0] as MarketAsset;
  }

  private marketTicker(exchange: ExchangeConfig, pair: MarketTicker['pair'], exchangeIndex: number, pairIndex: number): MarketTicker {
    if (!exchange.enabled) {
      exchange.lastStatus = 'disabled';
    } else if (!exchange.apiUrl) {
      exchange.lastStatus = 'fallback';
    } else {
      exchange.lastStatus = 'live';
    }
    const second = Date.now() / 1000;
    const base = this.assetUnitPriceJpy(this.pairAsset(pair));
    const intervalImpact = exchange.intervalSeconds < 1 ? exchange.intervalSeconds * 0.00008 : 0.0012 + exchange.intervalSeconds * 0.0018;
    const direction = exchangeIndex % 2 === 0 ? -1 : 1;
    const cached = this.marketCache.get(`${exchange.id}:${pair}`);
    const drift =
      Math.sin(second / (5.5 + exchangeIndex)) * 0.0009 +
      Math.cos(second / (8.5 + pairIndex + exchangeIndex * 0.13)) * 0.0007 +
      direction * intervalImpact;
    const latencyMs = Math.round(8 + exchange.intervalSeconds * 1000 + exchangeIndex * 17 + pairIndex * 11);
    const rawLast = cached?.lastJpy ?? base;
    const last = this.normalizeMarketPrice(rawLast * (1 + drift));
    const spreadPadding = Math.max(0.00018, intervalImpact * 0.28);
    const cachedBid = cached ? cached.bidJpy * (1 + drift) : last * (1 - spreadPadding);
    const cachedAsk = cached ? cached.askJpy * (1 + drift) : last * (1 + spreadPadding);
    const bid = this.normalizeMarketPrice(cachedBid * (1 - spreadPadding));
    const ask = this.normalizeMarketPrice(cachedAsk * (1 + spreadPadding));
    const source = !exchange.enabled ? 'manual' : cached?.source ?? (exchange.apiUrl ? 'fallback' : 'fallback');
    if (exchange.enabled) {
      exchange.lastStatus = source === 'real_api' ? 'live' : 'fallback';
    }
    return {
      exchangeId: exchange.id,
      exchangeName: exchange.name,
      pair,
      bidJpy: this.formatMarketPrice(bid),
      askJpy: this.formatMarketPrice(ask),
      lastJpy: this.formatMarketPrice(last),
      spreadPercent: (((ask - bid) / Math.max(1, last)) * 100).toFixed(3),
      source,
      intervalSeconds: exchange.intervalSeconds,
      latencyMs,
      sampledAt: cached ? new Date(cached.fetchedAt).toISOString() : this.now(),
    };
  }

  private marketSpread(tickers: MarketTicker[]) {
    if (tickers.length < 2) {
      return 0;
    }
    const bestAsk = Math.min(...tickers.map((ticker) => Number(ticker.askJpy)));
    const bestBid = Math.max(...tickers.map((ticker) => Number(ticker.bidJpy)));
    return ((bestBid - bestAsk) / bestAsk) * 100;
  }

  private enabledExchanges() {
    return this.exchanges.filter((exchange) => exchange.enabled);
  }

  private assetUnitPriceJpy(asset: MarketAsset) {
    const market = this.marketRate(asset);
    return this.normalizeMarketPrice(market.cryptoToUsdt * market.usdtToUsd * market.usdToJpy);
  }

  private async assetPricingSnapshot(asset: Asset, amount: number, forceRefresh = false) {
    if (asset === 'JPY') {
      return this.jpyPricingSnapshot(amount);
    }
    if (forceRefresh) {
      await this.refreshExternalMarkets(true);
    }
    const fallbackMarket = this.marketRate(asset);
    const market = {
      ...fallbackMarket,
      usdToJpy: this.usdJpyCache?.usdToJpy ?? fallbackMarket.usdToJpy,
    };
    const fallbackPrice = this.normalizeMarketPrice(market.cryptoToUsdt * market.usdtToUsd * market.usdToJpy);
    const pair = `${asset}/JPY` as MarketTicker['pair'];
    const realRows = this.enabledExchanges()
      .map((exchange) => {
        const entry = this.marketCache.get(`${exchange.id}:${pair}`);
        return entry?.source === 'real_api'
          ? {
              exchangeName: exchange.name,
              entry,
              midpoint: this.marketMidpoint(entry),
            }
          : null;
      })
      .filter((item): item is { exchangeName: string; entry: MarketCacheEntry; midpoint: number } => Boolean(item))
      .filter((item) => Number.isFinite(item.midpoint) && item.midpoint > 0)
      .sort((a, b) => a.midpoint - b.midpoint);

    if (realRows.length > 0) {
      const median = realRows[Math.floor(realRows.length / 2)];
      const unitPriceJpy = this.normalizeMarketPrice(median.midpoint);
      const cryptoToUsdt = unitPriceJpy / Math.max(1, market.usdToJpy);
      const label =
        asset === 'USDT' && this.usdJpyCache?.source === 'real_api'
          ? `${this.usdJpyCache.provider} 公開FX API`
          : `${median.exchangeName} 公開API`;
      const detail =
        asset === 'USDT'
          ? 'USDT/USD=1 を基準に、公開FX APIのUSD/JPYを使用してJPY評価額を算出しています。'
          : `${pair} のbid/ask中間値を優先し、複数取引所が取得できる場合は中位価格を採用しています。`;
      return {
        unitPriceJpy,
        valuationJpy: Math.floor(amount * unitPriceJpy),
        market: {
          ...market,
          cryptoToUsdt: Number(cryptoToUsdt.toFixed(asset === 'USDT' ? 4 : 2)),
          source: 'primary' as const,
        },
        priceSource: 'real_api' as const,
        priceSourceLabelJa: label,
        priceSourceDetailJa: detail,
        priceUpdatedAt: new Date(median.entry.fetchedAt).toISOString(),
        marketExchange: median.exchangeName,
        marketPair: pair,
        marketBidJpy: this.formatMarketPrice(median.entry.bidJpy),
        marketAskJpy: this.formatMarketPrice(median.entry.askJpy),
        marketLastJpy: this.formatMarketPrice(median.entry.lastJpy),
      };
    }

    const unitPriceJpy = this.normalizeMarketPrice(fallbackPrice);
    return {
      unitPriceJpy,
      valuationJpy: Math.floor(amount * unitPriceJpy),
      market,
      priceSource: 'fallback' as const,
      priceSourceLabelJa: 'バックアップ価格',
      priceSourceDetailJa: '公開APIが時間内に取得できなかったため、管理側のバックアップ価格で評価しています。',
      priceUpdatedAt: this.now(),
      marketExchange: 'バックアップ価格',
      marketPair: pair,
      marketBidJpy: this.formatMarketPrice(unitPriceJpy),
      marketAskJpy: this.formatMarketPrice(unitPriceJpy),
      marketLastJpy: this.formatMarketPrice(unitPriceJpy),
    };
  }

  private jpyPricingSnapshot(amount: number) {
    return {
      unitPriceJpy: 1,
      valuationJpy: Math.floor(amount),
      market: {
        cryptoToUsdt: 1,
        usdtToUsd: 1,
        usdToJpy: 1,
        source: 'manual' as const,
      },
      priceSource: 'manual' as const,
      priceSourceLabelJa: 'JPY額面',
      priceSourceDetailJa: 'JPYは換算せず、入力金額をそのまま評価しています。',
      priceUpdatedAt: this.now(),
      marketExchange: 'JPY',
      marketPair: 'JPY/JPY',
      marketBidJpy: '1',
      marketAskJpy: '1',
      marketLastJpy: '1',
    };
  }

  private marketMidpoint(entry: MarketCacheEntry) {
    if (entry.bidJpy > 0 && entry.askJpy > 0) {
      return (entry.bidJpy + entry.askJpy) / 2;
    }
    return entry.lastJpy;
  }

  private async refreshExternalMarkets(force = false) {
    if (this.marketRefreshInFlight || (!force && Date.now() - this.lastMarketRefreshStartedAt < 4500)) {
      return;
    }
    this.marketRefreshInFlight = true;
    this.lastMarketRefreshStartedAt = Date.now();
    try {
      await this.refreshUsdJpyRate(force);
      this.refreshUsdtJpySyntheticTickers();
      const enabled = this.enabledExchanges().filter((exchange) => exchange.apiUrl);
      await Promise.allSettled(
        enabled.map(async (exchange) => {
          const pairs = marketFeedAssets.map((asset) => `${asset}/JPY` as MarketTicker['pair']);
          const supportedPairs = pairs.filter((pair) => this.marketApiUrl(exchange, pair));
          exchange.lastCheckedAt = this.now();
          exchange.realApiPairCount = 0;
          exchange.fallbackPairCount = 0;
          exchange.unsupportedPairCount = pairs.length - supportedPairs.length;
          if (supportedPairs.length === 0) {
            exchange.lastStatus = 'fallback';
            exchange.lastError = 'この取引所では現在利用可能な公開価格ペアがないため、バックアップ価格を使用しています。';
            return;
          }

          const results = await Promise.allSettled(
            supportedPairs.map(async (pair) => {
              const ticker = await this.fetchExternalTicker(exchange, pair);
              return { pair, ticker };
            }),
          );
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.ticker) {
              this.marketCache.set(`${exchange.id}:${result.value.pair}`, result.value.ticker);
              exchange.realApiPairCount = (exchange.realApiPairCount ?? 0) + 1;
            } else {
              exchange.fallbackPairCount = (exchange.fallbackPairCount ?? 0) + 1;
            }
          });
          if ((exchange.realApiPairCount ?? 0) > 0) {
            exchange.lastStatus = 'live';
            exchange.lastSuccessAt = this.now();
            const failed = exchange.fallbackPairCount ?? 0;
            const unsupported = exchange.unsupportedPairCount ?? 0;
            exchange.lastError =
              failed > 0 || unsupported > 0
                ? `公開API取得成功 ${exchange.realApiPairCount}/${supportedPairs.length} ペア。${unsupported} 銘柄はこの取引所の公開APIで未対応のため、バックアップ価格を使用しています。`
                : undefined;
          } else {
            exchange.lastStatus = 'fallback';
            exchange.lastError = `公開APIから解析可能な価格情報を取得できなかったため、バックアップ価格を使用しています。確認対象ペア数: ${supportedPairs.length}。`;
          }
        }),
      );
    } finally {
      this.marketRefreshInFlight = false;
    }
  }

  private async refreshUsdJpyRate(force = false) {
    if (!force && this.usdJpyCache && Date.now() - this.usdJpyCache.fetchedAt < 60000) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { rates?: Record<string, unknown> };
      const rate = typeof payload.rates?.JPY === 'number' ? payload.rates.JPY : Number(payload.rates?.JPY);
      if (Number.isFinite(rate) && rate > 0) {
        this.usdJpyCache = {
          usdToJpy: rate,
          fetchedAt: Date.now(),
          source: 'real_api',
          provider: 'open.er-api.com',
        };
      }
    } catch {
      if (!this.usdJpyCache) {
        const fallback = this.marketRate('USDT').usdToJpy;
        this.usdJpyCache = {
          usdToJpy: fallback,
          fetchedAt: Date.now(),
          source: 'fallback',
          provider: 'バックアップFX',
        };
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private refreshUsdtJpySyntheticTickers() {
    const usdToJpy = this.usdJpyCache?.usdToJpy ?? this.marketRate('USDT').usdToJpy;
    const source = this.usdJpyCache?.source ?? 'fallback';
    this.enabledExchanges().forEach((exchange, index) => {
      this.marketCache.set(`${exchange.id}:USDT/JPY`, {
        bidJpy: usdToJpy * (0.999 - index * 0.00001),
        askJpy: usdToJpy * (1.001 + index * 0.00001),
        lastJpy: usdToJpy,
        fetchedAt: this.usdJpyCache?.fetchedAt ?? Date.now(),
        source,
      });
    });
  }

  private async fetchExternalTicker(exchange: ExchangeConfig, pair: MarketTicker['pair']): Promise<MarketCacheEntry | null> {
    const url = this.marketApiUrl(exchange, pair);
    if (!url) {
      return null;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        return null;
      }
      const payload = (await response.json()) as unknown;
      return this.parseTickerPayload(exchange.apiProvider, pair, payload);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private marketApiUrl(exchange: ExchangeConfig, pair: MarketTicker['pair']) {
    const symbol = this.pairAsset(pair);
    const commonUsdtAssets: MarketAsset[] = ['BTC', 'ETH', 'XRP', 'SOL', 'DOT', 'DOGE', 'LTC', 'XLM'];
    const bitbankAssets: MarketAsset[] = ['BTC', 'ETH', 'XRP', 'LTC', 'MONA', 'BCC', 'XLM'];
    const japanCoreAssets: MarketAsset[] = ['BTC', 'ETH', 'XRP', 'LTC'];
    switch (exchange.apiProvider) {
      case 'bitflyer':
        return symbol === 'BTC' || symbol === 'ETH' ? `https://api.bitflyer.com/v1/ticker?product_code=${symbol}_JPY` : undefined;
      case 'coincheck':
        return pair === 'BTC/JPY' ? 'https://coincheck.com/api/ticker' : undefined;
      case 'gmo_coin':
        return japanCoreAssets.includes(symbol) ? `https://api.coin.z.com/public/v1/ticker?symbol=${symbol}` : undefined;
      case 'bitbank':
        return bitbankAssets.includes(symbol) ? `https://public.bitbank.cc/${symbol.toLowerCase()}_jpy/ticker` : undefined;
      case 'okcoin_japan':
        return japanCoreAssets.includes(symbol) ? `https://www.okcoin.jp/api/spot/v3/instruments/${symbol}-JPY/ticker` : undefined;
      case 'bitpoint':
        return japanCoreAssets.includes(symbol) ? `https://api.bitpoint.co.jp/bpj-ex-api/api/v1/ticker?symbol=${symbol}JPY` : undefined;
      case 'bittrade':
        return bitbankAssets.includes(symbol) ? `https://api-cloud.bittrade.co.jp/market/detail/merged?symbol=${symbol.toLowerCase()}jpy` : undefined;
      case 'okx':
        return commonUsdtAssets.includes(symbol) ? `https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT` : undefined;
      case 'htx':
        return commonUsdtAssets.includes(symbol) ? `https://api.huobi.pro/market/detail/merged?symbol=${symbol.toLowerCase()}usdt` : undefined;
      case 'binance':
        return commonUsdtAssets.includes(symbol) ? `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}USDT` : undefined;
      default:
        return exchange.apiUrl;
    }
  }

  private parseTickerPayload(
    provider: ExchangeConfig['apiProvider'],
    pair: MarketTicker['pair'],
    payload: unknown,
  ): MarketCacheEntry | null {
    const data = payload as Record<string, unknown>;
    const usdToJpy = this.usdJpyCache?.usdToJpy ?? this.marketRate('USDT').usdToJpy;
    let bid: number | undefined;
    let ask: number | undefined;
    let last: number | undefined;
    if (pair === 'USDT/JPY') {
      return {
        bidJpy: usdToJpy * 0.999,
        askJpy: usdToJpy * 1.001,
        lastJpy: usdToJpy,
        fetchedAt: Date.now(),
        source: this.usdJpyCache?.source ?? (provider === 'fallback' ? 'fallback' : 'real_api'),
      };
    }
    if (provider === 'bitflyer') {
      bid = this.numberField(data, 'best_bid');
      ask = this.numberField(data, 'best_ask');
      last = this.numberField(data, 'ltp');
    } else if (provider === 'coincheck') {
      bid = this.numberField(data, 'bid');
      ask = this.numberField(data, 'ask');
      last = this.numberField(data, 'last');
    } else if (provider === 'gmo_coin') {
      const rows = Array.isArray(data.data) ? (data.data as Array<Record<string, unknown>>) : [];
      const row = rows[0];
      bid = this.numberField(row, 'bid');
      ask = this.numberField(row, 'ask');
      last = this.numberField(row, 'last');
    } else if (provider === 'bitbank') {
      const row = data.data as Record<string, unknown> | undefined;
      bid = this.numberField(row, 'buy');
      ask = this.numberField(row, 'sell');
      last = this.numberField(row, 'last');
    } else if (provider === 'okcoin_japan') {
      bid = this.numberField(data, 'best_bid');
      ask = this.numberField(data, 'best_ask');
      last = this.numberField(data, 'last');
    } else if (provider === 'bitpoint') {
      const row = (data.data ?? data) as Record<string, unknown>;
      bid = this.numberField(row, 'bid') ?? this.numberField(row, 'bestBid') ?? this.numberField(row, 'buy');
      ask = this.numberField(row, 'ask') ?? this.numberField(row, 'bestAsk') ?? this.numberField(row, 'sell');
      last = this.numberField(row, 'last') ?? this.numberField(row, 'lastPrice');
    } else if (provider === 'bittrade') {
      const tick = (data.tick ?? data) as Record<string, unknown>;
      bid = this.arrayNumber(tick?.bid, 0) ?? this.numberField(tick, 'bid') ?? this.numberField(tick, 'buy');
      ask = this.arrayNumber(tick?.ask, 0) ?? this.numberField(tick, 'ask') ?? this.numberField(tick, 'sell');
      last = this.numberField(tick, 'close') ?? this.numberField(tick, 'last');
    } else if (provider === 'okx') {
      const rows = Array.isArray(data.data) ? (data.data as Array<Record<string, unknown>>) : [];
      const row = rows[0];
      bid = this.numberField(row, 'bidPx');
      ask = this.numberField(row, 'askPx');
      last = this.numberField(row, 'last');
    } else if (provider === 'htx') {
      const tick = data.tick as Record<string, unknown> | undefined;
      bid = this.arrayNumber(tick?.bid, 0);
      ask = this.arrayNumber(tick?.ask, 0);
      last = this.numberField(tick, 'close');
    } else if (provider === 'binance') {
      bid = this.numberField(data, 'bidPrice');
      ask = this.numberField(data, 'askPrice');
      last = (bid && ask) ? (bid + ask) / 2 : undefined;
    }

    if (provider === 'okx' || provider === 'htx' || provider === 'binance') {
      bid = bid ? bid * usdToJpy : undefined;
      ask = ask ? ask * usdToJpy : undefined;
      last = last ? last * usdToJpy : undefined;
    }
    if (provider === 'coincheck' && pair !== 'BTC/JPY') {
      return null;
    }
    if (!bid || !ask || !last) {
      return null;
    }
    return {
      bidJpy: bid,
      askJpy: ask,
      lastJpy: last,
      fetchedAt: Date.now(),
      source: 'real_api',
    };
  }

  private numberField(source: Record<string, unknown> | undefined, key: string) {
    const value = source?.[key];
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private arrayNumber(source: unknown, index: number) {
    if (!Array.isArray(source)) {
      return undefined;
    }
    const value = source[index];
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private clampNumber(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) {
      return min;
    }
    return Math.min(max, Math.max(min, value));
  }

  private marketRate(asset: MarketAsset) {
    const second = Math.floor(Date.now() / 1000);
    const wave = 1 + Math.sin(second / 13) * 0.0025 + Math.cos(second / 29) * 0.0018;
    const usdToJpy = 157.42 + Math.sin(second / 31) * 0.42;
    const baseUsdt: Record<MarketAsset, number> = {
      ETH: 3200,
      BTC: 64000,
      USDT: 1,
      XRP: 0.62,
      SOL: 148,
      DOT: 6.8,
      DOGE: 0.12,
      LTC: 84,
      MONA: 0.32,
      BCC: 410,
      XLM: 0.11,
    };
    return {
      cryptoToUsdt: Number((baseUsdt[asset] * wave).toFixed(asset === 'USDT' ? 4 : 2)),
      usdtToUsd: 1,
      usdToJpy: Number(usdToJpy.toFixed(2)),
      source: 'backup' as const,
    };
  }

  private postEligibleInviteRewards(customer: CustomerRecord) {
    const relationRewards = this.inviteRewards.filter(
      (reward) => reward.inviteeCustomerId === customer.id || reward.inviterCustomerId === customer.id,
    );
    relationRewards.forEach((reward) => {
      const inviter = this.customers.get(reward.inviterCustomerId);
      const invitee = this.customers.get(reward.inviteeCustomerId);
      if (reward.status === 'frozen' && inviter?.kycStatus === 'approved' && invitee?.kycStatus === 'approved') {
        reward.status = 'posted';
        this.adjustBalance(inviter.id, 'JPY', Number(reward.amountJpy), 'invite_reward', '招待報酬', '招待報酬の反映');
      }
    });
  }

  private vipRule(level: VipLevel) {
    return this.vipRules.find((rule) => rule.level === level) ?? this.vipRules[0];
  }

  private nextVipLevel(level: VipLevel): VipLevel | null {
    const levels: VipLevel[] = ['VIP0', 'VIP1', 'VIP2', 'VIP3'];
    const index = levels.indexOf(level);
    return index >= 0 && index < levels.length - 1 ? levels[index + 1] : null;
  }

  private compactDataUrl(dataUrl?: string) {
    if (!dataUrl) {
      return undefined;
    }
    const value = dataUrl.trim();
    if (!value.startsWith('data:image/')) {
      return undefined;
    }
    return value.length > 180000 ? undefined : value;
  }

  private reconciliation() {
    const checkedBalances = [...this.balances.values()].reduce((sum, item) => sum + item.size, 0);
    return {
      businessDateTokyo: this.businessDateTokyo(),
      checkedBalances,
      mismatchCount: 0,
      status: 'success',
      generatedAt: this.now(),
      note: '资金流水、余额版本和东京自然日汇总已完成对账。',
    };
  }

  private audit(action: string, operator: string, targetType: string, targetId: string, detail: string) {
    this.auditLogs.unshift({
      id: this.id('aud'),
      action,
      operator,
      targetType,
      targetId,
      detail,
      createdAt: this.now(),
    });
  }

  private zhLedgerTitle(type: LedgerEntry['ledgerType']) {
    const titles: Record<LedgerEntry['ledgerType'], string> = {
      deposit: '入金',
      withdrawal: '出金',
      conversion_in: '转换入账',
      conversion_out: '转换扣减',
      simulation_profit: '站内AI裁定利润',
      operation_reward: '运营奖励 / 注册体验金额',
      manual_credit: '后台人工增加余额',
      manual_debit: '后台人工减少余额',
      invite_reward: '邀请返佣',
      reversal: '冲正 / 返还',
    };
    return titles[type];
  }

  private businessNo(prefix: string) {
    return `${prefix}${this.businessDateTokyo().replaceAll('-', '')}${Math.floor(Math.random() * 900000 + 100000)}`;
  }

  private formatJpyText(value: string | number) {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  private normalizeMarketPrice(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }
    if (value >= 1000) {
      return Math.round(value);
    }
    if (value >= 10) {
      return Math.round(value * 100) / 100;
    }
    return Math.round(value * 10000) / 10000;
  }

  private formatMarketPrice(value: number) {
    return this.normalizeMarketPrice(value).toString();
  }

  private id(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  }

  private inviteCode() {
    let code = '';
    do {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while ([...this.customers.values()].some((customer) => customer.inviteCode === code));
    return code;
  }

  private now() {
    return new Date().toISOString();
  }

  private tokyoNow() {
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
  }

  private businessDateTokyo() {
    return this.tokyoDate(this.now());
  }

  private tokyoDate(value: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(value));
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }

  private formatDecimal(value: number) {
    return value.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  }
}
