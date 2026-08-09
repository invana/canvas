import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DragPanBehaviour, WheelZoomBehaviour,
  LOOP_CURVE_PRESETS
} from '@invana/canvas';
import {
  DragNodeBehaviour, GraphCanvas, GraphLayer,
  type GraphEdge, type GraphNode
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/LoopCurve/Balloon' };
export default meta;
type Story = StoryObj;

/**
 * Graph-side counterpart to
 * `Canvas/Connectors/PathStyles/LoopCurve/Balloon`.
 *
 * `loop-curve` with the **balloon** preset — a fat, plump petal where
 * the control points splay wide past the feet (`bulge >> width/2`) and
 * the belly bulges past the tip (`bulge > radius`).
 *
 * Demonstrates the preset across four host shape kinds in a row —
 * `rect`, `circle`, `ellipse` (polygon approximation), and
 * `regular-polygon` (hexagon). Each host carries eight self-loops
 * (cardinals + diagonals), each pivot landing on the host's actual
 * silhouette via a per-kind silhouette function.
 *
 * lil-gui wiring follows the field-resolver pattern: per-edge `data`
 * carries the host / angle / pivot; the `shape` resolver reads
 * `settings` from the closure and rebuilds `pathStyleOpts` each render.
 */
export const Balloon: Story = {
  render: () => createContainer({ id: 'graph-edge-loop-curve-balloon' }),

  play: async ({ canvasElement }) => {
    const ANGLES: ReadonlyArray<{ id: string; angle: number }> = [
      { id: 'top',          angle: -Math.PI / 2 },
      { id: 'right',        angle:  0 },
      { id: 'bottom',       angle:  Math.PI / 2 },
      { id: 'left',         angle:  Math.PI },
      { id: 'top-right',    angle: -Math.PI / 4 },
      { id: 'bottom-right', angle:  Math.PI / 4 },
      { id: 'bottom-left',  angle:  3 * Math.PI / 4 },
      { id: 'top-left',     angle: -3 * Math.PI / 4 },
    ];

    const rectSilhouette = (w: number, h: number) => (theta: number) => {
      const ux = Math.cos(theta);
      const uy = Math.sin(theta);
      const tx = Math.abs(ux) > 1e-9 ? (w / 2) / Math.abs(ux) : Infinity;
      const ty = Math.abs(uy) > 1e-9 ? (h / 2) / Math.abs(uy) : Infinity;
      const t = Math.min(tx, ty);
      return { dx: ux * t, dy: uy * t };
    };
    const circleSilhouette = (r: number) => (theta: number) => ({
      dx: r * Math.cos(theta), dy: r * Math.sin(theta)
    });
    const ellipseSilhouette = (rx: number, ry: number) => (theta: number) => {
      const ux = Math.cos(theta);
      const uy = Math.sin(theta);
      const t = 1 / Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry));
      return { dx: ux * t, dy: uy * t };
    };
    const regularPolygonSilhouette = (n: number, r: number, rotationRad: number) => (theta: number) => {
      const a = r * Math.cos(Math.PI / n);
      const wedge = (2 * Math.PI) / n;
      const firstNormal = -Math.PI / 2 + Math.PI / n + rotationRad;
      const k = Math.round((theta - firstNormal) / wedge);
      const normal = firstNormal + k * wedge;
      const phi = theta - normal;
      const dist = a / Math.cos(phi);
      return { dx: dist * Math.cos(theta), dy: dist * Math.sin(theta) };
    };

    const RECT_W = 80, RECT_H = 30;
    const CIRC_R = 22;
    const ELL_RX = 38, ELL_RY = 22;
    const HEX_R  = 28;

    const ELL_VERTS = Array.from({ length: 48 }, (_, i) => {
      const t = (i / 48) * Math.PI * 2;
      return { x: Math.cos(t) * ELL_RX, y: Math.sin(t) * ELL_RY };
    });

    interface HostSpec {
      readonly id: string;
      readonly cx: number;
      readonly silhouette: (theta: number) => { dx: number; dy: number };
      readonly nodeStyle: GraphNode['style'];
    }
    const HOSTS: ReadonlyArray<HostSpec> = [
      { id: 'host-rect',    cx: -300, silhouette: rectSilhouette(RECT_W, RECT_H),
        nodeStyle: { shape: { kind: 'rect', width: RECT_W, height: RECT_H } } },
      { id: 'host-circle',  cx: -100, silhouette: circleSilhouette(CIRC_R),
        nodeStyle: { shape: { kind: 'circle', radius: CIRC_R } } },
      { id: 'host-ellipse', cx:  100, silhouette: ellipseSilhouette(ELL_RX, ELL_RY),
        nodeStyle: { shape: { kind: 'polygon', vertices: ELL_VERTS } } },
      { id: 'host-hex',     cx:  300, silhouette: regularPolygonSilhouette(6, HEX_R, 0),
        nodeStyle: { shape: { kind: 'regular-polygon', sides: 6, radius: HEX_R } } },
    ];

    const nodes: GraphNode[] = HOSTS.map(h => ({ type: 'node',
      id: h.id, position: { x: h.cx, y: 0 }, style: h.nodeStyle
    }));

    // The pivot is constant per (host, angle), so pre-compute and stash
    // it on the edge so the resolver doesn't recompute silhouettes
    // every render.
    interface EdgeMeta { angle: number; pivotDx: number; pivotDy: number; }
    const edges: GraphEdge<EdgeMeta>[] = [];
    for (const h of HOSTS) {
      for (const a of ANGLES) {
        const pivot = h.silhouette(a.angle);
        edges.push({ type: 'edge',
          id: `${h.id}-${a.id}`,
          source: h.id, target: h.id,
          data: { angle: a.angle, pivotDx: pivot.dx, pivotDy: pivot.dy }
        });
      }
    }

    const settings = { ...LOOP_CURVE_PRESETS.balloon };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-loop-curve-balloon')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The `shape` resolver reads `settings` from the closure each render,
    // so it stays in the constructor; the literal stroke / arrow style
    // moves to config.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges },
        edge: {
          style: {
            shape: (edge) => {
              const m = edge.data as EdgeMeta;
              return {
                pathType: 'loop-curve',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts: {
                  angle: m.angle,
                  baseOffset: settings.baseOffset,
                  radius: settings.radius,
                  width: settings.width,
                  bulge: settings.bulge,
                  pivotOffset: { dx: m.pivotDx, dy: m.pivotDy }
                }
              };
            }
          }
        }
      }
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: { style: { bgFill: 0x4f7ff5, bgStrokeColor: 0x2563eb, bgStrokeWidth: 0 } },
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: 1.5,
              arrowTargetShape: 'triangle'
            }
          }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const rerenderAll = (): void => {
      for (const edge of graph.store.edges()) {
        graph.store.updateEdge(edge.id, { style: edge.style });
      }
    };

    const gui = new GUI({ title: 'loop-curve · balloon' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'baseOffset', 0, 60, 1).onChange(rerenderAll);
    gui.add(settings, 'radius', 0, 80, 1).name('radius (length)').onChange(rerenderAll);
    gui.add(settings, 'width', 0, 60, 1).name('width (neck)').onChange(rerenderAll);
    gui.add(settings, 'bulge', 0, 80, 1).name('bulge (belly)').onChange(rerenderAll);
  }
};
