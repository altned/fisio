import { Body, Controller, Post } from '@nestjs/common';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { UploadProofDto } from './dto/upload-proof.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  initiate(@Body() body: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(body);
  }

  @Post('proof')
  uploadProof(@Body() body: UploadProofDto) {
    return this.paymentService.uploadProof(body);
  }

  @Post('confirm')
  confirm(@Body() body: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(body);
  }
}
