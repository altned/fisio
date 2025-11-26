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
});
