import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@invana/canvas-core';

interface CornerRadiusArgs {
  backgroundColor: string;
}

const createCornerRadiusDemo = (args: CornerRadiusArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  wrapper.style.minHeight = '900px';

  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    // Define shapes and their configurations
    const shapes = [
      { type: 'rect', label: 'Rect', size: 50, width: 100, height: 70 },
      { type: 'triangle', label: 'Triangle', size: 50 },
      { type: 'diamond', label: 'Diamond', size: 50 },
      { type: 'pentagon', label: 'Pentagon', size: 50 },
      { type: 'hexagon', label: 'Hexagon', size: 50 },
      { type: 'octagon', label: 'Octagon', size: 50 },
    ];

    // Define three levels of corner radius
    const radiusLevels = [
      { value: 0, label: 'No Rounding (0)', color: '#4a90d9' },
      { value: 8, label: 'Medium (8px)', color: '#50c878' },
      { value: 20, label: 'High (20px)', color: '#ff6b6b' },
    ];

    // Define border styles
    const borderStyles = [
      { strokeStyle: 'solid', label: 'Solid' },
      { strokeStyle: 'dashed', label: 'Dashed' },
      { strokeStyle: 'dotted', label: 'Dotted' },
    ];

    const nodes = [];
    const startX = 150;
    const startY = 100;
    const spacingX = 200;
    const spacingY = 150;

    // Create nodes for each shape type with different corner radius levels
    shapes.forEach((shape, shapeIndex) => {
      radiusLevels.forEach((level, levelIndex) => {
        borderStyles.forEach((borderStyle, borderIndex) => {
          const x = startX + levelIndex * spacingX * 3 + borderIndex * spacingX;
          const y = startY + shapeIndex * spacingY;

          nodes.push({
            data: {
              id: `${shape.type}-radius-${level.value}-border-${borderStyle.strokeStyle}-${shapeIndex}`,
              x,
              y,
              shape: shape.type,
              size: shape.size,
              width: shape.width,
              height: shape.height,
              cornerRadius: level.value,
              label: `${shape.label}`,
            },
            style: {
              fill: level.color,
              stroke: '#2d3748',
              strokeWidth: 2,
              strokeStyle: borderStyle.strokeStyle as any,
              labelStyle: {
                fill: '#ffffff',
                fontSize: 10,
                fontWeight: 'bold',
              },
              labelPosition: 'bottom' as const,
              labelOffsetY: 10,
            },
          });
        });
      });
    });

    // Add column headers - radius levels with border styles
    radiusLevels.forEach((level, levelIndex) => {
      borderStyles.forEach((borderStyle, borderIndex) => {
        const x = startX + levelIndex * spacingX * 3 + borderIndex * spacingX;
        nodes.push({
          data: {
            id: `header-col-${levelIndex}-${borderIndex}`,
            x,
            y: 40,
            shape: 'rect',
            width: 180,
            height: 30,
            cornerRadius: 4,
            label: `${level.label} - ${borderStyle.label}`,
          },
          style: {
            fill: '#2d3748',
            stroke: '#4a5568',
            strokeWidth: 1,
            labelStyle: {
              fill: '#ffffff',
              fontSize: 11,
              fontWeight: 'bold',
            },
          },
          interactive: false,
        });
      });
    });

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1800,
      height: container.clientHeight || 900,
      backgroundColor: args.backgroundColor,
      data: { nodes, edges: [] },
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();
    canvas.fitContent(50);
  });

  return wrapper;
};

const meta: Meta<CornerRadiusArgs> = {
  title: 'Shapes/Corner Radius',
  render: (args) => createCornerRadiusDemo(args),
  argTypes: {
    backgroundColor: { control: 'color' },
  },
  args: {
    backgroundColor: '#1a202c',
  },
};

export default meta;

type Story = StoryObj<CornerRadiusArgs>;

export const AllShapes: Story = {
  args: {
    backgroundColor: '#1a202c',
  },
};

export const LightBackground: Story = {
  args: {
    backgroundColor: '#f7fafc',
  },
};
