import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';

describe('AdminService manual payout', () => {
  const dataSourceStub: any = {};
  const notificationStub: any = {};

  it('should require adminNote', async () => {
    const walletService = { payoutSession: jest.fn() };
    const svc = new AdminService(dataSourceStub as any, notificationStub as any, walletService as any);
    await expect(svc.manualPayout({ sessionId: 's1', adminNote: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(walletService.payoutSession).not.toHaveBeenCalled();
  });

  it('should call walletService with adminNote', async () => {
    const walletService = { payoutSession: jest.fn().mockResolvedValue(undefined) };
    const svc = new AdminService(dataSourceStub as any, notificationStub as any, walletService as any);
    await svc.manualPayout({ sessionId: 's-session', adminNote: 'manual settlement' });
    expect(walletService.payoutSession).toHaveBeenCalledWith('s-session', {
      adminNote: 'manual settlement',
    });
  });

  it('topUpWallet should credit balance and log', async () => {
    const wallet = { id: 'w1', balance: '0' };
    const txRepo = {
      create: jest.fn((e: any) => e),
      save: jest.fn(async (e: any) => e),
    };
    const walletRepo = {
      findOne: jest.fn(async () => wallet),
      save: jest.fn(async (w: any) => w),
    };
    const dataSource: any = {
      transaction: async (fn: any) =>
        fn({
          getRepository: (entity: any) => {
            if (entity.name === 'Wallet') return walletRepo;
            if (entity.name === 'WalletTransaction') return txRepo;
            if (entity.name === 'AdminActionLog') return { create: jest.fn(), save: jest.fn() };
            return null;
          },
        }),
    };
    const walletService: any = { payoutSession: jest.fn() };
    const svc = new AdminService(dataSource, notificationStub as any, walletService);
    const tx = await svc.topUpWallet({ walletId: 'w1', amount: '50', adminNote: 'adjust' }, 'admin-1');
    expect(wallet.balance).toBe('50.00');
    expect(tx.category).toBe('ADJUSTMENT');
  });
});
