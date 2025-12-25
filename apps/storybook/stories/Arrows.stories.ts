/**
 * Arrow Types Stories - Showcases all available arrow head types
 */

import type { Meta, StoryObj } from '@storybook/html';
import {
  Canvas,
  type ArrowHeadType,
} from '@aspect-ui/canvas-core';

// All available arrow types
const ARROW_TYPES: ArrowHeadType[] = [
  'triangle',
  'triangleOpen',
  'circle',
  'circleOpen',
  'diamond',
  'diamondOpen',
  'vee',
  'rect',
  'rectOpen',
  'triangleRect',
  'simple',
  'none',
];

const meta: Meta = {
  title: 'Canvas/Arrows',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    targetArrowType: {
      control: { type: 'select' },
      options: ARROW_TYPES,
      description: 'Target arrow head type',
    },
    sourceArrowType: {
      control: { type: 'select' },
      options: ARROW_TYPES,
      description: 'Source arrow head type',
    },
    arrowSize: {
      control: { type: 'range', min: 5, max: 25, step: 1 },
      description: 'Arrow size',
    },
    arrowFill: {
      control: { type: 'color' },
      description: 'Arrow fill color',
    },
    edgeType: {
      control: { type: 'select' },
      options: ['straight', 'bezier', 'orthogonal'],
      description: 'Edge type',
    },
  },
};

export default meta;

interface ArrowArgs {
  targetArrowType: ArrowHeadType;
  sourceArrowType: ArrowHeadType;
  arrowSize: number;
  arrowFill: string;
  edgeType: 'straight' | 'bezier' | 'orthogonal';
}

// Helper to create a properly sized container
function createCanvasContainer(height = 600): { wrapper: HTMLElement; container: HTMLElement } {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = `${height}px`;
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const container = document.createElement('div');
  container.id = `canvas-arrows-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = `${height - 20}px`;
  container.style.position = 'relative';
  wrapper.appendChild(container);

  return { wrapper, container };
}

// ============================================================================
// All Arrow Types Showcase
// ============================================================================

export const AllArrowTypes: StoryObj<{ arrowSize: number; arrowFill: string }> = {
  args: {
    arrowSize: 12,
    arrowFill: '#666666',
  },
  render: (args) => {
    const { wrapper, container } = createCanvasContainer(600);

    requestAnimationFrame(async () => {
      if (container.clientWidth === 0) container.style.width = '500px';
      if (container.clientHeight === 0) container.style.height = '600px';

      const canvas = new Canvas(container, {
        theme: 'light',
        autoResize: true,
      });

      await canvas.initialize();

      // Create nodes in two columns
      const leftX = -120;
      const rightX = 120;
      const startY = -250;
      const spacing = 45;

      ARROW_TYPES.forEach((arrowType, index) => {
        const y = startY + index * spacing;

        // Source node
        canvas.addNode({
          id: `source-${arrowType}`,
          x: leftX,
          y,
          style: {
            shape: 'circle',
            size: 24,
            fill: '#4CAF50',
            stroke: '#388E3C',
            strokeWidth: 2,
          },
        });

        // Target node
        canvas.addNode({
          id: `target-${arrowType}`,
          x: rightX,
          y,
          style: {
            shape: 'circle',
            size: 24,
            fill: '#2196F3',
            stroke: '#1976D2',
            strokeWidth: 2,
          },
        });

        // Edge with specific arrow type
        canvas.addEdge({
          id: `edge-${arrowType}`,
          source: `source-${arrowType}`,
          target: `target-${arrowType}`,
          label: arrowType,
          style: {
            type: 'straight',
            stroke: '#757575',
            strokeWidth: 2,
            targetArrow: {
              type: arrowType,
              size: args.arrowSize,
              fill: args.arrowFill,
            },
            label: {
              visible: true,
              text: arrowType,
              fontSize: 11,
              textColor: '#424242',
              position: 'middle',
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(40), 100);
    });

    return wrapper;
  },
};

// ============================================================================
// Bidirectional Arrows
// ============================================================================

export const BidirectionalArrows: StoryObj<ArrowArgs> = {
  args: {
    targetArrowType: 'triangle',
    sourceArrowType: 'circle',
    arrowSize: 10,
    arrowFill: '#666666',
    edgeType: 'straight',
  },
  render: (args) => {
    const { wrapper, container } = createCanvasContainer(400);

    requestAnimationFrame(async () => {
      if (container.clientWidth === 0) container.style.width = '500px';
      if (container.clientHeight === 0) container.style.height = '400px';

      const canvas = new Canvas(container, {
        theme: 'light',
        autoResize: true,
      });

      await canvas.initialize();

      // Create source node
      canvas.addNode({
        id: 'source',
        x: -100,
        y: 0,
        style: {
          shape: 'rectangle',
          width: 80,
          height: 40,
          fill: '#4CAF50',
          stroke: '#388E3C',
          strokeWidth: 2,
          label: {
            visible: true,
            text: 'Source',
            fontSize: 12,
            textColor: '#ffffff',
            position: 'center',
          },
        },
      });

      // Create target node
      canvas.addNode({
        id: 'target',
        x: 100,
        y: 0,
        style: {
          shape: 'rectangle',
          width: 80,
          height: 40,
          fill: '#2196F3',
          stroke: '#1976D2',
          strokeWidth: 2,
          label: {
            visible: true,
            text: 'Target',
            fontSize: 12,
            textColor: '#ffffff',
            position: 'center',
          },
        },
      });

      // Create edge with bidirectional arrows
      canvas.addEdge({
        id: 'edge-1',
        source: 'source',
        target: 'target',
        style: {
          type: args.edgeType,
          stroke: '#757575',
          strokeWidth: 2,
          sourceArrow: {
            type: args.sourceArrowType,
            size: args.arrowSize,
            fill: args.arrowFill,
          },
          targetArrow: {
            type: args.targetArrowType,
            size: args.arrowSize,
            fill: args.arrowFill,
          },
          label: {
            visible: true,
            text: `${args.sourceArrowType} → ${args.targetArrowType}`,
            fontSize: 10,
            textColor: '#666666',
          },
        },
      });

      setTimeout(() => canvas.fitToContent(40), 100);
    });

    return wrapper;
  },
};

// ============================================================================
// Arrow Styles
// ============================================================================

export const ArrowStyles: StoryObj = {
  render: () => {
    const { wrapper, container } = createCanvasContainer(500);

    requestAnimationFrame(async () => {
      if (container.clientWidth === 0) container.style.width = '500px';
      if (container.clientHeight === 0) container.style.height = '500px';

      const canvas = new Canvas(container, {
        theme: 'light',
        autoResize: true,
      });

      await canvas.initialize();

      const styles = [
        { label: 'Default', fill: '#666666', size: 10 },
        { label: 'Large', fill: '#666666', size: 16 },
        { label: 'Small', fill: '#666666', size: 6 },
        { label: 'Red', fill: '#F44336', size: 10 },
        { label: 'Blue', fill: '#2196F3', size: 10 },
        { label: 'Green', fill: '#4CAF50', size: 10 },
        { label: 'Orange', fill: '#FF9800', size: 12 },
      ];

      const startY = -180;
      const spacing = 60;

      styles.forEach((style, index) => {
        const y = startY + index * spacing;

        canvas.addNode({
          id: `source-${index}`,
          x: -120,
          y,
          style: {
            shape: 'circle',
            size: 20,
            fill: '#9E9E9E',
            stroke: '#757575',
          },
        });

        canvas.addNode({
          id: `target-${index}`,
          x: 120,
          y,
          style: {
            shape: 'circle',
            size: 20,
            fill: '#9E9E9E',
            stroke: '#757575',
          },
        });

        canvas.addEdge({
          id: `edge-${index}`,
          source: `source-${index}`,
          target: `target-${index}`,
          style: {
            type: 'straight',
            stroke: style.fill,
            strokeWidth: 2,
            targetArrow: {
              type: 'triangle',
              size: style.size,
              fill: style.fill,
            },
            label: {
              visible: true,
              text: `${style.label} (size: ${style.size})`,
              fontSize: 11,
              textColor: '#424242',
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(40), 100);
    });

    return wrapper;
  },
};

// ============================================================================
// Open vs Filled Arrows
// ============================================================================

export const OpenVsFilled: StoryObj = {
  render: () => {
    const { wrapper, container } = createCanvasContainer(400);

    requestAnimationFrame(async () => {
      if (container.clientWidth === 0) container.style.width = '500px';
      if (container.clientHeight === 0) container.style.height = '400px';

      const canvas = new Canvas(container, {
        theme: 'light',
        autoResize: true,
      });

      await canvas.initialize();

      const comparisons = [
        { filled: 'triangle', open: 'triangleOpen', label: 'Triangle' },
        { filled: 'circle', open: 'circleOpen', label: 'Circle' },
        { filled: 'diamond', open: 'diamondOpen', label: 'Diamond' },
        { filled: 'rect', open: 'rectOpen', label: 'Rect' },
      ] as const;

      const startY = -120;
      const spacing = 80;

      comparisons.forEach((comparison, index) => {
        const y = startY + index * spacing;

        // Filled version (left side)
        canvas.addNode({
          id: `source-filled-${index}`,
          x: -180,
          y,
          style: { shape: 'circle', size: 20, fill: '#4CAF50' },
        });

        canvas.addNode({
          id: `target-filled-${index}`,
          x: -40,
          y,
          style: { shape: 'circle', size: 20, fill: '#4CAF50' },
        });

        canvas.addEdge({
          id: `edge-filled-${index}`,
          source: `source-filled-${index}`,
          target: `target-filled-${index}`,
          style: {
            type: 'straight',
            stroke: '#388E3C',
            strokeWidth: 2,
            targetArrow: {
              type: comparison.filled,
              size: 12,
              fill: '#388E3C',
            },
            label: {
              visible: true,
              text: `${comparison.label} (filled)`,
              fontSize: 10,
              textColor: '#424242',
            },
          },
        });

        // Open version (right side)
        canvas.addNode({
          id: `source-open-${index}`,
          x: 40,
          y,
          style: { shape: 'circle', size: 20, fill: '#2196F3' },
        });

        canvas.addNode({
          id: `target-open-${index}`,
          x: 180,
          y,
          style: { shape: 'circle', size: 20, fill: '#2196F3' },
        });

        canvas.addEdge({
          id: `edge-open-${index}`,
          source: `source-open-${index}`,
          target: `target-open-${index}`,
          style: {
            type: 'straight',
            stroke: '#1976D2',
            strokeWidth: 2,
            targetArrow: {
              type: comparison.open,
              size: 12,
              stroke: '#1976D2',
              strokeWidth: 2,
            },
            label: {
              visible: true,
              text: `${comparison.label} (open)`,
              fontSize: 10,
              textColor: '#424242',
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(40), 100);
    });

    return wrapper;
  },
};

// ============================================================================
// Edge Types with Arrows
// ============================================================================

export const EdgeTypesWithArrows: StoryObj = {
  render: () => {
    const { wrapper, container } = createCanvasContainer(500);

    requestAnimationFrame(async () => {
      if (container.clientWidth === 0) container.style.width = '500px';
      if (container.clientHeight === 0) container.style.height = '500px';

      const canvas = new Canvas(container, {
        theme: 'light',
        autoResize: true,
      });

      await canvas.initialize();

      const edgeTypes = [
        { type: 'straight', label: 'Straight Edge' },
        { type: 'bezier', label: 'Bezier Edge' },
        { type: 'orthogonal', label: 'Orthogonal Edge' },
      ] as const;

      const startY = -140;
      const spacing = 140;

      edgeTypes.forEach((edgeType, index) => {
        const y = startY + index * spacing;

        canvas.addNode({
          id: `source-${edgeType.type}`,
          x: -140,
          y,
          style: {
            shape: 'rectangle',
            width: 80,
            height: 40,
            fill: '#673AB7',
            stroke: '#512DA8',
            label: {
              visible: true,
              text: 'Source',
              textColor: '#ffffff',
              fontSize: 11,
              position: 'center',
            },
          },
        });

        canvas.addNode({
          id: `target-${edgeType.type}`,
          x: 140,
          y,
          style: {
            shape: 'rectangle',
            width: 80,
            height: 40,
            fill: '#E91E63',
            stroke: '#C2185B',
            label: {
              visible: true,
              text: 'Target',
              textColor: '#ffffff',
              fontSize: 11,
              position: 'center',
            },
          },
        });

        canvas.addEdge({
          id: `edge-${edgeType.type}`,
          source: `source-${edgeType.type}`,
          target: `target-${edgeType.type}`,
          style: {
            type: edgeType.type,
            stroke: '#9C27B0',
            strokeWidth: 2,
            sourceArrow: {
              type: 'circle',
              size: 8,
              fill: '#9C27B0',
            },
            targetArrow: {
              type: 'triangle',
              size: 12,
              fill: '#9C27B0',
            },
            label: {
              visible: true,
              text: edgeType.label,
              fontSize: 11,
              textColor: '#424242',
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(40), 100);
    });

    return wrapper;
  },
};
