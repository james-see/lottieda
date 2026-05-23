import { useEffect } from "react";
import { EditorCanvas } from "./app/editor/EditorCanvas";
import { LayerPanel } from "./app/layers/LayerPanel";
import { LottiePreview } from "./app/preview/LottiePreview";
import { PropertyInspector } from "./app/properties/PropertyInspector";
import { useEditorStore } from "./app/store/editorStore";
import { Timeline } from "./app/timeline/Timeline";
import { Toolbar } from "./app/toolbar/Toolbar";

export function App() {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const animation = useEditorStore((state) => state.animation);
  const setPlayhead = useEditorStore((state) => state.setPlayhead);

  useEffect(() => {
    if (!isPlaying) return;
    let animationFrame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const deltaFrames = ((now - last) / 1000) * animation.fr;
      last = now;
      const current = useEditorStore.getState().playhead;
      const next = current + deltaFrames >= animation.op ? animation.ip : current + deltaFrames;
      setPlayhead(next);
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [animation.fr, animation.ip, animation.op, isPlaying, setPlayhead]);

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <Toolbar />
      <main className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)_300px] grid-rows-[minmax(0,1fr)_190px]">
        <div className="row-span-2">
          <LayerPanel />
        </div>
        <div className="min-h-0">
          <EditorCanvas />
        </div>
        <div className="row-span-2">
          <PropertyInspector />
        </div>
        <Timeline />
      </main>
      <LottiePreview />
    </div>
  );
}
