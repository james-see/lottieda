import { easingHandle, type EasingPreset } from "./easing";
import { keyframed, sampleProperty } from "./keyframes";
import type { Animatable, Keyframe, LottieAnimation, LottieScalar, ShapeLayer, Transform, Vec2 } from "./schema";

export type MotionPresetId = "rotate" | "wiggle" | "shake" | "pulse" | "bounce" | "deform-reform";

export interface MotionPresetOptions {
  startFrame?: number;
  durationFrames?: number;
  durationSeconds?: number;
  easing?: EasingPreset;
}

export interface MotionPreset {
  id: MotionPresetId;
  name: string;
  description: string;
  targets: Array<keyof Pick<Transform, "p" | "s" | "r" | "o">>;
  apply: (context: MotionPresetContext) => Partial<Pick<Transform, "p" | "s" | "r" | "o">>;
}

interface MotionPresetContext {
  animation: LottieAnimation;
  layer: ShapeLayer;
  startFrame: number;
  endFrame: number;
  easing: EasingPreset;
  base: {
    position: Vec2;
    scale: Vec2;
    rotation: LottieScalar;
    opacity: LottieScalar;
  };
}

export const motionPresets: MotionPreset[] = [
  {
    id: "rotate",
    name: "Rotate",
    description: "One full clockwise rotation over the loop.",
    targets: ["r"],
    apply: ({ startFrame, endFrame, easing, base }) => ({
      r: scalarTrack(startFrame, endFrame, [base.rotation, base.rotation + 360], easing),
    }),
  },
  {
    id: "wiggle",
    name: "Wiggle",
    description: "Alternating rotation offsets that settle back to the original angle.",
    targets: ["r"],
    apply: ({ startFrame, endFrame, easing, base }) => ({
      r: scalarTrack(startFrame, endFrame, [0, -10, 8, -6, 4, 0].map((offset) => base.rotation + offset), easing),
    }),
  },
  {
    id: "shake",
    name: "Shake",
    description: "Quick horizontal position offsets ending at the original position.",
    targets: ["p"],
    apply: ({ startFrame, endFrame, easing, base }) => ({
      p: vec2Track(startFrame, endFrame, ([[0, 0], [-12, 0], [10, 0], [-8, 0], [5, 0], [0, 0]] as Vec2[]).map((offset) => addVec2(base.position, offset)), easing),
    }),
  },
  {
    id: "pulse",
    name: "Pulse",
    description: "Scale up and down around the current size.",
    targets: ["s"],
    apply: ({ startFrame, endFrame, easing, base }) => ({
      s: vec2Track(startFrame, endFrame, [1, 1.12, 0.94, 1.06, 1].map((amount) => multiplyVec2(base.scale, amount)), easing),
    }),
  },
  {
    id: "bounce",
    name: "Bounce",
    description: "Vertical bounce with squash and stretch.",
    targets: ["p", "s"],
    apply: ({ startFrame, endFrame, easing, base }) => ({
      p: vec2Track(startFrame, endFrame, [0, -34, -58, -18, 12, 0].map((offsetY) => addVec2(base.position, [0, offsetY])), easing),
      s: vec2Track(startFrame, endFrame, ([[1, 1], [0.96, 1.06], [0.92, 1.12], [1.05, 0.96], [1.16, 0.84], [1, 1]] as Vec2[]).map((amount) => multiplyVec2(base.scale, amount)), easing),
    }),
  },
  {
    id: "deform-reform",
    name: "Deform / Reform",
    description: "Distort the shape scale and return to the original form.",
    targets: ["s"],
    apply: ({ startFrame, endFrame, easing, base }) => ({
      s: vec2Track(startFrame, endFrame, ([[1, 1], [1.26, 0.74], [0.82, 1.22], [1.12, 0.92], [1, 1]] as Vec2[]).map((amount) => multiplyVec2(base.scale, amount)), easing),
    }),
  },
];

export function findMotionPreset(presetId: string): MotionPreset | undefined {
  return motionPresets.find((preset) => preset.id === presetId);
}

export function applyMotionPresetToLayer(
  layer: ShapeLayer,
  animation: LottieAnimation,
  presetId: string,
  options: MotionPresetOptions = {},
): boolean {
  const preset = findMotionPreset(presetId);
  if (!preset) return false;

  const timing = resolveTiming(animation, layer, options);
  const base = {
    position: sampleProperty(layer.ks.p, timing.startFrame),
    scale: sampleProperty(layer.ks.s, timing.startFrame),
    rotation: sampleProperty(layer.ks.r, timing.startFrame),
    opacity: sampleProperty(layer.ks.o, timing.startFrame),
  };
  const patch = preset.apply({ animation, layer, ...timing, easing: options.easing ?? "ease-in-out", base });

  layer.ks = { ...layer.ks, ...patch };
  return true;
}

function resolveTiming(animation: LottieAnimation, layer: ShapeLayer, options: MotionPresetOptions): { startFrame: number; endFrame: number } {
  const minFrame = Math.max(animation.ip, layer.ip);
  const maxFrame = Math.max(minFrame + 1, Math.min(animation.op, layer.op));
  const requestedStart = options.startFrame ?? minFrame;
  const startFrame = clampFrame(Math.round(requestedStart), minFrame, maxFrame - 1);
  const durationFrames = options.durationFrames ?? (options.durationSeconds ? Math.round(options.durationSeconds * animation.fr) : Math.round(animation.fr));
  const endFrame = clampFrame(startFrame + Math.max(1, Math.round(durationFrames)), startFrame + 1, maxFrame);

  return { startFrame, endFrame };
}

function scalarTrack(startFrame: number, endFrame: number, values: LottieScalar[], easing: EasingPreset): Animatable<LottieScalar> {
  return track(startFrame, endFrame, values, easing);
}

function vec2Track(startFrame: number, endFrame: number, values: Vec2[], easing: EasingPreset): Animatable<Vec2> {
  return track(startFrame, endFrame, values, easing);
}

function track<T>(startFrame: number, endFrame: number, values: T[], easing: EasingPreset): Animatable<T> {
  const handles = easingHandle(easing);
  const steps = Math.max(1, values.length - 1);
  const frames: Keyframe<T>[] = values.map((value, index) => ({
    t: startFrame + Math.round(((endFrame - startFrame) * index) / steps),
    s: value,
    ...handles,
  }));

  for (let index = 0; index < frames.length - 1; index += 1) {
    frames[index].e = frames[index + 1].s;
  }
  delete frames[frames.length - 1].e;

  return keyframed(frames);
}

function addVec2(left: Vec2, right: Vec2): Vec2 {
  return [left[0] + right[0], left[1] + right[1]];
}

function multiplyVec2(value: Vec2, multiplier: number | Vec2): Vec2 {
  const next = typeof multiplier === "number" ? [multiplier, multiplier] : multiplier;
  return [value[0] * next[0], value[1] * next[1]];
}

function clampFrame(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
