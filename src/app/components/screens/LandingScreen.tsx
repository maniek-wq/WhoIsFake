import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { Shield, Users, Eye, Zap, ChevronRight } from "lucide-react";

interface LandingScreenProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
}

const HOW_TO_PLAY = [
  {
    icon: <Users className="w-5 h-5" />,
    title: "Gather Players",
    desc: "3–5 players join a room. One random player secretly becomes the Impostor.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Secret Roles",
    desc: "Normal players know the secret word. The Impostor only gets a vague hint.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Give Clues",
    desc: "Each round, every player submits one word describing the secret. Stay vague if you're the Impostor!",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Vote & Deduce",
    desc: "Vote to eliminate the Impostor before they guess the word or create a 1v1.",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
];

export function LandingScreen({ onCreateGame, onJoinGame }: LandingScreenProps) {
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
            LIVE
          </span>
          <span className="text-sm text-slate-500">847 playing now</span>
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
            Social Deduction · 3–5 Players · Browser
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
          A multiplayer word-bluffing game where one player hides in plain sight.
          Give clues, read the room, and catch the Impostor before it's too late.
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
            Create Game
          </GameButton>
          <GameButton
            variant="secondary"
            size="lg"
            onClick={onJoinGame}
            fullWidth
            icon={<ChevronRight className="w-5 h-5" />}
          >
            Join Game
          </GameButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-slate-600 mt-5"
        >
          No account needed · 2 clicks to play
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
            How to Play
          </h2>
          <p className="text-slate-500 text-sm">Master the art of deception in 4 steps</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_TO_PLAY.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <GlassCard className={`p-5 border ${step.bg} h-full`}>
                <div className={`w-10 h-10 rounded-xl ${step.bg} border flex items-center justify-center mb-4 ${step.color}`}>
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Step {i + 1}</div>
                <h3 className="text-white mb-2" style={{ fontSize: "1rem", fontWeight: 600 }}>{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Win Conditions */}
      <section className="relative z-10 px-6 pb-24 md:px-12 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard glow="blue" className="p-6">
            <div className="text-2xl mb-3">🕵️</div>
            <h3 className="text-blue-400 mb-2" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Players Win</h3>
            <p className="text-slate-400 text-sm">Successfully vote out the Impostor before they can guess the secret word.</p>
          </GlassCard>
          <GlassCard glow="red" className="p-6">
            <div className="text-2xl mb-3">👺</div>
            <h3 className="text-red-400 mb-2" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Impostor Wins</h3>
            <p className="text-slate-400 text-sm">Correctly guess the secret word or survive until only 2 players remain.</p>
          </GlassCard>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center">
        <p className="text-slate-600 text-xs">WhoIsFake · 2026 · Made for fast, fun deception</p>
      </footer>
    </div>
  );
}
