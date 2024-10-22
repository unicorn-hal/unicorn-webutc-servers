import { Request, Response } from 'express';
import { CloudMessagingService } from './service/firebase/cloud_messaging_service';
export class SendMessage {
    private req: Request;
    private res: Response;

    constructor(req: Request, res: Response) {
        this.req = req;
        this.res = res;
    }

    /**
     * Send a message to a device using the Firebase Cloud Messaging token.
     */
    async useToken() {
        const { title, body } = this.req.body;
        const token = this.req.headers['x-firebase-cloud-messaging-token'] as string;
        console.log('Title:', title);
        console.log('Body:', body);
        console.log('Token:', token);

        try {
            const cloudMessagingService = new CloudMessagingService();
            const res = await cloudMessagingService.sendMessage(title, body, token);
            this.res.send(res);
        } catch (error) {
            this.res.status(500).send(error);
        }
    }
}
