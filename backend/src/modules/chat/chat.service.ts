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

    async getRoomInfo(bookingId: string) {
        if (!this.firestore) {
            return { bookingId, status: 'DISABLED', message: 'Chat tidak tersedia' };
        }
        const doc = await this.firestore.collection(this.collection).doc(bookingId).get();
        if (!doc.exists) {
            return { bookingId, status: 'NOT_FOUND', message: 'Chat room belum dibuka' };
        }
        return { bookingId, ...doc.data() };
    }

    async getMessages(bookingId: string, limit = 50) {
        if (!this.firestore) {
            return [];
        }
        const snapshot = await this.firestore
            .collection(this.collection)
            .doc(bookingId)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .limit(limit)
            .get();

        return snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
    }

    async sendMessage(
        bookingId: string,
        data: { senderId: string; senderName: string; text: string },
    ) {
        if (!this.firestore) {
            throw new Error('Chat tidak tersedia');
        }

        const messagesRef = this.firestore
            .collection(this.collection)
            .doc(bookingId)
            .collection('messages');

        const messageRef = messagesRef.doc();
        const message = {
            id: messageRef.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await messageRef.set(message);

        return {
            ...message,
            createdAt: new Date().toISOString(),
        };
    }

    private initFirebase(): admin.firestore.Firestore | null {
        const credPath = process.env.FIREBASE_CREDENTIALS_PATH;
        console.log('[Chat] Init Firebase with path:', credPath);
        if (!credPath) {
            console.warn('[Chat] FIREBASE_CREDENTIALS_PATH not set, Firestore disabled');
            return null;
        }

        const fullPath = path.resolve(credPath);
        console.log('[Chat] Resolved path:', fullPath);

        if (!fs.existsSync(fullPath)) {
            console.warn(`[Chat] Firebase credentials file not found at ${fullPath}, Firestore disabled`);
            return null;
        }

        try {
            const raw = fs.readFileSync(fullPath, 'utf8');
            const serviceAccount = JSON.parse(raw);
            console.log('[Chat] Parsed service account project:', serviceAccount.project_id);

            const app =
                admin.apps.length > 0
                    ? admin.app()
                    : admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
                    });
            console.log('[Chat] Firebase App initialized successfully');
            return app.firestore();
        } catch (err) {
            console.error('[Chat] Failed to init Firestore:', err);
            return null;
        }
    }
}
