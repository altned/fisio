import { SessionService } from './session.service';
import { SlotService } from './slot.service';
import { ForbiddenException } from '@nestjs/common';

const ONE_HOUR_MS = 60 * 60 * 1000;

describe('SessionService cancel logic', () => {
  const payoutQueue = { add: jest.fn() };
  const walletService: any = { payoutSession: jest.fn() };
  const slotService = new SlotService();

  function makeRepo<T extends { id: string }>(items: T[], extra: Record<string, any> = {}) {
    return {
      items,
      findOne: jest.fn(async ({ where }: any) => {
        if (where?.id) return items.find((i) => i.id === where.id);
        return undefined;
      }),
      save: jest.fn(async (entity: T) => {
        const idx = items.findIndex((i) => i.id === entity.id);
        if (idx >= 0) items[idx] = { ...(items[idx] as any), ...(entity as any) };
        return entity;
      }),
      ...extra,
    };
  }

  function makeDataSource(sessionRepo: any, bookingRepo: any): any {
    return {
      transaction: async (fn: any) =>
        fn({
          getRepository: (entity: any) => {
            if (entity.name === 'Session') return sessionRepo;
            if (entity.name === 'Booking') return bookingRepo;
            return null;
          },
        }),
      getRepository: (entity: any) => {
        if (entity.name === 'Session') return sessionRepo;
        if (entity.name === 'Booking') return bookingRepo;
        return null;
      },
    };
  }

  it('should set PENDING_SCHEDULING when cancel >1h before schedule and not enqueue payout', async () => {
    const booking = { id: 'b1', sessions: [] as any[] };
    const session = {
      id: 's1',
      booking,
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + ONE_HOUR_MS * 2),
    };
    booking.sessions = [session];

    const sessionRepo = makeRepo([session]);
    const bookingRepo = makeRepo([booking]);
    const dataSource = makeDataSource(sessionRepo, bookingRepo);

    const svc = new SessionService(dataSource as any, walletService, slotService, payoutQueue as any);
    const result = await svc.cancelSession('s1');

    expect(result.status).toBe('PENDING_SCHEDULING');
    expect(result.scheduledAt).toBeNull();
    expect(payoutQueue.add).not.toHaveBeenCalled();
  });

  it('completeSession should set COMPLETED and update chat lock when last session', async () => {
    const booking = {
      id: 'b3',
      sessions: [] as any[],
      chatLockedAt: null as Date | null,
    };
    const session = {
      id: 's3',
      booking,
      status: 'SCHEDULED',
      scheduledAt: new Date('2024-01-01T08:00:00Z'),
    };
    booking.sessions = [session];
    const sessionRepo = makeRepo([session]);
    const bookingRepo = makeRepo([booking], {
      findOne: jest.fn(async ({ where }: any) => {
        if (where?.id === booking.id) return booking;
        return undefined;
      }),
      save: jest.fn(async (b: any) => b),
    });
    const dataSource = makeDataSource(sessionRepo, bookingRepo);
    const svc = new SessionService(dataSource as any, walletService, slotService, payoutQueue as any);
    const result = await svc.completeSession('s3');
    expect(result.status).toBe('COMPLETED');
    expect(booking.chatLockedAt?.toISOString()).toBe(
      new Date(new Date('2024-01-01T08:00:00Z').getTime() + 24 * 3600 * 1000).toISOString(),
    );
  });

  it('should set FORFEITED when cancel <1h and enqueue payout', async () => {
    const booking = { id: 'b2', sessions: [] as any[] };
    const session = {
      id: 's2',
      booking,
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    booking.sessions = [session];

    const sessionRepo = makeRepo([session]);
    const bookingRepo = makeRepo([booking]);
    const dataSource = makeDataSource(sessionRepo, bookingRepo);

    const svc = new SessionService(dataSource as any, walletService, slotService, payoutQueue as any);
    const result = await svc.cancelSession('s2');

    expect(result.status).toBe('FORFEITED');
    expect(payoutQueue.add).toHaveBeenCalledWith(
      'run',
      { sessionId: 's2' },
      expect.objectContaining({ attempts: 3 }),
    );
  });

  it('expirePendingSessions should return affected count', async () => {
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 5 }),
    };
    const dataSource = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    const svc = new SessionService(dataSource as any, walletService, slotService, payoutQueue as any);
    const affected = await svc.expirePendingSessions();
    expect(affected).toBe(5);
    expect(qb.update).toHaveBeenCalled();
  });

  it('schedulePendingSession should align slot, lock and set status', async () => {
    const booking = { id: 'b-lock', therapist: { id: 't-lock' }, user: { id: 'u-patient' } };
    const session = {
      id: 's-lock',
      booking,
      therapist: { id: 't-lock' },
      status: 'PENDING_SCHEDULING',
      scheduledAt: null,
    };
    const qb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };
    const sessionRepo = {
      findOne: jest.fn().mockResolvedValue(session),
      createQueryBuilder: jest.fn(() => qb),
      save: jest.fn(async (s: any) => s),
    };
    const dataSource: any = {
      transaction: async (_iso: any, fn: any) =>
        fn({
          getRepository: (entity: any) => {
            if (entity.name === 'Session') return sessionRepo;
            return null;
          },
        }),
    };
    const svc = new SessionService(dataSource, walletService, slotService, payoutQueue as any);
    const scheduledAt = new Date(Date.now() + ONE_HOUR_MS * 2);
    scheduledAt.setMinutes(0, 0, 0);
    const result = await svc.schedulePendingSession('s-lock', scheduledAt, {
      id: 'u-patient',
      role: 'PATIENT',
    });
    expect(result.status).toBe('SCHEDULED');
    expect(result.scheduledAt).toEqual(scheduledAt);
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
  });

  it('schedulePendingSession should reject patient scheduling others booking', async () => {
    const booking = { id: 'b-lock', therapist: { id: 't-lock' }, user: { id: 'owner' } };
    const session = {
      id: 's-lock',
      booking,
      therapist: { id: 't-lock' },
      status: 'PENDING_SCHEDULING',
      scheduledAt: null,
    };
    const sessionRepo = {
      findOne: jest.fn().mockResolvedValue(session),
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      }),
    };
    const dataSource: any = {
      transaction: async (_iso: any, fn: any) =>
        fn({
          getRepository: (entity: any) => {
            if (entity.name === 'Session') return sessionRepo;
            return null;
          },
        }),
    };
    const svc = new SessionService(dataSource, walletService, slotService, payoutQueue as any);
    const scheduledAt = new Date(Date.now() + ONE_HOUR_MS * 2);
    scheduledAt.setMinutes(0, 0, 0);
    await expect(
      svc.schedulePendingSession('s-lock', scheduledAt, { id: 'other-user', role: 'PATIENT' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
