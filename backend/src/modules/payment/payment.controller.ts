import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MidtransWebhookDto } from './dto/midtrans-webhook.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  async webhook(@Body() body: MidtransWebhookDto) {
    const result = await this.paymentService.handleWebhook(body);
    return { success: true, bookingId: result.id, status: result.status };
  }
}
