import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, PinchZoomBehaviour } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Events/scene:behaviour:register' };
export default meta;
type Story = StoryObj;

export const BehaviourRegisteredStory: Story = {
  name: 'scene:behaviour:register',
  render: () => createContainer({ id: 'cvs-evt-behaviour-registered' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#cvs-evt-behaviour-registered',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('scene:behaviour:register', action('scene:behaviour:register'));
    await canvas.init({ container, autoResize: true });

    setTimeout(() => {
      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: false }));
    }, 300);
    setTimeout(() => {
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'wheel-zoom', enabled: false }));
    }, 800);
    setTimeout(() => {
      canvas.behaviours.register(new PinchZoomBehaviour({ id: 'pinch-zoom', enabled: false }));
    }, 1300);
  }
};
