import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Events/connector:pointer*' };
export default meta;
type Story = StoryObj;

export const ConnectorPointerStory: Story = {
  name: 'connector:pointer*',
  render: () => createContainer({ id: 'cvs-evt-connector-pointer' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-connector-pointer')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

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

    layer.renderer.events.on('connector:pointerover', action('connector:pointerover'));
    layer.renderer.events.on('connector:pointerout', action('connector:pointerout'));
    layer.renderer.events.on('connector:pointerdown', action('connector:pointerdown'));
    layer.renderer.events.on('connector:pointerup', action('connector:pointerup'));
    layer.renderer.events.on('connector:click', action('connector:click'));
    layer.renderer.events.on('connector:doubleclick', action('connector:doubleclick'));
    layer.renderer.events.on('connector:contextmenu', action('connector:contextmenu'));

    layer.renderer.addConnector('edge-1', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'normal',
      source: { kind: 'point', x: -120, y: 0 },
      target: { kind: 'point', x: 120, y: 0 },
      stroke: { color: 0x4f9cf9, width: 4 }
    });

    canvas.camera.fitContent(layer.getBounds(), 100);
  }
};
