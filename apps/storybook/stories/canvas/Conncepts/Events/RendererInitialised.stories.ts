import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Canvas } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Events/renderer:initialised' };
export default meta;
type Story = StoryObj;

export const RendererInitialised: Story = {
  render: () => createContainer({ id: 'cvs-evt-renderer-init' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-renderer-init')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.events.on('renderer:initialised', action('renderer:initialised'));
    await canvas.init({ container, autoResize: true });
  },
};
