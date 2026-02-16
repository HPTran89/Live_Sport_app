import { WebSocket, WebSocketServer } from "ws";

// sending a JSON object to a specific client
function sendJson(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN) return;
    
    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for(const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) continue;
        sendJson(client, payload);
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ 
        server, // no need to specify the port, it will use the same as the HTTP server
        path: "/ws", // websocket path only
        maxPayload: 1024 * 1024, // 1MB
    });

    wss.on('connection', (socket) => {
        console.log('New WebSocket connection established');
        sendJson(socket, { type: "welcome", message: "Welcome to the WebSocket server!" });

        socket.on("error", console.error);
    });
    
    function broadcastMatchCreated(match) {
        broadcast(wss, { type: "match_created", data: match });
    }

    return { broadcastMatchCreated }
}
