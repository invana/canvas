/**
 * `IElementRenderer` — everything a domain layer asks of a drawing backend.
 *
 * `SpecProjectionTarget` covers the part driven by state: add / update / remove
 * an element from `specs:flush`. This interface is the rest — the per-frame
 * commands and geometry answers a layer still calls directly (decorations,
 * badges, LOD, transforms, measurement). It exists so `@invana/graph` can drive
 * a backend it does not import.
 *
 * **Every signature here is pixi-free**, which is the whole point and was not a
 * given: it works because the decoration styles, badge options and label
 * content moved into the spec vocabulary earlier (P6.0), and because
 * `IDecorationBase` is generic over its host info rather than naming a display
 * object. A signature that cannot be expressed without a backend type belongs
 * on the concrete renderer, not here.
 *
 * **This is not the end state.** The classification table in
 * `docs/renderer-split-design.md` (P4.5) records where each of these is headed:
 * the three `setShape*Visible` calls collapse into `setLODLevel` (G5), and
 * decorations and badges become spec state. Until then the interface describes
 * what is really called, rather than what we wish were called — a smaller
 * interface that lied would not let the package split at all.
 */

import type { Point, Rect } from '../specs/geometry';
import type { BaseConnectorSpec, BaseShapeSpec } from '../specs';
import type { DecorationSpec } from '../specs/decoration';
import type { LabelContent, LabelWrap } from '../specs/label';
import type { BadgeOptions } from '../specs/badge';
import type { HitResult } from '../specs/hit';
import type { ElementEventMap } from '../specs/elementEvents';
import type { EventEmitter } from '@invana/canvas-store';
import type { SpecProjectionTarget } from './SpecProjector';

/**
 * A mounted decoration, seen from the engine side. Generic in its host info, so
 * this reference carries no backend type — a layer can hold one, tick it and
 * read its padding without knowing what it draws into.
 */
export interface MountedDecoration<TStyle = unknown> {
  readonly style: TStyle;
  tick?(deltaMs: number): boolean;
  getEndPadding?(): { readonly source: number; readonly target: number };
  getOuterExtent?(): number;
}

/**
 * A custom element class, seen from the engine side.
 *
 * Registering a new shape kind is **irreducibly backend-specific**: a pixi
 * implementation extends `ShapeBase` and paints into a `Graphics`, a three.js
 * one would extend something else entirely. So the engine types the constructor
 * opaquely — it only routes the registration through to the backend, which is
 * the thing that can give it meaning.
 */
export type CustomElementCtor = abstract new (...args: never[]) => object;

export interface IElementRenderer extends SpecProjectionTarget {
  /**
   * Teach this backend a new element kind. The spec vocabulary stays open —
   * `containsSpec` / `boundsOfSpec` return `undefined` for kinds they don't
   * know, and picking falls back to asking the instance.
   */
  registerShape(kind: string, ctor: CustomElementCtor): void;
  // ─── Presence ──────────────────────────────────────────────────────────
  hasShape(id: string): boolean;
  getShapeKind(id: string): string | undefined;
  hasConnector(id: string): boolean;

  // ─── Per-frame transforms (deliberately commands, not spec writes) ─────
  // Making these spec writes would push drag and zoom noise into state — D3's
  // reasoning about transient visuals, applied to transforms.
  moveShape(id: string, x: number, y: number): void;
  scaleShape(id: string, scale: number): void;
  setConnectorStroke(id: string, stroke: { color: number; width: number }): void;
  scaleConnectorStroke(id: string, scale: number): void;
  setRaised(ids: Iterable<string>): void;

  // ─── Level of detail (G5 will collapse these into setLODLevel) ─────────
  setShapeTextVisible(id: string, visible: boolean): void;
  setShapeIconVisible(id: string, visible: boolean): void;
  setShapeImageVisible(id: string, visible: boolean): void;
  setLabelsResolution(resolution: number): void;

  // ─── Visible set (G4) ──────────────────────────────────────────────────
  setVisibleSet(ids: ReadonlySet<string> | null): void;
  cull(visibleBounds: Rect, padWorld?: number): void;
  uncull(): void;

  // ─── Decorations + badges (headed for spec state) ──────────────────────
  setDecoration<TStyle = unknown>(
    targetId: string,
    slot: string,
    decoration: DecorationSpec<TStyle> | null,
  ): void;
  getDecoration(id: string, slot: string): MountedDecoration | undefined;
  setDecorationVisible(targetId: string, slot: string, visible: boolean): void;
  getDecorationWorldBounds(targetId: string, slot: string): Rect | null;
  setBadge(hostId: string, slot: string, options: BadgeOptions): void;
  removeBadge(hostId: string, slot: string): void;

  // ─── Geometry answers ──────────────────────────────────────────────────
  getShapeWorldBounds(id: string): Rect | null;
  getShapePosition(id: string): Point | null;
  getConnectorPolyline(id: string): readonly Point[] | null;
  connectorGeometryUnchanged(id: string, next: BaseConnectorSpec): boolean;
  boundsOfSpec(spec: { readonly kind: string }): Rect | undefined;
  collapsedShapeSpec(spec: { readonly kind: string }): Record<string, unknown> | undefined;
  /** Visual centre of a shape — its bounds' midpoint, not its origin. */
  getShapeCenter(id: string): Point | null;
  scaleShapeSpec(spec: { readonly kind: string }, factor: number): Record<string, unknown> | undefined;
  fitShapeSpecToContent(
    spec: { readonly kind: string },
    content: { readonly width: number; readonly height: number },
  ): Record<string, unknown> | undefined;

  /**
   * Text metrics. Backend-provided on purpose — SDF and canvas-2d metrics
   * genuinely disagree, so this is the `measureText` seam (§5), not a geometry
   * answer the engine could compute.
   */
  measureLabel(content: LabelContent, wrap?: LabelWrap): { width: number; height: number } | null;

  // ─── Picking (the engine decides; this only forwards) ──────────────────
  hitTest(worldX: number, worldY: number, exclude?: ReadonlySet<string>): HitResult | null;
  setHitTestEnabled(enabled: boolean): void;
  reindexScaledShapeHits(ids?: Iterable<string>): void;

  // ─── Routing + animation ───────────────────────────────────────────────
  reanchorAllConnectors(): void;
  reRouteAllConnectors(): void;
  tickAnimations(deltaMs: number): void;

  /** Vector fragment for this renderer's elements. Spec-driven; every backend can answer. */
  toSVG(): string;

  /**
   * Element-scoped pointer events — `shape:click`, `connector:pointerover`,
   * `shape:partcontextmenu`, … Canvas-wide input goes on the kernel bus; this
   * channel is per-renderer because the payloads name elements it owns.
   */
  readonly events: EventEmitter<ElementEventMap>;

  /**
   * Release everything this device holds.
   *
   * Called by whoever *owns* the device. A layer that received its renderer
   * from `surface.primitives` does **not** own it — the surface does, and
   * destroys it in `ISurface.destroy()`. Calling it from both places is a
   * double-free.
   */
  destroy(): void;
}

/** A shape spec plus the shape's identity — what `addShape` needs. */
export type { BaseShapeSpec, BaseConnectorSpec };
