import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { UploadProofDto } from './dto/upload-proof.dto';
import { PaymentService } from './payment.service';
import { Throttle } from '@nestjs/throttler';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT')
  @Throttle(10, 60)
  initiate(@Body() body: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(body);
  }

  @Post('proof')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT')
  @Throttle(10, 60)
  uploadProof(@Body() body: UploadProofDto) {
    return this.paymentService.uploadProof(body);
  }

  @Post('confirm')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Throttle(5, 60)
  confirm(@Body() body: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(body);
  }
}
