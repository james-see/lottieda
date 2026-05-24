import { useEditorStore } from "../store/editorStore";
import { primitivePresets } from "./primitives";

export function ShelfPanel() {
  const animation = useEditorStore((state) => state.animation);
  const appendLayers = useEditorStore((state) => state.appendLayers);

  return (
    <aside className="flex max-h-[260px] w-[220px] flex-col border-b border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Shelf</div>
      <div className="grid grid-cols-2 gap-2 overflow-y-auto p-2">
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
    </aside>
  );
}
