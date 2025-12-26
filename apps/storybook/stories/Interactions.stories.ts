import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeShape, EdgeShape } from '@aspect-ui/canvas-core';

interface InteractionsArgs {
  backgroundColor: string;
  enableDrag: boolean;
  enableHover: boolean;
  enableSelection: boolean;
}

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
    });

    await canvas.init();

    const gridSize = 3;
    const spacing = 120;
    const colors = ['#4a90d9', '#50c878', '#ff6b6b', '#ffd93d', '#9b59b6', '#e67e22', '#1abc9c', '#34495e', '#e91e63'];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const i = row * gridSize + col;
        const x = (col - 1) * spacing;
        const y = (row - 1) * spacing;
        const nodeColor = colors[i] ?? '#666';

        const node = new NodeShape({
          data: {
            id: `interactive-${i}`,
            x,
            y,
            shape: 'roundedRect',
            width: 80,
            height: 50,
            label: `Node ${i + 1}`,
          },
          style: {
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
          },
          interactive: true,
          draggable: args.enableDrag,
          selectable: args.enableSelection,
          registry: canvas.registry,
        });

        canvas.addNode(node);
      }
    }

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
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
    });

    await canvas.init();

    // Create nodes in a circle
    const nodeCount = 5;
    const radius = 150;
    const nodes: NodeShape[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const node = new NodeShape({
        data: {
          id: `circle-node-${i}`,
          x,
          y,
          shape: 'circle',
          size: 35,
          label: `${i + 1}`,
        },
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
        interactive: true,
        draggable: true,
        registry: canvas.registry,
      });

      nodes.push(node);
      canvas.addNode(node);
    }

    // Connect each node to the next
    for (let i = 0; i < nodeCount; i++) {
      const sourceNode = nodes[i];
      const targetNode = nodes[(i + 1) % nodeCount];

      if (sourceNode && targetNode) {
        const edge = new EdgeShape({
          data: {
            id: `circle-edge-${i}`,
            source: { x: sourceNode.data.x, y: sourceNode.data.y },
            target: { x: targetNode.data.x, y: targetNode.data.y },
            pathType: 'bezier',
            arrowTarget: 'triangle',
            curvature: 0.2,
          },
          style: {
            stroke: '#888',
            strokeWidth: 2,
          },
          registry: canvas.registry,
        });

        canvas.addEdge(edge, sourceNode.id, targetNode.id);
      }
    }

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
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
    });

    await canvas.init();

    // Create a group of nodes representing a flow
    const flowNodes = [
      { id: 'start', x: -250, y: 0, label: 'Start', shape: 'circle', fill: '#4caf50' },
      { id: 'process1', x: -100, y: -80, label: 'Process A', shape: 'roundedRect', fill: '#2196f3' },
      { id: 'process2', x: -100, y: 80, label: 'Process B', shape: 'roundedRect', fill: '#2196f3' },
      { id: 'merge', x: 50, y: 0, label: 'Merge', shape: 'polygon', fill: '#ff9800' },
      { id: 'end', x: 200, y: 0, label: 'End', shape: 'circle', fill: '#f44336' },
    ];

    const nodeMap: Record<string, NodeShape> = {};

    flowNodes.forEach((nodeConfig) => {
      const node = new NodeShape({
        data: {
          id: nodeConfig.id,
          x: nodeConfig.x,
          y: nodeConfig.y,
          shape: nodeConfig.shape,
          size: 30,
          width: 80,
          height: 40,
          sides: 4,
          label: nodeConfig.label,
        },
        style: {
          fill: nodeConfig.fill,
          stroke: '#333',
          strokeWidth: 2,
          selectedStroke: '#ffeb3b',
          selectedStrokeWidth: 4,
          labelStyle: {
            fill: '#ffffff',
            fontSize: 10,
            fontWeight: 'bold',
          },
        },
        interactive: true,
        draggable: true,
        selectable: true,
        registry: canvas.registry,
      });

      nodeMap[nodeConfig.id] = node;
      canvas.addNode(node);
    });

    // Create edges
    const edges = [
      { source: 'start', target: 'process1' },
      { source: 'start', target: 'process2' },
      { source: 'process1', target: 'merge' },
      { source: 'process2', target: 'merge' },
      { source: 'merge', target: 'end' },
    ];

    edges.forEach((edgeConfig, i) => {
      const sourceNode = nodeMap[edgeConfig.source];
      const targetNode = nodeMap[edgeConfig.target];

      if (sourceNode && targetNode) {
        const edge = new EdgeShape({
          data: {
            id: `flow-edge-${i}`,
            source: { x: sourceNode.data.x, y: sourceNode.data.y },
            target: { x: targetNode.data.x, y: targetNode.data.y },
            pathType: 'bezier',
            arrowTarget: 'triangle',
            curvature: 0.15,
          },
          style: {
            stroke: '#666',
            strokeWidth: 2,
          },
          registry: canvas.registry,
        });

        canvas.addEdge(edge, edgeConfig.source, edgeConfig.target);
      }
    });

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
};

const meta: Meta<InteractionsArgs> = {
  title: 'Canvas/Interactions',
  render: (args) => createInteractiveNodes(args),
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

export const InteractiveNodes: Story = {};

export const DragAndConnect: Story = {
  render: (args) => createDragAndConnect(args),
};

export const MultiSelection: Story = {
  render: (args) => createMultiSelection(args),
};

export const DragOnly: Story = {
  args: {
    enableDrag: true,
    enableHover: false,
    enableSelection: false,
  },
};

export const HoverOnly: Story = {
  args: {
    enableDrag: false,
    enableHover: true,
    enableSelection: false,
  },
};
