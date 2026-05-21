import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Canvas, DragPanBehaviour } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Canvas/Events/behaviour:enabled' };
export default meta;
type Story = StoryObj;

export const BehaviourEnabled: Story = {
  render: () => createContainer({ id: 'cvs-evt-behaviour-enabled' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-behaviour-enabled')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('behaviour:enabled', action('behaviour:enabled'));
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: false }));

    setTimeout(() => canvas.behaviours.setEnabled('pan', true), 500);
    setTimeout(() => canvas.behaviours.setEnabled('pan', false), 1200);
    setTimeout(() => canvas.behaviours.setEnabled('pan', true), 1900);
  },
};
