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
    }

    /**
     * Send a message to a device using the Firebase Cloud Messaging token.
     */
    async useToken() {
        const token = this.req.headers['x-firebase-cloud-messaging-token'] as string;
        console.log('Token:', token);

        try {
            const res = await this.cloudMessagingService.send(this.title, this.body, token);
            this.res.status(200).send(res);
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
            this.res.status(200).send(res);
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
            this.res.status(200).send(res);
        } catch (error) {
            this.res.status(500).send(error);
        }
    }

    /**
     * Subscribe a device to a topic.
     */
    async subscribeToTopic() {
        const token = this.req.headers['x-firebase-cloud-messaging-token'] as string;
        const topic = this.req.body.topic as string;
        console.log('Token:', token);
        console.log('Topic:', topic);

        if (!this.cloudMessagingService.topics.includes(topic)) {
            this.res.status(400).send('Invalid topic');
            return;
        }

        try {
            const res = await this.cloudMessagingService.subscribeToTopic(token, topic);
            this.res.status(200).send(res);
        } catch (error) {
            this.res.status(500).send(error);
        }
    }
}