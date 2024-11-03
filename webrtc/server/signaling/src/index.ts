import WebSocket, { Server, WebSocket as WS } from 'ws';

const server = new Server({ port: 3000 });

// ユーザーIDとソケットをマッピングするオブジェクト
const users: { [key: string]: WS } = {};

server.on('connection', (socket: WS) => {
    console.log('Client connected');

    socket.on('message', (message: string) => {
        const parsedMessage = JSON.parse(message);

        switch (parsedMessage.type) {
            case 'register':
                // ユーザーIDを登録
                const userId = parsedMessage.userId;
                users[userId] = socket;
                console.log(`User registered: ${userId}`);
                break;
            case 'offer':
            case 'answer':
            case 'candidate':
                // ターゲットユーザーにメッセージを送信
                const targetId = parsedMessage.targetId;
                const targetSocket = users[targetId];
                if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
                    console.log(`Sending ${parsedMessage.type} to ${targetId}`);
                    targetSocket.send(message);
                }
                break;
            case 'getPeers':
                // 接続中のユーザーIDリストを送信
                const peers = Object.keys(users).filter(id => id !== parsedMessage.userId);
                socket.send(JSON.stringify({ type: 'peers', peers }));
                break;
            default:
                console.log('Unknown message type:', parsedMessage.type);
                break;
        }
    });

    socket.on('close', () => {
        // 切断時にユーザーを削除
        for (const userId in users) {
            if (users[userId] === socket) {
                delete users[userId];
                console.log(`User disconnected: ${userId}`);
                break;
            }
        }
    });
});
