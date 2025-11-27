import { WalletService } from './wallet.service';

describe('WalletService', () => {
  const makeNotificationStub = () => ({ notifyPayoutSuccess: jest.fn() });

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
        const targetId = (entity as any).id ?? `auto-${data.length + 1}`;
        (entity as any).id = targetId;
        const idx = data.findIndex((d: any) => d.id === targetId);
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

  function buildFixture(opts?: {
    booking?: any;
    sessions?: any[];
    wallets?: any[];
    txRepo?: any;
  }) {
    const booking = opts?.booking ?? {
      id: 'b1',
      therapistNetTotal: '100.00',
      therapist: { id: 't1', user: { fcmToken: null } },
    };
    const bookingRepo = makeRepo<any>([booking]);
    const sessionRepo = makeRepo<any>(
      opts?.sessions ??
        [
          {
            id: 's1',
            booking: { id: booking.id },
            status: 'COMPLETED',
            sequenceOrder: 1,
            isPayoutDistributed: false,
          },
        ],
    );
    const walletRepo = makeRepo<any>(opts?.wallets ?? [
      { id: 'w1', therapist: booking.therapist, balance: '0' },
    ]);
    const txRepo = makeRepo<any>(opts?.txRepo ?? []);

    const dataSourceStub: any = {
      transaction: async (fn: any) =>
        fn({
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

    const svc = new WalletService(dataSourceStub as any, makeNotificationStub());
    return { svc, bookingRepo, sessionRepo, walletRepo, txRepo };
  }

  describe('payoutSession', () => {
    it('should payout once and set isPayoutDistributed, idempotent on second call', async () => {
      const { svc, sessionRepo, walletRepo, txRepo } = buildFixture();
      await svc.payoutSession('s1');
      expect(sessionRepo.data[0].isPayoutDistributed).toBe(true);
      expect(walletRepo.data[0].balance).toBe('100.00');
      expect(txRepo.data.length).toBe(1);

      // second call should do nothing
      await svc.payoutSession('s1');
      expect(walletRepo.data[0].balance).toBe('100.00');
      expect(txRepo.data.length).toBe(1);
    });

    it('should persist admin note when provided (manual payout)', async () => {
      const { svc, txRepo } = buildFixture();
      await svc.payoutSession('s1', { adminNote: 'manual adjustment' });
      expect(txRepo.data[0].adminNote).toBe('manual adjustment');
    });
  });

  describe('payoutSession pro-rata and idempotent', () => {
    it('should distribute pro-rata across multiple sessions and avoid double credit', async () => {
      const booking = {
        id: 'b2',
        therapistNetTotal: '200.00',
        therapist: { id: 't2', user: { fcmToken: null } },
      };
      const { svc, sessionRepo, walletRepo, txRepo } = buildFixture({
        booking,
        sessions: [
          {
            id: 's10',
            booking: { id: 'b2' },
            status: 'COMPLETED',
            sequenceOrder: 1,
            isPayoutDistributed: false,
          },
          {
            id: 's11',
            booking: { id: 'b2' },
            status: 'FORFEITED',
            sequenceOrder: 2,
            isPayoutDistributed: false,
          },
        ],
        wallets: [{ id: 'w2', therapist: booking.therapist, balance: '0' }],
      });

      await svc.payoutSession('s10');
      await svc.payoutSession('s10'); // idempotent
      await svc.payoutSession('s11');

      const wallet = walletRepo.data.find((w: any) => w.id === 'w2');
      expect(wallet?.balance).toBe('200.00'); // 100 per session
      expect(txRepo.data.length).toBe(2);
      expect(txRepo.data.map((t: any) => t.amount)).toEqual(['100.00', '100.00']);
      expect(sessionRepo.data.filter((s: any) => s.isPayoutDistributed).length).toBe(2);
    });
  });

  describe('getMonthlyIncome', () => {
    it('should return aggregated credit for current month', async () => {
      const txRepoMock = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ sum: '150.50' }),
        }),
      };
      const dsMock: any = {
        getRepository: (entity: any) => {
          if (entity.name === 'WalletTransaction') return txRepoMock;
          return null;
        },
      };
      const svc = new WalletService(dsMock, makeNotificationStub());
      const result = await svc.getMonthlyIncome('wallet-1');
      expect(result.monthIncome).toBe('150.50');
    });
  });
});
