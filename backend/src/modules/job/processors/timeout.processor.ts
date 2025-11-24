import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TimeoutService } from '../../booking/timeout.service';

@Processor('therapist-timeout')
export class TimeoutProcessor {
  constructor(private readonly timeoutService: TimeoutService) {}

  async process(_job: Job) {
    const cancelled = await this.timeoutService.handleTherapistTimeouts();
    // eslint-disable-next-line no-console
    console.log(`[Cron] Therapist timeout processed, cancelled: ${cancelled}`);
  }
}
