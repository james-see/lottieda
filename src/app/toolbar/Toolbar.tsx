import { useEffect } from "react";
import { useEditorStore, type Tool } from "../store/editorStore";
import { FileActions } from "./FileActions";

const tools: Array<{ id: Tool; label: string; shortcut: string }> = [
  { id: "select", label: "Select", shortcut: "V" },
  { id: "rect", label: "Rect", shortcut: "R" },
  { id: "ellipse", label: "Ellipse", shortcut: "O" },
  { id: "path", label: "Path", shortcut: "P" },
  { id: "text", label: "Text", shortcut: "T" },
];

export function Toolbar() {
  const tool = useEditorStore((state) => state.tool);
  const setTool = useEditorStore((state) => state.setTool);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const setPlaying = useEditorStore((state) => state.setPlaying);
  const playhead = useEditorStore((state) => state.playhead);
  const setPlayhead = useEditorStore((state) => state.setPlayhead);
  const frameRate = useEditorStore((state) => state.animation.fr);
  const totalFrames = useEditorStore((state) => state.animation.op);
  const setFrameRate = useEditorStore((state) => state.setFrameRate);
  const setTotalFrames = useEditorStore((state) => state.setTotalFrames);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const match = tools.find((item) => item.shortcut.toLowerCase() === event.key.toLowerCase());
      if (match) setTool(match.id);
      if (event.key === " ") {
        event.preventDefault();
        setPlaying(!useEditorStore.getState().isPlaying);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setPlaying, setTool]);

  return (
    <header className="flex h-12 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-3">
      <div className="flex items-center gap-2">
        <span className="mr-3 text-sm font-semibold text-zinc-100">LottieDa</span>
        {tools.map((item) => (
          <button
            key={item.id}
            className={`rounded px-3 py-1.5 text-xs ${tool === item.id ? "bg-orange-500 text-zinc-950" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}
            onClick={() => setTool(item.id)}
            type="button"
          >
            {item.label}
            <span className="ml-2 font-mono opacity-70">{item.shortcut}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500">
          FPS
          <input
            className="w-14 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 font-mono text-xs text-zinc-200"
            max={120}
            min={1}
            onChange={(event) => setFrameRate(Number(event.target.value))}
            type="number"
            value={frameRate}
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500">
          Frames
          <input
            className="w-20 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 font-mono text-xs text-zinc-200"
            max={10000}
            min={1}
            onChange={(event) => setTotalFrames(Number(event.target.value))}
            type="number"
            value={totalFrames}
          />
        </label>
        <button className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800" onClick={() => setPlaying(!isPlaying)} type="button">
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          className="w-52 accent-orange-500"
          max={totalFrames - 1}
          min={0}
          onChange={(event) => setPlayhead(Number(event.target.value))}
          type="range"
          value={playhead}
        />
        <span className="w-16 text-right font-mono text-xs text-zinc-400">{Math.round(playhead)}f</span>
        <FileActions />
      </div>
    </header>
  );
}
