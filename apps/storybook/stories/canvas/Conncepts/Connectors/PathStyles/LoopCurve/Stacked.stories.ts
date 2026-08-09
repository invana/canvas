import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, arrowMarkerSpec,
  LOOP_CURVE_PRESETS,
  type IElementRenderer
} from '@invana/canvas';
import type { LoopCurvePresetName } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/PathStyles/LoopCurve/Stacked' };
export default meta;
type Story = StoryObj;

/**
 * `loop-curve` rendered as **multiple stacked loops on the same
 * placement** — the AntV G6 "nested loop" idiom. All loops share the
 * **same two foot points** on the host silhouette; only the petal's
 * length (`radius`) and belly (`bulge`) grow per ring, so successive
 * loops arch over the previous one from the same start / end without
 * the neck spreading.
 *
 * Why hold `baseOffset` + `width` constant: those two opts control
 * the *foot* placement (midpoint position + tangential separation).
 * Growing them would walk the feet across the silhouette and split
 * each loop's start / end apart from the rest. Growing only `radius`
 * + `bulge` keeps the feet pinned and just lifts the arch higher.
 *
 * Tweak `count` (loops in the stack), `placement` (which side /
 * corner), `radiusStep` (how much taller each successive ring is),
 * and `bulgeStep` (how much wider its belly is). The preset dropdown
 * picks the innermost profile from `LOOP_CURVE_PRESETS`; all rings
 * inherit its `baseOffset` and `width` so the feet stay fixed.
 */
export const Stacked: Story = {
  render: () => createContainer({ id: 'cvs-prim-loop-curve-stacked' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-loop-curve-stacked')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'loop-curve-stacked', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const LOOP_WIDTH = 1.5;
    const NODE_W = 80;
    const NODE_H = 30;
    const halfW = NODE_W / 2;
    const halfH = NODE_H / 2;

    layer.renderer.addShape('node', {
      kind: 'rect', x: -halfW, y: -halfH, width: NODE_W, height: NODE_H,
      fill: { kind: 'solid', color: 0x4f7ff5 },
      stroke: { color: 0x2563eb, width: 0 }
    });

    // Placement table — angle + silhouette pivot on the rect's edge /
    // corner. Same mapping used by the other LoopCurve stories.
    type Placement =
      | 'top' | 'right' | 'bottom' | 'left'
      | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
    const PLACEMENTS: Record<Placement, { angle: number; dx: number; dy: number }> = {
      'top':          { angle: -Math.PI / 2, dx:      0, dy: -halfH },
      'right':        { angle:  0,            dx:  halfW, dy:      0 },
      'bottom':       { angle:  Math.PI / 2, dx:      0, dy:  halfH },
      'left':         { angle:  Math.PI,      dx: -halfW, dy:      0 },
      'top-right':    { angle: -Math.PI / 4, dx:  halfW, dy: -halfH },
      'bottom-right': { angle:  Math.PI / 4, dx:  halfW, dy:  halfH },
      'bottom-left':  { angle:  3 * Math.PI / 4, dx: -halfW, dy:  halfH },
      'top-left':     { angle: -3 * Math.PI / 4, dx: -halfW, dy: -halfH }
    };

    // Per-loop stroke colours so successive rings read as distinct
    // edges (a real graph would let the edge data drive colour).
    const STACK_COLORS = [
      0x2563eb, 0x059669, 0xd97706, 0xdc2626, 0x7c3aed,
      0x0ea5e9, 0x65a30d, 0xea580c, 0xdb2777, 0x6366f1,
    ];

    const settings = {
      preset: 'balloon' as LoopCurvePresetName,
      placement: 'top' as Placement,
      count: 5,
      radiusStep: 22,
      bulgeStep: 14
    };

    const drawStack = (): void => {
      // Wipe any previous stack (allow up to MAX_COUNT slots).
      const MAX = 12;
      for (let i = 0; i < MAX; i++) {
        const id = `loop-${i}`;
        if (layer.renderer.hasConnector(id)) layer.renderer.removeConnector(id);
      }

      const place = PLACEMENTS[settings.placement];
      const base = LOOP_CURVE_PRESETS[settings.preset];

      for (let i = 0; i < settings.count; i++) {
        const id = `loop-${i}`;
        layer.renderer.addConnector(id, {
          kind: 'connector',
          router: 'straight',
          pathStyle: 'loop-curve',
          pathStyleOpts: {
            angle: place.angle,
            // Foot-fixing opts inherited from the preset and held
            // constant across the stack — every loop's two feet land
            // on the same two silhouette points.
            baseOffset: base.baseOffset,
            width:      base.width,
            pivotOffset: { dx: place.dx, dy: place.dy },
            // Only `radius` (length) and `bulge` (belly) grow per ring.
            // The result: same start/end, each loop arches further out.
            radius: base.radius + i * settings.radiusStep,
            bulge:  base.bulge  + i * settings.bulgeStep
          },
          source: { kind: 'shape', shapeId: 'node', anchor: 'center' },
          target: { kind: 'shape', shapeId: 'node', anchor: 'center' },
          stroke: { color: STACK_COLORS[i % STACK_COLORS.length]!, width: LOOP_WIDTH },
          targetMarker: arrowMarkerSpec({
            lengthScale: 5, widthScale: 4,
            fill: STACK_COLORS[i % STACK_COLORS.length]!
          })
        });
      }
    };

    drawStack();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'loop-curve · stacked' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'preset', Object.keys(LOOP_CURVE_PRESETS)).onChange(drawStack);
    gui.add(settings, 'placement', Object.keys(PLACEMENTS)).onChange(drawStack);
    gui.add(settings, 'count', 1, 10, 1).onChange(drawStack);
    gui.add(settings, 'radiusStep', 0, 60, 1).name('radiusStep (taller)').onChange(drawStack);
    gui.add(settings, 'bulgeStep',  0, 60, 1).name('bulgeStep (wider)').onChange(drawStack);
  }
};
