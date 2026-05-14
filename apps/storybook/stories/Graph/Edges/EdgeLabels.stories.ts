import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ConnectorLabelPlacement } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeLabelHint,
  type EdgePathType,
  type EdgeRenderHints,
  type GraphEdge,
  type GraphNode,
  type NodeRenderHints,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Edges/EdgeLabels' };
export default meta;
type Story = StoryObj;

/**
 * `GraphLayer` rendering edges with text labels via the `label` hint on
 * `EdgeRenderHints` across every built-in `pathType` — `straight`, `bezier`,
 * `bump-radial`, `smooth`, `rounded`, `orth`, `manhattan`. Each row uses a
 * different path style; the same label demonstrates that `autoRotate`,
 * `keepUpright`, `placement`, and `pathOffset` behave uniformly.
 *
 * Drag any endpoint to confirm the label tracks the path under live
 * re-routing. The lil-gui panel rewrites every edge's label hint so you can
 * sweep through placements (start / center / end / 0.25 / 0.75), pathOffset
 * (pad N px from source toward target), and screen-space offset (lift the
 * label perpendicular to the path direction).
 */
export const EdgeLabels: Story = {
  render: () => createContainer({ id: 'graph-edge-labels' }),

  play: async ({ canvasElement }) => {
    type Node = GraphNode<NodeRenderHints>;
    type Edge = GraphEdge<EdgeRenderHints>;

    // One row per path style. Each row has a source on the left and a target
    // on the right; the label sits on the path.
    const variants: Array<{ id: string; pathType: EdgePathType; tag: string }> = [
      { id: 'straight',    pathType: 'straight',    tag: 'straight' },
      { id: 'bezier',      pathType: 'bezier',      tag: 'bezier' },
      { id: 'bump-radial', pathType: 'bump-radial', tag: 'bump-radial' },
      { id: 'smooth',      pathType: 'smooth',      tag: 'smooth' },
      { id: 'rounded',     pathType: 'rounded',     tag: 'rounded' },
      { id: 'orth',        pathType: 'orth',        tag: 'orth' },
      { id: 'manhattan',   pathType: 'manhattan',   tag: 'manhattan' },
    ];

    const rowSpacing = 100;
    const xSrc = -240;
    const xTgt = 240;
    const y0 = -((variants.length - 1) * rowSpacing) / 2;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]!;
      const y = y0 + i * rowSpacing;

      // Source — a small circle tagged with the variant name (as its own
      // label, so the visual cross-reference is obvious).
      nodes.push({
        id: `${v.id}-src`,
        position: { x: xSrc, y },
        data: {
          shape: 'circle',
          size: 18,
          fill: 0x4f9cf9,
          stroke: 0x1d4ed8,
          label: {
            content: { kind: 'text', text: v.tag, fontSize: 11, fontWeight: 600, fill: 0x475569 },
            placement: 'left',
            offset: { x: -4 },
          },
        },
      });
      nodes.push({
        id: `${v.id}-tgt`,
        position: { x: xTgt, y },
        data: {
          shape: 'circle',
          size: 18,
          fill: 0x10b981,
          stroke: 0x047857,
        },
      });

      // Edge with a label sitting on its path. Bezier needs an explicit axis
      // to bend horizontally; bump-radial needs an origin reference so the
      // arc bulges away from the centre of the layout.
      const pathStyleOpts: Record<string, unknown> | undefined =
        v.pathType === 'bezier'
          ? { axis: 'h', tension: 0.6 }
          : v.pathType === 'bump-radial'
            ? { origin: { x: 0, y: 0 } }
            : undefined;

      edges.push({
        id: v.id,
        source: `${v.id}-src`,
        target: `${v.id}-tgt`,
        data: {
          pathType: v.pathType,
          ...(pathStyleOpts ? { pathStyleOpts } : {}),
          stroke: 0xcbd5e1,
          strokeWidth: 1.5,
          arrow: true,
          label: defaultEdgeLabel('flows-to'),
        },
      });
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-labels')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: { edgeDefaults: { stroke: 0xcbd5e1, strokeWidth: 1.5, arrow: true } },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 80);

    // ─── GUI: rewrite every edge's label hint live ─────────────────────────
    const settings = {
      text: 'flows-to',
      placement: 'center' as ConnectorLabelPlacement,
      pathOffset: 0,
      autoRotate: true,
      keepUpright: true,
      offsetX: 0,
      offsetY: -8,
      background: true,
    };

    const applyAll = (): void => {
      for (const v of variants) {
        const edge = graph.store.getEdge(v.id);
        if (!edge) continue;
        const baseData = (edge.data ?? {}) as EdgeRenderHints;
        graph.store.updateEdge(v.id, {
          data: { ...baseData, label: buildEdgeLabel(settings) },
        });
      }
    };

    const gui = new GUI({ title: 'Edge Label' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(applyAll);
    gui.add(settings, 'placement', {
      start: 'start',
      center: 'center',
      end: 'end',
      '0.25': 0.25,
      '0.75': 0.75,
    } as Record<string, ConnectorLabelPlacement>).onChange(applyAll);
    gui.add(settings, 'pathOffset', -80, 80, 2).onChange(applyAll);
    gui.add(settings, 'autoRotate').onChange(applyAll);
    gui.add(settings, 'keepUpright').onChange(applyAll);
    const off = gui.addFolder('offset (post-rotation)');
    off.add(settings, 'offsetX', -30, 30, 1).onChange(applyAll);
    off.add(settings, 'offsetY', -30, 30, 1).onChange(applyAll);
    gui.add(settings, 'background').onChange(applyAll);
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultEdgeLabel(text: string): EdgeLabelHint {
  return {
    content: { kind: 'text', text, fontSize: 11, fontWeight: 500, fill: 0x0f172a },
    background: {
      fill: 0xffffff,
      stroke: 0xe2e8f0,
      strokeWidth: 1,
      radius: 4,
      padding: [2, 6],
    },
    placement: 'center',
    offset: { y: -8 },
    autoRotate: true,
    keepUpright: true,
  };
}

function buildEdgeLabel(s: {
  text: string;
  placement: ConnectorLabelPlacement;
  pathOffset: number;
  autoRotate: boolean;
  keepUpright: boolean;
  offsetX: number;
  offsetY: number;
  background: boolean;
}): EdgeLabelHint {
  return {
    content: { kind: 'text', text: s.text, fontSize: 11, fontWeight: 500, fill: 0x0f172a },
    background: s.background
      ? { fill: 0xffffff, stroke: 0xe2e8f0, strokeWidth: 1, radius: 4, padding: [2, 6] }
      : undefined,
    placement: s.placement,
    pathOffset: s.pathOffset,
    autoRotate: s.autoRotate,
    keepUpright: s.keepUpright,
    offset: { x: s.offsetX, y: s.offsetY },
  };
}
