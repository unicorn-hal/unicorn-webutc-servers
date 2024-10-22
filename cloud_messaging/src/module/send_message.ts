import { Request, Response } from 'express';
import { CloudMessagingService } from './service/firebase/cloud_messaging_service';
export class SendMessage {
    private req: Request;
    private res: Response;

    constructor(req: Request, res: Response) {
        this.req = req;
        this.res = res;
    }

    async handle() {
        const { title, body, token } = this.req.body;
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
