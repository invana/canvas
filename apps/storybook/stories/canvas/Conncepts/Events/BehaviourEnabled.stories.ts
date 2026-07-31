import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Canvas, DragPanBehaviour } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Events/scene:behaviour:enable' };
export default meta;
type Story = StoryObj;

export const BehaviourEnabledStory: Story = {
  name: 'scene:behaviour:enable',
  render: () => createContainer({ id: 'cvs-evt-behaviour-enabled' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-behaviour-enabled')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('scene:behaviour:enable', action('scene:behaviour:enable'));
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: false }));

    setTimeout(() => canvas.behaviours.setEnabled('pan', true), 500);
    setTimeout(() => canvas.behaviours.setEnabled('pan', false), 1200);
    setTimeout(() => canvas.behaviours.setEnabled('pan', true), 1900);
  },
};
