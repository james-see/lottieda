import svgpath from "svgpath";
import { createEllipse, createFill, createPath, createRect, createShapeLayer, createStroke } from "../engine/builder";
import type { LottiePath, Rgba, ShapeLayer, Vec2 } from "../engine/schema";

export function importSvgToLayers(svgText: string, width: number, height: number, duration: number): ShapeLayer[] {
  const document = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = document.querySelector("svg");
  if (!svg) throw new Error("No <svg> root element found.");

  const elements = Array.from(svg.querySelectorAll("path, rect, circle, ellipse"));
  return elements.flatMap((element, index) => {
    const layer = createShapeLayer({ id: index + 1, name: elementName(element, index), width, height, duration });
    const fill = parseColor(element.getAttribute("fill"), [0.6, 0.6, 0.6, 1]);
    const stroke = parseColor(element.getAttribute("stroke"), [1, 1, 1, 1]);
    const strokeWidth = Number(element.getAttribute("stroke-width") ?? 0);

    if (element.tagName.toLowerCase() === "rect") {
      const x = numberAttr(element, "x");
      const y = numberAttr(element, "y");
      const w = numberAttr(element, "width");
      const h = numberAttr(element, "height");
      layer.shapes.push(createRect([x + w / 2 - width / 2, y + h / 2 - height / 2], [w, h], numberAttr(element, "rx")));
    }

    if (element.tagName.toLowerCase() === "circle") {
      const cx = numberAttr(element, "cx");
      const cy = numberAttr(element, "cy");
      const r = numberAttr(element, "r");
      layer.shapes.push(createEllipse([cx - width / 2, cy - height / 2], [r * 2, r * 2]));
    }

    if (element.tagName.toLowerCase() === "ellipse") {
      const cx = numberAttr(element, "cx");
      const cy = numberAttr(element, "cy");
      const rx = numberAttr(element, "rx");
      const ry = numberAttr(element, "ry");
      layer.shapes.push(createEllipse([cx - width / 2, cy - height / 2], [rx * 2, ry * 2]));
    }

    if (element.tagName.toLowerCase() === "path") {
      const d = element.getAttribute("d");
      if (d) layer.shapes.push(createPath(parsePath(d, width, height)));
    }

    if (fill[3] > 0) layer.shapes.push(createFill(fill));
    if (strokeWidth > 0 && stroke[3] > 0) layer.shapes.push(createStroke(stroke, strokeWidth));
    return layer.shapes.length > 0 ? [layer] : [];
  });
}

function parsePath(d: string, width: number, height: number): LottiePath {
  const normalized = svgpath(d).abs().unshort().toString();
  const tokens = normalized.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const vertices: Vec2[] = [];
  const inTangents: Vec2[] = [];
  const outTangents: Vec2[] = [];
  let cursor: Vec2 = [0, 0];
  let command = "";
  let closed = false;
  let index = 0;

  const readNumber = () => Number(tokens[index++]);
  const pushVertex = (point: Vec2, inTangent: Vec2 = [0, 0], previousOut: Vec2 = [0, 0]) => {
    if (outTangents.length < vertices.length) outTangents.push(previousOut);
    vertices.push([point[0] - width / 2, point[1] - height / 2]);
    inTangents.push(inTangent);
    cursor = point;
  };

  while (index < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[index])) command = tokens[index++];
    if (command === "M") pushVertex([readNumber(), readNumber()]);
    else if (command === "L") pushVertex([readNumber(), readNumber()]);
    else if (command === "C") {
      const c1: Vec2 = [readNumber(), readNumber()];
      const c2: Vec2 = [readNumber(), readNumber()];
      const end: Vec2 = [readNumber(), readNumber()];
      pushVertex(end, [c2[0] - end[0], c2[1] - end[1]], [c1[0] - cursor[0], c1[1] - cursor[1]]);
    } else if (command === "Z") {
      closed = true;
      break;
    } else {
      index += 1;
    }
  }

  while (outTangents.length < vertices.length) outTangents.push([0, 0]);
  return { c: closed, v: vertices, i: inTangents, o: outTangents };
}

function parseColor(value: string | null, fallback: Rgba): Rgba {
  if (!value || value === "none") return [fallback[0], fallback[1], fallback[2], value === "none" ? 0 : fallback[3]];
  if (value.startsWith("#")) {
    const hex = value.length === 4 ? value.slice(1).split("").map((item) => item + item).join("") : value.slice(1);
    return [
      Number.parseInt(hex.slice(0, 2), 16) / 255,
      Number.parseInt(hex.slice(2, 4), 16) / 255,
      Number.parseInt(hex.slice(4, 6), 16) / 255,
      1,
    ];
  }
  return fallback;
}

function numberAttr(element: Element, name: string): number {
  return Number(element.getAttribute(name) ?? 0);
}

function elementName(element: Element, index: number): string {
  return element.getAttribute("id") || `${element.tagName.toLowerCase()} ${index + 1}`;
}
