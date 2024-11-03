import WebSocket, { Server, WebSocket as WS } from 'ws';

const server = new Server({ port: 3000 });

server.on('connection', (socket: WS) => {
    console.log('Client connected');

    socket.on('message', (message: string) => {
        const parsedMessage = JSON.parse(message);

        switch (parsedMessage.type) {
            case 'offer':
            case 'answer':
            case 'candidate':
                // Broadcast the message to all clients except the sender
                server.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN && client !== socket) {
                        console.log('Broadcasting message:', message);
                        client.send(message);
                    }
                });
                break;
            default:
                console.log('Unknown message type:', parsedMessage.type);
        }
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});
