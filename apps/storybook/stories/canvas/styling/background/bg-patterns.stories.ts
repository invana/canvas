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
  title: 'Canvas/Styling/Background/Patterns',
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
// Dot Patterns
// =============================================================================

export const DotPattern: Story = {
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
      <button id="small-dots" style="margin: 5px;">Small Dots</button>
      <button id="medium-dots" style="margin: 5px;">Medium Dots</button>
      <button id="large-dots" style="margin: 5px;">Large Dots</button>
      <button id="dense-dots" style="margin: 5px;">Dense</button>
      <button id="sparse-dots" style="margin: 5px;">Sparse</button>
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
      bgPlugin.setOptions({
        type: 'pattern',
        patternType: 'dots',
        color: '#cccccc',
        backgroundColor: '#ffffff',
        size: 2,
        spacing: 20
      });


      // Button handlers
      document.getElementById('small-dots')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'dots',
          color: '#cccccc',
          backgroundColor: '#ffffff',
          size: 1,
          spacing: 20
        });
      });

      document.getElementById('medium-dots')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'dots',
          color: '#999999',
          backgroundColor: '#f5f5f5',
          size: 3,
          spacing: 25
        });
      });

      document.getElementById('large-dots')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'dots',
          color: '#666666',
          backgroundColor: '#f0f0f0',
          size: 5,
          spacing: 30
        });
      });

      document.getElementById('dense-dots')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'dots',
          color: '#aaaaaa',
          backgroundColor: '#ffffff',
          size: 2,
          spacing: 15
        });
      });

      document.getElementById('sparse-dots')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'dots',
          color: '#dddddd',
          backgroundColor: '#fafafa',
          size: 2,
          spacing: 40
        });
      });
    });

    return wrapper;
  },
};

// =============================================================================
// Grid Pattern
// =============================================================================

export const GridPattern: Story = {
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
      <button id="fine-grid" style="margin: 5px;">Fine Grid</button>
      <button id="medium-grid" style="margin: 5px;">Medium Grid</button>
      <button id="large-grid" style="margin: 5px;">Large Grid</button>
      <button id="blueprint-grid" style="margin: 5px;">Blueprint</button>
      <button id="dark-grid" style="margin: 5px;">Dark Mode</button>
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
      bgPlugin.setOptions({
        type: 'pattern',
        patternType: 'grid',
        color: '#e0e0e0',
        backgroundColor: '#ffffff',
        spacing: 20,
        lineWidth: 1
      });


      // Button handlers
      document.getElementById('fine-grid')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'grid',
          color: '#e8e8e8',
          backgroundColor: '#ffffff',
          spacing: 10,
          lineWidth: 0.5
        });
      });

      document.getElementById('medium-grid')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'grid',
          color: '#d0d0d0',
          backgroundColor: '#f8f8f8',
          spacing: 25,
          lineWidth: 1
        });
      });

      document.getElementById('large-grid')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'grid',
          color: '#c0c0c0',
          backgroundColor: '#fafafa',
          spacing: 50,
          lineWidth: 2
        });
      });

      document.getElementById('blueprint-grid')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'grid',
          color: '#4a90e2',
          backgroundColor: '#001f3f',
          spacing: 20,
          lineWidth: 1,
          alpha: 0.5
        });
      });

      document.getElementById('dark-grid')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'grid',
          color: '#333333',
          backgroundColor: '#1a1a1a',
          spacing: 20,
          lineWidth: 1
        });
      });
    });

    return wrapper;
  },
};

// =============================================================================
// Cross Pattern
// =============================================================================

export const CrossPattern: Story = {
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
      <button id="small-cross" style="margin: 5px;">Small</button>
      <button id="medium-cross" style="margin: 5px;">Medium</button>
      <button id="large-cross" style="margin: 5px;">Large</button>
      <button id="colored-cross" style="margin: 5px;">Colored</button>
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
      bgPlugin.setOptions({
        type: 'pattern',
        patternType: 'cross',
        color: '#cccccc',
        backgroundColor: '#ffffff',
        size: 5,
        spacing: 25,
        lineWidth: 1
      });


      // Button handlers
      document.getElementById('small-cross')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'cross',
          color: '#d0d0d0',
          backgroundColor: '#ffffff',
          size: 3,
          spacing: 20,
          lineWidth: 1
        });
      });

      document.getElementById('medium-cross')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'cross',
          color: '#aaaaaa',
          backgroundColor: '#f5f5f5',
          size: 6,
          spacing: 30,
          lineWidth: 1.5
        });
      });

      document.getElementById('large-cross')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'cross',
          color: '#888888',
          backgroundColor: '#f0f0f0',
          size: 10,
          spacing: 40,
          lineWidth: 2
        });
      });

      document.getElementById('colored-cross')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'cross',
          color: '#4a90e2',
          backgroundColor: '#e3f2fd',
          size: 5,
          spacing: 25,
          lineWidth: 1.5
        });
      });
    });

    return wrapper;
  },
};

// =============================================================================
// Lines Pattern
// =============================================================================

export const LinesPattern: Story = {
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
      <button id="fine-lines" style="margin: 5px;">Fine Lines</button>
      <button id="medium-lines" style="margin: 5px;">Medium Lines</button>
      <button id="bold-lines" style="margin: 5px;">Bold Lines</button>
      <button id="colored-lines" style="margin: 5px;">Colored</button>
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
      bgPlugin.setOptions({
        type: 'pattern',
        patternType: 'lines',
        color: '#e0e0e0',
        backgroundColor: '#ffffff',
        spacing: 10,
        lineWidth: 1
      });


      // Button handlers
      document.getElementById('fine-lines')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'lines',
          color: '#e8e8e8',
          backgroundColor: '#ffffff',
          spacing: 5,
          lineWidth: 0.5
        });
      });

      document.getElementById('medium-lines')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'lines',
          color: '#cccccc',
          backgroundColor: '#f8f8f8',
          spacing: 15,
          lineWidth: 1
        });
      });

      document.getElementById('bold-lines')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'lines',
          color: '#999999',
          backgroundColor: '#f0f0f0',
          spacing: 20,
          lineWidth: 2
        });
      });

      document.getElementById('colored-lines')?.addEventListener('click', () => {
        bgPlugin.setOptions({
          type: 'pattern',
          patternType: 'lines',
          color: '#9b59b6',
          backgroundColor: '#f3e5f5',
          spacing: 12,
          lineWidth: 1.5
        });
      });
    });

    return wrapper;
  },
};


