import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Connectors/StraightLine' };
export default meta;
type Story = StoryObj;

export const StraightLine: Story = {
  render: () => createContainer({ id: 'cvs-prim-straight-line' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-straight-line')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'straight-line', options: {} });
    canvas.layers.add(layer);

    // Two endpoint shapes
    layer.renderer.addShape('a', {
      kind: 'circle', x: -150, y: 0, radius: 28,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 },
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 150, y: 0, radius: 28,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 },
    });

    // Connector with straight router and target arrow marker
    layer.renderer.addConnector('a-to-b', {
      kind: 'connector',
      router: 'straight',
      source: { kind: 'shape', shapeId: 'a' },
      target: { kind: 'shape', shapeId: 'b' },
      stroke: { color: 0x111827, width: 2 },
      targetMarker: arrowMarkerSpec({ length: 12, width: 10, fill: 0x111827 }),
    });

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
