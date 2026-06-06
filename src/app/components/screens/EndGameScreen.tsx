import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { RotateCcw, Home, Trophy } from "lucide-react";
import canvasConfetti from "canvas-confetti";
import type { Player } from "../../types";
import { useI18n } from "../../i18n/LanguageContext";

interface EndGameScreenProps {
  impostorWon: boolean;
  impostorName: string;
  impostorIndex: number;
  secretWord: string;
  players: Player[];
  winReason: "guessed" | "onevsone" | "eliminated";
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function EndGameScreen({
  impostorWon,
  impostorName,
  impostorIndex,
  secretWord,
  players,
  winReason,
  onPlayAgain,
  onGoHome,
}: EndGameScreenProps) {
  const { t } = useI18n();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!impostorWon) {
      // Players win — confetti!
      canvasConfetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.4 },
        colors: ["#2563EB", "#06B6D4", "#F97316", "#8B5CF6", "#10B981"],
      });
      setTimeout(() => {
        canvasConfetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.5 },
          colors: ["#2563EB", "#06B6D4"],
        });
        canvasConfetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.5 },
          colors: ["#F97316", "#8B5CF6"],
        });
      }, 400);
    }
  }, [impostorWon]);

  const winReasonText: Record<typeof winReason, string> = {
    guessed: t("end.reasonGuessed", { name: impostorName }),
    onevsone: t("end.reasonOnevsone", { name: impostorName }),
    eliminated: t("end.reasonEliminated"),
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 ${
      impostorWon
        ? "bg-gradient-to-br from-[#1a0505] via-[#0F172A] to-[#0a0714]"
        : "bg-gradient-to-br from-[#030d1f] via-[#0F172A] to-[#030d1f]"
    }`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] ${
          impostorWon ? "bg-red-600/6" : "bg-blue-600/6"
        }`} />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Trophy / Skull */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, delay: 0.1 }}
          className="text-8xl mb-6 inline-block"
        >
          {impostorWon ? "👺" : "🏆"}
        </motion.div>

        {/* Win banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className={`
            inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest mb-4
            ${impostorWon
              ? "bg-red-500/15 border border-red-500/30 text-red-400"
              : "bg-blue-500/15 border border-blue-500/30 text-blue-300"
            }
          `}>
            <Trophy className="w-4 h-4" />
            {impostorWon ? t("end.impostorVictory") : t("end.playersVictory")}
          </div>
          <h1
            className="leading-tight mb-3"
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              fontWeight: 700,
              color: impostorWon ? "#EF4444" : "#60A5FA",
            }}
          >
            {impostorWon ? t("end.fakeWins") : t("end.impostorCaught")}
          </h1>
          <p className="text-slate-400 max-w-xs mx-auto leading-relaxed text-sm">
            {winReasonText[winReason]}
          </p>
        </motion.div>

        {/* Secret word reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-5 mb-4 border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t("end.secretWas")}</p>
            <p
              className="text-white font-bold tracking-widest"
              style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2.5rem", letterSpacing: "0.15em" }}
            >
              {secretWord}
            </p>
          </GlassCard>
        </motion.div>

        {/* Impostor reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <GlassCard className={`p-4 mb-6 border ${impostorWon ? "border-red-500/20 bg-red-500/5" : "border-white/10"}`}>
            <p className="text-xs text-slate-500 mb-3">{t("end.impostorWas")}</p>
            <div className="flex items-center justify-center gap-3">
              <PlayerAvatar
                name={impostorName}
                index={impostorIndex}
                size="md"
                isImpostor
              />
              <span className="font-bold text-white text-lg" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                {impostorName}
              </span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Players summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard className="p-4 mb-8 border-white/8">
            <p className="text-xs text-slate-500 mb-3">{t("end.allPlayers")}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {players.map((p, i) => (
                <div key={p.id} className="flex flex-col items-center gap-1.5">
                  <PlayerAvatar
                    name={p.name}
                    index={i}
                    size="sm"
                    isEliminated={p.isEliminated}
                  />
                  <span className={`text-xs truncate max-w-[56px] ${p.isEliminated ? "text-slate-600 line-through" : "text-slate-400"}`}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
          className="flex gap-3"
        >
          <GameButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={onPlayAgain}
            icon={<RotateCcw className="w-5 h-5" />}
          >
            {t("end.playAgain")}
          </GameButton>
          <GameButton
            variant="ghost"
            size="lg"
            onClick={onGoHome}
            icon={<Home className="w-5 h-5" />}
          >
            {t("end.home")}
          </GameButton>
        </motion.div>
      </div>
    </div>
  );
}
