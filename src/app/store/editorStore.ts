import { create } from "zustand";
import { createDefaultAnimation, createEllipse, createFill, createPath, createRect, createShapeLayer, createStroke, setStatic } from "../../engine/builder";
import { sampleProperty, withKeyframe } from "../../engine/keyframes";
import type { LottieAnimation, LottieLayer, LottiePath, Rgba, ShapeLayer, Vec2 } from "../../engine/schema";

export type Tool = "select" | "rect" | "ellipse" | "path" | "text";

interface EditorState {
  animation: LottieAnimation;
  selectedLayerId: number | null;
  tool: Tool;
  playhead: number;
  isPlaying: boolean;
  dirty: boolean;
  setAnimation: (animation: LottieAnimation) => void;
  appendLayers: (layers: ShapeLayer[]) => void;
  setFrameRate: (frameRate: number) => void;
  setTotalFrames: (totalFrames: number) => void;
  setTool: (tool: Tool) => void;
  selectLayer: (id: number | null) => void;
  setPlayhead: (frame: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  addRectangle: (position: Vec2, size: Vec2) => void;
  addEllipse: (position: Vec2, size: Vec2) => void;
  addPath: (path: LottiePath) => void;
  moveSelectedLayer: (delta: Vec2) => void;
  updateSelectedOpacity: (opacity: number, keyframe: boolean) => void;
  updateSelectedPosition: (position: Vec2, keyframe: boolean) => void;
  updateSelectedRotation: (rotation: number, keyframe: boolean) => void;
  updateSelectedScale: (scale: Vec2, keyframe: boolean) => void;
  keyframeSelectedTransform: (property: "position" | "scale" | "rotation" | "opacity", frame?: number) => void;
  updateSelectedStyle: (style: Partial<{ fill: Rgba; stroke: Rgba; strokeWidth: number }>) => void;
  toggleLayerHidden: (id: number) => void;
  reorderLayer: (id: number, direction: -1 | 1) => void;
}

const defaultFill: Rgba = [0.8, 0.25, 0.25, 1];
const defaultStroke: Rgba = [1, 1, 1, 1];

export const useEditorStore = create<EditorState>((set, get) => ({
  animation: createDefaultAnimation(),
  selectedLayerId: null,
  tool: "select",
  playhead: 0,
  isPlaying: false,
  dirty: false,
  setAnimation: (animation) => set({ animation, selectedLayerId: animation.layers[0]?.ind ?? null, dirty: false }),
  appendLayers: (layers) =>
    set((state) => {
      const maxId = Math.max(0, ...state.animation.layers.map((layer) => layer.ind));
      const nextLayers = layers.map((layer, index) => ({ ...layer, ind: maxId + index + 1 }));
      return {
        animation: { ...state.animation, layers: [...nextLayers, ...state.animation.layers] },
        selectedLayerId: nextLayers[0]?.ind ?? state.selectedLayerId,
        tool: "select",
        dirty: true,
      };
    }),
  setFrameRate: (frameRate) =>
    set((state) => ({
      animation: { ...state.animation, fr: clampNumber(frameRate, 1, 120) },
      dirty: true,
    })),
  setTotalFrames: (totalFrames) =>
    set((state) => {
      const nextOutPoint = clampNumber(Math.round(totalFrames), 1, 10000);
      return {
        animation: {
          ...state.animation,
          op: nextOutPoint,
          layers: state.animation.layers.map((layer) => ({ ...layer, op: nextOutPoint })),
        },
        playhead: Math.min(state.playhead, nextOutPoint - 1),
        dirty: true,
      };
    }),
  setTool: (tool) => set({ tool }),
  selectLayer: (id) => set({ selectedLayerId: id }),
  setPlayhead: (frame) => {
    const { animation } = get();
    set({ playhead: Math.max(animation.ip, Math.min(animation.op - 1, frame)) });
  },
  setPlaying: (isPlaying) => set({ isPlaying }),
  addRectangle: (position, size) => addShape("Rectangle", [createRect(position, size), createFill(defaultFill), createStroke(defaultStroke, 2)]),
  addEllipse: (position, size) => addShape("Ellipse", [createEllipse(position, size), createFill([0.25, 0.45, 0.95, 1]), createStroke(defaultStroke, 2)]),
  addPath: (path) => addShape("Path", [createPath(path), createFill([0.35, 0.8, 0.45, 0.65]), createStroke(defaultStroke, 2)]),
  moveSelectedLayer: (delta) =>
    set((state) => updateSelectedLayer(state, (layer) => {
      const p = layer.ks.p;
      const current = p.a === 0 ? p.k : p.k[0]?.s ?? [0, 0];
      layer.ks.p = setStatic(p, [current[0] + delta[0], current[1] + delta[1]]);
    })),
  updateSelectedOpacity: (opacity, keyframe) =>
    set((state) => updateSelectedLayer(state, (layer) => {
      layer.ks.o = keyframe ? withKeyframe(layer.ks.o, state.playhead, opacity, "ease-in-out") : setStatic(layer.ks.o, opacity);
    })),
  updateSelectedPosition: (position, keyframe) =>
    set((state) => updateSelectedLayer(state, (layer) => {
      layer.ks.p = keyframe ? withKeyframe(layer.ks.p, state.playhead, position, "ease-in-out") : setStatic(layer.ks.p, position);
    })),
  updateSelectedRotation: (rotation, keyframe) =>
    set((state) => updateSelectedLayer(state, (layer) => {
      layer.ks.r = keyframe ? withKeyframe(layer.ks.r, state.playhead, rotation, "ease-in-out") : setStatic(layer.ks.r, rotation);
    })),
  updateSelectedScale: (scale, keyframe) =>
    set((state) => updateSelectedLayer(state, (layer) => {
      layer.ks.s = keyframe ? withKeyframe(layer.ks.s, state.playhead, scale, "ease-in-out") : setStatic(layer.ks.s, scale);
    })),
  keyframeSelectedTransform: (property, frame) =>
    set((state) => updateSelectedLayer(state, (layer) => {
      const targetFrame = frame ?? state.playhead;
      if (property === "position") {
        layer.ks.p = withKeyframe(layer.ks.p, targetFrame, sampleProperty(layer.ks.p, state.playhead), "ease-in-out");
      }
      if (property === "scale") {
        layer.ks.s = withKeyframe(layer.ks.s, targetFrame, sampleProperty(layer.ks.s, state.playhead), "ease-in-out");
      }
      if (property === "rotation") {
        layer.ks.r = withKeyframe(layer.ks.r, targetFrame, sampleProperty(layer.ks.r, state.playhead), "ease-in-out");
      }
      if (property === "opacity") {
        layer.ks.o = withKeyframe(layer.ks.o, targetFrame, sampleProperty(layer.ks.o, state.playhead), "ease-in-out");
      }
    })),
  updateSelectedStyle: (style) =>
    set((state) => updateSelectedLayer(state, (layer) => {
      for (const shape of layer.shapes) {
        if (shape.ty === "fl" && style.fill) shape.c = setStatic(shape.c, style.fill);
        if (shape.ty === "st") {
          if (style.stroke) shape.c = setStatic(shape.c, style.stroke);
          if (style.strokeWidth !== undefined) shape.w = setStatic(shape.w, style.strokeWidth);
        }
      }
    })),
  toggleLayerHidden: (id) =>
    set((state) => ({
      animation: {
        ...state.animation,
        layers: state.animation.layers.map((layer) => (layer.ind === id ? { ...layer, hd: !layer.hd } : layer)),
      },
      dirty: true,
    })),
  reorderLayer: (id, direction) =>
    set((state) => {
      const layers = [...state.animation.layers];
      const index = layers.findIndex((layer) => layer.ind === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= layers.length) return state;
      [layers[index], layers[nextIndex]] = [layers[nextIndex], layers[index]];
      return { animation: { ...state.animation, layers }, dirty: true };
    }),
}));

function addShape(name: string, shapes: ShapeLayer["shapes"]) {
  const { animation } = useEditorStore.getState();
  const nextId = Math.max(0, ...animation.layers.map((layer) => layer.ind)) + 1;
  const layer = createShapeLayer({
    id: nextId,
    name,
    width: animation.w,
    height: animation.h,
    duration: animation.op,
  });
  layer.shapes = shapes;
  useEditorStore.setState({
    animation: { ...animation, layers: [layer, ...animation.layers] },
    selectedLayerId: layer.ind,
    tool: "select",
    dirty: true,
  });
}

function updateSelectedLayer(
  state: EditorState,
  updater: (layer: ShapeLayer) => void,
): Pick<EditorState, "animation" | "dirty"> {
  const layers: LottieLayer[] = state.animation.layers.map((layer) => {
    if (layer.ind !== state.selectedLayerId || layer.ty !== 4) return layer;
    const nextLayer: ShapeLayer = structuredClone(layer);
    updater(nextLayer);
    return nextLayer;
  });
  return { animation: { ...state.animation, layers }, dirty: true };
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
