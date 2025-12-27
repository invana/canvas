/**
 * Background Styling Stories
 * 
 * Demonstrates various background styling options for the canvas:
 * - Solid colors
 * - Linear and radial gradients
 * - Patterns (dots, grid, cross, lines)
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin } from '@aspect-ui/canvas-core';
import type { BackgroundStyle } from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'Background/Styling',
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
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({ type: 'solid', color: '#ffffff' });

      canvas.render();

      // Button handlers
      document.getElementById('white-bg')?.addEventListener('click', () => {
        bgPlugin.setBackground({ type: 'solid', color: '#ffffff' });
      });

      document.getElementById('light-bg')?.addEventListener('click', () => {
        bgPlugin.setBackground({ type: 'solid', color: '#f5f5f5' });
      });

      document.getElementById('dark-bg')?.addEventListener('click', () => {
        bgPlugin.setBackground({ type: 'solid', color: '#1a1a2e' });
      });

      document.getElementById('colored-bg')?.addEventListener('click', () => {
        bgPlugin.setBackground({ type: 'solid', color: '#e3f2fd' });
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
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'gradient',
        gradientType: 'linear',
        angle: 0,
        colors: [
          { color: '#667eea', offset: 0 },
          { color: '#764ba2', offset: 1 }
        ]
      });

      canvas.render();

      // Button handlers
      document.getElementById('horizontal-gradient')?.addEventListener('click', () => {
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'gradient',
        gradientType: 'radial',
        colors: [
          { color: '#ffffff', offset: 0 },
          { color: '#667eea', offset: 1 }
        ]
      });

      canvas.render();

      // Button handlers
      document.getElementById('center-gradient')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'gradient',
          gradientType: 'radial',
          colors: [
            { color: '#ffffff', offset: 0 },
            { color: '#667eea', offset: 1 }
          ]
        });
      });

      document.getElementById('spotlight-gradient')?.addEventListener('click', () => {
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'dots',
        color: '#cccccc',
        backgroundColor: '#ffffff',
        size: 2,
        spacing: 20
      });

      canvas.render();

      // Button handlers
      document.getElementById('small-dots')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'dots',
          color: '#cccccc',
          backgroundColor: '#ffffff',
          size: 1,
          spacing: 20
        });
      });

      document.getElementById('medium-dots')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'dots',
          color: '#999999',
          backgroundColor: '#f5f5f5',
          size: 3,
          spacing: 25
        });
      });

      document.getElementById('large-dots')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'dots',
          color: '#666666',
          backgroundColor: '#f0f0f0',
          size: 5,
          spacing: 30
        });
      });

      document.getElementById('dense-dots')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'dots',
          color: '#aaaaaa',
          backgroundColor: '#ffffff',
          size: 2,
          spacing: 15
        });
      });

      document.getElementById('sparse-dots')?.addEventListener('click', () => {
        bgPlugin.setBackground({
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
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'grid',
        color: '#e0e0e0',
        backgroundColor: '#ffffff',
        spacing: 20,
        lineWidth: 1
      });

      canvas.render();

      // Button handlers
      document.getElementById('fine-grid')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'grid',
          color: '#e8e8e8',
          backgroundColor: '#ffffff',
          spacing: 10,
          lineWidth: 0.5
        });
      });

      document.getElementById('medium-grid')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'grid',
          color: '#d0d0d0',
          backgroundColor: '#f8f8f8',
          spacing: 25,
          lineWidth: 1
        });
      });

      document.getElementById('large-grid')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'grid',
          color: '#c0c0c0',
          backgroundColor: '#fafafa',
          spacing: 50,
          lineWidth: 2
        });
      });

      document.getElementById('blueprint-grid')?.addEventListener('click', () => {
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'cross',
        color: '#cccccc',
        backgroundColor: '#ffffff',
        size: 5,
        spacing: 25,
        lineWidth: 1
      });

      canvas.render();

      // Button handlers
      document.getElementById('small-cross')?.addEventListener('click', () => {
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        bgPlugin.setBackground({
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
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'lines',
        color: '#e0e0e0',
        backgroundColor: '#ffffff',
        spacing: 10,
        lineWidth: 1
      });

      canvas.render();

      // Button handlers
      document.getElementById('fine-lines')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'lines',
          color: '#e8e8e8',
          backgroundColor: '#ffffff',
          spacing: 5,
          lineWidth: 0.5
        });
      });

      document.getElementById('medium-lines')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'lines',
          color: '#cccccc',
          backgroundColor: '#f8f8f8',
          spacing: 15,
          lineWidth: 1
        });
      });

      document.getElementById('bold-lines')?.addEventListener('click', () => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'lines',
          color: '#999999',
          backgroundColor: '#f0f0f0',
          spacing: 20,
          lineWidth: 2
        });
      });

      document.getElementById('colored-lines')?.addEventListener('click', () => {
        bgPlugin.setBackground({
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

// =============================================================================
// Mixed Examples - Real-world use cases
// =============================================================================

export const ReactFlowStyle: Story = {
  name: 'React Flow Style (Grid)',
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'dots',
        color: '#81818a',
        backgroundColor: '#ffffff',
        size: 1,
        spacing: 20,
        alpha: 0.4,
        follow: true // Pattern follows viewport - nodes stay relative to dots
      });

      canvas.render();
    });

    return container;
  },
};

export const BlueprintStyle: Story = {
  name: 'Blueprint Style',
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        data: generateGraphData(),
        styles: {
          node: {
            fill: '#58a6ff',
            stroke: '#79c0ff',
          },
          edge: {
            stroke: '#58a6ff',
          }
        }
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'grid',
        color: '#2a9fd6',
        backgroundColor: '#0d1117',
        spacing: 25,
        lineWidth: 0.5,
        alpha: 0.8
      });

      canvas.render();
    });

    return container;
  },
};

export const MinimalLight: Story = {
  name: 'Minimal Light',
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground({
        type: 'pattern',
        patternType: 'dots',
        color: '#e0e0e0',
        backgroundColor: '#fafafa',
        size: 1.5,
        spacing: 30,
        alpha: 0.6
      });

      canvas.render();
    });

    return container;
  },
};

export const FollowModeDemo: Story = {
  name: 'Follow Mode (Interactive)',
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
      <label style="display: inline-flex; align-items: center; gap: 8px; font-family: sans-serif;">
        <input type="checkbox" id="follow-toggle" checked />
        <span>Follow viewport (camera moves through space)</span>
      </label>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #666; font-family: sans-serif;">
        When enabled, the pattern moves with pan/zoom - nodes stay relative to the grid.
        Try panning and zooming with both settings!
      </p>
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
        data: generateGraphData(),
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      
      const updateBackground = (follow: boolean) => {
        bgPlugin.setBackground({
          type: 'pattern',
          patternType: 'grid',
          color: '#d0d0d0',
          backgroundColor: '#ffffff',
          spacing: 25,
          lineWidth: 1,
          follow
        });
      };

      updateBackground(true); // Start with follow enabled
      canvas.render();

      // Toggle handler
      document.getElementById('follow-toggle')?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        updateBackground(checked);
      });
    });

    return wrapper;
  },
};

