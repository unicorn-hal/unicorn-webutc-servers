import express from 'express';
import { SendMessage } from './module/send_message';
import { CloudMessagingService } from './module/service/firebase/cloud_messaging_service';

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
app.post('/multicast', async (req, res) => {
    const sendMessage = new SendMessage(req, res);
    await sendMessage.useMulticast();
});
app.post('/topic', async (req, res) => {
    const sendMessage = new SendMessage(req, res);
    await sendMessage.useTopic();
});
app.post('/subscribe', async (req, res) => {
    const sendMessage = new SendMessage(req, res);
    await sendMessage.subscribeToTopic();
});
app.get('/subscribe/topic', async (_, res) => {
    const messgagingService = new CloudMessagingService();
    const topics = messgagingService.topics;
    if (!topics) {
        res.status(404).send({ message: 'No topics found' });
        return;
    }
    res.status(200).send({ data: topics });
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});