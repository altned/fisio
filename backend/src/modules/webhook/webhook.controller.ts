import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WebhookSignatureGuard } from '../../common/security';

@Controller('webhooks')
@UseGuards(WebhookSignatureGuard)
export class WebhookController {
  @Post('test')
  handleTest(@Body() body: any) {
    return { ok: true, received: body };
  }
}
