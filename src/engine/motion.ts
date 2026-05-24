import { keyframed } from "./keyframes";
import type { Animatable, Keyframe, LottieScalar, Vec2 } from "./schema";

export function makeKeyframes<T>(frames: Array<Pick<Keyframe<T>, "t" | "s">>): Animatable<T> {
  const sorted: Keyframe<T>[] = frames
    .map((frame) => ({ ...frame }))
    .sort((a, b) => a.t - b.t);

  for (let index = 0; index < sorted.length - 1; index += 1) {
    sorted[index].e = sorted[index + 1].s;
  }

  return keyframed(sorted);
}

export function keyframeRange<T>(startFrame: number, values: T[], frameStep = 1): Animatable<T> {
  return makeKeyframes(values.map((value, index) => ({ t: startFrame + index * frameStep, s: value })));
}

export function scalarKeyframeRange(startFrame: number, values: LottieScalar[], frameStep = 1): Animatable<LottieScalar> {
  return keyframeRange(startFrame, values, frameStep);
}

export function sampleSvgPath(d: string, frameCount: number): Vec2[] {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  const totalLength = path.getTotalLength();
  const steps = Math.max(1, frameCount - 1);

  return Array.from({ length: frameCount }, (_, index) => {
    const point = path.getPointAtLength((index / steps) * totalLength);
    return [point.x, point.y];
  });
}

export function positionKeyframesAlongPath(d: string, startFrame: number, endFrame: number, offset: Vec2 = [0, 0]): Animatable<Vec2> {
  const frameCount = Math.max(1, endFrame - startFrame + 1);
  const points = sampleSvgPath(d, frameCount).map<Vec2>((point) => [point[0] + offset[0], point[1] + offset[1]]);
  return keyframeRange(startFrame, points);
}

export function rotationKeyframesAlongPoints(points: Vec2[], startFrame: number, adjustmentDegrees = 0, frameStep = 1): Animatable<LottieScalar> {
  const rotations = points.map((point, index) => {
    const next = points[Math.min(index + 1, points.length - 1)];
    const previous = points[Math.max(index - 1, 0)];
    const dx = next[0] - previous[0] || point[0] - previous[0];
    const dy = next[1] - previous[1] || point[1] - previous[1];
    return (Math.atan2(dy, dx) * 180) / Math.PI + adjustmentDegrees;
  });

  return scalarKeyframeRange(startFrame, rotations, frameStep);
}
