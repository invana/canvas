/**
 * **Zoom state** — level of detail through the style catalogue.
 *
 * `ZoomStateBehaviour` writes one runtime state (`detail` here) on every node
 * while the camera is at or past `minZoom`, and clears it below. The state's
 * overlay does the rest:
 *
 *   - **Stories** read their id at overview (`MO-01`) and `id · title` up close
 *     — base `labelText` is the id, `state.detail.labelText` the long form.
 *   - **Steps** carry no base label: theirs lives only in the overlay, so they
 *     read nothing at overview and their name up close.
 *   - **Hover** still applies on top — the state composes with the canonical
 *     ones.
 *
 * Zoom in past the threshold (the panel's **minZoom**, `1.6` by default — just past the fitted view) and the
 * labels lengthen; zoom out and they shorten again. Turn the behaviour off and
 * every node falls back to its base style.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  ThemeBehaviour,
  ZoomStateBehaviour,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ZoomState' };
export default meta;
type Story = StoryObj;

const STORIES: [string, string, number, number][] = [
  ['MO-01', 'Create a model', 160, 0],
  ['MO-02', 'Add a property rule', 320, 0],
  ['EX-01', 'Ask a question', 480, -60],
  ['EX-02', 'Trust the answer', 640, -60],
  ['EX-03', 'Share and present an answer', 800, 0]
];
const STEPS: [string, string, number, number][] = [
  ['start', 'An Admin readies the install', 0, 0],
  ['decide', 'Is the answer clear?', 480, 60],
  ['end', 'Explore the sample graph', 960, 0]
];
const NEXT: [string, string][] = [
  ['start', 'MO-01'],
  ['MO-01', 'MO-02'],
  ['MO-02', 'EX-01'],
  ['MO-02', 'decide'],
  ['EX-01', 'EX-02'],
  ['decide', 'EX-03'],
  ['EX-02', 'EX-03'],
  ['EX-03', 'end']
];

export const ZoomStateStory: Story = {
  name: 'ZoomState',
  render: () => createContainer({ id: 'graph-zoom-state' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      ...STORIES.map(([id, title, x, y]): GraphNode => ({
        type: 'Story',
        id,
        position: { x, y },
        style: { shape: { kind: 'circle', radius: 10 }, bgFill: 0x4f9cf9, labelText: id },
        state: { detail: { labelText: `${id} · ${title}` } }
      })),
      ...STEPS.map(([id, title, x, y]): GraphNode => ({
        type: 'Step',
        id,
        position: { x, y },
        style: { shape: { kind: 'rect', width: 24, height: 14, cornerRadius: 3 }, bgFill: 0x94a3b8 },
        state: { detail: { labelText: title } }
      }))
    ];
    const edges: GraphEdge[] = NEXT.map(([source, target]) => ({
      type: 'NEXT',
      id: `${source}-${target}`,
      source,
      target,
      style: { arrowTargetShape: 'triangle' }
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-zoom-state')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ZoomStateBehaviour({ id: 'detail', targetLayerId: 'graph', state: 'detail' }));

    const settings = { enabled: true, minZoom: 1.6 };
    await canvas.init({
      container,
      autoResize: true,
      config: {
        layers: { graph: { node: { style: { labelFontSize: 11, labelPlacement: 'bottom', labelOffsetY: 4 } } } },
        behaviours: {
          theme: { enabled: true, mode: 'document' },
          pan: { enabled: true },
          zoom: { enabled: true },
          hover: { enabled: true },
          detail: { enabled: settings.enabled, minZoom: settings.minZoom }
        }
      }
    });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const gui = new GUI({ title: 'Zoom state' });
    onStoryTeardown(() => gui.destroy());
    const apply = (): void => {
      canvas.update({ behaviours: { detail: { enabled: settings.enabled, minZoom: settings.minZoom } } });
    };
    gui.add(settings, 'enabled').onChange(apply);
    gui.add(settings, 'minZoom', 0.2, 3, 0.1).onChange(apply);
  }
};
