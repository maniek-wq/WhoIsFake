import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { Copy, Check, Crown, Users, Wifi, ChevronRight, LogOut, Type, Palette, Ghost, Brush, Minus, Plus, X } from "lucide-react";
import type { Player } from "../../types";
import type { RoomMode } from "../../lib/protocol";
import { useI18n } from "../../i18n/LanguageContext";

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  maxPlayers: number;
  mode: RoomMode;
  onStartGame: () => void;
  onToggleReady: () => void;
  onChangeMode: (mode: RoomMode) => void;
  onChangeMaxPlayers: (n: number) => void;
  onKick: (playerId: string) => void;
  onLeave: () => void;
}

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;

export function LobbyScreen({
  roomCode,
  players,
  currentPlayerId,
  isHost,
  maxPlayers,
  mode,
  onStartGame,
  onToggleReady,
  onChangeMode,
  onChangeMaxPlayers,
  onKick,
  onLeave,
}: LobbyScreenProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const allReady = players.every((p) => p.isReady || p.id === currentPlayerId);
  const readyCount = players.filter((p) => p.isReady).length;
  const canStart = players.length >= 3 && allReady;

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-blue-600/6 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(37,99,235,0.4)]">
            <span className="text-white font-bold text-sm">?</span>
          </div>
          <span className="font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.15rem" }}>
            WhoIsFake
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-500">{t("lobby.connected")}</span>
          </div>
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-all text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("lobby.leave")}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 py-8 md:px-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Room Info */}
          <div className="lg:col-span-1 space-y-4">
            <GlassCard glow="blue" className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t("lobby.roomCode")}</p>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="flex-1 text-center py-2.5 rounded-xl bg-[#0F172A]/80 border border-blue-500/20 text-blue-300 tracking-[0.35em] font-bold"
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "1.3rem" }}
                >
                  {roomCode}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopy}
                  className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/25 hover:bg-blue-600/25 flex items-center justify-center text-blue-400 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </motion.button>
              </div>
              <p className="text-xs text-slate-600">{t("lobby.share")}</p>
            </GlassCard>

            {/* Game mode */}
            <GlassCard className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t("create.mode")}</p>
              {(() => {
                const MODES: { id: RoomMode; icon: typeof Type; label: string }[] = [
                  { id: "classic", icon: Type, label: t("create.modeClassic") },
                  { id: "drawing", icon: Palette, label: t("create.modeDrawing") },
                  { id: "collab", icon: Brush, label: t("create.modeCollab") },
                  { id: "szpont", icon: Ghost, label: t("create.modeSzpont") },
                ];
                if (!isHost) {
                  const cur = MODES.find((m) => m.id === mode) ?? MODES[0];
                  const Icon = cur.icon;
                  return (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">{cur.label}</span>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {MODES.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          onClick={() => onChangeMode(m.id)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                            mode === m.id
                              ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                              : "border-white/8 text-slate-400 hover:bg-white/5"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-semibold">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("lobby.players")}</span>
                </div>
                {isHost ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onChangeMaxPlayers(maxPlayers - 1)}
                      disabled={maxPlayers <= Math.max(MIN_PLAYERS, players.length)}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold min-w-[2.75rem] text-center">
                      <span className="text-blue-400">{players.length}</span>
                      <span className="text-slate-600">/{maxPlayers}</span>
                    </span>
                    <button
                      onClick={() => onChangeMaxPlayers(maxPlayers + 1)}
                      disabled={maxPlayers >= MAX_PLAYERS}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold">
                    <span className="text-blue-400">{players.length}</span>
                    <span className="text-slate-600">/{maxPlayers}</span>
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(players.length / maxPlayers) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from({ length: maxPlayers }).map((_, i) => {
                  const player = players[i];
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${
                        player
                          ? ""
                          : "border-2 border-dashed border-white/10"
                      } flex items-center justify-center text-xs text-slate-600`}
                    >
                      {player ? (
                        <PlayerAvatar name={player.name} index={i} size="sm" showStatus isReady={player.isReady} />
                      ) : (
                        "?"
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Ready status */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">{t("lobby.readyStatus")}</span>
                <span className="text-sm font-semibold text-emerald-400">{readyCount}/{players.length}</span>
              </div>
              {!isHost && (
                <GameButton
                  variant={currentPlayer?.isReady ? "secondary" : "primary"}
                  size="md"
                  fullWidth
                  onClick={onToggleReady}
                >
                  {currentPlayer?.isReady ? t("lobby.ready") : t("lobby.markReady")}
                </GameButton>
              )}
              {isHost && (
                <p className="text-xs text-slate-600">{t("lobby.hostControls")}</p>
              )}
            </GlassCard>
          </div>

          {/* Right — Player list + Start */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-white mb-3" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.3rem", fontWeight: 700 }}>
                {t("lobby.waitingPlayers")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {players.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <GlassCard
                        className={`p-4 flex items-center gap-4 border ${
                          player.id === currentPlayerId
                            ? "border-blue-500/30 bg-blue-500/5"
                            : "border-white/8"
                        }`}
                      >
                        <PlayerAvatar
                          name={player.name}
                          index={idx}
                          size="md"
                          isHost={player.isHost}
                          showStatus
                          isReady={player.isReady}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 truncate">
                              {player.name}
                            </span>
                            {player.id === currentPlayerId && (
                              <span className="text-xs bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded font-medium">{t("common.you")}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {player.isHost && (
                              <Crown className="w-3 h-3 text-amber-400" />
                            )}
                            <span className={`text-xs ${player.isReady ? "text-emerald-400" : "text-slate-600"}`}>
                              {player.isHost ? t("common.host") : player.isReady ? t("lobby.statusReady") : t("lobby.waiting")}
                            </span>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${player.isReady ? "bg-emerald-400" : "bg-slate-600"}`} />
                        {isHost && player.id !== currentPlayerId && (
                          <button
                            onClick={() => onKick(player.id)}
                            title={t("lobby.kick")}
                            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-500 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-all flex items-center justify-center flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </GlassCard>
                    </motion.div>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
                    <motion.div
                      key={`empty-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="p-4 rounded-2xl border border-dashed border-white/8 flex items-center gap-4 opacity-40">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center text-slate-600 text-sm">
                          ?
                        </div>
                        <span className="text-slate-600 text-sm">{t("lobby.waitingForPlayer")}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {isHost && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard glow={canStart ? "blue" : "none"} className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-white">{t("lobby.startTitle")}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {players.length < 3
                          ? t("lobby.needMore", { n: 3 - players.length })
                          : !allReady
                          ? t("lobby.waitingReady")
                          : t("lobby.allReady")}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </div>
                  <GameButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={onStartGame}
                    disabled={!canStart}
                  >
                    {t("lobby.startGame")} ({players.length}/{maxPlayers})
                  </GameButton>
                </GlassCard>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
