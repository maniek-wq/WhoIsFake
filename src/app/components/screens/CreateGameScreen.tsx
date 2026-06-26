import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { GameInput } from "../ui/GameInput";
import { ArrowLeft, Copy, Users, Zap, Check, Type, Palette, Ghost, Brush, VenetianMask } from "lucide-react";
import { useI18n } from "../../i18n/LanguageContext";
import type { RoomMode } from "../../lib/protocol";

interface CreateGameScreenProps {
  onBack: () => void;
  onGameCreated: (roomCode: string, playerName: string, maxPlayers: number, mode: RoomMode) => void;
  /** when set, the user is signed in — skip the nickname field and use this name */
  loggedInName?: string;
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function CreateGameScreen({ onBack, onGameCreated, loggedInName }: CreateGameScreenProps) {
  const { t } = useI18n();
  const isSignedIn = Boolean(loggedInName);
  const [nickname, setNickname] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [mode, setMode] = useState<RoomMode>("classic");
  const [roomCode] = useState(generateRoomCode);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = () => {
    if (isSignedIn) {
      onGameCreated(roomCode, loggedInName!, maxPlayers, mode);
      return;
    }
    if (!nickname.trim()) {
      setError(t("create.errNick"));
      return;
    }
    if (nickname.trim().length < 2) {
      setError(t("create.errNickShort"));
      return;
    }
    onGameCreated(roomCode, nickname.trim(), maxPlayers, mode);
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-blue-600/6 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </button>

        <div className="mb-8">
          <h1 className="text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2rem", fontWeight: 700 }}>
            {t("create.title")}
          </h1>
          <p className="text-slate-500 text-sm">{t("create.subtitle")}</p>
        </div>

        <GlassCard glow="blue" className="p-6 space-y-6">
          {/* Room code */}
          <div>
            <label className="text-sm font-medium text-slate-400 uppercase tracking-wider block mb-2">
              {t("create.roomCode")}
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 rounded-xl bg-[#0F172A]/80 border border-blue-500/30 flex items-center justify-center">
                <span
                  className="text-2xl font-bold tracking-[0.3em] text-blue-300"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {roomCode}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleCopy}
                className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/25 hover:bg-blue-600/25 transition-all flex items-center justify-center text-blue-400"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </motion.button>
            </div>
            <p className="text-xs text-slate-600 mt-2">{t("create.share")}</p>
          </div>

          {/* Nickname (only for guests; signed-in users use their account name) */}
          {isSignedIn ? (
            <div>
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider block mb-2">
                {t("create.nickname")}
              </label>
              <div className="px-4 py-3 rounded-xl bg-[#0F172A]/80 border border-white/10 text-slate-200 font-semibold">
                {loggedInName}
              </div>
            </div>
          ) : (
            <GameInput
              label={t("create.nickname")}
              placeholder={t("create.nicknamePlaceholder")}
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setError(""); }}
              error={error}
              maxLength={16}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          )}

          {/* Game mode */}
          <div>
            <label className="text-sm font-medium text-slate-400 uppercase tracking-wider block mb-3">
              {t("create.mode")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "classic" as RoomMode, icon: <Type className="w-5 h-5" />, label: t("create.modeClassic"), desc: t("create.modeClassicDesc") },
                { id: "drawing" as RoomMode, icon: <Palette className="w-5 h-5" />, label: t("create.modeDrawing"), desc: t("create.modeDrawingDesc") },
                { id: "collab" as RoomMode, icon: <Brush className="w-5 h-5" />, label: t("create.modeCollab"), desc: t("create.modeCollabDesc") },
                { id: "undercover" as RoomMode, icon: <VenetianMask className="w-5 h-5" />, label: t("create.modeUndercover"), desc: t("create.modeUndercoverDesc") },
                { id: "szpont" as RoomMode, icon: <Ghost className="w-5 h-5" />, label: t("create.modeSzpont"), desc: t("create.modeSzpontDesc") },
              ]).map((m) => (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mode === m.id
                      ? "bg-blue-600/15 border-blue-500/50 shadow-[0_0_16px_rgba(37,99,235,0.25)]"
                      : "bg-[#1E293B] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-1 ${mode === m.id ? "text-blue-300" : "text-slate-300"}`}>
                    {m.icon}
                    <span className="font-semibold">{m.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{m.desc}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Player count */}
          <div>
            <label className="text-sm font-medium text-slate-400 uppercase tracking-wider block mb-3">
              {t("create.maxPlayers")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMaxPlayers(n)}
                  className={`
                    py-2.5 rounded-xl border font-semibold transition-all
                    flex flex-col items-center gap-1
                    ${maxPlayers === n
                      ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_16px_rgba(37,99,235,0.4)]"
                      : "bg-[#1E293B] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                    }
                  `}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{n}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <GameButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCreate}
            icon={<Zap className="w-5 h-5" />}
          >
            {t("create.createRoom")}
          </GameButton>
        </GlassCard>

        <p className="text-center text-xs text-slate-600 mt-4">
          {t("create.autoHost")}
        </p>
      </motion.div>
    </div>
  );
}
