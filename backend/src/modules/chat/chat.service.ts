import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  async openRoom(bookingId: string) {
    // TODO: integrate with chat provider
    // eslint-disable-next-line no-console
    console.log(`[Chat] Open room for booking ${bookingId}`);
  }

  async closeRoom(bookingId: string) {
    // TODO: integrate with chat provider
    // eslint-disable-next-line no-console
    console.log(`[Chat] Close room for booking ${bookingId}`);
  }
}
