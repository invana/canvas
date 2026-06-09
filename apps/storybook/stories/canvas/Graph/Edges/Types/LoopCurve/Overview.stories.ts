import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DragPanBehaviour, WheelZoomBehaviour,
  LOOP_CURVE_PRESETS,
} from '@invana/canvas';
import type { LoopCurvePresetName } from '@invana/canvas';
import {
  GraphCanvas, DragNodeBehaviour, GraphLayer,
  type EdgeData, type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Types/LoopCurve/Overview' };
export default meta;
type Story = StoryObj;

/**
 * Graph-side counterpart to `Canvas/Connectors/PathStyles/LoopCurve/Overview`.
 *
 * `pathType: 'loop-curve'` in a `GraphLayer` self-loop draws a cubic
 * Bézier petal anchored at a single pivot point on the host node. Both
 * source and target reference the same node id, so the path style runs
 * in single-pivot mode and synthesises the two feet from `width` (no
 * `edge-port` anchor required).
 *
 * Three opts shape the petal:
 *
 *   - `radius` — petal length (tip past the feet, along `angle`).
 *   - `width`  — neck width (foot separation, perpendicular to `angle`).
 *   - `bulge`  — belly half-spread (control-point splay along the feet
 *                line). `bulge > width/2` → balloon; `bulge ≈ width/2`
 *                → parallel U; `bulge < width/2` → teardrop.
 *
 * Each loop lands at a specific point on the host via `pivotOffset` —
 * an arbitrary world-space shift of the pivot — and clears the
 * silhouette via `baseOffset` along `angle`.
 *
 * 2×2 grid of rect nodes, each carrying **eight loops** — four cardinals
 * (pivoted on edge midpoints) plus four diagonals (pivoted on the
 * corners). The four nodes use the four canonical
 * {@link LOOP_CURVE_PRESETS} so the preset library reads as a tableau:
 *
 *   Top-left      — **Balloon**:  fat plump belly (`bulge >> width/2`).
 *   Top-right     — **Teardrop**: slender pointed (`radius >> bulge`).
 *   Bottom-left   — **Ring**:     near-circular (`radius ≈ bulge`).
 *   Bottom-right  — **Hairpin**:  parallel-sided U (`bulge ≈ width/2`).
 *
 * Drag any node to confirm the loops track it.
 */
export const Overview: Story = {
  render: () => createContainer({ id: 'graph-edge-loop-curve-overview' }),

  play: async ({ canvasElement }) => {
    const NODE_W = 50;
    const NODE_H = 20;
    const halfW = NODE_W / 2;
    const halfH = NODE_H / 2;
    const COL_X = 110;
    const ROW_Y = 80;

    const UP    = -Math.PI / 2;
    const RIGHT = 0;
    const DOWN  =  Math.PI / 2;
    const LEFT  =  Math.PI;
    const UP_RIGHT   = -Math.PI / 4;
    const DOWN_RIGHT =  Math.PI / 4;
    const DOWN_LEFT  =  3 * Math.PI / 4;
    const UP_LEFT    = -3 * Math.PI / 4;

    // Eight placements: four cardinals on edge midpoints (pivotOffset
    // lands the foot midpoint on the edge centre), four diagonals on
    // corners. `angle` is the bloom direction; `baseOffset` is the only
    // outward clearance the preset contributes (kept tiny to keep feet
    // sitting on the silhouette).
    interface Placement {
      readonly id: string;
      readonly angle: number;
      readonly dx: number;
      readonly dy: number;
    }
    const PLACEMENTS: ReadonlyArray<Placement> = [
      { id: 'top',          angle: UP,         dx:      0, dy: -halfH },
      { id: 'right',        angle: RIGHT,      dx:  halfW, dy:      0 },
      { id: 'bottom',       angle: DOWN,       dx:      0, dy:  halfH },
      { id: 'left',         angle: LEFT,       dx: -halfW, dy:      0 },
      { id: 'top-right',    angle: UP_RIGHT,   dx:  halfW, dy: -halfH },
      { id: 'bottom-right', angle: DOWN_RIGHT, dx:  halfW, dy:  halfH },
      { id: 'bottom-left',  angle: DOWN_LEFT,  dx: -halfW, dy:  halfH },
      { id: 'top-left',     angle: UP_LEFT,    dx: -halfW, dy: -halfH },
    ];

    interface NodeSpec {
      readonly id: string;
      readonly cx: number;
      readonly cy: number;
      readonly preset: LoopCurvePresetName;
    }
    const NODE_SPECS: ReadonlyArray<NodeSpec> = [
      { id: 'node-balloon',  cx: -COL_X, cy: -ROW_Y, preset: 'balloon'  },
      { id: 'node-teardrop', cx:  COL_X, cy: -ROW_Y, preset: 'teardrop' },
      { id: 'node-ring',     cx: -COL_X, cy:  ROW_Y, preset: 'ring'     },
      { id: 'node-hairpin',  cx:  COL_X, cy:  ROW_Y, preset: 'hairpin'  },
    ];

    const nodes: NodeData[] = NODE_SPECS.map(spec => ({
      id: spec.id,
      position: { x: spec.cx, y: spec.cy },
      style: { labelText: spec.preset, labelPlacement: 'bottom' },
    }));

    const edges: EdgeData[] = [];
    for (const spec of NODE_SPECS) {
      const preset = LOOP_CURVE_PRESETS[spec.preset];
      for (const p of PLACEMENTS) {
        edges.push({
          id: `${spec.id}-${p.id}`,
          source: spec.id,
          target: spec.id,
          style: {
            shape: {
              pathType: 'loop-curve',
              sourceAnchor: 'center',
              targetAnchor: 'center',
              pathStyleOpts: {
                ...preset,
                angle: p.angle,
                pivotOffset: { dx: p.dx, dy: p.dy },
              },
            },
          },
        });
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-loop-curve-overview')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges } },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'rect', width: NODE_W, height: NODE_H },
              bgFill: 0x4f7ff5,
              bgStrokeColor: 0x2563eb,
              bgStrokeWidth: 0,
              labelFontSize: 11,
              labelFontWeight: 600,
              labelColor: 0x0f172a,
              labelOffsetY: 6,
            },
          },
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: 1.5,
              arrowTargetShape: 'triangle',
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
  },
};
