import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { UploadProofDto } from './dto/upload-proof.dto';
import { PaymentService } from './payment.service';
import { Throttle } from '@nestjs/throttler';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('initiate')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  initiate(@Body() body: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(body);
  }

  @Post('proof')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  uploadProof(@Body() body: UploadProofDto) {
    return this.paymentService.uploadProof(body);
  }

  @Post('confirm')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  confirm(@Body() body: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(body);
  }

  /**
   * ⚠️ DEV ONLY - Force a booking to PAID status
   * !!! REMOVE OR DISABLE BEFORE PRODUCTION RELEASE !!!
   * @see DEV_NOTES.md
   */
  @Post('force-paid/:bookingId')
  @UseGuards(JwtGuard)
  forcePaid(@Param('bookingId') bookingId: string) {
    return this.paymentService.forcePaymentPaid(bookingId);
  }
}
