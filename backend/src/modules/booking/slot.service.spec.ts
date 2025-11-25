import { SlotService } from './slot.service';

describe('SlotService', () => {
  const service = new SlotService();

  it('should validate slot alignment on :00 and :30', () => {
    expect(service.isSlotAligned(new Date('2024-01-01T08:00:00Z'))).toBe(true);
    expect(service.isSlotAligned(new Date('2024-01-01T08:30:00Z'))).toBe(true);
    expect(service.isSlotAligned(new Date('2024-01-01T08:15:00Z'))).toBe(false);
  });

  it('should check lead time > 60 minutes', () => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 60 * 1000);
    const in90 = new Date(now.getTime() + 90 * 60 * 1000);
    expect(service.hasValidLeadTime(in30)).toBe(false);
    expect(service.hasValidLeadTime(in90)).toBe(true);
  });

  it('should compute slot window with 90 minutes duration', () => {
    const base = new Date('2024-01-01T08:00:00Z');
    const { start, end } = service.slotWindow(base);
    expect(start.toISOString()).toBe(base.toISOString());
    expect(end.toISOString()).toBe(new Date(base.getTime() + 90 * 60 * 1000).toISOString());
  });
});
