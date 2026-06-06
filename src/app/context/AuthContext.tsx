import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { api } from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";
import type { PublicUser } from "../lib/protocol";

const TOKEN_KEY = "wif_token";

interface AuthCtx {
  user: PublicUser | null;
  socket: Socket | null;
  /** initial token restore finished */
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  guestLogin: (nick: string) => Promise<void>;
  logout: () => void;
  /** ensure there is a connected identity (creates a guest if needed) */
  ensureIdentity: (nick?: string) => Promise<Socket>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ready, setReady] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const applySession = useCallback(async (token: string, u: PublicUser): Promise<Socket> => {
    localStorage.setItem(TOKEN_KEY, token);
    tokenRef.current = token;
    setUser(u);
    const s = await connectSocket(token);
    socketRef.current = s;
    setSocket(s);
    return s;
  }, []);

  // restore session on boot
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setReady(true);
      return;
    }
    (async () => {
      const u = await api.me(token);
      if (u) {
        try {
          await applySession(token, u);
        } catch {
          /* socket will retry on next action */
        }
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      setReady(true);
    })();
  }, [applySession]);

  const login = useCallback(
    async (username: string, password: string) => {
      const { token, user: u } = await api.login(username, password);
      await applySession(token, u);
    },
    [applySession]
  );

  const register = useCallback(
    async (username: string, password: string) => {
      const { token, user: u } = await api.register(username, password);
      await applySession(token, u);
    },
    [applySession]
  );

  const guestLogin = useCallback(
    async (nick: string) => {
      const { token, user: u } = await api.guest(nick);
      await applySession(token, u);
    },
    [applySession]
  );

  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.removeItem(TOKEN_KEY);
    tokenRef.current = null;
    socketRef.current = null;
    setSocket(null);
    setUser(null);
  }, []);

  const ensureIdentity = useCallback(
    async (nick?: string): Promise<Socket> => {
      if (socketRef.current?.connected) return socketRef.current;
      if (tokenRef.current) {
        const s = await connectSocket(tokenRef.current);
        socketRef.current = s;
        setSocket(s);
        return s;
      }
      const { token, user: u } = await api.guest(nick || "Guest");
      return applySession(token, u);
    },
    [applySession]
  );

  return (
    <Ctx.Provider
      value={{ user, socket, ready, login, register, guestLogin, logout, ensureIdentity }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
