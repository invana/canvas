import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Canvas, LayersPanelLayer, WorldLayer } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Events/scene:layer:add' };
export default meta;
type Story = StoryObj;

export const LayerAddedStory: Story = {
  name: 'scene:layer:add',
  render: () => createContainer({ id: 'cvs-evt-layer-added' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-layer-added')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('scene:layer:add', action('scene:layer:add'));
    await canvas.init({ container, autoResize: true });

    canvas.layers.add(
      new LayersPanelLayer({
        corner: 'top-left',
        enabled: true,
        fontSize: 11,
        opacity: 0.92,
        backgroundColor: 'rgba(10,10,10,0.82)',
        textColor: '#c8d3e0',
        accentColor: '#4fc3f7'
      }),
    );

    class EmptyLayer extends WorldLayer {
      protected createState() {
        return {};
      }
      hitTest() {
        return null;
      }
    }

    let counter = 0;
    const fire = () => {
      counter += 1;
      canvas.layers.add(new EmptyLayer({ id: `demo-${counter}`, options: {} }));
    };
    setTimeout(fire, 400);
    setTimeout(fire, 1200);
    setTimeout(fire, 2000);
  }
};
