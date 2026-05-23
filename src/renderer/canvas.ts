import { sampleProperty } from "../engine/keyframes";
import type { LottieAnimation, ShapeLayer, ShapeStyle, Vec2 } from "../engine/schema";

export interface RenderHit {
  layerId: number;
  bounds: DOMRect;
}

export function renderAnimationToCanvas(
  ctx: CanvasRenderingContext2D,
  animation: LottieAnimation,
  frame: number,
): RenderHit[] {
  ctx.clearRect(0, 0, animation.w, animation.h);
  drawGrid(ctx, animation.w, animation.h);

  const hits: RenderHit[] = [];
  for (const layer of [...animation.layers].reverse()) {
    if (layer.ty !== 4 || layer.hd) continue;
    hits.push(...drawShapeLayer(ctx, layer, frame));
  }
  return hits;
}

export function drawSelection(ctx: CanvasRenderingContext2D, bounds: DOMRect): void {
  ctx.save();
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.setLineDash([]);
  for (const [x, y] of handlePoints(bounds)) {
    ctx.fillStyle = "#09090b";
    ctx.strokeStyle = "#f97316";
    ctx.fillRect(x - 4, y - 4, 8, 8);
    ctx.strokeRect(x - 4, y - 4, 8, 8);
  }
  ctx.restore();
}

function drawShapeLayer(ctx: CanvasRenderingContext2D, layer: ShapeLayer, frame: number): RenderHit[] {
  const position = sampleProperty(layer.ks.p, frame);
  const anchor = sampleProperty(layer.ks.a, frame);
  const scale = sampleProperty(layer.ks.s, frame);
  const rotation = sampleProperty(layer.ks.r, frame);
  const opacity = sampleProperty(layer.ks.o, frame) / 100;
  const style = getLayerStyle(layer, frame);
  const hits: RenderHit[] = [];

  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.translate(position[0], position[1]);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale[0] / 100, scale[1] / 100);
  ctx.translate(-anchor[0], -anchor[1]);

  for (const shape of layer.shapes) {
    ctx.beginPath();
    if (shape.ty === "rc") {
      const p = sampleProperty(shape.p, frame);
      const s = sampleProperty(shape.s, frame);
      const r = sampleProperty(shape.r, frame);
      roundedRect(ctx, p[0] - s[0] / 2, p[1] - s[1] / 2, s[0], s[1], r);
      paint(ctx, style);
      hits.push({ layerId: layer.ind, bounds: layerBounds(position, p, s) });
    }
    if (shape.ty === "el") {
      const p = sampleProperty(shape.p, frame);
      const s = sampleProperty(shape.s, frame);
      ctx.ellipse(p[0], p[1], s[0] / 2, s[1] / 2, 0, 0, Math.PI * 2);
      paint(ctx, style);
      hits.push({ layerId: layer.ind, bounds: layerBounds(position, p, s) });
    }
    if (shape.ty === "sh") {
      const path = sampleProperty(shape.ks, frame);
      if (path.v.length > 0) {
        ctx.moveTo(path.v[0][0], path.v[0][1]);
        for (let index = 1; index < path.v.length; index += 1) {
          const prev = path.v[index - 1];
          const vertex = path.v[index];
          const out = path.o[index - 1] ?? [0, 0];
          const inn = path.i[index] ?? [0, 0];
          ctx.bezierCurveTo(prev[0] + out[0], prev[1] + out[1], vertex[0] + inn[0], vertex[1] + inn[1], vertex[0], vertex[1]);
        }
        if (path.c) ctx.closePath();
        paint(ctx, style);
        hits.push({ layerId: layer.ind, bounds: pathBounds(position, path.v) });
      }
    }
  }

  ctx.restore();
  return hits;
}

function getLayerStyle(layer: ShapeLayer, frame: number): ShapeStyle {
  const style: ShapeStyle = { fill: [0.7, 0.3, 0.2, 1], stroke: [1, 1, 1, 1], strokeWidth: 0 };
  for (const shape of layer.shapes) {
    if (shape.ty === "fl") style.fill = sampleProperty(shape.c, frame);
    if (shape.ty === "st") {
      style.stroke = sampleProperty(shape.c, frame);
      style.strokeWidth = sampleProperty(shape.w, frame);
    }
  }
  return style;
}

function paint(ctx: CanvasRenderingContext2D, style: ShapeStyle): void {
  ctx.fillStyle = rgba(style.fill);
  ctx.fill();
  if (style.strokeWidth > 0) {
    ctx.strokeStyle = rgba(style.stroke);
    ctx.lineWidth = style.strokeWidth;
    ctx.stroke();
  }
}

function rgba(color: number[]): string {
  const [r, g, b, a = 1] = color;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

function layerBounds(layerPosition: Vec2, shapePosition: Vec2, size: Vec2): DOMRect {
  return new DOMRect(layerPosition[0] + shapePosition[0] - size[0] / 2, layerPosition[1] + shapePosition[1] - size[1] / 2, size[0], size[1]);
}

function pathBounds(layerPosition: Vec2, points: Vec2[]): DOMRect {
  const xs = points.map((point) => point[0] + layerPosition[0]);
  const ys = points.map((point) => point[1] + layerPosition[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return new DOMRect(minX, minY, Math.max(...xs) - minX, Math.max(...ys) - minY);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function handlePoints(bounds: DOMRect): Vec2[] {
  return [
    [bounds.x, bounds.y],
    [bounds.x + bounds.width / 2, bounds.y],
    [bounds.x + bounds.width, bounds.y],
    [bounds.x + bounds.width, bounds.y + bounds.height / 2],
    [bounds.x + bounds.width, bounds.y + bounds.height],
    [bounds.x + bounds.width / 2, bounds.y + bounds.height],
    [bounds.x, bounds.y + bounds.height],
    [bounds.x, bounds.y + bounds.height / 2],
  ];
}
