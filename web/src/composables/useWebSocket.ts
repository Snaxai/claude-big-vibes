import type { WSEvent } from "shared";

export function useWebSocket(onEvent: (event: WSEvent) => void) {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws`;

    ws = new WebSocket(url);

    ws.addEventListener("message", (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        onEvent(data);
      } catch {
        // Ignore malformed messages
      }
    });

    ws.addEventListener("close", () => {
      if (!closed) {
        reconnectTimer = setTimeout(connect, 2000);
      }
    });

    ws.addEventListener("error", () => {
      ws?.close();
    });
  }

  connect();

  function close() {
    closed = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    ws?.close();
  }

  return { close };
}
