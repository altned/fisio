import { BookingService } from './booking.service';
import { SlotService } from './slot.service';

describe('BookingService utilities', () => {
  const dummyDataSource: any = {};
  const slotService = new SlotService();
  const dummyNotifier: any = { notifyTherapistInstantBooking: jest.fn(), notifyBookingAccepted: jest.fn(), notifyBookingDeclined: jest.fn() };
  const dummyChat: any = { openRoom: jest.fn(), closeRoom: jest.fn() };
  const service = new BookingService(dummyDataSource, slotService, dummyNotifier, dummyChat);

  it('computeRespondBy should return +5m for instant and +30m for regular', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const instant = service.computeRespondBy('INSTANT');
    const regular = service.computeRespondBy('REGULAR');
    expect(instant.getTime()).toBeGreaterThanOrEqual(now + 5 * 60 * 1000);
    expect(regular.getTime()).toBeGreaterThanOrEqual(now + 30 * 60 * 1000);
    (Date.now as jest.Mock).mockRestore?.();
  });

  it('computeChatLockAt should add 24h to scheduled time', () => {
    const scheduled = new Date('2024-01-01T08:00:00Z');
    const lock = service.computeChatLockAt(scheduled);
    expect(lock.toISOString()).toBe(new Date(scheduled.getTime() + 24 * 3600 * 1000).toISOString());
  });
});
