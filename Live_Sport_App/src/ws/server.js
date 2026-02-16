import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

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

// this function will be imported and called in src/index.js to attach the WebSocket server to our existing HTTP server
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ 
        server, // no need to specify the port, it will use the same as the HTTP server
        path: "/ws", // websocket path only
        maxPayload: 1024 * 1024, // 1MB
    });

    wss.on('connection', async (socket, req) => {
        if(wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
                if(decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008; // 1013: Try Again Later, 1008: Policy Violation
                    const reason = decision.reason.isRateLimit() ? "Too Many Requests" : "Forbidden";
                    socket.close(code, reason);
                    return;
                }
            } catch (err) {
                console.error("Arcjet WebSocket protection error:", err);
                socket.close(1011,"server security error");
                return;
            }
        }
        socket.isAlive = true;
        socket.on('pong', () => socket.isAlive = true);

        sendJson(socket, { type: "welcome", message: "Welcome to the WebSocket server!" });
        socket.on("error", console.error);
    });

    // implementing a heartbeat mechanism to detect and close dead connections
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if(ws.isAlive === false )return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        })
    }, 30000);

    wss.on('close', () => clearInterval(interval));
    
    function broadcastMatchCreated(match) {
        broadcast(wss, { type: "match_created", data: match });
    }

    return { broadcastMatchCreated }
}
