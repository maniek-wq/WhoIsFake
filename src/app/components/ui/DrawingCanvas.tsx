import { useEffect, useReducer, useRef, useState } from "react";
import {
  Pencil,
  Minus,
  Square,
  Circle,
  ArrowUpRight,
  Eraser,
  Undo2,
  Trash2,
  Send,
} from "lucide-react";
import { GameButton } from "./GameButton";
import { useI18n } from "../../i18n/LanguageContext";

type Tool = "pen" | "line" | "rect" | "circle" | "arrow" | "eraser";
interface Point { x: number; y: number }
interface Item { tool: Tool; color: string; size: number; points: Point[] }

const W = 760;
const H = 460;
const BG = "#FFFFFF"; // white "whiteboard" canvas

const COLORS = [
  "#111827", "#64748B", "#EF4444", "#F97316", "#FBBF24",
  "#10B981", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
];
const SIZES = [3, 6, 12, 20];

interface DrawingCanvasProps {
  onSubmit: (dataUrl: string) => void;
  /** epoch ms; when reached, the current canvas auto-submits (timed round) */
  deadline?: number | null;
}

export function DrawingCanvas({ onSubmit, deadline }: DrawingCanvasProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const currentRef = useRef<Item | null>(null);
  const drawingRef = useRef(false);
  const [, force] = useReducer((x) => x + 1, 0);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);

  // keep latest tool/color/size for pointer handlers
  const settings = useRef({ tool, color, size });
  settings.current = { tool, color, size };

  const drawItem = (ctx: CanvasRenderingContext2D, item: Item) => {
    const pts = item.points;
    if (pts.length === 0) return;
    ctx.strokeStyle = item.tool === "eraser" ? BG : item.color;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = item.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (item.tool === "pen" || item.tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y); // dot
      else pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      return;
    }

    const a = pts[0];
    const b = pts[pts.length - 1];
    if (item.tool === "line" || item.tool === "arrow") {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (item.tool === "arrow") {
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const head = Math.max(12, item.size * 2.4);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - head * Math.cos(angle - Math.PI / 6), b.y - head * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - head * Math.cos(angle + Math.PI / 6), b.y - head * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    } else if (item.tool === "rect") {
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    } else if (item.tool === "circle") {
      ctx.beginPath();
      ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const redraw = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    for (const item of itemsRef.current) drawItem(ctx, item);
    if (currentRef.current) drawItem(ctx, currentRef.current);
  };

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { tool, color, size } = settings.current;
    currentRef.current = { tool, color, size, points: [pointFromEvent(e)] };
    redraw();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !currentRef.current) return;
    const p = pointFromEvent(e);
    const cur = currentRef.current;
    if (cur.tool === "pen" || cur.tool === "eraser") cur.points.push(p);
    else cur.points[1] = p;
    redraw();
  };

  const onUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentRef.current) {
      itemsRef.current.push(currentRef.current);
      currentRef.current = null;
      force();
      redraw();
    }
  };

  const undo = () => {
    itemsRef.current.pop();
    force();
    redraw();
  };
  const clear = () => {
    itemsRef.current = [];
    force();
    redraw();
  };
  const submit = () => {
    const url = canvasRef.current?.toDataURL("image/jpeg", 0.82);
    if (url) onSubmit(url);
  };

  // Auto-submit the current canvas when the shared drawing clock runs out.
  useEffect(() => {
    if (!deadline) return;
    const fire = () => {
      const url = canvasRef.current?.toDataURL("image/jpeg", 0.82);
      if (url) onSubmit(url);
    };
    const ms = deadline - Date.now();
    if (ms <= 0) {
      fire();
      return;
    }
    const id = setTimeout(fire, ms);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  const hasDrawing = itemsRef.current.length > 0;

  const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "pen", icon: <Pencil className="w-4 h-4" />, label: t("draw.tools.pen") },
    { id: "line", icon: <Minus className="w-4 h-4" />, label: t("draw.tools.line") },
    { id: "rect", icon: <Square className="w-4 h-4" />, label: t("draw.tools.rect") },
    { id: "circle", icon: <Circle className="w-4 h-4" />, label: t("draw.tools.circle") },
    { id: "arrow", icon: <ArrowUpRight className="w-4 h-4" />, label: t("draw.tools.arrow") },
    { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: t("draw.tools.eraser") },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* tools */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0F172A] border border-white/10">
          {TOOLS.map((tl) => (
            <button
              key={tl.id}
              onClick={() => setTool(tl.id)}
              title={tl.label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                tool === tl.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {tl.icon}
            </button>
          ))}
        </div>

        {/* sizes */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0F172A] border border-white/10" title={t("draw.size")}>
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                size === s ? "bg-white/10 ring-1 ring-blue-500/50" : "hover:bg-white/5"
              }`}
            >
              <span className="rounded-full bg-slate-200" style={{ width: Math.min(s, 18), height: Math.min(s, 18) }} />
            </button>
          ))}
        </div>

        {/* actions */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0F172A] border border-white/10 ml-auto">
          <button onClick={undo} disabled={!hasDrawing} title={t("draw.undo")} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={clear} disabled={!hasDrawing} title={t("draw.clear")} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-white/5 disabled:opacity-30">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* colors */}
      <div className="flex flex-wrap items-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full border-2 transition-transform ${
              color === c ? "border-white scale-110" : "border-white/15 hover:scale-105"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="w-7 h-7 rounded-full border-2 border-white/15 overflow-hidden cursor-pointer relative" title={t("draw.color")}>
          <span className="absolute inset-0 bg-[conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)]" />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>

      {/* canvas */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-white">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          className="w-full block touch-none cursor-crosshair"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>

      <GameButton variant="primary" size="lg" fullWidth onClick={submit} disabled={!hasDrawing} icon={<Send className="w-5 h-5" />}>
        {t("draw.submit")}
      </GameButton>
    </div>
  );
}
