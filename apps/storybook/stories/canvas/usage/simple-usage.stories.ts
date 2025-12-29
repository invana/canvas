import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasNodeData,
   CanvasOptions, NodeStates } from '@invana/canvas-core';
import { createContainer } from '../../../src/div-utils';

const meta: Meta = {
  title: 'Canvas/usage',
};

export default meta;
type Story = StoryObj;

/**
 * Example showing custom states like loading, error, and warning
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

    const nodes: CanvasNodeData[] = [
      {
        id: 'default',
        x: 150,
        y: 150,
        label: 'Hello',
        shape: 'circle',
        states: ['default'],
      },
          {
        id: 'default-1',
        x: 300,
        y: 150,
        label: 'World',
        shape: 'circle',
        states: ['default'],
      }

    ];

    const options: CanvasOptions = {
      container,
      data: { nodes: nodes, edges: [] },
    };
    const canvas = new Canvas(options);
    await canvas.init();
 
  },
};

