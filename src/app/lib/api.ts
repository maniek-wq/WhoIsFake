import type { PublicUser } from "./protocol";

export const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ?? "http://localhost:4000";

interface AuthResponse {
  token: string;
  user: PublicUser;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

export const api = {
  register: (username: string, password: string) =>
    post<AuthResponse>("/api/auth/register", { username, password }),
  login: (username: string, password: string) =>
    post<AuthResponse>("/api/auth/login", { username, password }),
  guest: (nick: string) => post<AuthResponse>("/api/auth/guest", { nick }),
  async me(token: string): Promise<PublicUser | null> {
    try {
      const res = await fetch(`${SERVER_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { user: PublicUser };
      return data.user;
    } catch {
      return null;
    }
  },
};
