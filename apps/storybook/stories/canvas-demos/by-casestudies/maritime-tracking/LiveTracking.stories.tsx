/**
 * **Live tracking** — vessels in the Strait of Malacca, fed one position fix per
 * second and drawn on a `MapLayer` by `TrackingBehaviour` + `TrailsLayer`. The
 * baseline version of this story hand-rolled the feed; this one hands the feed to
 * the engine.
 *
 * **The feed** is simulated inside the story: 60 vessels sail two traffic lanes
 * (one per direction) at 8–16 knots, and a fix is `{ id, t, lng, lat, course,
 * speedKn }` every second, converted by `lngLatFixes` and pushed with
 * `tracking.pushFixes`. The clock runs at **×600** (one second is ten simulated
 * minutes) so the motion reads at map zoom 8, so the **reported** speed is ×600
 * too — that is what lets dead reckoning cover the same ground. About one vessel
 * in fifty loses its transmitter for 45–150 s, as AIS does. The lane is
 * illustrative — approximate waypoints, not a chart.
 *
 * | Need | Piece | Where |
 * |---|---|---|
 * | A fix per vessel per second | `TrackingBehaviour.pushFixes` | the feed loop below |
 * | Smooth motion, and a guess when a fix is late | `renderDelayMs`, `maxExtrapolateMs` | `config.behaviours.tracking` |
 * | The marker follows its heading | `icon.rotationBind: 'data.course'`, written by the behaviour | the styling template |
 * | A silent vessel dims, then says so | the `stale` / `lost` states + `states.<name>.label` | `config` |
 * | Where each vessel has been | `TrailsLayer` | `config.layers.trails` |
 * | Keep one vessel in view | `follow`, with the map as the camera (`map.cameraDriver()`) | set `behaviours.tracking.follow.targetId` (the settings editor does this); press the map to let go |
 *
 * Markers are held at one size on screen by `NodeScaleLODBehaviour`, and names
 * show from map zoom 8. Under a `MapLayer` the map takes all pointer input, so a
 * vessel cannot be clicked — that is why follow is a setting here (the `Follow`
 * story on a plain canvas follows by click). The picture is deliberately ~1.5 s behind the feed
 * (`renderDelayMs`): that is what makes 1 Hz motion smooth.
 *
 * Map tiles come from OpenFreeMap, so this story needs the network; the engine
 * itself makes no outside calls.
 */

import 'maplibre-gl/dist/maplibre-gl.css?inline';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasMessageBar, GraphCanvasApp, GraphStatusBar, iconSetFromLucide } from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import {
  GraphLayer,
  LabelCollisionBehaviour,
  NodeScaleLODBehaviour,
  TrackingBehaviour,
  TrailsLayer,
  type GraphCanvas,
  type GraphData,
  type GraphNode
} from '@invana/graph';
import { MapLayer, lngLatFixes, projectLngLat, type LngLatFix } from '@invana/graph-layer-maplibre';
import { Navigation2 } from 'lucide-react';

const meta: Meta = {
  title: 'canvas-demos/by-casestudies/maritime-tracking/LiveTracking'
};
export default meta;
type Story = StoryObj;

export const LiveTrackingStory: Story = {
  name: 'LiveTracking',
  render: function LiveTrackingRender() {
    // ─── The simulated feed ─────────────────────────────────────────────────

    const VESSELS = 60;
    const TIME_SCALE = 600;
    const FIX_EVERY_MS = 1000;
    const KM_PER_DEG = 111.32;

    const sim = useMemo(() => {
      /** Lane centre line, `[lng, lat]` — approximate waypoints of the Strait of Malacca. */
      const LANE: [number, number][] = [
        [100.0, 4.0],
        [101.0, 2.9],
        [102.2, 2.0],
        [103.3, 1.2]
      ];
      // Deterministic pseudo-random numbers, so every load draws the same fleet.
      let seed = 7;
      const rand = (): number => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      // Cumulative length of the lane, in km, and the bearing of each leg.
      const legs = LANE.slice(1).map(([lng, lat], i) => {
        const [lng0, lat0] = LANE[i]!;
        const dx = (lng - lng0) * KM_PER_DEG * Math.cos((((lat + lat0) / 2) * Math.PI) / 180);
        const dy = (lat - lat0) * KM_PER_DEG;
        return { lng0, lat0, lng, lat, km: Math.hypot(dx, dy), bearing: (Math.atan2(dx, dy) * 180) / Math.PI };
      });
      const laneKm = legs.reduce((sum, leg) => sum + leg.km, 0);

      const TYPES = ['Cargo', 'Tanker', 'Tug'] as const;
      const NAMES = ['Aurora', 'Bintang', 'Celestial', 'Delta', 'Eastern', 'Fortuna', 'Golden', 'Harmony'];
      const vessels = Array.from({ length: VESSELS }, (_, i) => {
        const type = TYPES[i % 3]!;
        return {
          id: `v${i}`,
          name: `${NAMES[i % NAMES.length]!} ${100 + i}`,
          type,
          /** Distance along the lane, km. */
          at: rand() * laneKm,
          /** +1 north-west → south-east, −1 the way back; each direction has its own side of the lane. */
          dir: i % 2 === 0 ? 1 : -1,
          speedKn: type === 'Tug' ? 8 + rand() * 3 : 11 + rand() * 5,
          /** Seconds of the real clock the transmitter stays silent. */
          silentFor: 0
        };
      });

      /** Where a distance along the lane is, as `[lng, lat]` plus the leg's compass course. */
      const place = (at: number, dir: number): { lngLat: [number, number]; course: number } => {
        let left = at;
        let leg = legs[0]!;
        for (const candidate of legs) {
          leg = candidate;
          if (left <= candidate.km) break;
          left -= candidate.km;
        }
        const f = Math.min(1, left / leg.km);
        // A lane per direction: 0.04° to the side of the centre line, on the starboard side.
        const side = dir * 0.04;
        const lng = leg.lng0 + (leg.lng - leg.lng0) * f + side * Math.cos((leg.bearing * Math.PI) / 180);
        const lat = leg.lat0 + (leg.lat - leg.lat0) * f - side * Math.sin((leg.bearing * Math.PI) / 180);
        return { lngLat: [lng, lat], course: (leg.bearing + (dir > 0 ? 0 : 180) + 360) % 360 };
      };

      return { vessels, laneKm, place, rand };
    }, []);

    // ─── Data: the first fix of every vessel ────────────────────────────────

    const data = useMemo((): GraphData => {
      const nodes = sim.vessels.map((v): GraphNode => {
        const { lngLat, course } = sim.place(v.at, v.dir);
        return {
          id: v.id,
          type: v.type,
          position: projectLngLat(lngLat),
          data: { name: v.name, course: Math.round(course), speedKn: Math.round(v.speedKn) }
        };
      });
      return { nodes, edges: [] };
    }, [sim]);

    // ─── Config: every setting, as data ────────────────────────────────────

    const config = useMemo(
      () =>
        ({
          activeLayout: 'none',
          // MapLibre owns the camera; a one-shot fit would fight its initial view.
          fitOnLoad: false,
          layers: {
            map: {
              basemap: 'themed',
              center: [101.9, 2.4],
              zoom: 7.6,
              minZoom: 5,
              maxZoom: 14
            },
            vessels: {
              iconSet: iconSetFromLucide({ ship: Navigation2 }),
              nodeStructureTemplates: {
                marker: {
                  name: 'marker',
                  kind: 'simple',
                  shape: { kind: 'circle', radius: 10 },
                  slots: { label: true, icon: true }
                }
              },
              nodeStylingTemplates: {
                cargo: {
                  name: 'cargo',
                  fill: 0x0284c7,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  icon: {
                    kind: 'named',
                    name: 'ship',
                    color: 0xffffff,
                    strokeWidth: 2,
                    sizeRatio: 0.62,
                    rotationBind: 'data.course'
                  },
                  label: {
                    fontSize: 10,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                tanker: {
                  name: 'tanker',
                  fill: 0xea580c,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  icon: {
                    kind: 'named',
                    name: 'ship',
                    color: 0xffffff,
                    strokeWidth: 2,
                    sizeRatio: 0.62,
                    rotationBind: 'data.course'
                  },
                  label: {
                    fontSize: 10,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                tug: {
                  name: 'tug',
                  fill: 0x16a34a,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  icon: {
                    kind: 'named',
                    name: 'ship',
                    color: 0xffffff,
                    strokeWidth: 2,
                    sizeRatio: 0.62,
                    rotationBind: 'data.course'
                  },
                  label: {
                    fontSize: 10,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                }
              },
              nodeTypes: {
                Cargo: {
                  structure: 'marker',
                  styling: 'cargo',
                  bindings: { label: 'data.name' },
                  states: {
                    stale: { label: '{data.name} · no fix' },
                    lost: { label: '{data.name} · signal lost' }
                  }
                },
                Tanker: {
                  structure: 'marker',
                  styling: 'tanker',
                  bindings: { label: 'data.name' },
                  states: {
                    stale: { label: '{data.name} · no fix' },
                    lost: { label: '{data.name} · signal lost' }
                  }
                },
                Tug: {
                  structure: 'marker',
                  styling: 'tug',
                  bindings: { label: 'data.name' },
                  states: {
                    stale: { label: '{data.name} · no fix' },
                    lost: { label: '{data.name} · signal lost' }
                  }
                }
              },
              node: {
                style: {
                  // Names from map zoom 8 up; below that, the markers alone.
                  labelMinZoom: 256,
                  labelBackgroundAlpha: 0.88,
                  labelBackgroundPadding: 2,
                  labelBackgroundCornerRadius: 3
                },
                // Signal state: dim after 20 s without a fix, dim further and ring red after 90 s.
                state: {
                  stale: { bgAlpha: 0.55 },
                  lost: { bgAlpha: 0.3, bgStrokeColor: 0xe05252 }
                }
              }
            },
            // Where each vessel has been: fading trails, 3 px wide at any zoom.
            trails: {
              ids: 'all',
              maxPoints: 24,
              fadeBands: 5,
              color: 0x475569,
              alpha: 0.8,
              strokeWidthPx: 2.5
            }
          },
          behaviours: {
            'marker-scale': { enabled: true },
            'label-collision': { enabled: true },
            // Fixes in, motion + heading + signal state out. Times are real milliseconds.
            tracking: {
              enabled: true,
              renderDelayMs: 1500,
              maxExtrapolateMs: 30000,
              staleAfterMs: 20000,
              lostAfterMs: 90000
            }
          }
        }) as unknown as CanvasConfig,
      []
    );

    // ─── Engine: register by id; settings come from `config` ─────────────────

    const tracking = useRef<TrackingBehaviour | null>(null);

    const onReady = useCallback(
      (canvas: GraphCanvas | null) => {
        if (!canvas) return;
        const map = new MapLayer({ id: 'map', options: {} });
        canvas.layers.add(map);
        canvas.layers.add(new GraphLayer({ id: 'vessels', zIndex: 10, options: { initData: data } }));
        // Below the markers, above the map. Wired to the behaviour by id.
        canvas.layers.add(new TrailsLayer({ id: 'trails', zIndex: 5, options: { trackingBehaviourId: 'tracking' } }));
        canvas.behaviours.register(
          new NodeScaleLODBehaviour({
            id: 'marker-scale',
            layers: [{ targetLayerId: 'vessels', sizePx: 18, strokeWidthPx: 1.5 }]
          })
        );
        canvas.behaviours.register(new LabelCollisionBehaviour({ id: 'label-collision', targetLayerId: 'vessels' }));
        // Follow moves the MAP here (the canvas camera mirrors it), so give the behaviour the map's driver.
        const behaviour = new TrackingBehaviour({ id: 'tracking', targetLayerId: 'vessels', cameraDriver: map.cameraDriver() });
        canvas.behaviours.register(behaviour);
        tracking.current = behaviour;
        // Config only reaches instances registered when it is applied — re-apply.
        canvas.update({ behaviours: config.behaviours, layers: { trails: config.layers!.trails! } });
        canvas.showMessage('60 vessels · 1 fix/s · ×600 clock · zoom in for names · trails fade with age');
      },
      [data, config]
    );

    // ─── The feed: one fix per vessel per second ────────────────────────────

    useEffect(() => {
      const timer = window.setInterval(() => {
        const behaviour = tracking.current;
        if (!behaviour) return;
        const now = Date.now();
        const dtSim = (FIX_EVERY_MS / 1000) * TIME_SCALE;
        const fixes: LngLatFix[] = [];

        for (const v of sim.vessels) {
          // The ship sails on whether or not its transmitter is up.
          v.at += ((v.speedKn * 1.852 * dtSim) / 3600) * v.dir;
          if (v.at > sim.laneKm || v.at < 0) {
            v.dir = -v.dir;
            v.at = Math.min(sim.laneKm, Math.max(0, v.at));
          }

          // Transmitter dropout: silent for 45–150 s, then back.
          if (v.silentFor > 0) v.silentFor -= FIX_EVERY_MS / 1000;
          else if (sim.rand() < 0.02) v.silentFor = 45 + sim.rand() * 105;
          if (v.silentFor > 0) continue;

          const { lngLat, course } = sim.place(v.at, v.dir);
          // The clock is ×600, so the speed a fix reports is ×600 as well.
          fixes.push({ id: v.id, t: now, lng: lngLat[0], lat: lngLat[1], course, speedKn: v.speedKn * TIME_SCALE });
        }
        behaviour.pushFixes(lngLatFixes(fixes));
      }, FIX_EVERY_MS);
      return () => window.clearInterval(timer);
    }, [sim]);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        bundle={false}
        theme
        onReady={onReady}
        header={{ title: 'Live tracking · Strait of Malacca' }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
      />
    );
  }
};
