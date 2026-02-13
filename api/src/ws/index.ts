import type { ServerWebSocket } from "bun";
import type { WSEvent } from "shared";

export const clients = new Set<ServerWebSocket<unknown>>();

export function broadcast(event: WSEvent) {
  const message = JSON.stringify(event);
  for (const client of clients) {
    try {
      client.send(message);
    } catch {
      // Client may have disconnected; remove it
      clients.delete(client);
    }
  }
}

export function handleWsOpen(ws: ServerWebSocket<unknown>) {
  clients.add(ws);
}

export function handleWsClose(ws: ServerWebSocket<unknown>) {
  clients.delete(ws);
}

export function handleWsMessage(_ws: ServerWebSocket<unknown>, message: string | Buffer) {
  // Currently no client-to-server messages are handled.
  // Future: parse message and handle commands.
  console.log("WebSocket message received:", typeof message === "string" ? message : message.toString());
}
