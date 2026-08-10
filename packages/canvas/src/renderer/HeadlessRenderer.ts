/**
 * `HeadlessRenderer` — a complete `IRenderer` that draws nothing.
 *
 * Not a product renderer: a **test double**, kept deliberately (§7) so layouts,
 * picking, bounds, spec projection and the whole layer / behaviour lifecycle can
 * be exercised with no GPU and no DOM. It is why `@invana/canvas` needs a
 * drawing library neither as a dependency nor a devDependency.
 *
 * It doubles as the reference for how small the contract really is: if a new
 * feature means adding a method here that cannot be implemented without pixels,
 * that method belongs on a concrete backend, not on `IRenderer`.
 *
 * ```ts
 * const canvas = new Canvas();
 * canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
 * ```
 */

import { EventEmitter } from '@invana/canvas-store';
import type { Camera } from '../camera/Camera';
import type { ICameraBinding } from '../camera/ICameraBinding';
import type { IElementRenderer } from './IElementRenderer';
import type { IOverlayDevice } from './IOverlayDevice';
import type {
  IRenderer,
  RendererCapabilities,
} from './IRenderer';
import type { ISurface, SurfaceBackdrop, SurfaceSpace } from './ISurface';
import type { ElementEventMap } from '@invana/canvas-store';
import type { Rect } from '@invana/canvas-store';
import { HeadlessCameraBinding } from '../camera/HeadlessCameraBinding';

/** An `IOverlayDevice` that records nothing and draws nothing. */
function noopOverlay(): IOverlayDevice {
  const self = {
    clear: () => self,
    moveTo: () => self,
    lineTo: () => self,
    quadraticCurveTo: () => self,
    closePath: () => self,
    rect: () => self,
    roundRect: () => self,
    ellipse: () => self,
    poly: () => self,
    fill: () => self,
    stroke: () => self,
    destroy: () => {},
  } as unknown as IOverlayDevice;
  return self;
}

/**
 * An `IElementRenderer` that tracks which ids exist and their specs, and
 * answers geometry from the spec alone. Enough for a layer test to assert that
 * elements were mounted, moved and removed.
 */
export class HeadlessElementRenderer implements IElementRenderer {
  readonly events = new EventEmitter<ElementEventMap>();
  readonly shapes = new Map<string, { kind: string; x: number; y: number }>();
  readonly connectors = new Set<string>();
  readonly shapeKinds = new Set<string>([
    'circle', 'ellipse', 'rect', 'tabbed-rect', 'polygon',
    'regular-polygon', 'star', 'arc', 'path', 'composite',
  ]);

  registerShape(kind: string): void {
    this.shapeKinds.add(kind);
  }

  getShapeKind(id: string): string | undefined {
    return this.shapes.get(id)?.kind;
  }
  hasShape(id: string): boolean {
    return this.shapes.has(id);
  }
  hasConnector(id: string): boolean {
    return this.connectors.has(id);
  }

  addShape(id: string, spec: { kind: string; x?: number; y?: number }): void {
    this.shapes.set(id, { kind: spec.kind, x: spec.x ?? 0, y: spec.y ?? 0 });
  }
  updateShape(id: string, patch: { x?: number; y?: number }): void {
    const cur = this.shapes.get(id);
    if (cur) this.shapes.set(id, { ...cur, ...patch });
  }
  removeShape(id: string): void {
    this.shapes.delete(id);
  }
  addConnector(id: string): void {
    this.connectors.add(id);
  }
  updateConnector(): void {}
  removeConnector(id: string): void {
    this.connectors.delete(id);
  }

  moveShape(id: string, x: number, y: number): void {
    const cur = this.shapes.get(id);
    if (cur) this.shapes.set(id, { ...cur, x, y });
  }
  getShapePosition(id: string): { x: number; y: number } | null {
    const s = this.shapes.get(id);
    return s ? { x: s.x, y: s.y } : null;
  }

  // Everything below is a no-op or a null answer: these are the calls a layer
  // makes for pixels, and there are none here.
  scaleShape(): void {}
  setConnectorStroke(): void {}
  scaleConnectorStroke(): void {}
  setRaised(): void {}
  setShapeTextVisible(): void {}
  setShapeIconVisible(): void {}
  setShapeImageVisible(): void {}
  setLabelsResolution(): void {}
  setVisibleSet(): void {}
  cull(): void {}
  uncull(): void {}
  setDecoration(): void {}
  setEffect(): void {}
  getDecoration(): undefined {
    return undefined;
  }
  setDecorationVisible(): void {}
  getDecorationWorldBounds(): null {
    return null;
  }
  setBadge(): void {}
  removeBadge(): void {}
  getShapeWorldBounds(): null {
    return null;
  }
  getShapeCenter(): null {
    return null;
  }
  getConnectorPolyline(): null {
    return null;
  }
  connectorGeometryUnchanged(): boolean {
    return false;
  }
  boundsOfSpec(): undefined {
    return undefined;
  }
  scaleShapeSpec(): undefined {
    return undefined;
  }
  collapsedShapeSpec(): undefined {
    return undefined;
  }
  fitShapeSpecToContent(): undefined {
    return undefined;
  }
  measureLabel(): null {
    return null;
  }
  hitTest(): null {
    return null;
  }
  setHitTestEnabled(): void {}
  reindexScaledShapeHits(): void {}
  reanchorAllConnectors(): void {}
  reRouteAllConnectors(): void {}
  tickAnimations(): void {}
  toSVG(): string {
    return '';
  }
  destroy(): void {
    this.shapes.clear();
    this.connectors.clear();
  }
}

export class HeadlessSurface implements ISurface {
  readonly primitives = new HeadlessElementRenderer();
  /** Last backdrop pushed — lets a background test assert without pixels. */
  backdrop: SurfaceBackdrop | null = null;
  visible = true;
  zIndex = 0;
  destroyed = false;

  constructor(
    readonly id: string,
    readonly space: SurfaceSpace,
  ) {}

  overlay(): IOverlayDevice {
    return noopOverlay();
  }
  setBackdrop(backdrop: SurfaceBackdrop | null): void {
    this.backdrop = backdrop;
  }
  setVisible(visible: boolean): void {
    this.visible = visible;
  }
  setZIndex(z: number): void {
    this.zIndex = z;
  }
  destroy(): void {
    this.destroyed = true;
    this.primitives.destroy();
  }
}

export class HeadlessRenderer implements IRenderer {
  readonly backend = 'canvas' as const;
  readonly canvasElement: HTMLCanvasElement | null = null;
  /** Every surface handed out, by layer id — for asserting layer lifecycle. */
  readonly surfaces = new Map<string, HeadlessSurface>();
  readonly binding = new HeadlessCameraBinding();
  camera?: Camera;
  destroyed = false;
  /** Every `tick(dt)` the engine drove, in order. */
  readonly frames: number[] = [];

  get capabilities(): RendererCapabilities {
    return {
      effects: 'none',
      textMode: 'native',
      rasterExport: false,
      depth: false,
      specKinds: [],
    };
  }

  mount(): void {}

  createSurface(space: SurfaceSpace, id: string): ISurface {
    const s = new HeadlessSurface(id, space);
    this.surfaces.set(id, s);
    return s;
  }

  createOverlay(): IOverlayDevice {
    return noopOverlay();
  }

  createCameraBinding(): ICameraBinding {
    return this.binding;
  }

  attachCamera(camera: Camera): void {
    this.camera = camera;
  }

  worldContentBounds(): Rect | null {
    return null;
  }

  resize(): void {}

  /** Records the frames the engine drove, so a test can assert the clock ran. */
  tick(dtMs: number): void {
    this.frames.push(dtMs);
  }

  destroy(): void {
    this.destroyed = true;
  }
}
