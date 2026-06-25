import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { GameInput } from "../ui/GameInput";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { Send, Vote, Target, MessageSquare, History, AlertCircle, Users } from "lucide-react";
import type { Player, ClueEntry } from "../../types";
import type { RoomMode } from "../../lib/protocol";
import { useI18n } from "../../i18n/LanguageContext";
import { DrawingCanvas } from "../ui/DrawingCanvas";

interface GameScreenProps {
  round: number;
  mode: RoomMode;
  players: Player[];
  currentPlayerId: string;
  isImpostor: boolean;
  secretWord?: string;
  category: string;
  hint?: string;
  clueHistory: ClueEntry[];
  hasSubmittedThisRound: boolean;
  currentTurnId: string | null;
  turnOrder: string[];
  onSubmitClue: (content: { text?: string; image?: string }) => void;
  onStartVote: () => void;
  onGuessWord: () => void;
}

export function GameScreen({
  round,
  mode,
  players,
  currentPlayerId,
  isImpostor,
  secretWord,
  category,
  hint,
  clueHistory,
  hasSubmittedThisRound,
  currentTurnId,
  turnOrder,
  onSubmitClue,
  onStartVote,
  onGuessWord,
}: GameScreenProps) {
  const { t } = useI18n();
  const isDrawing = mode === "drawing";
  const categoryLabel = category ? t(`category.${category}`) : "";
  const [clue, setClue] = useState("");
  const [activeTab, setActiveTab] = useState<"clues" | "players">("clues");

  const currentRoundClues = clueHistory.filter((c) => c.round === round);
  const pastClues = clueHistory.filter((c) => c.round < round);

  const handleSubmit = () => {
    const trimmed = clue.trim();
    // single word only
    if (!trimmed || /\s/.test(trimmed)) return;
    onSubmitClue({ text: trimmed });
    setClue("");
  };

  const activePlayers = players.filter((p) => !p.isEliminated);
  const me = players.find((p) => p.id === currentPlayerId);
  const allSubmitted =
    activePlayers.length > 0 && activePlayers.every((p) => p.hasSubmittedThisRound);
  const canStartVote = allSubmitted && !me?.isEliminated;
  const isMyTurn = currentTurnId === currentPlayerId;
  const currentTurnPlayer = players.find((p) => p.id === currentTurnId);
  const turnPosition = (id: string) => {
    const i = turnOrder.indexOf(id);
    return i === -1 ? null : i + 1;
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-cyan-500/4 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`
            px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
            ${isImpostor ? "bg-red-500/15 text-red-400 border border-red-500/25" : "bg-blue-500/15 text-blue-300 border border-blue-500/25"}
          `}>
            {isImpostor ? t("game.impostor") : t("game.player")}
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-slate-500">
            {t("game.category")}: <span className="text-slate-300">{categoryLabel}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-[#1E293B] border border-white/10 text-sm font-bold text-white">
            {t("game.round")} {round}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Sidebar — Players */}
        <aside className="hidden md:flex flex-col w-64 border-r border-white/5 p-4 gap-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            {t("game.players")} ({activePlayers.length})
          </p>
          {players.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: player.isEliminated ? 0.35 : 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard
                className={`p-3 flex items-center gap-3 border ${
                  player.id === currentTurnId
                    ? "border-amber-400/40 bg-amber-400/5"
                    : player.id === currentPlayerId
                    ? "border-blue-500/25 bg-blue-500/5"
                    : player.isEliminated
                    ? "border-white/5"
                    : "border-white/8"
                }`}
              >
                <PlayerAvatar
                  name={player.name}
                  index={idx}
                  size="sm"
                  isHost={player.isHost}
                  isEliminated={player.isEliminated}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {!player.isEliminated && turnPosition(player.id) && (
                      <span className="text-[10px] text-slate-500 font-mono">#{turnPosition(player.id)}</span>
                    )}
                    <span className={`text-sm font-medium truncate ${player.isEliminated ? "line-through text-slate-600" : "text-slate-200"}`}>
                      {player.name}
                    </span>
                    {player.id === currentPlayerId && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded">{t("common.you")}</span>
                    )}
                  </div>
                  <p className={`text-xs ${player.id === currentTurnId && !player.isEliminated ? "text-amber-400" : "text-slate-600"}`}>
                    {player.isEliminated
                      ? t("game.eliminated")
                      : player.hasSubmittedThisRound
                      ? t("game.submitted")
                      : player.id === currentTurnId
                      ? t("game.givingClue")
                      : t("game.thinking")}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {/* Role reminder */}
          <div className={`mt-auto p-3 rounded-xl border text-xs ${
            isImpostor
              ? "bg-red-500/8 border-red-500/20 text-red-300"
              : "bg-blue-500/8 border-blue-500/20 text-blue-300"
          }`}>
            {isImpostor ? (
              <>
                <p className="font-semibold mb-1">{t("game.yourHint")}</p>
                <p className="text-red-200/70">{hint}</p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1">{t("game.secretWord")}</p>
                <p className="text-blue-200/80 tracking-wider font-bold" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                  {secretWord}
                </p>
              </>
            )}
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-y-auto">
          {/* Mobile tabs */}
          <div className="md:hidden flex gap-2">
            {(["clues", "players"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-[#1E293B] text-slate-400 border border-white/10"
                }`}
              >
                {tab === "clues" ? <><MessageSquare className="w-4 h-4 inline mr-1" />{t("game.cluesTab")}</> : <><Users className="w-4 h-4 inline mr-1" />{t("game.players")}</>}
              </button>
            ))}
          </div>

          {/* Round clues */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <h3 className="text-white text-sm font-semibold">{t("game.roundClues", { n: round })}</h3>
              <span className="text-xs text-slate-600">({currentRoundClues.length}/{activePlayers.length})</span>
            </div>

            {currentRoundClues.length === 0 ? (
              <GlassCard className="p-8 text-center border-dashed border-white/8">
                <p className="text-slate-600 text-sm">{isDrawing ? t("draw.empty") : t("game.noClues")}</p>
              </GlassCard>
            ) : (
              <div className={`grid gap-2 ${isDrawing ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
                <AnimatePresence>
                  {currentRoundClues.map((entry, idx) => {
                    const player = players.find((p) => p.id === entry.playerId);
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.07, type: "spring" }}
                      >
                        <GlassCard className="p-3 text-center border-white/10">
                          {player && (
                            <div className="flex justify-center mb-2">
                              <PlayerAvatar
                                name={player.name}
                                index={players.indexOf(player)}
                                size="sm"
                              />
                            </div>
                          )}
                          <p className="text-xs text-slate-500 mb-1 truncate">{player?.name}</p>
                          {entry.image ? (
                            <img src={entry.image} alt="" className="w-full rounded-lg border border-white/10 bg-[#0b1220]" />
                          ) : (
                            <p className="font-bold text-slate-100" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.05rem" }}>
                              {entry.clue}
                            </p>
                          )}
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Past rounds history */}
          {pastClues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-slate-500" />
                <p className="text-sm text-slate-500">{t("game.prevRounds")}</p>
              </div>
              <div className="space-y-2">
                {Array.from(new Set(pastClues.map((c) => c.round)))
                  .sort((a, b) => b - a)
                  .map((r) => (
                    <details key={r} className="group">
                      <summary className="cursor-pointer px-4 py-2 rounded-xl bg-[#1E293B]/50 border border-white/5 text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2">
                        <span>{t("game.roundCluesShort", { n: r })}</span>
                        <span className="text-xs text-slate-600">({pastClues.filter((c) => c.round === r).length})</span>
                      </summary>
                      <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2 px-2">
                        {pastClues.filter((c) => c.round === r).map((entry) => {
                          const player = players.find((p) => p.id === entry.playerId);
                          return (
                            <div key={entry.id} className="p-2 rounded-xl bg-[#111827]/50 border border-white/5 text-center">
                              <p className="text-xs text-slate-600 mb-0.5 truncate">{player?.name}</p>
                              {entry.image ? (
                                <img src={entry.image} alt="" className="w-full rounded border border-white/10" />
                              ) : (
                                <p className="text-sm font-semibold text-slate-400">{entry.clue}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="mt-auto">
            <GlassCard glow={isMyTurn && !hasSubmittedThisRound ? "blue" : "none"} className="p-4">
              {hasSubmittedThisRound ? (
                <div className="text-center py-2">
                  <p className="text-emerald-400 font-semibold mb-1">{t("game.clueSubmitted")}</p>
                  <p className="text-sm text-slate-500">{t("game.waitingOthers")}</p>
                </div>
              ) : !isMyTurn ? (
                <div className="text-center py-3">
                  <p className="text-amber-400 font-semibold mb-1">
                    {t("game.turnOf", { name: currentTurnPlayer?.name ?? "" })}
                  </p>
                  <p className="text-sm text-slate-500">{t("game.turnWait")}</p>
                </div>
              ) : isDrawing ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Send className="w-4 h-4 text-blue-400" />
                    <p className="text-sm font-semibold text-slate-300">{t("draw.yourDrawing", { n: round })}</p>
                  </div>
                  {isImpostor && (
                    <div className="flex items-start gap-2 p-2.5 mb-3 rounded-lg bg-orange-500/8 border border-orange-500/20">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-300/80">{t("draw.impostorReminder", { hint: hint ?? "" })}</p>
                    </div>
                  )}
                  <DrawingCanvas onSubmit={(image) => onSubmitClue({ image })} />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Send className="w-4 h-4 text-blue-400" />
                    <p className="text-sm font-semibold text-slate-300">{t("game.yourClue", { n: round })}</p>
                  </div>
                  {isImpostor && (
                    <div className="flex items-start gap-2 p-2.5 mb-3 rounded-lg bg-orange-500/8 border border-orange-500/20">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-300/80">
                        {t("game.impostorReminder", { hint: hint ?? "" })}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <GameInput
                      placeholder={t("game.onePlaceholder")}
                      value={clue}
                      onChange={(e) => setClue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="flex-1"
                      maxLength={30}
                    />
                    <GameButton variant="primary" onClick={handleSubmit} disabled={!clue.trim()}>
                      <Send className="w-4 h-4" />
                    </GameButton>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Action buttons */}
            <div className="flex gap-3 mt-3">
              <GameButton
                variant="secondary"
                size="md"
                onClick={onStartVote}
                disabled={!canStartVote}
                icon={<Vote className="w-4 h-4" />}
              >
                {t("game.startVote")}
              </GameButton>
              {isImpostor && (
                <GameButton
                  variant="orange"
                  size="md"
                  onClick={onGuessWord}
                  icon={<Target className="w-4 h-4" />}
                >
                  {t("game.guessWord")}
                </GameButton>
              )}
            </div>
            {!allSubmitted && !me?.isEliminated && (
              <p className="text-xs text-slate-500 mt-2 text-center">{t("game.voteLocked")}</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
