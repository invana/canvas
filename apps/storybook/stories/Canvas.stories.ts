import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';

interface CanvasArgs {
  theme: 'light' | 'dark';
  nodeCount: number;
  edgeCount: number;
}

const createCanvas = (args: CanvasArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  // Create controls
  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.display = 'flex';
  controls.style.gap = '8px';
  controls.style.flexWrap = 'wrap';
  controls.innerHTML = `
    <button id="fit-btn">Fit to Content</button>
    <button id="reset-btn">Reset View</button>
    <button id="zoom-in-btn">Zoom In</button>
    <button id="zoom-out-btn">Zoom Out</button>
    <button id="toggle-theme-btn">Toggle Theme</button>
    <button id="add-node-btn">Add Node</button>
  `;
  wrapper.appendChild(controls);

  // Create info panel
  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontSize = '12px';
  info.style.fontFamily = 'monospace';
  info.innerHTML = 'Initializing...';
  wrapper.appendChild(info);

  // Create canvas container with explicit size
  const container = document.createElement('div');
  container.id = `canvas-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  container.style.position = 'relative';
  wrapper.appendChild(container);

  // Initialize canvas after container is attached to DOM
  requestAnimationFrame(async () => {
    // Ensure container has size
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      container.style.width = '800px';
      container.style.height = '500px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      // Generate random nodes
      const nodes = [];
      const shapes = ['circle', 'rectangle', 'hexagon', 'triangle', 'diamond'] as const;
      for (let i = 0; i < args.nodeCount; i++) {
        nodes.push({
          id: `node-${i}`,
          label: `Node ${i}`,
          x: Math.random() * 600 - 300,
          y: Math.random() * 400 - 200,
          type: `type-${i % 5}`,
          style: {
            shape: shapes[i % shapes.length],
            size: 30 + Math.random() * 20,
          },
        });
      }

      // Generate random edges
      const edges = [];
      const edgeTypes = ['straight', 'bezier', 'orthogonal'] as const;
      for (let i = 0; i < args.edgeCount && args.nodeCount > 1; i++) {
        const source = `node-${Math.floor(Math.random() * args.nodeCount)}`;
        let target = `node-${Math.floor(Math.random() * args.nodeCount)}`;
        while (target === source) {
          target = `node-${Math.floor(Math.random() * args.nodeCount)}`;
        }
        edges.push({
          id: `edge-${i}`,
          source,
          target,
          style: {
            type: edgeTypes[i % edgeTypes.length],
          },
        });
      }

      canvas.import({ nodes, edges });

      // Short delay to let shapes render, then fit
      setTimeout(() => {
        canvas.fitToContent(50);
      }, 100);

      // Update info
      const updateInfo = () => {
        const viewport = canvas.getViewportState();
        info.innerHTML = `
          <strong>Renderer:</strong> ${canvas.isWebGPU ? 'WebGPU ✓' : 'WebGL'} |
          <strong>Nodes:</strong> ${canvas.getNodes().length} |
          <strong>Edges:</strong> ${canvas.getEdges().length} |
          <strong>Zoom:</strong> ${viewport.zoom.toFixed(2)} |
          <strong>Selected:</strong> ${canvas.selection.selectedNodes.length}
        `;
      };

      canvas.on('viewport:changed', updateInfo);
      canvas.on('selection:changed', updateInfo);
      updateInfo();

      // Wire up controls
      wrapper.querySelector('#fit-btn')?.addEventListener('click', () => {
        canvas.fitToContent(50);
      });

      wrapper.querySelector('#reset-btn')?.addEventListener('click', () => {
        canvas.resetView();
      });

      wrapper.querySelector('#zoom-in-btn')?.addEventListener('click', () => {
        canvas.zoomIn();
      });

      wrapper.querySelector('#zoom-out-btn')?.addEventListener('click', () => {
        canvas.zoomOut();
      });

      let currentTheme: 'light' | 'dark' = args.theme;
      wrapper.querySelector('#toggle-theme-btn')?.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        canvas.setTheme(currentTheme);
      });

      let nodeCounter = args.nodeCount;
      wrapper.querySelector('#add-node-btn')?.addEventListener('click', () => {
        canvas.addNode({
          id: `node-${nodeCounter++}`,
          x: Math.random() * 400 - 200,
          y: Math.random() * 300 - 150,
          style: {
            shape: shapes[nodeCounter % shapes.length],
            size: 30,
          },
        });
        updateInfo();
      });

      // Handle node events
      canvas.on('node:click', (data: unknown) => {
        const { node } = data as { node: { id: string } };
        canvas.selectNode(node.id);
      });

      canvas.on('canvas:click', () => {
        canvas.clearSelection();
      });

    } catch (error) {
      info.innerHTML = `<span style="color: red">Error: ${error}</span>`;
      console.error('Canvas initialization error:', error);
    }
  });

  return wrapper;
};

const meta: Meta<CanvasArgs> = {
  title: 'Canvas/Basic',
  render: (args) => createCanvas(args),
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Canvas theme',
    },
    nodeCount: {
      control: { type: 'range', min: 1, max: 100, step: 1 },
      description: 'Number of nodes to generate',
    },
    edgeCount: {
      control: { type: 'range', min: 0, max: 50, step: 1 },
      description: 'Number of edges to generate',
    },
  },
  args: {
    theme: 'light',
    nodeCount: 10,
    edgeCount: 8,
  },
};

export default meta;

type Story = StoryObj<CanvasArgs>;

export const Default: Story = {};

export const DarkTheme: Story = {
  args: {
    theme: 'dark',
  },
};

export const LargeGraph: Story = {
  args: {
    nodeCount: 50,
    edgeCount: 40,
  },
};

export const NoEdges: Story = {
  args: {
    nodeCount: 20,
    edgeCount: 0,
  },
};
