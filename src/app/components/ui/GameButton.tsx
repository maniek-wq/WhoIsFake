import { ReactNode } from "react";
import { motion } from "motion/react";

interface GameButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "cyan" | "orange";
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  className?: string;
  type?: "button" | "submit";
}

const variantClasses = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] border border-blue-500/40",
  secondary: "bg-[#1E293B] hover:bg-[#263248] text-slate-200 border border-white/10 hover:border-white/20",
  danger: "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-500/40",
  ghost: "bg-transparent hover:bg-white/5 text-slate-300 border border-transparent hover:border-white/10",
  cyan: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-cyan-500/40",
  orange: "bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] border border-orange-400/40",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-7 py-3.5 text-lg rounded-xl",
  xl: "px-10 py-4 text-xl rounded-2xl",
};

export function GameButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  fullWidth = false,
  icon,
  className = "",
  type = "button",
}: GameButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        font-semibold transition-all duration-200
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </motion.button>
  );
}
