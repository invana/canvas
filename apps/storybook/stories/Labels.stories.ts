import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeShape, EdgeShape } from '@aspect-ui/canvas-core';

interface LabelsArgs {
  backgroundColor: string;
  fontSize: number;
}

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
    });

    await canvas.init();

    const shapes = [
      { shape: 'circle', label: 'Circle', x: -200, y: -100 },
      { shape: 'rect', label: 'Rectangle', x: 0, y: -100 },
      { shape: 'roundedRect', label: 'Rounded', x: 200, y: -100 },
      { shape: 'ellipse', label: 'Ellipse', x: -200, y: 100 },
      { shape: 'polygon', label: 'Hexagon', x: 0, y: 100, sides: 6 },
      { shape: 'polygon', label: 'Pentagon', x: 200, y: 100, sides: 5 },
    ];

    const colors = ['#4a90d9', '#50c878', '#ff6b6b', '#ffd93d', '#9b59b6', '#e67e22'];

    shapes.forEach((shapeConfig, i) => {
      const node = new NodeShape({
        data: {
          id: `node-${i}`,
          x: shapeConfig.x,
          y: shapeConfig.y,
          shape: shapeConfig.shape,
          size: 40,
          width: 80,
          height: 50,
          sides: shapeConfig.sides,
          label: shapeConfig.label,
        },
        style: {
          fill: colors[i],
          stroke: '#333',
          strokeWidth: 2,
          labelStyle: {
            fill: '#ffffff',
            fontSize: args.fontSize,
            fontWeight: 'bold',
          },
        },
        registry: canvas.registry,
      });

      canvas.addToNodeLayer(node);
    });

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
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
    });

    await canvas.init();

    const edges = [
      { pathType: 'line', label: 'Line Edge', y: -100 },
      { pathType: 'bezier', label: 'Bezier Edge', y: 0 },
      { pathType: 'orthogonal', label: 'Orthogonal Edge', y: 100 },
    ];

    edges.forEach((edgeConfig, i) => {
      const sourceX = -180;
      const targetX = 180;

      // Source node
      const sourceNode = new NodeShape({
        data: {
          id: `source-label-${i}`,
          x: sourceX,
          y: edgeConfig.y,
          shape: 'circle',
          size: 25,
        },
        style: {
          fill: '#4a90d9',
          stroke: '#333',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Target node
      const targetNode = new NodeShape({
        data: {
          id: `target-label-${i}`,
          x: targetX,
          y: edgeConfig.y,
          shape: 'circle',
          size: 25,
        },
        style: {
          fill: '#50c878',
          stroke: '#333',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Edge with label
      const edge = new EdgeShape({
        data: {
          id: `edge-label-${i}`,
          source: { x: sourceX + 25, y: edgeConfig.y },
          target: { x: targetX - 25, y: edgeConfig.y },
          pathType: edgeConfig.pathType,
          arrowTarget: 'triangle',
          label: edgeConfig.label,
          curvature: 0.3,
        },
        style: {
          stroke: '#666',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      canvas.addToNodeLayer(sourceNode);
      canvas.addToNodeLayer(targetNode);
      canvas.addToEdgeLayer(edge, sourceNode.id, targetNode.id);
    });

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
};

const createMultilineLabels = (args: LabelsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Multiline Labels</strong> - Labels with multiple lines';
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
    });

    await canvas.init();

    const nodes = [
      { label: 'User\nService', x: -200, fill: '#4a90d9' },
      { label: 'Auth\nMiddleware', x: 0, fill: '#50c878' },
      { label: 'Database\nConnection', x: 200, fill: '#ff6b6b' },
    ];

    nodes.forEach((nodeConfig, i) => {
      const node = new NodeShape({
        data: {
          id: `multiline-${i}`,
          x: nodeConfig.x,
          y: 0,
          shape: 'roundedRect',
          width: 100,
          height: 60,
          label: nodeConfig.label,
        },
        style: {
          fill: nodeConfig.fill,
          stroke: '#333',
          strokeWidth: 2,
          labelStyle: {
            fill: '#ffffff',
            fontSize: args.fontSize,
            fontWeight: 'bold',
            lineHeight: 1.4,
          },
        },
        registry: canvas.registry,
      });

      canvas.addToNodeLayer(node);
    });

    // Add edges between nodes
    const edgeData = [
      { source: -150, target: -50 },
      { source: 50, target: 150 },
    ];

    edgeData.forEach((e, i) => {
      const edge = new EdgeShape({
        data: {
          id: `multiline-edge-${i}`,
          source: { x: e.source, y: 0 },
          target: { x: e.target, y: 0 },
          pathType: 'line',
          arrowTarget: 'triangle',
        },
        style: {
          stroke: '#999',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      canvas.addToEdgeLayer(edge);
    });

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
};

const meta: Meta<LabelsArgs> = {
  title: 'Canvas/Labels',
  render: (args) => createNodeLabels(args),
  argTypes: {
    backgroundColor: { control: 'color' },
    fontSize: { control: { type: 'range', min: 8, max: 20, step: 1 } },
  },
  args: {
    backgroundColor: '#ffffff',
    fontSize: 12,
  },
};

export default meta;

type Story = StoryObj<LabelsArgs>;

export const NodeLabels: Story = {};

export const EdgeLabels: Story = {
  render: (args) => createEdgeLabels(args),
};

export const MultilineLabels: Story = {
  render: (args) => createMultilineLabels(args),
};

export const LargeFontSize: Story = {
  args: {
    fontSize: 16,
  },
};
