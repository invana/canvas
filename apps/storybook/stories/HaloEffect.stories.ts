import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeStates } from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'Visual Gallery/Halo Effect',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * Halo effect demonstration showing different states
 */
export const HaloStates: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '500px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 1000,
        height: 400,
      });

      await canvas.init();

      // Default
      canvas.addNode({
        data: { id: 'default', x: 150, y: 150, label: 'default', shape: 'circle' },
        style: {
          fill: 0x1890ff,
          stroke: '#1890ff',
          strokeWidth: 1,
          radius: 45,
        },
      });

      // Halo (hovered state with glow effect)
      canvas.addNode({
        data: { id: 'halo', x: 350, y: 150, label: 'halo', shape: 'circle' },
        style: {
          fill: 0x1890ff,
          stroke: '#1890ff',
          strokeWidth: 1,
          radius: 45,
        },
        states: ['hovered'],
      });

      // Active
      canvas.addNode({
        data: { id: 'active', x: 550, y: 150, label: 'active', shape: 'circle' },
        style: {
          fill: 0x1890ff,
          stroke: '#1890ff',
          strokeWidth: 1,
          radius: 45,
        },
      });

      // Selected
      canvas.addNode({
        data: { id: 'selected', x: 750, y: 150, label: 'selected', shape: 'circle' },
        style: {
          fill: 0x722ed1,
          stroke: '#722ed1',
          strokeWidth: 1,
          radius: 45,
        },
        states: ['selected'],
      });

      // Highlight
      canvas.addNode({
        data: { id: 'highlight', x: 150, y: 300, label: 'highlight', shape: 'circle' },
        style: {
          fill: 0xfaad14,
          stroke: '#faad14',
          strokeWidth: 1,
          radius: 45,
        },
        states: ['highlighted'],
      });

      // Inactive
      canvas.addNode({
        data: { id: 'inactive', x: 400, y: 300, label: 'inactive', shape: 'circle' },
        style: {
          fill: 0xd3e5f7,
          stroke: '#d3e5f7',
          strokeWidth: 1,
          radius: 45,
        },
      });

      // Disabled
      canvas.addNode({
        data: { id: 'disabled', x: 650, y: 300, label: 'disabled', shape: 'circle' },
        style: {
          fill: 0xe8e8e8,
          stroke: '#bfbfbf',
          strokeWidth: 1,
          radius: 45,
        },
        states: ['disabled'],
      });

      const info = document.createElement('div');
      info.style.marginTop = '20px';
      info.style.padding = '12px';
      info.style.background = '#f5f5f5';
      info.style.borderRadius = '4px';
      info.style.fontSize = '13px';
      info.style.color = '#595959';
      info.textContent = 'Use states: [\'hovered\', \'selected\', \'highlighted\', \'disabled\'] to activate states directly on node creation';
      
      container.appendChild(info);
    });

    return container;
  },
};
