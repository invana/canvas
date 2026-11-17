/**
 * **Live tracking** — vessels in the Strait of Malacca, fed one position fix per
 * second, drawn on a `MapLayer` with the engine pieces that exist **today**. It is
 * the **baseline** for the P5 tracking work (`docs/geo-intelligence-plan.md`), so
 * it also shows what is *not* there yet.
 *
 * **The feed** is simulated inside the story: 60 vessels sail two traffic lanes
 * (one per direction) at 8–16 knots, and a fix is `{ id, lng, lat, course }` every
 * second. The clock runs at **×600** (one second is ten simulated minutes) so the
 * motion reads at map zoom 8. About one vessel in fifty loses its transmitter for
 * 45–150 s, as AIS does. The lane is illustrative — approximate waypoints, not a
 * chart.
 *
 * **What the engine does for it**
 *
 * | Need | Piece | Where |
 * |---|---|---|
 * | A position per second, for every vessel at once | `GraphLayer.store.internal.setPositionsBulk` | one write per second, never the reactive store |
 * | The marker follows its heading | `icon.rotationBind: 'data.course'` | the styling template |
 * | A silent vessel dims, then says so | `node.state.stale` / `lost` overlays + `nodeTypes.<type>.states.<state>.label` | `config` |
 * | Markers stay one size on screen | `NodeScaleLODBehaviour` | `config.behaviours` |
 *
 * **What it cannot do yet** (each is a P5 row, not a gap in this story):
 *
 * - **Smooth motion.** A fix moves a vessel in one step; there is no interpolation
 *   or dead reckoning between fixes (V2). Expect a 1 Hz hop.
 * - **Trails** (V4), **follow camera** (V6), and **signal state derived by the
 *   engine** (V5). Here the story computes fix age and flips the `stale` / `lost`
 *   runtime states itself.
 * - **A fix-ingestion API** (V1). The story writes positions and courses straight
 *   to the store.
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
  type GraphCanvas,
  type GraphData,
  type GraphNode
} from '@invana/graph';
import { MapLayer, projectLngLat } from '@invana/graph-layer-maplibre';
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
          silentFor: 0,
          lastFixAt: 0,
          state: 'ok' as 'ok' | 'stale' | 'lost',
          course: -1
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
        v.course = Math.round(course);
        return {
          id: v.id,
          type: v.type,
          position: projectLngLat(lngLat),
          data: { name: v.name, course: v.course, speedKn: Math.round(v.speedKn) }
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
              styleUrl: 'https://tiles.openfreemap.org/styles/positron',
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
            }
          },
          behaviours: {
            'marker-scale': { enabled: true },
            'label-collision': { enabled: true }
          }
        }) as unknown as CanvasConfig,
      []
    );

    // ─── Engine: register by id; settings come from `config` ─────────────────

    const vesselsLayer = useRef<GraphLayer | null>(null);

    const onReady = useCallback(
      (canvas: GraphCanvas | null) => {
        if (!canvas) return;
        canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
        const layer = new GraphLayer({ id: 'vessels', zIndex: 10, options: { initData: data } });
        canvas.layers.add(layer);
        vesselsLayer.current = layer;
        canvas.behaviours.register(
          new NodeScaleLODBehaviour({
            id: 'marker-scale',
            layers: [{ targetLayerId: 'vessels', sizePx: 18, strokeWidthPx: 1.5 }]
          })
        );
        canvas.behaviours.register(new LabelCollisionBehaviour({ id: 'label-collision', targetLayerId: 'vessels' }));
        // Config only reaches instances registered when it is applied — re-apply.
        canvas.update({ behaviours: config.behaviours });
        canvas.showMessage('60 vessels · one fix per second · ×600 clock · positions via setPositionsBulk');
      },
      [data, config]
    );

    // ─── The feed: one tick per second, positions in one bulk write ─────────

    useEffect(() => {
      const ids = sim.vessels.map((v) => v.id);
      const xy = new Float32Array(ids.length * 2);
      const startedAt = performance.now();

      const tick = (): void => {
        const layer = vesselsLayer.current;
        if (!layer) return;
        const now = (performance.now() - startedAt) / 1000;
        const dtSim = (FIX_EVERY_MS / 1000) * TIME_SCALE;

        sim.vessels.forEach((v, i) => {
          // The ship sails on whether or not its transmitter is up.
          v.at += ((v.speedKn * 1.852 * dtSim) / 3600) * v.dir;
          if (v.at > sim.laneKm || v.at < 0) {
            v.dir = -v.dir;
            v.at = Math.min(sim.laneKm, Math.max(0, v.at));
          }

          // Transmitter dropout: silent for 45–150 s, then back.
          if (v.silentFor > 0) v.silentFor -= FIX_EVERY_MS / 1000;
          else if (sim.rand() < 0.02) v.silentFor = 45 + sim.rand() * 105;

          const { lngLat, course } = sim.place(v.at, v.dir);
          if (v.silentFor <= 0) {
            // A fix arrived: write the position, and the course when it changed.
            const p = projectLngLat(lngLat);
            xy[i * 2] = p.x;
            xy[i * 2 + 1] = p.y;
            v.lastFixAt = now;
            const rounded = Math.round(course);
            if (rounded !== v.course) {
              v.course = rounded;
              layer.store.internal.updateNode(v.id, {
                data: { name: v.name, course: rounded, speedKn: Math.round(v.speedKn) }
              });
            }
          } else if (xy[i * 2] === 0) {
            // Silent before any fix was written: park at the first known position.
            const p = projectLngLat(lngLat);
            xy[i * 2] = p.x;
            xy[i * 2 + 1] = p.y;
          }

          // Signal state from fix age.
          const age = now - v.lastFixAt;
          const next = age > 90 ? 'lost' : age > 20 ? 'stale' : 'ok';
          if (next !== v.state) {
            if (v.state !== 'ok') layer.store.internal.setNodeState(v.id, v.state, false);
            if (next !== 'ok') layer.store.internal.setNodeState(v.id, next, true);
            v.state = next;
          }
        });

        layer.store.internal.setPositionsBulk(ids, xy);
      };

      const timer = window.setInterval(tick, FIX_EVERY_MS);
      return () => window.clearInterval(timer);
    }, [sim]);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        bundle={false}
        onReady={onReady}
        header={{ title: 'Live tracking · Strait of Malacca' }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
      />
    );
  }
};
