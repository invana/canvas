import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Connectors/PathStyles/LoopPolyline/Overview' };
export default meta;
type Story = StoryObj;

/**
 * The `loop-polyline` pathStyle draws a self-loop as an orthogonal
 * polyline anchored at a single pivot point. Two geometries dispatch
 * on `side`:
 *
 *  - **Cardinal U-bracket** (`top` / `right` / `bottom` / `left`) —
 *    three segments. Feet on a chord perpendicular to `side`, stubs
 *    straight out along `side`, one cross segment.
 *  - **Corner wrap** (`top-right` / `bottom-right` / `bottom-left` /
 *    `top-left`) — four segments. Both feet land on the host
 *    silhouette (one on the horizontal edge, one on the vertical edge);
 *    perpendicular stubs out, cross past the corner, and a final stub
 *    drops back onto the vertical edge so the arrow marker is flush
 *    with the host.
 *
 * Two host shapes, both showing all eight placements:
 *  - **Left** — rect host. Cardinals use `baseOffset = max(halfW, halfH)`;
 *    corners use `baseOffsetX / baseOffsetY` set to the rect's half-extents
 *    so each wrap lands precisely on its named corner.
 *  - **Right** — circle host. Symmetric, so a single `baseOffset` clears
 *    every direction.
 *
 * Drag either node to confirm every loop tracks it.
 */
export const Overview: Story = {
  render: () => createContainer({ id: 'cvs-prim-pathstyle-loop-polyline-overview' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#cvs-prim-pathstyle-loop-polyline-overview',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'loop-polyline-overview', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer,
    }));

    const FILL = 0x4f7ff5;
    const LOOP_STROKE = 0x94a3b8;
    const LOOP_WIDTH = 1.5;

    const RECT_W = 80, RECT_H = 50;
    const RECT_HX = RECT_W / 2, RECT_HY = RECT_H / 2;
    const CIRC_R = 36;

    // Rect host on the left.
    layer.renderer.addShape('rect-host', {
      kind: 'rect', x: -260 - RECT_HX, y: -RECT_HY,
      width: RECT_W, height: RECT_H,
      fill: { kind: 'solid', color: FILL },
      stroke: { color: 0x2563eb, width: 0 },
    });
    // Circle host on the right.
    layer.renderer.addShape('circ-host', {
      kind: 'circle', x: 200, y: 0, radius: CIRC_R,
      fill: { kind: 'solid', color: FILL },
      stroke: { color: 0x2563eb, width: 0 },
    });

    const CARDINALS = ['top', 'right', 'bottom', 'left'] as const;
    const CORNERS = ['top-right', 'bottom-right', 'bottom-left', 'top-left'] as const;

    // Rect — cardinals use the rect's per-axis half-extent so feet clear
    // each edge; corners pin baseOffsetX/Y to the rect's half-extents.
    for (const side of CARDINALS) {
      const isVertical = side === 'top' || side === 'bottom';
      layer.renderer.addConnector(`rect-${side}`, {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'loop-polyline',
        pathStyleOpts: {
          side,
          baseOffset: isVertical ? RECT_HY : RECT_HX,
          stubLength: 18,
          gap: 22,
        },
        source: { kind: 'shape', shapeId: 'rect-host', anchor: 'center' },
        target: { kind: 'shape', shapeId: 'rect-host', anchor: 'center' },
        stroke: { color: LOOP_STROKE, width: LOOP_WIDTH },
        targetMarker: arrowMarkerSpec({ lengthScale: 5, widthScale: 4, fill: LOOP_STROKE }),
      });
    }
    for (const side of CORNERS) {
      layer.renderer.addConnector(`rect-${side}`, {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'loop-polyline',
        pathStyleOpts: {
          side,
          baseOffsetX: RECT_HX,
          baseOffsetY: RECT_HY,
          stubLength: 14,
          gap: 14,
        },
        source: { kind: 'shape', shapeId: 'rect-host', anchor: 'center' },
        target: { kind: 'shape', shapeId: 'rect-host', anchor: 'center' },
        stroke: { color: LOOP_STROKE, width: LOOP_WIDTH },
        targetMarker: arrowMarkerSpec({ lengthScale: 5, widthScale: 4, fill: LOOP_STROKE }),
      });
    }

    // Circle — cardinal feet at the silhouette point (gap/2, ±√(r² −
    // (gap/2)²)) so both endpoints touch the circle.
    const CIRC_GAP = 18;
    const CIRC_CARDINAL_BASE = Math.sqrt(CIRC_R * CIRC_R - (CIRC_GAP / 2) ** 2);
    for (const side of CARDINALS) {
      layer.renderer.addConnector(`circ-${side}`, {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'loop-polyline',
        pathStyleOpts: {
          side, baseOffset: CIRC_CARDINAL_BASE, stubLength: 16, gap: CIRC_GAP,
        },
        source: { kind: 'shape', shapeId: 'circ-host', anchor: 'center' },
        target: { kind: 'shape', shapeId: 'circ-host', anchor: 'center' },
        stroke: { color: LOOP_STROKE, width: LOOP_WIDTH },
        targetMarker: arrowMarkerSpec({ lengthScale: 5, widthScale: 4, fill: LOOP_STROKE }),
      });
    }
    const CORNER_GAP = 14;
    // Corner wrap on a circle: solve (x − gap)² + y² = r² and x² +
    // (y − gap)² = r²; symmetry gives x = y = (gap + √(2r² − gap²))/2.
    const CIRC_CORNER_BASE =
      (CORNER_GAP + Math.sqrt(2 * CIRC_R * CIRC_R - CORNER_GAP * CORNER_GAP)) / 2;
    for (const side of CORNERS) {
      layer.renderer.addConnector(`circ-${side}`, {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'loop-polyline',
        pathStyleOpts: {
          side,
          baseOffsetX: CIRC_CORNER_BASE,
          baseOffsetY: CIRC_CORNER_BASE,
          stubLength: 14,
          gap: CORNER_GAP,
        },
        source: { kind: 'shape', shapeId: 'circ-host', anchor: 'center' },
        target: { kind: 'shape', shapeId: 'circ-host', anchor: 'center' },
        stroke: { color: LOOP_STROKE, width: LOOP_WIDTH },
        targetMarker: arrowMarkerSpec({ lengthScale: 5, widthScale: 4, fill: LOOP_STROKE }),
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};
