import { Controller, Get, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':id/stats/monthly')
  monthlyStats(@Param('id') id: string) {
    return this.walletService.getMonthlyIncome(id);
  }
}
