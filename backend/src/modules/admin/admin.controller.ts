import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CompleteRefundDto } from './dto/complete-refund.dto';
import { ManualPayoutDto } from './dto/manual-payout.dto';
import { SwapTherapistDto } from './dto/swap-therapist.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('bookings/refund')
  completeRefund(@Req() req: any, @Body() body: CompleteRefundDto) {
    return this.adminService.completeRefund(body, req.user?.id);
  }

  @Patch('bookings/:id/swap-therapist')
  swapTherapist(@Req() req: any, @Param('id') bookingId: string, @Body() body: Omit<SwapTherapistDto, 'bookingId'>) {
    return this.adminService.swapTherapist(
      { bookingId, newTherapistId: body.newTherapistId },
      req.user?.id,
    );
  }

  @Post('wallets/:id/withdraw')
  withdraw(@Req() req: any, @Param('id') walletId: string, @Body() body: Omit<WithdrawDto, 'walletId'>) {
    return this.adminService.withdraw({
      walletId,
      amount: body.amount,
      adminNote: body.adminNote,
    }, req.user?.id);
  }

  @Post('sessions/:id/payout')
  manualPayout(@Req() req: any, @Param('id') sessionId: string, @Body() body: Omit<ManualPayoutDto, 'sessionId'>) {
    return this.adminService.manualPayout({
      sessionId,
      adminNote: body.adminNote,
    }, req.user?.id);
  }

  @Get('logs')
  listLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    return this.adminService.listAdminActions(p, l);
  }
}
