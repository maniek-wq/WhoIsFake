import { motion } from "motion/react";

const AVATAR_COLORS = [
  { bg: "from-blue-600 to-blue-400", border: "border-blue-500/40", shadow: "shadow-blue-500/20" },
  { bg: "from-cyan-600 to-cyan-400", border: "border-cyan-500/40", shadow: "shadow-cyan-500/20" },
  { bg: "from-orange-600 to-orange-400", border: "border-orange-500/40", shadow: "shadow-orange-500/20" },
  { bg: "from-purple-600 to-purple-400", border: "border-purple-500/40", shadow: "shadow-purple-500/20" },
  { bg: "from-emerald-600 to-emerald-400", border: "border-emerald-500/40", shadow: "shadow-emerald-500/20" },
];

interface PlayerAvatarProps {
  name: string;
  index: number;
  size?: "sm" | "md" | "lg" | "xl";
  isHost?: boolean;
  isEliminated?: boolean;
  isSelected?: boolean;
  showStatus?: boolean;
  isReady?: boolean;
  isImpostor?: boolean;
}

export function PlayerAvatar({
  name,
  index,
  size = "md",
  isHost = false,
  isEliminated = false,
  isSelected = false,
  showStatus = false,
  isReady = false,
  isImpostor = false,
}: PlayerAvatarProps) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative inline-flex items-center justify-center">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`
          ${sizeClasses[size]} rounded-full bg-gradient-to-br ${color.bg}
          border-2 ${isSelected ? "border-orange-400" : color.border}
          shadow-lg ${color.shadow}
          flex items-center justify-center font-bold text-white
          ${isEliminated ? "opacity-40 grayscale" : ""}
          ${isSelected ? "ring-2 ring-orange-400/50 ring-offset-1 ring-offset-[#0F172A]" : ""}
          transition-all duration-200
        `}
      >
        {initial}
        {isImpostor && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px]">
            💀
          </div>
        )}
      </motion.div>
      {isHost && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px]">
          👑
        </div>
      )}
      {showStatus && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111827] ${
            isReady ? "bg-emerald-400" : "bg-slate-500"
          }`}
        />
      )}
    </div>
  );
}
