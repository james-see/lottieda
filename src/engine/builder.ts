import { easingHandle, type EasingPreset } from "./easing";
import { value } from "./keyframes";
import type {
  Animatable,
  EllipseShape,
  FillShape,
  LottieAnimation,
  LottieLayer,
  LottiePath,
  PathShape,
  RectShape,
  Rgba,
  ShapeLayer,
  StrokeShape,
  Transform,
  Vec2,
} from "./schema";

export interface LayerOptions {
  id?: number;
  name: string;
  width: number;
  height: number;
  duration: number;
}

export class LottieBuilder {
  private animation: LottieAnimation;
  private nextLayerIndex = 1;

  constructor(width = 800, height = 600, framerate = 60, totalFrames = 120, name = "Untitled") {
    this.animation = {
      v: "5.12.1",
      fr: framerate,
      ip: 0,
      op: totalFrames,
      w: width,
      h: height,
      nm: name,
      ddd: 0,
      assets: [],
      layers: [],
    };
  }

  addLayer(layer: LottieLayer): this {
    this.animation.layers.unshift(layer);
    this.nextLayerIndex = Math.max(this.nextLayerIndex, layer.ind + 1);
    return this;
  }

  addShapeLayer(name = `Shape ${this.nextLayerIndex}`): ShapeLayerBuilder {
    const layer = createShapeLayer({
      id: this.nextLayerIndex,
      name,
      width: this.animation.w,
      height: this.animation.h,
      duration: this.animation.op,
    });
    this.nextLayerIndex += 1;
    this.animation.layers.unshift(layer);
    return new ShapeLayerBuilder(this, layer);
  }

  build(): LottieAnimation {
    return renumberLayers(this.animation);
  }
}

export class ShapeLayerBuilder {
  constructor(
    private parent: LottieBuilder,
    private layer: ShapeLayer,
  ) {}

  addRect(position: Vec2, size: Vec2, radius = 0, name = "Rectangle"): this {
    this.layer.shapes.push(createRect(position, size, radius, name));
    return this;
  }

  addEllipse(position: Vec2, size: Vec2, name = "Ellipse"): this {
    this.layer.shapes.push(createEllipse(position, size, name));
    return this;
  }

  addPath(path: LottiePath, name = "Path"): this {
    this.layer.shapes.push(createPath(path, name));
    return this;
  }

  addFill(color: Rgba, opacity = 100): this {
    this.layer.shapes.push(createFill(color, opacity));
    return this;
  }

  addStroke(color: Rgba, width = 2, opacity = 100): this {
    this.layer.shapes.push(createStroke(color, width, opacity));
    return this;
  }

  animatePosition(fromFrame: number, from: Vec2, toFrame: number, to: Vec2, preset: EasingPreset): this {
    const handles = easingHandle(preset);
    this.layer.ks.p = {
      a: 1,
      k: [
        { t: fromFrame, s: from, e: to, ...handles },
        { t: toFrame, s: to },
      ],
    };
    return this;
  }

  done(): LottieBuilder {
    return this.parent;
  }

  build(): LottieAnimation {
    return this.parent.build();
  }
}

export function createShapeLayer(options: LayerOptions): ShapeLayer {
  return {
    ddd: 0,
    ind: options.id ?? 1,
    ty: 4,
    nm: options.name,
    sr: 1,
    ks: createTransform([options.width / 2, options.height / 2]),
    ao: 0,
    shapes: [],
    ip: 0,
    op: options.duration,
    st: 0,
    bm: 0,
  };
}

export function createTransform(position: Vec2 = [0, 0]): Transform {
  return {
    a: value([0, 0]),
    p: value(position),
    s: value([100, 100]),
    r: value(0),
    o: value(100),
  };
}

export function createRect(position: Vec2, size: Vec2, radius = 0, name = "Rectangle"): RectShape {
  return { ty: "rc", nm: name, p: value(position), s: value(size), r: value(radius) };
}

export function createEllipse(position: Vec2, size: Vec2, name = "Ellipse"): EllipseShape {
  return { ty: "el", nm: name, p: value(position), s: value(size) };
}

export function createPath(path: LottiePath, name = "Path"): PathShape {
  return { ty: "sh", nm: name, ks: value(path) };
}

export function createFill(color: Rgba, opacity = 100, name = "Fill"): FillShape {
  return { ty: "fl", nm: name, c: value(color), o: value(opacity), r: 1 };
}

export function createStroke(color: Rgba, width = 2, opacity = 100, name = "Stroke"): StrokeShape {
  return { ty: "st", nm: name, c: value(color), o: value(opacity), w: value(width), lc: 2, lj: 2 };
}

export function setStatic<T>(property: Animatable<T>, nextValue: T): Animatable<T> {
  return property.a === 1 ? { ...property, k: property.k.map((frame, index) => (index === 0 ? { ...frame, s: nextValue } : frame)) } : value(nextValue);
}

export function renumberLayers(animation: LottieAnimation): LottieAnimation {
  return {
    ...animation,
    layers: animation.layers.map((layer, index) => ({
      ...layer,
      ind: animation.layers.length - index,
    })),
  };
}

export function createDefaultAnimation(): LottieAnimation {
  return new LottieBuilder(800, 600, 60, 120, "Untitled Lottie").build();
}
