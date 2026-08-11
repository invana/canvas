import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Canvas } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Events/canvas:renderer:ready' };
export default meta;
type Story = StoryObj;

export const RendererInitialisedStory: Story = {
  name: 'canvas:renderer:ready',
  render: () => createContainer({ id: 'cvs-evt-renderer-init' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-renderer-init')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('canvas:renderer:ready', action('canvas:renderer:ready'));
    await canvas.init({ container, autoResize: true });
  }
};
