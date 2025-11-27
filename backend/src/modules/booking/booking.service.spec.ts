import { BookingService } from './booking.service';
import { SlotService } from './slot.service';
import { BadRequestException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { Package } from '../../domain/entities/package.entity';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { Wallet } from '../../domain/entities/wallet.entity';

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

  it('assertSlotAvailability should throw on overlap and use pessimistic lock', async () => {
    const qb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    };
    const sessionRepo: any = {
      createQueryBuilder: () => qb,
    };
    await expect(
      service['assertSlotAvailability'](sessionRepo, 'therapist-1', new Date()),
    ).rejects.toThrow('Slot tidak tersedia');
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
  });

  it('should run createBooking in SERIALIZABLE and reject overlapping slot', async () => {
    const qb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    };
    const repos = {
      user: { findOne: jest.fn().mockResolvedValue({ id: 'u1', isProfileComplete: true } as User) },
      therapist: {
        findOne: jest.fn().mockResolvedValue({
          id: 't1',
          user: { id: 'u2', fcmToken: null },
        } as Therapist),
      },
      package: { findOne: jest.fn().mockResolvedValue(null as Package | null) },
      booking: {
        create: jest.fn((data: any) => ({ id: 'b1', ...data } as Booking)),
        save: jest.fn(async (b: Booking) => b),
      },
      session: {
        createQueryBuilder: jest.fn(() => qb),
        create: jest.fn((data: any) => ({ id: 's1', ...data } as Session)),
        save: jest.fn(async (s: Session[]) => s),
      },
      wallet: {
        findOne: jest.fn().mockResolvedValue(null as Wallet | null),
        create: jest.fn((data: any) => ({ id: 'w1', ...data } as Wallet)),
        save: jest.fn(async (w: Wallet) => w),
      },
    };

    let capturedIsolation: any;
    const dataSource = {
      transaction: async (isolation: any, fn: any) => {
        capturedIsolation = isolation;
        const manager = {
          getRepository: (entity: any) => {
            switch (entity.name) {
              case 'User':
                return repos.user;
              case 'Therapist':
                return repos.therapist;
              case 'Package':
                return repos.package;
              case 'Booking':
                return repos.booking;
              case 'Session':
                return repos.session;
              case 'Wallet':
                return repos.wallet;
              default:
                return null;
            }
          },
        };
        return fn(manager);
      },
    };

    const service = new BookingService(
      dataSource as any,
      slotService,
      dummyNotifier,
      dummyChat,
    );

    const scheduledAt = new Date(Date.now() + 2 * 3600 * 1000);
    scheduledAt.setMinutes(0, 0, 0);
    const input = {
      userId: 'u1',
      therapistId: 't1',
      packageId: null,
      lockedAddress: 'addr',
      totalPrice: '100.00',
      adminFeeAmount: '0',
      therapistNetTotal: '100.00',
      bookingType: 'REGULAR' as const,
      scheduledAt,
    };

    await expect(service.createBooking(input as any)).rejects.toThrow(BadRequestException);
    expect(capturedIsolation).toBe('SERIALIZABLE');
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
  });
});
