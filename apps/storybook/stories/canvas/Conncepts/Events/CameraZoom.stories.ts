import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import {
  Canvas,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Events/input:camera:zoom' };
export default meta;
type Story = StoryObj;

export const CameraZoomStory: Story = {
  name: 'input:camera:zoom',
  render: () => createContainer({ id: 'cvs-evt-camera-zoom' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-camera-zoom')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('input:camera:zoom', action('input:camera:zoom'));
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'wheel-zoom', enabled: true }));
    canvas.behaviours.register(new PinchZoomBehaviour({ id: 'pinch-zoom', enabled: true }));

    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() {
        return {};
      }
      protected onMount() {
        this.renderer = this.surface.primitives;
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
      stroke: { color: 0x047857, width: 2 }
    });

    canvas.camera.fitContent(layer.getBounds(), 100);
  }
};
