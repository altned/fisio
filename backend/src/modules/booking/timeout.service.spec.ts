import { TimeoutService } from './timeout.service';

describe('TimeoutService', () => {
  it('should cancel overdue bookings and notify therapist & patient', async () => {
    const bookings = [
      {
        id: 'b1',
        status: 'PAID',
        therapistRespondBy: new Date(Date.now() - 1000),
        therapistAcceptedAt: null,
        therapist: { id: 't1', user: { fcmToken: null } },
        user: { id: 'u1', fcmToken: null },
      },
    ];

    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(bookings),
      }),
      save: jest.fn(async (b: any) => b),
    };

    const notification = {
      notifyBookingTimeout: jest.fn(),
    };

    const dataSource: any = {
      getRepository: (entity: any) => {
        if (entity.name === 'Booking') return repo;
        return null;
      },
    };

    const svc = new TimeoutService(dataSource, notification as any);
    const cancelled = await svc.handleTherapistTimeouts();

    expect(cancelled).toBe(1);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'CANCELLED', refundStatus: 'PENDING' }),
    );
    expect(notification.notifyBookingTimeout).toHaveBeenCalledTimes(2); // therapist + patient
  });
});
