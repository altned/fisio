import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ChatLockService } from '../../booking/chat-lock.service';

@Processor('chat-lock')
export class ChatLockProcessor extends WorkerHost {
  constructor(private readonly chatLockService: ChatLockService) {
    super();
  }

  async process(): Promise<void> {
    const locked = await this.chatLockService.lockChats();
    // eslint-disable-next-line no-console
    console.log(`[Cron] Chat lock processed, locked: ${locked}`);
  }
}
