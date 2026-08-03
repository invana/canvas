import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas, DragNodeBehaviour, GraphLayer,
  type GraphEdge, type GraphNode,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/LoopPolyline/Corners' };
export default meta;
type Story = StoryObj;

/**
 * Graph-side counterpart to
 * `Canvas/Connectors/PathStyles/LoopPolyline/Corners`.
 *
 * `loop-polyline` in **corner wrap** mode — `side` set to `top-right`,
 * `bottom-right`, `bottom-left`, or `top-left`. Four orthogonal
 * segments wrapping the named corner of the host silhouette: one foot
 * on the horizontal edge → perpendicular stub out → cross past the
 * corner → perpendicular stub down past the vertical-edge level →
 * back into the vertical edge so the arrow marker lands flush with
 * the silhouette.
 *
 * Per-host `baseOffsetX` / `baseOffsetY` are tuned so both feet sit on
 * (or just outside) the silhouette:
 *
 *  - **rect** — `baseOffsetX = halfW`, `baseOffsetY = halfH`.
 *  - **circle** — symmetric: `baseOffsetX = baseOffsetY =
 *    (gap + √(2r² − gap²)) / 2`.
 *  - **ellipse** — falls back to AABB (`rx`, `ry`).
 *  - **hex** (vertex on top) — `baseOffsetX = r·√3/2`,
 *    `baseOffsetY = r/2 + gap/√3`.
 *
 * lil-gui wiring follows the field-resolver pattern: per-edge `data`
 * carries the host / side, the `shape` resolver reads `settings` from
 * the closure and recomputes the per-host offsets each render.
 */
export const Corners: Story = {
  render: () => createContainer({ id: 'graph-edge-loop-polyline-corners' }),

  play: async ({ canvasElement }) => {
    const RECT_W = 80, RECT_H = 50;
    const CIRC_R = 30;
    const ELL_RX = 45, ELL_RY = 25;
    const HEX_R  = 34;

    type Corner = 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
    type HostKind = 'rect' | 'circle' | 'ellipse' | 'hex';
    const CORNERS: ReadonlyArray<Corner> =
      ['top-right', 'bottom-right', 'bottom-left', 'top-left'];

    const offsetsFor = (host: HostKind, gap: number): { x: number; y: number } => {
      switch (host) {
        case 'rect':
          return { x: RECT_W / 2, y: RECT_H / 2 };
        case 'circle': {
          const xy = (gap + Math.sqrt(Math.max(0, 2 * CIRC_R * CIRC_R - gap * gap))) / 2;
          return { x: xy, y: xy };
        }
        case 'ellipse':
          return { x: ELL_RX, y: ELL_RY };
        case 'hex':
          return { x: HEX_R * Math.sqrt(3) / 2, y: HEX_R / 2 + gap / Math.sqrt(3) };
      }
    };

    const ELL_VERTS = Array.from({ length: 48 }, (_, i) => {
      const t = (i / 48) * Math.PI * 2;
      return { x: Math.cos(t) * ELL_RX, y: Math.sin(t) * ELL_RY };
    });

    const nodes: GraphNode[] = [
      { type: 'node', id: 'host-rect',    position: { x: -300, y: 0 },
        style: { shape: { kind: 'rect', width: RECT_W, height: RECT_H } } },
      { type: 'node', id: 'host-circle',  position: { x: -100, y: 0 },
        style: { shape: { kind: 'circle', radius: CIRC_R } } },
      { type: 'node', id: 'host-ellipse', position: { x:  100, y: 0 },
        style: { shape: { kind: 'polygon', vertices: ELL_VERTS } } },
      { type: 'node', id: 'host-hex',     position: { x:  300, y: 0 },
        style: { shape: { kind: 'regular-polygon', sides: 6, radius: HEX_R } } },
    ];

    interface EdgeMeta { host: HostKind; side: Corner; }
    const edges: GraphEdge<EdgeMeta>[] = [];
    const hostByNodeId: ReadonlyArray<{ id: string; host: HostKind }> = [
      { id: 'host-rect',    host: 'rect' },
      { id: 'host-circle',  host: 'circle' },
      { id: 'host-ellipse', host: 'ellipse' },
      { id: 'host-hex',     host: 'hex' },
    ];
    for (const h of hostByNodeId) {
      for (const side of CORNERS) {
        edges.push({ type: 'edge',
          id: `${h.id}-${side}`,
          source: h.id, target: h.id,
          data: { host: h.host, side },
        });
      }
    }

    const settings = { stubLength: 14, gap: 14 };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-loop-polyline-corners')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The edge `shape` resolver reads per-edge `data` for placement and
    // `settings` from the closure, so it stays in the constructor; the
    // literal node/edge style fields live in `canvasOptions`.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges },
        edge: {
          style: {
            shape: (edge) => {
              const meta = edge.data as EdgeMeta;
              const o = offsetsFor(meta.host, settings.gap);
              return {
                pathType: 'loop-polyline',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts: {
                  side: meta.side,
                  baseOffsetX: o.x,
                  baseOffsetY: o.y,
                  stubLength: settings.stubLength,
                  gap: settings.gap,
                },
              };
            },
          },
        },
      },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: { style: { bgFill: 0x4f7ff5, bgStrokeColor: 0x2563eb, bgStrokeWidth: 0 } },
          edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'triangle' } },
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

    const rerenderAll = (): void => {
      for (const edge of graph.store.edges()) {
        graph.store.updateEdge(edge.id, { style: edge.style });
      }
    };

    const gui = new GUI({ title: 'loop-polyline · corners' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'stubLength', 0, 60, 1).onChange(rerenderAll);
    gui.add(settings, 'gap', 0, 60, 1).onChange(rerenderAll);
  },
};
