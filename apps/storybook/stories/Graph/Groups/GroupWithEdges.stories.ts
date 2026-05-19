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

const meta: Meta = { title: 'Graph/Groups/GroupWithEdges' };
export default meta;
type Story = StoryObj;

/**
 * Two adjacent rectangular groups, each with three internal nodes, plus
 * a cross-group edge between `a3` and `b1`. Demonstrates that:
 *
 * - Intra-group edges (`a1 → a2`, `b1 → b2`) route normally — the
 *   group's `hittable: false` doesn't affect connectors.
 * - The cross-group edge anchors at each endpoint's boundary as usual.
 *   Collapsing one group (via `CollapseExpandBehaviour`) re-routes the
 *   cross edge to the collapsed super-node automatically.
 * - The group frame paints behind its children (zIndex `−1`) so edges
 *   drawn at default zIndex sit on top of the frame.
 */
export const GroupWithEdges: Story = {
  render: () => createContainer({ id: 'graph-group-with-edges' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 220, height: 200, cornerRadius: 8 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 20 },
          labelText: 'Service A',
          labelColor: 0x6b7fff,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      {
        id: 'a1', parentId: 'group-a', position: { x: -50, y: -40 },
        style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0x3b82f6, labelText: 'a1', labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      {
        id: 'a2', parentId: 'group-a', position: { x: 50, y: -40 },
        style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0x3b82f6, labelText: 'a2', labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      {
        id: 'a3', parentId: 'group-a', position: { x: 0, y: 50 },
        style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0x3b82f6, labelText: 'a3', labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      {
        id: 'group-b',
        position: { x: 360, y: 0 },
        style: {
          shape: { kind: 'rect', width: 220, height: 200, cornerRadius: 8 },
          bgFill: 0xfdf4ff,
          bgStrokeColor: 0xc026d3,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 20 },
          labelText: 'Service B',
          labelColor: 0xc026d3,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      {
        id: 'b1', parentId: 'group-b', position: { x: 310, y: -40 },
        style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0xc026d3, labelText: 'b1', labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      {
        id: 'b2', parentId: 'group-b', position: { x: 410, y: -40 },
        style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0xc026d3, labelText: 'b2', labelPlacement: 'bottom', labelOffsetY: 6 },
      },
      {
        id: 'b3', parentId: 'group-b', position: { x: 360, y: 50 },
        style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0xc026d3, labelText: 'b3', labelPlacement: 'bottom', labelOffsetY: 6 },
      },
    ];

    const edges: GraphEdge[] = [
      { id: 'a1-a2', source: 'a1', target: 'a2', style: { strokeColor: 0x94a3b8, strokeWidth: 1, arrowTargetShape: 'none' } },
      { id: 'a2-a3', source: 'a2', target: 'a3', style: { strokeColor: 0x94a3b8, strokeWidth: 1, arrowTargetShape: 'none' } },
      { id: 'b1-b2', source: 'b1', target: 'b2', style: { strokeColor: 0x94a3b8, strokeWidth: 1, arrowTargetShape: 'none' } },
      { id: 'b1-b3', source: 'b1', target: 'b3', style: { strokeColor: 0x94a3b8, strokeWidth: 1, arrowTargetShape: 'none' } },
      // Cross-group — re-routes to the collapsed super-node when either side collapses.
      { id: 'cross', source: 'a3', target: 'b1', style: { strokeColor: 0x6b7fff, strokeWidth: 1.5, strokeDashArray: [4, 3], arrowTargetShape: 'none' } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-group-with-edges')!;
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
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
