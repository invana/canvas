import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Groups/CircleNestedGroups' };
export default meta;
type Story = StoryObj;

/**
 * Concentric circular groups — outer circle contains an inner circle
 * (which contains `node1`, `node2`) plus a loose `node3` floating inside
 * the outer ring. The same nested-group machinery as the rect variant,
 * but the auto-fit math reaches the smallest enclosing circle via the
 * AABB half-diagonal + padding.
 */
export const CircleNestedGroups: Story = {
  render: () => createContainer({ id: 'graph-circle-nested-groups' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      {
        id: 'outer',
        position: { x: 0, y: 0 },
        style: {
          // Small declared radius — autoFit grows the frame around
          // children while expanded; the small base is reused on collapse
          // so the super-node reads as node-sized.
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 36 },
        },
      },
      {
        id: 'inner',
        parentId: 'outer',
        position: { x: 0, y: -50 },
        style: {
          shape: { kind: 'circle', radius: 28 },
          bgFill: 0xeef2ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 22 },
        },
      },
      {
        id: 'node1',
        parentId: 'inner',
        position: { x: -40, y: -50 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node1',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
      {
        id: 'node2',
        parentId: 'inner',
        position: { x: 40, y: -50 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node2',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
      {
        id: 'node3',
        parentId: 'outer',
        position: { x: -50, y: 120 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node3',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
    ];

    const edges: GraphEdge[] = [];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-circle-nested-groups')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
