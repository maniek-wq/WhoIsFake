import { ReactNode } from "react";
import { motion } from "motion/react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: "blue" | "cyan" | "orange" | "red" | "none";
  onClick?: () => void;
  animate?: boolean;
}

const glowMap = {
  blue: "shadow-[0_0_30px_rgba(37,99,235,0.25)] border-blue-500/20",
  cyan: "shadow-[0_0_30px_rgba(6,182,212,0.2)] border-cyan-500/20",
  orange: "shadow-[0_0_30px_rgba(249,115,22,0.2)] border-orange-500/20",
  red: "shadow-[0_0_30px_rgba(239,68,68,0.2)] border-red-500/20",
  none: "border-white/8",
};

export function GlassCard({ children, className = "", glow = "none", onClick, animate = false }: GlassCardProps) {
  const base = `
    bg-[#111827]/80 backdrop-blur-xl border rounded-2xl
    ${glowMap[glow]}
    ${onClick ? "cursor-pointer" : ""}
    ${className}
  `;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={base}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={base} onClick={onClick}>
      {children}
    </div>
  );
}
