import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Connectors/StraightLineNoVertices' };
export default meta;
type Story = StoryObj;

export const StraightLineNoVertices: Story = {
  render: () => createContainer({ id: 'cvs-prim-straight-line-no-vertices' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-straight-line-no-vertices')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'straight-line-no-vertices', options: {} });
    canvas.layers.add(layer);

    const settings = {
      sourceX: -150,
      sourceY: 0,
      targetX: 150,
      targetY: 0,
      strokeColor: 0x111827,
      strokeWidth: 2,
      showSourceMarker: false,
      showTargetMarker: true,
    };

    const buildSpec = () => ({
      kind: 'connector' as const,
      router: 'straight',
      source: { kind: 'point' as const, x: settings.sourceX, y: settings.sourceY },
      target: { kind: 'point' as const, x: settings.targetX, y: settings.targetY },
      stroke: { color: settings.strokeColor, width: settings.strokeWidth },
      sourceMarker: settings.showSourceMarker
        ? arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: settings.strokeColor })
        : undefined,
      targetMarker: settings.showTargetMarker
        ? arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: settings.strokeColor })
        : undefined,
    });

    layer.renderer.addConnector('free', buildSpec());

    const redraw = () => layer.renderer.updateConnector('free', buildSpec());

    const gui = new GUI({ title: 'Connector (no vertices)' });
    gui.add(settings, 'sourceX', -400, 400, 1).onChange(redraw);
    gui.add(settings, 'sourceY', -300, 300, 1).onChange(redraw);
    gui.add(settings, 'targetX', -400, 400, 1).onChange(redraw);
    gui.add(settings, 'targetY', -300, 300, 1).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 10, 1).onChange(redraw);
    gui.add(settings, 'showSourceMarker').onChange(redraw);
    gui.add(settings, 'showTargetMarker').onChange(redraw);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
