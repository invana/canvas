import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@invana/canvas-core';

// Helper to generate color variations
const getColor = (index: number): string => {
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400'
  ];
  return colors[index % colors.length];
};

// Helper to create container
const createContainer = (id: string): HTMLDivElement => {
  const container = document.createElement('div');
  container.id = id;
  container.style.width = '100%';
  container.style.height = '600px';
  container.style.position = 'relative';
  return container;
};

const meta: Meta = {
  title: 'Plugins/MiniMap',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'range', min: 100, max: 400, step: 50 },
      description: 'Size of the minimap (width and height)',
    },
    position: {
      control: { type: 'select' },
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      description: 'Position of the minimap in the canvas',
    },
    padding: {
      control: { type: 'range', min: 0, max: 50, step: 5 },
      description: 'Padding from canvas edges',
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Basic minimap showing a graph overview with viewport indicator.
 * Click on the minimap to navigate, or drag the viewport rectangle.
 */
export const BasicMiniMap: Story = {
  args: {
    size: 200,
    position: 'bottom-right',
    padding: 20,
  },
  render: () => {
    return createContainer('basic-minimap-container');
  },
  play: async ({ args }) => {
    const container = document.getElementById('basic-minimap-container');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth,
      height: 600,
      backgroundColor: '#f5f5f5',
      behavior: 'default',
      plugins: [
        {
          plugin: 'minimap',
          options: {
            size: args.size,
            position: args.position,
            padding: args.padding,
          },
        },
      ],
    });

    await canvas.init();

    // Create a grid of nodes to demonstrate minimap
    const gridSize = 10;
    const spacing = 200;
    const offsetX = -900;
    const offsetY = -900;

    // First, add ALL nodes
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const id = `node-${row}-${col}`;
        const x = offsetX + col * spacing;
        const y = offsetY + row * spacing;
        
        // Vary the shape types
        const shapeTypes = ['circle', 'rect', 'diamond', 'ellipse'] as const;
        const shape = shapeTypes[(row + col) % shapeTypes.length];

        canvas.addNode({
          id,
          x,
          y,
          shape,
          size: 40,
          label: `${row},${col}`,
          style: {
            fill: getColor(row * 10 + col),
            labelFill: '#333',
            labelFontSize: 12,
          },
        });
      }
    }

    // Then add edges after all nodes exist
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const id = `node-${row}-${col}`;
        
        // Add edges to create a grid pattern
        if (col < gridSize - 1) {
          canvas.addEdge({
            id: `edge-h-${row}-${col}`,
            source: id,
            target: `node-${row}-${col + 1}`,
            style: {
              stroke: '#999',
              strokeWidth: 1,
            },
          });
        }
        if (row < gridSize - 1) {
          canvas.addEdge({
            id: `edge-v-${row}-${col}`,
            source: id,
            target: `node-${row + 1}-${col}`,
            style: {
              stroke: '#999',
              strokeWidth: 1,
            },
          });
        }
      }
    }

    canvas.render();

    // Refresh minimap after nodes are rendered
    const minimap = canvas.getPlugin<any>('minimap');
    if (minimap) {
      minimap.refresh();
    }
  },
};

/**
/**
 * Large minimap for better visibility.
 */
export const LargeMiniMap: Story = {
  args: {
    size: 300,
    position: 'bottom-right',
    padding: 20,
  },
  render: () => {
    return createContainer('large-minimap-container');
  },
  play: async ({ args }) => {
    const container = document.getElementById('large-minimap-container');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth,
      height: 600,
      backgroundColor: '#1a1a1a',
      behavior: 'default',
      plugins: [
        {
          plugin: 'minimap',
          options: {
            size: args.size,
            position: args.position,
            padding: args.padding,
            backgroundColor: '#2a2a2a',
            viewportFillColor: 'rgba(100, 150, 255, 0.2)',
            viewportStrokeColor: '#6096ff',
          },
        },
      ],
    });

    await canvas.init();

    // Create a more complex graph
    const numNodes = 50;
    const radius = 400;

    // First, add all nodes
    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      canvas.addNode({
        id: `node-${i}`,
        x,
        y,
        shape: 'circle' as const,
        size: 30,
        label: `${i}`,
        style: {
          fill: getColor(i),
          labelFill: '#fff',
          labelFontSize: 10,
        },
      });
    }

    // Then add edges after all nodes exist
    for (let i = 0; i < numNodes; i++) {
      // Connect to next 3 nodes
      for (let j = 1; j <= 3; j++) {
        const target = (i + j) % numNodes;
        canvas.addEdge({
          id: `edge-${i}-${target}`,
          source: `node-${i}`,
          target: `node-${target}`,
          style: {
            stroke: '#555',
            strokeWidth: 1,
          },
        });
      }
    }

    canvas.render();
    canvas.viewport.panTo(0, 0);

    // Refresh minimap after nodes are rendered
    const minimap = canvas.getPlugin<any>('minimap');
    if (minimap) {
      minimap.refresh();
    }
  },
};
/**
/**
 * Minimap in different positions.
 */
export const PositionVariations: Story = {
  args: {
    size: 150,
    position: 'top-left',
    padding: 15,
  },
  render: () => {
    return createContainer('position-variations-container');
  },
  play: async ({ args }) => {
    const container = document.getElementById('position-variations-container');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth,
      height: 600,
      backgroundColor: '#f0f8ff',
      behavior: 'default',
      plugins: [
        {
          plugin: 'minimap',
          options: {
            size: args.size,
            position: args.position,
            padding: args.padding,
          },
        },
      ],
    });

    await canvas.init();

    // Create a simple graph
    const positions = [
      { x: -300, y: -300 },
      { x: 300, y: -300 },
      { x: -300, y: 300 },
      { x: 300, y: 300 },
      { x: 0, y: 0 },
    ];

    positions.forEach((pos, i) => {
      canvas.addNode({
        id: `node-${i}`,
        x: pos.x,
        y: pos.y,
        shape: 'rect' as const,
        size: 80,
        label: `Node ${i}`,
        style: {
          fill: '#3498db',
          labelFill: '#fff',
        },
      });
    });

    // Connect all to center
    for (let i = 0; i < 4; i++) {
      canvas.addEdge({
        id: `edge-${i}`,
        source: `node-${i}`,
        target: 'node-4',
        style: {
          stroke: '#2980b9',
          strokeWidth: 2,
        },
      });
    }

    canvas.render();
    canvas.viewport.panTo(0, 0);

    // Refresh minimap after nodes are rendered
    const minimap = canvas.getPlugin<any>('minimap');
    if (minimap) {
      minimap.refresh();
    }
  },
};
/**
/**
 * Minimap with custom styling.
 */
export const CustomStyling: Story = {
  args: {
    size: 250,
    position: 'bottom-left',
    padding: 25,
  },
  render: () => {
    return createContainer('custom-styling-container');
  },
  play: async ({ args }) => {
    const container = document.getElementById('custom-styling-container');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth,
      height: 600,
      backgroundColor: '#2d3436',
      behavior: 'full',
      plugins: [
        {
          plugin: 'minimap',
          options: {
            size: args.size,
            position: args.position,
            padding: args.padding,
            backgroundColor: '#1a1a1a',
            borderColor: '#00d4ff',
            borderWidth: 2,
            viewportFillColor: 'rgba(0, 212, 255, 0.15)',
            viewportStrokeColor: '#00d4ff',
            viewportStrokeWidth: 2,
            nodeColor: '#fff',
            edgeColor: '#555',
          },
        },
      ],
    });

    await canvas.init();

    // Create a hierarchical tree
    const createTree = (parentId: string | null, x: number, y: number, depth: number, maxDepth: number) => {
      if (depth > maxDepth) return;

      const id = `node-${x}-${y}-${depth}`;
      canvas.addNode({
        id,
        x,
        y,
        shape: depth === 0 ? 'circle' as const : 'diamond' as const,
        size: 50 - depth * 10,
        label: `L${depth}`,
        style: {
          fill: getColor(depth * 2),
          labelFill: '#000',
        },
      });

      if (parentId) {
        canvas.addEdge({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          style: {
            stroke: '#95a5a6',
            strokeWidth: 2,
          },
        });
      }

      if (depth < maxDepth) {
        const childY = y + 150;
        const spread = 200 / (depth + 1);
        for (let i = -1; i <= 1; i++) {
          createTree(id, x + i * spread, childY, depth + 1, maxDepth);
        }
      }
    };

    createTree(null, 0, -250, 0, 3);

    canvas.render();
    canvas.viewport.panTo(0, 0);

    // Refresh minimap after nodes are rendered
    const minimap = canvas.getPlugin<any>('minimap');
    if (minimap) {
      minimap.refresh();
    }
  },
};