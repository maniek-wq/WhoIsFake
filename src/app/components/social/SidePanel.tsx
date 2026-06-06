import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GameButton } from "../ui/GameButton";
import { GameInput } from "../ui/GameInput";
import { useAuth } from "../../context/AuthContext";
import { useFriends } from "../../context/FriendsContext";
import { useToast } from "../../context/ToastContext";
import { emitAck } from "../../lib/socket";
import type { Ack, FriendStatus } from "../../lib/protocol";
import {
  X,
  LogOut,
  UserPlus,
  Check,
  Trash2,
  Send,
  Trophy,
  Gamepad2,
  Clock,
} from "lucide-react";

const statusDot: Record<FriendStatus, string> = {
  online: "bg-emerald-400",
  "in-game": "bg-orange-400",
  offline: "bg-slate-600",
};
const statusLabel: Record<FriendStatus, string> = {
  online: "Online",
  "in-game": "In game",
  offline: "Offline",
};

function AccountSection() {
  const { user, login, register, logout } = useAuth();
  const { addToast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const registered = user && !user.isGuest;

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "login") await login(username.trim(), password);
      else await register(username.trim(), password);
      setUsername("");
      setPassword("");
      addToast("success", mode === "login" ? "Welcome back!" : "Account created!");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  if (registered) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-2xl">
            {user!.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.15rem" }}>
              {user!.username}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Gamepad2 className="w-3 h-3" />{user!.stats.played} played</span>
              <span className="flex items-center gap-1 text-amber-400/80"><Trophy className="w-3 h-3" />{user!.stats.wins} wins</span>
            </div>
          </div>
          <button onClick={logout} title="Log out" className="text-slate-500 hover:text-red-400 transition-colors p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3">
      {user?.isGuest && (
        <p className="text-xs text-slate-500">
          Playing as guest <span className="text-slate-300 font-semibold">{user.username}</span>. Sign in to add friends and track stats.
        </p>
      )}
      <div className="flex gap-2">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              mode === m ? "bg-blue-600 text-white" : "bg-[#1E293B] text-slate-400 border border-white/10"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <GameInput
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        maxLength={20}
      />
      <GameInput
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && username && password && submit()}
        maxLength={64}
      />
      <GameButton variant="primary" size="md" fullWidth disabled={busy || !username || !password} onClick={submit}>
        {mode === "login" ? "Sign In" : "Create Account"}
      </GameButton>
    </div>
  );
}

function FriendsSection() {
  const { user } = useAuth();
  const { payload, sendRequest, respond, removeFriend, invite } = useFriends();
  const { addToast } = useToast();
  const [addName, setAddName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user || user.isGuest) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
        <UserPlus className="w-6 h-6 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Sign in to add friends and invite them to your games.</p>
      </div>
    );
  }

  const onAdd = async () => {
    if (!addName.trim()) return;
    setBusy(true);
    const ok = await sendRequest(addName.trim());
    if (ok) setAddName("");
    setBusy(false);
  };

  const joinFriend = async (code: string | null) => {
    if (!code) return;
    const res = await emitAck<Ack<{ code: string }>>("room:join", { code });
    if (!res.ok) addToast("error", res.error);
  };

  return (
    <div className="space-y-4">
      {/* add friend */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add Friend</p>
        <div className="flex gap-2">
          <GameInput
            placeholder="Username"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            className="flex-1"
            maxLength={20}
          />
          <GameButton variant="primary" onClick={onAdd} disabled={busy || !addName.trim()}>
            <UserPlus className="w-4 h-4" />
          </GameButton>
        </div>
      </div>

      {/* incoming requests */}
      {payload.incoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Requests ({payload.incoming.length})
          </p>
          <div className="space-y-2">
            {payload.incoming.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-2.5">
                <span className="text-xl">{r.fromAvatar}</span>
                <span className="flex-1 text-sm font-medium text-slate-200 truncate">{r.fromUsername}</span>
                <button onClick={() => respond(r.id, true)} className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 transition-all">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => respond(r.id, false)} className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/25 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* friends list */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Friends ({payload.friends.length})
        </p>
        {payload.friends.length === 0 ? (
          <p className="text-sm text-slate-600 py-3 text-center">No friends yet. Add someone above!</p>
        ) : (
          <div className="space-y-2">
            {payload.friends.map((f) => (
              <div key={f.id} className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-2.5">
                <div className="relative">
                  <span className="text-xl">{f.avatar}</span>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111827] ${statusDot[f.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{f.username}</p>
                  <p className="text-xs text-slate-500">{statusLabel[f.status]}</p>
                </div>
                {f.status === "in-game" && f.roomCode && (
                  <button onClick={() => joinFriend(f.roomCode)} title="Join their game" className="px-2 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold hover:bg-orange-500/25 transition-all">
                    Join
                  </button>
                )}
                {f.status !== "offline" && (
                  <button onClick={() => invite(f.id)} title="Invite to your lobby" className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center hover:bg-blue-500/25 transition-all">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => removeFriend(f.id)} title="Remove friend" className="w-8 h-8 rounded-lg text-slate-600 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* outgoing */}
      {payload.outgoing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pending</p>
          <div className="space-y-2">
            {payload.outgoing.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-2.5 opacity-70">
                <span className="text-xl">{r.fromAvatar}</span>
                <span className="flex-1 text-sm text-slate-300 truncate">{r.fromUsername}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />Sent</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SidePanel() {
  const { panelOpen, closePanel, pendingInvite, clearInvite } = useFriends();
  const { addToast } = useToast();

  const joinInvite = async () => {
    if (!pendingInvite) return;
    const res = await emitAck<Ack<{ code: string }>>("room:join", { code: pendingInvite.code });
    if (!res.ok) addToast("error", res.error);
    clearInvite();
    closePanel();
  };

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#0F172A]/95 backdrop-blur-xl border-l border-white/10 flex flex-col"
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-bold" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.3rem" }}>
                Account & Friends
              </h2>
              <button onClick={closePanel} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {pendingInvite && (
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
                  <p className="text-sm text-orange-200 mb-3">
                    <strong>{pendingInvite.fromUsername}</strong> invited you to room{" "}
                    <span className="font-bold tracking-wider">{pendingInvite.code}</span>
                  </p>
                  <div className="flex gap-2">
                    <GameButton variant="orange" size="sm" fullWidth onClick={joinInvite}>Join</GameButton>
                    <GameButton variant="ghost" size="sm" onClick={clearInvite}>Dismiss</GameButton>
                  </div>
                </div>
              )}
              <AccountSection />
              <FriendsSection />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
