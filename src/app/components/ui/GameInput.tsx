import { InputHTMLAttributes, forwardRef } from "react";

interface GameInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const GameInput = forwardRef<HTMLInputElement, GameInputProps>(
  ({ label, hint, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-[#1E293B] border border-white/10
            text-slate-100 placeholder:text-slate-500
            focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30
            transition-all duration-200
            ${error ? "border-red-500/50 focus:border-red-500/60" : ""}
            ${className}
          `}
          {...props}
        />
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

GameInput.displayName = "GameInput";
