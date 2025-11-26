import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ChatLockService } from '../../booking/chat-lock.service';
import { ChatService } from '../../chat/chat.service';

@Processor('chat-lock')
export class ChatLockProcessor extends WorkerHost {
  constructor(
    private readonly chatLockService: ChatLockService,
    private readonly chatService: ChatService,
  ) {
    super();
  }

  async process(): Promise<void> {
    const lockedBookings = await this.chatLockService.lockChats();
    for (const bookingId of lockedBookings) {
      await this.chatService.closeRoom(bookingId);
    }
    // eslint-disable-next-line no-console
    console.log(`[Cron] Chat lock processed, locked count: ${lockedBookings.length}`);
  }
}
