import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobService implements OnModuleInit {
  constructor(
    @InjectQueue('booking-expiry') private readonly expiryQueue: Queue,
    @InjectQueue('chat-lock') private readonly chatLockQueue: Queue,
    @InjectQueue('therapist-timeout') private readonly timeoutQueue: Queue,
    @InjectQueue('payment-expiry') private readonly paymentExpiryQueue: Queue,
  ) { }

  async onModuleInit() {
    await this.ensureRepeatableJobs();
  }

  private async ensureRepeatableJobs() {
    await this.expiryQueue.removeRepeatableByKey('*');
    await this.chatLockQueue.removeRepeatableByKey('*');
    await this.timeoutQueue.removeRepeatableByKey('*');
    await this.paymentExpiryQueue.removeRepeatableByKey('*');

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
  }
}
