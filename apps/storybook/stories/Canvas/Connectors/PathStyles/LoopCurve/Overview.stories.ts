import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
  LOOP_CURVE_PRESETS,
} from '@invana/canvas';
import type { CanvasContext, LoopCurvePresetName } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Connectors/PathStyles/LoopCurve/Overview' };
export default meta;
type Story = StoryObj;

/**
 * The `loop-curve` pathStyle draws a self-loop as a single cubic Bézier
 * "petal / balloon / teardrop" anchored at a single pivot point. Three
 * opts control the petal profile:
 *
 *   - `radius` — petal length (tip past the feet, along `angle`).
 *   - `width`  — neck width (foot separation, perpendicular to `angle`).
 *   - `bulge`  — belly half-spread (control-point splay along the feet
 *                line). `bulge > width/2` → balloon; `bulge ≈ width/2`
 *                → parallel U; `bulge < width/2` → teardrop.
 *
 * Each loop lands at a specific point on the host via `pivotOffset` —
 * an arbitrary world-space shift of the pivot — and clears the
 * silhouette via `baseOffset` along `angle`. Both source and target
 * resolve to the shape's centre, so the path style runs in single-pivot
 * mode and synthesises the two feet from `width` (no `edge-port`
 * anchor required).
 *
 * Each rect in the 2×2 grid carries **eight loops** — four cardinals
 * (pivoted on edge midpoints, blooming perpendicular to the edge) plus
 * four diagonals (pivoted on the corners, blooming along the outward
 * 45° ray).
 *
 * Preset legend:
 *   Top-left      — **Balloon**:  fat plump belly (`bulge >> width/2`).
 *   Top-right     — **Teardrop**: slender pointed (`radius >> bulge`).
 *   Bottom-left   — **Ring**:     near-circular (`radius ≈ bulge`).
 *   Bottom-right  — **Hairpin**:  parallel-sided U (`bulge ≈ width/2`).
 *
 * Drag any node to confirm the loops track it.
 */
export const Overview: Story = {
  render: () => createContainer({ id: 'cvs-prim-pathstyle-loop-curve' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-pathstyle-loop-curve')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'pathstyle-loop-curve', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer,
    }));

    const LOOP_STROKE = 0x94a3b8;
    const LOOP_WIDTH = 1.5;

    // Host rect dimensions.
    const NODE_W = 50;
    const NODE_H = 20;
    const halfW = NODE_W / 2;
    const halfH = NODE_H / 2;
    // 2×2 grid spacing — tight enough that the per-preset loop fans
    // read as a single tableau, loose enough that no loop bleeds into
    // a neighbouring node (max outward extent ≈ baseOffset +
    // 0.75·radius of the longest preset).
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

    // Eight placements: four cardinals on edge midpoints, four
    // diagonals on corners. `pivotOffset` lands the foot midpoint on
    // the named silhouette point; `angle` blooms outward; `baseOffset`
    // adds a tiny clearance so the feet sit just past the silhouette.
    interface Placement {
      readonly id: string;
      readonly angle: number;
      readonly dx: number;
      readonly dy: number;
    }
    const PLACEMENTS: ReadonlyArray<Placement> = [
      // Cardinals — pivot on edge midpoint, bloom perpendicular to edge.
      { id: 'top',          angle: UP,         dx:      0, dy: -halfH },
      { id: 'right',        angle: RIGHT,      dx:  halfW, dy:      0 },
      { id: 'bottom',       angle: DOWN,       dx:      0, dy:  halfH },
      { id: 'left',         angle: LEFT,       dx: -halfW, dy:      0 },
      // Diagonals — pivot on corner, bloom along 45° outward ray.
      { id: 'top-right',    angle: UP_RIGHT,   dx:  halfW, dy: -halfH },
      { id: 'bottom-right', angle: DOWN_RIGHT, dx:  halfW, dy:  halfH },
      { id: 'bottom-left',  angle: DOWN_LEFT,  dx: -halfW, dy:  halfH },
      { id: 'top-left',     angle: UP_LEFT,    dx: -halfW, dy: -halfH },
    ];

    // Each node uses one of the named `LOOP_CURVE_PRESETS` from
    // `@invana/canvas`. The preset carries baseOffset/radius/width/
    // bulge; the placement (`angle`, `pivotOffset`) is filled in per
    // connector below.
    const NODES: ReadonlyArray<{ id: string; cx: number; cy: number; preset: LoopCurvePresetName }> = [
      { id: 'node-balloon',  cx: -COL_X, cy: -ROW_Y, preset: 'balloon'  },
      { id: 'node-teardrop', cx:  COL_X, cy: -ROW_Y, preset: 'teardrop' },
      { id: 'node-ring',     cx: -COL_X, cy:  ROW_Y, preset: 'ring'     },
      { id: 'node-hairpin',  cx:  COL_X, cy:  ROW_Y, preset: 'hairpin'  },
    ];

    for (const node of NODES) {
      layer.renderer.addShape(node.id, {
        kind: 'rect',
        x: node.cx - halfW,
        y: node.cy - halfH,
        width: NODE_W,
        height: NODE_H,
        fill: { kind: 'solid', color: 0x4f7ff5 },
        stroke: { color: 0x2563eb, width: 0 },
      });

      const preset = LOOP_CURVE_PRESETS[node.preset];
      for (const placement of PLACEMENTS) {
        layer.renderer.addConnector(`${node.id}-${placement.id}`, {
          kind: 'connector',
          router: 'straight',
          pathStyle: 'loop-curve',
          pathStyleOpts: {
            ...preset,
            angle: placement.angle,
            pivotOffset: { dx: placement.dx, dy: placement.dy },
          },
          source: { kind: 'shape', shapeId: node.id, anchor: 'center' },
          target: { kind: 'shape', shapeId: node.id, anchor: 'center' },
          stroke: { color: LOOP_STROKE, width: LOOP_WIDTH },
          targetMarker: arrowMarkerSpec({
            lengthScale: 5,
            widthScale: 4,
            fill: LOOP_STROKE,
          }),
        });
      }
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};
