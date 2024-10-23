import { getMessaging } from "firebase-admin/messaging";
import { FirebaseCore } from "../core/firebase_core";

export class CloudMessagingService extends FirebaseCore {
    async send(title: string, body: string, token: string) {
        const message = {
            notification: {
                title,
                body,
            },
            token: token,
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

    async multicast(title: string, body: string, tokens: string[]) {
        const message = {
            notification: {
                title,
                body,
            },
            tokens: tokens,
        };

        console.log('Sending multicast message...');

        try {
            const res = await getMessaging().sendEachForMulticast(message);
            console.log('Successfully sent multicast message:', res);
            return res;
        } catch (error) {
            console.error('Error sending multicast message:', error);
            throw error;
        }
    }

    async sendToTopic(title: string, body: string, topic: string) {
        const message = {
            data: {
                title,
                body,
            },
            topic: topic,
        };

        console.log('Sending message to topic...');

        try {
            const res = await getMessaging().send(message);
            console.log('Successfully sent message to topic:', res);
            return res;
        } catch (error) {
            console.error('Error sending message to topic:', error);
            throw error;
        }
    }
}