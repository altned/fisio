import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ChatLockService } from '../../booking/chat-lock.service';

@Processor('chat-lock')
export class ChatLockProcessor {
  constructor(private readonly chatLockService: ChatLockService) {}

  async process(_job: Job) {
    const locked = await this.chatLockService.lockChats();
    // eslint-disable-next-line no-console
    console.log(`[Cron] Chat lock processed, locked: ${locked}`);
  }
}
