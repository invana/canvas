import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeShape, EdgeShape } from '@aspect-ui/canvas-core';

interface ArrowsArgs {
  backgroundColor: string;
  arrowSize: number;
  edgeColor: string;
}

const arrowTypes = ['triangle', 'vee', 'circle', 'diamond', 'square', 'bar'] as const;

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
    });

    await canvas.init();

    // Show all arrow types in a grid
    arrowTypes.forEach((arrowType, i) => {
      const y = i * 70 - (arrowTypes.length * 70) / 2 + 35;
      const sourceX = -180;
      const targetX = 180;

      // Source node
      const sourceNode = new NodeShape({
        data: {
          id: `source-${arrowType}`,
          x: sourceX,
          y,
          shape: 'circle',
          size: 20,
        },
        style: {
          fill: '#e0e0e0',
          stroke: '#666',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Target node
      const targetNode = new NodeShape({
        data: {
          id: `target-${arrowType}`,
          x: targetX,
          y,
          shape: 'circle',
          size: 20,
        },
        style: {
          fill: '#e0e0e0',
          stroke: '#666',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Edge with arrow
      const edge = new EdgeShape({
        data: {
          id: `edge-${arrowType}`,
          source: { x: sourceX + 20, y },
          target: { x: targetX - 20, y },
          pathType: 'line',
          arrowTarget: arrowType,
          arrowSize: args.arrowSize,
        },
        style: {
          stroke: args.edgeColor,
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Label
      const label = new NodeShape({
        data: {
          id: `label-${arrowType}`,
          x: -280,
          y,
          shape: 'roundedRect',
          width: 80,
          height: 24,
          label: arrowType,
        },
        style: {
          fill: '#f5f5f5',
          stroke: '#ddd',
          strokeWidth: 1,
          labelStyle: { fill: '#333', fontSize: 11 },
        },
        registry: canvas.registry,
        interactive: false,
      });

      canvas.addToNodeLayer(sourceNode);
      canvas.addToNodeLayer(targetNode);
      canvas.addToNodeLayer(label);
      canvas.addToEdgeLayer(edge, sourceNode.id, targetNode.id);
    });

    setTimeout(() => canvas.fitContent(40), 100);
  });

  return wrapper;
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
    });

    await canvas.init();

    const combinations = [
      { source: 'triangle', target: 'triangle', label: 'Triangle ↔ Triangle' },
      { source: 'vee', target: 'vee', label: 'Vee ↔ Vee' },
      { source: 'circle', target: 'diamond', label: 'Circle → Diamond' },
    ];

    combinations.forEach((combo, i) => {
      const y = i * 80 - 80;
      const sourceX = -150;
      const targetX = 150;

      // Source node
      const sourceNode = new NodeShape({
        data: {
          id: `source-bi-${i}`,
          x: sourceX,
          y,
          shape: 'circle',
          size: 22,
        },
        style: {
          fill: '#64b5f6',
          stroke: '#1976d2',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Target node
      const targetNode = new NodeShape({
        data: {
          id: `target-bi-${i}`,
          x: targetX,
          y,
          shape: 'circle',
          size: 22,
        },
        style: {
          fill: '#81c784',
          stroke: '#388e3c',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Bidirectional edge
      const edge = new EdgeShape({
        data: {
          id: `edge-bi-${i}`,
          source: { x: sourceX + 22, y },
          target: { x: targetX - 22, y },
          pathType: 'line',
          arrowSource: combo.source,
          arrowTarget: combo.target,
          arrowSize: args.arrowSize,
        },
        style: {
          stroke: args.edgeColor,
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      // Label
      const label = new NodeShape({
        data: {
          id: `label-bi-${i}`,
          x: -310,
          y,
          shape: 'roundedRect',
          width: 130,
          height: 24,
          label: combo.label,
        },
        style: {
          fill: '#fafafa',
          stroke: '#e0e0e0',
          strokeWidth: 1,
          labelStyle: { fill: '#333', fontSize: 10 },
        },
        registry: canvas.registry,
        interactive: false,
      });

      canvas.addToNodeLayer(sourceNode);
      canvas.addToNodeLayer(targetNode);
      canvas.addToNodeLayer(label);
      canvas.addToEdgeLayer(edge, sourceNode.id, targetNode.id);
    });

    setTimeout(() => canvas.fitContent(40), 100);
  });

  return wrapper;
};

const meta: Meta<ArrowsArgs> = {
  title: 'Canvas/Arrows',
  render: (args) => createArrows(args),
  argTypes: {
    backgroundColor: { control: 'color' },
    edgeColor: { control: 'color' },
    arrowSize: { control: { type: 'range', min: 6, max: 24, step: 1 } },
  },
  args: {
    backgroundColor: '#ffffff',
    edgeColor: '#666666',
    arrowSize: 12,
  },
};

export default meta;

type Story = StoryObj<ArrowsArgs>;

export const AllArrowTypes: Story = {};

export const Bidirectional: Story = {
  render: (args) => createBidirectionalArrows(args),
};

export const LargeArrows: Story = {
  args: {
    arrowSize: 20,
    edgeColor: '#e91e63',
  },
};

export const SmallArrows: Story = {
  args: {
    arrowSize: 8,
    edgeColor: '#3f51b5',
  },
};
