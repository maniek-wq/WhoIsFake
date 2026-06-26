import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { GameInput } from "../ui/GameInput";
import { Target, ArrowLeft, AlertTriangle } from "lucide-react";
import { useI18n } from "../../i18n/LanguageContext";

interface ImpostorGuessScreenProps {
  hint: string;
  category: string;
  onGuess: (word: string) => void;
  onCancel: () => void;
}

export function ImpostorGuessScreen({ hint, onGuess, onCancel }: ImpostorGuessScreenProps) {
  const { t } = useI18n();
  const [guess, setGuess] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0808] via-[#0F172A] to-[#0F172A] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-orange-500/6 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("guess.backToGame")}
        </button>

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 150 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 mb-4"
          >
            <Target className="w-7 h-7 text-orange-400" />
          </motion.div>
          <h2
            className="text-white mb-2"
            style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2rem", fontWeight: 700 }}
          >
            {t("guess.title")}
          </h2>
          <p className="text-slate-400 text-sm">{t("guess.subtitle")}</p>
        </div>

        <GlassCard glow="orange" className="p-6 space-y-5">
          {/* Info — the impostor's one-word hint (no category leak) */}
          <div className="p-3 rounded-xl bg-orange-500/8 border border-orange-500/20 text-center">
            <p className="text-xs text-orange-400/70 mb-1 uppercase tracking-wider">{t("guess.yourHint")}</p>
            <p className="font-semibold text-orange-200">{hint}</p>
          </div>

          <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20">
            <p className="text-xs text-red-300/80 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              {t("guess.warning")}
            </p>
          </div>

          <GameInput
            label={t("guess.yourGuess")}
            placeholder={t("guess.guessPlaceholder")}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && guess.trim() && onGuess(guess.trim())}
            maxLength={30}
            style={{ textAlign: "center", fontFamily: "Rajdhani, sans-serif", fontSize: "1.3rem", letterSpacing: "0.1em" }}
          />

          <GameButton
            variant="orange"
            size="lg"
            fullWidth
            onClick={() => onGuess(guess.trim())}
            disabled={!guess.trim()}
            icon={<Target className="w-5 h-5" />}
          >
            {t("guess.submitGuess")}
          </GameButton>
        </GlassCard>
      </motion.div>
    </div>
  );
}
