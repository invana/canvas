import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour, TrackingBehaviour } from '@invana/graph';
import { iconSetFromLucide } from '@invana/canvas-ui';
import { Navigation2 } from 'lucide-react';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/Tracking/DeadReckoning' };
export default meta;
type Story = StoryObj;

/**
 * **Dead reckoning** — what a vessel does when its reports stop. The feed sends a
 * fix every second with a `speed` and a `course` (due east). The grey dot is the
 * **last fix received**.
 *
 * Untick **Feed on** and the reports stop. The vessel does not freeze at once: it
 * carries on along its course at its last speed for **Dead-reckon for** — the
 * distance it would have covered, not a measurement — and then **holds**. A fix
 * with no speed or no course is never guessed at: it holds from the start.
 *
 * Try it:
 * - Cut the feed with the default 30 s and watch the vessel run past the dot, then stop.
 * - Set **Dead-reckon for** to 0 and cut the feed: the vessel stops where the last fix said.
 * - Tick **Feed on** again: the next fix pulls the vessel to the truth — through
 *   interpolation, not a snap, because the new fix is aimed at from where it is drawn.
 *
 * Reading the state: while dead reckoning the object is still `moving`; after
 * `staleAfterMs` it turns `stale` and dims (see the SignalState story), which is
 * how an analyst tells a measured position from a guessed one.
 */
export const DeadReckoningStory: Story = {
  name: 'DeadReckoning',
  render: () => createContainer({ id: 'graph-behaviours-tracking-dead-reckoning' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-behaviours-tracking-dead-reckoning')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: {
          nodes: [
            { type: 'Vessel', id: 'ship', position: { x: -300, y: 0 }, data: { name: 'MV Aurora' } },
            { type: 'Raw', id: 'raw', position: { x: -300, y: 0 }, data: { name: 'last fix' } }
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
            marker: { name: 'marker', kind: 'simple', shape: { kind: 'circle', radius: 16 }, slots: { label: true, icon: true } },
            dot: { name: 'dot', kind: 'simple', shape: { kind: 'circle', radius: 4 }, slots: { label: true } }
          },
          nodeStylingTemplates: {
            vessel: {
              name: 'vessel',
              fill: 0x0284c7,
              stroke: 0xffffff,
              strokeWidth: 2,
              icon: { kind: 'named', name: 'ship', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.62, rotationBind: 'data.course' },
              label: { fontSize: 11, placement: 'top', offsetY: -6 }
            },
            raw: { name: 'raw', fill: 0x94a3b8, stroke: 0xffffff, strokeWidth: 1, label: { fontSize: 10, placement: 'bottom', offsetY: 4 } }
          },
          nodeTypes: {
            Vessel: { structure: 'marker', styling: 'vessel', bindings: { label: 'data.name' } },
            Raw: { structure: 'dot', styling: 'raw', bindings: { label: 'data.name' } }
          },
          node: { state: { stale: { bgAlpha: 0.5 }, lost: { bgAlpha: 0.3, bgStrokeColor: 0xe05252 } } }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: { enabled: true, mode: 'document' },
        tracking: { enabled: true, renderDelayMs: 1500, maxExtrapolateMs: 30000, staleAfterMs: 45000, lostAfterMs: 120000 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent({ x: -340, y: -120, width: 680, height: 240 }, 30);

    // ─── The feed: due east at 30 units/s, restarting at the left edge ─────
    const feed = { on: true };
    const SPEED = 30;
    let x = -300;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      x += (SPEED * (now - last)) / 1000; // the ship sails on whether or not it reports
      last = now;
      if (x > 300) {
        x = -300;
        tracking.forget('ship'); // a wrap is a new journey, not a 600-unit glide backwards
      }
      if (!feed.on) return;
      tracking.pushFixes([{ id: 'ship', t: now, x, y: 0, course: 90, speed: SPEED }]);
      graph.store.setPosition('raw', { x, y: 0 });
    }, 1000);
    onStoryTeardown(() => clearInterval(timer));

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Dead reckoning' });
    onStoryTeardown(() => gui.destroy());
    const t = canvasOptions.behaviours.tracking;
    const push = (patch: Record<string, unknown>): void => canvas.update({ behaviours: { tracking: patch } });
    gui.add(feed, 'on').name('Feed on');
    gui.add(t, 'maxExtrapolateMs', 0, 60000, 1000).name('Dead-reckon for (ms)').onChange((v: number) => push({ maxExtrapolateMs: v }));
    gui.add(t, 'renderDelayMs', 0, 6000, 100).name('Render delay (ms)').onChange((v: number) => push({ renderDelayMs: v }));
  }
};
