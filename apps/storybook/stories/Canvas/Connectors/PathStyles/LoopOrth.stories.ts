import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Connectors/PathStyles/LoopOrth' };
export default meta;
type Story = StoryObj;

/**
 * The `loop-orth` pathStyle draws a self-loop as a rectangular
 * stub-out-across-stub-back bracket anchored at the host shape. Used when
 * source and target reference the same shape; mirrors `loop-curve` but
 * with sharp corners instead of a single Bézier.
 *
 * `side` accepts the eight compass cardinals (`top`, `top-right`, `right`,
 * `bottom-right`, `bottom`, `bottom-left`, `left`, `top-left`) or any
 * radian angle.
 *
 * Two demos:
 *  - Single bracket on the left node with lil-gui knobs. `baseOffset`
 *    pushes the bracket's feet outward from the pivot so they clear the
 *    silhouette — set it ≥ the host's half-extent in the loop direction
 *    or the arrow marker will be hidden by the shape fill.
 *  - Eight-way fan on the right node: one bracket per cardinal, each
 *    rendered in a distinct colour. Uses a circle so all eight directions
 *    have the same clearance — for a rectangle, you'd vary `baseOffset`
 *    per side.
 */
export const LoopOrth: Story = {
  render: () => createContainer({ id: 'cvs-prim-pathstyle-loop-orth' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-pathstyle-loop-orth')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'pathstyle-loop-orth', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer,
    }));

    const sideOptions = [
      'top', 'top-right', 'right', 'bottom-right',
      'bottom', 'bottom-left', 'left', 'top-left',
    ] as const;

    const settings = {
      side: 'top' as typeof sideOptions[number],
      baseOffset: 32,
      stubLength: 30,
      gap: 30,
      strokeColor: 0x111827,
      strokeWidth: 2,
      showArrow: true,
      markerLengthScale: 4,
      markerWidthScale: 3,
    };

    // Rect node — orthogonal stubs read cleanly off a flat silhouette.
    // `baseOffset` is tuned to clear the long axis (half-width = 40);
    // try switching `side` to `top` (half-height = 25) and you can drop
    // `baseOffset` further if you want the bracket closer.
    layer.renderer.addShape('solo', {
      kind: 'rect', x: -220, y: -25, width: 80, height: 50,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 },
    });
    // Circle node for the 8-way fan — uniform 30px radius means a single
    // `baseOffset` value clears the silhouette in every direction.
    layer.renderer.addShape('fan', {
      kind: 'circle', x: 180, y: 0, radius: 30,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 },
    });

    const drawSolo = (): void => {
      if (layer.renderer.hasConnector('solo-loop')) layer.renderer.removeConnector('solo-loop');
      layer.renderer.addConnector('solo-loop', {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'loop-orth',
        pathStyleOpts: {
          side: settings.side,
          baseOffset: settings.baseOffset,
          stubLength: settings.stubLength,
          gap: settings.gap,
        },
        source: { kind: 'shape', shapeId: 'solo', anchor: 'center' },
        target: { kind: 'shape', shapeId: 'solo', anchor: 'center' },
        stroke: { color: settings.strokeColor, width: settings.strokeWidth, join: 'miter' },
        targetMarker: settings.showArrow
          ? arrowMarkerSpec({
              lengthScale: settings.markerLengthScale,
              widthScale: settings.markerWidthScale,
              fill: settings.strokeColor,
            })
          : undefined,
      });
    };

    // Static eight-way fan on the right node. One connector per cardinal,
    // each rendered in a distinct colour so the corner directions read
    // at a glance.
    const fanStubs: ReadonlyArray<{
      id: string;
      side: typeof sideOptions[number];
      color: number;
    }> = [
      { id: 'fan-top',          side: 'top',          color: 0xb45309 },
      { id: 'fan-top-right',    side: 'top-right',    color: 0xea580c },
      { id: 'fan-right',        side: 'right',        color: 0x047857 },
      { id: 'fan-bottom-right', side: 'bottom-right', color: 0x0d9488 },
      { id: 'fan-bottom',       side: 'bottom',       color: 0x6d28d9 },
      { id: 'fan-bottom-left',  side: 'bottom-left',  color: 0x7c3aed },
      { id: 'fan-left',         side: 'left',         color: 0xbe123c },
      { id: 'fan-top-left',     side: 'top-left',     color: 0xdb2777 },
    ];
    for (const stub of fanStubs) {
      layer.renderer.addConnector(stub.id, {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'loop-orth',
        pathStyleOpts: { side: stub.side, baseOffset: 34, stubLength: 26, gap: 22 },
        source: { kind: 'shape', shapeId: 'fan', anchor: 'center' },
        target: { kind: 'shape', shapeId: 'fan', anchor: 'center' },
        stroke: { color: stub.color, width: 2, join: 'miter' },
        targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: stub.color }),
      });
    }

    drawSolo();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'loop-orth pathStyle' });
    onStoryTeardown(() => gui.destroy());

    const f = gui.addFolder('bracket (left node)');
    f.add(settings, 'side', sideOptions as unknown as string[]).onChange(drawSolo);
    f.add(settings, 'baseOffset', 0, 120, 1).name('baseOffset').onChange(drawSolo);
    f.add(settings, 'stubLength', 0, 200, 1).onChange(drawSolo);
    f.add(settings, 'gap', 0, 120, 1).onChange(drawSolo);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(drawSolo);
    strokeFolder.add(settings, 'strokeWidth', 0.5, 10, 0.5).onChange(drawSolo);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showArrow').onChange(drawSolo);
    markerFolder.add(settings, 'markerLengthScale', 0, 12, 0.5).onChange(drawSolo);
    markerFolder.add(settings, 'markerWidthScale', 0, 10, 0.5).onChange(drawSolo);
  },
};
