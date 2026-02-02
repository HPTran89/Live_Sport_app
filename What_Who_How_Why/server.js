import { WebSocket, WebSocketServer } from "ws";

// For production  app: you usually attach WS to an existing Express or Fastifi server so they can share the same port. One port, two protocols
// For demo app: It creates a zombie server that only exists to listen for that upgrade handshake Letting ws match the port is fine. 
const wss = new WebSocketServer({ port: 8080 });

// Connection Event
wss.on("connection", (socket, request) => {
    const ip = request.socket.remoteAddress;

    socket.on("message", (rawData) => {
        const message = rawData.toString();
        console.log({rawData});

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`Server Broadcast: ${message}`);
            }
        });
    });

    socket.on('error', (error) => {
        console.error(`WebSocket error from ${ip}:`, error);
    });

    socket.on('close', () => {
        console.log(`Connection closed from ${ip}`);
    });
});

console.log("webSocket server is live on ws://localhost:8080");