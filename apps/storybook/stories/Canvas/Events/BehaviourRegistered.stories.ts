import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, PinchZoomBehaviour } from '@invana/canvas';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Events/behaviour:registered' };
export default meta;
type Story = StoryObj;

export const BehaviourRegistered: Story = {
  render: () => createContainer({ id: 'cvs-evt-behaviour-registered' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#cvs-evt-behaviour-registered',
    )!;
    const canvas = new Canvas();
    canvas.events.on('behaviour:registered', action('behaviour:registered'));
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
  },
};
