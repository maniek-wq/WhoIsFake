import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { GameInput } from "../ui/GameInput";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface JoinGameScreenProps {
  onBack: () => void;
  onJoined: (roomCode: string, playerName: string) => void;
}

export function JoinGameScreen({ onBack, onJoined }: JoinGameScreenProps) {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [errors, setErrors] = useState<{ nickname?: string; code?: string }>({});

  const handleJoin = () => {
    const newErrors: { nickname?: string; code?: string } = {};
    if (!nickname.trim() || nickname.trim().length < 2) newErrors.nickname = "Enter a valid nickname (min 2 chars)";
    if (!roomCode.trim() || roomCode.trim().length < 6) newErrors.code = "Enter a valid 6-character room code";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onJoined(roomCode.trim().toUpperCase(), nickname.trim());
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-cyan-600/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2rem", fontWeight: 700 }}>
            Join Game
          </h1>
          <p className="text-slate-500 text-sm">Enter a room code to jump in</p>
        </div>

        <GlassCard glow="cyan" className="p-6 space-y-6">
          <GameInput
            label="Room Code"
            placeholder="e.g. AB12CD"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase().slice(0, 6));
              setErrors((p) => ({ ...p, code: undefined }));
            }}
            error={errors.code}
            style={{ letterSpacing: "0.25em", fontFamily: "JetBrains Mono, monospace", fontSize: "1.4rem", textAlign: "center" }}
            maxLength={6}
          />

          <GameInput
            label="Your Nickname"
            placeholder="e.g. NeonWolf"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setErrors((p) => ({ ...p, nickname: undefined }));
            }}
            error={errors.nickname}
            maxLength={16}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />

          <GameButton
            variant="cyan"
            size="lg"
            fullWidth
            onClick={handleJoin}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            Join Room
          </GameButton>
        </GlassCard>

        <p className="text-center text-xs text-slate-600 mt-4">
          Ask the host for their 6-letter room code
        </p>
      </motion.div>
    </div>
  );
}
