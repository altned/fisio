import { InjectQueue } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';

export class QueueEventsListener implements OnModuleInit {
  private payoutEvents?: QueueEvents;

  constructor(@InjectQueue('payout') private readonly payoutQueue: Queue) {}

  async onModuleInit() {
    this.payoutEvents = new QueueEvents('payout', {
      connection: this.payoutQueue.opts.connection,
    });
    this.payoutEvents.on('failed', ({ jobId, failedReason }) => {
      // eslint-disable-next-line no-console
      console.warn(`[Queue:payout] job ${jobId} failed: ${failedReason}`);
    });
    this.payoutEvents.on('delayed', ({ jobId, delay }) => {
      // eslint-disable-next-line no-console
      console.log(`[Queue:payout] job ${jobId} delayed by ${delay} ms`);
    });
  }
}
