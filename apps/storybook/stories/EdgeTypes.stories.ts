import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';

interface EdgeTypesArgs {
  theme: 'light' | 'dark';
}

const createEdgeTypes = (args: EdgeTypesArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Edge Types Demo</strong> - Straight, Bezier, and Orthogonal edges';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-edges-${Date.now()}`;
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

      // Create node pairs for each edge type
      const edgeTypes = ['straight', 'bezier', 'orthogonal'] as const;
      const colors = ['#4CAF50', '#2196F3', '#FF9800'];

      edgeTypes.forEach((type, i) => {
        const y = (i - 1) * 120;
        
        // Source node
        canvas.addNode({
          id: `${type}-source`,
          x: -200,
          y,
          style: {
            shape: 'circle',
            size: 30,
            fill: colors[i],
          },
        });

        // Target node
        canvas.addNode({
          id: `${type}-target`,
          x: 200,
          y,
          style: {
            shape: 'circle',
            size: 30,
            fill: colors[i],
          },
        });

        // Edge
        canvas.addEdge({
          id: `edge-${type}`,
          source: `${type}-source`,
          target: `${type}-target`,
          style: {
            type,
            stroke: colors[i],
            strokeWidth: 3,
            arrowhead: true,
          },
        });
      });

      // Add labels
      canvas.addNode({
        id: 'label-straight',
        x: 0,
        y: -120,
        style: { shape: 'rectangle', size: 10, fill: 'transparent' },
      });

      setTimeout(() => canvas.fitToContent(60), 100);

      canvas.on('edge:hover', (data: unknown) => {
        const { edge } = data as { edge: { id: string } };
        info.innerHTML = `<strong>Hovering:</strong> ${edge.id.replace('edge-', '')} edge`;
      });

      canvas.on('edge:hoverEnd', () => {
        info.innerHTML = '<strong>Edge Types Demo</strong> - Straight, Bezier, and Orthogonal edges';
      });

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

const meta: Meta<EdgeTypesArgs> = {
  title: 'Canvas/Edge Types',
  render: (args) => createEdgeTypes(args),
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

type Story = StoryObj<EdgeTypesArgs>;

export const AllEdgeTypes: Story = {};

export const DarkTheme: Story = {
  args: { theme: 'dark' },
};
