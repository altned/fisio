import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CompleteRefundDto } from './dto/complete-refund.dto';
import { SwapTherapistDto } from './dto/swap-therapist.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('bookings/refund')
  completeRefund(@Body() body: CompleteRefundDto) {
    return this.adminService.completeRefund(body);
  }

  @Patch('bookings/:id/swap-therapist')
  swapTherapist(@Param('id') bookingId: string, @Body() body: Omit<SwapTherapistDto, 'bookingId'>) {
    return this.adminService.swapTherapist({ bookingId, newTherapistId: body.newTherapistId });
  }

  @Post('wallets/:id/withdraw')
  withdraw(@Param('id') walletId: string, @Body() body: Omit<WithdrawDto, 'walletId'>) {
    return this.adminService.withdraw({
      walletId,
      amount: body.amount,
      adminNote: body.adminNote,
    });
  }
}
