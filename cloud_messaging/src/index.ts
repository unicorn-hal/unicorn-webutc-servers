import express from 'express';
import { SendMessage } from './module/send_message';

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use((_, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    next();
});

app.get('/', (_, res) => {
    res.send('Hello World!');
});
app.post('/send', async (req, res) => {
    const sendMessage = new SendMessage(req, res);
    await sendMessage.useToken();
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});