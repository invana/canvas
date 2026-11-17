/**
 * Geographic fixes → world fixes, for `@invana/graph`'s `TrackingBehaviour`.
 *
 * The behaviour speaks world units, milliseconds and compass degrees. A GPS or
 * AIS feed speaks longitude / latitude, knots and the same degrees. This is the
 * conversion between them, so `@invana/graph` stays domain-free.
 */

import { WORLD_SIZE, projectLngLat } from './mercator';

/** Metres in one international knot-hour: 1 knot = 1852 m / 3600 s. */
const METRES_PER_KNOT_PER_SECOND = 1852 / 3600;
/** The equator's length in metres on the spherical mercator the basemap uses. */
const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

/** A position report as a geographic feed delivers it. */
export interface LngLatFix {
  /** Id of the node this fix moves. */
  id: string;
  /** When the object was here, ms. */
  t: number;
  lng: number;
  lat: number;
  /** Compass heading in degrees, 0 = north, clockwise. */
  course?: number;
  /** Ground speed in knots. */
  speedKn?: number;
  /** Ground speed in metres per second — used when `speedKn` is absent. */
  speedMps?: number;
}

/** The same report in world units — what `TrackingBehaviour.pushFixes` takes. */
export interface WorldFix {
  id: string;
  t: number;
  x: number;
  y: number;
  course?: number;
  /** World units per second. */
  speed?: number;
}

/**
 * World units covered by one metre of ground at `lat`. Web mercator stretches both
 * axes by `1 / cos(lat)` (it is conformal), so one factor serves any direction and
 * a compass course maps to the same angle on the canvas.
 */
export function worldUnitsPerMetre(lat: number): number {
  return WORLD_SIZE / (EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180));
}

/** Convert one geographic fix to a world fix. */
export function lngLatFix(fix: LngLatFix): WorldFix {
  const { x, y } = projectLngLat([fix.lng, fix.lat]);
  const mps = fix.speedKn !== undefined ? fix.speedKn * METRES_PER_KNOT_PER_SECOND : fix.speedMps;
  return {
    id: fix.id,
    t: fix.t,
    x,
    y,
    ...(fix.course !== undefined ? { course: fix.course } : {}),
    ...(mps !== undefined ? { speed: mps * worldUnitsPerMetre(fix.lat) } : {}),
  };
}

/** Convert a batch — `tracking.pushFixes(lngLatFixes(feed))`. */
export function lngLatFixes(fixes: readonly LngLatFix[]): WorldFix[] {
  return fixes.map(lngLatFix);
}
