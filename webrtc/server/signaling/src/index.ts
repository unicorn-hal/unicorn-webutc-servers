import WebSocket, { Server, WebSocket as WS } from 'ws';

const server = new Server({ port: 3000 });

server.on('connection', (socket: WS) => {
    console.log('Client connected');

    socket.on('message', (message: string) => {
        // メッセージをすべてのクライアントにブロードキャスト
        server.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== socket) {
                client.send(message);
            }
        });
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});
