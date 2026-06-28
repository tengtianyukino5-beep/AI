import { Injectable } from '@nestjs/common';

type Asset = 'JPY' | 'USDT' | 'BTC' | 'ETH';
type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'need_more_info';
type VipLevel = 'VIP0' | 'VIP1' | 'VIP2' | 'VIP3';
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
  status: 'active' | 'frozen' | 'disabled' | 'finance_review_required';
  kycStatus: KycStatus;
  vipLevel: VipLevel;
  autoAiEnabled: boolean;
  inviteCode: string;
  kycDocumentFrontName?: string;
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
  asset: Exclude<Asset, 'JPY'>;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  proofText: string;
  proofImageName?: string;
  createdAt: string;
}

interface ConversionQuote {
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

interface SimulationOpportunity {
  id: string;
  customerId: string;
  exchanges: [string, string];
  pair: string;
  spreadPercent: string;
  principalJpy: string;
  estimatedProfitJpy: string;
  buyReferenceJpy: string;
  sellReferenceJpy: string;
  confidencePercent: string;
  liquidityScore: string;
  volatility24hPercent: string;
  executionSeconds: number;
  riskLevelJa: string;
  status: 'available' | 'executed' | 'expired';
  aiSummaryJa: string;
  businessDateTokyo: string;
  createdAt: string;
}

interface SimulationOrder {
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
}

interface ExchangeConfig {
  id: string;
  name: string;
  category: 'japan' | 'overseas';
  intervalSeconds: number;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
  enabled: boolean;
}

interface AdminSummary {
  pendingKyc: number;
  pendingDeposits: number;
  totalCustomers: number;
  totalJpy: string;
  simulationProfitToday: string;
  auditCount: number;
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

const disclosureJa =
  'AI裁定エンジンが東京時間の市場データ、残高、VIP条件を照合し、確定した利益をJPY残高へ反映しました。処理結果は資金履歴で確認できます。';

@Injectable()
export class AppService {
  private readonly customers = new Map<string, CustomerRecord>();
  private readonly tokens = new Map<string, TokenRecord>();
  private readonly emailCodes = new Map<string, string>();
  private readonly balances = new Map<string, Map<Asset, AssetBalance>>();
  private readonly ledger: LedgerEntry[] = [];
  private readonly deposits: DepositOrder[] = [];
  private readonly quotes = new Map<string, ConversionQuote>();
  private readonly opportunities: SimulationOpportunity[] = [];
  private readonly orders: SimulationOrder[] = [];
  private readonly auditLogs: AuditLog[] = [];
  private readonly inviteRewards: InviteReward[] = [];

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
    },
  ];

  private readonly exchanges: ExchangeConfig[] = [
    'bitFlyer',
    'Coincheck',
    'GMO Coin',
    'bitbank',
    'SBI VC Trade',
    'Rakuten Wallet',
    'DMM Bitcoin',
    'BITPoint Japan',
    'OKCoinJapan',
    'BitTrade',
  ].map((name, index) => ({
    id: `ex-jp-${index + 1}`,
    name,
    category: 'japan',
    intervalSeconds: 2,
    minIntervalSeconds: 2,
    maxIntervalSeconds: 30,
    enabled: true,
  }));

  constructor() {
    this.exchanges.push(
      {
        id: 'ex-okx',
        name: 'OKX',
        category: 'overseas',
        intervalSeconds: 2,
        minIntervalSeconds: 2,
        maxIntervalSeconds: 30,
        enabled: true,
      },
      {
        id: 'ex-htx',
        name: 'HTX',
        category: 'overseas',
        intervalSeconds: 2,
        minIntervalSeconds: 2,
        maxIntervalSeconds: 30,
        enabled: true,
      },
      {
        id: 'ex-binance',
        name: 'Binance',
        category: 'overseas',
        intervalSeconds: 2,
        minIntervalSeconds: 2,
        maxIntervalSeconds: 30,
        enabled: true,
      },
    );
    this.seed();
  }

  health() {
    return {
      status: 'ok' as const,
      service: 'AI Arbitrage Web MVP',
      timestamp: new Date().toISOString(),
    };
  }

  sendEmailCode(email: string) {
    this.emailCodes.set(email.toLowerCase(), '888888');
    return {
      email,
      developmentCode: '888888',
      messageJa: '開発環境の認証コードは 888888 です。',
    };
  }

  register(input: { email: string; password: string; code: string; inviteCode?: string }) {
    const email = input.email.toLowerCase().trim();
    if (!email || !input.password) {
      throw new Error('メールアドレスとパスワードを入力してください。');
    }
    if ((this.emailCodes.get(email) ?? '888888') !== input.code) {
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

  customerLogin(email: string, password: string) {
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
      throw new Error('账号或密码错误');
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
      throw new Error('Customer not found');
    }
    return customer;
  }

  adminByToken(token: string) {
    const record = this.tokens.get(token);
    if (!record || record.role !== 'admin') {
      throw new Error('后台登录已失效');
    }
    return record.actorId;
  }

  dashboard(customer: CustomerRecord) {
    this.ensureDailyOpportunities(customer);
    const todayOrders = this.orders.filter(
      (order) => order.customerId === customer.id && this.tokyoDate(order.createdAt) === this.businessDateTokyo(),
    );
    const vipRule = this.vipRule(customer.vipLevel);
    return {
      customer: this.publicCustomer(customer),
      balances: this.getBalances(customer.id),
      ledger: this.ledger.filter((item) => item.customerId === customer.id).slice(0, 20),
      opportunities: this.opportunities.filter((item) => item.customerId === customer.id),
      orders: this.orders.filter((item) => item.customerId === customer.id),
      vipRules: this.vipRules,
      todayUsed: todayOrders.length,
      todayLimit: vipRule.dailyLimit,
      tokyoNow: this.tokyoNow(),
      disclosureJa,
    };
  }

  submitKyc(customer: CustomerRecord, input: { fullName: string; documentNo: string; documentFrontName?: string }) {
    customer.name = input.fullName || customer.name;
    customer.kycStatus = 'pending';
    customer.kycDocumentFrontName = input.documentFrontName;
    this.audit('kyc.submit', customer.email, 'customer', customer.id, `KYC 提交：${input.documentNo || '未填写'} / ${input.documentFrontName || '未上传'}`);
    return this.publicCustomer(customer);
  }

  toggleAutoAi(customer: CustomerRecord, enabled: boolean) {
    if (customer.kycStatus !== 'approved') {
      throw new Error('本人確認が完了していないため、自動AI裁定を利用できません。');
    }
    customer.autoAiEnabled = enabled;
    if (enabled) {
      this.ensureDailyOpportunities(customer);
    }
    this.audit('simulation.auto_toggle', customer.email, 'customer', customer.id, enabled ? '开启自动 AI' : '关闭自动 AI');
    return this.dashboard(customer);
  }

  createDeposit(customer: CustomerRecord, input: { asset: Exclude<Asset, 'JPY'>; amount: string; proofText: string; proofImageName?: string }) {
    const deposit: DepositOrder = {
      id: this.id('dep'),
      businessNo: this.businessNo('DEP'),
      customerId: customer.id,
      asset: input.asset,
      amount: input.amount,
      status: 'pending',
      proofText: input.proofText || 'transfer proof',
      proofImageName: input.proofImageName,
      createdAt: this.now(),
    };
    this.deposits.unshift(deposit);
    this.audit('deposit.create', customer.email, 'deposit', deposit.id, `${input.asset} ${input.amount}`);
    return deposit;
  }

  quoteConversion(customer: CustomerRecord, input: { fromAsset: Exclude<Asset, 'JPY'>; amount: string }) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('変換数量を入力してください。');
    }
    const balance = this.balance(customer.id, input.fromAsset);
    if (Number(balance.available) < amount) {
      throw new Error('残高が不足しています。');
    }
    const cryptoToUsdt = input.fromAsset === 'ETH' ? 3200 : input.fromAsset === 'BTC' ? 64000 : 1;
    const usdToJpy = 157.42;
    const estimatedJpy = Math.floor(amount * cryptoToUsdt * 1 * usdToJpy);
    const quote: ConversionQuote = {
      id: this.id('quote'),
      fromAsset: input.fromAsset,
      fromAmount: input.amount,
      path: input.fromAsset === 'USDT' ? ['USDT', 'USD', 'JPY'] : [input.fromAsset, 'USDT', 'USD', 'JPY'],
      estimatedJpy: String(estimatedJpy),
      rateSource: 'primary',
      expiresAt: new Date(Date.now() + 120000).toISOString(),
      snapshot: {
        cryptoToUsdt: String(cryptoToUsdt),
        usdtToUsd: '1',
        usdToJpy: String(usdToJpy),
      },
    };
    this.quotes.set(quote.id, quote);
    return quote;
  }

  executeConversion(customer: CustomerRecord, quoteId: string) {
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      throw new Error('見積もりが見つかりません。');
    }
    if (new Date(quote.expiresAt).getTime() < Date.now()) {
      throw new Error('レートの有効期限が切れました。');
    }
    this.adjustBalance(customer.id, quote.fromAsset, -Number(quote.fromAmount), 'conversion_out', '変換', '转换扣减');
    this.adjustBalance(customer.id, 'JPY', Number(quote.estimatedJpy), 'conversion_in', '変換', '转换入账');
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

  upgradeVip(customer: CustomerRecord) {
    if (customer.kycStatus !== 'approved') {
      throw new Error('VIPアップグレードには本人確認が必要です。');
    }
    const jpy = Number(this.balance(customer.id, 'JPY').available);
    if (customer.vipLevel === 'VIP0' && jpy >= 75000) {
      customer.vipLevel = 'VIP1';
    } else if (customer.vipLevel === 'VIP1' && jpy >= 250000) {
      customer.vipLevel = 'VIP2';
    } else if (customer.vipLevel === 'VIP2' && jpy >= 500000) {
      customer.vipLevel = 'VIP3';
    } else {
      throw new Error('残高条件を満たしていません。');
    }
    this.audit('vip.upgrade', customer.email, 'customer', customer.id, `${customer.vipLevel} 自助升级，不扣余额`);
    return this.dashboard(customer);
  }

  createSimulationOrder(customer: CustomerRecord, opportunityId: string) {
    if (customer.kycStatus !== 'approved') {
      throw new Error('本人確認が完了していないため、AI裁定を利用できません。');
    }
    const opportunity = this.opportunities.find((item) => item.id === opportunityId && item.customerId === customer.id);
    if (!opportunity || opportunity.status !== 'available') {
      throw new Error('この裁定機会は利用できません。');
    }
    const rule = this.vipRule(customer.vipLevel);
    const balance = this.balance(customer.id, 'JPY');
    const beforeVersion = balance.balanceVersion;
    const profit = this.calculateProfit(rule, Number(opportunity.principalJpy));
    opportunity.status = 'executed';
    const order: SimulationOrder = {
      id: this.id('sim'),
      businessNo: this.businessNo('SIM'),
      customerId: customer.id,
      opportunityId,
      status: 'settled',
      principalJpy: opportunity.principalJpy,
      profitJpy: String(profit),
      vipLevel: customer.vipLevel,
      balanceVersionBefore: beforeVersion,
      balanceVersionAfter: beforeVersion + 1,
      aiSummaryJa: opportunity.aiSummaryJa,
      disclosureJa,
      createdAt: this.now(),
      settledAt: this.now(),
    };
    this.orders.unshift(order);
    this.adjustBalance(customer.id, 'JPY', profit, 'simulation_profit', 'AI裁定利益', '站内模拟套利利润');
    this.audit('simulation.settle', customer.email, 'simulation_order', order.id, `站内模拟结算利润 ¥${profit}`);
    if (customer.autoAiEnabled) {
      this.ensureDailyOpportunities(customer);
    }
    return {
      order,
      dashboard: this.dashboard(customer),
    };
  }

  inviteInfo(customer: CustomerRecord) {
    const invited = [...this.customers.values()].filter((item) => item.invitedBy === customer.id);
    const rewards = this.inviteRewards.filter((item) => item.inviterCustomerId === customer.id);
    return {
      inviteCode: customer.inviteCode,
      inviteUrl: `https://example.local/register?invite=${customer.inviteCode}`,
      invited: invited.map((item) => this.publicCustomer(item)),
      rewards,
      rule: '邀请人与下线均 KYC 后，可按后台规则获得冻结返佣，审核后入账。',
    };
  }

  adminSummary(): AdminSummary {
    const totalJpy = [...this.balances.values()].reduce((sum, balanceMap) => {
      return sum + Number(balanceMap.get('JPY')?.available ?? '0');
    }, 0);
    const simulationProfitToday = this.ledger
      .filter((item) => item.ledgerType === 'simulation_profit' && this.tokyoDate(item.createdAt) === this.businessDateTokyo())
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return {
      pendingKyc: [...this.customers.values()].filter((item) => item.kycStatus === 'pending').length,
      pendingDeposits: this.deposits.filter((item) => item.status === 'pending').length,
      totalCustomers: this.customers.size,
      totalJpy: String(totalJpy),
      simulationProfitToday: String(simulationProfitToday),
      auditCount: this.auditLogs.length,
    };
  }

  adminState() {
    return {
      summary: this.adminSummary(),
      customers: [...this.customers.values()].map((item) => this.publicCustomer(item)),
      balances: Object.fromEntries([...this.customers.keys()].map((id) => [id, this.getBalances(id)])),
      ledger: this.ledger,
      deposits: this.deposits,
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
    if (!customer.campaignRewardPosted) {
      this.adjustBalance(customer.id, 'JPY', 10000, 'operation_reward', 'キャンペーン報酬', '运营奖励 / 注册体验金额');
      customer.campaignRewardPosted = true;
    }
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
      throw new Error('入金记录不存在');
    }
    if (deposit.status === 'approved') {
      return this.adminState();
    }
    deposit.status = 'approved';
    this.adjustBalance(deposit.customerId, deposit.asset, Number(deposit.amount), 'deposit', '入金', '入金确认');
    this.audit('deposit.approve', operator, 'deposit', deposit.id, `${deposit.asset} ${deposit.amount}`);
    return this.adminState();
  }

  rejectDeposit(depositId: string, operator: string) {
    const deposit = this.deposits.find((item) => item.id === depositId);
    if (!deposit) {
      throw new Error('入金记录不存在');
    }
    deposit.status = 'rejected';
    this.audit('deposit.reject', operator, 'deposit', deposit.id, '入金驳回');
    return this.adminState();
  }

  adjustCustomerBalance(
    input: { customerId: string; asset: Asset; amount: string; direction: 'credit' | 'debit'; reason: string },
    operator: string,
  ) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('请输入有效金额');
    }
    const signedAmount = input.direction === 'credit' ? amount : -amount;
    this.adjustBalance(
      input.customerId,
      input.asset,
      signedAmount,
      input.direction === 'credit' ? 'manual_credit' : 'manual_debit',
      '残高調整',
      input.reason || '后台人工余额调整',
    );
    this.audit('balance.adjust', operator, 'customer', input.customerId, `${input.asset} ${signedAmount}`);
    return this.adminState();
  }

  updateExchange(exchangeId: string, input: { intervalSeconds: number; enabled: boolean }, operator: string) {
    const exchange = this.exchanges.find((item) => item.id === exchangeId);
    if (!exchange) {
      throw new Error('交易所不存在');
    }
    exchange.intervalSeconds = Math.min(
      exchange.maxIntervalSeconds,
      Math.max(exchange.minIntervalSeconds, Number(input.intervalSeconds) || exchange.intervalSeconds),
    );
    exchange.enabled = Boolean(input.enabled);
    this.audit('exchange.update', operator, 'exchange', exchange.id, `${exchange.name} ${exchange.intervalSeconds}s`);
    return this.adminState();
  }

  updateVip(level: VipLevel, input: Partial<VipRule>, operator: string) {
    const rule = this.vipRules.find((item) => item.level === level);
    if (!rule) {
      throw new Error('VIP 规则不存在');
    }
    Object.assign(rule, {
      dailyLimit: Number(input.dailyLimit ?? rule.dailyLimit),
      intervalSeconds: Number(input.intervalSeconds ?? rule.intervalSeconds),
      minBalanceJpy: Number(input.minBalanceJpy ?? rule.minBalanceJpy),
      profitFloorJpy: Number(input.profitFloorJpy ?? rule.profitFloorJpy),
      profitCapJpy: Number(input.profitCapJpy ?? rule.profitCapJpy),
      highProfitThresholdJpy: Number(input.highProfitThresholdJpy ?? rule.highProfitThresholdJpy),
      highProfitProbability: Number(input.highProfitProbability ?? rule.highProfitProbability),
    });
    this.audit('vip.update', operator, 'vip_rule', level, '修改 VIP / 利润规则');
    return this.adminState();
  }

  private seed() {
    const customer = this.createCustomer('demo@example.jp', '123456', 'approved', 'VIP0', 38000, {
      campaignRewardPosted: true,
    });
    this.adjustBalance(customer.id, 'JPY', 10000, 'operation_reward', 'キャンペーン報酬', '注册体验金额');
    this.adjustBalance(customer.id, 'ETH', 1.25, 'deposit', '入金', '种子 ETH 入金');
    this.adjustBalance(customer.id, 'USDT', 500, 'deposit', '入金', '种子 USDT 入金');
    this.adjustBalance(customer.id, 'BTC', 0.0125, 'deposit', '入金', '种子 BTC 入金');
    this.ensureDailyOpportunities(customer);
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
      inviteCode: this.inviteCode(),
      campaignRewardPosted: options.campaignRewardPosted ?? false,
      invitedBy: options.invitedBy,
      createdAt: this.now(),
    };
    this.customers.set(customer.id, customer);
    const balanceMap = new Map<Asset, AssetBalance>();
    (['JPY', 'USDT', 'BTC', 'ETH'] as Asset[]).forEach((asset) => {
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

  private customerSession(customer: CustomerRecord) {
    return {
      token: this.token(customer.id, 'customer'),
      customer: this.publicCustomer(customer),
      dashboard: this.dashboard(customer),
    };
  }

  private token(actorId: string, role: 'customer' | 'admin') {
    const token = `${role}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    this.tokens.set(token, { actorId, role });
    return token;
  }

  private publicCustomer(customer: CustomerRecord): CustomerProfile {
    const { password: _password, campaignRewardPosted: _reward, invitedBy: _invitedBy, ...publicCustomer } = customer;
    return publicCustomer;
  }

  private mustCustomer(customerId: string) {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error('客户不存在');
    }
    return customer;
  }

  private getBalances(customerId: string) {
    return [...(this.balances.get(customerId)?.values() ?? [])];
  }

  private balance(customerId: string, asset: Asset) {
    const balance = this.balances.get(customerId)?.get(asset);
    if (!balance) {
      throw new Error(`Balance missing: ${customerId} ${asset}`);
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
      throw new Error(asset === 'JPY' ? 'JPY 可用余额不足' : `${asset} 残高が不足しています。`);
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

  private ensureDailyOpportunities(customer: CustomerRecord) {
    if (customer.kycStatus !== 'approved') {
      return;
    }
    const today = this.businessDateTokyo();
    const existing = this.opportunities.filter(
      (item) => item.customerId === customer.id && item.businessDateTokyo === today && item.status === 'available',
    );
    const rule = this.vipRule(customer.vipLevel);
    const needed = Math.min(rule.dailyLimit, customer.autoAiEnabled ? 3 : 2) - existing.length;
    for (let i = 0; i < needed; i += 1) {
      const buy = this.exchanges[(i + this.opportunities.length) % this.exchanges.length];
      const sell = this.exchanges[(i + this.opportunities.length + 3) % this.exchanges.length];
      const principal = Math.max(rule.minBalanceJpy || 10000, Math.min(Number(this.balance(customer.id, 'JPY').available), 5000000));
      const estimatedProfit = this.calculateProfit(rule, principal || 10000);
      const buyReference = Math.floor(principal * (0.994 + i * 0.0006));
      const sellReference = Math.floor(principal * (1.006 + i * 0.0011));
      const confidence = Math.max(84, 96 - i * 2);
      const liquidity = i % 3 === 0 ? '96/100' : i % 3 === 1 ? '91/100' : '88/100';
      const volatility = (2.4 + i * 0.32).toFixed(2);
      const executionSeconds = Math.max(4, Math.min(18, rule.intervalSeconds + 4 + i * 2));
      this.opportunities.unshift({
        id: this.id('opp'),
        customerId: customer.id,
        exchanges: [buy.name, sell.name],
        pair: i % 2 === 0 ? 'BTC/JPY' : 'ETH/JPY',
        spreadPercent: (1.2 + i * 0.36).toFixed(2),
        principalJpy: String(Math.max(10000, principal || 10000)),
        estimatedProfitJpy: String(estimatedProfit),
        buyReferenceJpy: String(buyReference),
        sellReferenceJpy: String(sellReference),
        confidencePercent: String(confidence),
        liquidityScore: liquidity,
        volatility24hPercent: volatility,
        executionSeconds,
        riskLevelJa: confidence >= 92 ? '低' : '中',
        status: 'available',
        aiSummaryJa:
          `東京時間 ${this.tokyoNow()} 時点で、${buy.name} と ${sell.name} の板厚、価格差、約定速度、24時間変動率、VIP上限、利用可能残高を照合しました。AI信頼度は ${confidence}%、流動性スコアは ${liquidity}、想定処理時間は ${executionSeconds} 秒です。条件が維持されている間、JPY残高への利益反映対象として処理できます。`,
        businessDateTokyo: today,
        createdAt: this.now(),
      });
    }
  }

  private calculateProfit(rule: VipRule, principalJpy: number) {
    const high = Math.random() * 100 < rule.highProfitProbability;
    const min = high ? rule.highProfitThresholdJpy : rule.profitFloorJpy;
    const max = rule.profitCapJpy;
    const amount = Math.floor(min + Math.random() * Math.max(1, max - min));
    return Math.max(rule.profitFloorJpy, Math.min(amount, Math.floor(principalJpy * 0.28), rule.profitCapJpy));
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
        this.adjustBalance(inviter.id, 'JPY', Number(reward.amountJpy), 'invite_reward', '招待報酬', '邀请返佣入账');
      }
    });
  }

  private vipRule(level: VipLevel) {
    return this.vipRules.find((rule) => rule.level === level) ?? this.vipRules[0];
  }

  private reconciliation() {
    const checkedBalances = [...this.balances.values()].reduce((sum, item) => sum + item.size, 0);
    return {
      businessDateTokyo: this.businessDateTokyo(),
      checkedBalances,
      mismatchCount: 0,
      status: 'success',
      generatedAt: this.now(),
      note: '内存版 MVP 已按 posted 流水和余额版本完成演示对账。',
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
      simulation_profit: '站内模拟套利利润',
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

  private id(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  }

  private inviteCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
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
