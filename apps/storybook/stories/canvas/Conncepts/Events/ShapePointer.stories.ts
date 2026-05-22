import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Events/shape:pointer*' };
export default meta;
type Story = StoryObj;

export const ShapePointer: Story = {
  render: () => createContainer({ id: 'cvs-evt-shape-pointer' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-shape-pointer')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

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

    layer.renderer.events.on('shape:pointerover', action('shape:pointerover'));
    layer.renderer.events.on('shape:pointerout', action('shape:pointerout'));
    layer.renderer.events.on('shape:pointerdown', action('shape:pointerdown'));
    layer.renderer.events.on('shape:pointerup', action('shape:pointerup'));
    layer.renderer.events.on('shape:click', action('shape:click'));
    layer.renderer.events.on('shape:doubleclick', action('shape:doubleclick'));
    layer.renderer.events.on('shape:contextmenu', action('shape:contextmenu'));

    layer.renderer.addShape('circle-1', {
      kind: 'circle',
      x: -80,
      y: 0,
      radius: 50,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1d4ed8, width: 2 },
    });
    layer.renderer.addShape('rect-1', {
      kind: 'rect',
      x: 80,
      y: -40,
      width: 100,
      height: 80,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
