import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface ArrowsArgs {
  backgroundColor: string;
  arrowSize: number;
  edgeColor: string;
}

const arrowTypes = ['triangle', 'vee', 'circle', 'diamond', 'square', 'bar'] as const;

const generateArrowsData = (arrowSize: number, edgeColor: string): CanvasData => {
  const nodes = [];
  const edges = [];

  arrowTypes.forEach((arrowType, i) => {
    const y = i * 70 - (arrowTypes.length * 70) / 2 + 35;
    const sourceX = -180;
    const targetX = 180;

    // Source node
    nodes.push({
      id: `source-${arrowType}`,
      x: sourceX,
      y,
      shape: 'circle' as const,
      size: 20,
      style: {
        fill: '#e0e0e0',
        stroke: '#666',
        strokeWidth: 2,
      },
    });

    // Target node
    nodes.push({
      id: `target-${arrowType}`,
      x: targetX,
      y,
      shape: 'circle' as const,
      size: 20,
      style: {
        fill: '#e0e0e0',
        stroke: '#666',
        strokeWidth: 2,
      },
    });

    // Label
    nodes.push({
      id: `label-${arrowType}`,
      x: -280,
      y,
      shape: 'rect' as const,
      width: 80,
      height: 24,
      cornerRadius: 8,
      label: arrowType,
      style: {
        fill: '#f5f5f5',
        stroke: '#ddd',
        strokeWidth: 1,
        labelStyle: { fill: '#333', fontSize: 11 },
      },
      interactive: false,
      draggable: false,
    });

    // Edge
    edges.push({
      id: `edge-${arrowType}`,
      source: `source-${arrowType}`,
      target: `target-${arrowType}`,
      pathType: 'line' as const,
      arrowTarget: arrowType,
      arrowSize,
      style: {
        stroke: edgeColor,
        strokeWidth: 2,
      },
    });
  });

  return { nodes, edges };
};

const createArrows = (args: ArrowsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Arrow Types</strong> - Different arrow head styles';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '500px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 500,
      backgroundColor: args.backgroundColor,
      data: generateArrowsData(args.arrowSize, args.edgeColor),
      fitPadding: 40,
    });

    await canvas.init();
    canvas.render();
  });

  return wrapper;
};

const generateBidirectionalData = (arrowSize: number, edgeColor: string): CanvasData => {
  const combinations = [
    { source: 'triangle', target: 'triangle', label: 'Triangle ↔ Triangle' },
    { source: 'vee', target: 'vee', label: 'Vee ↔ Vee' },
    { source: 'circle', target: 'diamond', label: 'Circle → Diamond' },
  ];

  const nodes = [];
  const edges = [];

  combinations.forEach((combo, i) => {
    const y = i * 80 - 80;
    const sourceX = -150;
    const targetX = 150;

    nodes.push({
      id: `source-bi-${i}`,
      x: sourceX,
      y,
      shape: 'circle' as const,
      size: 22,
      style: {
        fill: '#64b5f6',
        stroke: '#1976d2',
        strokeWidth: 2,
      },
    });

    nodes.push({
      id: `target-bi-${i}`,
      x: targetX,
      y,
      shape: 'circle' as const,
      size: 22,
      style: {
        fill: '#81c784',
        stroke: '#388e3c',
        strokeWidth: 2,
      },
    });

    nodes.push({
      id: `label-bi-${i}`,
      x: -310,
      y,
      shape: 'rect' as const,
      width: 130,
      height: 24,
      cornerRadius: 8,
      label: combo.label,
      style: {
        fill: '#fafafa',
        stroke: '#e0e0e0',
        strokeWidth: 1,
        labelStyle: { fill: '#333', fontSize: 10 },
      },
      interactive: false,
      draggable: false,
    });

    edges.push({
      id: `edge-bi-${i}`,
      source: `source-bi-${i}`,
      target: `target-bi-${i}`,
      pathType: 'line' as const,
      arrowSource: combo.source as any,
      arrowTarget: combo.target as any,
      arrowSize,
      style: {
        stroke: edgeColor,
        strokeWidth: 2,
      },
    });
  });

  return { nodes, edges };
};

const createBidirectionalArrows = (args: ArrowsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Bidirectional Arrows</strong> - Arrows on both ends';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '300px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 300,
      backgroundColor: args.backgroundColor,
      data: generateBidirectionalData(args.arrowSize, args.edgeColor),
      fitPadding: 40,
    });

    await canvas.init();
    canvas.render();
  });

  return wrapper;
};

const meta: Meta<ArrowsArgs> = {
  title: 'Canvas/Arrows',
  argTypes: {
    backgroundColor: { control: 'color' },
    arrowSize: { control: { type: 'range', min: 5, max: 20, step: 1 } },
    edgeColor: { control: 'color' },
  },
  args: {
    backgroundColor: '#ffffff',
    arrowSize: 12,
    edgeColor: '#666666',
  },
};

export default meta;

type Story = StoryObj<ArrowsArgs>;

export const AllArrowTypes: Story = {
  render: (args) => createArrows(args),
};

export const BidirectionalArrows: Story = {
  render: (args) => createBidirectionalArrows(args),
};

export const LargeArrows: Story = {
  render: (args) => createArrows(args),
  args: {
    arrowSize: 18,
  },
};

export const ColoredArrows: Story = {
  render: (args) => createArrows(args),
  args: {
    edgeColor: '#e91e63',
  },
};
