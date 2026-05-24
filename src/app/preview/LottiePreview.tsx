import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";
import lottie from "lottie-web/build/player/lottie_light";
import { useEditorStore } from "../store/editorStore";

export function LottiePreview() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<AnimationItem | null>(null);
  const animation = useEditorStore((state) => state.animation);
  const playhead = useEditorStore((state) => state.playhead);
  const isPlaying = useEditorStore((state) => state.isPlaying);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    playerRef.current?.destroy();
    playerRef.current = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: true,
      autoplay: false,
      animationData: animation,
    });
    return () => playerRef.current?.destroy();
  }, [animation]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.play();
    else {
      player.pause();
      player.goToAndStop(playhead, true);
    }
  }, [isPlaying, playhead]);

  return (
    <section className="flex h-48 flex-col border-t border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
        <span>Preview Renderer</span>
        <span className="font-mono">lottie-web light svg</span>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1" />
    </section>
  );
}
