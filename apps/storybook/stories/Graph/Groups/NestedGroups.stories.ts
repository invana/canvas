import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Groups/NestedGroups' };
export default meta;
type Story = StoryObj;

/**
 * Outer rectangular group containing an inner rectangular group plus a
 * loose third node. Two levels of `parentId` — `node1`/`node2` point at
 * `inner`, which points at `outer`. The deepest-first dirty-flush ensures
 * the inner frame's bounds are up to date before the outer auto-fits
 * around them, so dragging `node1` outward correctly grows both frames
 * in one pass.
 */
export const NestedGroups: Story = {
  render: () => createContainer({ id: 'graph-nested-groups' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      {
        id: 'outer',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 360, height: 360, cornerRadius: 10 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 28 },
        },
      },
      {
        id: 'inner',
        parentId: 'outer',
        position: { x: 0, y: -60 },
        style: {
          shape: { kind: 'rect', width: 220, height: 110, cornerRadius: 8 },
          bgFill: 0xeef2ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 18 },
        },
      },
      {
        id: 'node1',
        parentId: 'inner',
        position: { x: -55, y: -60 },
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
        position: { x: 55, y: -60 },
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
        position: { x: -60, y: 90 },
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nested-groups')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({
        id: 'drag',
        layerId: 'graph',
        enabled: true,
        filter: (id) => graph.getGroupRole(id) !== 'expanded',
      }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
