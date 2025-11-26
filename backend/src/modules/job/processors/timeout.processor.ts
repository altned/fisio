import { Processor, WorkerHost } from '@nestjs/bullmq';
import { TimeoutService } from '../../booking/timeout.service';

@Processor('therapist-timeout')
export class TimeoutProcessor extends WorkerHost {
  constructor(private readonly timeoutService: TimeoutService) {
    super();
  }

  async process(): Promise<void> {
    const cancelled = await this.timeoutService.handleTherapistTimeouts();
    // eslint-disable-next-line no-console
    console.log(`[Cron] Therapist timeout processed, cancelled: ${cancelled}`);
  }
}
