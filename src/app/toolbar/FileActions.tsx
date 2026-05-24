import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useRef, useState } from "react";
import { parseLottieJson } from "../../engine/validation";
import { importSvgToLayers } from "../../importers/svg";
import { useEditorStore } from "../store/editorStore";

export function FileActions() {
  const [path, setPath] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const svgInputRef = useRef<HTMLInputElement | null>(null);
  const animation = useEditorStore((state) => state.animation);
  const setAnimation = useEditorStore((state) => state.setAnimation);
  const appendLayers = useEditorStore((state) => state.appendLayers);

  const openJson = async () => {
    try {
      const selected = await open({
        title: "Open Lottie JSON",
        filters: [{ name: "Lottie JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (!selected || Array.isArray(selected)) return;
      const json = await invoke<string>("open_lottie", { path: selected });
      setAnimation(parseLottieJson(json));
      setPath(selected);
      setMessage(`Opened ${fileName(selected)}`);
    } catch (error) {
      setMessage(String(error));
    }
  };

  const saveJson = async (saveAs = false) => {
    try {
      const targetPath = saveAs || !path ? await pickSavePath(path) : path;
      if (!targetPath) return;
      const normalizedPath = ensureJsonPath(targetPath);
      await invoke("save_lottie", { path: normalizedPath, json: JSON.stringify(animation), format: "json" });
      setPath(normalizedPath);
      setMessage(`Saved ${fileName(normalizedPath)}`);
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
      <button className="rounded bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800" onClick={openJson} type="button">
        Open
      </button>
      <button className="rounded bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800" onClick={() => void saveJson(false)} type="button">
        Save
      </button>
      <button className="rounded bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800" onClick={() => void saveJson(true)} type="button">
        Save As
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
      <span className="max-w-52 truncate text-xs text-zinc-500">{message || (path ? fileName(path) : "Untitled")}</span>
    </div>
  );
}

async function pickSavePath(currentPath: string | null): Promise<string | null> {
  return save({
    title: "Save Lottie JSON",
    defaultPath: currentPath ?? "animation.json",
    filters: [{ name: "Lottie JSON", extensions: ["json"] }],
  });
}

function ensureJsonPath(path: string): string {
  return path.toLowerCase().endsWith(".json") ? path : `${path}.json`;
}

function fileName(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path;
}
