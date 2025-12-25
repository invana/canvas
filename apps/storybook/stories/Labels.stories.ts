import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';

interface LabelsArgs {
  theme: 'light' | 'dark';
  showNodeLabels: boolean;
  showEdgeLabels: boolean;
}

// ============================================================================
// Node Label Positions Story
// ============================================================================

const createNodeLabelPositions = (args: LabelsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Node Label Positions</strong> - All 9 label positions for nodes';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-node-labels-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '500px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '900px';
      container.style.height = '500px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      const positions = [
        { name: 'top-left', x: -300, y: -150 },
        { name: 'top', x: 0, y: -150 },
        { name: 'top-right', x: 300, y: -150 },
        { name: 'left', x: -300, y: 0 },
        { name: 'center', x: 0, y: 0 },
        { name: 'right', x: 300, y: 0 },
        { name: 'bottom-left', x: -300, y: 150 },
        { name: 'bottom', x: 0, y: 150 },
        { name: 'bottom-right', x: 300, y: 150 },
      ] as const;

      positions.forEach((pos) => {
        canvas.addNode({
          id: `node-${pos.name}`,
          x: pos.x,
          y: pos.y,
          style: {
            shape: 'circle',
            size: 50,
            fill: '#4CAF50',
            stroke: '#2E7D32',
            strokeWidth: 2,
            label: {
              text: pos.name,
              visible: args.showNodeLabels,
              position: pos.name,
              fontSize: 11,
              textColor: '#333333',
              backgroundColor: '#ffffff',
              padding: { x: 4, y: 2 },
              borderRadius: 3,
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(100), 100);

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

// ============================================================================
// Edge Label Positions Story
// ============================================================================

const createEdgeLabelPositions = (args: LabelsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Edge Label Positions</strong> - start, middle, and end positions';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-edge-labels-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '900px';
      container.style.height = '400px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      // Create nodes for the edges
      canvas.addNode({
        id: 'node-a1',
        x: -300,
        y: -80,
        style: { shape: 'circle', size: 40, fill: '#2196F3' },
      });
      canvas.addNode({
        id: 'node-b1',
        x: 300,
        y: -80,
        style: { shape: 'circle', size: 40, fill: '#2196F3' },
      });

      canvas.addNode({
        id: 'node-a2',
        x: -300,
        y: 0,
        style: { shape: 'circle', size: 40, fill: '#FF9800' },
      });
      canvas.addNode({
        id: 'node-b2',
        x: 300,
        y: 0,
        style: { shape: 'circle', size: 40, fill: '#FF9800' },
      });

      canvas.addNode({
        id: 'node-a3',
        x: -300,
        y: 80,
        style: { shape: 'circle', size: 40, fill: '#E91E63' },
      });
      canvas.addNode({
        id: 'node-b3',
        x: 300,
        y: 80,
        style: { shape: 'circle', size: 40, fill: '#E91E63' },
      });

      // Edge with label at start
      canvas.addEdge({
        id: 'edge-start',
        source: 'node-a1',
        target: 'node-b1',
        style: {
          stroke: '#2196F3',
          strokeWidth: 2,
          label: {
            text: 'start position',
            visible: args.showEdgeLabels,
            position: 'start',
            fontSize: 10,
            textColor: '#2196F3',
            backgroundColor: '#E3F2FD',
            padding: { x: 6, y: 3 },
            borderRadius: 4,
          },
        },
      });

      // Edge with label at middle
      canvas.addEdge({
        id: 'edge-middle',
        source: 'node-a2',
        target: 'node-b2',
        style: {
          stroke: '#FF9800',
          strokeWidth: 2,
          label: {
            text: 'middle position',
            visible: args.showEdgeLabels,
            position: 'middle',
            fontSize: 10,
            textColor: '#FF9800',
            backgroundColor: '#FFF3E0',
            padding: { x: 6, y: 3 },
            borderRadius: 4,
          },
        },
      });

      // Edge with label at end
      canvas.addEdge({
        id: 'edge-end',
        source: 'node-a3',
        target: 'node-b3',
        style: {
          stroke: '#E91E63',
          strokeWidth: 2,
          label: {
            text: 'end position',
            visible: args.showEdgeLabels,
            position: 'end',
            fontSize: 10,
            textColor: '#E91E63',
            backgroundColor: '#FCE4EC',
            padding: { x: 6, y: 3 },
            borderRadius: 4,
          },
        },
      });

      setTimeout(() => canvas.fitToContent(80), 100);

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

// ============================================================================
// Label Styling Story
// ============================================================================

const createLabelStyling = (args: LabelsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Label Styling</strong> - Various label styling options';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-label-styling-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '900px';
      container.style.height = '400px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      // Basic label - no background
      canvas.addNode({
        id: 'basic',
        x: -300,
        y: -80,
        style: {
          shape: 'circle',
          size: 50,
          fill: '#4CAF50',
          label: {
            text: 'Basic Label',
            visible: true,
            position: 'bottom',
            fontSize: 12,
            textColor: '#333333',
          },
        },
      });

      // Label with background
      canvas.addNode({
        id: 'with-bg',
        x: -100,
        y: -80,
        style: {
          shape: 'circle',
          size: 50,
          fill: '#2196F3',
          label: {
            text: 'With Background',
            visible: true,
            position: 'bottom',
            fontSize: 12,
            textColor: '#ffffff',
            backgroundColor: '#2196F3',
            padding: { x: 8, y: 4 },
            borderRadius: 4,
          },
        },
      });

      // Label with border
      canvas.addNode({
        id: 'with-border',
        x: 100,
        y: -80,
        style: {
          shape: 'circle',
          size: 50,
          fill: '#FF9800',
          label: {
            text: 'With Border',
            visible: true,
            position: 'bottom',
            fontSize: 12,
            textColor: '#FF9800',
            backgroundColor: '#ffffff',
            padding: { x: 8, y: 4 },
            borderRadius: 4,
            borderColor: '#FF9800',
            borderWidth: 2,
          },
        },
      });

      // Pill-shaped label
      canvas.addNode({
        id: 'pill',
        x: 300,
        y: -80,
        style: {
          shape: 'circle',
          size: 50,
          fill: '#9C27B0',
          label: {
            text: 'Pill Shape',
            visible: true,
            position: 'bottom',
            fontSize: 11,
            textColor: '#ffffff',
            backgroundColor: '#9C27B0',
            padding: { x: 12, y: 4 },
            borderRadius: 12,
          },
        },
      });

      // Bold label
      canvas.addNode({
        id: 'bold',
        x: -200,
        y: 80,
        style: {
          shape: 'rectangle',
          size: 60,
          fill: '#E91E63',
          label: {
            text: 'Bold Text',
            visible: true,
            position: 'center',
            fontSize: 14,
            fontWeight: 'bold',
            textColor: '#ffffff',
          },
        },
      });

      // Large label
      canvas.addNode({
        id: 'large',
        x: 0,
        y: 80,
        style: {
          shape: 'rectangle',
          size: 80,
          fill: '#00BCD4',
          label: {
            text: 'Large',
            visible: true,
            position: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            textColor: '#ffffff',
          },
        },
      });

      // Truncated label
      canvas.addNode({
        id: 'truncated',
        x: 200,
        y: 80,
        style: {
          shape: 'rectangle',
          size: 60,
          fill: '#795548',
          label: {
            text: 'This is a very long label that will be truncated',
            visible: true,
            position: 'bottom',
            fontSize: 11,
            textColor: '#795548',
            truncate: true,
            truncateLength: 15,
          },
        },
      });

      setTimeout(() => canvas.fitToContent(100), 100);

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

// ============================================================================
// Interactive Labels Story
// ============================================================================

const createInteractiveLabels = (args: LabelsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Interactive Labels</strong> - Hover and select nodes to see state-based label styling';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-interactive-labels-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '900px';
      container.style.height = '400px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      const nodeIds = ['node-1', 'node-2', 'node-3', 'node-4'];
      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63'];

      nodeIds.forEach((id, i) => {
        canvas.addNode({
          id,
          x: -225 + i * 150,
          y: 0,
          style: {
            shape: 'circle',
            size: 60,
            fill: colors[i],
            label: {
              text: `Node ${i + 1}`,
              visible: true,
              position: 'bottom',
              fontSize: 12,
              textColor: '#333333',
              backgroundColor: '#ffffff',
              padding: { x: 6, y: 3 },
              borderRadius: 4,
            },
          },
        });
      });

      // Add edges
      canvas.addEdge({
        id: 'edge-1-2',
        source: 'node-1',
        target: 'node-2',
        style: {
          stroke: '#999',
          strokeWidth: 2,
          label: {
            text: 'Edge 1-2',
            visible: true,
            position: 'middle',
            fontSize: 10,
            textColor: '#666',
          },
        },
      });

      canvas.addEdge({
        id: 'edge-2-3',
        source: 'node-2',
        target: 'node-3',
        style: {
          stroke: '#999',
          strokeWidth: 2,
          label: {
            text: 'Edge 2-3',
            visible: true,
            position: 'middle',
            fontSize: 10,
            textColor: '#666',
          },
        },
      });

      canvas.addEdge({
        id: 'edge-3-4',
        source: 'node-3',
        target: 'node-4',
        style: {
          stroke: '#999',
          strokeWidth: 2,
          label: {
            text: 'Edge 3-4',
            visible: true,
            position: 'middle',
            fontSize: 10,
            textColor: '#666',
          },
        },
      });

      // Handle node selection
      canvas.on('node:click', (data: unknown) => {
        const { node } = data as { node: { id: string } };
        info.innerHTML = `<strong>Selected:</strong> ${node.id}`;
      });

      canvas.on('node:hover', (data: unknown) => {
        const { node } = data as { node: { id: string } };
        info.innerHTML = `<strong>Hovering:</strong> ${node.id}`;
      });

      canvas.on('node:hoverEnd', () => {
        info.innerHTML = '<strong>Interactive Labels</strong> - Hover and select nodes';
      });

      setTimeout(() => canvas.fitToContent(100), 100);

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

// ============================================================================
// Meta & Stories Export
// ============================================================================

const meta: Meta<LabelsArgs> = {
  title: 'Canvas/Labels',
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Theme to use for the canvas',
    },
    showNodeLabels: {
      control: 'boolean',
      description: 'Show labels on nodes',
    },
    showEdgeLabels: {
      control: 'boolean',
      description: 'Show labels on edges',
    },
  },
  args: {
    theme: 'light',
    showNodeLabels: true,
    showEdgeLabels: true,
  },
};

export default meta;
type Story = StoryObj<LabelsArgs>;

export const NodeLabelPositions: Story = {
  render: createNodeLabelPositions,
  args: {
    theme: 'light',
    showNodeLabels: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates all 9 label positions for nodes: top, bottom, left, right, center, and four corners.',
      },
    },
  },
};

export const EdgeLabelPositions: Story = {
  render: createEdgeLabelPositions,
  args: {
    theme: 'light',
    showEdgeLabels: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates edge label positions: start, middle, and end.',
      },
    },
  },
};

export const LabelStyling: Story = {
  render: createLabelStyling,
  args: {
    theme: 'light',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates various label styling options including backgrounds, borders, pill shapes, bold text, and truncation.',
      },
    },
  },
};

export const InteractiveLabels: Story = {
  render: createInteractiveLabels,
  args: {
    theme: 'light',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing labels on nodes and edges. Hover and click to see state changes.',
      },
    },
  },
};

export const DarkTheme: Story = {
  render: createNodeLabelPositions,
  args: {
    theme: 'dark',
    showNodeLabels: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Node labels with dark theme.',
      },
    },
  },
};
