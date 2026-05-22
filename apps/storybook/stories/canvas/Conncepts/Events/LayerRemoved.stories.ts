import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Canvas, LayersPanelLayer, WorldLayer } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Events/layer:removed' };
export default meta;
type Story = StoryObj;

export const LayerRemoved: Story = {
  render: () => createContainer({ id: 'cvs-evt-layer-removed' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-layer-removed')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('layer:removed', action('layer:removed'));
    await canvas.init({ container, autoResize: true });

    canvas.layers.add(
      new LayersPanelLayer({
        corner: 'top-left',
        enabled: true,
        fontSize: 11,
        opacity: 0.92,
        backgroundColor: 'rgba(10,10,10,0.82)',
        textColor: '#c8d3e0',
        accentColor: '#4fc3f7',
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

    const ids = ['demo-a', 'demo-b', 'demo-c'];
    for (const id of ids) canvas.layers.add(new EmptyLayer({ id, options: {} }));

    ids.forEach((id, i) => {
      setTimeout(() => canvas.layers.remove(id), 800 * (i + 1));
    });
  },
};
