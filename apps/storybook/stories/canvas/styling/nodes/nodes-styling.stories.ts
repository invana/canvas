import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, CanvasNode, CanvasOptions } from '@invana/canvas-core';
import { getFullHeightContainer } from '../../../../src/div-utils';
const meta: Meta = {
  title: 'Canvas/Styling/Nodes',
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

/**
 * 5. Function-Based Styling (. Style)
 * Apply styles using functions while iterating through data
 * This mimics   approach: style: { fill: (d) => d.type === 'x' ? 'red' : 'blue' }
 */
export const FunctionBasedStyling: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-function-styling';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-function-styling');
    if (!container) return;

    // Raw data (like what you'd get from an API or database)
    const rawData = [
      { id: 'user-1', name: 'Alice', type: 'user', importance: 0.9, x: -250, y: -80 },
      { id: 'user-2', name: 'Bob', type: 'user', importance: 0.6, x: -250, y: 80 },
      { id: 'server-1', name: 'API Server', type: 'server', importance: 0.95, x: 0, y: -80 },
      { id: 'db-1', name: 'Database', type: 'database', importance: 0.85, x: 0, y: 80 },
      { id: 'cache-1', name: 'Redis', type: 'cache', importance: 0.7, x: 250, y: -80 },
      { id: 'queue-1', name: 'Message Queue', type: 'queue', importance: 0.75, x: 250, y: 80 },
    ];

    // Function-based styling - apply styles conditionally while mapping data
    const nodes: CanvasNode[] = rawData.map(d => ({
      id: d.id,
      x: d.x,
      y: d.y,
      label: d.name,
      
      // Conditional shape based on type
      shape: d.type === 'database' ? 'rect' : 
             d.type === 'server' ? 'hexagon' :
             d.type === 'cache' ? 'diamond' : 'circle',
      
      // Size based on importance
      size: 30 + (d.importance * 20),
      
      // Conditional styling - like   function-based approach
      style: {
        // Fill color based on type
        fill: d.type === 'user' ? '#1890ff' :
              d.type === 'server' ? '#52c41a' :
              d.type === 'database' ? '#ff4d4f' :
              d.type === 'cache' ? '#fa8c16' :
              d.type === 'queue' ? '#722ed1' : '#d9d9d9',
        
        // Stroke color (darker version of fill)
        stroke: d.type === 'user' ? '#0050b3' :
                d.type === 'server' ? '#389e0d' :
                d.type === 'database' ? '#cf1322' :
                d.type === 'cache' ? '#d46b08' :
                d.type === 'queue' ? '#531dab' : '#8c8c8c',
        
        // Stroke width based on importance
        strokeWidth: d.importance > 0.8 ? 4 : 2,
        
        // Enable halo for high importance nodes
        halo: d.importance > 0.8,
        haloStroke: d.type === 'user' ? '#1890ff' :
                    d.type === 'server' ? '#52c41a' :
                    d.type === 'database' ? '#ff4d4f' : '#fa8c16',
        haloStrokeWidth: 12,
        
        // Border style based on conditions
        strokeStyle: d.id.includes('cache') ? 'dashed' : 'solid',
        
        // States with conditional styling
        states: {
          selected: {
            strokeWidth: 6,
            halo: true,
            fill: d.importance > 0.8 ? '#ffd666' : undefined, // Gold for important nodes
          }
        }
      },
      
      // Conditional badges
      badges: d.importance > 0.85 ? [{ text: '!', placement: 'right-top' }] : undefined,
    }));

    const options: CanvasOptions = {
      container,
      data: { nodes, edges: [] },
    };
    
    const canvas = new Canvas(options);
    await canvas.init();
    
    // Add legend
    const legend = document.createElement('div');
    legend.style.position = 'absolute';
    legend.style.top = '20px';
    legend.style.left = '20px';
    legend.style.padding = '15px';
    legend.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    legend.style.borderRadius = '8px';
    legend.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    legend.innerHTML = `
      <div style="font-size: 13px; color: #333; font-family: monospace;">
        <strong>Function-Based Styling:</strong><br/><br/>
        <div style="display: flex; align-items: center; margin: 5px 0;">
          <div style="width: 12px; height: 12px; background: #1890ff; border-radius: 50%; margin-right: 8px;"></div>
          User (circle)
        </div>
        <div style="display: flex; align-items: center; margin: 5px 0;">
          <div style="width: 12px; height: 12px; background: #52c41a; margin-right: 8px;"></div>
          Server (hexagon)
        </div>
        <div style="display: flex; align-items: center; margin: 5px 0;">
          <div style="width: 12px; height: 12px; background: #ff4d4f; margin-right: 8px;"></div>
          Database (rect)
        </div>
        <div style="display: flex; align-items: center; margin: 5px 0;">
          <div style="width: 12px; height: 12px; background: #fa8c16; margin-right: 8px; border: 2px dashed #d46b08;"></div>
          Cache (diamond, dashed)
        </div>
        <div style="display: flex; align-items: center; margin: 5px 0;">
          <div style="width: 12px; height: 12px; background: #722ed1; border-radius: 50%; margin-right: 8px;"></div>
          Queue (circle)
        </div>
        <br/>
        <div style="color: #666; font-size: 11px;">
          • Size = importance<br/>
          • Border width = importance > 0.8 ? 4 : 2<br/>
          • Halo = importance > 0.8<br/>
          • Badge = importance > 0.85
        </div>
      </div>
    `;
    container.appendChild(legend);
  },
};

/**
 * 6. Advanced: Complex Conditional Logic
 * Real-world example with multiple conditions and helper functions
 */
export const AdvancedConditionalStyling: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-advanced-styling';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-advanced-styling');
    if (!container) return;

    // Mock data representing a service status dashboard
    const services = [
      { id: 'auth', name: 'Auth Service', status: 'online', cpu: 45, memory: 60, x: -200, y: -100 },
      { id: 'api', name: 'API Gateway', status: 'online', cpu: 85, memory: 75, x: 0, y: -100 },
      { id: 'db', name: 'Database', status: 'warning', cpu: 70, memory: 88, x: 200, y: -100 },
      { id: 'cache', name: 'Cache', status: 'online', cpu: 30, memory: 40, x: -200, y: 100 },
      { id: 'worker', name: 'Worker', status: 'error', cpu: 95, memory: 92, x: 0, y: 100 },
      { id: 'storage', name: 'Storage', status: 'offline', cpu: 0, memory: 0, x: 200, y: 100 },
    ];

    // Helper functions for conditional styling
    const getStatusColor = (status: string) => ({
      online: { fill: '#52c41a', stroke: '#389e0d' },
      warning: { fill: '#faad14', stroke: '#d48806' },
      error: { fill: '#ff4d4f', stroke: '#cf1322' },
      offline: { fill: '#d9d9d9', stroke: '#8c8c8c' },
    }[status] || { fill: '#d9d9d9', stroke: '#8c8c8c' });

    const getCpuWarningStyle = (cpu: number) => {
      if (cpu > 90) return { strokeStyle: 'dotted' as const, strokeWidth: 4 };
      if (cpu > 70) return { strokeStyle: 'dashed' as const, strokeWidth: 3 };
      return { strokeStyle: 'solid' as const, strokeWidth: 2 };
    };

    const shouldShowHalo = (service: typeof services[0]) => 
      service.status === 'error' || service.cpu > 80 || service.memory > 80;

    const getBadges = (service: typeof services[0]) => {
      const badges: Array<{ text: string; placement: string }> = [];
      if (service.cpu > 80) badges.push({ text: 'CPU', placement: 'left-top' });
      if (service.memory > 80) badges.push({ text: 'MEM', placement: 'right-top' });
      if (service.status === 'error') badges.push({ text: '⚠', placement: 'right' });
      return badges.length > 0 ? badges : undefined;
    };

    // Apply all conditional logic while mapping
    const nodes: CanvasNode[] = services.map(service => {
      const statusColors = getStatusColor(service.status);
      const cpuStyles = getCpuWarningStyle(service.cpu);
      
      return {
        id: service.id,
        x: service.x,
        y: service.y,
        shape: 'rect',
        width: 100,
        height: 70,
        cornerRadius: 8,
        label: service.name,
        style: {
          ...statusColors,
          ...cpuStyles,
          fillAlpha: service.status === 'offline' ? 0.4 : 0.95,
          halo: shouldShowHalo(service),
          haloStroke: statusColors.fill,
          haloStrokeWidth: 15,
          haloStrokeOpacity: 0.3,
        },
        badges: getBadges(service),
      };
    });

    const options: CanvasOptions = {
      container,
      data: { nodes, edges: [] },
    };
    
    const canvas = new Canvas(options);
    await canvas.init();
    
    // Add status panel
    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.top = '20px';
    panel.style.right = '20px';
    panel.style.padding = '15px';
    panel.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    panel.style.fontSize = '12px';
    panel.style.fontFamily = 'monospace';
    
    const updatePanel = () => {
      const statusCounts = services.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      panel.innerHTML = `
        <div style="color: #333;">
          <strong>Service Status Dashboard</strong><br/><br/>
          <div style="color: #52c41a;">● Online: ${statusCounts.online || 0}</div>
          <div style="color: #faad14;">● Warning: ${statusCounts.warning || 0}</div>
          <div style="color: #ff4d4f;">● Error: ${statusCounts.error || 0}</div>
          <div style="color: #8c8c8c;">● Offline: ${statusCounts.offline || 0}</div>
          <br/>
          <div style="color: #666; font-size: 11px;">
            <strong>Styling Rules:</strong><br/>
            • Color = status<br/>
            • Border = CPU usage<br/>
            • Halo = critical alert<br/>
            • Badges = resource warnings
          </div>
        </div>
      `;
    };
    
    updatePanel();
    container.appendChild(panel);
  },
};
