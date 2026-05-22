import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Connectors/PathStyles/LoopPolyline/Cardinals' };
export default meta;
type Story = StoryObj;

/**
 * `loop-polyline` in **cardinal U-bracket** mode — `side` set to
 * `top`, `right`, `bottom`, or `left`. Three orthogonal segments:
 * stub out from the silhouette, cross perpendicular, stub back parallel.
 *
 * Shown across four host shape kinds in a row — `rect`, `circle`,
 * `ellipse` (polygon approximation), and `regular-polygon` (hexagon
 * with vertex on top). The U-bracket pathStyle itself is shape-agnostic
 * — it draws an orthogonal polyline given `(baseOffset, stubLength,
 * gap)`. For the **feet to land on the silhouette** (rather than
 * floating above it), each host needs `baseOffset` computed from its
 * own silhouette at the foot's lateral offset (`gap/2`):
 *
 *  - rect — `baseOffset = halfH` for top/bottom, `halfW` for left/right
 *    (silhouette is straight in the cardinal direction).
 *  - circle — `baseOffset = √(r² − (gap/2)²)` so the foot at
 *    `(±gap/2, ∓baseOffset)` sits on the circle.
 *  - ellipse — analogous: `ry · √(1 − (gap/(2·rx))²)` for top/bottom,
 *    swap rx/ry for left/right.
 *  - hex (vertex up) — top/bottom edges are V-shaped between vertex
 *    `(0, ±r)` and the side vertices at `(±r·√3/2, ±r/2)`; foot at
 *    `(g/2, −baseOffset)` on the top-right edge gives
 *    `baseOffset = r − g/(2·√3)`. The right/left silhouette has a
 *    vertical edge so `baseOffset = r·√3/2` regardless of gap.
 *
 * The lil-gui panel tweaks `stubLength` and `gap` live — `baseOffset`
 * recomputes per host + per side from the formulas above.
 */
export const Cardinals: Story = {
  render: () => createContainer({ id: 'cvs-prim-loop-polyline-cardinals' }),

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
      '#cvs-prim-loop-polyline-cardinals',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'loop-polyline-cardinals', options: {} });
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
    const CIRC_R = 30;
    const ELL_RX = 45, ELL_RY = 25;
    const HEX_R  = 34;

    type Side = 'top' | 'right' | 'bottom' | 'left';
    const CARDINALS: ReadonlyArray<Side> = ['top', 'right', 'bottom', 'left'];

    // baseOffset such that the foot at (±gap/2, ∓baseOffset) — or
    // (∓baseOffset, ±gap/2) for horizontal sides — lands on the host
    // silhouette. Each function returns the magnitude along the side
    // axis from the host centre.
    interface HostSpec {
      readonly id: string;
      readonly cx: number;
      readonly baseOffset: (side: Side, gap: number) => number;
    }

    const HOSTS: ReadonlyArray<HostSpec> = [
      { id: 'host-rect', cx: -300,
        baseOffset: side => side === 'top' || side === 'bottom' ? RECT_H / 2 : RECT_W / 2 },
      { id: 'host-circle', cx: -100,
        baseOffset: (_side, gap) => Math.sqrt(CIRC_R * CIRC_R - (gap / 2) * (gap / 2)) },
      { id: 'host-ellipse', cx: 100,
        baseOffset: (side, gap) => {
          const lateral = gap / 2;
          if (side === 'top' || side === 'bottom') {
            // foot at (±gap/2, ∓baseOffset): (lateral/rx)² + (baseOffset/ry)² = 1.
            return ELL_RY * Math.sqrt(Math.max(0, 1 - (lateral / ELL_RX) ** 2));
          }
          // foot at (∓baseOffset, ±gap/2): (baseOffset/rx)² + (lateral/ry)² = 1.
          return ELL_RX * Math.sqrt(Math.max(0, 1 - (lateral / ELL_RY) ** 2));
        } },
      { id: 'host-hex', cx: 300,
        baseOffset: (side, gap) => {
          // Default-rotation hex has vertices at -π/2, -π/6, π/6, π/2,
          // 5π/6, -5π/6. Top edge runs from (0, -r) to (r·√3/2, -r/2);
          // right edge is vertical at x = r·√3/2 between y = ±r/2.
          if (side === 'top' || side === 'bottom') {
            // Linear top-right edge: at x = gap/2, y = -r + gap/(2·√3).
            // (Symmetric for bottom-right, top-left, bottom-left.)
            return HEX_R - gap / (2 * Math.sqrt(3));
          }
          // Vertical right edge — baseOffset is constant as long as the
          // foot's |y| = gap/2 stays within ±r/2 (i.e. gap ≤ r).
          return HEX_R * Math.sqrt(3) / 2;
        } },
    ];

    layer.renderer.addShape('host-rect', {
      kind: 'rect', x: HOSTS[0]!.cx - RECT_W / 2, y: -RECT_H / 2,
      width: RECT_W, height: RECT_H,
      fill: { kind: 'solid', color: FILL }, stroke: { color: 0x2563eb, width: 0 },
    });
    layer.renderer.addShape('host-circle', {
      kind: 'circle', x: HOSTS[1]!.cx, y: 0, radius: CIRC_R,
      fill: { kind: 'solid', color: FILL }, stroke: { color: 0x2563eb, width: 0 },
    });
    layer.renderer.addShape('host-ellipse', {
      kind: 'polygon',
      x: HOSTS[2]!.cx, y: 0,
      vertices: Array.from({ length: 48 }, (_, i) => {
        const t = (i / 48) * Math.PI * 2;
        return { x: Math.cos(t) * ELL_RX, y: Math.sin(t) * ELL_RY };
      }),
      fill: { kind: 'solid', color: FILL }, stroke: { color: 0x2563eb, width: 0 },
    });
    layer.renderer.addShape('host-hex', {
      kind: 'regular-polygon',
      x: HOSTS[3]!.cx, y: 0, sides: 6, radius: HEX_R,
      fill: { kind: 'solid', color: FILL }, stroke: { color: 0x2563eb, width: 0 },
    });

    const settings = { stubLength: 18, gap: 22 };

    const drawLoops = (): void => {
      for (const host of HOSTS) {
        for (const side of CARDINALS) {
          const id = `${host.id}-${side}`;
          if (layer.renderer.hasConnector(id)) layer.renderer.removeConnector(id);
          layer.renderer.addConnector(id, {
            kind: 'connector',
            router: 'straight',
            pathStyle: 'loop-polyline',
            pathStyleOpts: {
              side,
              baseOffset: host.baseOffset(side, settings.gap),
              stubLength: settings.stubLength,
              gap: settings.gap,
            },
            source: { kind: 'shape', shapeId: host.id, anchor: 'center' },
            target: { kind: 'shape', shapeId: host.id, anchor: 'center' },
            stroke: { color: LOOP_STROKE, width: LOOP_WIDTH },
            targetMarker: arrowMarkerSpec({ lengthScale: 5, widthScale: 4, fill: LOOP_STROKE }),
          });
        }
      }
    };

    drawLoops();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'loop-polyline · cardinals' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'stubLength', 0, 60, 1).onChange(drawLoops);
    gui.add(settings, 'gap', 0, 60, 1).onChange(drawLoops);
  },
};
