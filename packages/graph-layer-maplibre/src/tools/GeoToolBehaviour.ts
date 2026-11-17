/**
 * `GeoToolBehaviour` — what the drawing and measuring tools share. A tool is a
 * behaviour you point at a `MapLayer` and a `GeoFeaturesLayer` (both by explicit
 * id); while it has a tool set and is enabled it
 *
 * - **holds the map's gestures** (`MapLayer.suspendGestures`) so the map does not
 *   pan or double-click-zoom under the pen — the wheel still zooms — and gives
 *   them back the moment the tool is cleared, disabled, or the behaviour is
 *   destroyed;
 * - feeds clicks, pointer moves, double-clicks and three keys into a
 *   {@link PointerCollector};
 * - shows the shape as it would be as a **draft** on the features layer, which is
 *   never stored and never recorded; and
 * - hands a finished shape to the subclass.
 *
 * Keys, while a tool is live: **Enter** finishes, **Backspace** drops the last
 * vertex, **Escape** abandons the shape — and, with nothing in progress, leaves the
 * tool. Keystrokes typed into an input or text area are left alone.
 *
 * Behaviours never auto-enable: register, then enable.
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import type { GeoFeature } from '../features/types';
import type { GeoFeaturesLayer } from '../features/GeoFeaturesLayer';
import { worldUnitsPerMetre } from '../tracking';
import { unprojectWorld } from '../mercator';
import type { MapLayer } from '../MapLayer';
import { PointerCollector, type CollectedShape, type ShapeKind } from './PointerCollector';

/** Options every geo tool takes. */
export interface GeoToolOptions extends BehaviourOptions {
  /** Required — id of the `MapLayer` the tool draws on. */
  mapLayerId: string;
  /** Required — id of the `GeoFeaturesLayer` that shows the draft and receives drawn features. */
  featuresLayerId: string;
}

/** A click within this many screen pixels of the last vertex is the second half of a double-click. */
const SAME_SPOT_PX = 4;

export abstract class GeoToolBehaviour<TOptions extends GeoToolOptions> extends Behaviour<TOptions> {
  protected map: MapLayer | null = null;
  protected features: GeoFeaturesLayer | null = null;
  protected collector: PointerCollector | null = null;
  private release: (() => void) | null = null;
  private readonly subs: Array<() => void> = [];
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private readonly listeners = new Set<() => void>();

  /** The tool the options ask for, or `null`/`undefined` for none. */
  protected abstract currentTool(): string | null | undefined;
  /** The shape a tool builds, or `null` for an unknown tool. */
  protected abstract shapeOf(tool: string): ShapeKind | null;
  /** A shape was finished. */
  protected abstract onShape(shape: CollectedShape): void;
  /** Text for the draft's label (a measurement readout), or `undefined` for none. */
  protected draftName?(preview: NonNullable<ReturnType<PointerCollector['preview']>>): string | undefined;

  /** Whether the tool is live: enabled, with a known tool set. */
  get live(): boolean {
    const tool = this.currentTool();
    return this._enabled && tool != null && this.shapeOf(tool) !== null;
  }

  /** Whether a shape is partly drawn. */
  get drawing(): boolean {
    return this.collector?.active === true;
  }

  /** Subscribe to changes of the tool or of the shape in progress — for a toolbar. Returns the unsubscribe. */
  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const map = ctx.layers.get<MapLayer>(this._options.mapLayerId);
    const features = ctx.layers.get<GeoFeaturesLayer>(this._options.featuresLayerId);
    if (!map) throw new Error(`${this.constructor.name} "${this.id}": map layer "${this._options.mapLayerId}" not found. Add the MapLayer first.`);
    if (!features) {
      throw new Error(`${this.constructor.name} "${this.id}": features layer "${this._options.featuresLayerId}" not found. Add the GeoFeaturesLayer first.`);
    }
    this.map = map;
    this.features = features;
    this.subs.push(
      map.events.on('map:click', ({ lngLat }) => this.click(lngLat)),
      map.events.on('map:pointer', ({ phase, lngLat }) => {
        if (phase === 'move') this.move(lngLat);
        else if (phase === 'dblclick') this.doubleClick();
      }),
    );
    this.sync();
  }

  protected override onEnable(): void {
    this.sync();
  }

  protected override onDisable(): void {
    this.sync();
  }

  protected override onOptionsChanged(): void {
    this.sync();
  }

  protected override onDestroy(): void {
    this.stop();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.listeners.clear();
    this.map = null;
    this.features = null;
  }

  // ─── Core ───────────────────────────────────────────────────────────────

  /** Bring the map hold, the key listener and the collector in line with "is a tool live?". */
  protected sync(): void {
    const tool = this.currentTool();
    const kind = this.live && tool != null ? this.shapeOf(tool) : null;
    if (!kind) {
      this.stop();
      this.notify();
      return;
    }
    if (!this.release) this.release = this.map?.suspendGestures() ?? null;
    this.installKeys();
    if (this.collector?.kind !== kind) {
      this.collector = new PointerCollector(kind);
      this.afterReset();
      this.showDraft();
    }
    this.notify();
  }

  /** Called when the collector is replaced (a different tool). */
  protected afterReset(): void {}

  /** Give everything back: map gestures, key listener, draft. Safe to call at any time, repeatedly. */
  protected stop(): void {
    this.release?.();
    this.release = null;
    this.removeKeys();
    this.collector = null;
    this.features?.setDraft(null);
  }

  private click(lngLat: [number, number]): void {
    if (!this.live || !this.collector) return;
    this.beforeInput();
    const shape = this.collector.click(lngLat, this.samespotKm(lngLat));
    this.showDraft();
    this.notify();
    if (shape) this.onShape(shape);
  }

  private move(lngLat: [number, number]): void {
    if (!this.live || !this.collector) return;
    this.collector.move(lngLat);
    if (this.collector.active) {
      this.showDraft();
      this.notify();
    }
  }

  private doubleClick(): void {
    if (!this.live || !this.collector) return;
    const shape = this.collector.finish();
    this.showDraft();
    this.notify();
    if (shape) this.onShape(shape);
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.live || !this.collector) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const shape = this.collector.finish();
      this.showDraft();
      this.notify();
      if (shape) this.onShape(shape);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.collector.undoLast();
      this.showDraft();
      this.notify();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (this.collector.active || this.hasFrozen()) {
        this.collector.cancel();
        this.clearFrozen();
        this.showDraft();
        this.notify();
      } else {
        // Nothing in progress: leave the tool, which gives the map back.
        this.setOptions({ tool: null } as unknown as Partial<TOptions>);
      }
    }
  }

  /** Hook: a subclass keeping a finished result on screen clears it on the next input. */
  protected beforeInput(): void {}
  protected hasFrozen(): boolean {
    return false;
  }
  protected clearFrozen(): void {}
  /** Hook: a finished result a subclass wants kept as the draft. */
  protected frozenDraft(): GeoFeature | null {
    return null;
  }

  /** Push the shape as it stands to the features layer as the draft. */
  protected showDraft(): void {
    const features = this.features;
    if (!features) return;
    const frozen = this.frozenDraft();
    if (frozen) {
      features.setDraft(frozen);
      return;
    }
    const preview = this.collector?.preview();
    if (!preview) {
      features.setDraft(null);
      return;
    }
    const name = this.draftName?.(preview);
    const properties = { ...(name ? { name } : {}), ...(preview.radiusKm ? { radiusKm: preview.radiusKm } : {}) };
    const coordinates = preview.points;
    const geometry: GeoFeature['geometry'] =
      preview.geometry === 'point'
        ? { type: 'Point', coordinates: coordinates[0]! }
        : preview.geometry === 'line'
          ? { type: 'LineString', coordinates }
          : { type: 'Polygon', coordinates: [[...coordinates, coordinates[0]!]] };
    features.setDraft({ type: 'Feature', id: 'draft', properties, geometry });
  }

  /** Kilometres that `SAME_SPOT_PX` screen pixels span at this latitude and zoom. */
  private samespotKm(at: [number, number]): number {
    const scale = this.ctx?.camera.scale ?? 1;
    return SAME_SPOT_PX / scale / (worldUnitsPerMetre(at[1]) * 1000);
  }

  /** Tell subscribers the tool or the shape in progress changed. */
  protected notify(): void {
    for (const cb of [...this.listeners]) cb();
  }

  private installKeys(): void {
    if (this.keyHandler || typeof window === 'undefined') return;
    this.keyHandler = (e) => this.onKey(e);
    window.addEventListener('keydown', this.keyHandler);
  }

  private removeKeys(): void {
    if (this.keyHandler && typeof window !== 'undefined') window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = null;
  }
}

/** `[lng, lat]` for a world point — re-exported for the tools that need it. */
export const worldToLngLat = (x: number, y: number): [number, number] => unprojectWorld({ x, y });
