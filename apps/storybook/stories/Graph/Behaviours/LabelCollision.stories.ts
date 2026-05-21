import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  LabelCollisionBehaviour,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Behaviours/LabelCollision' };
export default meta;
type Story = StoryObj;

/**
 * Real-graph demo of `LabelCollisionBehaviour` over a dense layout. Every
 * node gets a label showing its name (les-misérables dataset). Toggle the
 * behaviour on / off to see how greedy hide-on-overlap keeps the graph
 * legible at any zoom level. Pan / zoom and the behaviour re-runs each time;
 * pinned labels (higher priority — wins on tie) reveal as you zoom in.
 *
 * Priority is resolved via `'node-degree'` by default, so well-connected
 * characters keep their labels visible longest as overlap pressure rises.
 */
export const LabelCollision: Story = {
  render: () => createContainer({ id: 'graph-label-collision' }),

  play: async ({ canvasElement }) => {
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    // Compose every node with a label hint. The label sits below the node
    // (placement: 'bottom') with a white pill background so it stays
    // readable on any underlying edge / shape colour.
    const nodes: GraphNode[] = lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: { group: n.data.group },
      style: {
        shape: { kind: 'circle', radius: 7 },
        bgFill: groupColors[n.data.group % groupColors.length],
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1,
        labelText: n.id,
        labelFontSize: 11,
        labelFontWeight: 500,
        labelColor: 0x0f172a,
        labelPlacement: 'bottom',
        labelOffsetY: 4,
        labelBackgroundFill: 0xffffff,
        labelBackgroundStrokeColor: 0xe2e8f0,
        labelBackgroundStrokeWidth: 1,
        labelBackgroundCornerRadius: 3,
        labelBackgroundPadding: 1,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-collision')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: lesMiserables.edges });

    void new D3ForceLayout({
      charge: { strength: -160 },
      link: { distance: 70 },
      collide: { radius: 22 },
      center: { x: 0, y: 0 },
    }).apply(graph);

    const collision = new LabelCollisionBehaviour({
      id: 'label-collision',
      layerId: 'graph',
      enabled: true,
      prioritise: 'node-degree',
      flickerGuardMs: 120,
    });
    canvas.behaviours.register(collision);

    const settings = { enable: true };
    const apply = (): void => {
      if (settings.enable) collision.enable();
      else collision.disable();
    };

    const gui = new GUI({ title: 'Label Collision' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enable').onChange(apply);
    gui.add({ help: 'pan / zoom to see hide-on-overlap update' }, 'help').disable();
  },
};
