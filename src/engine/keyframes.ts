import { clamp01, cubicBezierY, easingHandle, type EasingPreset } from "./easing";
import type { Animatable, Keyframe, KeyframedProperty, StaticProperty } from "./schema";

export function value<T>(k: T): StaticProperty<T> {
  return { a: 0, k };
}

export function keyframed<T>(frames: Keyframe<T>[]): KeyframedProperty<T> {
  return { a: 1, k: frames.sort((a, b) => a.t - b.t) };
}

export function withKeyframe<T>(
  property: Animatable<T>,
  frame: number,
  nextValue: T,
  preset: EasingPreset = "linear",
): Animatable<T> {
  const frames = property.a === 1 ? [...property.k] : [{ t: 0, s: property.k }];
  const existing = frames.find((item) => item.t === frame);

  if (existing) {
    existing.s = nextValue;
  } else {
    frames.push({ t: frame, s: nextValue, ...easingHandle(preset) });
  }

  const sorted = frames.sort((a, b) => a.t - b.t);
  for (let index = 0; index < sorted.length - 1; index += 1) {
    sorted[index].e = sorted[index + 1].s;
  }
  delete sorted[sorted.length - 1].e;

  return keyframed(sorted);
}

export function sampleProperty<T>(
  property: Animatable<T>,
  frame: number,
): T {
  if (property.a === 0 || property.k.length === 0) {
    return property.a === 0 ? property.k : ([] as unknown as T);
  }

  const frames = property.k;
  const first = frames[0];
  const last = frames[frames.length - 1];

  if (frame <= first.t) return first.s;
  if (frame >= last.t) return last.s;

  const fromIndex = frames.findIndex((item, index) => {
    const next = frames[index + 1];
    return next ? frame >= item.t && frame <= next.t : false;
  });
  const from = frames[fromIndex];
  const to = frames[fromIndex + 1];
  const progress = clamp01((frame - from.t) / (to.t - from.t));
  const eased = from.o && to.i ? cubicBezierY(progress, from.o.y[0] ?? 0, to.i.y[0] ?? 1) : progress;

  return interpolate(from.s, to.s, eased);
}

function interpolate<T>(from: T, to: T, t: number): T {
  if (typeof from === "number" && typeof to === "number") {
    return (from + (to - from) * t) as T;
  }

  if (Array.isArray(from) && Array.isArray(to) && from.every((value) => typeof value === "number")) {
    const fromArray = from as number[];
    const toArray = to as number[];
    return fromArray.map((value, index) => value + ((toArray[index] ?? value) - value) * t) as T;
  }

  return from;
}
