import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  GraphLayer,
  type GraphNode,
  type GraphEdge,
  type EdgePathType,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Layer/Defaults' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates patching the shared layer template at runtime — push a new
 * node/edge style through `canvas.update({ layers: { graph: … } })` and every
 * node/edge re-renders in one call (the cheap "apply to all" path a toolbar
 * uses, vs. looping `store.updateNode`).
 */
export const Defaults: Story = {
  render: () => createContainer({ id: 'graph-layer-defaults' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { id: 'a', position: { x: -160, y: -70 } },
      { id: 'b', position: { x: 10, y: -120 } },
      { id: 'c', position: { x: 170, y: -50 } },
      { id: 'd', position: { x: -110, y: 100 } },
      { id: 'e', position: { x: 90, y: 110 } },
    ];
    const edges: GraphEdge[] = [
      { id: 'a-b', source: 'a', target: 'b' },
      { id: 'b-c', source: 'b', target: 'c' },
      { id: 'a-d', source: 'a', target: 'd' },
      { id: 'd-e', source: 'd', target: 'e' },
      { id: 'b-e', source: 'b', target: 'e' },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layer-defaults')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Data is content — it rides on the layer via `initData`. Pure-literal
    // node/edge templates live in the serialisable config below.
    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: { style: { shape: { kind: 'circle', radius: 20 }, bgFill: 0x3b82f6 } },
          edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 2, arrowTargetShape: 'none' } },
        },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 100);

    // All controls drive the layer-level template through `canvas.update`, so
    // every node/edge updates at once — no per-item loop.
    const settings = {
      'node fill': '#3b82f6',
      'node radius': 20,
      'edge color': '#cbd5e1',
      'edge width': 2,
      'edge type': 'straight' as EdgePathType,
    };
    const hex = (s: string): number => parseInt(s.replace('#', ''), 16);

    const gui = new GUI({ title: 'Layer Defaults' });
    onStoryTeardown(() => gui.destroy());
    gui
      .addColor(settings, 'node fill')
      .onChange((v: string) =>
        canvas.update({ layers: { graph: { node: { style: { bgFill: hex(v) } } } } }),
      );
    gui
      .add(settings, 'node radius', 6, 40, 1)
      .onChange((v: number) =>
        canvas.update({
          layers: { graph: { node: { style: { shape: { kind: 'circle', radius: v } } } } },
        }),
      );
    gui
      .addColor(settings, 'edge color')
      .onChange((v: string) =>
        canvas.update({ layers: { graph: { edge: { style: { strokeColor: hex(v) } } } } }),
      );
    gui
      .add(settings, 'edge width', 0.5, 8, 0.5)
      .onChange((v: number) =>
        canvas.update({ layers: { graph: { edge: { style: { strokeWidth: v } } } } }),
      );
    gui
      .add(settings, 'edge type', [
        'straight',
        'bezier',
        'orth',
        'manhattan',
        'rounded',
        'smooth',
      ])
      .onChange((v: EdgePathType) =>
        canvas.update({ layers: { graph: { edge: { style: { shape: { pathType: v } } } } } }),
      );
  },
};
