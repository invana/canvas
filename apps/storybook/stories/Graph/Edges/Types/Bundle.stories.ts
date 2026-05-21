import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type GraphEdge,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Types/Bundle' };
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
    const settings = {
      beta: 0.85,
      edgeAlpha: 0.5,
      edgeWidth: 1.2,
      midX: 0,
      midY: 0,
    };

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
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 9 },
            bgFill: 0x4f9cf9,
            bgStrokeColor: 0x1d4ed8,
            bgStrokeWidth: 1.2,
            labelText: (n: GraphNode) => n.id,
            labelColor: 0x1e3a8a,
            labelFontSize: 10,
            labelPlacement: 'right',
            labelOffsetX: 12,
          },
        },
        edge: {
          // Per-edge `shape` overrides supply the `waypoints` and
          // `pathStyleOpts` (set in `applyWaypoints` below from the
          // GUI). The defaults here only pick the pathType + anchors.
          style: {
            shape: {
              pathType: 'bundle',
              // `center` (vs `boundary`) so endpoints sit on the node
              // centre — the bundle should read as "edges flow from
              // the dot itself", not from the dot's outer rim.
              sourceAnchor: 'center',
              targetAnchor: 'center',
            },
            strokeColor: 0x3b82f6,
            arrowTargetShape: 'none',
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    // ── Re-style edges from `settings` ──────────────────────────────────
    // The waypoint and β both live inside `edge.style.shape` —
    // re-stamping each edge's style is the GUI knob's effect.
    const applyWaypoints = (): void => {
      const pathStyleOpts = { beta: settings.beta };
      const waypoints = [{ x: settings.midX, y: settings.midY }];
      graph.store.batch(() => {
        for (const e of graph.store.edges() as IterableIterator<GraphEdge>) {
          graph.store.updateEdge(e.id, {
            style: {
              shape: {
                pathType: 'bundle',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts,
                waypoints,
              },
              strokeColor: 0x3b82f6,
              strokeWidth: settings.edgeWidth,
              strokeAlpha: settings.edgeAlpha,
              arrowTargetShape: 'none',
            },
          });
        }
      });
    };
    applyWaypoints();

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 80);

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Bundle pathStyle' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'beta', 0, 1, 0.01).name('β (tension)').onChange(applyWaypoints);
    gui.add(settings, 'edgeAlpha', 0.05, 1, 0.01).name('edge alpha').onChange(applyWaypoints);
    gui.add(settings, 'edgeWidth', 0.3, 4, 0.1).name('edge width').onChange(applyWaypoints);

    const midpoint = gui.addFolder('Midpoint waypoint');
    midpoint.add(settings, 'midX', -400, 400, 5).name('x').onChange(applyWaypoints);
    midpoint.add(settings, 'midY', -300, 300, 5).name('y').onChange(applyWaypoints);

    gui
      .add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit')
      .name('Re-fit camera');
  },
};
