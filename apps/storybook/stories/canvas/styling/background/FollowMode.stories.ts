import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, GraphDataPlugin } from '@invana/canvas-core';

const meta: Meta = {
  title: 'Canvas/Styling/Background/FollowMode',
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
      });

      await canvas.init();


      // Register graph data plugin
      const graphPlugin = new GraphDataPlugin();
      await canvas.registerPlugin(graphPlugin);
      graphPlugin.setData(generateGraphData());

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);
      
      const updateBackground = (follow: boolean) => {
        bgPlugin.setOptions({
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

      // Toggle handler
      document.getElementById('follow-toggle')?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        updateBackground(checked);
      });
    });

    return wrapper;
  },
};
