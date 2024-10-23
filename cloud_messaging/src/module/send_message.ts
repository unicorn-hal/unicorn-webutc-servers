import { Request, Response } from 'express';
import { CloudMessagingService } from './service/firebase/cloud_messaging_service';
export class SendMessage {
    private req: Request;
    private res: Response;
    private cloudMessagingService: CloudMessagingService;
    private title: string;
    private body: string;

    constructor(req: Request, res: Response) {
        this.req = req;
        this.res = res;
        this.cloudMessagingService = new CloudMessagingService();
        this.title = this.req.body.title;
        this.body = this.req.body.body;

        console.log('Title:', this.title);
        console.log('Body:', this.body);
    }

    /**
     * Send a message to a device using the Firebase Cloud Messaging token.
     */
    async useToken() {
        const token = this.req.headers['x-firebase-cloud-messaging-token'] as string;
        console.log('Token:', token);

        try {
            const res = await this.cloudMessagingService.send(this.title, this.body, token);
            this.res.send(res);
        } catch (error) {
            this.res.status(500).send(error);
        }
    }

    /**
     * Send a message to multiple devices using the Firebase Cloud Messaging tokens.
     */
    async useMulticast() {
        const tokens = this.req.body.tokens as string[];
        console.log('Tokens:', tokens);

        try {
            const res = await this.cloudMessagingService.multicast(this.title, this.body, tokens);
            this.res.send(res);
        } catch (error) {
            this.res.status(500).send(error);
        }
    }

    /**
     * Send a message to a topic using the Firebase Cloud Messaging topic.
     */
    async useTopic() {
        const topic = this.req.body.topic as string;
        console.log('Topic:', topic);

        try {
            const res = await this.cloudMessagingService.sendToTopic(this.title, this.body, topic);
            this.res.send(res);
        } catch (error) {
            this.res.status(500).send(error);
        }
    }
}
