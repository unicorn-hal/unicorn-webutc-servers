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
                // Broadcast the message to the target client
                server.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN && client !== socket) {
                        console.log('Broadcasting type:', parsedMessage.type);
                        client.send(message);
                    }
                });
                break;
            case 'getPeers':
                // Send the list of connected clients back to the requester
                const peers = Array.from(server.clients)
                    .filter(client => client !== socket && client.readyState === WebSocket.OPEN)
                    .map((client, index) => `peer${index}`);
                console.log('Sending peers:', peers);
                socket.send(JSON.stringify({ type: 'peers', peers }));
                break;
            default:
                console.log('Unknown message type:', parsedMessage.type);
        }
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});
