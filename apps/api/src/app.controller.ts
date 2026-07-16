import { Body, Controller, Get, Headers, MessageEvent, Param, Patch, Post, Query, Res, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { interval, map, Observable, startWith } from 'rxjs';
import { AdminPermission, AppService } from './app.service';

type Asset = 'JPY' | 'USDT' | 'BTC' | 'ETH';
type VipLevel = 'VIP0' | 'VIP1' | 'VIP2' | 'VIP3' | 'VIP4' | 'VIP5' | 'VIP6' | 'VIP7';
type CustomerStatus = 'active' | 'frozen' | 'disabled' | 'finance_review_required';

interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  requestId: string;
}

type FileResponse = {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => FileResponse;
  type: (value: string) => FileResponse;
  send: (body: Buffer | string) => void;
};

@ApiTags('AI Arbitrage MVP')
@Controller('api/v1')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.ok(this.appService.health());
  }

  @Get('uploads/:storageKey')
  uploadFile(@Param('storageKey') storageKey: string, @Res() response: FileResponse) {
    try {
      const file = this.appService.getUploadFile(storageKey);
      response.setHeader('Cache-Control', 'private, max-age=3600');
      response.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
      response.type(file.mimeType);
      return response.status(200).send(file.body);
    } catch {
      return response.status(404).type('text/plain; charset=utf-8').send('Not Found');
    }
  }

  @Post('auth/email-code/send')
  sendEmailCode(@Body() body: { email: string }) {
    return this.safe(() => this.appService.sendEmailCode(body.email));
  }

  @Post('auth/register')
  register(@Body() body: { email: string; password: string; code: string; inviteCode?: string }) {
    return this.safe(() => this.appService.register(body));
  }

  @Post('auth/login')
  customerLogin(@Body() body: { email: string; password: string }) {
    return this.safe(() => this.appService.customerLogin(body.email, body.password));
  }

  @Post('admin/auth/login')
  adminLogin(@Body() body: { username: string; password: string }) {
    return this.safe(() => this.appService.adminLogin(body.username, body.password));
  }

  @Get('customer/dashboard')
  customerDashboard(@Headers('authorization') authorization?: string) {
    return this.safe(() => this.appService.dashboard(this.customer(authorization)));
  }

  @Post('customer/kyc')
  submitKyc(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { fullName: string; documentNo: string; documentFrontName?: string; kycDocumentFrontDataUrl?: string },
  ) {
    return this.safe(() => this.appService.submitKyc(this.customer(authorization), body));
  }

  @Post('customer/simulation/auto-toggle')
  toggleAutoAi(@Headers('authorization') authorization: string | undefined, @Body() body: { enabled: boolean }) {
    return this.safe(() => this.appService.toggleAutoAi(this.customer(authorization), body.enabled));
  }

  @Get('customer/support')
  supportConversation(@Headers('authorization') authorization?: string) {
    return this.safe(() => this.appService.supportConversation(this.customer(authorization)));
  }

  @Post('customer/support/messages')
  sendSupportMessage(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { category?: string; message?: string },
  ) {
    return this.safe(() => this.appService.sendSupportMessage(this.customer(authorization), body));
  }

  @Post('customer/deposits')
  createDeposit(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      asset: Exclude<Asset, 'JPY'>;
      amount: string;
      network?: 'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum';
      proofText: string;
      proofImageName?: string;
      proofImageDataUrl?: string;
    },
  ) {
    return this.safe(() => this.appService.createDeposit(this.customer(authorization), body));
  }

  @Post('customer/withdrawals')
  createWithdrawal(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      asset: Asset;
      amount: string;
      destinationType: 'bank' | 'wallet';
      network?: 'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum' | 'Bank';
      destinationText: string;
      note?: string;
    },
  ) {
    return this.safe(() => this.appService.createWithdrawal(this.customer(authorization), body));
  }

  @Post('customer/conversions/quote')
  quoteConversion(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { fromAsset: Exclude<Asset, 'JPY'>; amount: string },
  ) {
    return this.safe(() => this.appService.quoteConversion(this.customer(authorization), body));
  }

  @Post('customer/conversions')
  executeConversion(@Headers('authorization') authorization: string | undefined, @Body() body: { quoteId: string }) {
    return this.safe(() => this.appService.executeConversion(this.customer(authorization), body.quoteId));
  }

  @Post('customer/vip/upgrade')
  upgradeVip(@Headers('authorization') authorization?: string) {
    return this.safe(() => this.appService.upgradeVip(this.customer(authorization)));
  }

  @Post('customer/simulation/orders')
  createSimulationOrder(@Headers('authorization') authorization: string | undefined, @Body() body: { opportunityId: string }) {
    return this.safe(() => this.appService.createSimulationOrder(this.customer(authorization), body.opportunityId));
  }

  @Get('customer/invites')
  inviteInfo(@Headers('authorization') authorization?: string) {
    return this.safe(() => this.appService.inviteInfo(this.customer(authorization)));
  }

  @Get('admin/state')
  adminState(@Headers('authorization') authorization?: string) {
    return this.safe(() => {
      this.admin(authorization, 'admin.view');
      return this.appService.adminState();
    });
  }

  @Sse('admin/state/stream')
  adminStateStream(@Query('token') token?: string): Observable<MessageEvent> {
    this.appService.adminByToken(token ?? '', 'admin.view');
    return interval(1500).pipe(
      startWith(0),
      map(() => ({
        type: 'admin-state',
        data: this.appService.adminState(),
      })),
    );
  }

  @Post('admin/kyc/:customerId/approve')
  approveKyc(@Headers('authorization') authorization: string | undefined, @Param('customerId') customerId: string) {
    return this.safe(() => this.appService.approveKyc(customerId, this.admin(authorization, 'kyc.approve')));
  }

  @Post('admin/kyc/:customerId/reject')
  rejectKyc(@Headers('authorization') authorization: string | undefined, @Param('customerId') customerId: string) {
    return this.safe(() => this.appService.rejectKyc(customerId, this.admin(authorization, 'kyc.approve')));
  }

  @Post('admin/deposits/:depositId/approve')
  approveDeposit(@Headers('authorization') authorization: string | undefined, @Param('depositId') depositId: string) {
    return this.safe(() => this.appService.approveDeposit(depositId, this.admin(authorization, 'deposit.approve')));
  }

  @Post('admin/deposits/:depositId/reject')
  rejectDeposit(@Headers('authorization') authorization: string | undefined, @Param('depositId') depositId: string) {
    return this.safe(() => this.appService.rejectDeposit(depositId, this.admin(authorization, 'deposit.approve')));
  }

  @Post('admin/withdrawals/:withdrawalId/approve')
  approveWithdrawal(@Headers('authorization') authorization: string | undefined, @Param('withdrawalId') withdrawalId: string) {
    return this.safe(() => this.appService.approveWithdrawal(withdrawalId, this.admin(authorization, 'withdrawal.complete')));
  }

  @Post('admin/withdrawals/:withdrawalId/reject')
  rejectWithdrawal(@Headers('authorization') authorization: string | undefined, @Param('withdrawalId') withdrawalId: string) {
    return this.safe(() => this.appService.rejectWithdrawal(withdrawalId, this.admin(authorization, 'withdrawal.complete')));
  }

  @Post('admin/balances/adjust')
  adjustCustomerBalance(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { customerId: string; asset: Asset; amount: string; direction: 'credit' | 'debit'; reason: string },
  ) {
    return this.safe(() => this.appService.adjustCustomerBalance(body, this.admin(authorization, 'balance.adjust')));
  }

  @Patch('admin/customers/:customerId')
  updateCustomer(
    @Headers('authorization') authorization: string | undefined,
    @Param('customerId') customerId: string,
    @Body()
    body: {
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
  ) {
    return this.safe(() => this.appService.updateCustomer(customerId, body, this.admin(authorization, 'customer.edit')));
  }

  @Patch('admin/customers/:customerId/deposit-addresses')
  updateCustomerDepositAddresses(
    @Headers('authorization') authorization: string | undefined,
    @Param('customerId') customerId: string,
    @Body()
    body: {
      addresses?: Array<{
        asset?: Exclude<Asset, 'JPY'>;
        network?: 'TRC-20' | 'ERC-20' | 'Bitcoin' | 'Ethereum';
        address?: string;
        memo?: string;
        minConfirmations?: number | string;
        enabled?: boolean;
      }>;
    },
  ) {
    return this.safe(() => this.appService.updateCustomerDepositAddresses(customerId, body, this.admin(authorization, 'customer.edit')));
  }

  @Post('admin/exchanges/refresh')
  refreshMarkets(@Headers('authorization') authorization?: string) {
    return this.safe(() => this.appService.refreshMarketsNow(this.admin(authorization, 'exchange.update')));
  }

  @Patch('admin/exchanges/:exchangeId')
  updateExchange(
    @Headers('authorization') authorization: string | undefined,
    @Param('exchangeId') exchangeId: string,
    @Body() body: { intervalSeconds: number; enabled: boolean },
  ) {
    return this.safe(() => this.appService.updateExchange(exchangeId, body, this.admin(authorization, 'exchange.update')));
  }

  @Patch('admin/vip/:level')
  updateVip(
    @Headers('authorization') authorization: string | undefined,
    @Param('level') level: VipLevel,
    @Body() body: Record<string, unknown>,
  ) {
    return this.safe(() => this.appService.updateVip(level, body, this.admin(authorization, 'vip.update')));
  }

  @Patch('admin/deposit-addresses/:addressId')
  updateDepositAddress(
    @Headers('authorization') authorization: string | undefined,
    @Param('addressId') addressId: string,
    @Body() body: { address?: string; memo?: string; minConfirmations?: number | string; enabled?: boolean },
  ) {
    return this.safe(() => this.appService.updateDepositAddress(addressId, body, this.admin(authorization, 'deposit.address.update')));
  }

  @Patch('admin/support-config')
  updateSupportConfig(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { lineUrl?: string; lineQrUrl?: string; noteJa?: string },
  ) {
    return this.safe(() => this.appService.updateSupportConfig(body, this.admin(authorization, 'admin.view')));
  }

  private customer(authorization?: string) {
    return this.appService.customerByToken(this.bearer(authorization));
  }

  private admin(authorization?: string, permission: AdminPermission = 'admin.view') {
    return this.appService.adminByToken(this.bearer(authorization), permission);
  }

  private bearer(authorization?: string) {
    return authorization?.replace(/^Bearer\s+/i, '').trim() ?? '';
  }

  private async safe<T>(fn: () => T | Promise<T>): Promise<ApiResponse<T | null>> {
    try {
      return this.ok(await fn());
    } catch (error) {
      return {
        code: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        requestId: this.requestId(),
      };
    }
  }

  private ok<T>(data: T): ApiResponse<T> {
    return {
      code: 'OK',
      message: 'success',
      data,
      requestId: this.requestId(),
    };
  }

  private requestId() {
    return `req_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  }
}
