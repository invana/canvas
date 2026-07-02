# `@invana/canvas` — Engine Type Reference

> **Status: REFERENCE (as-built).** A catalog of the public type surface of the
> `@invana/canvas` engine — the **renderer layer** the graph-domain types
> (`NodeStyle`/`EdgeStyle`/templates, documented in
> [`canvas-store-state-inventory.md`](./canvas-store-state-inventory.md)) compile
> **down to**. Grouped by subsystem; each block is condensed-but-faithful from the
> authoritative TSDoc'd source (drop long comments, keep field names + types +
> defaults). Compiled from a full read of `packages/canvas/src`.
>
> **This is a working reference, not the canonical declaration** — those live in
> the source TSDoc (and will become the VitePress API site). Use this to see the
> whole surface at once and to map graph/store types onto the engine.
>
> **Naming caveats (source ≠ docs):** the renderer class is **`PrimitivesRenderer`**
> (no `ShapesRenderer` symbol exists). The shape spec base is **`BaseShapeSpec`**
> (no `ShapeSpec`); stroke is **`ShapeStroke`** (no `StrokeStyle`); there is no
> `FillStyle`/`ShadowStyle`/`LabelSpec`. The authoritative decoration/effect kind
> list is the registration block in `primitives/PrimitivesRenderer.ts` — the graph
> `CLAUDE.md` list is stale.

## Contents

**Primitives** — 1. Geometry · 2. Shapes (specs · fills · stroke · paint · composite) · 3. Labels · 4. Connectors (anchors · routers · pathStyles · markers) · 5. Decorations · 6. Effects
**Engine** — 7. Canvas + config · 8. Camera · 9. Context · 10. Events · 11. Renderer · 12. Theme
**Abstractions** — 13. Layers · 14. Behaviours · 15. Layouts · 16. State machinery · 17. Registries

All paths are under `packages/canvas/src`.

---

# Primitives

## 1. Geometry — `primitives/types.ts`

```ts
interface Point { readonly x: number; readonly y: number }
interface Vec2  { readonly x: number; readonly y: number }
interface Rect  { readonly x: number; readonly y: number; readonly width: number; readonly height: number }

/** Endpoint a router consumes — point + optional outgoing tangent. */
interface Endpoint { readonly x: number; readonly y: number; readonly tangent?: Vec2 }

type Polyline = ReadonlyArray<Point>;                  // router output / pathStyle input

/** One path step — mirrors SVG M/L/Q/C. pathStyle output → connector input. */
type PathCommand =
  | { kind: 'M'; x: number; y: number }
  | { kind: 'L'; x: number; y: number }
  | { kind: 'Q'; cx: number; cy: number; x: number; y: number }
  | { kind: 'C'; c1x: number; c1y: number; c2x: number; c2y: number; x: number; y: number };
type Path = ReadonlyArray<PathCommand>;
```

## 2. Shapes — `primitives/types.ts` (+ `shapes/CompositeShape.ts`)

### Spec base + per-shape geometry

```ts
interface BaseShapeSpec {
  readonly kind: string;
  readonly x: number; readonly y: number;
  readonly fill?: ShapeFill;
  readonly stroke?: ShapeStroke;
  readonly zIndex?: number;        // default 0; higher = on top
  readonly alpha?: number;
  readonly visible?: boolean;
  readonly rotation?: number;      // container rotation (radians)
}

interface CircleSpec         extends BaseShapeSpec { kind: 'circle'; radius: number }
interface EllipseSpec        extends BaseShapeSpec { kind: 'ellipse'; radiusX: number; radiusY: number }
interface RectSpec           extends BaseShapeSpec { kind: 'rect'; width: number; height: number; cornerRadius? }
interface PolygonSpec        extends BaseShapeSpec { kind: 'polygon'; vertices: ReadonlyArray<Point> }  // centre-relative, implicitly closed
interface RegularPolygonSpec extends BaseShapeSpec { kind: 'regular-polygon'; sides: number; radius: number; rotation? }
interface ArcSpec            extends BaseShapeSpec { kind: 'arc'; innerR: number; outerR: number; startAngle: number; endAngle: number }  // 0=+x, clockwise; innerR 0 → pie
interface StarSpec           extends BaseShapeSpec { kind: 'star'; points: number; innerRadius: number; outerRadius: number; rotation? }

/** Marker = a shape spec WITHOUT x/y (the connector positions/orients it). */
type MarkerShapeSpec = Omit<BaseShapeSpec, 'x' | 'y'> & { readonly kind: string };
```

> Registered built-in shape kinds: `rect` · `circle` · `ellipse` · `arc` · `regular-polygon` · `star` · `polygon` · `composite` (+ `arrow` as a marker). Custom kinds register at runtime via `registerShape`.

### Fill — `ShapeFill` / `ShapeFillLayer`

```ts
type InsetAnchor = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';   // default 'center'

type ShapeFillLayer =
  | { kind: 'solid'; color: number; alpha? }
  | { kind: 'image'; url: string; alpha?; fit?: 'cover' | 'contain'; padding? }            // fit default 'cover', padding default 0
  | { kind: 'glyph'; char: string; fontFamily?; fontWeight?: number|string; fontStyle?: 'normal'|'italic'; color?; alpha?; sizeRatio?; anchor?: InsetAnchor }  // color default 0xffffff, sizeRatio 0.6
  | { kind: 'svg'; pathD: string; viewBox?: {width;height}; strokeWidth?; color?; alpha?; sizeRatio?; anchor?: InsetAnchor }      // viewBox 24×24, strokeWidth 2
  | { kind: 'svg-url'; url: string; viewBox?: {width;height}; strokeWidth?; color?; alpha?; sizeRatio?; anchor?: InsetAnchor };

/** number shorthand = solid colour; array = layers painted bottom-up. */
type ShapeFill = number | ShapeFillLayer | ReadonlyArray<ShapeFillLayer>;
```

### Stroke + paint-style overrides

```ts
interface ShapeStroke {                                  // the spec border (== "StrokeStyle")
  readonly color: number; readonly alpha?; readonly width?;
  readonly alignment?: 'inside' | 'center' | 'outside';  // default 'center'
  readonly dashArray?: readonly [number, number]; readonly dashOffset?;
  readonly cap?: 'butt' | 'round' | 'square'; readonly join?: 'miter' | 'round' | 'bevel';
}

/** Decoration override on IShape.paintInto — replaces spec.fill/stroke. (the closest thing to "ShapeStyle") */
interface ShapePaintStyle {
  readonly color?; readonly alpha?; readonly strokeWidth?;
  readonly alignment?: 'inside' | 'center' | 'outside';  // default 'outside'
  readonly fill?: boolean;                               // default false
  readonly dashArray?: readonly [number, number]; readonly dashOffset?;
  readonly inset?: number;                               // + inside / - outside silhouette; default 0
}
/** Connector mirror — no inset (connectors are 1D). */
interface ConnectorPaintStyle {
  readonly color?; readonly alpha?; readonly strokeWidth?;
  readonly dashArray?: readonly [number, number]; readonly dashOffset?;
  readonly cap?; readonly join?;
  readonly tintMarkers?: boolean; readonly skipMarkers?: boolean; readonly markerHalo?: boolean;
}
```

### Composite — `shapes/CompositeShape.ts`

```ts
// PartStroke / PartFill are file-local (not exported) building blocks:
interface PartStroke { color: number; width?; alpha? }
interface PartFill   { fill?: number; fillAlpha?; stroke?: PartStroke }

type CompositePart =
  | ({ part: 'rect';   x; y; width; height; cornerRadius? } & PartFill)
  | ({ part: 'circle'; x; y; radius } & PartFill)
  | { part: 'line';    x; y; x2; y2; stroke: PartStroke }
  | { part: 'label';   x; y; text: string; anchor?: 'left'|'center'|'right'; fontSize?; fontWeight?: number|string;
                       fontStyle?: 'normal'|'italic'; fontVariant?: 'normal'|'small-caps'; fill?; lineHeight?;
                       align?: 'left'|'center'|'right'; maxWidth?; maxLines?; overflow?: 'clip'|'ellipsis' };

/** Borrowed background silhouette of a composite card. */
type CompositeRootSpec = RectSpec | CircleSpec | EllipseSpec | PolygonSpec | RegularPolygonSpec | StarSpec | ArcSpec;

interface CompositeSpec extends BaseShapeSpec {
  readonly kind: 'composite';
  readonly width: number; readonly height: number;
  readonly cornerRadius?: number;        // rounded-rect root only; ignored when root set
  readonly root?: CompositeRootSpec;     // omit → rounded rect from cornerRadius + inherited fill/stroke
  readonly parts: readonly CompositePart[];
}
```

## 3. Labels — `primitives/types.ts`

```ts
interface HtmlTagStyle { fontFamily?; fontSize?: number|string; fontWeight?: number|string; fontStyle?: 'normal'|'italic'|'oblique'; fill?: number|string; letterSpacing?; textDecoration?: string }

type LabelContent =
  | { kind: 'text'; text: string; fontFamily?; fontSize?; fontWeight?: number|string; fontStyle?: 'normal'|'italic';
      fontVariant?: 'normal'|'small-caps'; letterSpacing?; lineHeight?; fill?;                 // fontFamily 'sans-serif', fontSize 12, fill 0x111827
      stroke?: { color; width }; shadow?: { color; blur?; offsetX?; offsetY?; alpha? }; alpha?; align?: 'left'|'center'|'right' }
  | { kind: 'html-text'; html: string; defaultFontFamily?; defaultFontSize?; defaultFill?: number|string;
      defaultFontWeight?: number|string; width?; tagStyles?: Record<string, HtmlTagStyle>; cssOverrides?: string[]; alpha? };

interface LabelBackground {
  fill?; fillAlpha?; stroke?; strokeAlpha?; strokeWidth?;                                      // fillAlpha 1, strokeWidth 1
  radius?: number | readonly [number, number, number, number];                                // [tl,tr,br,bl]
  padding?: number | readonly [number, number] | readonly [number, number, number, number];
  shadow?: { color; blur?; offsetX?; offsetY?; alpha? };
}
interface LabelWrap       { maxWidth?; maxHeight?; maxLines?; wordWrap?: boolean; overflow?: 'clip'|'ellipsis' }  // overflow 'ellipsis'
interface LabelVisibility { minZoom?; maxZoom? }

interface LabelStyleCommon {                                  // shared by shape + connector labels
  readonly content: LabelContent;
  readonly background?: LabelBackground;
  readonly wrap?: LabelWrap;
  readonly offset?: { x?; y? };
  readonly alpha?; readonly visibility?: LabelVisibility; readonly cursor?: string;
  readonly interactive?: boolean;     // default false
  readonly priority?: number;         // read by LabelCollisionBehaviour
  readonly collisionGroup?: string; readonly forceShow?: boolean;
  readonly minFontSize?: number;      // default 9
}

type ShapeLabelPlacement =
  | 'center' | 'top'|'top-right'|'right'|'bottom-right'|'bottom'|'bottom-left'|'left'|'top-left'
  | 'inside-top'|'inside-top-right'|'inside-right'|'inside-bottom-right'
  | 'inside-bottom'|'inside-bottom-left'|'inside-left'|'inside-top-left'|'inside-center';
interface ShapeLabelStyle extends LabelStyleCommon { placement?: ShapeLabelPlacement; rotation?: number }  // placement 'bottom'

type ConnectorLabelPlacement = 'start' | 'center' | 'end' | number;          // numeric t clamped [0,1]
interface ConnectorLabelStyle extends LabelStyleCommon {
  placement?: ConnectorLabelPlacement;  // default 'center'
  pathOffset?: number;                  // shift along tangent, + = toward target
  autoRotate?: boolean;                 // default true
  keepUpright?: boolean;                // default true
}
```

## 4. Connectors — `primitives/types.ts` + `primitives/connectors/*`

### Spec + endpoint + pipeline contracts

```ts
type AnchorSpec = string | { name: string; opts?: Record<string, unknown> };

type ConnectorEndpointSpec =
  | { kind: 'point'; x: number; y: number; tangent?: Vec2 }
  | { kind: 'shape'; shapeId: string; anchor?: AnchorSpec; padding?: number };   // padding = outward offset, default 0

interface BaseConnectorSpec {
  readonly kind: string;
  readonly source: ConnectorEndpointSpec;
  readonly target: ConnectorEndpointSpec;
  readonly waypoints?: ReadonlyArray<Point>;
  readonly router?: string;            // default 'straight'
  readonly routerOpts?: Record<string, unknown>;
  readonly pathStyle?: string;         // default 'normal'
  readonly pathStyleOpts?: Record<string, unknown>;
  readonly sourceMarker?: MarkerShapeSpec;
  readonly targetMarker?: MarkerShapeSpec;
  readonly stroke?: ShapeStroke;
  readonly zIndex?; readonly alpha?; readonly visible?: boolean;
}

// Three pure-function stages: anchor → router → pathStyle
type IAnchor    = (endpoint: { shapeId: string; opts? }, fromPoint: Point, ctx: AnchorCtx) => Endpoint;
type IRouter    = (source: Endpoint, target: Endpoint, waypoints?: ReadonlyArray<Point>, opts?, ctx?: RouterCtx) => Polyline;
type IPathStyle = (polyline: Polyline, opts?, endpoints?: { source: Endpoint; target: Endpoint }) => Path;

interface RouterCtx { readonly obstacles: ReadonlyArray<Obstacle> }
interface Obstacle extends Rect { containsInflated?(wx: number, wy: number, inflate: number): boolean }
interface AnchorCtx { getShape(id: string): AnchorShapeRef | undefined }
interface AnchorShapeRef { origin: Point; bounds: Rect; center: Point; boundaryIntersect?(localFromCenter: Point): Point | null }

interface IConnector<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  readonly gfx: Container;
  draw(spec: TSpec, path: Path): void;
  paintInto(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void;
  getVisiblePath(spec: TSpec, path: Path): Path;       // trimmed by marker insets
  setBodyVisible(v: boolean): void; setSourceMarkerVisible(v: boolean): void; setTargetMarkerVisible(v: boolean): void;
  destroy(): void;
}

// A marker is any ShapeCtor with a static paintInto (markers reuse the shape registry):
interface ShapeCtor<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  new (spec: TSpec, host: ShapeHostInfo): IShape<TSpec>;
  readonly paintInto?: (g, spec: Omit<TSpec,'x'|'y'>, anchor: Point, angleRad: number, style?: ShapePaintStyle, strokeWidth?) => void;
  readonly markerInset?: (spec: Omit<TSpec,'x'|'y'>, strokeWidth?) => number;
  readonly boundsOf?: (spec: Omit<TSpec,'x'|'y'>) => Rect;
  readonly scaleSpec?: (spec: Omit<TSpec,'x'|'y'>, factor: number) => Partial<TSpec>;
}
```

### Registered anchors / routers / pathStyles / markers (+ option types)

> **Anchors:** `center` · `boundary` · `perpendicular` · `edge-port` · `silhouette-port`
> **Routers:** `straight` · `orth` (`orthogonal` alias) · `manhattan` · `metro` · `er` · `oneSide`
> **PathStyles:** `normal` · `rounded` · `bezier` · `quadratic` · `bump-radial` · `bump-horizontal` · `bundle` · `step-radial` · `smooth` · `loop-curve` · `loop-polyline`
> **Markers:** `arrow` (the only built-in; markers go through the shape registry)

Option shapes are passed untyped (`Record<string, unknown>`) and cast per-impl (none exported). The shapes:

```ts
// anchors
interface EdgePortOpts       { side?: 'left'|'right'|'top'|'bottom'|'auto'; offset? }   // both default 'auto' / 0
interface SilhouettePortOpts { side?: 'left'|'right'|'top'|'bottom'|'auto'; offset? }
// center / boundary / perpendicular take no opts

// routers
interface ManhattanOpts { gridStep?; margin?; inflate?; maxCells?; stubLength? }  // 16/64/4/40000/24
interface MetroOpts     { gridStep?; margin?; inflate?; maxCells? }               // 16/64/4/40000
interface ErOpts        { stubLength? }                                           // 16
interface OneSideOpts   { side?: 'top'|'right'|'bottom'|'left'; padLength? }       // 'right'/30
// straight / orth take no opts

// pathStyles
interface RoundedOpts    { radius? }                                  // 8
interface BezierOpts     { axis?: 'h'|'v'|'auto'; tension? }          // 'auto'/0.5
interface QuadraticOpts  { curveOffset?; curvePosition? }             // 30/0.5
interface BumpRadialOpts { origin?: { x; y } }                        // (0,0)
interface StepRadialOpts { origin?: { x; y } }
interface BundleOpts     { beta? }                                    // 0.85
interface SmoothOpts     { tension? }                                 // 1
interface LoopCurveOpts    { side?: LoopCurveSide; angle?; radius?; bulge?; baseOffset?; width?; pivotOffset?: {dx;dy} }   // angle -π/2, radius 40, baseOffset 28, width 12
interface LoopPolylineOpts { side?: LoopPolylineSide | number; baseOffset?; baseOffsetX?; baseOffsetY?; stubLength?; gap? }  // 'top'/28/30/30
// normal / bump-horizontal take no opts

// markers
interface ArrowMarkerSpec extends BaseShapeSpec { kind: 'arrow'; lengthScale?; widthScale? }  // ×strokeWidth, defaults 4 / 3
```

## 5. Decorations — `primitives/decorations/*`

> **Registered shape decorations:** `glow` · `pulse-ring` · `liquid-fill` · `marching-ants` · `ring` · `label` · `toggle` · `resize-handle` · `selection-frame`
> **Registered connector decorations:** `marching-ants-connector` · `fly-marker-connector` · `flow-particles-connector` · `glow-connector` · `ripple-connector` · `reveal-connector` · `ring-connector` · `label-connector`
> (authoritative: the registration block in `primitives/PrimitivesRenderer.ts`)

### Base lifecycle — `primitives/types.ts`

```ts
interface IDecorationBase<THostInfo, TStyle = unknown> {
  readonly style: TStyle;
  mount(host: THostInfo): void;
  update?(host: THostInfo): void;
  tick?(deltaMs: number): boolean;
  destroy?(): void;
  getEndPadding?(): { source: number; target: number };  // connector-only
  getOuterExtent?(): number;                              // shape-only (resting extent)
}
type IShapeDecoration<TStyle>     = IDecorationBase<ShapeDecorationHostInfo, TStyle>;
type IConnectorDecoration<TStyle> = IDecorationBase<ConnectorDecorationHostInfo, TStyle>;
type DecorationTarget = 'shape' | 'connector' | 'both';
interface DecorationSpec<TStyle = unknown> { kind: string; style: TStyle }
```

### Shape decoration styles

```ts
interface RingDecorationStyle         { color: number; width?; gap?; alpha?; dashArray?: [number,number] }   // 2/4/1
interface GlowDecorationStyle         { color: number; strokeWidth?; layers?; innerAlpha?; pulse?: { periodMs?; amplitude? } }  // 12/6/0.55
interface PulseRingDecorationStyle    { color: number; maxRadius?; periodMs?; rings?; strokeWidth?; innerAlpha? }  // 24/1400/2/2/0.7
interface MarchingAntsDecorationStyle { color: number; strokeWidth?; dashLength?; gapLength?; speedPxPerSec?; inset?; alpha? }  // 1.5/6/4/24/0
interface LiquidFillDecorationStyle   { fillLevel?; colorTop?; colorBottom?; alpha?; wave?: { amplitude?; wavelength?; periodMs?; resolution? }; surfaceHighlight?: { color?; alpha?; thickness? } }  // level 0.6
interface ToggleDecorationStyle       { state?: 'plus'|'minus'; placement?: TogglePlacement; radius?; bgFill?; bgAlpha?; strokeColor?; strokeWidth?; glyphColor?; glyphWidth?; offsetX?; offsetY?; position?: { x; y } }  // 'plus'/'bottom'/10
interface ResizeHandleDecorationStyle { placement?: ResizeHandlePlacement; size?; bgFill?; bgAlpha?; strokeColor?; strokeWidth?; cursor?: string; visible?: boolean; position?: { x; y } }  // 'bottom-right'/8
interface SelectionFrameDecorationStyle {
  borderColor?; borderWidth?; borderStyle?: 'solid'|'dashed'|'dotted'; dashArray?: [number,number]; borderAlpha?; padding?;   // 0x6b7fff/1.5/'dotted'/0.6/4
  handleShape?: 'circle'|'square'; handleRadius?; handleCornerRadius?; handleFill?; handleFillAlpha?; handleStrokeColor?; handleStrokeWidth?; handleStrokeAlpha?;
  handles?: ReadonlyArray<SelectionFramePlacement>; visible?: boolean;   // default all 8
}
// label → reuses ShapeLabelStyle

type TogglePlacement        = 'top'|'right'|'bottom'|'left'|'top-left'|'top-right'|'bottom-left'|'bottom-right'|'inside-top'|'inside-right'|'inside-bottom'|'inside-left';
type ResizeHandlePlacement  = 'top'|'right'|'bottom'|'left'|'top-left'|'top-right'|'bottom-left'|'bottom-right';
type SelectionFramePlacement = ResizeHandlePlacement;
```

### Connector decoration styles

```ts
interface RingConnectorDecorationStyle         { color: number; width?; alpha?; dashArray?: [number,number] }   // 6/0.6
interface GlowConnectorDecorationStyle         { color: number; radius?; layers?; innerAlpha?; pulse?: { periodMs?; amplitude? } }  // 12/6/0.55
interface MarchingAntsConnectorDecorationStyle { color: number; strokeWidth?; dashLength?; gapLength?; speedPxPerSec?; alpha?; cap?; join? }  // 1.5/6/4/24
interface RippleConnectorDecorationStyle       { color: number; maxRadius?; periodMs?; rings?; innerAlpha? }  // 16/1400/2/0.7
interface FlyMarkerConnectorDecorationStyle    { color: number; markerKind?: 'circle'|'arrow'|'square'; size?; speedPxPerSec?; loop?: boolean; phase?; orientToPath?: boolean; alpha? }  // 'circle'/8/80
interface FlowParticlesConnectorDecorationStyle{ color: number; markerKind?: 'circle'|'arrow'|'square'; count?; size?; speedPxPerSec?; loop?: boolean; phase?; orientToPath?: boolean; alpha? }  // 5/6/60
interface RevealConnectorDecorationStyle       { durationMs?; repeat?: boolean|number; easing?: 'linear'|'easeOutCubic'|'easeInOutCubic'|'easeInOutSine'; direction?: 'source-to-target'|'target-to-source'; hostStroke?: 'hide'|'overlay'; holdAtFull?: boolean; delayMs? }  // 2000/false/'linear'
// label-connector → reuses ConnectorLabelStyle
```

## 6. Effects — `primitives/effects/*`

> **Shape effects:** `shake` · `breathing` · **Connector effects:** `breathing-connector` · `fade-in-connector`

```ts
type EffectTarget = 'transform' | 'style';
interface TransformDelta { dx?; dy?; dRot?; sx?; sy? }     // sx/sy identity = 1
interface StyleOverride  { tint?; alpha? }                 // tint identity 0xffffff, alpha 1
interface IEffectBase<THostInfo, TStyle = unknown> {
  readonly target: EffectTarget; readonly style: TStyle;
  mount(host: THostInfo): void; update?(host): void; tick?(deltaMs: number): boolean;
  readTransform?(): TransformDelta; readStyle?(): StyleOverride; destroy?(): void;
}
interface EffectSpec<TStyle = unknown> { kind: string; style: TStyle }

interface ShakeEffectStyle               { amplitude?; axis?: 'both'|'x'|'y'; decayMs?; seed? }       // 4/'both'  (decayMs omitted → continuous)
interface BreathingEffectStyle           { amplitude?; periodMs?; axis?: 'both'|'x'|'y'; phaseOffsetMs? }  // 0.05/1800
interface FadeInConnectorEffectStyle     { durationMs?; fromAlpha?; toAlpha?; easing?: 'linear'|'easeOutCubic'|'easeInOutCubic'|'easeInOutSine'; delayMs? }  // 600/0/1/'easeOutCubic'
interface BreathingConnectorEffectStyle  { amplitude?; periodMs?; phaseOffsetMs? }                   // 0.5/1800
```

---

# Engine

## 7. Canvas + config — `engine/Canvas.ts`, `engine/CanvasConfig.ts`

```ts
interface CanvasOptions {
  id?: string;                                  // bus source id; default 'canvas'
  container?: HTMLElement;                       // required by init()
  preference?: 'webgpu' | 'webgl' | 'canvas';   // default 'webgpu'
  width?; height?;                              // default container.client{Width,Height}
  resolution?: number;                          // default window.devicePixelRatio
  antialias?: boolean;                          // default true
  opaque?: boolean;                             // true → backgroundAlpha 1
  backgroundColor?: number;                     // default 0
  powerPreference?: 'high-performance' | 'low-power';  // default 'high-performance'
  hello?: boolean;                              // default true
  autoResize?: boolean;                         // default false (ResizeObserver)
  suppressBrowserContextMenu?: boolean;         // default true
  config?: CanvasConfig;                        // serialisable visual config applied at init
}

interface CanvasConfig {                         // pure-JSON, keyed by instance id
  layers?: Record<string, Record<string, unknown>>;
  behaviours?: Record<string, Record<string, unknown>>;
  layouts?: Record<string, Record<string, unknown>>;
  activeLayout?: string;
}
// helpers: configurable(inst) → { setOptions } | undefined ; deepMerge(base, patch)

class Canvas {                                   // engine root (condensed surface)
  readonly id; readonly options: CanvasOptions; readonly events: CanvasEventBus;
  world: Container; stage: Container; camera: Camera;
  readonly layers: LayerRegistry; readonly behaviours: BehaviourRegistry; readonly layouts: LayoutRegistry;
  context: CanvasContext;
  get isInitialised(): boolean; get application(): Application | undefined; get currentMessage(): string | null;
  init(opts: CanvasOptions): Promise<void>;
  initWithStage(stage: Container, screenWidth: number, screenHeight: number): void;   // headless
  tickOnce(deltaMs?: number): void;
  update(patch: CanvasConfig): void;             // deep-merge → setOptions per id; emits 'options:change'
  get(): CanvasConfig;
  runLayout(id: string): Promise<void>;
  redraw(): void; refresh(): Promise<void>;
  showMessage(text: string, timeout?: number): void; clearMessage(): void;
  destroy(): void;
}
```

## 8. Camera — `camera/Camera.ts`

```ts
interface CameraOptions {
  viewport: Viewport;                  // pixi-viewport; the world root Camera mutates
  screenWidth: number; screenHeight: number;
  bus?: CanvasEventBus;
  initialScale?: number;               // default 1
  initialX?; initialY?;                // default 0,0
  minScale?: number; maxScale?: number;// default 0.01 .. 100
}
class Camera {
  readonly viewport: Viewport;
  get scale(): number; get x(): number; get y(): number; get screenWidth(): number; get screenHeight(): number;
  setPosition(x, y): void; pan(dx, dy): void; setZoom(scale): void; zoomAt(factor, cx?, cy?): void;
  fitContent(worldRect: Rect, padding?: number): void;   // padding 24
  centerOn(wx, wy): void; resize(w, h): void;
  toWorld(sx, sy): Point; toScreen(wx, wy): Point;
  getVisibleBounds(): Rect; tick(dt: number): void;
}
```

## 9. Context — `context/CanvasContext.ts`

The single service surface handed to every Layer / Behaviour / Layout at mount/register.

```ts
interface CanvasContext {
  readonly layers: LayerRegistry;
  readonly behaviours: BehaviourRegistry;
  readonly camera: Camera;
  readonly events: CanvasEventBus;
  readonly theme: ThemeState;
  readonly world: Container;                    // pixi-viewport Viewport
  readonly stage: Container;                    // pixi app.stage
  readonly canvasElement?: HTMLCanvasElement;   // undefined in headless
  showMessage(text: string, timeout?: number): void;
  clearMessage(): void;
}
```

## 10. Events — `events/*`

```ts
// EventEmitter.ts
type EventMap = Record<string, unknown>;
type EventHandler<TPayload> = (payload: TPayload) => void;
class EventEmitter<E extends EventMap = EventMap> {
  on<K extends keyof E>(event: K, h: EventHandler<E[K]>): () => void;
  once<K extends keyof E>(event: K, h: EventHandler<E[K]>): () => void;
  off<K extends keyof E>(event: K, h: EventHandler<E[K]>): void;
  emit<K extends keyof E>(event: K, payload: E[K]): void;   // handler errors logged, not thrown
  removeAllListeners(event?: keyof E): void; listenerCount(event: keyof E): number;
}

// CanvasEvent.ts — the tap-channel envelope
type EventSourceKind = 'canvas' | 'layer' | 'behaviour' | 'layout' | 'store';
interface EventSource { readonly kind: EventSourceKind; readonly id: string }
interface CanvasEvent<TPayload = unknown> {
  readonly type: string;       // '<source-kind>:<source-id>:<event-name>'
  readonly timestamp: number;  // performance.now()
  readonly source: EventSource;
  readonly payload: TPayload;
}
// DEFAULT_TAP_EXCLUDE = ['pointermove','render:tick','shape:pointermove','connector:pointermove','state:dirty-flush']

// SourceEmitter.ts — per-source (Layer/Behaviour/Layout) emitter; emit() → local handlers + bus.publish(envelope)
class SourceEmitter<E extends EventMap = EventMap> extends EventEmitter<E> {
  constructor(source: EventSource, bus?: CanvasEventBus);
  setBus(bus?: CanvasEventBus): void; get sourceInfo(): EventSource;
}

// CanvasEventBus.ts
type TapHandler = (event: CanvasEvent) => void;
interface TapOptions { exclude?: readonly string[]; sampleRate?: number }   // exclude default DEFAULT_TAP_EXCLUDE; sampleRate 1
interface CanvasEventBusOptions { source?: EventSource }                    // default { kind:'canvas', id:'canvas' }
class CanvasEventBus extends EventEmitter<CanvasGlobalEvents> {
  emit<K>(event: K, payload): void;                 // also publishes envelope to taps
  tap(handler: TapHandler, opts?: TapOptions): () => void;
  publish(event: CanvasEvent): void; tapCount(): number; clearTaps(): void;
}
```

**The canvas-wide event map** — `CanvasGlobalEvents` (every typed bus event):

```ts
interface CanvasGlobalEvents extends EventMap {
  'renderer:initialised':  { backend: 'webgpu'|'webgl'|'canvas'; capabilities?: Record<string, unknown> };
  'layer:added':           { id: string };
  'layer:removed':         { id: string };
  'layout:added':          { id: string };
  'layout:removed':        { id: string };
  'layout:run:start':      { id: string; nodeCount: number; edgeCount: number; animate: boolean };
  'layout:run:end':        { id: string; reason: 'settled'|'stopped'|'cancelled' };
  'behaviour:registered':  { id: string };
  'behaviour:enabled':     { id: string };
  'behaviour:disabled':    { id: string };
  'camera:zoom':           { scale: number; centerX: number; centerY: number };
  'camera:pan':            { x: number; y: number };
  'background:click':      { worldX: number; worldY: number };
  'tap:dropped':           { type: string; reason: 'excluded'|'sampled' };
  'options:change':        { changedLayerIds: readonly string[]; changedBehaviourIds: readonly string[] };
  'theme:change':          ResolvedTheme;
  'message':               { text: string | null; timeout?: number };
}
```

**Renderer-scoped interaction events** — `PrimitivesRendererEventMap` (on `renderer.events`):

```ts
interface PrimitivesRendererEventMap extends EventMap {
  'shape:pointerover'|'shape:pointerout':           { id; worldX; worldY };
  'shape:pointerdown'|'shape:pointerup':            { id; worldX; worldY; button: number; pointerId: number };
  'shape:click'|'shape:doubleclick':                { id; worldX; worldY; button: number };
  'shape:contextmenu':                              { id; worldX; worldY };
  'connector:pointerover'|'connector:pointerout':   { id; worldX; worldY };
  'connector:pointerdown'|'connector:pointerup':    { id; worldX; worldY; button: number; pointerId: number };
  'connector:click'|'connector:doubleclick':        { id; worldX; worldY; button: number };
  'connector:contextmenu':                          { id; worldX; worldY };
  'background:contextmenu':                          { worldX; worldY };
}
```

## 11. Renderer — `primitives/PrimitivesRenderer.ts`, `instancing/*`

> The class is `PrimitivesRenderer` (the docs' "ShapesRenderer" is stale). `ShapeInstance`/`ConnectorInstance` are **internal** — not re-exported from the package index.

```ts
interface PrimitivesRendererOptions {
  readonly container: Container;
  readonly camera: Camera;
  readonly textureRegistry?: TextureRegistry;     // shared image-fill cache
  readonly canvasElement?: HTMLCanvasElement;     // indexed-hit cursor styling
  readonly hitFloorPx?: number;                   // min hover/click target px; default 6
}
class PrimitivesRenderer {
  readonly events: EventEmitter<PrimitivesRendererEventMap>;
  readonly camera: Camera;
  // addShape/updateShape/removeShape · addConnector/updateConnector/removeConnector
  // setDecoration/disposeDecoration · register* extensibility · hitTest · tickAnimations
  // setLabelsResolution · moveShape/scaleShape · raiseShape/raiseConnector · stats(): RenderStats · destroy
}
interface RenderStats { readonly shapes: number; readonly connectors: number; readonly animatedDecorations: number }

// instancing/ShapeInstance.ts — live per-shape handle (internal)
class ShapeInstance<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  readonly id: string; public spec: TSpec; readonly shape: IShape<TSpec>;
  readonly decorations: Map<string, IShapeDecoration>; readonly effects: Map<string, IShapeEffect>;
  gfxScale: number;   // default 1
}
// instancing/ConnectorInstance.ts — live per-connector handle (internal)
class ConnectorInstance<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  readonly id: string; public spec: TSpec; readonly connector: IConnector<TSpec>;
  readonly decorations: Map<string, IConnectorDecoration>; readonly effects: Map<string, IConnectorEffect>;
  path: Path;                // default []
  strokeWidthScale: number;  // default 1
}
```

## 12. Theme — `theme/types.ts`, `theme/CanvasThemeState.ts`

Engine theme is **graph-agnostic**: roles are plain string keys, no `ColorRole` enum (that lives in `@invana/graph`).

```ts
interface ResolvedTheme {
  readonly kind: 'light' | 'dark';
  readonly name: string;                              // opaque ('default'|'forest'|…)
  readonly palette: Readonly<Record<string, number>>; // role name → colour number
  readonly categorical?: readonly number[];
}
interface ThemeState {                                 // the theme channel on CanvasContext
  current(): ResolvedTheme | null;                    // null before first set
  set(theme: ResolvedTheme): void;                    // stores + broadcasts 'theme:change'
}
class CanvasThemeState implements ThemeState { constructor(bus: CanvasEventBus); /* … */ }
```

---

# Abstractions

## 13. Layers — `layers/*`

```ts
interface ILayer {
  readonly id: string; visible: boolean; hittable: boolean; zIndex: number; cullable: boolean;
  readonly mounted: boolean;
  mount(ctx: CanvasContext): void; unmount(): void; flush(): void; hasPending(): boolean; redraw(): void;
}
interface LayerOptions<TOptions = unknown> {
  id: string; options: TOptions;
  visible?: boolean; hittable?: boolean; zIndex?: number;
  cullable?: boolean;        // default true; false for full-canvas effect layers
  devtoolsName?: string;     // default '<ClassName>:<id>'
}
abstract class Layer<TOptions, TState extends object, TEvents extends EventMap, TDirtyBucket extends string> implements ILayer {
  readonly id; readonly options: TOptions;
  readonly state: Store<TState>; readonly events: SourceEmitter<TEvents>; readonly dirty: DirtyBatcher<TDirtyBucket>;
  hittable; zIndex; cullable; get/set visible; get mounted;
  protected abstract createState(): TState;
  protected applyDirty(snap: DirtySnapshot<TDirtyBucket>): void;
  protected onMount(ctx)/onUnmount(ctx)/onVisibleChange(v): void;
}
// WorldLayer (world coords, camera-affected, owns a Container, abstract hitTest(worldX,worldY)) +
// ScreenLayer (screen coords, NOT camera-affected, attaches to ctx.stage, abstract hitTest(screenX,screenY))
//   both add: createGraphics/createContainer, setZIndex, (World: getBounds)
interface WorldLayerHit  { id: string; subId?: string; kind?: string }
interface ScreenLayerHit { id: string; subId?: string; kind?: string }
```

### Built-in layers (all `ScreenLayer`, DOM-overlay)

```ts
// BackgroundLayer
type BackgroundType = 'solid'|'pattern'; type BackgroundPatternType = 'dots'|'grid'|'lines';
type BackgroundMode = 'auto'|'light'|'dark'; type BackgroundColor = number|string|{ light: number|string; dark: number|string };
interface BackgroundLayerOptions {
  type?; patternType?; color?: BackgroundColor; backgroundColor?: BackgroundColor;   // 'solid'/'dots'/'#6f7b8b'/'#f8fafc'
  size?; spacing?; alpha?; followCamera?: boolean; mode?: BackgroundMode;            // 1/12/0.6/true/'auto'
  surfaceRole?: string; patternRole?: string;                                        // 'surface'/'divider'
}

// DevInfoLayer
type DevInfoCorner = 'top-left'|'top-right'|'bottom-left'|'bottom-right';
interface DevInfoLayerOptions { corner?; margin?: number|{x?;y?}; enabled?: boolean; fontSize?; opacity?; backgroundColor?; textColor?; accentColor? }  // 'bottom-left'/10/true/11/0.92
interface DevInfoLayerCtorOptions extends DevInfoLayerOptions { id?; zIndex? }       // 'dev-info'/9999

// LayersPanelLayer
type LayersPanelCorner = DevInfoCorner;
interface LayersPanelLayerOptions { corner?; enabled?: boolean; fontSize?; opacity?; backgroundColor?; textColor?; accentColor?; hideIds?: readonly string[] }  // 'top-right'
interface LayersPanelLayerCtorOptions extends LayersPanelLayerOptions { id?; zIndex? }  // 'layers-panel'/9998
```

## 14. Behaviours — `behaviours/*`

```ts
interface IBehaviour {
  readonly id: string; readonly enabled: boolean; readonly isRegistered: boolean;
  readonly scope: 'layer'|'canvas'; readonly targetLayerId?: string; readonly shortcuts?: readonly string[];
  register(ctx: CanvasContext): void; destroy(): void; enable(): void; disable(): void;
}
interface BehaviourOptions {
  id: string; targetLayerId?: string;     // present ⇒ scope 'layer', else 'canvas'
  enabled?: boolean;                       // default false — explicit enable (rule 7)
  shortcuts?: readonly string[];
}
abstract class Behaviour implements IBehaviour {
  protected abstract onRegister(ctx): void;
  protected onDestroy(ctx)/onEnable()/onDisable(): void;
}
```

### Built-in behaviours (in `@invana/canvas`)

```ts
type DragModifier = 'none'|'space'|'shift'|'alt';
interface DragPanBehaviourOptions extends BehaviourOptions { modifier?: DragModifier; mouseButtons?: 'all'|'left'|'right'|'middle'; decelerate?: boolean; dragCursor? }  // 'none'/'left'/true/'grabbing'
interface DragShapeBehaviourOptions extends BehaviourOptions { renderer: PrimitivesRenderer; filter?: (id: string) => boolean; reRouteConnectors?: boolean; dragCursor? }  // reRoute true
interface ElementSizeLODBehaviourOptions extends BehaviourOptions { scaleEpsilon?; settleMs? }   // 0.005 / 0 (abstract base)
interface KeyboardCameraKeymap { panUp; panDown; panLeft; panRight; zoomIn; zoomOut; resetZoom: string[] }
interface KeyboardCameraInputBehaviourOptions extends BehaviourOptions { panStep?; zoomFactor?; keymap?: Partial<KeyboardCameraKeymap> }  // 40 / 1.1
interface PinchZoomBehaviourOptions extends BehaviourOptions { noDrag?: boolean; percent? }       // false / 0.1
interface WheelZoomBehaviourOptions extends BehaviourOptions { requireCtrl?: boolean; percent?; smooth?: false|number }  // false / 0.1 / false
```

## 15. Layouts — `layouts/Layout.ts`

```ts
type LayoutEndReason = 'completed' | 'stopped';
type LayoutEvents = {
  start: { nodeCount?: number; edgeCount?: number; animate?: boolean };
  tick: Record<string, never>;
  end: { reason: LayoutEndReason };
};
interface LayoutOptions { id?: string; targetLayerId?: string }     // id default 'layout'
abstract class Layout<TLayer extends Layer = Layer> {
  readonly id; readonly targetLayerId?; readonly events: EventEmitter<LayoutEvents>;
  setOptions(patch: unknown): void;             // default no-op
  abstract apply(layer: TLayer): Promise<void>; // re-apply cancels in-flight run
}
```

## 16. State machinery — `state/*`

```ts
// Store.ts — zustand+immer alias for small observable interaction state
type Store<T> = Omit<StoreApi<T>, 'setState'|'subscribe'> & {
  setState: { (recipe: (draft: T) => void): void; (partial, replace?: false): void; (state: T, replace: true): void };
  subscribe: StoreApi<T>['subscribe'] & {
    <U>(selector: (s: T) => U, listener: (u: U, prev: U) => void, options?: { equalityFn?; fireImmediately? }): () => void;
  };
};
function createLayerStore<T extends object>(initial: T | creator, opts?: { name?: string; enableDevtools?: boolean }): Store<T>;

// DirtyBatcher.ts — double-buffered per-bucket dirty set, drained once/frame
interface DirtySnapshot<TBucket extends string = string> { buckets: ReadonlyMap<TBucket, ReadonlySet<string>>; rebuildAll: ReadonlySet<TBucket> }
class DirtyBatcher<TBucket extends string = string> {
  mark(bucket, id): void; markAll(bucket): void; hasPending(): boolean;
  flush(): DirtySnapshot<TBucket>; reset(): void;
}

// ColumnStore.ts — typed-array column store for bulk HOT data (positions etc.)
type ColumnType = 'i8'|'u8'|'i16'|'u16'|'i32'|'u32'|'f32'|'f64';
type ColumnSchema = Record<string, ColumnType>;
type RowOf<T extends ColumnSchema> = { [K in keyof T]: number };
interface ColumnStoreOptions { initialCapacity?: number; maxCapacity?: number }   // 256 / ~16M
class ColumnStore<T extends ColumnSchema = ColumnSchema> {
  constructor(schema: T, opts?: ColumnStoreOptions);
  get size; get capacity; get version;                  // version bumps on change / touch()
  has(id); slot(id); idAt(slot); column<K>(name): TypedArray; get<K>(id, name); row(id): RowOf<T>|undefined;
  add(id, row): number; addBulk(items): void; set<K>(id, name, value): void; update(id, partial): void;
  remove(id): void; removeBulk(ids): void; touch(): void; clear(): void;
  forEach(cb): void; ids(): IterableIterator<string>;
}
```

## 17. Registries — `registries/*`

```ts
interface LayerRegistryOptions     { getContext: () => CanvasContext | undefined; bus: CanvasEventBus }
interface BehaviourRegistryOptions { getContext: () => CanvasContext | undefined; bus: CanvasEventBus }
interface LayoutRegistryOptions    { bus: CanvasEventBus }

class LayerRegistry     { add(l: ILayer); mountAll(); remove(id); get<T>(id); has(id); list(); byZOrder(); setZIndex(id, z); clear(); get size }
class BehaviourRegistry { register(b: IBehaviour); registerAll(); unregister(id); setEnabled(id, on); get<T>(id); has(id); list(); clear(); get size }
class LayoutRegistry    { add(l: Layout); remove(id); get<T>(id); has(id); list(); clear(); get size }
```

---

## Naming caveats & gotchas (carry these forward)

- **`PrimitivesRenderer`**, not `ShapesRenderer` — the docs/proposal name is stale; no `ShapesRenderer` symbol exists. Options type is `PrimitivesRendererOptions`.
- **No `ShapeSpec`/`StrokeStyle`/`FillStyle`/`ShadowStyle`/`LabelSpec`** — use `BaseShapeSpec`+per-kind specs / `ShapeStroke` / `ShapeFill`(+`ShapeFillLayer`) / (shadow is inline on `LabelContent`/`LabelBackground`) / `LabelContent`+`LabelStyleCommon`.
- **`ShapeInstance` / `ConnectorInstance` are internal** (`src/instancing/`) — not importable via the package index.
- **Engine theme has no role enum** — `ResolvedTheme.palette` is `Record<string, number>`; the `ColorRole` vocabulary is `@invana/graph`'s.
- **Markers reuse the shape registry** — a marker is any `ShapeCtor` with a static `paintInto`; `arrow` is the only built-in.
- **Decoration/effect kinds:** authoritative list is the registration block in `primitives/PrimitivesRenderer.ts` (the graph `CLAUDE.md` list omits `liquid-fill`, the connector animations, `toggle`/`resize-handle`/`selection-frame`, `label`/`label-connector`, and `breathing-connector`).
- **`EventSourceKind` already includes `'store'`** — anticipating `@invana/canvas-store` as an event source, though no store events appear in `CanvasGlobalEvents` yet.
- **Two event maps:** canvas-wide `CanvasGlobalEvents` (on `CanvasEventBus`) vs renderer-scoped `PrimitivesRendererEventMap` (on `renderer.events`); plus each Layer/Behaviour/Layout's own `SourceEmitter<E>` map.
- **Where graph types meet engine types:** `NodeStyle.shape` → `NodeShapeOptions` (graph) maps onto these `*Spec` types; `NodeStyle.bgFill` → `ShapeFill`; `labelStyle` → `ShapeLabelStyle`; composite cards → `CompositeSpec`/`CompositePart`/`CompositeRootSpec`; decoration specs → the style payloads in §5/§6. See [`canvas-store-state-inventory.md`](./canvas-store-state-inventory.md) for the graph side.
</content>
