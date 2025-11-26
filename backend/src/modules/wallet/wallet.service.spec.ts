import { WalletService } from './wallet.service';

describe('WalletService', () => {
  const notificationStub: any = { notifyPayoutSuccess: jest.fn() };

  function makeRepo<T extends { id?: string }>(data: T[], overrides: Partial<any> = {}) {
    return {
      data,
      findOne: jest.fn(async (opts: any) => {
        const where = opts?.where;
        if (!where) return undefined;
        if (where.id) return data.find((d: any) => d.id === where.id);
        if (where.booking?.id) return data.find((d: any) => (d as any).booking?.id === where.booking.id);
        if (where.therapist?.id) return data.find((d: any) => (d as any).therapist?.id === where.therapist.id);
        return undefined;
      }),
      count: jest.fn(async (opts?: any) => {
        if (opts?.where?.booking?.id) {
          return data.filter((d: any) => (d as any).booking?.id === opts.where.booking.id).length;
        }
        return data.length;
      }),
      save: jest.fn(async (entity: T) => {
        const idx = data.findIndex((d: any) => d.id === (entity as any).id);
        if (idx >= 0) {
          data[idx] = { ...(data[idx] as any), ...(entity as any) };
          return data[idx];
        }
        data.push(entity);
        return entity;
      }),
      create: jest.fn((e: Partial<T>) => ({ ...(e as any) })),
      get dataSnapshot() {
        return data;
      },
      ...overrides,
    };
  }

  const bookingRepo = makeRepo<any>([
    {
      id: 'b1',
      therapistNetTotal: '100.00',
      therapist: { id: 't1', user: { fcmToken: null } },
    },
  ]);
  const sessionRepo = makeRepo<any>([
    {
      id: 's1',
      booking: { id: 'b1' },
      status: 'COMPLETED',
      sequenceOrder: 1,
      isPayoutDistributed: false,
    },
  ]);
  const walletRepo = makeRepo<any>([{ id: 'w1', therapist: { id: 't1' }, balance: '0' }]);
  const txRepo = makeRepo<any>([]);

  const dataSourceStub: any = {
    transaction: async (fn: any) => fn({
      getRepository: (entity: any) => {
        if (entity.name === 'Session') return sessionRepo;
        if (entity.name === 'Booking') return bookingRepo;
        if (entity.name === 'Wallet') return walletRepo;
        if (entity.name === 'WalletTransaction') return txRepo;
        return null;
      },
    }),
    getRepository: (entity: any) => {
      if (entity.name === 'Session') return sessionRepo;
      if (entity.name === 'Booking') return bookingRepo;
      if (entity.name === 'Wallet') return walletRepo;
      if (entity.name === 'WalletTransaction') return txRepo;
      return null;
    },
  };

  it('should payout once and set isPayoutDistributed, idempotent on second call', async () => {
    const svc = new WalletService(dataSourceStub as any, notificationStub);
    await svc.payoutSession('s1');
    expect(sessionRepo.data[0].isPayoutDistributed).toBe(true);
    expect(walletRepo.data[0].balance).toBe('100.00');
    expect(txRepo.data.length).toBe(1);

    // second call should do nothing
    await svc.payoutSession('s1');
    expect(walletRepo.data[0].balance).toBe('100.00');
    expect(txRepo.data.length).toBe(1);
  });
});
