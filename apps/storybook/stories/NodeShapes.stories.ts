import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface NodeShapesArgs {
  backgroundColor: string;
  showLabels: boolean;
}

const shapeConfigs = [
  { name: 'circle', label: 'Circle' },
  { name: 'rect', label: 'Rectangle' },
  { name: 'roundedRect', label: 'Rounded Rect' },
  { name: 'ellipse', label: 'Ellipse' },
  { name: 'triangle', label: 'Triangle' },
  { name: 'diamond', label: 'Diamond' },
  { name: 'pentagon', label: 'Pentagon' },
  { name: 'hexagon', label: 'Hexagon' },
  { name: 'octagon', label: 'Octagon' },
] as const;

const colors = [
  '#4a90d9', '#50c878', '#ff6b6b', '#ffd93d', 
  '#6c5ce7', '#00cec9', '#fd79a8', '#e17055', '#00b894'
];

const generateShapesData = (showLabels: boolean): CanvasData => {
  const nodes = [];
  const cols = 5;
  const spacingX = 160;
  const spacingY = 140;

  shapeConfigs.forEach((shape, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * spacingX - (cols - 1) * spacingX / 2;
    const y = row * spacingY - spacingY / 2;

    nodes.push({
      id: `shape-${shape.name}`,
      x,
      y,
      shape: shape.name,
      size: 45,
      label: showLabels ? shape.label : undefined,
      style: {
        fill: colors[i % colors.length],
        stroke: '#333',
        strokeWidth: 2,
        hoverFill: colors[(i + 3) % colors.length],
        labelPosition: 'bottom' as const,
        labelOffsetY: 12,
        labelStyle: { fill: '#333', fontSize: 12 },
      },
    });
  });

  return { nodes, edges: [] };
};

const createNodeShapes = (args: NodeShapesArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Node Shapes</strong> - All available primitive shapes';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 400,
      backgroundColor: args.backgroundColor,
      data: generateShapesData(args.showLabels),
      fitPadding: 60,
    });

    await canvas.init();
    canvas.render();

    // Add hover handlers after render
    canvas.getNodes().forEach((node) => {
      node.on('pointerover', () => {
        const shapeConfig = shapeConfigs.find(s => `shape-${s.name}` === node.id);
        if (shapeConfig) {
          info.innerHTML = `<strong>Hovering:</strong> ${shapeConfig.label} (${shapeConfig.name})`;
        }
      });
      node.on('pointerout', () => {
        info.innerHTML = '<strong>Node Shapes</strong> - Hover over shapes to see their names';
      });
    });
  });

  return wrapper;
};

const meta: Meta<NodeShapesArgs> = {
  title: 'Canvas/Node Shapes',
  render: (args) => createNodeShapes(args),
  argTypes: {
    backgroundColor: { control: 'color' },
    showLabels: { control: 'boolean' },
  },
  args: {
    backgroundColor: '#ffffff',
    showLabels: true,
  },
};

export default meta;

type Story = StoryObj<NodeShapesArgs>;

export const AllShapes: Story = {};

export const WithoutLabels: Story = {
  args: {
    showLabels: false,
  },
};

export const DarkTheme: Story = {
  args: {
    backgroundColor: '#1a1a2e',
  },
};
