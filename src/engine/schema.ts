export type Vec2 = [number, number];
export type Rgba = [number, number, number, number];
export type LottieScalar = number;
export type LottieVector = number[];

export interface LottieAnimation {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  nm: string;
  ddd: 0 | 1;
  assets: unknown[];
  layers: LottieLayer[];
  markers?: unknown[];
}

export type LottieLayer = ShapeLayer | TextLayer | NullLayer;

export interface BaseLayer {
  ddd: 0 | 1;
  ind: number;
  ty: number;
  nm: string;
  sr: number;
  ks: Transform;
  ao: 0 | 1;
  ip: number;
  op: number;
  st: number;
  bm: number;
  hd?: boolean;
  meta?: EditorLayerMeta;
}

export interface ShapeLayer extends BaseLayer {
  ty: 4;
  shapes: ShapeItem[];
}

export interface TextLayer extends BaseLayer {
  ty: 5;
  t: {
    d: {
      k: Array<{
        s: {
          t: string;
          s: number;
          f: string;
          fc: [number, number, number];
        };
      }>;
    };
  };
}

export interface NullLayer extends BaseLayer {
  ty: 3;
}

export interface EditorLayerMeta {
  locked?: boolean;
  solo?: boolean;
}

export interface Transform {
  a: Animatable<Vec2>;
  p: Animatable<Vec2>;
  s: Animatable<Vec2>;
  r: Animatable<LottieScalar>;
  o: Animatable<LottieScalar>;
}

export type Animatable<T> = StaticProperty<T> | KeyframedProperty<T>;

export interface StaticProperty<T> {
  a: 0;
  k: T;
}

export interface KeyframedProperty<T> {
  a: 1;
  k: Keyframe<T>[];
}

export interface Keyframe<T> {
  t: number;
  s: T;
  e?: T;
  o?: EasingHandle;
  i?: EasingHandle;
}

export interface EasingHandle {
  x: number[];
  y: number[];
}

export type ShapeItem =
  | RectShape
  | EllipseShape
  | PathShape
  | FillShape
  | StrokeShape
  | TransformShape;

export interface ShapeBase {
  ty: string;
  nm: string;
  hd?: boolean;
}

export interface RectShape extends ShapeBase {
  ty: "rc";
  p: Animatable<Vec2>;
  s: Animatable<Vec2>;
  r: Animatable<number>;
}

export interface EllipseShape extends ShapeBase {
  ty: "el";
  p: Animatable<Vec2>;
  s: Animatable<Vec2>;
}

export interface PathShape extends ShapeBase {
  ty: "sh";
  ks: Animatable<LottiePath>;
}

export interface LottiePath {
  c: boolean;
  v: Vec2[];
  i: Vec2[];
  o: Vec2[];
}

export interface FillShape extends ShapeBase {
  ty: "fl";
  c: Animatable<Rgba>;
  o: Animatable<number>;
  r: 1 | 2;
}

export interface StrokeShape extends ShapeBase {
  ty: "st";
  c: Animatable<Rgba>;
  o: Animatable<number>;
  w: Animatable<number>;
  lc: 1 | 2 | 3;
  lj: 1 | 2 | 3;
}

export interface TransformShape extends ShapeBase {
  ty: "tr";
  p: Animatable<Vec2>;
  a: Animatable<Vec2>;
  s: Animatable<Vec2>;
  r: Animatable<number>;
  o: Animatable<number>;
}

export interface ShapeStyle {
  fill: Rgba;
  stroke: Rgba;
  strokeWidth: number;
}
