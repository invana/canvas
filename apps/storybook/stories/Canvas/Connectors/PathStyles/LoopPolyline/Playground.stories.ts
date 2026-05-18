import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Connectors/PathStyles/LoopPolyline/Playground' };
export default meta;
type Story = StoryObj;

/**
 * Single `loop-polyline` self-loop with every opt exposed via lil-gui.
 * Use this to interactively explore how `side`, `baseOffset`,
 * `baseOffsetX/Y`, `stubLength`, and `gap` interact across both
 * geometries — switch `side` between a cardinal and a corner value to
 * see the U-bracket / wrap dispatch flip live.
 *
 * Host is a rect; for non-rect hosts use the **Cardinals** / **Corners**
 * stories which dial in per-shape offsets across four host kinds.
 */
export const Playground: Story = {
  render: () => createContainer({ id: 'cvs-prim-loop-polyline-playground' }),

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
      '#cvs-prim-loop-polyline-playground',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'loop-polyline-playground', options: {} });
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
      side: 'top-right' as typeof sideOptions[number],
      baseOffset: 40,
      baseOffsetX: 40,
      baseOffsetY: 25,
      stubLength: 18,
      gap: 18,
      strokeColor: 0x111827,
      strokeWidth: 2,
      showArrow: true,
      markerLengthScale: 4,
      markerWidthScale: 3,
    };

    layer.renderer.addShape('host', {
      kind: 'rect', x: -40, y: -25, width: 80, height: 50,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 },
    });

    const draw = (): void => {
      if (layer.renderer.hasConnector('loop')) layer.renderer.removeConnector('loop');
      const isCorner = settings.side.includes('-');
      layer.renderer.addConnector('loop', {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'loop-polyline',
        pathStyleOpts: {
          side: settings.side,
          baseOffset: settings.baseOffset,
          ...(isCorner ? {
            baseOffsetX: settings.baseOffsetX,
            baseOffsetY: settings.baseOffsetY,
          } : {}),
          stubLength: settings.stubLength,
          gap: settings.gap,
        },
        source: { kind: 'shape', shapeId: 'host', anchor: 'center' },
        target: { kind: 'shape', shapeId: 'host', anchor: 'center' },
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

    draw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'loop-polyline · playground' });
    onStoryTeardown(() => gui.destroy());

    const geom = gui.addFolder('geometry');
    geom.add(settings, 'side', sideOptions as unknown as string[]).onChange(draw);
    geom.add(settings, 'baseOffset', 0, 120, 1).name('baseOffset (cardinal)').onChange(draw);
    geom.add(settings, 'baseOffsetX', 0, 120, 1).name('baseOffsetX (corner)').onChange(draw);
    geom.add(settings, 'baseOffsetY', 0, 120, 1).name('baseOffsetY (corner)').onChange(draw);
    geom.add(settings, 'stubLength', 0, 80, 1).onChange(draw);
    geom.add(settings, 'gap', 0, 80, 1).onChange(draw);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(draw);
    strokeFolder.add(settings, 'strokeWidth', 0.5, 10, 0.5).onChange(draw);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showArrow').onChange(draw);
    markerFolder.add(settings, 'markerLengthScale', 0, 12, 0.5).onChange(draw);
    markerFolder.add(settings, 'markerWidthScale', 0, 10, 0.5).onChange(draw);
  },
};
