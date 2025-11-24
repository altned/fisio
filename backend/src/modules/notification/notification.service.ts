import { Injectable } from '@nestjs/common';

export type NotificationPayload = {
  userId?: string;
  therapistId?: string;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
};

@Injectable()
export class NotificationService {
  async notifyTherapistInstantBooking(payload: NotificationPayload) {
    // TODO: integrate FCM/WA
    this.log('InstantBooking', payload);
  }

  async notifyBookingAccepted(payload: NotificationPayload) {
    this.log('BookingAccepted', payload);
  }

  async notifyBookingDeclined(payload: NotificationPayload) {
    this.log('BookingDeclined', payload);
  }

  async notifyBookingTimeout(payload: NotificationPayload) {
    this.log('BookingTimeout', payload);
  }

  async notifyPayoutSuccess(payload: NotificationPayload) {
    this.log('PayoutSuccess', payload);
  }

  async notifySwapTherapist(payload: NotificationPayload) {
    this.log('SwapTherapist', payload);
  }

  private log(event: string, payload: NotificationPayload) {
    // eslint-disable-next-line no-console
    console.log(`[Notification:${event}]`, payload);
  }
}
