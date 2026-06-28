export type Asset = 'JPY' | 'USDT' | 'BTC' | 'ETH';
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
  inviteCode: string;
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
  asset: Exclude<Asset, 'JPY'>;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  proofText: string;
  createdAt: string;
}

export interface ConversionQuote {
  id: string;
  fromAsset: Exclude<Asset, 'JPY'>;
  fromAmount: string;
  path: string[];
  estimatedJpy: string;
  rateSource: 'primary' | 'backup' | 'manual';
  expiresAt: string;
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
  spreadPercent: string;
  principalJpy: string;
  estimatedProfitJpy: string;
  status: 'available' | 'executed' | 'expired';
  aiSummaryJa: string;
  businessDateTokyo: string;
  createdAt: string;
}

export interface SimulationOrder {
  id: string;
  businessNo: string;
  customerId: string;
  opportunityId: string;
  status: 'created' | 'analyzing' | 'executing' | 'settled' | 'failed' | 'cancelled';
  principalJpy: string;
  profitJpy: string;
  vipLevel: VipLevel;
  balanceVersionBefore: number;
  balanceVersionAfter: number;
  aiSummaryJa: string;
  disclosureJa: string;
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
}

export interface ExchangeConfig {
  id: string;
  name: string;
  category: 'japan' | 'overseas';
  intervalSeconds: number;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
  enabled: boolean;
}

export interface DashboardData {
  customer: CustomerProfile;
  balances: AssetBalance[];
  ledger: LedgerEntry[];
  opportunities: SimulationOpportunity[];
  orders: SimulationOrder[];
  vipRules: VipRule[];
  todayUsed: number;
  todayLimit: number;
  tokyoNow: string;
  disclosureJa: string;
}

export interface AdminSummary {
  pendingKyc: number;
  pendingDeposits: number;
  totalCustomers: number;
  totalJpy: string;
  simulationProfitToday: string;
  auditCount: number;
}
