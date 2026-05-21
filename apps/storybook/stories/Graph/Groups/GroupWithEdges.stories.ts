import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
  type NodeStyle,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Groups/GroupWithEdges' };
export default meta;
type Story = StoryObj;

/**
 * Two rect groups with intra-group edges plus one cross-group edge.
 *
 * The frames carry a **tinted bgFill** so you can directly observe the
 * renderer's z-order: `PrimitivesRenderer` paints all connectors below
 * all shapes, so the cross edge slipping under the colored group
 * silhouettes is the expected behaviour — and the visible artifact a
 * future `backgroundShapeLayer` refactor would address. Toggle the fill
 * via the GUI to confirm: `'filled'` (tinted) hides the edge inside
 * each group; `'stroke-only'` lets it read through.
 *
 * `CollapseExpandBehaviour` is wired up so you can collapse either
 * group and watch the cross edge re-route to the surviving super-node.
 */
export const GroupWithEdges: Story = {
  render: () => createContainer({ id: 'graph-group-with-edges' }),

  play: async ({ canvasElement }) => {
    // Default to a low-alpha tinted fill so the edge-vs-shape z-order is
    // visible (the renderer paints connectors below shapes, so the
    // cross-group edge gets occluded inside the colored silhouette).
    // Flip via GUI to `stroke-only` to see the edge unobstructed.
    const settings = { bgVariant: 'filled' as 'filled' | 'stroke-only' };
    const variantStyleA = (v: typeof settings.bgVariant) =>
      v === 'filled'
        ? { bgFill: 0x6b7fff, bgAlpha: 0.18 }
        : { bgFill: undefined, bgAlpha: undefined };
    const variantStyleB = (v: typeof settings.bgVariant) =>
      v === 'filled'
        ? { bgFill: 0xc026d3, bgAlpha: 0.18 }
        : { bgFill: undefined, bgAlpha: undefined };

    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          // Small declared base — `autoFit: true` grows the frame to wrap
          // children when expanded; the small base is what shows on
          // collapse so the super-node reads as node-sized.
          shape: { kind: 'rect', width: 60, height: 60, cornerRadius: 8 },
          bgFill: 0x6b7fff,
          bgAlpha: 0.18,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1.5,
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
          shape: { kind: 'rect', width: 60, height: 60, cornerRadius: 8 },
          bgFill: 0xc026d3,
          bgAlpha: 0.18,
          bgStrokeColor: 0xc026d3,
          bgStrokeWidth: 1.5,
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
      new DragNodeBehaviour({ id: 'drag', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);

    const gui = new GUI({ title: 'Group fill' });
    onStoryTeardown(() => gui.destroy());
    gui
      .add(settings, 'bgVariant', ['filled', 'stroke-only'])
      .name('bgVariant')
      .onChange(() => {
        for (const [id, variantFn] of [
          ['group-a', variantStyleA] as const,
          ['group-b', variantStyleB] as const,
        ]) {
          const node = graph.store.getNode(id);
          if (!node) continue;
          const priorStyle = (node.style ?? {}) as NodeStyle;
          // Spread variant *after* the prior style so it overrides any
          // leftover `bgFill` / `bgAlpha` when switching to stroke-only.
          graph.store.updateNode(id, {
            style: { ...priorStyle, ...variantFn(settings.bgVariant) },
          });
        }
      });
  },
};
