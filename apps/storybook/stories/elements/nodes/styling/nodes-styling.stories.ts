import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, CanvasNode, CanvasOptions } from '@invana/canvas-core';
import { getFullHeightContainer } from '../../../../src/div-utils';
const meta: Meta = {
  title: 'Nodes/Styling',
};

export default meta;
type Story = StoryObj;

/**
 * 1. Individual Node Styling - Style each node separately with the `style` property
 * Similar to   per-node styling approach
 */
export const IndividualNodeStyling: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-individual-styling';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-individual-styling');
    if (!container) return;

    const nodes: CanvasNode[] = [
      { 
        id: 'n1', 
        x: -200, 
        y: -100, 
        shape: 'circle', 
        size: 40, 
        label: 'Blue Circle',
        // Individual node styling
        style: { 
          fill: '#4a90d9', 
          stroke: '#2d5f8a', 
          strokeWidth: 3,
          fillAlpha: 0.9
        }
      },
      { 
        id: 'n2', 
        x: 200, 
        y: -100, 
        shape: 'rect', 
        width: 80, 
        height: 60, 
        cornerRadius: 8, 
        label: 'Green Rect',
        style: { 
          fill: '#50c878', 
          stroke: '#3d9d5c', 
          strokeWidth: 2,
          strokeStyle: 'dashed' // Dashed border
        }
      },
      { 
        id: 'n3', 
        x: -200, 
        y: 100, 
        shape: 'diamond', 
        size: 50, 
        label: 'Red Diamond',
        style: { 
          fill: '#ff6b6b', 
          stroke: '#cc5555', 
          strokeWidth: 4,
          strokeStyle: 'dotted' // Dotted border
        }
      },
      { 
        id: 'n4', 
        x: 200, 
        y: 100, 
        shape: 'hexagon', 
        size: 45, 
        label: 'Yellow Hex',
        style: { 
          fill: '#ffd93d', 
          stroke: '#ccae30', 
          strokeWidth: 2,
          halo: true, // Enable halo effect
          haloStroke: '#ffd93d',
          haloStrokeWidth: 15
        }
      },
      { 
        id: 'n5', 
        x: 0, 
        y: 0, 
        shape: 'ellipse', 
        width: 100, 
        height: 60, 
        label: 'Purple Center',
        style: { 
          fill: '#6c5ce7', 
          stroke: '#5443c7', 
          strokeWidth: 3,
          strokeAlpha: 0.7 // Semi-transparent stroke
        }
      },
    ];

    const options: CanvasOptions = {
      container,
      data: { nodes, edges: [] },
    };
    
    const canvas = new Canvas(options);
    await canvas.init();
  },
};

/**
 * 2. Conditional Styling Based on Node Properties (ID, Shape, Type)
 * Style nodes dynamically based on their properties
 */
export const ConditionalStyling: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-conditional-styling';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-conditional-styling');
    if (!container) return;

    // Helper function to get style based on node properties
    const getNodeStyle = (id: string, shape: string) => {
      // Style based on ID
      if (id.includes('primary')) {
        return { fill: '#1890ff', stroke: '#0050b3', strokeWidth: 3 };
      }
      if (id.includes('danger')) {
        return { fill: '#ff4d4f', stroke: '#cf1322', strokeWidth: 3 };
      }
      if (id.includes('success')) {
        return { fill: '#52c41a', stroke: '#389e0d', strokeWidth: 3 };
      }
      
      // Style based on shape
      switch (shape) {
        case 'circle':
          return { fill: '#9254de', stroke: '#722ed1', strokeWidth: 2 };
        case 'rect':
          return { fill: '#fa8c16', stroke: '#d46b08', strokeWidth: 2 };
        default:
          return { fill: '#d9d9d9', stroke: '#8c8c8c', strokeWidth: 2 };
      }
    };

    const nodes: CanvasNode[] = [
      { 
        id: 'primary-1', 
        x: -250, 
        y: -80, 
        shape: 'circle', 
        size: 45, 
        label: 'Primary',
        style: getNodeStyle('primary-1', 'circle')
      },
      { 
        id: 'danger-1', 
        x: 0, 
        y: -80, 
        shape: 'rect', 
        width: 80, 
        height: 60, 
        label: 'Danger',
        style: getNodeStyle('danger-1', 'rect')
      },
      { 
        id: 'success-1', 
        x: 250, 
        y: -80, 
        shape: 'hexagon', 
        size: 45, 
        label: 'Success',
        style: getNodeStyle('success-1', 'hexagon')
      },
      { 
        id: 'node-circle', 
        x: -150, 
        y: 80, 
        shape: 'circle', 
        size: 40, 
        label: 'Circle Style',
        style: getNodeStyle('node-circle', 'circle')
      },
      { 
        id: 'node-rect', 
        x: 150, 
        y: 80, 
        shape: 'rect', 
        width: 90, 
        height: 60, 
        label: 'Rect Style',
        style: getNodeStyle('node-rect', 'rect')
      },
    ];

    const options: CanvasOptions = {
      container,
      data: { nodes, edges: [] },
    };
    
    const canvas = new Canvas(options);
    await canvas.init();
  },
};

/**
 * 3. Global Styles with State-Based Overrides
 * Set global styles in CanvasOptions and define state-specific styles
 */
export const GlobalStylesWithStates: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-global-styles';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-global-styles');
    if (!container) return;

    const nodes: CanvasNode[] = [
      { id: 'n1', x: -200, y: -100, shape: 'circle', size: 40, label: 'Node 1' },
      { id: 'n2', x: 200, y: -100, shape: 'rect', width: 80, height: 60, label: 'Node 2' },
      { id: 'n3', x: -200, y: 100, shape: 'hexagon', size: 45, label: 'Node 3' },
      { id: 'n4', x: 200, y: 100, shape: 'diamond', size: 45, label: 'Node 4' },
    ];

    const options: CanvasOptions = {
      container,
      data: { nodes, edges: [] },
      // Global styles applied to all nodes
      styles: {
        node: {
          // Base style
          fill: 0x27c554,
          stroke: '#525252',
          strokeWidth: 3,
          fillAlpha: 1,
          
          // State-based styling
          states: {
            selected: {
              fill: 0x1890ff,
              stroke: '#0050b3',
              strokeWidth: 5,
              halo: true,
              haloStroke: '#1890ff',
            },
            active: {
              strokeWidth: 4,
              strokeAlpha: 0.8,
            },
            highlighted: {
              fill: 0xffa940,
              stroke: '#d46b08',
            }
          }
        }
      }
    };
    
    const canvas = new Canvas(options);
    await canvas.init();
    
    // Add info box
    const info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '20px';
    info.style.left = '20px';
    info.style.padding = '15px';
    info.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    info.style.borderRadius = '8px';
    info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    info.innerHTML = `
      <div style="font-size: 14px; color: #333;">
        <strong>Interaction:</strong><br/>
        • Click nodes to select them<br/>
        • Hover to see active state<br/>
        • All nodes use the same global style
      </div>
    `;
    container.appendChild(info);
  },
};

/**
 * 4. Mixed Approach - Global Styles + Individual Overrides
 * Combine global styling with per-node customization
 */
export const MixedStyling: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-mixed-styling';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-mixed-styling');
    if (!container) return;

    const nodes: CanvasNode[] = [
      { 
        id: 'n1', 
        x: -200, 
        y: -100, 
        shape: 'circle', 
        size: 40, 
        label: 'Default Style' 
        // Uses global style
      },
      { 
        id: 'n2', 
        x: 200, 
        y: -100, 
        shape: 'rect', 
        width: 80, 
        height: 60, 
        label: 'Custom Fill',
        style: { 
          fill: '#ff6b6b' // Override just the fill
        }
      },
      { 
        id: 'n3', 
        x: -200, 
        y: 100, 
        shape: 'hexagon', 
        size: 45, 
        label: 'Custom All',
        style: { 
          fill: '#9b59b6',
          stroke: '#7d478f',
          strokeWidth: 4,
          halo: true,
          haloStroke: '#9b59b6'
        }
      },
      { 
        id: 'n4', 
        x: 200, 
        y: 100, 
        shape: 'diamond', 
        size: 45, 
        label: 'Default Style'
        // Uses global style
      },
    ];

    const options: CanvasOptions = {
      container,
      data: { nodes, edges: [] },
      // Global default styles
      styles: {
        node: {
          fill: 0x1890ff,
          stroke: '#0050b3',
          strokeWidth: 2,
          fillAlpha: 0.9,
          states: {
            selected: {
              strokeWidth: 5,
              halo: true,
            }
          }
        }
      }
    };
    
    const canvas = new Canvas(options);
    await canvas.init();
    
    // Add info box
    const info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '20px';
    info.style.left = '20px';
    info.style.padding = '15px';
    info.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    info.style.borderRadius = '8px';
    info.innerHTML = `
      <div style="font-size: 14px; color: #333;">
        <strong>Styling Priority:</strong><br/>
        1. Individual node.style (highest)<br/>
        2. Global styles.node<br/>
        3. Built-in defaults (lowest)
      </div>
    `;
    container.appendChild(info);
  },
};
