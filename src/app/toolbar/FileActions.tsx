import { invoke } from "@tauri-apps/api/core";
import { useRef, useState } from "react";
import { parseLottieJson } from "../../engine/validation";
import { importSvgToLayers } from "../../importers/svg";
import { useEditorStore } from "../store/editorStore";

export function FileActions() {
  const [path, setPath] = useState("animation.json");
  const [message, setMessage] = useState("");
  const svgInputRef = useRef<HTMLInputElement | null>(null);
  const animation = useEditorStore((state) => state.animation);
  const setAnimation = useEditorStore((state) => state.setAnimation);
  const appendLayers = useEditorStore((state) => state.appendLayers);

  const openJson = async () => {
    try {
      const json = await invoke<string>("open_lottie", { path });
      setAnimation(parseLottieJson(json));
      setMessage("Opened");
    } catch (error) {
      setMessage(String(error));
    }
  };

  const saveJson = async () => {
    try {
      await invoke("save_lottie", { path, json: JSON.stringify(animation), format: "json" });
      setMessage("Saved");
    } catch (error) {
      setMessage(String(error));
    }
  };

  const importSvg = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      appendLayers(importSvgToLayers(text, animation.w, animation.h, animation.op));
      setMessage(`Imported ${file.name}`);
    } catch (error) {
      setMessage(String(error));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        className="w-52 rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-orange-500"
        onChange={(event) => setPath(event.target.value)}
        value={path}
      />
      <button className="rounded bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800" onClick={openJson} type="button">
        Open
      </button>
      <button className="rounded bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800" onClick={saveJson} type="button">
        Save
      </button>
      <button className="rounded bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800" onClick={() => svgInputRef.current?.click()} type="button">
        Import SVG
      </button>
      <input
        ref={svgInputRef}
        accept=".svg,image/svg+xml"
        className="hidden"
        onChange={(event) => void importSvg(event.target.files?.[0])}
        type="file"
      />
      <span className="max-w-52 truncate text-xs text-zinc-500">{message}</span>
    </div>
  );
}
