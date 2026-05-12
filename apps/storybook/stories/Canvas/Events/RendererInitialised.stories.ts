import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
import { Canvas } from '@invana/canvas';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Events/renderer:initialised' };
export default meta;
type Story = StoryObj;

export const RendererInitialised: Story = {
  render: () => createContainer({ id: 'cvs-evt-renderer-init' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-evt-renderer-init')!;
    const canvas = new Canvas();
    canvas.events.on('renderer:initialised', action('renderer:initialised'));
    await canvas.init({ container, autoResize: true });
  },
};
