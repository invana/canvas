/**
 * Standalone web-mercator projection — the same math `MapLayer.project` /
 * `MapLayer.unproject` use, exported as free functions so callers can pin data
 * to world coordinates **without holding a layer instance**.
 *
 * That matters for declarative hosts: a React tree builds its `data` before any
 * layer exists (the `<MapLayer>` wrapper constructs the engine layer inside its
 * own effect), so `map.project(...)` isn't reachable at data-shaping time. The
 * projection is pure and camera-independent, so it needs no instance.
 */

import type { LngLat, WorldPoint } from './types';

/**
 * Edge of the mercator world in canvas world units: mercator pixels at zoom 0,
 * i.e. a 512×512 square for the whole earth (MapLibre's tile convention).
 */
export const WORLD_SIZE = 512;

/** Latitudes beyond this can't be projected (mercator diverges at the poles). */
const MAX_LATITUDE = 85.05112878;

/**
 * Project a geographic coordinate to canvas world coordinates (mercator pixels
 * at zoom 0). Stable across map zoom — pin nodes once at setup and let the
 * camera handle the rest.
 *
 * @example
 *   const { x, y } = projectLngLat([airport.lng, airport.lat]);
 *   nodes.push({ id, position: { x, y }, data: { … } });
 */
export function projectLngLat(lngLat: LngLat): WorldPoint {
  const [lng, lat] = lngLat;
  const clampedLat = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
  const sin = Math.sin((clampedLat * Math.PI) / 180);
  const x = ((lng + 180) / 360) * WORLD_SIZE;
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * WORLD_SIZE;
  return { x, y };
}

/** Inverse of {@link projectLngLat} — world coords back to `[lng, lat]`. */
export function unprojectWorld(world: WorldPoint): [number, number] {
  const lng = (world.x / WORLD_SIZE) * 360 - 180;
  const n = Math.PI - 2 * Math.PI * (world.y / WORLD_SIZE);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
}
