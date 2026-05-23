import { useEffect, useRef } from "react";
import { useEditorStore } from "../store/editorStore";

const rowHeight = 24;
const headerHeight = 28;
const frameWidth = 10;

export function Timeline() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animation = useEditorStore((state) => state.animation);
  const playhead = useEditorStore((state) => state.playhead);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const setPlayhead = useEditorStore((state) => state.setPlayhead);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.max(960, (animation.op - animation.ip) * frameWidth + 200);
    const height = headerHeight + Math.max(6, animation.layers.length) * rowHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawTimeline(ctx, width, height, animation, playhead, selectedLayerId);
  }, [animation, playhead, selectedLayerId]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left + event.currentTarget.parentElement!.scrollLeft;
    setPlayhead(Math.round((x - 160) / frameWidth));
  };

  return (
    <section className="h-[190px] border-t border-zinc-800 bg-zinc-950">
      <div className="h-full overflow-auto">
        <canvas ref={canvasRef} onPointerDown={handlePointerDown} />
      </div>
    </section>
  );
}

function drawTimeline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  animation: ReturnType<typeof useEditorStore.getState>["animation"],
  playhead: number,
  selectedLayerId: number | null,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillRect(0, 0, 160, height);
  ctx.strokeStyle = "#27272a";
  ctx.beginPath();
  ctx.moveTo(160, 0);
  ctx.lineTo(160, height);
  ctx.stroke();

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = "#a1a1aa";
  for (let frame = animation.ip; frame <= animation.op; frame += 10) {
    const x = 160 + frame * frameWidth;
    ctx.fillText(String(frame), x + 3, 18);
    ctx.strokeStyle = frame % 60 === 0 ? "#3f3f46" : "#27272a";
    ctx.beginPath();
    ctx.moveTo(x, headerHeight);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  animation.layers.forEach((layer, index) => {
    const y = headerHeight + index * rowHeight;
    ctx.fillStyle = layer.ind === selectedLayerId ? "#27272a" : index % 2 === 0 ? "#111113" : "#0c0c0f";
    ctx.fillRect(0, y, width, rowHeight);
    ctx.fillStyle = "#d4d4d8";
    ctx.fillText(layer.nm, 10, y + 16);
    drawKeyframes(ctx, layer.ks.p.a === 1 ? layer.ks.p.k.map((item) => item.t) : [], y, "#f97316");
    drawKeyframes(ctx, layer.ks.o.a === 1 ? layer.ks.o.k.map((item) => item.t) : [], y, "#38bdf8");
  });

  const playheadX = 160 + playhead * frameWidth;
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
}

function drawKeyframes(ctx: CanvasRenderingContext2D, frames: number[], y: number, color: string): void {
  ctx.fillStyle = color;
  for (const frame of frames) {
    const x = 160 + frame * frameWidth;
    ctx.beginPath();
    ctx.moveTo(x, y + rowHeight / 2 - 5);
    ctx.lineTo(x + 5, y + rowHeight / 2);
    ctx.lineTo(x, y + rowHeight / 2 + 5);
    ctx.lineTo(x - 5, y + rowHeight / 2);
    ctx.closePath();
    ctx.fill();
  }
}
