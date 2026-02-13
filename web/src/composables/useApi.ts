const BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function useApi() {
  async function get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async function put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async function del<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  }

  return { get, post, put, del };
}
