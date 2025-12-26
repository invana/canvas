import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface LabelsArgs {
  backgroundColor: string;
  fontSize: number;
}

const colors = ['#4a90d9', '#50c878', '#ff6b6b', '#ffd93d', '#9b59b6', '#e67e22'];

const generateNodeLabelsData = (fontSize: number): CanvasData => {
  const shapes = [
    { shape: 'circle', label: 'Circle', x: -200, y: -100 },
    { shape: 'rect', label: 'Rectangle', x: 0, y: -100 },
    { shape: 'roundedRect', label: 'Rounded', x: 200, y: -100 },
    { shape: 'ellipse', label: 'Ellipse', x: -200, y: 100 },
    { shape: 'hexagon', label: 'Hexagon', x: 0, y: 100 },
    { shape: 'pentagon', label: 'Pentagon', x: 200, y: 100 },
  ];

  const nodes = shapes.map((shapeConfig, i) => ({
    id: `node-${i}`,
    x: shapeConfig.x,
    y: shapeConfig.y,
    shape: shapeConfig.shape,
    size: 40,
    width: 80,
    height: 50,
    label: shapeConfig.label,
    fill: colors[i],
    stroke: '#333',
    strokeWidth: 2,
    labelStyle: {
      fill: '#ffffff',
      fontSize,
      fontWeight: 'bold',
    },
  }));

  return { nodes, edges: [] };
};

const createNodeLabels = (args: LabelsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Node Labels</strong> - Labels on different shape types';
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
      data: generateNodeLabelsData(args.fontSize),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();
  });

  return wrapper;
};

const generateEdgeLabelsData = (): CanvasData => {
  const edgeConfigs = [
    { pathType: 'line', label: 'Line Edge', y: -100 },
    { pathType: 'bezier', label: 'Bezier Edge', y: 0 },
    { pathType: 'orthogonal', label: 'Orthogonal Edge', y: 100 },
  ];

  const nodes = [];
  const edges = [];

  edgeConfigs.forEach((edgeConfig, i) => {
    const sourceX = -180;
    const targetX = 180;

    nodes.push({
      id: `source-label-${i}`,
      x: sourceX,
      y: edgeConfig.y,
      shape: 'circle' as const,
      size: 25,
      fill: '#4a90d9',
      stroke: '#333',
      strokeWidth: 2,
    });

    nodes.push({
      id: `target-label-${i}`,
      x: targetX,
      y: edgeConfig.y,
      shape: 'circle' as const,
      size: 25,
      fill: '#50c878',
      stroke: '#333',
      strokeWidth: 2,
    });

    edges.push({
      id: `edge-label-${i}`,
      source: `source-label-${i}`,
      target: `target-label-${i}`,
      pathType: edgeConfig.pathType as any,
      arrowTarget: 'triangle' as const,
      label: edgeConfig.label,
      curvature: 0.3,
      stroke: '#666',
      strokeWidth: 2,
    });
  });

  return { nodes, edges };
};

const createEdgeLabels = (args: LabelsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Edge Labels</strong> - Labels on different edge types';
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
      data: generateEdgeLabelsData(),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();
  });

  return wrapper;
};

const generateLabelPositionsData = (): CanvasData => {
  const positions = ['center', 'top', 'bottom', 'left', 'right'] as const;

  const nodes = positions.map((pos, i) => ({
    id: `pos-${pos}`,
    x: (i - 2) * 150,
    y: 0,
    shape: 'roundedRect' as const,
    width: 100,
    height: 60,
    label: pos.charAt(0).toUpperCase() + pos.slice(1),
    fill: colors[i % colors.length],
    stroke: '#333',
    strokeWidth: 2,
    labelPosition: pos,
    labelOffsetY: pos === 'bottom' ? 15 : pos === 'top' ? -15 : 0,
    labelOffsetX: pos === 'left' ? -15 : pos === 'right' ? 15 : 0,
    labelStyle: {
      fill: pos === 'center' ? '#ffffff' : '#333333',
      fontSize: 12,
      fontWeight: 'bold',
    },
  }));

  return { nodes, edges: [] };
};

const createLabelPositions = (args: LabelsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Label Positions</strong> - Different label placement options';
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
      data: generateLabelPositionsData(),
      fitPadding: 60,
    });

    await canvas.init();
    canvas.render();
  });

  return wrapper;
};

const meta: Meta<LabelsArgs> = {
  title: 'Canvas/Labels',
  argTypes: {
    backgroundColor: { control: 'color' },
    fontSize: { control: { type: 'range', min: 8, max: 24, step: 1 } },
  },
  args: {
    backgroundColor: '#ffffff',
    fontSize: 12,
  },
};

export default meta;

type Story = StoryObj<LabelsArgs>;

export const NodeLabels: Story = {
  render: (args) => createNodeLabels(args),
};

export const EdgeLabels: Story = {
  render: (args) => createEdgeLabels(args),
};

export const LabelPositions: Story = {
  render: (args) => createLabelPositions(args),
};

export const LargeFontSize: Story = {
  render: (args) => createNodeLabels(args),
  args: {
    fontSize: 18,
  },
};
