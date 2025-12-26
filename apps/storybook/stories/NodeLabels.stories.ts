import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface NodeLabelsArgs {
  backgroundColor: string;
  showLabels: boolean;
  labelPosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

// Generate node data with labels in different positions
const generateLabelData = (position: string): CanvasData => {
  const shapes = ['circle', 'rect', 'roundedRect', 'ellipse', 'triangle', 'diamond', 'hexagon', 'pentagon', 'octagon'] as const;
  
  return {
    nodes: shapes.map((shape, i) => ({
      id: `node-${i}`,
      x: 150 + (i % 3) * 250,
      y: 150 + Math.floor(i / 3) * 200,
      shape,
      size: 70,
      label: `${shape}`,
      labelPlacement: position as any,
      labelStyle: {
        fontSize: 14,
        fill: '#ffffff',
        fontWeight: '500',
      },
      fill: '#4a90e2',
      stroke: '#2d5a8c',
      strokeWidth: 2,
    })),
    edges: [],
  };
};

const meta: Meta<NodeLabelsArgs> = {
  title: 'Canvas/Node Labels',
  argTypes: {
    backgroundColor: { 
      control: 'color',
      description: 'Background color of the canvas',
    },
    showLabels: {
      control: 'boolean',
      description: 'Show/hide node labels',
    },
    labelPosition: {
      control: 'select',
      options: ['center', 'top', 'bottom', 'left', 'right'],
      description: 'Position of labels relative to nodes',
    },
  },
  args: {
    backgroundColor: '#1a1a2e',
    showLabels: true,
    labelPosition: 'center',
  },
};

export default meta;
type Story = StoryObj<NodeLabelsArgs>;

// Story: All shapes with centered labels
export const CenteredLabels: Story = {
  args: {
    labelPosition: 'center',
  },
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Centered Labels on All Shapes</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Labels positioned at the center of each node shape.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 800px; height: 600px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 600,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const data = generateLabelData('center');
      if (!args.showLabels) {
        data.nodes.forEach(node => { delete node.label; });
      }
      
      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Labels positioned at the top
export const TopLabels: Story = {
  args: {
    labelPosition: 'top',
  },
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Top-Positioned Labels</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Labels positioned above each node - useful for node badges or notifications.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 800px; height: 600px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 600,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const data = generateLabelData('top');
      if (!args.showLabels) {
        data.nodes.forEach(node => { delete node.label; });
      }
      
      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Labels positioned at the bottom
export const BottomLabels: Story = {
  args: {
    labelPosition: 'bottom',
  },
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Bottom-Positioned Labels</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Labels positioned below each node - classic graph visualization style.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 800px; height: 600px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 600,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const data = generateLabelData('bottom');
      if (!args.showLabels) {
        data.nodes.forEach(node => { delete node.label; });
      }
      
      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Status badges with emoji
export const StatusBadges: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Status Badges</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Using labels with emoji to show status indicators - like notification badges.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 800px; height: 400px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 400,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const statuses = [
        { label: '✓ Active', fill: '#27ae60', emoji: '●' },
        { label: '⚠ Warning', fill: '#f39c12', emoji: '▲' },
        { label: '✖ Error', fill: '#e74c3c', emoji: '■' },
        { label: '○ Pending', fill: '#95a5a6', emoji: '○' },
        { label: '✓ Success', fill: '#2ecc71', emoji: '●' },
      ];

      const data: CanvasData = {
        nodes: statuses.map((status, i) => ({
          id: `status-${i}`,
          x: 150 + i * 140,
          y: 200,
          shape: 'circle' as const,
          size: 60,
          label: status.emoji,
          labelStyle: {
            fontSize: 24,
            fill: '#ffffff',
          },
          fill: status.fill,
          stroke: '#ffffff',
          strokeWidth: 2,
        })),
        edges: [],
      };

      if (!args.showLabels) {
        data.nodes.forEach(node => { delete node.label; });
      }
      
      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Notification counts
export const NotificationCounts: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Notification Count Badges</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Using labels to display notification counts on nodes.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 800px; height: 400px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 400,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const counts = [1, 3, 5, 12, 99];

      const data: CanvasData = {
        nodes: counts.map((count, i) => ({
          id: `notif-${i}`,
          x: 150 + i * 140,
          y: 200,
          shape: 'roundedRect' as const,
          size: 70,
          label: String(count),
          labelStyle: {
            fontSize: count > 9 ? 18 : 24,
            fill: '#ffffff',
            fontWeight: 'bold',
          },
          fill: count > 9 ? '#e74c3c' : '#3498db',
          stroke: '#ffffff',
          strokeWidth: 2,
        })),
        edges: [],
      };

      if (!args.showLabels) {
        data.nodes.forEach(node => { delete node.label; });
      }
      
      canvas.render(data);
    }, 0);

    return wrapper;
  },
};
