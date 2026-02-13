type Handler = (req: Request, params: Record<string, string>) => Promise<Response> | Response;

interface Route {
  method: string;
  pattern: string;
  paramNames: string[];
  regex: RegExp;
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  private addRoute(method: string, path: string, handler: Handler) {
    const paramNames: string[] = [];
    const regexStr = path.replace(/:([^/]+)/g, (_match, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)";
    });
    const regex = new RegExp(`^${regexStr}$`);
    this.routes.push({ method, pattern: path, paramNames, regex, handler });
  }

  get(path: string, handler: Handler) {
    this.addRoute("GET", path, handler);
  }

  post(path: string, handler: Handler) {
    this.addRoute("POST", path, handler);
  }

  put(path: string, handler: Handler) {
    this.addRoute("PUT", path, handler);
  }

  delete(path: string, handler: Handler) {
    this.addRoute("DELETE", path, handler);
  }

  match(method: string, pathname: string): { handler: Handler; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = pathname.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}
