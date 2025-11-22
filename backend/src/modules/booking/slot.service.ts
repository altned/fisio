import { Injectable } from '@nestjs/common';

const SLOT_INTERVAL_MINUTES = 90;
const LEAD_TIME_MINUTES = 60;

@Injectable()
export class SlotService {
  isSlotAligned(date: Date): boolean {
    const minutes = date.getMinutes();
    return minutes === 0 || minutes === 30;
  }

  hasValidLeadTime(date: Date): boolean {
    const now = new Date();
    const leadMillis = LEAD_TIME_MINUTES * 60 * 1000;
    return date.getTime() - now.getTime() >= leadMillis;
  }

  slotWindow(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    const end = new Date(date.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000);
    return { start, end };
  }
}
