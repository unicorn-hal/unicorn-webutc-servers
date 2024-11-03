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

                // 全てのユーザーにpeersリストを送信
                broadcastPeers();
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
                sendPeers(socket, parsedMessage.userId);
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
                // 全てのユーザーにpeersリストを送信
                broadcastPeers();
                break;
            }
        }
    });
});

// 全てのユーザーにpeersリストを送信する関数
function broadcastPeers() {
    const peers = Object.keys(users);
    const message = JSON.stringify({ type: 'peers', peers });
    for (const userId in users) {
        const socket = users[userId];
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        }
    }
}

// 特定のソケットにpeersリストを送信する関数
function sendPeers(socket: WS, userId: string) {
    const peers = Object.keys(users).filter(id => id !== userId);
    const message = JSON.stringify({ type: 'peers', peers });
    socket.send(message);
}
