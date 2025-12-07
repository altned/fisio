import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ChatService {
  private firestore: admin.firestore.Firestore | null;
  private collection: string;

  constructor() {
    this.firestore = this.initFirebase();
    this.collection = process.env.FIREBASE_CHAT_COLLECTION || 'chats';
  }

  async openRoom(bookingId: string, participants: string[] = []) {
    if (!this.firestore) {
      // eslint-disable-next-line no-console
      console.warn('[Chat] Firestore not initialized, skipping openRoom');
      return;
    }
    await this.firestore.collection(this.collection).doc(bookingId).set(
      {
        bookingId,
        participants,
        status: 'OPEN',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  async closeRoom(bookingId: string) {
    if (!this.firestore) {
      // eslint-disable-next-line no-console
      console.warn('[Chat] Firestore not initialized, skipping closeRoom');
      return;
    }
    await this.firestore.collection(this.collection).doc(bookingId).set(
      {
        status: 'CLOSED',
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  private initFirebase(): admin.firestore.Firestore | null {
    const credPath = process.env.FIREBASE_CREDENTIALS_PATH;
    if (!credPath) {
      // eslint-disable-next-line no-console
      console.warn('[Chat] FIREBASE_CREDENTIALS_PATH not set, Firestore disabled');
      return null;
    }

    const fullPath = path.resolve(credPath);

    // Check if file exists before attempting to read
    if (!fs.existsSync(fullPath)) {
      // eslint-disable-next-line no-console
      console.warn(`[Chat] Firebase credentials file not found at ${fullPath}, Firestore disabled`);
      return null;
    }

    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const serviceAccount = JSON.parse(raw);
      const app =
        admin.apps.length > 0
          ? admin.app()
          : admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          });
      return app.firestore();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[Chat] Failed to init Firestore, chat room persistence disabled', err);
      return null;
    }
  }
}
