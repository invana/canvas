import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeShape, EdgeShape } from '@aspect-ui/canvas-core';

interface EdgeTypesArgs {
  backgroundColor: string;
  arrowSize: number;
}

const pathTypes = ['line', 'bezier', 'orthogonal', 'orthogonal-rounded'] as const;

const createEdgeTypes = (args: EdgeTypesArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Edge Types</strong> - Different path styles for edges';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 400,
      backgroundColor: args.backgroundColor,
    });

    await canvas.init();

    const colors = ['#4a90d9', '#50c878', '#ff6b6b', '#ffd93d'];

    // Create pairs of nodes with different edge types
    pathTypes.forEach((pathType, i) => {
      const y = i * 90 - 135;
      const sourceX = -200;
      const targetX = 200;

      // Source node
      const sourceNode = new NodeShape({
        data: {
          id: `source-${pathType}`,
          x: sourceX,
          y,
          shape: 'circle',
          size: 25,
        },
        style: {
          fill: colors[i],
          stroke: '#333',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Target node
      const targetNode = new NodeShape({
        data: {
          id: `target-${pathType}`,
          x: targetX,
          y,
          shape: 'circle',
          size: 25,
        },
        style: {
          fill: colors[i],
          stroke: '#333',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Edge
      const color = colors[i] ?? '#666';
      const edge = new EdgeShape({
        data: {
          id: `edge-${pathType}`,
          source: { x: sourceX + 25, y },
          target: { x: targetX - 25, y },
          pathType,
          arrowTarget: 'triangle',
          arrowSize: args.arrowSize,
          curvature: 0.4,
        },
        style: {
          stroke: color,
          strokeWidth: 3,
        },
        registry: canvas.registry,
      });

      // Label
      const label = new NodeShape({
        data: {
          id: `label-${pathType}`,
          x: -320,
          y,
          shape: 'roundedRect',
          width: 100,
          height: 30,
          label: pathType,
        },
        style: {
          fill: '#f0f0f0',
          stroke: '#ccc',
          strokeWidth: 1,
          labelStyle: { fill: '#333', fontSize: 11 },
        },
        registry: canvas.registry,
        interactive: false,
      });

      canvas.addToNodeLayer(sourceNode);
      canvas.addToNodeLayer(targetNode);
      canvas.addToNodeLayer(label);
      canvas.addToEdgeLayer(edge, sourceNode.id, targetNode.id);
    });

    setTimeout(() => canvas.fitContent(40), 100);
  });

  return wrapper;
};

const meta: Meta<EdgeTypesArgs> = {
  title: 'Canvas/Edge Types',
  render: (args) => createEdgeTypes(args),
  argTypes: {
    backgroundColor: { control: 'color' },
    arrowSize: { control: { type: 'range', min: 5, max: 20, step: 1 } },
  },
  args: {
    backgroundColor: '#ffffff',
    arrowSize: 12,
  },
};

export default meta;

type Story = StoryObj<EdgeTypesArgs>;

export const AllTypes: Story = {};

export const LargeArrows: Story = {
  args: {
    arrowSize: 18,
  },
};
