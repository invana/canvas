/**
 * Background Styling Stories
 * 
 * Demonstrates various background styling options for the canvas:
 * - Solid colors
 * - Linear and radial gradients
 * - Patterns (dots, grid, cross, lines)
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, GraphDataPlugin } from '@invana/canvas-core';
import type { BackgroundStyle } from '@invana/canvas-core';

const meta: Meta = {
  title: 'Canvas/Styling/Background/Solid',
};

export default meta;
type Story = StoryObj;

// Helper to generate sample graph data
const generateGraphData = () => ({
  nodes: [
    { 
      id: 'n1', x: -200, y: -100, shape: 'circle' as const, size: 40, label: 'Node 1',
      style: { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n2', x: 200, y: -100, shape: 'rect' as const, width: 80, height: 60, cornerRadius: 8, label: 'Node 2',
      style: { fill: '#50c878', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n3', x: -200, y: 100, shape: 'diamond' as const, size: 50, label: 'Node 3',
      style: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n4', x: 200, y: 100, shape: 'hexagon' as const, size: 45, label: 'Node 4',
      style: { fill: '#ffd93d', stroke: '#333', strokeWidth: 2 }
    },
    { 
      id: 'n5', x: 0, y: 0, shape: 'ellipse' as const, width: 100, height: 60, label: 'Center',
      style: { fill: '#6c5ce7', stroke: '#333', strokeWidth: 2 }
    },
  ],
  edges: [
    { 
      id: 'e1', source: 'n1', target: 'n5', pathType: 'bezier' as const,
      style: { stroke: '#666', strokeWidth: 2 }
    },
    { 
      id: 'e2', source: 'n2', target: 'n5', pathType: 'bezier' as const,
      style: { stroke: '#666', strokeWidth: 2 }
    },
    { 
      id: 'e3', source: 'n3', target: 'n5', pathType: 'bezier' as const,
      style: { stroke: '#666', strokeWidth: 2 }
    },
    { 
      id: 'e4', source: 'n4', target: 'n5', pathType: 'bezier' as const,
      style: { stroke: '#666', strokeWidth: 2 }
    },
  ],
});

// =============================================================================
// Solid Colors
// =============================================================================

export const SolidColor: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '600px';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';

    const controls = document.createElement('div');
    controls.style.padding = '10px';
    controls.style.backgroundColor = '#f5f5f5';
    controls.style.borderBottom = '1px solid #ddd';
    controls.innerHTML = `
      <button id="white-bg" style="margin: 5px;">White</button>
      <button id="light-bg" style="margin: 5px;">Light Gray</button>
      <button id="dark-bg" style="margin: 5px;">Dark</button>
      <button id="colored-bg" style="margin: 5px;">Colored</button>
    `;
    wrapper.appendChild(controls);

    const container = document.createElement('div');
    container.style.flex = '1';
    container.style.minHeight = '500px';
    wrapper.appendChild(container);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 500,
      });

      await canvas.init();

      // Register graph data plugin
      const graphPlugin = new GraphDataPlugin();
      await canvas.registerPlugin(graphPlugin);
      graphPlugin.setData(generateGraphData());


      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);
      bgPlugin.setOptions({ type: 'solid', color: '#ffffff' });


      // Button handlers
      document.getElementById('white-bg')?.addEventListener('click', () => {
        bgPlugin.setOptions({ type: 'solid', color: '#ffffff' });
      });

      document.getElementById('light-bg')?.addEventListener('click', () => {
        bgPlugin.setOptions({ type: 'solid', color: '#f5f5f5' });
      });

      document.getElementById('dark-bg')?.addEventListener('click', () => {
        bgPlugin.setOptions({ type: 'solid', color: '#1a1a2e' });
      });

      document.getElementById('colored-bg')?.addEventListener('click', () => {
        bgPlugin.setOptions({ type: 'solid', color: '#e3f2fd' });
      });
    });

    return wrapper;
  },
};

// =============================================================================
// Linear Gradients
// =============================================================================

export const LinearGradients: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '600px';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';

    const controls = document.createElement('div');
    controls.style.padding = '10px';
    controls.style.backgroundColor = '#f5f5f5';
    controls.style.borderBottom = '1px solid #ddd';
    controls.innerHTML = `
      <button id="horizontal-gradient" style="margin: 5px;">Horizontal</button>
      <button id="vertical-gradient" style="margin: 5px;">Vertical</button>
      <button id="diagonal-gradient" style="margin: 5px;">Diagonal</button>
      <button id="sunset-gradient" style="margin: 5px;">Sunset</button>
      <button id="ocean-gradient" style="margin: 5px;">Ocean</button>
    `;
    wrapper.appendChild(controls);

    const container = document.createElement('div');
    container.style.flex = '1';
    container.style.minHeight = '500px';
    wrapper.appendChild(container);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 500,
      });

      await canvas.init();


      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);
      bgPlugin.setOptions({
        type: 'gradient',
        gradientType: 'linear',
        angle: 0,
        colors: [
          { color: '#667eea', offset: 0 },
          { color: '#764ba2', offset: 1 }
        ]
      });


      // Button handlers
      document.getElementById('horizontal-gradient')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'gradient',
          gradientType: 'linear',
          angle: 0,
          colors: [
            { color: '#667eea', offset: 0 },
            { color: '#764ba2', offset: 1 }
          ]
        });
      });

      document.getElementById('vertical-gradient')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'gradient',
          gradientType: 'linear',
          angle: 90,
          colors: [
            { color: '#f093fb', offset: 0 },
            { color: '#f5576c', offset: 1 }
          ]
        });
      });

      document.getElementById('diagonal-gradient')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'gradient',
          gradientType: 'linear',
          angle: 45,
          colors: [
            { color: '#4facfe', offset: 0 },
            { color: '#00f2fe', offset: 1 }
          ]
        });
      });

      document.getElementById('sunset-gradient')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'gradient',
          gradientType: 'linear',
          angle: 90,
          colors: [
            { color: '#ff6b6b', offset: 0 },
            { color: '#feca57', offset: 0.5 },
            { color: '#ff9ff3', offset: 1 }
          ]
        });
      });

      document.getElementById('ocean-gradient')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'gradient',
          gradientType: 'linear',
          angle: 180,
          colors: [
            { color: '#0575e6', offset: 0 },
            { color: '#021b79', offset: 1 }
          ]
        });
      });
    });

    return wrapper;
  },
};

// =============================================================================
// Radial Gradients
// =============================================================================

export const RadialGradients: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '600px';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';

    const controls = document.createElement('div');
    controls.style.padding = '10px';
    controls.style.backgroundColor = '#f5f5f5';
    controls.style.borderBottom = '1px solid #ddd';
    controls.innerHTML = `
      <button id="center-gradient" style="margin: 5px;">Center</button>
      <button id="spotlight-gradient" style="margin: 5px;">Spotlight</button>
      <button id="cosmic-gradient" style="margin: 5px;">Cosmic</button>
    `;
    wrapper.appendChild(controls);

    const container = document.createElement('div');
    container.style.flex = '1';
    container.style.minHeight = '500px';
    wrapper.appendChild(container);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 500,
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);
      bgPlugin.setOptions({
        type: 'gradient',
        gradientType: 'radial',
        colors: [
          { color: '#ffffff', offset: 0 },
          { color: '#667eea', offset: 1 }
        ]
      });


      // Button handlers
      document.getElementById('center-gradient')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'gradient',
          gradientType: 'radial',
          colors: [
            { color: '#ffffff', offset: 0 },
            { color: '#667eea', offset: 1 }
          ]
        });
      });

      document.getElementById('spotlight-gradient')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'gradient',
          gradientType: 'radial',
          colors: [
            { color: '#ffeaa7', offset: 0 },
            { color: '#fdcb6e', offset: 0.4 },
            { color: '#e17055', offset: 1 }
          ]
        });
      });

      document.getElementById('cosmic-gradient')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'gradient',
          gradientType: 'radial',
          colors: [
            { color: '#8e2de2', offset: 0 },
            { color: '#4a00e0', offset: 0.5 },
            { color: '#000428', offset: 1 }
          ]
        });
      });
    });

    return wrapper;
  },
};
