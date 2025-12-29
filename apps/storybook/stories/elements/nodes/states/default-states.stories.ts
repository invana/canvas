import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, CanvasNodeData, CanvasOptions } from '@aspect-ui/canvas-core';
import { getFullHeightContainer } from '../../../../src/div-utils';
const meta: Meta = {
  title: 'Elements/Nodes/States',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const SOURCE_CODE = `const nodeStats = ["default", "active", "selected", "highlighted", "muted", "disabled"];

const nodes: CanvasNodeData[] = nodeStats.map((state, index) => ({
  id: \`node-\${state}\`,
  x: 100 + (index % 4) * 200,
  y: 150 + Math.floor(index / 4) * 200,
  label: \`\${state}\`,
  style: {
    labelPosition: 'bottom',
    labelOffsetY: 10,
    labelStyle: { fontSize: 14, fill: '#333' },
  },
  shape: 'circle',
  size: 20,
  states: [state],
}));

const options: CanvasOptions = {
  container,
  data: { nodes, edges: [] },
};

const canvas = new Canvas(options);
await canvas.init();`;

/**
 * Basic example showing default, active, and selected states
 */
export const DefaultStates: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: {
        code: SOURCE_CODE,
        // language: 'typescript',
      },
    },
  },

  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-container';

    // Schedule canvas init AFTER Storybook captures DOM
    queueMicrotask(async () => {
      const nodeStats = ["default", "active", "selected", "highlighted", "muted", "disabled"];

      const nodes: CanvasNodeData[] = nodeStats.map((state, index) => ({
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
      }));

      const options: CanvasOptions = {
        container,
        data: { nodes, edges: [] },
      };

      const canvas = new Canvas(options);
      await canvas.init();
    });

    return container;
  },
};
