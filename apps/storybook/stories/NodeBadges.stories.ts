import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface NodeBadgesArgs {
  backgroundColor: string;
  showBadges: boolean;
}

const meta: Meta<NodeBadgesArgs> = {
  title: 'Canvas/Node Badges',
  argTypes: {
    backgroundColor: { 
      control: 'color',
      description: 'Background color of the canvas',
    },
    showBadges: {
      control: 'boolean',
      description: 'Show/hide badges on nodes',
    },
  },
  args: {
    backgroundColor: '#1a1a2e',
    showBadges: true,
  },
};

export default meta;
type Story = StoryObj<NodeBadgesArgs>;

// Story: All 8 badge positions on all shapes in a grid
export const AllPositions: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">All 8 Badge Positions on All Shapes</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Grid showing all 8 badge positions (top, top-right, right, bottom-right, bottom, bottom-left, left, top-left) on every node shape.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 1400px; height: 1000px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 1400,
        height: 1000,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const shapes = ['circle', 'rect', 'roundedRect', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon'] as const;
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];
      
      const badges = args.showBadges ? [
        { text: '1', position: 'top' as const, color: colors[0] },
        { text: '2', position: 'top-right' as const, color: colors[1] },
        { text: '3', position: 'right' as const, color: colors[2] },
        { text: '4', position: 'bottom-right' as const, color: colors[3] },
        { text: '5', position: 'bottom' as const, color: colors[4] },
        { text: '6', position: 'bottom-left' as const, color: colors[5] },
        { text: '7', position: 'left' as const, color: colors[6] },
        { text: '8', position: 'top-left' as const, color: colors[7] },
      ] : [];

      const data: CanvasData = {
        nodes: shapes.map((shape, i) => ({
          id: `node-${i}`,
          x: 240 + (i % 3) * 400,
          y: 200 + Math.floor(i / 3) * 300,
          shape,
          size: 60,
          label: shape,
          labelPlacement: 'center' as const,
          fill: '#4a90e2',
          stroke: '#2d5a8c',
          strokeWidth: 2,
          badges,
        })),
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Single node with all 8 badges
export const SingleNodeAllBadges: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Single Circle with All 8 Badge Positions</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Shows all 8 badge positions on a single circle for reference.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 600px; height: 500px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 600,
        height: 500,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];

      const data: CanvasData = {
        nodes: [{
          id: 'center-node',
          x: 300,
          y: 250,
          shape: 'circle',
          size: 80,
          label: 'Circle',
          fill: '#4a90e2',
          stroke: '#2d5a8c',
          strokeWidth: 3,
          badges: args.showBadges ? [
            { text: '1', position: 'top', color: colors[0] },
            { text: '2', position: 'top-right', color: colors[1] },
            { text: '3', position: 'right', color: colors[2] },
            { text: '4', position: 'bottom-right', color: colors[3] },
            { text: '5', position: 'bottom', color: colors[4] },
            { text: '6', position: 'bottom-left', color: colors[5] },
            { text: '7', position: 'left', color: colors[6] },
            { text: '8', position: 'top-left', color: colors[7] },
          ] : [],
        }],
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Notification badges on different shapes
export const NotificationBadges: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Notification Count Badges</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Notification counts displayed on different node shapes using badges.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 900px; height: 600px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 900,
        height: 600,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const shapes = ['circle', 'rect', 'roundedRect', 'ellipse', 'triangle', 'diamond', 'hexagon', 'pentagon', 'octagon'] as const;
      const counts = [3, 7, 12, 25, 99, 5, 15, 8, 42];

      const data: CanvasData = {
        nodes: shapes.map((shape, i) => ({
          id: `node-${i}`,
          x: 150 + (i % 3) * 280,
          y: 150 + Math.floor(i / 3) * 200,
          shape,
          size: 70,
          label: shape,
          fill: '#4a90e2',
          stroke: '#2d5a8c',
          strokeWidth: 2,
          badges: args.showBadges ? [{
            text: String(counts[i]),
            position: 'top-right',
            color: counts[i] > 20 ? '#e74c3c' : '#3498db',
            size: counts[i] > 20 ? 28 : 24,
          }] : [],
        })),
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Status badges
export const StatusBadges: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Status Indicator Badges</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Using badges to show status with icons: Active (●), Warning (⚠), Error (✖), Pending (○), Success (✓).
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
        { label: 'Active', icon: '●', color: '#27ae60' },
        { label: 'Warning', icon: '⚠', color: '#f39c12' },
        { label: 'Error', icon: '✖', color: '#e74c3c' },
        { label: 'Pending', icon: '○', color: '#95a5a6' },
        { label: 'Success', icon: '✓', color: '#2ecc71' },
      ];

      const data: CanvasData = {
        nodes: statuses.map((status, i) => ({
          id: `status-${i}`,
          x: 150 + i * 140,
          y: 200,
          shape: 'circle',
          size: 60,
          label: status.label,
          labelPlacement: 'bottom',
          fill: '#34495e',
          stroke: '#2c3e50',
          strokeWidth: 2,
          badges: args.showBadges ? [{
            text: status.icon,
            position: 'top-right',
            color: status.color,
            fontSize: 16,
            size: 26,
          }] : [],
        })),
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Multiple badges per node
export const MultipleBadges: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Multiple Badges Per Node</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Nodes can have multiple badges at different positions for complex status indicators.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 900px; height: 500px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 900,
        height: 500,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const data: CanvasData = {
        nodes: [
          {
            id: 'node-1',
            x: 200,
            y: 250,
            shape: 'roundedRect',
            size: 80,
            label: 'Server',
            fill: '#3498db',
            stroke: '#2980b9',
            strokeWidth: 2,
            badges: args.showBadges ? [
              { text: '5', position: 'top-right', color: '#e74c3c' },
              { text: '✓', position: 'top-left', color: '#2ecc71', fontSize: 14 },
            ] : [],
          },
          {
            id: 'node-2',
            x: 450,
            y: 250,
            shape: 'hexagon',
            size: 80,
            label: 'Database',
            fill: '#9b59b6',
            stroke: '#8e44ad',
            strokeWidth: 2,
            badges: args.showBadges ? [
              { text: '12', position: 'top-right', color: '#f39c12' },
              { text: '●', position: 'bottom-right', color: '#27ae60', fontSize: 14 },
              { text: '⚠', position: 'left', color: '#e67e22', fontSize: 14 },
            ] : [],
          },
          {
            id: 'node-3',
            x: 700,
            y: 250,
            shape: 'diamond',
            size: 80,
            label: 'Gateway',
            fill: '#1abc9c',
            stroke: '#16a085',
            strokeWidth: 2,
            badges: args.showBadges ? [
              { text: '3', position: 'top', color: '#3498db' },
              { text: '✓', position: 'right', color: '#2ecc71', fontSize: 14 },
              { text: '✖', position: 'bottom', color: '#e74c3c', fontSize: 14 },
              { text: '○', position: 'left', color: '#95a5a6', fontSize: 14 },
            ] : [],
          },
        ],
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story: Badge size variations
export const BadgeSizes: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #e0e0e0; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Badge Size Variations</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Badges can be customized with different sizes and font sizes.
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

      const sizes = [
        { size: 20, fontSize: 10, label: 'Small' },
        { size: 24, fontSize: 12, label: 'Medium' },
        { size: 32, fontSize: 16, label: 'Large' },
        { size: 40, fontSize: 20, label: 'XLarge' },
      ];

      const data: CanvasData = {
        nodes: sizes.map((config, i) => ({
          id: `size-${i}`,
          x: 150 + i * 180,
          y: 200,
          shape: 'circle',
          size: 70,
          label: config.label,
          labelPlacement: 'bottom',
          fill: '#4a90e2',
          stroke: '#2d5a8c',
          strokeWidth: 2,
          badges: args.showBadges ? [{
            text: '99',
            position: 'top-right',
            color: '#e74c3c',
            size: config.size,
            fontSize: config.fontSize,
          }] : [],
        })),
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};
