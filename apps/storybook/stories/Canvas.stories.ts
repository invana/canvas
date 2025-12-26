import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeShape, EdgeShape } from '@aspect-ui/canvas-core';

interface CanvasArgs {
  backgroundColor: string;
  nodeCount: number;
}

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
    });

    await canvas.init();

    const rendererType = canvas.getRendererType();
    info.innerHTML = `Renderer: <strong>${rendererType}</strong> | Viewport: ${canvas.width}x${canvas.height}`;

    // Create nodes
    const shapes = ['circle', 'roundedRect', 'hexagon', 'triangle', 'diamond'] as const;
    const colors = ['#4a90d9', '#50c878', '#ff6b6b', '#ffd93d', '#6c5ce7'];

    for (let i = 0; i < args.nodeCount; i++) {
      const node = new NodeShape({
        data: {
          id: `node-${i}`,
          x: (i % 5) * 150 - 300,
          y: Math.floor(i / 5) * 120 - 150,
          shape: shapes[i % shapes.length],
          size: 40,
          label: `Node ${i + 1}`,
        },
        style: {
          fill: colors[i % colors.length],
          stroke: '#333',
          strokeWidth: 2,
          labelPosition: 'bottom',
          labelOffsetY: 10,
          labelStyle: { fill: '#333', fontSize: 11 },
        },
        registry: canvas.registry,
      });
      canvas.addToNodeLayer(node);
    }

    // Create some edges
    if (args.nodeCount > 1) {
      for (let i = 0; i < Math.min(args.nodeCount - 1, 5); i++) {
        const sourceNode = canvas.nodeLayer?.children[i] as NodeShape | undefined;
        const targetNode = canvas.nodeLayer?.children[i + 1] as NodeShape | undefined;
        
        if (sourceNode && targetNode) {
          const edge = new EdgeShape({
            data: {
              id: `edge-${i}`,
              source: { x: sourceNode.x, y: sourceNode.y },
              target: { x: targetNode.x, y: targetNode.y },
              pathType: 'bezier',
              arrowTarget: 'triangle',
            },
            style: {
              stroke: '#666',
              strokeWidth: 2,
            },
            registry: canvas.registry,
          });
          canvas.addToEdgeLayer(edge, sourceNode.id, targetNode.id);
        }
      }
    }

    // Button handlers
    document.getElementById('fit-btn')?.addEventListener('click', () => {
      canvas.fitContent(50);
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      canvas.resetViewport();
    });

    let nodeCounter = args.nodeCount;
    document.getElementById('add-node-btn')?.addEventListener('click', () => {
      const node = new NodeShape({
        data: {
          id: `node-${nodeCounter}`,
          x: Math.random() * 400 - 200,
          y: Math.random() * 300 - 150,
          shape: shapes[nodeCounter % shapes.length],
          size: 35,
          label: `New ${nodeCounter + 1}`,
        },
        style: {
          fill: colors[nodeCounter % colors.length],
          stroke: '#333',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });
      canvas.addToNodeLayer(node);
      nodeCounter++;
      info.innerHTML = `Added node ${nodeCounter}. Total: ${canvas.nodeLayer?.children.length ?? 0}`;
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
