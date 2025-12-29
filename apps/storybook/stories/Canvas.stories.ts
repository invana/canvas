import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@invana/canvas-core';

interface CanvasArgs {
  backgroundColor: string;
  nodeCount: number;
}

const shapes = ['circle', 'rect', 'hexagon', 'triangle', 'diamond'] as const;
const colors = ['#4a90d9', '#50c878', '#ff6b6b', '#ffd93d', '#6c5ce7'];

const generateGraphData = (nodeCount: number): CanvasData => {
  const nodes = [];
  const edges = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      x: (i % 5) * 150 - 300,
      y: Math.floor(i / 5) * 120 - 150,
      shape: shapes[i % shapes.length],
      size: 40,
      label: `Node ${i + 1}`,
      style: {
        fill: colors[i % colors.length],
        stroke: '#333',
        strokeWidth: 2,
        labelPosition: 'bottom' as const,
        labelOffsetY: 10,
        labelStyle: { fill: '#333', fontSize: 11 },
      },
    });
  }

  // Create edges connecting adjacent nodes
  for (let i = 0; i < Math.min(nodeCount - 1, 5); i++) {
    edges.push({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      pathType: 'bezier' as const,
      arrowTarget: 'triangle' as const,
      style: {
        stroke: '#666',
        strokeWidth: 2,
      },
    });
  }

  return { nodes, edges };
};

const createBasicCanvas = (args: CanvasArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  // Controls
  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.display = 'flex';
  controls.style.gap = '8px';
  controls.innerHTML = `
    <button id="fit-btn">Fit to Content</button>
    <button id="reset-btn">Reset View</button>
    <button id="add-node-btn">Add Node</button>
  `;
  wrapper.appendChild(controls);

  // Info panel
  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontSize = '12px';
  info.style.fontFamily = 'monospace';
  info.innerHTML = 'Initializing...';
  wrapper.appendChild(info);

  // Canvas container
  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 500,
      backgroundColor: args.backgroundColor,
      data: generateGraphData(args.nodeCount),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();

    const rendererType = canvas.getRendererType();
    info.innerHTML = `Renderer: <strong>${rendererType}</strong> | Viewport: ${canvas.width}x${canvas.height}`;

    // Button handlers
    document.getElementById('fit-btn')?.addEventListener('click', () => {
      canvas.fitContent(50);
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      canvas.resetViewport();
    });

    let nodeCounter = args.nodeCount;
    document.getElementById('add-node-btn')?.addEventListener('click', () => {
      const currentData = canvas.getData();
      if (currentData) {
        currentData.nodes.push({
          id: `node-${nodeCounter}`,
          x: Math.random() * 400 - 200,
          y: Math.random() * 300 - 150,
          shape: shapes[nodeCounter % shapes.length],
          size: 35,
          label: `New ${nodeCounter + 1}`,
          fill: colors[nodeCounter % colors.length],
          stroke: '#333',
          strokeWidth: 2,
        });
        canvas.setData(currentData);
        nodeCounter++;
        info.innerHTML = `Added node ${nodeCounter}. Total: ${currentData.nodes.length}`;
      }
    });
  });

  return wrapper;
};

const meta: Meta<CanvasArgs> = {
  title: 'Canvas/Basic',
  render: (args) => createBasicCanvas(args),
  argTypes: {
    backgroundColor: { control: 'color' },
    nodeCount: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  },
  args: {
    backgroundColor: '#f5f5f5',
    nodeCount: 6,
  },
};

export default meta;

type Story = StoryObj<CanvasArgs>;

export const Default: Story = {};

export const DarkBackground: Story = {
  args: {
    backgroundColor: '#1a1a2e',
    nodeCount: 8,
  },
};

export const ManyNodes: Story = {
  args: {
    nodeCount: 15,
  },
};
