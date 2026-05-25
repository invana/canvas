import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Shapes/RectSolid' };
export default meta;
type Story = StoryObj;

export const RectSolid: Story = {
  render: () => createContainer({ id: 'cvs-prim-rect-solid' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-rect-solid')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'rect-solid', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('square', {
      kind: 'rect', x: -180, y: -40, width: 80, height: 80,
      fill: 0x4f9cf9,
    });

    layer.renderer.addShape('rounded', {
      kind: 'rect', x: -60, y: -40, width: 80, height: 80, cornerRadius: 12,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 },
    });

    layer.renderer.addShape('pill', {
      kind: 'rect', x: 60, y: -20, width: 120, height: 40, cornerRadius: 20,
      fill: { kind: 'solid', color: 0xfacc15 },
      stroke: { color: 0xb45309, width: 1.5 },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
