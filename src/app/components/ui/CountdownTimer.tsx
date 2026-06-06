import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "blue" | "orange" | "red";
}

export function CountdownTimer({ seconds, onComplete, size = "md", variant = "blue" }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, onComplete]);

  const pct = (remaining / seconds) * 100;
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const colorMap = {
    blue: { stroke: "#2563EB", text: "text-blue-400", glow: "drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]" },
    orange: { stroke: "#F97316", text: "text-orange-400", glow: "drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" },
    red: { stroke: "#EF4444", text: "text-red-400", glow: "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" },
  };

  const sizeMap = {
    sm: { svg: 48, r: 18, font: "text-sm" },
    md: { svg: 56, r: 20, font: "text-base" },
    lg: { svg: 80, r: 30, font: "text-2xl" },
  };

  const c = colorMap[variant];
  const s = sizeMap[size];
  const cx = s.svg / 2;
  const circ = 2 * Math.PI * s.r;
  const offset = circ - (pct / 100) * circ;

  const urgentColor = remaining <= 5 ? colorMap.red : c;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={s.svg} height={s.svg} className={urgentColor.glow}>
        <circle
          cx={cx} cy={cx} r={s.r}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3}
        />
        <motion.circle
          cx={cx} cy={cx} r={s.r}
          fill="none" stroke={remaining <= 5 ? colorMap.red.stroke : c.stroke}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <motion.span
        key={remaining}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className={`absolute ${s.font} font-bold ${remaining <= 5 ? colorMap.red.text : urgentColor.text} font-mono`}
      >
        {remaining}
      </motion.span>
    </div>
  );
}
