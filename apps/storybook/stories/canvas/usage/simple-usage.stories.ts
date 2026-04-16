import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import { createContainer } from '../../../src/div-utils';

const meta: Meta = {
  title: 'Canvas/Usage/Simple Usage',
};

export default meta;
type Story = StoryObj;

/**
 * Simple canvas usage with two nodes
 */
export const SimpleUsage: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = createContainer({ height: "500px", id: 'canvas-example' });
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 500,
      behavior: 'full',
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);

    graphPlugin.setData({
      nodes: [
        { id: 'n1', x: -80, y: 0, label: 'Hello', shape: 'circle', size: 50 },
        { id: 'n2', x:  80, y: 0, label: 'World', shape: 'circle', size: 50 },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
      ],
    });
  },
};

