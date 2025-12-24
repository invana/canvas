import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';

interface NodeShapesArgs {
  theme: 'light' | 'dark';
}

const shapes = [
  { name: 'circle', x: -300, y: -100 },
  { name: 'rectangle', x: -100, y: -100 },
  { name: 'hexagon', x: 100, y: -100 },
  { name: 'triangle', x: 300, y: -100 },
  { name: 'diamond', x: -200, y: 100 },
  { name: 'pentagon', x: 0, y: 100 },
  { name: 'octagon', x: 200, y: 100 },
] as const;

const createNodeShapes = (args: NodeShapesArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Node Shapes Demo</strong> - All available primitive shapes';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-shapes-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '800px';
      container.style.height = '400px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#795548'];

      shapes.forEach((shape, i) => {
        canvas.addNode({
          id: `shape-${shape.name}`,
          x: shape.x,
          y: shape.y,
          style: {
            shape: shape.name,
            size: 50,
            fill: colors[i % colors.length],
          },
        });
      });

      setTimeout(() => canvas.fitToContent(80), 100);

      canvas.on('node:hover', (data: unknown) => {
        const { node } = data as { node: { id: string } };
        info.innerHTML = `<strong>Hovering:</strong> ${node.id.replace('shape-', '')}`;
      });

      canvas.on('node:hoverEnd', () => {
        info.innerHTML = '<strong>Node Shapes Demo</strong> - Hover over shapes to see their names';
      });

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

const meta: Meta<NodeShapesArgs> = {
  title: 'Canvas/Node Shapes',
  render: (args) => createNodeShapes(args),
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
    },
  },
  args: {
    theme: 'light',
  },
};

export default meta;

type Story = StoryObj<NodeShapesArgs>;

export const AllShapes: Story = {};

export const DarkTheme: Story = {
  args: { theme: 'dark' },
};
