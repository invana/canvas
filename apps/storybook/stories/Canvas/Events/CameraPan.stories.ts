import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import {
  Canvas,
  DragPanBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Canvas/Events/camera:pan' };
export default meta;
type Story = StoryObj;

export const CameraPan: Story = {
  render: () => createContainer({ id: 'cvs-evt-camera-pan' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-camera-pan')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('camera:pan', action('camera:pan'));
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));

    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() {
        return {};
      }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
        });
      }
      hitTest() {
        return null;
      }
    }

    const layer = new RenderLayer({ id: 'content', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('marker', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 50,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1d4ed8, width: 2 },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
