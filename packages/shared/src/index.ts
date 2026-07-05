export type Asset = 'JPY' | 'USDT' | 'BTC' | 'ETH';
export type CryptoAsset = Exclude<Asset, 'JPY'>;
export type MarketAsset = CryptoAsset | 'XRP' | 'SOL' | 'DOT' | 'DOGE' | 'LTC' | 'MONA' | 'BCC' | 'XLM';
export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'need_more_info';
export type VipLevel = 'VIP0' | 'VIP1' | 'VIP2' | 'VIP3';
export type CustomerStatus = 'active' | 'frozen' | 'disabled' | 'finance_review_required';

export type LedgerType =
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

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  requestId: string;
}

export interface AssetBalance {
  asset: Asset;
  available: string;
  frozen: string;
  balanceVersion: number;
}

export interface CustomerProfile {
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
  kycDocumentFrontStorageKey?: string;
  withdrawalBankAccount?: string;
  withdrawalUsdtTrc20Address?: string;
  withdrawalUsdtErc20Address?: string;
  withdrawalBtcAddress?: string;
  withdrawalEthAddress?: string;
  createdAt: string;
}

export interface LedgerEntry {
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

export interface DepositOrder {
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
  proofImageStorageKey?: string;
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

export interface DepositAddressConfig {
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

export interface WithdrawalOrder {
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

export interface ConversionQuote {
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

export interface SimulationOpportunity {
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

export interface SimulationOrder {
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

export interface VipRule {
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

export interface ExchangeConfig {
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

export interface MarketTicker {
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

export interface MarketScannerSummary {
  enabledExchangeCount: number;
  fastestIntervalSeconds: number;
  slowestIntervalSeconds: number;
  opportunityThresholdSeconds: number;
  activeOpportunityCount: number;
  signalState: 'locked' | 'scanning' | 'opportunity';
  dominantPair: `${MarketAsset}/JPY`;
  lastScanAt: string;
}

export interface AutoAiRuntime {
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

export interface TradingRuntimeStatus {
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

export interface SupportMessage {
  id: string;
  ticketNo: string;
  customerId: string;
  sender: 'customer' | 'support';
  category: string;
  message: string;
  createdAt: string;
}

export interface SupportConversation {
  ticketNo: string;
  status: 'open' | 'answered';
  messages: SupportMessage[];
  updatedAt?: string;
}

export interface SupportConfig {
  lineUrl: string;
  lineQrUrl: string;
  noteJa: string;
  updatedAt: string;
}

export interface DashboardData {
  customer: CustomerProfile;
  balances: AssetBalance[];
  deposits: DepositOrder[];
  withdrawals: WithdrawalOrder[];
  depositAddresses: DepositAddressConfig[];
  ledger: LedgerEntry[];
  opportunities: SimulationOpportunity[];
  missedOpportunities: SimulationOpportunity[];
  orders: SimulationOrder[];
  vipRules: VipRule[];
  marketTickers: MarketTicker[];
  marketScanner: MarketScannerSummary;
  autoAiRuntime: AutoAiRuntime;
  todayUsed: number;
  todayLimit: number;
  todayProfitJpy: string;
  tokyoNow: string;
  disclosureJa: string;
  tradingRuntime: TradingRuntimeStatus;
  supportConfig: SupportConfig;
}

export interface AdminSummary {
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
