import { SessionService } from './session.service';

const ONE_HOUR_MS = 60 * 60 * 1000;

describe('SessionService cancel logic', () => {
  const payoutQueue = { add: jest.fn() };
  const walletService: any = { payoutSession: jest.fn() };

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

    const svc = new SessionService(dataSource as any, walletService, payoutQueue as any);
    const result = await svc.cancelSession('s1');

    expect(result.status).toBe('PENDING_SCHEDULING');
    expect(result.scheduledAt).toBeNull();
    expect(payoutQueue.add).not.toHaveBeenCalled();
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

    const svc = new SessionService(dataSource as any, walletService, payoutQueue as any);
    const result = await svc.cancelSession('s2');

    expect(result.status).toBe('FORFEITED');
    expect(payoutQueue.add).toHaveBeenCalledWith(
      'run',
      { sessionId: 's2' },
      expect.objectContaining({ attempts: 3 }),
    );
  });
});
