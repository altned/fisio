import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export type NotificationPayload = {
  userId?: string;
  therapistId?: string;
  title: string;
  body: string;
  deviceToken?: string;
  meta?: Record<string, unknown>;
};

@Injectable()
export class NotificationService {
  private messaging: admin.messaging.Messaging | null;
  private waWebhookUrl?: string;

  constructor() {
    this.messaging = this.initFirebase();
    this.waWebhookUrl = process.env.WA_WEBHOOK_URL;
  }

  async notifyTherapistInstantBooking(payload: NotificationPayload) {
    await this.dispatch('InstantBooking', payload);
  }

  async notifyBookingAccepted(payload: NotificationPayload) {
    await this.dispatch('BookingAccepted', payload);
  }

  async notifyBookingDeclined(payload: NotificationPayload) {
    await this.dispatch('BookingDeclined', payload);
  }

  async notifyBookingTimeout(payload: NotificationPayload) {
    await this.dispatch('BookingTimeout', payload);
  }

  async notifyPayoutSuccess(payload: NotificationPayload) {
    await this.dispatch('PayoutSuccess', payload);
  }

  async notifySwapTherapist(payload: NotificationPayload) {
    await this.dispatch('SwapTherapist', payload);
  }

  private async dispatch(event: string, payload: NotificationPayload) {
    if (this.messaging && payload.deviceToken) {
      try {
        await this.messaging.send({
          token: payload.deviceToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: this.toStringRecord(payload.meta),
        });
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[Notification:${event}] FCM failed`, err);
      }
    }
    if (this.waWebhookUrl) {
      try {
        const fetchMod = await import('node-fetch');
        const fetchFn = (fetchMod as any).default ?? fetchMod;
        await fetchFn(this.waWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            title: payload.title,
            body: payload.body,
            meta: payload.meta,
          }),
        });
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[Notification:${event}] WA webhook failed`, err);
      }
    }
    this.log(event, payload);
  }

  private log(event: string, payload: NotificationPayload) {
    // eslint-disable-next-line no-console
    console.log(`[Notification:${event}]`, payload);
  }

  private initFirebase(): admin.messaging.Messaging | null {
    const credPath = process.env.FIREBASE_CREDENTIALS_PATH;
    if (!credPath) {
      // eslint-disable-next-line no-console
      console.warn('[Notification] FIREBASE_CREDENTIALS_PATH not set, FCM disabled');
      return null;
    }
    try {
      const fullPath = path.resolve(credPath);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const serviceAccount = JSON.parse(raw);
      const app =
        admin.apps.length > 0
          ? admin.app()
          : admin.initializeApp({
              credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            });
      return app.messaging();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[Notification] Failed to init FCM, fallback to log only', err);
      return null;
    }
  }

  private toStringRecord(meta?: Record<string, unknown>): Record<string, string> | undefined {
    if (!meta) return undefined;
    return Object.entries(meta).reduce<Record<string, string>>((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {});
  }
}
