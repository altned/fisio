import { Processor, WorkerHost } from '@nestjs/bullmq';
import { TimeoutService } from '../../booking/timeout.service';

@Processor('payment-expiry')
export class PaymentExpiryProcessor extends WorkerHost {
    constructor(private readonly timeoutService: TimeoutService) {
        super();
    }

    async process(): Promise<void> {
        const cancelled = await this.timeoutService.handlePaymentExpiry();
        // eslint-disable-next-line no-console
        console.log(`[Cron] Payment expiry processed, cancelled: ${cancelled}`);
    }
}
