import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { Shield, Users, Eye, Zap, ChevronRight, Type, Palette, Brush, VenetianMask, Image as ImageIcon, Ghost } from "lucide-react";
import { useI18n } from "../../i18n/LanguageContext";

interface LandingScreenProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
}

const STEPS = [
  { key: "gather", icon: <Users className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "roles", icon: <Eye className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { key: "clues", icon: <Zap className="w-5 h-5" />, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { key: "vote", icon: <Shield className="w-5 h-5" />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
] as const;

// Each mode shows what you actually do — labels/descriptions reuse the create-room keys.
const MODES = [
  { key: "Classic", icon: Type, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "Obraz", icon: ImageIcon, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "Undercover", icon: VenetianMask, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { key: "Drawing", icon: Palette, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { key: "Collab", icon: Brush, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { key: "Szpont", icon: Ghost, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
] as const;

export function LandingScreen({ onCreateGame, onJoinGame }: LandingScreenProps) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-purple-600/4 blur-[80px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(37,99,235,0.5)]">
            <span className="text-white font-bold text-sm">?</span>
          </div>
          <span className="font-bold text-white tracking-tight" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.2rem" }}>
            WhoIsFake
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            {t("nav.live")}
          </span>
          <span className="text-sm text-slate-500">{t("nav.playingNow", { n: 847 })}</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {t("landing.badge")}
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white leading-none mb-6"
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "clamp(3.5rem, 10vw, 7rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Who
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
            Is
          </span>
          Fake
          <span className="text-red-400">?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ fontSize: "1.1rem" }}
        >
          {t("landing.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
        >
          <GameButton
            variant="primary"
            size="lg"
            onClick={onCreateGame}
            fullWidth
            icon={<Zap className="w-5 h-5" />}
          >
            {t("landing.createGame")}
          </GameButton>
          <GameButton
            variant="secondary"
            size="lg"
            onClick={onJoinGame}
            fullWidth
            icon={<ChevronRight className="w-5 h-5" />}
          >
            {t("landing.joinGame")}
          </GameButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-slate-600 mt-5"
        >
          {t("landing.noAccount")}
        </motion.p>
      </section>

      {/* How to Play */}
      <section className="relative z-10 px-6 pb-20 md:px-12 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-white mb-2" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "2rem" }}>
            {t("landing.howTo")}
          </h2>
          <p className="text-slate-500 text-sm">{t("landing.howToSub")}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <GlassCard className={`p-5 border ${step.bg} h-full`}>
                <div className={`w-10 h-10 rounded-xl ${step.bg} border flex items-center justify-center mb-4 ${step.color}`}>
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">{t("landing.step")} {i + 1}</div>
                <h3 className="text-white mb-2" style={{ fontSize: "1rem", fontWeight: 600 }}>{t(`landing.steps.${step.key}.title`)}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t(`landing.steps.${step.key}.desc`)}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Game Modes */}
      <section className="relative z-10 px-6 pb-20 md:px-12 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-white mb-2" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "2rem" }}>
            {t("landing.modes")}
          </h2>
          <p className="text-slate-500 text-sm">{t("landing.modesSub")}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODES.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <GlassCard className={`p-5 border ${m.bg} h-full`}>
                  <div className={`w-10 h-10 rounded-xl ${m.bg} border flex items-center justify-center mb-3 ${m.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-white mb-1.5" style={{ fontSize: "1rem", fontWeight: 600 }}>
                    {t(`create.mode${m.key}`)}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{t(`create.mode${m.key}Desc`)}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Win Conditions */}
      <section className="relative z-10 px-6 pb-24 md:px-12 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard glow="blue" className="p-6">
            <div className="text-2xl mb-3">🕵️</div>
            <h3 className="text-blue-400 mb-2" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{t("landing.playersWin")}</h3>
            <p className="text-slate-400 text-sm">{t("landing.playersWinDesc")}</p>
          </GlassCard>
          <GlassCard glow="red" className="p-6">
            <div className="text-2xl mb-3">👺</div>
            <h3 className="text-red-400 mb-2" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{t("landing.impostorWin")}</h3>
            <p className="text-slate-400 text-sm">{t("landing.impostorWinDesc")}</p>
          </GlassCard>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center">
        <p className="text-slate-600 text-xs">{t("landing.footer")}</p>
      </footer>
    </div>
  );
}
