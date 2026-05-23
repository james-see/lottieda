import { useMemo, useState } from "react";
import { sampleProperty } from "../../engine/keyframes";
import type { Rgba, ShapeLayer, Vec2 } from "../../engine/schema";
import { useEditorStore } from "../store/editorStore";

export function PropertyInspector() {
  const animation = useEditorStore((state) => state.animation);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const playhead = useEditorStore((state) => state.playhead);
  const updateSelectedOpacity = useEditorStore((state) => state.updateSelectedOpacity);
  const updateSelectedPosition = useEditorStore((state) => state.updateSelectedPosition);
  const updateSelectedStyle = useEditorStore((state) => state.updateSelectedStyle);
  const [keyframe, setKeyframe] = useState(false);
  const layer = useMemo(() => animation.layers.find((item) => item.ind === selectedLayerId), [animation.layers, selectedLayerId]);

  if (!layer) {
    return (
      <aside className="w-[300px] border-l border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
        Select a layer to edit transform and style properties.
      </aside>
    );
  }

  const position = sampleProperty(layer.ks.p, playhead);
  const opacity = sampleProperty(layer.ks.o, playhead);
  const shapeLayer = layer.ty === 4 ? layer : null;
  const style = shapeLayer ? readShapeStyle(shapeLayer, playhead) : null;

  return (
    <aside className="flex w-[300px] flex-col border-l border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="text-sm font-semibold text-zinc-100">{layer.nm}</div>
        <div className="text-xs text-zinc-500">Layer {layer.ind}</div>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input checked={keyframe} className="accent-orange-500" onChange={(event) => setKeyframe(event.target.checked)} type="checkbox" />
          Keyframe edits at frame {Math.round(playhead)}
        </label>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Transform</h2>
          <Vec2Field label="Position" onChange={(value) => updateSelectedPosition(value, keyframe)} value={position} />
          <NumberField label="Opacity" max={100} min={0} onChange={(value) => updateSelectedOpacity(value, keyframe)} value={opacity} />
        </section>

        {style ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Shape</h2>
            <ColorField label="Fill" onChange={(value) => updateSelectedStyle({ fill: value })} value={style.fill} />
            <ColorField label="Stroke" onChange={(value) => updateSelectedStyle({ stroke: value })} value={style.stroke} />
            <NumberField label="Stroke width" min={0} onChange={(value) => updateSelectedStyle({ strokeWidth: value })} value={style.strokeWidth} />
          </section>
        ) : null}
      </div>
    </aside>
  );
}

function Vec2Field({ label, value, onChange }: { label: string; value: Vec2; onChange: (value: Vec2) => void }) {
  return (
    <div>
      <div className="mb-1 text-xs text-zinc-400">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput value={value[0]} onChange={(next) => onChange([next, value[1]])} />
        <NumberInput value={value[1]} onChange={(next) => onChange([value[0], next])} />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-zinc-400">{label}</div>
      <NumberInput max={max} min={min} onChange={onChange} value={value} />
    </label>
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return (
    <input
      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 font-mono text-sm text-zinc-100 outline-none focus:border-orange-500"
      max={max}
      min={min}
      onChange={(event) => onChange(Number(event.target.value))}
      type="number"
      value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
    />
  );
}

function ColorField({ label, value, onChange }: { label: string; value: Rgba; onChange: (value: Rgba) => void }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-zinc-400">{label}</div>
      <input
        className="h-9 w-full rounded border border-zinc-800 bg-zinc-900"
        onChange={(event) => onChange(hexToRgba(event.target.value, value[3]))}
        type="color"
        value={rgbaToHex(value)}
      />
    </label>
  );
}

function readShapeStyle(layer: ShapeLayer, frame: number): { fill: Rgba; stroke: Rgba; strokeWidth: number } {
  const style = { fill: [0.8, 0.25, 0.25, 1] as Rgba, stroke: [1, 1, 1, 1] as Rgba, strokeWidth: 0 };
  for (const shape of layer.shapes) {
    if (shape.ty === "fl") style.fill = sampleProperty(shape.c, frame);
    if (shape.ty === "st") {
      style.stroke = sampleProperty(shape.c, frame);
      style.strokeWidth = sampleProperty(shape.w, frame);
    }
  }
  return style;
}

function rgbaToHex(color: Rgba): string {
  return `#${color.slice(0, 3).map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgba(hex: string, alpha = 1): Rgba {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
    alpha,
  ];
}
