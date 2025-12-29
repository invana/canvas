import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasNodeData,
   CanvasOptions, NodeStates } from '@invana/canvas-core';
import { getFullHeightContainer } from '../../../../src/div-utils';

const meta: Meta = {
  title: 'Elements/Nodes/States',
};

export default meta;
type Story = StoryObj;

/**
 * Example showing custom states like loading, error, and warning
 */
export const CreateYourOwnStates: Story = {
  name: "Create your own states",
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-custom-states';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-custom-states');
    if (!container) return;

    const nodes: CanvasNodeData[] = [
      {
        id: 'default',
        x: 150,
        y: 150,
        label: 'Normal',
        shape: 'circle',
        states: ['default'],
      },
      {
        id: 'loading',
        x: 300,
        y: 150,
        label: 'Loading...',
        shape: 'circle',
        states: ['loading'],
      },
      {
        id: 'error',
        x: 450,
        y: 150,
        label: 'Error',
        shape: 'circle',
        states: ['error'],
      },
      {
        id: 'warning',
        x: 600,
        y: 150,
        label: 'Warning',
        shape: 'circle',
        states: ['warning'],
      },
    ];

    const options: CanvasOptions = {
      container,
      styles: {
        node: {
          fill: 0x1890ff,
          stroke: '#0050b3',
          strokeWidth: 2,
          states: {
            loading: {
              fill: 0x8c8c8c,
            },
            error: {
              fill: 0xff4d4f,
              stroke: '#cf1322',
              strokeWidth: 3,
            },
            warning: {
              fill: 0xfaad14,
              stroke: '#d48806',
              strokeWidth: 3,
            },
          },
        },
      },
      data: { nodes: nodes, edges: [] },
    };
    const canvas = new Canvas(options);
    await canvas.init();
 
  },
};

