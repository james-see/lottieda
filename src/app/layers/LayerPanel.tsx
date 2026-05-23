import { useEditorStore } from "../store/editorStore";

const typeLabels: Record<number, string> = {
  0: "Precomp",
  1: "Solid",
  2: "Image",
  3: "Null",
  4: "Shape",
  5: "Text",
};

export function LayerPanel() {
  const layers = useEditorStore((state) => state.animation.layers);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const toggleLayerHidden = useEditorStore((state) => state.toggleLayerHidden);
  const reorderLayer = useEditorStore((state) => state.reorderLayer);

  return (
    <aside className="flex w-[220px] flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Layers</div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-sm text-zinc-500">Draw a rectangle, ellipse, or path to create your first layer.</div>
        ) : (
          layers.map((layer) => (
            <div
              key={layer.ind}
              className={`group border-b border-zinc-900 px-2 py-2 ${selectedLayerId === layer.ind ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
              onClick={() => selectLayer(layer.ind)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-2">
                <button
                  className="w-7 rounded bg-zinc-900 py-1 text-xs text-zinc-300"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleLayerHidden(layer.ind);
                  }}
                  type="button"
                >
                  {layer.hd ? "Off" : "Eye"}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-zinc-100">{layer.nm}</div>
                  <div className="text-xs text-zinc-500">{typeLabels[layer.ty] ?? "Layer"}</div>
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button className="rounded px-1 text-xs text-zinc-400 hover:text-zinc-100" onClick={(event) => { event.stopPropagation(); reorderLayer(layer.ind, -1); }} type="button">Up</button>
                  <button className="rounded px-1 text-xs text-zinc-400 hover:text-zinc-100" onClick={(event) => { event.stopPropagation(); reorderLayer(layer.ind, 1); }} type="button">Down</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
