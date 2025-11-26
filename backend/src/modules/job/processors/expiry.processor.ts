import { Processor, WorkerHost } from '@nestjs/bullmq';
import { SessionService } from '../../booking/session.service';

@Processor('booking-expiry')
export class ExpiryProcessor extends WorkerHost {
  constructor(private readonly sessionService: SessionService) {
    super();
  }

  async process(): Promise<void> {
    const affected = await this.sessionService.expirePendingSessions();
    // eslint-disable-next-line no-console
    console.log(`[Cron] Expiry processed, affected sessions: ${affected}`);
  }
}
