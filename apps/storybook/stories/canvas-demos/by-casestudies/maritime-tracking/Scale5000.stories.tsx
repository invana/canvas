/**
 * **Scale 5,000** — the live-tracking budget (RFC `feat-2026-11-17-moving-objects-cannot-be-tracked-live`,
 * V5 / F11). 5,000 vessels bounce around a 12,000 × 7,000 world, each reporting a fix
 * once a second with its course, so every second `TrackingBehaviour.pushFixes` takes
 * 5,000 fixes and every frame it samples 5,000 tracks, writes the ones that moved in
 * **one** `setPositionsBulk`, and turns the icons to their headings. The first 50
 * vessels also draw a fading trail.
 *
 * What to read off it: the **DevInfo** panel (top left) shows the engine's own frame
 * breakdown — `dataFlush` is the position write reaching the renderer, `layers` the
 * redraw. The CPU side of the tracking tick (sample + write) is what this code
 * controls; GPU frame time depends on the machine and is reported, not gated
 * (RFC decision D8).
 *
 * Labels appear only when zoomed in (`labelMinZoom`), as they would on a real fleet
 * map; the icons rotate to the heading at every zoom.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasMessageBar, GraphCanvasApp, GraphStatusBar, iconSetFromLucide } from '@invana/canvas-ui';
import { DevInfoLayer } from '@invana/canvas';
import type { CanvasConfig } from '@invana/canvas';
import { TrackingBehaviour, TrailsLayer, type GraphCanvas, type GraphData, type GraphNode } from '@invana/graph';
import { Navigation2 } from 'lucide-react';

const meta: Meta = {
  title: 'canvas-demos/by-casestudies/maritime-tracking/Scale5000'
};
export default meta;
type Story = StoryObj;

export const Scale5000Story: Story = {
  name: 'Scale5000',
  render: function Scale5000Render() {
    const COUNT = 5000;
    const W = 12000;
    const H = 7000;

    // ─── The fleet: position, speed and direction per vessel ────────────────

    const fleet = useMemo(() => {
      let seed = 11;
      const rand = (): number => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };
      return Array.from({ length: COUNT }, (_, i) => {
        const heading = rand() * Math.PI * 2;
        const speed = 20 + rand() * 60; // world units per second
        return {
          id: `v${i}`,
          x: rand() * W,
          y: rand() * H,
          vx: Math.sin(heading) * speed,
          vy: -Math.cos(heading) * speed,
          speed
        };
      });
    }, []);

    const data = useMemo((): GraphData => {
      const nodes = fleet.map(
        (v, i): GraphNode => ({
          id: v.id,
          type: 'Vessel',
          position: { x: v.x, y: v.y },
          data: { name: `Vessel ${i}`, course: ((Math.atan2(v.vx, -v.vy) * 180) / Math.PI + 360) % 360 }
        })
      );
      return { nodes, edges: [] };
    }, [fleet]);

    // ─── Config ────────────────────────────────────────────────────────────

    const config = useMemo(
      () =>
        ({
          layers: {
            graph: {
              iconSet: iconSetFromLucide({ ship: Navigation2 }),
              nodeStructureTemplates: {
                marker: {
                  name: 'marker',
                  kind: 'simple',
                  shape: { kind: 'circle', radius: 14 },
                  slots: { label: true, icon: true }
                }
              },
              nodeStylingTemplates: {
                vessel: {
                  name: 'vessel',
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
                  label: { fontSize: 11, placement: 'bottom', offsetY: 4 }
                }
              },
              nodeTypes: {
                Vessel: { structure: 'marker', styling: 'vessel', bindings: { label: 'data.name' } }
              },
              node: { style: { labelMinZoom: 1.5 } }
            },
            trails: {
              ids: Array.from({ length: 50 }, (_, i) => `v${i}`),
              maxPoints: 20,
              fadeBands: 4,
              color: 0x475569,
              alpha: 0.8,
              strokeWidthPx: 2
            }
          },
          behaviours: {
            tracking: { enabled: true, renderDelayMs: 1500, maxExtrapolateMs: 30000, staleAfterMs: 20000, lostAfterMs: 90000 }
          }
        }) as unknown as CanvasConfig,
      []
    );

    // ─── Engine ────────────────────────────────────────────────────────────

    const tracking = useRef<TrackingBehaviour | null>(null);

    const onReady = useCallback(
      (canvas: GraphCanvas | null) => {
        if (!canvas) return;
        canvas.layers.add(new TrailsLayer({ id: 'trails', zIndex: 5, options: { trackingBehaviourId: 'tracking' } }));
        canvas.layers.add(new DevInfoLayer({ id: 'devinfo' }));
        const behaviour = new TrackingBehaviour({ id: 'tracking', targetLayerId: 'graph' });
        canvas.behaviours.register(behaviour);
        tracking.current = behaviour;
        // Config only reaches instances registered when it is applied — re-apply.
        canvas.update({ behaviours: config.behaviours, layers: { trails: config.layers!.trails! } });
        canvas.showMessage('5,000 vessels · 1 fix/s each · 50 trails · read the frame breakdown in DevInfo');
      },
      [config]
    );

    // ─── The feed: 5,000 fixes per second ───────────────────────────────────

    useEffect(() => {
      let last = Date.now();
      const timer = window.setInterval(() => {
        const behaviour = tracking.current;
        if (!behaviour) return;
        const now = Date.now();
        const dt = (now - last) / 1000;
        last = now;
        const fixes = fleet.map((v) => {
          v.x += v.vx * dt;
          v.y += v.vy * dt;
          // Bounce off the edges: the heading changes, the position does not jump.
          if (v.x < 0 || v.x > W) v.vx = -v.vx;
          if (v.y < 0 || v.y > H) v.vy = -v.vy;
          v.x = Math.min(W, Math.max(0, v.x));
          v.y = Math.min(H, Math.max(0, v.y));
          return { id: v.id, t: now, x: v.x, y: v.y, course: ((Math.atan2(v.vx, -v.vy) * 180) / Math.PI + 360) % 360, speed: v.speed };
        });
        behaviour.pushFixes(fixes);
      }, 1000);
      return () => window.clearInterval(timer);
    }, [fleet]);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{ title: 'Scale 5,000 · live tracking budget' }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
      />
    );
  }
};
