import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour, TrackingBehaviour } from '@invana/graph';
import { iconSetFromLucide } from '@invana/canvas-ui';
import { Navigation2 } from 'lucide-react';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/Tracking/SignalState' };
export default meta;
type Story = StoryObj;

/**
 * **Signal state** — is this position current, or are we looking at the past?
 * `TrackingBehaviour` gives every object exactly one runtime state from the age of
 * its newest fix and its speed, and the style catalogue says what each looks like:
 *
 * | State | When | Looks like (here) |
 * |---|---|---|
 * | `moving` | a recent fix | normal |
 * | `stopped` | speed under `stoppedBelowSpeed` for `stoppedAfterMs` | grey, "· stopped" |
 * | `stale` | no fix for `staleAfterMs` (15 s here) | faded, "· no fix" |
 * | `lost` | no fix for `lostAfterMs` (40 s here) | faint with a red ring, "· signal lost" |
 *
 * Four vessels, three in trouble from the start: **Berth** reports speed 0 (it
 * turns `stopped` after 10 s), **Quiet** stops reporting after 5 s (`stale`, then
 * `lost`), and **Steady** and **Drifter** report normally. The **Silence Drifter**
 * button cuts a healthy vessel's feed live; **Restore** brings it back — one fix
 * and it is `moving` again.
 *
 * Overlays come from `config.layers.graph.node.state.<name>`; the label text per
 * state from `nodeTypes.Vessel.states.<name>.label`. The behaviour only chooses the
 * state; it writes it on **transitions**, once, never per frame.
 */
export const SignalStateStory: Story = {
  name: 'SignalState',
  render: () => createContainer({ id: 'graph-behaviours-tracking-signal-state' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-behaviours-tracking-signal-state')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: {
          nodes: [
            { type: 'Vessel', id: 'steady', position: { x: -240, y: -90 }, data: { name: 'Steady' } },
            { type: 'Vessel', id: 'drifter', position: { x: -240, y: -30 }, data: { name: 'Drifter' } },
            { type: 'Vessel', id: 'berth', position: { x: -240, y: 30 }, data: { name: 'Berth' } },
            { type: 'Vessel', id: 'quiet', position: { x: -240, y: 90 }, data: { name: 'Quiet' } }
          ],
          edges: []
        }
      }
    });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    const tracking = new TrackingBehaviour({ id: 'tracking', targetLayerId: 'graph' });
    canvas.behaviours.register(tracking);

    const canvasOptions = {
      layers: {
        graph: {
          iconSet: iconSetFromLucide({ ship: Navigation2 }),
          nodeStructureTemplates: {
            marker: { name: 'marker', kind: 'simple', shape: { kind: 'circle', radius: 14 }, slots: { label: true, icon: true } }
          },
          nodeStylingTemplates: {
            vessel: {
              name: 'vessel',
              fill: 0x0284c7,
              stroke: 0xffffff,
              strokeWidth: 2,
              icon: { kind: 'named', name: 'ship', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.62, rotationBind: 'data.course' },
              label: { fontSize: 11, placement: 'right', offsetX: 8 }
            }
          },
          nodeTypes: {
            Vessel: {
              structure: 'marker',
              styling: 'vessel',
              bindings: { label: 'data.name' },
              states: {
                stopped: { label: '{data.name} · stopped' },
                stale: { label: '{data.name} · no fix' },
                lost: { label: '{data.name} · signal lost' }
              }
            }
          },
          node: {
            state: {
              stopped: { bgFill: 0x64748b },
              stale: { bgAlpha: 0.5 },
              lost: { bgAlpha: 0.3, bgStrokeColor: 0xe05252, bgStrokeWidth: 3 }
            }
          }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: { enabled: true, mode: 'document' },
        tracking: {
          enabled: true,
          renderDelayMs: 1000,
          staleAfterMs: 15000,
          lostAfterMs: 40000,
          stoppedBelowSpeed: 1,
          stoppedAfterMs: 10000
        }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent({ x: -280, y: -140, width: 560, height: 280 }, 30);

    // ─── The feed ───────────────────────────────────────────────────────────
    const feed = { drifterOn: true };
    const SPEED = 12;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const sec = (now - startedAt) / 1000;
      const x = -240 + SPEED * sec;
      const fixes = [{ id: 'steady', t: now, x, y: -90, course: 90, speed: SPEED }];
      if (feed.drifterOn) fixes.push({ id: 'drifter', t: now, x, y: -30, course: 90, speed: SPEED });
      fixes.push({ id: 'berth', t: now, x: -240, y: 30, course: 90, speed: 0 });
      if (sec < 5) fixes.push({ id: 'quiet', t: now, x, y: 90, course: 90, speed: SPEED });
      tracking.pushFixes(fixes);
    }, 1000);
    onStoryTeardown(() => clearInterval(timer));

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Signal state' });
    onStoryTeardown(() => gui.destroy());
    gui.add({ silence: () => (feed.drifterOn = false) }, 'silence').name('Silence Drifter');
    gui.add({ restore: () => (feed.drifterOn = true) }, 'restore').name('Restore Drifter');
    const t = canvasOptions.behaviours.tracking;
    const push = (patch: Record<string, unknown>): void => canvas.update({ behaviours: { tracking: patch } });
    gui.add(t, 'staleAfterMs', 2000, 60000, 1000).name('Stale after (ms)').onChange((v: number) => push({ staleAfterMs: v }));
    gui.add(t, 'lostAfterMs', 5000, 120000, 1000).name('Lost after (ms)').onChange((v: number) => push({ lostAfterMs: v }));
  }
};
