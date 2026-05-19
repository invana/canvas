import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
import {
  Canvas,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Canvas/Events/camera:zoom' };
export default meta;
type Story = StoryObj;

export const CameraZoom: Story = {
  render: () => createContainer({ id: 'cvs-evt-camera-zoom' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-camera-zoom')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('camera:zoom', action('camera:zoom'));
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'wheel-zoom', enabled: true }));
    canvas.behaviours.register(new PinchZoomBehaviour({ id: 'pinch-zoom', enabled: true }));

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
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
