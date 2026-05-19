import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Behaviours/CollapseExpand' };
export default meta;
type Story = StoryObj;

/**
 * Group + outside node + cross-group edge. Click the `−` toggle at the
 * bottom of the group's frame to collapse — descendants disappear, the
 * frame renders as a single super-node carrying a count badge of the
 * hidden descendants, and the edge that pointed at `node2` re-routes to
 * the group node automatically. Click the `+` to expand back.
 *
 * Notice: store data isn't mutated when collapsing — only `style.group.collapsed`
 * flips. `edge.source` / `edge.target` stay pointing at `node2`; the
 * layer's `edgeSpec` substitution rewrites the renderer-side endpoint at
 * project time.
 */
export const CollapseExpand: Story = {
  render: () => createContainer({ id: 'graph-collapse-expand' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 60 },
          bgFill: 0xb4c0e9,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 24 },
        },
      },
      {
        id: 'node1',
        parentId: 'group-a',
        position: { x: -28, y: 0 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
      {
        id: 'node2',
        parentId: 'group-a',
        position: { x: 28, y: 0 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
      {
        id: 'outside',
        position: { x: 240, y: 0 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
    ];

    const edges: GraphEdge[] = [
      {
        id: 'cross',
        source: 'node2',
        target: 'outside',
        style: { strokeColor: 0x94a3b8, strokeWidth: 1, arrowTargetShape: 'none' },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-collapse-expand')!;
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
        // Skip expanded groups — only the toggle is interactive on them.
        // Collapsed groups behave like regular nodes (`getGroupRole` returns
        // `'collapsed'`), so they remain draggable.
        filter: (id) => graph.getGroupRole(id) !== 'expanded',
      }),
    );
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
