import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Canvas, DragPanBehaviour } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Events/scene:behaviour:disable' };
export default meta;
type Story = StoryObj;

export const BehaviourDisabledStory: Story = {
  name: 'scene:behaviour:disable',
  render: () => createContainer({ id: 'cvs-evt-behaviour-disabled' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-behaviour-disabled')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('scene:behaviour:disable', action('scene:behaviour:disable'));
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));

    setTimeout(() => canvas.behaviours.setEnabled('pan', false), 500);
    setTimeout(() => canvas.behaviours.setEnabled('pan', true), 1200);
    setTimeout(() => canvas.behaviours.setEnabled('pan', false), 1900);
  },
};
