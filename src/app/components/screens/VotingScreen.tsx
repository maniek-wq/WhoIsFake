import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { CountdownTimer } from "../ui/CountdownTimer";
import { Vote, AlertTriangle, LogOut } from "lucide-react";
import type { Player, ClueEntry } from "../../types";
import type { RoomMode } from "../../lib/protocol";
import { useI18n } from "../../i18n/LanguageContext";

interface VotingScreenProps {
  players: Player[];
  currentPlayerId: string;
  clueHistory: ClueEntry[];
  round: number;
  deadline: number;
  mode: RoomMode;
  canvas: string | null;
  onVote: (targetId: string) => void;
  onTimerEnd: () => void;
  onLeave: () => void;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function VotingScreen({
  players,
  currentPlayerId,
  clueHistory,
  round,
  deadline,
  mode,
  canvas,
  onVote,
  onTimerEnd,
  onLeave,
}: VotingScreenProps) {
  const { t } = useI18n();
  // selectedId holds the target player's id (its answer's author, or the player)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  // sync the countdown to the server's authoritative deadline
  const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

  // Collab builds one shared picture, so you vote on the suspected player there.
  // Other modes: vote on ANSWERS, anonymized — each other alive player's clue.
  const voteOnPlayers = mode === "collab";
  const otherPlayers = players.filter((p) => !p.isEliminated && p.id !== currentPlayerId);
  const votableClues = clueHistory
    .filter((c) => c.round === round)
    .filter((c) => {
      const author = players.find((p) => p.id === c.playerId);
      return Boolean(author) && !author!.isEliminated && c.playerId !== currentPlayerId;
    });

  const selectedIndex = votableClues.findIndex((c) => c.playerId === selectedId);
  const selectedClue = selectedIndex >= 0 ? votableClues[selectedIndex] : null;
  const selectedPlayer = players.find((p) => p.id === selectedId) ?? null;

  const handleVote = () => {
    if (!selectedId) return;
    setHasVoted(true);
    onVote(selectedId);
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center px-4 py-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[100px]" />
      </div>

      {/* Leave */}
      <button
        onClick={onLeave}
        title={t("lobby.leave")}
        className="fixed top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-all text-xs font-medium"
      >
        <LogOut className="w-3.5 h-3.5" />
        {t("lobby.leave")}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 150 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 mb-4"
          >
            <Vote className="w-7 h-7 text-orange-400" />
          </motion.div>
          <h2
            className="text-white mb-2"
            style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2rem", fontWeight: 700 }}
          >
            {t("voting.title")}
          </h2>
          <p className="text-slate-400 text-sm">{voteOnPlayers ? t("voting.pickPlayer") : t("voting.pickAnswer")}</p>
        </div>

        {/* Collab: the shared picture everyone built, for reference */}
        {voteOnPlayers && canvas && (
          <div className="mb-6">
            <img src={canvas} alt="" className="w-full max-w-md mx-auto rounded-xl border border-white/10 bg-white" />
          </div>
        )}

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <CountdownTimer seconds={secondsLeft} onComplete={onTimerEnd} variant="orange" size="lg" />
            <div>
              <p className="text-orange-300 font-semibold">{t("voting.secondsLeft")}</p>
              <p className="text-xs text-slate-500">{t("voting.voteOrSkip")}</p>
            </div>
          </div>
        </div>

        {!hasVoted ? (
          <>
            {/* Targets — players (collab) or anonymized answers (other modes) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <AnimatePresence>
                {voteOnPlayers
                  ? otherPlayers.map((player, idx) => {
                      const isSelected = selectedId === player.id;
                      return (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.06 }}
                        >
                          <GlassCard
                            onClick={() => setSelectedId(isSelected ? null : player.id)}
                            className={`
                              p-4 cursor-pointer text-center transition-all duration-200 flex flex-col items-center justify-center gap-2
                              ${isSelected
                                ? "border-orange-400/50 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                                : "border-white/8 hover:border-white/20 hover:bg-white/3"
                              }
                            `}
                          >
                            <PlayerAvatar name={player.name} index={players.indexOf(player)} size="lg" isSelected={isSelected} />
                            <p className="font-semibold text-slate-200 truncate text-sm">{player.name}</p>
                          </GlassCard>
                        </motion.div>
                      );
                    })
                  : votableClues.map((entry, idx) => {
                      const isSelected = selectedId === entry.playerId;
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.06 }}
                        >
                          <GlassCard
                            onClick={() => setSelectedId(isSelected ? null : entry.playerId)}
                            className={`
                              p-4 cursor-pointer text-center transition-all duration-200 min-h-[96px] flex flex-col items-center justify-center gap-2
                              ${isSelected
                                ? "border-orange-400/50 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                                : "border-white/8 hover:border-white/20 hover:bg-white/3"
                              }
                            `}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-orange-400" : "text-slate-600"}`}>
                              {LETTERS[idx] ?? "?"}
                            </span>
                            {entry.image ? (
                              <img src={entry.image} alt="" className="w-full rounded-lg border border-white/10 bg-white" />
                            ) : entry.clue ? (
                              <p className="font-bold text-slate-100" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.2rem" }}>
                                {entry.clue}
                              </p>
                            ) : (
                              <p className="text-slate-600 text-sm italic">{t("voting.noAnswer")}</p>
                            )}
                          </GlassCard>
                        </motion.div>
                      );
                    })}
              </AnimatePresence>
            </div>

            {selectedId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3 mb-4"
              >
                <p className="text-sm text-orange-300/80 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  {voteOnPlayers ? (
                    <>{t("voting.votingOut")} <strong>{selectedPlayer?.name}</strong>. {t("voting.cannotUndo")}</>
                  ) : (
                    <>{t("voting.votingAnswer")} <strong>{LETTERS[selectedIndex] ?? "?"}</strong>. {t("voting.cannotUndo")}</>
                  )}
                </p>
              </motion.div>
            )}

            <div className="flex gap-3">
              <GameButton
                variant="orange"
                size="lg"
                fullWidth
                onClick={handleVote}
                disabled={!selectedId}
                icon={<Vote className="w-5 h-5" />}
              >
                {t("voting.confirmVote")}
              </GameButton>
              <GameButton
                variant="ghost"
                size="lg"
                onClick={() => { setHasVoted(true); onVote(""); }}
              >
                {t("voting.skip")}
              </GameButton>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl">
              ✓
            </div>
            <p className="text-white font-semibold mb-1">{t("voting.voteSubmitted")}</p>
            <p className="text-slate-500 text-sm">{t("voting.waitingVotes")}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
