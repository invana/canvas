/**
 * `MeasureBehaviour` — measure on the map. Set `tool` to `'distance'` (a line:
 * total length in km and the bearing of the last leg) or `'area'` (a polygon: km²).
 * The reading follows the pointer as a label on a dashed draft, and stays on the
 * finished shape until the next click or Escape.
 *
 * Distances and areas are computed on the sphere, never from world units. Nothing
 * is stored and nothing is recorded: a measurement is a look, not an edit. The map
 * is held while a tool is set, as for drawing (see {@link GeoToolBehaviour}).
 */

import { initialBearing, polylineLengthKm, sphericalRingAreaKm2 } from '../geo/geodesy';
import type { GeoFeature, Position } from '../features/types';
import { GeoToolBehaviour, type GeoToolOptions } from './GeoToolBehaviour';
import type { CollectedShape, PointerCollector, ShapeKind } from './PointerCollector';

/** The tools this behaviour offers. */
export type MeasureTool = 'distance' | 'area';

/** Options for {@link MeasureBehaviour}. Everything but the two layer ids is a setting. */
export interface MeasureBehaviourOptions extends GeoToolOptions {
  /** What to measure now. `null` / unset: nothing, and the map is not held. */
  tool?: MeasureTool | null;
}

const SHAPES: Record<MeasureTool, ShapeKind> = { distance: 'line', area: 'polygon' };

/** `1,234 km²`, `12.4 km` — more digits when small. */
const km = (v: number): string => (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'));

/** Text for a measured polyline: total length and the bearing of its last leg. */
export function distanceReadout(points: readonly Position[]): string {
  if (points.length < 2) return '0 km';
  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const bearing = Math.round(initialBearing(prev, last)) % 360;
  return `${km(polylineLengthKm(points))} km · ${String(bearing).padStart(3, '0')}°`;
}

/** Text for a measured ring. */
export function areaReadout(ring: readonly Position[]): string {
  return `${km(sphericalRingAreaKm2(ring))} km²`;
}

export class MeasureBehaviour extends GeoToolBehaviour<MeasureBehaviourOptions> {
  override readonly kind = 'measure';
  private frozen: GeoFeature | null = null;

  constructor(opts: MeasureBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  /** The text of the measurement on screen, or `undefined` for none — for a toolbar or a test. */
  get reading(): string | undefined {
    if (this.frozen) {
      const name = this.frozen.properties?.name;
      return typeof name === 'string' ? name : undefined;
    }
    const preview = this.collector?.preview();
    return preview ? this.draftName(preview) : undefined;
  }

  protected currentTool(): string | null | undefined {
    return this._options.tool;
  }

  protected shapeOf(tool: string): ShapeKind | null {
    return SHAPES[tool as MeasureTool] ?? null;
  }

  protected override draftName(preview: NonNullable<ReturnType<PointerCollector['preview']>>): string | undefined {
    if (this._options.tool === 'area') return preview.geometry === 'polygon' ? areaReadout(preview.points) : undefined;
    return preview.points.length >= 2 ? distanceReadout(preview.points) : undefined;
  }

  protected onShape(shape: CollectedShape): void {
    const ring = shape.points;
    const area = shape.kind === 'polygon';
    this.frozen = {
      type: 'Feature',
      id: 'draft',
      properties: { name: area ? areaReadout(ring) : distanceReadout(ring) },
      geometry: area ? { type: 'Polygon', coordinates: [[...ring, ring[0]!]] } : { type: 'LineString', coordinates: ring },
    };
    this.showDraft();
    this.notify();
  }

  protected override afterReset(): void {
    this.frozen = null;
  }

  protected override beforeInput(): void {
    this.frozen = null;
  }

  protected override hasFrozen(): boolean {
    return this.frozen !== null;
  }

  protected override clearFrozen(): void {
    this.frozen = null;
  }

  protected override frozenDraft(): GeoFeature | null {
    return this.frozen;
  }

  protected override stop(): void {
    this.frozen = null;
    super.stop();
  }
}
