import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour, TrackingBehaviour } from '@invana/graph';
import { iconSetFromLucide } from '@invana/canvas-ui';
import { Navigation2 } from 'lucide-react';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/Tracking/Follow' };
export default meta;
type Story = StoryObj;

/**
 * **Follow** — keep one moving object in view. Eight vessels sail east at their
 * own speeds. **Click a vessel** (or pick one in the panel) and the camera locks
 * onto it and stays centred as it moves; the zoom is yours to change while it
 * follows.
 *
 * **Drag the canvas** and the follow is released — taking the camera back always
 * wins, and the panel's "Following" entry resets to `none` through the behaviour's
 * `onFollowReleased` callback. Follow is the behaviour's `follow: { targetId }`
 * option, so it is also reachable from config and from the settings editor.
 *
 * Here the camera is the plain canvas camera (the default driver). Under a
 * `MapLayer` the camera is a mirror of the map, so the behaviour is given
 * `map.cameraDriver()` instead and follow moves the map — see the `LiveTracking`
 * case study.
 */
export const FollowStory: Story = {
  name: 'Follow',
  render: () => createContainer({ id: 'graph-behaviours-tracking-follow' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-behaviours-tracking-follow')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: {
          nodes: [
            { type: 'Vessel', id: 'v0', position: { x: -400, y: -210 }, data: { name: 'Aurora' } },
            { type: 'Vessel', id: 'v1', position: { x: -400, y: -150 }, data: { name: 'Bintang' } },
            { type: 'Vessel', id: 'v2', position: { x: -400, y: -90 }, data: { name: 'Celeste' } },
            { type: 'Vessel', id: 'v3', position: { x: -400, y: -30 }, data: { name: 'Delta' } },
            { type: 'Vessel', id: 'v4', position: { x: -400, y: 30 }, data: { name: 'Eastern' } },
            { type: 'Vessel', id: 'v5', position: { x: -400, y: 90 }, data: { name: 'Fortuna' } },
            { type: 'Vessel', id: 'v6', position: { x: -400, y: 150 }, data: { name: 'Golden' } },
            { type: 'Vessel', id: 'v7', position: { x: -400, y: 210 }, data: { name: 'Harmony' } }
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

    const picker = { following: 'none' };
    const tracking = new TrackingBehaviour({
      id: 'tracking',
      targetLayerId: 'graph',
      // Wiring, not a setting: reflect a release (the user dragged) back into the panel.
      onFollowReleased: () => {
        picker.following = 'none';
        followController.updateDisplay();
      }
    });
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
              label: { fontSize: 11, placement: 'bottom', offsetY: 6 }
            }
          },
          nodeTypes: { Vessel: { structure: 'marker', styling: 'vessel', bindings: { label: 'data.name' } } }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: { enabled: true, mode: 'document' },
        tracking: { enabled: true, renderDelayMs: 1000, follow: { targetId: null } }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent({ x: -440, y: -250, width: 880, height: 500 }, 30);

    // ─── The feed: eight lanes, eight speeds, wrapping at the right edge ────
    const SPEEDS = [14, 18, 22, 26, 30, 34, 38, 42];
    const lastTravelled: number[] = SPEEDS.map(() => 0);
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const sec = (now - startedAt) / 1000;
      tracking.pushFixes(
        SPEEDS.map((speed, i) => {
          // Wrap by distance travelled: 880 units of lane per lap. A lap is a new
          // journey, so forget the old track rather than glide 880 units backwards.
          const travelled = (speed * sec) % 880;
          if (travelled < lastTravelled[i]!) tracking.forget(`v${i}`);
          lastTravelled[i] = travelled;
          return { id: `v${i}`, t: now, x: -400 + travelled, y: -210 + i * 60, course: 90, speed };
        })
      );
    }, 1000);
    onStoryTeardown(() => clearInterval(timer));

    // Click a vessel to follow it.
    onStoryTeardown(
      canvas.events.on('input:node:click', ({ id }: { id: string }) => {
        picker.following = id;
        tracking.follow(id);
        followController.updateDisplay();
      })
    );

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Follow' });
    onStoryTeardown(() => gui.destroy());
    const followController = gui
      .add(picker, 'following', ['none', 'v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'])
      .name('Following')
      .onChange((id: string) => tracking.follow(id === 'none' ? null : id));
  }
};
