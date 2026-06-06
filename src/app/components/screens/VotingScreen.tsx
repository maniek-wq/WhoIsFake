import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { CountdownTimer } from "../ui/CountdownTimer";
import { Vote, AlertTriangle } from "lucide-react";
import type { Player } from "../../types";

interface VotingScreenProps {
  players: Player[];
  currentPlayerId: string;
  onVote: (targetId: string) => void;
  onTimerEnd: () => void;
}

export function VotingScreen({ players, currentPlayerId, onVote, onTimerEnd }: VotingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const activePlayers = players.filter((p) => !p.isEliminated && p.id !== currentPlayerId);

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
            Vote Time!
          </h2>
          <p className="text-slate-400 text-sm">Who do you think is the Impostor?</p>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <CountdownTimer seconds={30} onComplete={onTimerEnd} variant="orange" size="lg" />
            <div>
              <p className="text-orange-300 font-semibold">Seconds left</p>
              <p className="text-xs text-slate-500">Vote or skip</p>
            </div>
          </div>
        </div>

        {!hasVoted ? (
          <>
            {/* Player cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <AnimatePresence>
                {activePlayers.map((player, idx) => {
                  const playerIdx = players.indexOf(player);
                  const isSelected = selectedId === player.id;
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.07 }}
                    >
                      <GlassCard
                        onClick={() => setSelectedId(isSelected ? null : player.id)}
                        className={`
                          p-4 cursor-pointer text-center transition-all duration-200
                          ${isSelected
                            ? "border-orange-400/50 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                            : "border-white/8 hover:border-white/20 hover:bg-white/3"
                          }
                        `}
                      >
                        <div className="flex justify-center mb-3">
                          <div className={`relative ${isSelected ? "ring-2 ring-orange-400 ring-offset-2 ring-offset-[#111827] rounded-full" : ""}`}>
                            <PlayerAvatar
                              name={player.name}
                              index={playerIdx}
                              size="lg"
                              isSelected={isSelected}
                            />
                          </div>
                        </div>
                        <p className="font-semibold text-slate-200 truncate text-sm">{player.name}</p>
                        {isSelected && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-orange-400 mt-1 font-medium"
                          >
                            Selected
                          </motion.p>
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
                  You're voting to eliminate <strong>{players.find((p) => p.id === selectedId)?.name}</strong>. This cannot be undone.
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
                Confirm Vote
              </GameButton>
              <GameButton
                variant="ghost"
                size="lg"
                onClick={() => { setHasVoted(true); onVote(""); }}
              >
                Skip
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
            <p className="text-white font-semibold mb-1">Vote submitted!</p>
            <p className="text-slate-500 text-sm">Waiting for other players to vote…</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
