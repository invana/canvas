import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';

interface InteractionsArgs {
  theme: 'light' | 'dark';
  enableDrag: boolean;
  enableSelect: boolean;
  enableHover: boolean;
}

const createInteractions = (args: InteractionsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '550px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Interactions Demo</strong> - Try hovering, clicking, and dragging nodes';
  wrapper.appendChild(info);

  const log = document.createElement('div');
  log.style.padding = '10px';
  log.style.fontSize = '12px';
  log.style.fontFamily = 'monospace';
  log.style.background = '#f5f5f5';
  log.style.maxHeight = '80px';
  log.style.overflow = 'auto';
  log.innerHTML = 'Event log...';
  wrapper.appendChild(log);

  const container = document.createElement('div');
  container.id = `canvas-interactions-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '350px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    log.innerHTML = `[${time}] ${msg}<br>` + log.innerHTML;
  };

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '800px';
      container.style.height = '350px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
      interactions: {
        drag: args.enableDrag,
        select: args.enableSelect,
        hover: args.enableHover,
        pan: true,
        zoom: true,
      },
    });

    try {
      await canvas.initialize();

      // Create a simple graph
      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'];
      for (let i = 0; i < 5; i++) {
        canvas.addNode({
          id: `node-${i}`,
          x: (i - 2) * 150,
          y: Math.sin(i) * 80,
          style: {
            shape: 'circle',
            size: 40,
            fill: colors[i],
          },
        });
      }

      // Add some edges
      canvas.addEdge({ id: 'e1', source: 'node-0', target: 'node-1', style: { type: 'bezier' } });
      canvas.addEdge({ id: 'e2', source: 'node-1', target: 'node-2', style: { type: 'bezier' } });
      canvas.addEdge({ id: 'e3', source: 'node-2', target: 'node-3', style: { type: 'bezier' } });
      canvas.addEdge({ id: 'e4', source: 'node-3', target: 'node-4', style: { type: 'bezier' } });

      setTimeout(() => canvas.fitToContent(80), 100);

      // Log events
      if (args.enableHover) {
        canvas.on('node:hover', (d: unknown) => {
          const { node } = d as { node: { id: string } };
          addLog(`🔵 Hover: ${node.id}`);
        });
      }

      canvas.on('node:click', (d: unknown) => {
        const { node } = d as { node: { id: string } };
        addLog(`🖱️ Click: ${node.id}`);
        if (args.enableSelect) {
          canvas.selectNode(node.id);
        }
      });

      if (args.enableDrag) {
        canvas.on('node:dragStart', (d: unknown) => {
          const { node } = d as { node: { id: string } };
          addLog(`✊ Drag start: ${node.id}`);
        });

        canvas.on('node:dragEnd', (d: unknown) => {
          const { node } = d as { node: { id: string } };
          addLog(`✋ Drag end: ${node.id}`);
        });
      }

      canvas.on('selection:changed', () => {
        const selected = canvas.selection.selectedNodes;
        info.innerHTML = `<strong>Selected:</strong> ${selected.length > 0 ? selected.join(', ') : 'none'}`;
      });

      canvas.on('canvas:click', () => {
        canvas.clearSelection();
      });

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

const meta: Meta<InteractionsArgs> = {
  title: 'Canvas/Interactions',
  render: (args) => createInteractions(args),
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
    },
    enableDrag: {
      control: 'boolean',
      description: 'Enable node dragging',
    },
    enableSelect: {
      control: 'boolean',
      description: 'Enable node selection',
    },
    enableHover: {
      control: 'boolean',
      description: 'Enable hover effects',
    },
  },
  args: {
    theme: 'light',
    enableDrag: true,
    enableSelect: true,
    enableHover: true,
  },
};

export default meta;

type Story = StoryObj<InteractionsArgs>;

export const AllInteractions: Story = {};

export const DragOnly: Story = {
  args: {
    enableDrag: true,
    enableSelect: false,
    enableHover: false,
  },
};

export const SelectOnly: Story = {
  args: {
    enableDrag: false,
    enableSelect: true,
    enableHover: false,
  },
};
