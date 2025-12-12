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

  it('should cancel expired payment bookings, release slots, and notify patient', async () => {
    const bookings = [
      {
        id: 'b2',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentExpiryTime: new Date(Date.now() - 1000),
        user: { id: 'u2', fcmToken: null },
        sessions: [
          { id: 's1', status: 'SCHEDULED' },
          { id: 's2', status: 'PENDING_SCHEDULING' },
        ],
      },
    ];

    const bookingRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(bookings),
      }),
      save: jest.fn(async (b: any) => b),
    };

    const sessionRepo = {
      save: jest.fn(async (s: any) => s),
    };

    const notification = {
      notifyBookingTimeout: jest.fn(),
    };

    const dataSource: any = {
      getRepository: (entity: any) => {
        if (entity.name === 'Booking') return bookingRepo;
        if (entity.name === 'Session') return sessionRepo;
        return null;
      },
    };

    const svc = new TimeoutService(dataSource, notification as any);
    const cancelled = await svc.handlePaymentExpiry();

    expect(cancelled).toBe(1);
    expect(bookingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'CANCELLED', paymentStatus: 'EXPIRED' }),
    );
    // Both sessions should be expired to release slots
    expect(sessionRepo.save).toHaveBeenCalledTimes(2);
    expect(sessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'EXPIRED' }),
    );
    // Patient should be notified
    expect(notification.notifyBookingTimeout).toHaveBeenCalledTimes(1);
    expect(notification.notifyBookingTimeout).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u2',
        title: 'Pembayaran kedaluwarsa',
      }),
    );
  });
});

