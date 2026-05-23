import { useCallback, useEffect, useRef, useState } from "react";
import { drawSelection, renderAnimationToCanvas, type RenderHit } from "../../renderer/canvas";
import { useEditorStore } from "../store/editorStore";
import type { Vec2 } from "../../engine/schema";

interface DragState {
  start: Vec2;
  last: Vec2;
  mode: "draw" | "move";
}

export function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitsRef = useRef<RenderHit[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [workingPath, setWorkingPath] = useState<Vec2[]>([]);
  const {
    animation,
    playhead,
    selectedLayerId,
    tool,
    addRectangle,
    addEllipse,
    addPath,
    moveSelectedLayer,
    selectLayer,
  } = useEditorStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = animation.w;
    canvas.height = animation.h;
    hitsRef.current = renderAnimationToCanvas(ctx, animation, playhead);

    const selectedHit = [...hitsRef.current].reverse().find((hit) => hit.layerId === selectedLayerId);
    if (selectedHit) drawSelection(ctx, selectedHit.bounds);

    if (drag?.mode === "draw" && (tool === "rect" || tool === "ellipse")) {
      const bounds = boundsFromPoints(drag.start, drag.last);
      ctx.save();
      ctx.strokeStyle = "#f97316";
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.restore();
    }

    if (workingPath.length > 0) {
      ctx.save();
      ctx.strokeStyle = "#22c55e";
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      workingPath.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point[0], point[1]);
        else ctx.lineTo(point[0], point[1]);
        ctx.fillRect(point[0] - 3, point[1] - 3, 6, 6);
      });
      ctx.stroke();
      ctx.restore();
    }
  }, [animation, drag, playhead, selectedLayerId, tool, workingPath]);

  useEffect(() => {
    draw();
  }, [draw]);

  const pointerPoint = (event: React.PointerEvent<HTMLCanvasElement>): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) / rect.width) * animation.w,
      ((event.clientY - rect.top) / rect.height) * animation.h,
    ];
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointerPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "rect" || tool === "ellipse") {
      setDrag({ start: point, last: point, mode: "draw" });
      return;
    }

    if (tool === "path") {
      setWorkingPath((points) => [...points, point]);
      return;
    }

    const hit = [...hitsRef.current].reverse().find((item) => contains(item.bounds, point));
    selectLayer(hit?.layerId ?? null);
    if (hit) setDrag({ start: point, last: point, mode: "move" });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    const point = pointerPoint(event);
    if (drag.mode === "move") {
      moveSelectedLayer([point[0] - drag.last[0], point[1] - drag.last[1]]);
      setDrag({ ...drag, last: point });
    } else {
      setDrag({ ...drag, last: point });
    }
  };

  const handlePointerUp = () => {
    if (!drag) return;
    const bounds = boundsFromPoints(drag.start, drag.last);
    if (drag.mode === "draw" && bounds.width > 4 && bounds.height > 4) {
      const position: Vec2 = [bounds.x + bounds.width / 2 - animation.w / 2, bounds.y + bounds.height / 2 - animation.h / 2];
      const size: Vec2 = [bounds.width, bounds.height];
      if (tool === "rect") addRectangle(position, size);
      if (tool === "ellipse") addEllipse(position, size);
    }
    setDrag(null);
  };

  const commitPath = () => {
    if (workingPath.length < 2) return;
    const centered = workingPath.map<Vec2>((point) => [point[0] - animation.w / 2, point[1] - animation.h / 2]);
    addPath({
      c: false,
      v: centered,
      i: centered.map(() => [0, 0]),
      o: centered.map(() => [0, 0]),
    });
    setWorkingPath([]);
  };

  return (
    <div className="flex h-full items-center justify-center overflow-auto bg-zinc-950 p-6">
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full rounded border border-zinc-800 shadow-2xl"
        onDoubleClick={tool === "path" ? commitPath : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}

function boundsFromPoints(start: Vec2, end: Vec2): DOMRect {
  const x = Math.min(start[0], end[0]);
  const y = Math.min(start[1], end[1]);
  return new DOMRect(x, y, Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]));
}

function contains(bounds: DOMRect, point: Vec2): boolean {
  return point[0] >= bounds.x && point[0] <= bounds.x + bounds.width && point[1] >= bounds.y && point[1] <= bounds.y + bounds.height;
}
