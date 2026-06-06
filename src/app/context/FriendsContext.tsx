import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { emitAck } from "../lib/socket";
import type { Ack, FriendsPayload } from "../lib/protocol";

interface PendingInvite {
  fromUsername: string;
  code: string;
}

interface FriendsCtx {
  payload: FriendsPayload;
  panelOpen: boolean;
  pendingInvite: PendingInvite | null;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  refresh: () => void;
  sendRequest: (username: string) => Promise<boolean>;
  respond: (requestId: string, accept: boolean) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  invite: (friendId: string) => Promise<void>;
  clearInvite: () => void;
}

const EMPTY: FriendsPayload = { friends: [], incoming: [], outgoing: [] };
const Ctx = createContext<FriendsCtx | null>(null);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { socket, user } = useAuth();
  const { addToast } = useToast();
  const [payload, setPayload] = useState<FriendsPayload>(EMPTY);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);

  // wire socket-driven friend updates + invites
  useEffect(() => {
    if (!socket) {
      setPayload(EMPTY);
      return;
    }
    const onUpdate = (p: FriendsPayload) => setPayload(p);
    const onInvite = (p: PendingInvite) => {
      setPendingInvite(p);
      addToast("info", `${p.fromUsername} invited you to room ${p.code}`);
    };
    socket.on("friends:update", onUpdate);
    socket.on("friends:invite", onInvite);

    // initial fetch (registered users only)
    if (user && !user.isGuest) {
      emitAck<Ack<FriendsPayload>>("friends:list")
        .then((res) => {
          if (res.ok) setPayload(res.data);
        })
        .catch(() => {});
    }

    return () => {
      socket.off("friends:update", onUpdate);
      socket.off("friends:invite", onInvite);
    };
  }, [socket, user, addToast]);

  const refresh = useCallback(() => {
    emitAck<Ack<FriendsPayload>>("friends:list")
      .then((res) => res.ok && setPayload(res.data))
      .catch(() => {});
  }, []);

  const sendRequest = useCallback(
    async (username: string): Promise<boolean> => {
      try {
        const res = await emitAck<Ack<{}>>("friends:request", { username });
        if (!res.ok) {
          addToast("error", res.error);
          return false;
        }
        addToast("success", `Friend request sent to ${username}`);
        return true;
      } catch {
        addToast("error", "Could not send request");
        return false;
      }
    },
    [addToast]
  );

  const respond = useCallback(
    async (requestId: string, accept: boolean) => {
      const res = await emitAck<Ack<{}>>("friends:respond", { requestId, accept });
      if (!res.ok) addToast("error", res.error);
      else addToast(accept ? "success" : "info", accept ? "Friend added!" : "Request declined");
    },
    [addToast]
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      const res = await emitAck<Ack<{}>>("friends:remove", { friendId });
      if (!res.ok) addToast("error", res.error);
    },
    [addToast]
  );

  const invite = useCallback(
    async (friendId: string) => {
      const res = await emitAck<Ack<{}>>("friends:invite", { friendId });
      if (!res.ok) addToast("error", res.error);
      else addToast("success", "Invite sent");
    },
    [addToast]
  );

  return (
    <Ctx.Provider
      value={{
        payload,
        panelOpen,
        pendingInvite,
        openPanel: () => setPanelOpen(true),
        closePanel: () => setPanelOpen(false),
        togglePanel: () => setPanelOpen((o) => !o),
        refresh,
        sendRequest,
        respond,
        removeFriend,
        invite,
        clearInvite: () => setPendingInvite(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useFriends(): FriendsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFriends must be used within FriendsProvider");
  return ctx;
}
