/**
 * Background Styling Stories
 * 
 * Demonstrates various background styling options for the canvas:
 * - Solid colors
 * - Linear and radial gradients
 * - Patterns (dots, grid, cross, lines)
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin } from '@invana/canvas-core';
import type { BackgroundStyle } from '@invana/canvas-core';

const meta: Meta = {
  title: 'Canvas/Styling/Theming',
};

export default meta;
type Story = StoryObj;

// Helper to generate sample graph data
const generateGraphData = () => ({
  nodes: [
    { 
      id: 'n1', x: -300, y: -150, shape: 'circle' as const, size: 40, label: 'Circle',
      style: { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n2', x: -100, y: -150, shape: 'rect' as const, width: 80, height: 60, cornerRadius: 8, label: 'Rect',
      style: { fill: '#50c878', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n3', x: 100, y: -150, shape: 'diamond' as const, size: 50, label: 'Diamond',
      style: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n4', x: 300, y: -150, shape: 'hexagon' as const, size: 45, label: 'Hexagon',
      style: { fill: '#ffd93d', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n5', x: -300, y: 0, shape: 'ellipse' as const, width: 100, height: 60, label: 'Ellipse',
      style: { fill: '#6c5ce7', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n6', x: -100, y: 0, shape: 'triangle' as const, size: 50, label: 'Triangle',
      style: { fill: '#ff85a2', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n7', x: 100, y: 0, shape: 'star' as const, size: 50, label: 'Star',
      style: { fill: '#a29bfe', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n8', x: 300, y: 0, shape: 'pentagon' as const, size: 45, label: 'Pentagon',
      style: { fill: '#fd79a8', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n9', x: -200, y: 150, shape: 'octagon' as const, size: 45, label: 'Octagon',
      style: { fill: '#74b9ff', stroke: '#333', strokeWidth: 2 }
    }
  ],
  edges: [
  ],
});

 


export const BlueprintStyle: Story = {
  name: 'Blueprint Style',
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        data: generateGraphData(),
        styles: {
          node: {
            fill: '#58a6ff',
            stroke: '#79c0ff',
          },
          edge: {
            stroke: '#58a6ff',
          }
        }
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'grid',
        color: '#b3e7ff',
        backgroundColor: '#0b2f66',
        spacing: 25,
        lineWidth: 0.5,
        alpha: 0.8
      });

      canvas.render();
    });

    return container;
  },
};

export const MinimalLight: Story = {
  name: 'Minimal Light',
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'dots',
        color: '#b0b0b0',
        backgroundColor: '#fafafa',
        size: 1.5,
        spacing: 30,
        alpha: 0.6
      });

      canvas.render();
    });

    return container;
  },
};



export const DarkTheme: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'dots',
        color: '#595959',
        backgroundColor: '#212121',
        size: 1.5,
        spacing: 30,
        alpha: 0.6
      });

      canvas.render();
    });

    return container;
  },
};
