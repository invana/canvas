import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas, DragNodeBehaviour, GraphLayer,
  type GraphEdge, type GraphNode,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/LoopPolyline/Cardinals' };
export default meta;
type Story = StoryObj;

/**
 * Graph-side counterpart to
 * `Canvas/Connectors/PathStyles/LoopPolyline/Cardinals`.
 *
 * `loop-polyline` in **cardinal U-bracket** mode — `side` set to
 * `top`, `right`, `bottom`, or `left`. Three orthogonal segments:
 * stub out from the silhouette, cross perpendicular, stub back parallel.
 *
 * Shown across four host shape kinds — `rect`, `circle`, `ellipse`
 * (polygon approximation), and `regular-polygon` (hexagon). The
 * U-bracket pathStyle itself is shape-agnostic — it draws an orthogonal
 * polyline given `(baseOffset, stubLength, gap)`. For the **feet to
 * land on the silhouette**, each host needs `baseOffset` computed from
 * its own silhouette at the foot's lateral offset (`gap/2`):
 *
 *  - rect — `baseOffset = halfH` for top/bottom, `halfW` for left/right.
 *  - circle — `baseOffset = √(r² − (gap/2)²)`.
 *  - ellipse — `ry · √(1 − (gap/(2·rx))²)` for top/bottom; swap for L/R.
 *  - hex (vertex up) — top/bottom slanted edge gives `r − g/(2·√3)`;
 *    left/right is vertical at `r·√3/2`.
 *
 * lil-gui wiring follows the field-resolver pattern: per-edge `data`
 * carries the host/side; the layer-level `shape` resolver reads
 * `settings` from the closure and recomputes `baseOffset` per host on
 * each render. `rerenderAll()` triggers re-resolution.
 */
export const Cardinals: Story = {
  render: () => createContainer({ id: 'graph-edge-loop-polyline-cardinals' }),

  play: async ({ canvasElement }) => {
    const RECT_W = 80, RECT_H = 50;
    const CIRC_R = 30;
    const ELL_RX = 45, ELL_RY = 25;
    const HEX_R  = 34;

    type Side = 'top' | 'right' | 'bottom' | 'left';
    type HostKind = 'rect' | 'circle' | 'ellipse' | 'hex';
    const CARDINALS: ReadonlyArray<Side> = ['top', 'right', 'bottom', 'left'];

    // Per-host silhouette → baseOffset. Pure functions, closed over the
    // local size constants. Called by the resolver each render.
    const baseOffsetFor = (host: HostKind, side: Side, gap: number): number => {
      const lateral = gap / 2;
      switch (host) {
        case 'rect':
          return (side === 'top' || side === 'bottom') ? RECT_H / 2 : RECT_W / 2;
        case 'circle':
          return Math.sqrt(CIRC_R * CIRC_R - lateral * lateral);
        case 'ellipse':
          return (side === 'top' || side === 'bottom')
            ? ELL_RY * Math.sqrt(Math.max(0, 1 - (lateral / ELL_RX) ** 2))
            : ELL_RX * Math.sqrt(Math.max(0, 1 - (lateral / ELL_RY) ** 2));
        case 'hex':
          return (side === 'top' || side === 'bottom')
            ? HEX_R - gap / (2 * Math.sqrt(3))
            : HEX_R * Math.sqrt(3) / 2;
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

    // Per-edge meta drives the resolver. `host` selects the silhouette
    // function; `side` is the U-bracket placement.
    interface EdgeMeta { host: HostKind; side: Side; }
    const edges: GraphEdge<EdgeMeta>[] = [];
    const hostByNodeId: ReadonlyArray<{ id: string; host: HostKind }> = [
      { id: 'host-rect',    host: 'rect' },
      { id: 'host-circle',  host: 'circle' },
      { id: 'host-ellipse', host: 'ellipse' },
      { id: 'host-hex',     host: 'hex' },
    ];
    for (const h of hostByNodeId) {
      for (const side of CARDINALS) {
        edges.push({ type: 'edge',
          id: `${h.id}-${side}`,
          source: h.id, target: h.id,
          data: { host: h.host, side },
        });
      }
    }

    const settings = { stubLength: 18, gap: 22 };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-loop-polyline-cardinals')!;
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
            // Field resolver — reads per-edge `data` for placement and
            // `settings` from the closure for the live-tweakable opts.
            shape: (edge) => {
              const meta = edge.data as EdgeMeta;
              return {
                pathType: 'loop-polyline',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts: {
                  side: meta.side,
                  baseOffset: baseOffsetFor(meta.host, meta.side, settings.gap),
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

    const gui = new GUI({ title: 'loop-polyline · cardinals' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'stubLength', 0, 60, 1).onChange(rerenderAll);
    gui.add(settings, 'gap', 0, 60, 1).onChange(rerenderAll);
  },
};
