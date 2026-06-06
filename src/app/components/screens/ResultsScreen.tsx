import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { ChevronRight, Users, AlertTriangle } from "lucide-react";
import type { Player } from "../../types";
import { useI18n } from "../../i18n/LanguageContext";

interface ResultsScreenProps {
  eliminatedPlayer: Player;
  eliminatedIndex: number;
  wasImpostor: boolean;
  remainingPlayers: Player[];
  secretWord: string;
  onContinue: () => void;
}

export function ResultsScreen({
  eliminatedPlayer,
  eliminatedIndex,
  wasImpostor,
  remainingPlayers,
  secretWord,
  onContinue,
}: ResultsScreenProps) {
  const { t } = useI18n();
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 ${
      wasImpostor
        ? "bg-gradient-to-br from-[#050d1f] via-[#0F172A] to-[#0a1505]"
        : "bg-gradient-to-br from-[#1a0505] via-[#0F172A] to-[#0F172A]"
    }`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] ${
          wasImpostor ? "bg-emerald-500/6" : "bg-red-500/6"
        }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        {/* Eliminated player card */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
          className={`
            inline-block rounded-3xl p-8 mb-6 border
            ${wasImpostor
              ? "bg-emerald-500/8 border-emerald-500/25 shadow-[0_0_60px_rgba(16,185,129,0.12)]"
              : "bg-red-500/8 border-red-500/25 shadow-[0_0_60px_rgba(239,68,68,0.12)]"
            }
            backdrop-blur-xl
          `}
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ rotate: wasImpostor ? [0, -10, 10, -5, 0] : [0, 5, -5, 2, 0] }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <PlayerAvatar
                name={eliminatedPlayer.name}
                index={eliminatedIndex}
                size="xl"
                isImpostor={wasImpostor}
              />
            </motion.div>
          </div>

          <p className="text-slate-400 text-sm mb-1">
            {t("results.votedOut", { name: eliminatedPlayer.name })}
          </p>
          <p
            className={`font-bold mb-3 ${wasImpostor ? "text-emerald-400" : "text-red-400"}`}
            style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.6rem" }}
          >
            {wasImpostor ? t("results.theImpostor") : t("results.innocent")}
          </p>
          <p className="text-slate-500 text-sm">
            {wasImpostor ? t("results.goodCatch") : t("results.wrongGuess")}
          </p>
        </motion.div>

        {/* Secret word */}
        {wasImpostor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-4 mb-6 border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t("results.secretWas")}</p>
              <p
                className="text-blue-300 font-bold tracking-widest"
                style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2.2rem" }}
              >
                {secretWord}
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Remaining players */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">{t("results.remaining")}</span>
              </div>
              <span className="text-sm font-bold text-slate-300">{t("results.left", { n: remainingPlayers.length })}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {remainingPlayers.map((p, i) => (
                <div key={p.id} className="flex flex-col items-center gap-1.5">
                  <PlayerAvatar name={p.name} index={i} size="md" />
                  <span className="text-xs text-slate-500 truncate max-w-[60px]">{p.name}</span>
                </div>
              ))}
            </div>

            {remainingPlayers.length === 2 && !wasImpostor && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <p className="text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  {t("results.danger")}
                </p>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <GameButton
            variant={wasImpostor ? "primary" : "secondary"}
            size="lg"
            fullWidth
            onClick={onContinue}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            {t("results.continue")}
          </GameButton>
        </motion.div>
      </motion.div>
    </div>
  );
}
