import { useState } from "react";
import { motionPresets } from "../../engine/motionPresets";
import { applyAnimationPreset } from "../api/animationCommands";
import { useEditorStore } from "../store/editorStore";
import { primitivePresets } from "./primitives";

export function ShelfPanel() {
  const [durationFrames, setDurationFrames] = useState(60);
  const animation = useEditorStore((state) => state.animation);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const appendLayers = useEditorStore((state) => state.appendLayers);
  const selectedShapeLayer = animation.layers.some((layer) => layer.ind === selectedLayerId && layer.ty === 4);
  const durationSeconds = durationFrames / animation.fr;

  return (
    <aside className="flex max-h-[360px] w-[220px] flex-col border-b border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Shelf</div>
      <div className="min-h-0 overflow-y-auto">
        <section className="p-2">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Primitives</div>
          <div className="grid grid-cols-2 gap-2">
            {primitivePresets.map((preset) => (
              <button
                key={preset.id}
                className="group rounded border border-zinc-800 bg-zinc-900/80 p-2 text-left hover:border-orange-500 hover:bg-zinc-800"
                onClick={() => appendLayers(preset.createLayers(animation))}
                title={preset.description}
                type="button"
              >
                <div className="mb-2 flex h-12 items-center justify-center rounded bg-zinc-950 text-[11px] font-semibold text-orange-300 group-hover:text-orange-200">
                  {preset.glyph}
                </div>
                <div className="truncate text-xs font-medium text-zinc-100">{preset.name}</div>
                <div className="mt-1 line-clamp-2 text-[10px] leading-tight text-zinc-500">{preset.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-800 p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Animations</div>
            <label className="flex items-center gap-1 text-[10px] text-zinc-500">
              Frames
              <input
                className="w-14 rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-right font-mono text-[11px] text-zinc-100 outline-none focus:border-orange-500"
                min={1}
                onChange={(event) => setDurationFrames(readDurationFrames(event.target.value))}
                type="number"
                value={durationFrames}
              />
            </label>
          </div>
          <div className="mb-2 text-[10px] text-zinc-600">{durationSeconds.toFixed(2)}s at {animation.fr}fps</div>
          <div className="grid grid-cols-2 gap-2">
            {motionPresets.map((preset) => (
              <button
                key={preset.id}
                className="rounded border border-zinc-800 bg-zinc-900/80 p-2 text-left hover:border-orange-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-zinc-800 disabled:hover:bg-zinc-900/80"
                disabled={!selectedShapeLayer}
                onClick={() => applyAnimationPreset({ presetId: preset.id, options: { durationFrames } })}
                title={selectedShapeLayer ? preset.description : "Select a shape layer to apply an animation."}
                type="button"
              >
                <div className="truncate text-xs font-medium text-zinc-100">{preset.name}</div>
                <div className="mt-1 line-clamp-2 text-[10px] leading-tight text-zinc-500">{preset.description}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function readDurationFrames(value: string): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(1, Math.round(nextValue)) : 1;
}
