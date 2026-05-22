import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Concepts/Shapes/CircleSolid' };
export default meta;
type Story = StoryObj;

export const CircleSolid: Story = {
  render: () => createContainer({ id: 'cvs-prim-circle-solid' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-circle-solid')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'circle-solid', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('hex-shorthand', {
      kind: 'circle', x: -120, y: 0, radius: 40,
      fill: 0x4f9cf9,
    });

    layer.renderer.addShape('solid-object', {
      kind: 'circle', x: 0, y: 0, radius: 40,
      fill: { kind: 'solid', color: 0x10b981, alpha: 0.95 },
      stroke: { color: 0x047857, width: 2 },
    });

    layer.renderer.addShape('thick-border', {
      kind: 'circle', x: 120, y: 0, radius: 40,
      fill: { kind: 'solid', color: 0xfacc15 },
      stroke: { color: 0xb45309, width: 6, alignment: 'inside' },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
