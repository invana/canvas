import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour, WorldLayer, LOOP_CURVE_PRESETS, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/PathStyles/LoopCurve/Hairpin' };
export default meta;
type Story = StoryObj;

/**
 * `loop-curve` with the **hairpin** preset — a parallel-sided "U"
 * where `bulge ≈ width/2`, so the cubic controls sit directly above
 * the feet and the sides run parallel instead of flaring outward.
 *
 * Demonstrates the preset across four host shape kinds in a row —
 * `rect`, `circle`, `ellipse`, `regular-polygon` (hexagon) — to show
 * that the preset is shape-agnostic. Each host carries eight loops
 * (cardinals + diagonals), each loop's pivot landing on the host's
 * actual silhouette (not the bounding box) via a per-kind silhouette
 * function. The lil-gui panel tweaks the four shape opts live across
 * every host.
 */
export const Hairpin: Story = {
  render: () => createContainer({ id: 'cvs-prim-loop-curve-hairpin' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-loop-curve-hairpin')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'loop-curve-hairpin', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const LOOP_STROKE = 0x94a3b8;
    const LOOP_WIDTH = 1.5;
    const FILL = 0x4f7ff5;

    // Eight bloom directions — four cardinals, four diagonals. Each is
    // both the ray along which the silhouette pivot is computed AND the
    // `angle` opt the petal blooms along.
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

    // Per-host-kind silhouette function: returns the point on the host's
    // boundary along the ray at `theta` from the host centre. Used to
    // place each loop's foot midpoint directly on the silhouette
    // (cardinals land on edge midpoints / surface points, diagonals land
    // on the corner / surface point in the diagonal direction).
    interface HostSpec {
      readonly id: string;
      readonly cx: number;
      readonly silhouette: (theta: number) => { dx: number; dy: number };
    }

    const rectSilhouette = (w: number, h: number) => (theta: number) => {
      const ux = Math.cos(theta);
      const uy = Math.sin(theta);
      // Clip the unit ray from origin to the AABB; min(|t_x|, |t_y|).
      const tx = Math.abs(ux) > 1e-9 ? (w / 2) / Math.abs(ux) : Infinity;
      const ty = Math.abs(uy) > 1e-9 ? (h / 2) / Math.abs(uy) : Infinity;
      const t = Math.min(tx, ty);
      return { dx: ux * t, dy: uy * t };
    };
    const circleSilhouette = (r: number) => (theta: number) => ({
      dx: r * Math.cos(theta),
      dy: r * Math.sin(theta)
    });
    const ellipseSilhouette = (rx: number, ry: number) => (theta: number) => {
      const ux = Math.cos(theta);
      const uy = Math.sin(theta);
      // Ray–ellipse intersection: ((t·ux)/rx)² + ((t·uy)/ry)² = 1.
      const t = 1 / Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry));
      return { dx: ux * t, dy: uy * t };
    };
    const regularPolygonSilhouette = (n: number, r: number, rotationRad: number) => (theta: number) => {
      // Distance from centre to the polygon's edge along `theta`.
      // Apothem a = r·cos(π/n). The edge nearest `theta` is the one
      // whose normal points at the closest vertex angle; within that
      // wedge the radial distance is a / cos(theta - normal_angle).
      const a = r * Math.cos(Math.PI / n);
      const wedge = (2 * Math.PI) / n;
      // Normal angles of the n edges (midpoints between successive
      // vertex angles, which start at `rotationRad - π/2`).
      // For a polygon whose top vertex points up, rotationRad = 0 means
      // vertex 0 at angle -π/2; edge 0's normal sits between vertex 0
      // and vertex 1 at -π/2 + π/n.
      const firstNormal = -Math.PI / 2 + Math.PI / n + rotationRad;
      // Snap `theta` to the nearest edge's normal.
      const k = Math.round((theta - firstNormal) / wedge);
      const normal = firstNormal + k * wedge;
      const phi = theta - normal;
      const dist = a / Math.cos(phi);
      return { dx: dist * Math.cos(theta), dy: dist * Math.sin(theta) };
    };

    // Four host shapes in a row at fixed centres.
    const RECT_W = 80, RECT_H = 30;
    const CIRC_R = 22;
    const ELL_RX = 38, ELL_RY = 22;
    const HEX_R  = 28;
    const HOSTS: ReadonlyArray<HostSpec> = [
      { id: 'host-rect',    cx: -300, silhouette: rectSilhouette(RECT_W, RECT_H) },
      { id: 'host-circle',  cx: -100, silhouette: circleSilhouette(CIRC_R) },
      { id: 'host-ellipse', cx:  100, silhouette: ellipseSilhouette(ELL_RX, ELL_RY) },
      { id: 'host-hex',     cx:  300, silhouette: regularPolygonSilhouette(6, HEX_R, 0) },
    ];

    // Add host primitives (centred on `cx`, y=0).
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
      // Engine has no built-in ellipse primitive — fake via polygon
      // approximation. 48 vertices keeps the silhouette smooth at this
      // demo scale.
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

    const settings = { ...LOOP_CURVE_PRESETS.hairpin };

    const drawLoops = (): void => {
      for (const host of HOSTS) {
        for (const a of ANGLES) {
          const id = `${host.id}-${a.id}`;
          if (layer.renderer.hasConnector(id)) layer.renderer.removeConnector(id);
          const pivot = host.silhouette(a.angle);
          layer.renderer.addConnector(id, {
            kind: 'connector',
            router: 'straight',
            pathStyle: 'loop-curve',
            pathStyleOpts: {
              angle: a.angle,
              baseOffset: settings.baseOffset,
              radius: settings.radius,
              width: settings.width,
              bulge: settings.bulge,
              pivotOffset: { dx: pivot.dx, dy: pivot.dy }
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

    const gui = new GUI({ title: 'loop-curve · hairpin' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'baseOffset', 0, 60, 1).onChange(drawLoops);
    gui.add(settings, 'radius', 0, 80, 1).name('radius (length)').onChange(drawLoops);
    gui.add(settings, 'width', 0, 60, 1).name('width (neck)').onChange(drawLoops);
    gui.add(settings, 'bulge', 0, 80, 1).name('bulge (belly)').onChange(drawLoops);
  }
};
