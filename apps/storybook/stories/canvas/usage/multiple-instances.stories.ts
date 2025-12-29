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
export const MultipleInstances: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = createContainer({ height: "600px", id: 'big-container' });
    const container1 = createContainer({ height: "600px", width: "50%", id: 'canvas-example-1', title: "Canvas 1" });
    container.appendChild(container1);
    const container2 = createContainer({ height: "600px", width: "50%", id: 'canvas-example-2', title: "Canvas 2" });
    container.appendChild(container2);



    return container;
  },
  play: async () => {
    const container = document.getElementById('big-container');
    if (!container) return;
    
    const container1 = document.getElementById('canvas-example-1');
    const container2 = document.getElementById('canvas-example-2');
    if (!container1 || !container2) return;
    console.log('Containers found, initializing canvases');

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
      container:container1,
        behavior: "full",
      data: { nodes: nodes, edges: [] },
    };
    const canvas = new Canvas(options);
    await canvas.init();
 


    const nodes2: CanvasNodeData[] = [
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

    const options2: CanvasOptions = {
      container: container2,
      behavior: "full",
      data: { nodes: nodes2, edges: [] },
    };
    const canvas2 = new Canvas(options2);
    await canvas2.init();
 
  },
};

