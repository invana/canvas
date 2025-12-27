import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface EdgeTypesArgs {
  backgroundColor: string;
  arrowSize: number;
}

const pathTypes = ['line', 'bezier', 'orthogonal', 'orthogonal'] as const;
const pathLabels = ['line', 'bezier', 'orthogonal', 'orthogonal-rounded'];
const colors = ['#4a90d9', '#50c878', '#ff6b6b', '#ffd93d'];

const generateEdgeTypesData = (arrowSize: number): CanvasData => {
  const nodes = [];
  const edges = [];

  pathTypes.forEach((pathType, i) => {
    const y = i * 90 - 135;
    const sourceX = -200;
    const targetX = 200;
    const idSuffix = pathLabels[i]; // Use label for unique IDs

    // Source node
    nodes.push({
      id: `source-${idSuffix}`,
      x: sourceX,
      y,
      shape: 'circle' as const,
      size: 25,
      style: {
        fill: colors[i],
        stroke: '#333',
        strokeWidth: 2,
      },
    });

    // Target node
    nodes.push({
      id: `target-${idSuffix}`,
      x: targetX,
      y,
      shape: 'circle' as const,
      size: 25,
      style: {
        fill: colors[i],
        stroke: '#333',
        strokeWidth: 2,
      },
    });

    // Label node (non-interactive)
    nodes.push({
      id: `label-${idSuffix}`,
      x: -320,
      y,
      shape: 'rect' as const,
      cornerRadius: 8,
      width: 100,
      height: 30,
      label: pathLabels[i],
      style: {
        fill: '#f0f0f0',
        stroke: '#ccc',
        strokeWidth: 1,
        labelStyle: { fill: '#333', fontSize: 11 },
      },
      interactive: false,
      draggable: false,
    });

    // Edge
    edges.push({
      id: `edge-${idSuffix}`,
      source: `source-${idSuffix}`,
      target: `target-${idSuffix}`,
      pathType,
      arrowTarget: 'triangle' as const,
      arrowSize,
      curvature: 0.4,
      style: {
        stroke: colors[i],
        strokeWidth: 3,
        cornerRadius: i === 3 ? 12 : 0, // Rounded corners for the 4th edge
      },
    });
  });

  return { nodes, edges };
};

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
      data: generateEdgeTypesData(args.arrowSize),
      fitPadding: 40,
    });

    await canvas.init();
    canvas.render();
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
