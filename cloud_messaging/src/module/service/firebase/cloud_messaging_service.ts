import { getMessaging } from "firebase-admin/messaging";
import { FirebaseCore } from "../core/firebase_core";

export class CloudMessagingService extends FirebaseCore {
    async sendMessage(title: string, body: string, token: string) {
        const message = {
            notification: {
                title,
                body,
            },
            token,
        };

        console.log('Sending message...');

        try {
            const res = await getMessaging().send(message);
            console.log('Successfully sent message:', res);
            return res;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
}