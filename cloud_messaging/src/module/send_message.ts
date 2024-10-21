import { Request, Response } from 'express';

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
        this.res.json({ message: 'Message sent' });
    }
}