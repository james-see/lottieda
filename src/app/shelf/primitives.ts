import { createEllipse, createFill, createPath, createShapeLayer, createStroke } from "../../engine/builder";
import { value } from "../../engine/keyframes";
import { keyframeRange, rotationKeyframesAlongPoints, sampleSvgPath, scalarKeyframeRange } from "../../engine/motion";
import type { LottieAnimation, LottiePath, Rgba, ShapeLayer, Vec2 } from "../../engine/schema";

export interface PrimitivePreset {
  id: string;
  name: string;
  glyph: string;
  description: string;
  createLayers: (animation: LottieAnimation) => ShapeLayer[];
}

export const primitivePresets: PrimitivePreset[] = [
  {
    id: "isometric-cube",
    name: "Cube",
    glyph: "Cube",
    description: "Three animated isometric faces with a 10-frame shimmer.",
    createLayers: createIsometricCube,
  },
  {
    id: "bouncing-ball",
    name: "Bounce",
    glyph: "Ball",
    description: "A ball with position and squash/stretch keyframes.",
    createLayers: createBouncingBall,
  },
  {
    id: "path-runner",
    name: "Path Runner",
    glyph: "Path",
    description: "An arrow sampled along an SVG curve frame by frame.",
    createLayers: createPathRunner,
  },
  {
    id: "pulse-diamond",
    name: "Diamond",
    glyph: "Diamond",
    description: "A diamond with scale, rotation, and opacity pulse keyframes.",
    createLayers: createPulseDiamond,
  },
];

function createIsometricCube(animation: LottieAnimation): ShapeLayer[] {
  const center: Vec2 = [animation.w / 2, animation.h / 2];
  const transforms = {
    s: keyframeRange(0, [
      [100, 100],
      [101, 99],
      [103, 98],
      [104, 98],
      [103, 99],
      [100, 100],
      [98, 102],
      [97, 103],
      [98, 102],
      [100, 100],
    ] as Vec2[]),
    r: scalarKeyframeRange(0, [-4, -3, -1, 1, 3, 4, 3, 1, -2, -4]),
  };

  const top = polygon([
    [0, -64],
    [58, -32],
    [0, 0],
    [-58, -32],
  ]);
  const right = polygon([
    [58, -32],
    [58, 36],
    [0, 70],
    [0, 0],
  ]);
  const left = polygon([
    [-58, -32],
    [0, 0],
    [0, 70],
    [-58, 36],
  ]);

  return [
    faceLayer("Cube top", animation, center, top, [0.94, 0.58, 0.22, 1], transforms),
    faceLayer("Cube right", animation, center, right, [0.78, 0.34, 0.16, 1], transforms),
    faceLayer("Cube left", animation, center, left, [0.55, 0.22, 0.62, 1], transforms),
  ];
}

function createBouncingBall(animation: LottieAnimation): ShapeLayer[] {
  const center: Vec2 = [animation.w / 2, animation.h / 2];
  const layer = baseLayer("Bouncing Ball", animation, center);
  layer.shapes = [createEllipse([0, 0], [96, 96], "Ball"), createFill([0.18, 0.62, 0.95, 1]), createStroke([1, 1, 1, 0.9], 3)];
  layer.ks.p = keyframeRange(0, [
    [center[0] - 80, center[1] - 54],
    [center[0] - 62, center[1] - 82],
    [center[0] - 44, center[1] - 92],
    [center[0] - 26, center[1] - 72],
    [center[0] - 8, center[1] - 26],
    [center[0] + 10, center[1] + 28],
    [center[0] + 28, center[1] + 42],
    [center[0] + 46, center[1] + 8],
    [center[0] + 64, center[1] - 42],
    [center[0] + 82, center[1] - 58],
  ]);
  layer.ks.s = keyframeRange(0, [
    [100, 100],
    [98, 104],
    [96, 106],
    [98, 103],
    [104, 96],
    [118, 78],
    [126, 70],
    [104, 96],
    [97, 105],
    [100, 100],
  ] as Vec2[]);
  return [layer];
}

function createPathRunner(animation: LottieAnimation): ShapeLayer[] {
  const center: Vec2 = [animation.w / 2, animation.h / 2];
  const pathD = `M ${center[0] - 150} ${center[1] + 56} C ${center[0] - 88} ${center[1] - 110}, ${center[0] + 82} ${center[1] + 122}, ${center[0] + 152} ${center[1] - 46}`;
  const points = sampleSvgPath(pathD, 10);
  const layer = baseLayer("Path Runner", animation, points[0]);
  layer.shapes = [
    createPath(polygon([
      [24, 0],
      [-14, -14],
      [-6, 0],
      [-14, 14],
    ]), "Arrow"),
    createFill([0.32, 0.9, 0.55, 1]),
    createStroke([0.05, 0.1, 0.08, 1], 2),
  ];
  layer.ks.p = keyframeRange(0, points);
  layer.ks.r = rotationKeyframesAlongPoints(points, 0);
  return [layer];
}

function createPulseDiamond(animation: LottieAnimation): ShapeLayer[] {
  const center: Vec2 = [animation.w / 2, animation.h / 2];
  const layer = baseLayer("Pulse Diamond", animation, center);
  layer.shapes = [
    createPath(polygon([
      [0, -68],
      [68, 0],
      [0, 68],
      [-68, 0],
    ]), "Diamond"),
    createFill([0.95, 0.42, 0.72, 0.9]),
    createStroke([1, 1, 1, 1], 3),
  ];
  layer.ks.s = keyframeRange(0, [
    [82, 82],
    [90, 90],
    [104, 104],
    [120, 120],
    [110, 110],
    [96, 96],
    [88, 88],
    [94, 94],
    [104, 104],
    [82, 82],
  ] as Vec2[]);
  layer.ks.r = scalarKeyframeRange(0, [0, 8, 16, 24, 32, 40, 48, 56, 64, 72]);
  layer.ks.o = scalarKeyframeRange(0, [55, 70, 88, 100, 82, 68, 54, 72, 90, 55]);
  return [layer];
}

function faceLayer(
  name: string,
  animation: LottieAnimation,
  center: Vec2,
  path: LottiePath,
  fill: Rgba,
  transform: Pick<ShapeLayer["ks"], "s" | "r">,
): ShapeLayer {
  const layer = baseLayer(name, animation, center);
  layer.shapes = [createPath(path, name), createFill(fill), createStroke([1, 1, 1, 0.55], 2)];
  layer.ks.s = transform.s;
  layer.ks.r = transform.r;
  return layer;
}

function baseLayer(name: string, animation: LottieAnimation, position: Vec2): ShapeLayer {
  const layer = createShapeLayer({
    id: 1,
    name,
    width: animation.w,
    height: animation.h,
    duration: animation.op,
  });
  layer.ks.p = value(position);
  return layer;
}

function polygon(points: Vec2[]): LottiePath {
  return {
    c: true,
    v: points,
    i: points.map<Vec2>(() => [0, 0]),
    o: points.map<Vec2>(() => [0, 0]),
  };
}
