import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type EdgeData,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/Bundle' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'bundle'` — d3-shape's `curveBundle.beta(β)` Catmull-Rom
 * variant. The curve passes through `source → waypoints → target` and
 * `β ∈ [0, 1]` controls tension: at `β = 1` it's the straight polyline
 * through the points, at `β = 0` it's a smooth Catmull-Rom that pulls
 * away from them.
 *
 * **Bundle is waypoint-driven.** With no `waypoints` field on the
 * edge's `shape`, the curve degenerates to nearly straight — there's
 * nothing to bundle through. The visual signature of bundled diagrams
 * (Connected-Papers, the d3 hierarchical edge bundling demo) comes
 * from *many edges sharing the same waypoints* so they fan out from
 * each endpoint and squeeze together through the shared midpoints.
 *
 * This story illustrates the mechanic with the minimum interesting
 * setup: two visible clusters of 4 nodes each connected by 16 edges
 * that all route through a single midpoint waypoint. Move the
 * midpoint with the GUI sliders to see the bundle re-shape live.
 *
 * For the hierarchy-driven variant where waypoints come from the
 * LCA walk between two leaves of a tree, see
 * `graph-layouts/d3-hierarchy/EdgeBundling`.
 */
export const Bundle: Story = {
  render: () => createContainer({ id: 'graph-edge-types-bundle' }),

  play: async ({ canvasElement }) => {
    // Two clusters of four nodes — left at x = -260, right at x = +260.
    const nodes: NodeData[] = [
      { id: 'L0', position: { x: -260, y: -90 } },
      { id: 'L1', position: { x: -260, y: -30 } },
      { id: 'L2', position: { x: -260, y:  30 } },
      { id: 'L3', position: { x: -260, y:  90 } },
      { id: 'R0', position: { x:  260, y: -90 } },
      { id: 'R1', position: { x:  260, y: -30 } },
      { id: 'R2', position: { x:  260, y:  30 } },
      { id: 'R3', position: { x:  260, y:  90 } },
    ];

    // 16 inter-cluster edges — every left node to every right node.
    const edges: EdgeData[] = [
      { id: 'L0-R0', source: 'L0', target: 'R0' },
      { id: 'L0-R1', source: 'L0', target: 'R1' },
      { id: 'L0-R2', source: 'L0', target: 'R2' },
      { id: 'L0-R3', source: 'L0', target: 'R3' },
      { id: 'L1-R0', source: 'L1', target: 'R0' },
      { id: 'L1-R1', source: 'L1', target: 'R1' },
      { id: 'L1-R2', source: 'L1', target: 'R2' },
      { id: 'L1-R3', source: 'L1', target: 'R3' },
      { id: 'L2-R0', source: 'L2', target: 'R0' },
      { id: 'L2-R1', source: 'L2', target: 'R1' },
      { id: 'L2-R2', source: 'L2', target: 'R2' },
      { id: 'L2-R3', source: 'L2', target: 'R3' },
      { id: 'L3-R0', source: 'L3', target: 'R0' },
      { id: 'L3-R1', source: 'L3', target: 'R1' },
      { id: 'L3-R2', source: 'L3', target: 'R2' },
      { id: 'L3-R3', source: 'L3', target: 'R3' },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-bundle')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges },
        node: {
          // `labelText` is a resolver — it stays in the constructor.
          style: {
            labelText: (n: GraphNode) => n.id,
          },
        },
      },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    // All 16 edges share the same bundle template — β, alpha, width and
    // the single midpoint `waypoint` live in the edge style and are tuned
    // live from the GUI via `canvas.update`. `center` (vs `boundary`)
    // anchors keep endpoints on the node centre so the bundle reads as
    // "edges flow from the dot itself", not from the dot's outer rim.
    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 9 },
              bgFill: 0x4f9cf9,
              bgStrokeColor: 0x1d4ed8,
              bgStrokeWidth: 1.2,
              labelColor: 0x1e3a8a,
              labelFontSize: 10,
              labelPlacement: 'right',
              labelOffsetX: 12,
            },
          },
          edge: {
            style: {
              shape: {
                pathType: 'bundle',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts: { beta: 0.85 },
                waypoints: [{ x: 0, y: 0 }],
              },
              strokeColor: 0x3b82f6,
              strokeWidth: 1.2,
              strokeAlpha: 0.5,
              arrowTargetShape: 'none',
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    // ── GUI ──────────────────────────────────────────────────────────────
    // Each control mutates the live `canvasOptions` edge style then pushes
    // the whole edge style through `canvas.update` so all 16 edges restamp.
    const edgeStyle = canvasOptions.layers.graph.edge.style;
    const pushEdgeStyle = (): void => {
      canvas.update({ layers: { graph: { edge: { style: edgeStyle } } } });
    };

    const gui = new GUI({ title: 'Bundle pathStyle' });
    onStoryTeardown(() => gui.destroy());

    gui
      .add(edgeStyle.shape.pathStyleOpts, 'beta', 0, 1, 0.01)
      .name('β (tension)')
      .onChange(pushEdgeStyle);
    gui.add(edgeStyle, 'strokeAlpha', 0.05, 1, 0.01).name('edge alpha').onChange(pushEdgeStyle);
    gui.add(edgeStyle, 'strokeWidth', 0.3, 4, 0.1).name('edge width').onChange(pushEdgeStyle);

    const midpoint = gui.addFolder('Midpoint waypoint');
    const waypoint = edgeStyle.shape.waypoints[0] as { x: number; y: number };
    midpoint.add(waypoint, 'x', -400, 400, 5).name('x').onChange(pushEdgeStyle);
    midpoint.add(waypoint, 'y', -300, 300, 5).name('y').onChange(pushEdgeStyle);

    gui
      .add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit')
      .name('Re-fit camera');
  },
};
