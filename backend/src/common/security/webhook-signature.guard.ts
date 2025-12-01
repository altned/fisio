import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Webhook secret belum dikonfigurasi');
    }

    const request = context.switchToHttp().getRequest<any>();
    const signatureHeader = request.headers['x-signature'] || request.headers['X-Signature'];
    if (!signatureHeader || typeof signatureHeader !== 'string') {
      throw new UnauthorizedException('Signature header tidak ditemukan');
    }

    const timestampHeader = request.headers['x-timestamp'] || request.headers['X-Timestamp'];
    if (timestampHeader) {
      const ts = Number(timestampHeader);
      if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > FIVE_MINUTES_MS) {
        throw new UnauthorizedException('Timestamp signature tidak valid atau kedaluwarsa');
      }
    }

    const rawBody: string = request.rawBody || JSON.stringify(request.body || {});
    const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signatureHeader.replace(/^sha256=/i, '');

    const computedBuf = Buffer.from(computed, 'hex');
    const providedBuf = Buffer.from(provided, 'hex');
    if (computedBuf.length !== providedBuf.length || !timingSafeEqual(computedBuf, providedBuf)) {
      throw new UnauthorizedException('Signature tidak valid');
    }
    return true;
  }
}
