import { API_PORT } from "shared/config";
import { Router, json } from "./router";
import { handleWsOpen, handleWsClose, handleWsMessage } from "./ws";
import { registerExerciseRoutes } from "./routes/exercises";
import { registerWorkoutRoutes } from "./routes/workouts";
import { registerMealRoutes } from "./routes/meals";
import { registerBodyLogRoutes } from "./routes/bodylog";
import { registerProgramRoutes } from "./routes/programs";
import { registerSettingsRoutes } from "./routes/settings";

const router = new Router();

// Register all route modules
registerExerciseRoutes(router);
registerWorkoutRoutes(router);
registerMealRoutes(router);
registerBodyLogRoutes(router);
registerProgramRoutes(router);
registerSettingsRoutes(router);

const server = Bun.serve({
  port: API_PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined as unknown as Response;
      return json({ error: "WebSocket upgrade failed" }, 400);
    }

    // Route matching
    const match = router.match(req.method, url.pathname);
    if (!match) {
      return addCorsHeaders(json({ error: "Not found" }, 404));
    }

    try {
      const result = match.handler(req, match.params);
      if (result instanceof Promise) {
        return result.then(addCorsHeaders).catch((err) => {
          console.error("Route handler error:", err);
          return addCorsHeaders(json({ error: "Internal server error" }, 500));
        });
      }
      return addCorsHeaders(result);
    } catch (err) {
      console.error("Route handler error:", err);
      return addCorsHeaders(json({ error: "Internal server error" }, 500));
    }
  },
  websocket: {
    open: handleWsOpen,
    close: handleWsClose,
    message: handleWsMessage,
  },
});

function addCorsHeaders(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

console.log(`Fitness tracker API running on http://localhost:${server.port}`);
