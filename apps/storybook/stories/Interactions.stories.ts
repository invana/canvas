import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface InteractionsArgs {
  backgroundColor: string;
  enableDrag: boolean;
  enableHover: boolean;
  enableSelection: boolean;
}

const colors = ['#4a90d9', '#50c878', '#ff6b6b', '#ffd93d', '#9b59b6', '#e67e22', '#1abc9c', '#34495e', '#e91e63'];

const generateInteractiveData = (args: InteractionsArgs): CanvasData => {
  const nodes = [];
  const gridSize = 3;
  const spacing = 120;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const i = row * gridSize + col;
      const x = (col - 1) * spacing;
      const y = (row - 1) * spacing;
      const nodeColor = colors[i] ?? '#666';

      nodes.push({
        id: `interactive-${i}`,
        x,
        y,
        shape: 'roundedRect' as const,
        width: 80,
        height: 50,
        label: `Node ${i + 1}`,
        draggable: args.enableDrag,
        selectable: args.enableSelection,
        fill: nodeColor,
        stroke: '#333',
        strokeWidth: 2,
        hoverFill: args.enableHover ? '#ffffff' : undefined,
        hoverStroke: args.enableHover ? nodeColor : undefined,
        selectedStroke: args.enableSelection ? '#0066ff' : undefined,
        selectedStrokeWidth: args.enableSelection ? 4 : undefined,
        labelStyle: {
          fill: '#ffffff',
          fontSize: 11,
          fontWeight: 'bold',
        },
      });
    }
  }

  return { nodes, edges: [] };
};

const createInteractiveNodes = (args: InteractionsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = `
    <strong>Interactive Nodes</strong> - 
    Drag: ${args.enableDrag ? '✓' : '✗'} | 
    Hover: ${args.enableHover ? '✓' : '✗'} | 
    Selection: ${args.enableSelection ? '✓' : '✗'}
  `;
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
      data: generateInteractiveData(args),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();
  });

  return wrapper;
};

const generateCircularData = (): CanvasData => {
  const nodes = [];
  const edges = [];
  const nodeCount = 5;
  const radius = 150;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    nodes.push({
      id: `circle-node-${i}`,
      x,
      y,
      shape: 'circle' as const,
      size: 35,
      label: `${i + 1}`,
      draggable: true,
      style: {
        fill: `hsl(${(i / nodeCount) * 360}, 70%, 50%)`,
        stroke: '#333',
        strokeWidth: 2,
        labelStyle: {
          fill: '#ffffff',
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
    });
  }

  // Connect each node to the next
  for (let i = 0; i < nodeCount; i++) {
    edges.push({
      id: `circle-edge-${i}`,
      source: `circle-node-${i}`,
      target: `circle-node-${(i + 1) % nodeCount}`,
      pathType: 'bezier' as const,
      arrowTarget: 'triangle' as const,
      curvature: 0.2,
      style: {
        stroke: '#888',
        strokeWidth: 2,
      },
    });
  }

  return { nodes, edges };
};

const createDragAndConnect = (args: InteractionsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Drag & Connect</strong> - Drag nodes to see connected edges update';
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
      data: generateCircularData(),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();
  });

  return wrapper;
};

const generateFlowData = (): CanvasData => {
  const flowNodes = [
    { id: 'start', x: -250, y: 0, label: 'Start', shape: 'circle' as const, fill: '#4caf50' },
    { id: 'process1', x: -100, y: -80, label: 'Process A', shape: 'roundedRect' as const, fill: '#2196f3' },
    { id: 'process2', x: -100, y: 80, label: 'Process B', shape: 'roundedRect' as const, fill: '#2196f3' },
    { id: 'merge', x: 50, y: 0, label: 'Merge', shape: 'diamond' as const, fill: '#ff9800' },
    { id: 'end', x: 200, y: 0, label: 'End', shape: 'circle' as const, fill: '#f44336' },
  ];

  const nodes = flowNodes.map((nodeConfig) => ({
    id: nodeConfig.id,
    x: nodeConfig.x,
    y: nodeConfig.y,
    shape: nodeConfig.shape,
    size: 30,
    width: 80,
    height: 40,
    label: nodeConfig.label,
    selectable: true,
    draggable: true,
    style: {
      fill: nodeConfig.fill,
      stroke: '#333',
      strokeWidth: 2,
      selectedStroke: '#0066ff',
      selectedStrokeWidth: 3,
      labelStyle: {
        fill: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
      },
    },
  }));

  const edges = [
    { id: 'e1', source: 'start', target: 'process1' },
    { id: 'e2', source: 'start', target: 'process2' },
    { id: 'e3', source: 'process1', target: 'merge' },
    { id: 'e4', source: 'process2', target: 'merge' },
    { id: 'e5', source: 'merge', target: 'end' },
  ].map((e) => ({
    ...e,
    pathType: 'bezier' as const,
    arrowTarget: 'triangle' as const,
    style: {
      stroke: '#888',
      strokeWidth: 2,
    },
  }));

  return { nodes, edges };
};

const createMultiSelection = (args: InteractionsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Multi-Selection</strong> - Hold Shift and click to select multiple nodes';
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
      data: generateFlowData(),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();
  });

  return wrapper;
};

const meta: Meta<InteractionsArgs> = {
  title: 'Canvas/Interactions',
  argTypes: {
    backgroundColor: { control: 'color' },
    enableDrag: { control: 'boolean' },
    enableHover: { control: 'boolean' },
    enableSelection: { control: 'boolean' },
  },
  args: {
    backgroundColor: '#ffffff',
    enableDrag: true,
    enableHover: true,
    enableSelection: true,
  },
};

export default meta;

type Story = StoryObj<InteractionsArgs>;

export const InteractiveNodes: Story = {
  render: (args) => createInteractiveNodes(args),
};

export const DragAndConnect: Story = {
  render: (args) => createDragAndConnect(args),
};

export const MultiSelection: Story = {
  render: (args) => createMultiSelection(args),
};

export const NoInteraction: Story = {
  render: (args) => createInteractiveNodes(args),
  args: {
    enableDrag: false,
    enableHover: false,
    enableSelection: false,
  },
};
