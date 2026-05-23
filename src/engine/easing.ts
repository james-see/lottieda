import type { EasingHandle } from "./schema";

export type EasingPreset = "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring";

export const easingPresets: Record<EasingPreset, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
  spring: [0.22, 1.2, 0.36, 1],
};

export function easingHandle(preset: EasingPreset = "linear"): { o: EasingHandle; i: EasingHandle } {
  const [cx1, cy1, cx2, cy2] = easingPresets[preset];
  return {
    o: { x: [cx1], y: [cy1] },
    i: { x: [cx2], y: [cy2] },
  };
}

export function cubicBezierY(t: number, cy1: number, cy2: number): number {
  const u = 1 - t;
  return 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
