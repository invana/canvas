import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour, TrackingBehaviour } from '@invana/graph';
import { iconSetFromLucide } from '@invana/canvas-ui';
import { Navigation2 } from 'lucide-react';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/Tracking/Interpolation' };
export default meta;
type Story = StoryObj;

/**
 * **Interpolation** — one vessel circles a harbour and reports a position **once
 * per fix interval**. The small grey dot is the **raw fix**, written straight to
 * the node: it hops. The blue vessel is what `TrackingBehaviour` draws: the same
 * fixes, played back `renderDelayMs` in the past and interpolated between the two
 * either side of that instant, so it glides.
 *
 * Try it:
 * - **Fix interval** — slow the feed to 4 s; the dot hops rarely, the vessel still glides.
 * - **Render delay** — the price of smoothness. At 0 there is no second fix to
 *   aim at, so the vessel steps (and dead-reckons). Raise it past the fix interval
 *   and the vessel is always between two real fixes — and always that far behind
 *   the dot.
 * - **Dead-reckon for** — past the newest fix the vessel keeps going on speed and
 *   course for this long. 0 holds still instead.
 *
 * The fixes carry `speed` and `course`; the simulator is the only code that knows
 * the circle. Everything the behaviour does is in `config.behaviours.tracking`.
 */
export const InterpolationStory: Story = {
  name: 'Interpolation',
  render: () => createContainer({ id: 'graph-behaviours-tracking-interpolation' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-behaviours-tracking-interpolation')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: {
          nodes: [
            { type: 'Vessel', id: 'ship', position: { x: 160, y: 0 }, data: { name: 'MV Aurora' } },
            { type: 'Raw', id: 'raw', position: { x: 160, y: 0 }, data: { name: 'raw fix' } }
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
              label: { fontSize: 11, placement: 'bottom', offsetY: 6 }
            },
            raw: { name: 'raw', fill: 0x94a3b8, stroke: 0xffffff, strokeWidth: 1, label: { fontSize: 10, placement: 'right', offsetX: 4 } }
          },
          nodeTypes: {
            Vessel: { structure: 'marker', styling: 'vessel', bindings: { label: 'data.name' } },
            Raw: { structure: 'dot', styling: 'raw', bindings: { label: 'data.name' } }
          }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: { enabled: true, mode: 'document' },
        tracking: { enabled: true, renderDelayMs: 1500, maxExtrapolateMs: 30000, staleAfterMs: 60000, lostAfterMs: 180000 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent({ x: -220, y: -220, width: 440, height: 440 }, 40);

    // ─── The feed: a circle of radius 160, 40 units/s ───────────────────────
    const feed = { fixEveryMs: 1000 };
    const R = 160;
    const SPEED = 40; // world units per second
    const startedAt = Date.now();
    let timer: ReturnType<typeof setInterval> | null = null;
    const emit = (): void => {
      const t = Date.now();
      const phase = ((t - startedAt) / 1000) * (SPEED / R); // radians
      const x = R * Math.cos(phase);
      const y = R * Math.sin(phase);
      // Heading of travel: velocity is (−sin φ, cos φ) with y down; compass 0 = up, clockwise.
      const course = ((Math.atan2(-Math.sin(phase), -Math.cos(phase)) * 180) / Math.PI + 360) % 360;
      tracking.pushFixes([{ id: 'ship', t, x, y, course, speed: SPEED }]);
      graph.store.setPosition('raw', { x, y });
    };
    const restart = (): void => {
      if (timer) clearInterval(timer);
      timer = setInterval(emit, feed.fixEveryMs);
    };
    onStoryTeardown(() => timer && clearInterval(timer));
    emit();
    restart();

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Interpolation' });
    onStoryTeardown(() => gui.destroy());
    const t = canvasOptions.behaviours.tracking;
    const push = (patch: Record<string, unknown>): void => canvas.update({ behaviours: { tracking: patch } });
    gui.add(feed, 'fixEveryMs', 250, 5000, 250).name('Fix interval (ms)').onChange(restart);
    gui.add(t, 'renderDelayMs', 0, 6000, 100).name('Render delay (ms)').onChange((v: number) => push({ renderDelayMs: v }));
    gui.add(t, 'maxExtrapolateMs', 0, 30000, 500).name('Dead-reckon for (ms)').onChange((v: number) => push({ maxExtrapolateMs: v }));
  }
};
