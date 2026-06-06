import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { GameButton } from "../ui/GameButton";
import { GameInput } from "../ui/GameInput";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../i18n/LanguageContext";

interface JoinGameScreenProps {
  onBack: () => void;
  onJoined: (roomCode: string, playerName: string) => void;
}

export function JoinGameScreen({ onBack, onJoined }: JoinGameScreenProps) {
  const { t } = useI18n();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [errors, setErrors] = useState<{ nickname?: string; code?: string }>({});

  const handleJoin = () => {
    const newErrors: { nickname?: string; code?: string } = {};
    if (!nickname.trim() || nickname.trim().length < 2) newErrors.nickname = t("join.errNick");
    if (!roomCode.trim() || roomCode.trim().length < 6) newErrors.code = t("join.errCode");
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
          {t("common.back")}
        </button>

        <div className="mb-8">
          <h1 className="text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2rem", fontWeight: 700 }}>
            {t("join.title")}
          </h1>
          <p className="text-slate-500 text-sm">{t("join.subtitle")}</p>
        </div>

        <GlassCard glow="cyan" className="p-6 space-y-6">
          <GameInput
            label={t("join.roomCode")}
            placeholder={t("join.roomPlaceholder")}
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
            label={t("join.nickname")}
            placeholder={t("join.nicknamePlaceholder")}
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
            {t("join.joinRoom")}
          </GameButton>
        </GlassCard>

        <p className="text-center text-xs text-slate-600 mt-4">
          {t("join.ask")}
        </p>
      </motion.div>
    </div>
  );
}
