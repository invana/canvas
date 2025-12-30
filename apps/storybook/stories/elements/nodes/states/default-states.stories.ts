import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, CanvasNode, CanvasOptions } from '@invana/canvas-core';
import { getFullHeightContainer } from '../../../../src/div-utils';
const meta: Meta = {
  title: 'Elements/Nodes/States',
};

export default meta;
type Story = StoryObj;

/**
 * Basic example showing default, active, and selected states
 */
export const DefaultStates: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-container';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const nodeStats = ["default", "active", "selected", "highlighted", "muted", "disabled"];
    const nodes: CanvasNode[] = nodeStats.map((state:string, index:number) => 
      ({
        id: `node-${state}`,
        x: 100 + (index % 4) * 200,
        y: 150 + Math.floor(index / 4) * 200,
        label: `${state}`,
        style: {
          labelPosition: 'bottom',
          labelOffsetY: 10,
          labelStyle: { fontSize: 14, fill: '#333' },
        },
        shape: 'circle',
        size: 20,
        states: [state],
      })
    );
    const options: CanvasOptions = {
      container,
      data: { nodes: nodes, edges: []}
    }
    const canvas = new Canvas(options);
    await canvas.init();
  },
};
