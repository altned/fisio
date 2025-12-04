import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('webhooks/midtrans')
export class MidtransWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(200)
  async handle(@Body() body: any) {
    return this.paymentService.handleMidtransNotification(body);
  }
}
