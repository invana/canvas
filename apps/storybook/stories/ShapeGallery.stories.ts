import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeStates } from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'Visual Gallery/Shape Showcase',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * Complete gallery showing each shape in all available states
 */
export const NodeShapesGallery: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '900px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 1400,
        height: 850,
      });

      await canvas.init();

      const shapes = ['circle', 'rect', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon'];
      const startX = 120;
      const startY = 100;
      const spacingX = 180;
      const spacingY = 160;

      shapes.forEach((shape, col) => {
        const x = startX + col * spacingX;

        // Row 1: Active
        canvas.addNode({
          data: { id: `${shape}-active`, x, y: startY, label: 'Active', shape },
          states: ['active'],
        });
x
        // Row 2: Selected (with halo)
        canvas.addNode({
          data: { id: `${shape}-selected`, x, y: startY + spacingY, label: 'Selected', shape, states: ['selected'], },
          
        });

        // Row 3: Highlighted (black border)
        canvas.addNode({
          data: { id: `${shape}-highlighted`, x, y: startY + spacingY * 2, label: 'Highlight', shape },
          states: ['highlighted'],
        });

        // Row 4: Inactive
        canvas.addNode({
          data: { id: `${shape}-inactive`, x, y: startY + spacingY * 3, label: 'Inactive', shape },
        });

        // Row 5: Disabled (no interactions)
        canvas.addNode({
          data: { id: `${shape}-disabled`, x, y: startY + spacingY * 4, label: 'Disabled', shape },
          states: ['disabled'],
        });
      });

      const info = document.createElement('div');
      info.style.marginTop = '20px';
      info.style.padding = '12px';
      info.style.background = '#f5f5f5';
      info.style.borderRadius = '4px';
      info.style.fontSize = '13px';
      info.style.color = '#595959';
      info.textContent = 'Row 1: Active • Row 2: Selected (halo) • Row 3: Highlighted (black border) • Row 4: Inactive • Row 5: Disabled (no interactions)';
      
      container.appendChild(info);
    });

    return container;
  },
};
