import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtGuard, Roles, RolesGuard } from '../../common/auth';

@Controller('wallets')
@UseGuards(JwtGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  /**
   * Get wallet for the authenticated therapist
   */
  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('THERAPIST')
  async getMyWallet(@Request() req: any) {
    // JWT stores user.id, so we look up therapist by user ID
    return this.walletService.getWalletByUserId(req.user.id);
  }

  /**
   * Get wallet by therapist ID (for admin)
   */
  @Get('by-therapist/:therapistId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getWalletByTherapist(@Param('therapistId') therapistId: string) {
    return this.walletService.getWalletByTherapistId(therapistId);
  }

  /**
   * Get transactions for a wallet
   */
  @Get(':id/transactions')
  @UseGuards(RolesGuard)
  @Roles('THERAPIST', 'ADMIN')
  getTransactions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    return this.walletService.getTransactions(id, p, l);
  }

  /**
   * Get monthly income stats for a wallet
   */
  @Get(':id/stats/monthly')
  @UseGuards(RolesGuard)
  @Roles('THERAPIST', 'ADMIN')
  monthlyStats(@Param('id') id: string) {
    return this.walletService.getMonthlyIncome(id);
  }
}

