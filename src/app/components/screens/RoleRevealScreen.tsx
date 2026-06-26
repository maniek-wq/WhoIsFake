import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GameButton } from "../ui/GameButton";
import { Eye, EyeOff, AlertTriangle, BookOpen, ChevronRight } from "lucide-react";
import { useI18n } from "../../i18n/LanguageContext";
import type { RoomMode } from "../../lib/protocol";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface RoleRevealScreenProps {
  isImpostor: boolean;
  secretWord?: string;
  category?: string;
  hint?: string;
  imageUrl?: string | null;
  playerName: string;
  impostorCount?: number;
  mode?: RoomMode;
  onReady: () => void;
}

export function RoleRevealScreen({
  isImpostor,
  secretWord,
  category,
  hint,
  imageUrl,
  playerName,
  impostorCount = 1,
  mode = "classic",
  onReady,
}: RoleRevealScreenProps) {
  const { t } = useI18n();
  const isUndercover = mode === "undercover";
  const isObraz = mode === "obraz";
  const categoryLabel = category ? t(`category.${category}`) : "";
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      isImpostor
        ? "bg-gradient-to-br from-[#1a0505] via-[#0F172A] to-[#0F172A]"
        : "bg-gradient-to-br from-[#030d1f] via-[#0F172A] to-[#0F172A]"
    }`}>
      {/* Background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] ${
          isImpostor ? "bg-red-600/8" : "bg-blue-600/8"
        }`} />
      </div>

      <AnimatePresence mode="wait">
        {!confirmed ? (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Card */}
            <div className={`
              relative overflow-hidden rounded-3xl border p-8
              ${isImpostor
                ? "bg-gradient-to-b from-[#1a0808]/90 to-[#111827]/90 border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.15)]"
                : "bg-gradient-to-b from-[#050d1f]/90 to-[#111827]/90 border-blue-500/30 shadow-[0_0_80px_rgba(37,99,235,0.15)]"
              }
              backdrop-blur-xl
            `}>
              {/* Decorative corner */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] ${
                isImpostor ? "bg-red-500/10" : "bg-blue-500/10"
              }`} />

              <div className="relative">
                {/* Role label */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest mb-4
                      ${isImpostor
                        ? "bg-red-500/15 border border-red-500/30 text-red-400"
                        : "bg-blue-500/15 border border-blue-500/30 text-blue-300"
                      }
                    `}
                  >
                    {isImpostor ? (
                      <><AlertTriangle className="w-4 h-4" /> {t("role.impostor")}</>
                    ) : (
                      <><BookOpen className="w-4 h-4" /> {t("role.player")}</>
                    )}
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-400 text-sm"
                  >
                    {t("role.hey")} <span className="text-white font-semibold">{playerName}</span>,
                  </motion.p>
                </div>

                {/* Role heading */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center mb-8"
                >
                  {isImpostor ? (
                    <>
                      <div className="text-7xl mb-4">👺</div>
                      <h2
                        className="text-red-400 leading-tight mb-2 whitespace-pre-line"
                        style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2.2rem", fontWeight: 700 }}
                      >
                        {t("role.youImpostor")}
                      </h2>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                        {isObraz ? t("role.obrazImpostorDesc") : t("role.impostorDesc")}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-7xl mb-4">{isObraz ? "🖼️" : isUndercover ? "🎭" : "🕵️"}</div>
                      <h2
                        className="text-blue-300 leading-tight mb-2 whitespace-pre-line"
                        style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2.2rem", fontWeight: 700 }}
                      >
                        {isObraz ? t("role.obrazTitle") : isUndercover ? t("role.undercoverTitle") : t("role.youKnow")}
                      </h2>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                        {isObraz ? t("role.obrazDesc") : isUndercover ? t("role.undercoverDesc") : t("role.playerDesc")}
                      </p>
                    </>
                  )}
                </motion.div>

                {/* Secret Info Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className={`
                    relative rounded-2xl border p-5 mb-6 overflow-hidden
                    ${isImpostor
                      ? "bg-red-500/8 border-red-500/25"
                      : "bg-blue-500/8 border-blue-500/25"
                    }
                  `}
                >
                  {!revealed && (
                    <div
                      className="absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer z-10 rounded-2xl bg-[#111827]/60"
                      onClick={() => setRevealed(true)}
                    >
                      <Eye className={`w-6 h-6 mb-2 ${isImpostor ? "text-red-400" : "text-blue-400"}`} />
                      <span className="text-sm text-slate-400">{t("role.tapReveal")}</span>
                    </div>
                  )}

                  {isImpostor ? (
                    isObraz ? (
                      <div className="text-center py-3">
                        <p className="text-base font-bold text-red-300">{t("role.noHint")}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-red-400/70 uppercase tracking-wider mb-1">{t("role.categoryHint")}</p>
                        <p className="text-xl font-bold text-red-300">{categoryLabel}</p>
                        {hint && (
                          <div className="mt-3 pt-3 border-t border-red-500/15">
                            <p className="text-xs font-semibold text-red-400/70 uppercase tracking-wider mb-1">{t("role.yourHint")}</p>
                            <p className="text-sm text-red-200/80 leading-relaxed">{hint}</p>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div>
                      {categoryLabel && (
                        <>
                          <p className="text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-1">{t("role.category")}</p>
                          <p className="text-sm text-slate-400">{categoryLabel}</p>
                        </>
                      )}
                      <div className={categoryLabel ? "mt-3 pt-3 border-t border-blue-500/15" : ""}>
                        {isObraz && imageUrl ? (
                          <>
                            <p className="text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-2">{t("role.yourImage")}</p>
                            <ImageWithFallback
                              src={imageUrl}
                              alt=""
                              className="w-full rounded-xl border border-blue-500/20 bg-black/20 max-h-72 object-contain"
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-2">{t("role.secretWord")}</p>
                            <p
                              className="text-blue-300 font-bold tracking-widest"
                              style={{ fontSize: "2rem", fontFamily: "Rajdhani, sans-serif" }}
                            >
                              {secretWord}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {revealed && (
                    <button
                      onClick={() => setRevealed(false)}
                      className="absolute top-2 right-2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>

                {isImpostor && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3 mb-5"
                  >
                    <p className="text-xs text-orange-300/80 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-orange-400" />
                      {t("role.goal")}
                    </p>
                  </motion.div>
                )}

                <GameButton
                  variant={isImpostor ? "danger" : "primary"}
                  size="lg"
                  fullWidth
                  onClick={() => { setConfirmed(true); onReady(); }}
                  icon={<ChevronRight className="w-5 h-5" />}
                >
                  {t("role.understand")}
                </GameButton>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-6 h-6 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full" />
              </motion.div>
            </div>
            <p className="text-white font-semibold mb-1">Ready!</p>
            <p className="text-slate-500 text-sm">Waiting for other players to confirm their roles…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
