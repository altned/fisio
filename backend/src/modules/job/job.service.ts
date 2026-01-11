import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobService implements OnModuleInit {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectQueue('booking-expiry') private readonly expiryQueue: Queue,
    @InjectQueue('chat-lock') private readonly chatLockQueue: Queue,
    @InjectQueue('therapist-timeout') private readonly timeoutQueue: Queue,
    @InjectQueue('payment-expiry') private readonly paymentExpiryQueue: Queue,
    @InjectQueue('booking-complete') private readonly bookingCompleteQueue: Queue,
  ) { }

  async onModuleInit() {
    try {
      await this.ensureRepeatableJobs();
      this.logger.log('Repeatable jobs initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize repeatable jobs:', error);
    }
  }

  /**
   * Clear all existing repeatable jobs from a queue
   */
  private async clearRepeatableJobs(queue: Queue): Promise<void> {
    try {
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        await queue.removeRepeatableByKey(job.key);
      }
    } catch (error) {
      this.logger.warn(`Failed to clear repeatable jobs for queue ${queue.name}:`, error);
    }
  }

  private async ensureRepeatableJobs() {
    // Clear all existing repeatable jobs first
    await this.clearRepeatableJobs(this.expiryQueue);
    await this.clearRepeatableJobs(this.chatLockQueue);
    await this.clearRepeatableJobs(this.timeoutQueue);
    await this.clearRepeatableJobs(this.paymentExpiryQueue);
    await this.clearRepeatableJobs(this.bookingCompleteQueue);

    // Add fresh repeatable jobs
    await this.expiryQueue.add(
      'run',
      {},
      { repeat: { pattern: '0 0 * * *' }, jobId: 'booking-expiry-daily' },
    );

    await this.chatLockQueue.add(
      'run',
      {},
      { repeat: { every: 15 * 60 * 1000 }, jobId: 'chat-lock-15m' },
    );

    await this.timeoutQueue.add(
      'run',
      {},
      { repeat: { every: 5 * 60 * 1000 }, jobId: 'therapist-timeout-5m' },
    );

    await this.paymentExpiryQueue.add(
      'run',
      {},
      { repeat: { every: 5 * 60 * 1000 }, jobId: 'payment-expiry-5m' },
    );

    // Auto-complete bookings when all sessions are finished - runs every 5 minutes
    await this.bookingCompleteQueue.add(
      'run',
      {},
      { repeat: { every: 5 * 60 * 1000 }, jobId: 'booking-complete-5m' },
    );
  }
}
