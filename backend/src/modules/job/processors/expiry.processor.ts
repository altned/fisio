import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SessionService } from '../../booking/session.service';

@Processor('booking-expiry')
export class ExpiryProcessor {
  constructor(private readonly sessionService: SessionService) {}

  async process(_job: Job) {
    const affected = await this.sessionService.expirePendingSessions();
    // eslint-disable-next-line no-console
    console.log(`[Cron] Expiry processed, affected sessions: ${affected}`);
  }
}
