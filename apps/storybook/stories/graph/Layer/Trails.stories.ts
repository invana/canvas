import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour, TrackingBehaviour, TrailsLayer } from '@invana/graph';
import { iconSetFromLucide } from '@invana/canvas-ui';
import { Navigation2 } from 'lucide-react';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Layer/Trails' };
export default meta;
type Story = StoryObj;

/**
 * **TrailsLayer** — where tracked objects have just been. Six vessels weave along
 * sine lanes. Each leaves a **fading trail**: its last `maxPoints` fixes, drawn as
 * `fadeBands` segments whose alpha rises toward the newest. (`PathSpec` has one
 * stroke alpha, so a fade is bands.)
 *
 * The trail passes through the **fixes**, not the interpolated position, so it is
 * the honest history — and its head runs a little **ahead** of the marker: the
 * marker is drawn `renderDelayMs` in the past, the newest fix is not.
 *
 * Try it:
 * - **Most points** / **Fade bands** — shorten the trail, or smooth the fade.
 * - **Width (px)** — the stroke is `px / zoom` in world units, refreshed when a
 *   zoom settles: zoom in and out, and it stays the same thickness on screen.
 * - **Full track for** — pick a vessel (or click one) and its **whole** track
 *   draws as one solid line beside the fading trail.
 * - **Trails for** — `all`, or a single vessel: at fleet scale you name the few
 *   that need one.
 *
 * Everything lives in `config.layers.trails`; the layer is wired to the
 * behaviour by id (`trackingBehaviourId`) and may be registered before it.
 */
export const TrailsStory: Story = {
  name: 'Trails',
  render: () => createContainer({ id: 'graph-layer-trails' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layer-trails')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      zIndex: 10,
      options: {
        initData: {
          nodes: [
            { type: 'Vessel', id: 'v0', position: { x: -400, y: -200 }, data: { name: 'Aurora' } },
            { type: 'Vessel', id: 'v1', position: { x: -400, y: -120 }, data: { name: 'Bintang' } },
            { type: 'Vessel', id: 'v2', position: { x: -400, y: -40 }, data: { name: 'Celeste' } },
            { type: 'Vessel', id: 'v3', position: { x: -400, y: 40 }, data: { name: 'Delta' } },
            { type: 'Vessel', id: 'v4', position: { x: -400, y: 120 }, data: { name: 'Eastern' } },
            { type: 'Vessel', id: 'v5', position: { x: -400, y: 200 }, data: { name: 'Fortuna' } }
          ],
          edges: []
        }
      }
    });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.layers.add(new TrailsLayer({ id: 'trails', zIndex: 5, options: { trackingBehaviourId: 'tracking' } }));
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
            marker: { name: 'marker', kind: 'simple', shape: { kind: 'circle', radius: 12 }, slots: { label: true, icon: true } }
          },
          nodeStylingTemplates: {
            vessel: {
              name: 'vessel',
              fill: 0x0284c7,
              stroke: 0xffffff,
              strokeWidth: 2,
              icon: { kind: 'named', name: 'ship', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.62, rotationBind: 'data.course' },
              label: { fontSize: 11, placement: 'bottom', offsetY: 5 }
            }
          },
          nodeTypes: { Vessel: { structure: 'marker', styling: 'vessel', bindings: { label: 'data.name' } } }
        },
        trails: {
          ids: 'all',
          maxPoints: 30,
          fadeBands: 5,
          color: 0x0284c7,
          alpha: 0.85,
          strokeWidthPx: 3,
          fullTrackIds: []
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: { enabled: true, mode: 'document' },
        tracking: { enabled: true, renderDelayMs: 1000 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent({ x: -440, y: -260, width: 880, height: 520 }, 30);

    // ─── The feed: a fix every 500 ms along sine lanes ──────────────────────
    const SPEED = 36;
    const lastX: number[] = [0, 0, 0, 0, 0, 0];
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const sec = (now - startedAt) / 1000;
      tracking.pushFixes(
        lastX.map((_, i) => {
          const travelled = ((SPEED + i * 4) * sec) % 880;
          if (travelled < lastX[i]!) {
            tracking.forget(`v${i}`);
            trails.clear(`v${i}`);
          }
          lastX[i] = travelled;
          const x = -400 + travelled;
          const y = -200 + i * 80 + 28 * Math.sin(travelled / 45 + i);
          // Heading of the curve: slope of the lane, as a compass course (90 = east).
          const slope = (28 / 45) * Math.cos(travelled / 45 + i);
          const course = (90 + (Math.atan(slope) * 180) / Math.PI + 360) % 360;
          return { id: `v${i}`, t: now, x, y, course, speed: SPEED + i * 4 };
        })
      );
    }, 500);
    onStoryTeardown(() => clearInterval(timer));
    const trails = canvas.layers.get<TrailsLayer>('trails')!;

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Trails' });
    onStoryTeardown(() => gui.destroy());
    const tl = canvasOptions.layers.trails;
    const push = (patch: Record<string, unknown>): void => canvas.update({ layers: { trails: patch } });
    const choice = { trailsFor: 'all', fullTrackFor: 'none' };
    const ids = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5'];
    gui.add(tl, 'maxPoints', 2, 120, 1).name('Most points').onChange((v: number) => push({ maxPoints: v }));
    gui.add(tl, 'fadeBands', 1, 12, 1).name('Fade bands').onChange((v: number) => push({ fadeBands: v }));
    gui.add(tl, 'strokeWidthPx', 0.5, 10, 0.5).name('Width (px)').onChange((v: number) => push({ strokeWidthPx: v }));
    gui.add(tl, 'alpha', 0.1, 1, 0.05).name('Alpha').onChange((v: number) => push({ alpha: v }));
    gui.addColor(tl, 'color').name('Colour').onChange((v: number) => push({ color: v }));
    gui.add(choice, 'trailsFor', ['all', ...ids]).name('Trails for').onChange((v: string) => push({ ids: v === 'all' ? 'all' : [v] }));
    const fullController = gui
      .add(choice, 'fullTrackFor', ['none', ...ids])
      .name('Full track for')
      .onChange((v: string) => trails.setFullTrackIds(v === 'none' ? [] : [v]));
    // Click a vessel to draw its whole track.
    onStoryTeardown(
      canvas.events.on('input:node:click', ({ id }: { id: string }) => {
        choice.fullTrackFor = id;
        trails.setFullTrackIds([id]);
        fullController.updateDisplay();
      })
    );
  }
};
