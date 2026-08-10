/**
 * `ICameraBinding` with no backend behind it.
 *
 * The projection math mirrors the engine's coordinate model exactly
 * (`screen = world * zoom + offset`), so camera semantics — clamping, anchored
 * zoom, fit, the bus and store sync — are exercisable with no GPU.
 * `emitTransformChange` simulates a backend-driven gesture (a wheel tick, a
 * momentum glide), the one path `Camera` cannot trigger itself.
 *
 * Shipped rather than test-only: §7 keeps a headless backend deliberately, so
 * consumers can test layouts, picking and projection without a renderer.
 */

import type { Point, Rect } from '@invana/canvas-store';
import type {
  CameraChangeKind,
  CameraInputConfig,
  CameraTransformValue,
  ICameraBinding,
} from './ICameraBinding';

export class HeadlessCameraBinding implements ICameraBinding {
  private t: CameraTransformValue = { x: 0, y: 0, zoom: 1 };
  private screenWidth: number;
  private screenHeight: number;
  private readonly changeListeners = new Set<(kind: CameraChangeKind) => void>();
  private readonly dragStartListeners = new Set<() => void>();

  /** Every `configureInput` patch received, in order — for asserting input wiring. */
  readonly inputConfigs: CameraInputConfig[] = [];
  /** Latest `setDragSuspended` value. */
  dragSuspended = false;
  /** Accumulated `tick` time, to prove the engine drives the clock. */
  tickedMs = 0;

  constructor(screenWidth = 800, screenHeight = 600) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  getTransform(): CameraTransformValue {
    return { ...this.t };
  }

  setTransform(t: CameraTransformValue): void {
    this.t = { ...t };
  }

  zoomToCentre(zoom: number): void {
    // Keep the world point at the screen centre fixed, which is what a backend's
    // own centre-anchored zoom does.
    const cx = this.screenWidth / 2;
    const cy = this.screenHeight / 2;
    const world = this.toWorld(cx, cy);
    this.t = { x: cx - world.x * zoom, y: cy - world.y * zoom, zoom };
  }

  resize(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  toWorld(screenX: number, screenY: number): Point {
    return { x: (screenX - this.t.x) / this.t.zoom, y: (screenY - this.t.y) / this.t.zoom };
  }

  toScreen(worldX: number, worldY: number): Point {
    return { x: worldX * this.t.zoom + this.t.x, y: worldY * this.t.zoom + this.t.y };
  }

  getVisibleBounds(): Rect {
    const tl = this.toWorld(0, 0);
    const br = this.toWorld(this.screenWidth, this.screenHeight);
    return { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y };
  }

  configureInput(config: CameraInputConfig): void {
    this.inputConfigs.push(config);
  }

  setDragSuspended(suspended: boolean): void {
    this.dragSuspended = suspended;
  }

  onTransformChange(fn: (kind: CameraChangeKind) => void): () => void {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }

  onDragStart(fn: () => void): () => void {
    this.dragStartListeners.add(fn);
    return () => this.dragStartListeners.delete(fn);
  }

  tick(dtMs: number): void {
    this.tickedMs += dtMs;
  }

  // ─── Test-only drivers ───────────────────────────────────────────────────

  /** Simulate a backend-driven transform change (wheel, drag, momentum). */
  emitTransformChange(t: CameraTransformValue, kind: CameraChangeKind): void {
    this.t = { ...t };
    for (const fn of this.changeListeners) fn(kind);
  }

  /** Simulate the backend reporting the start of a drag-pan. */
  emitDragStart(): void {
    for (const fn of this.dragStartListeners) fn();
  }
}
