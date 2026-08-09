import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour, WorldLayer, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/PathStyles/LoopPolyline/Corners' };
export default meta;
type Story = StoryObj;

/**
 * `loop-polyline` in **corner wrap** mode — `side` set to `top-right`,
 * `bottom-right`, `bottom-left`, or `top-left`. Four orthogonal
 * segments wrapping the named corner of the host silhouette: one foot
 * on the horizontal edge → perpendicular stub out → cross past the
 * corner → perpendicular stub down past the vertical-edge level →
 * back into the vertical edge so the arrow marker lands flush with the
 * silhouette.
 *
 * The wrap is axis-aligned, so its feet only land cleanly on the host
 * when the host has axis-aligned edges. Per-host `baseOffsetX` /
 * `baseOffsetY` are tuned so both feet sit on (or just outside) the
 * silhouette and the arrow marker is visible:
 *
 *  - **rect** — `baseOffsetX = halfW`, `baseOffsetY = halfH`. Both
 *    feet land on the rect's straight edges.
 *  - **circle** — solve `(cornerX − gap)² + cornerY² = r²` and
 *    `cornerX² + (cornerY + gap)² = r²` simultaneously; symmetry gives
 *    `baseOffsetX = baseOffsetY = (gap + √(2r² − gap²)) / 2`. Both feet
 *    on the circle.
 *  - **ellipse** — falls back to AABB (`baseOffsetX = rx`,
 *    `baseOffsetY = ry`). Solving for exact silhouette-touching offsets
 *    here is a transcendental system; the AABB corner keeps both feet
 *    clearly outside the silhouette and the arrows visible.
 *  - **hex** (vertex on top) — `baseOffsetX = r·√3/2` so `foot_B` sits
 *    on the vertical right edge; the top-right slanted edge then
 *    constrains `baseOffsetY = r/2 + gap/√3` so `foot_A` lands on it.
 *
 * The lil-gui panel tweaks `stubLength` and `gap` live across every
 * host; `baseOffsetX/Y` recompute for the circle and hex on each
 * change.
 */
export const Corners: Story = {
  render: () => createContainer({ id: 'cvs-prim-loop-polyline-corners' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#cvs-prim-loop-polyline-corners',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'loop-polyline-corners', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const FILL = 0x4f7ff5;
    const LOOP_STROKE = 0x94a3b8;
    const LOOP_WIDTH = 1.5;

    const RECT_W = 80, RECT_H = 50;
    const CIRC_R = 30;
    const ELL_RX = 45, ELL_RY = 25;
    const HEX_R  = 34;

    interface HostSpec {
      readonly id: string;
      readonly cx: number;
      readonly offsets: (gap: number) => { x: number; y: number };
    }

    const HOSTS: ReadonlyArray<HostSpec> = [
      { id: 'host-rect', cx: -300,
        offsets: () => ({ x: RECT_W / 2, y: RECT_H / 2 }) },
      { id: 'host-circle', cx: -100,
        offsets: gap => {
          // Solve (x − gap)² + y² = r² and x² + (y − gap)² = r²
          // with symmetry x = y: 2x² − 2·gap·x + gap² − r² = 0.
          const r2 = CIRC_R * CIRC_R;
          const xy = (gap + Math.sqrt(Math.max(0, 2 * r2 - gap * gap))) / 2;
          return { x: xy, y: xy };
        } },
      { id: 'host-ellipse', cx: 100,
        // AABB — both feet sit clearly outside the silhouette so the
        // arrow stays visible. Tighter touching requires solving a
        // transcendental system on (rx, ry).
        offsets: () => ({ x: ELL_RX, y: ELL_RY }) },
      { id: 'host-hex', cx: 300,
        offsets: gap => ({
          // foot_B lands on the vertical right edge at x = r·√3/2;
          // foot_A on the top-right slanted edge then fixes baseOffsetY.
          x: HEX_R * Math.sqrt(3) / 2,
          y: HEX_R / 2 + gap / Math.sqrt(3)
        }) },
    ];

    layer.renderer.addShape('host-rect', {
      kind: 'rect', x: HOSTS[0]!.cx - RECT_W / 2, y: -RECT_H / 2,
      width: RECT_W, height: RECT_H,
      fill: { kind: 'solid', color: FILL }, stroke: { color: 0x2563eb, width: 0 }
    });
    layer.renderer.addShape('host-circle', {
      kind: 'circle', x: HOSTS[1]!.cx, y: 0, radius: CIRC_R,
      fill: { kind: 'solid', color: FILL }, stroke: { color: 0x2563eb, width: 0 }
    });
    layer.renderer.addShape('host-ellipse', {
      kind: 'polygon',
      x: HOSTS[2]!.cx, y: 0,
      vertices: Array.from({ length: 48 }, (_, i) => {
        const t = (i / 48) * Math.PI * 2;
        return { x: Math.cos(t) * ELL_RX, y: Math.sin(t) * ELL_RY };
      }),
      fill: { kind: 'solid', color: FILL }, stroke: { color: 0x2563eb, width: 0 }
    });
    layer.renderer.addShape('host-hex', {
      kind: 'regular-polygon',
      x: HOSTS[3]!.cx, y: 0, sides: 6, radius: HEX_R,
      fill: { kind: 'solid', color: FILL }, stroke: { color: 0x2563eb, width: 0 }
    });

    const CORNERS = ['top-right', 'bottom-right', 'bottom-left', 'top-left'] as const;

    const settings = { stubLength: 14, gap: 14 };

    const drawLoops = (): void => {
      for (const host of HOSTS) {
        const { x: offX, y: offY } = host.offsets(settings.gap);
        for (const side of CORNERS) {
          const id = `${host.id}-${side}`;
          if (layer.renderer.hasConnector(id)) layer.renderer.removeConnector(id);
          layer.renderer.addConnector(id, {
            kind: 'connector',
            router: 'straight',
            pathStyle: 'loop-polyline',
            pathStyleOpts: {
              side,
              baseOffsetX: offX,
              baseOffsetY: offY,
              stubLength: settings.stubLength,
              gap: settings.gap
            },
            source: { kind: 'shape', shapeId: host.id, anchor: 'center' },
            target: { kind: 'shape', shapeId: host.id, anchor: 'center' },
            stroke: { color: LOOP_STROKE, width: LOOP_WIDTH },
            targetMarker: arrowMarkerSpec({ lengthScale: 5, widthScale: 4, fill: LOOP_STROKE })
          });
        }
      }
    };

    drawLoops();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'loop-polyline · corners' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'stubLength', 0, 60, 1).onChange(drawLoops);
    gui.add(settings, 'gap', 0, 60, 1).onChange(drawLoops);
  }
};
