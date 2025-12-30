import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@invana/canvas-core';

/**
 * # AntV G6 Style Function-Based Styling
 * 
 * This example demonstrates the AntV G6-style function-based styling pattern where style properties
 * can be functions that receive the node data and return computed values.
 * 
 * ## Key Features:
 * - Style properties can be functions: `fill: (d) => d.type === 'user' ? 'blue' : 'red'`
 * - Functions receive complete node data including payload
 * - Works with both global styles and individual node styles
 * - Type-safe with TypeScript generics
 * 
 * ## Pattern Comparison:
 * 
 * ### AntV G6:
 * ```typescript
 * {
 *   node: {
 *     style: {
 *       fill: (d) => d.type === 'user' ? '#1890ff' : '#ff4d4f',
 *       size: (d) => 20 + (d.importance * 30),
 *       stroke: (d) => d.active ? '#52c41a' : '#d9d9d9'
 *     }
 *   }
 * }
 * ```
 * 
 * ### Invana Canvas:
 * ```typescript
 * {
 *   styles: {
 *     node: {
 *       fill: (d) => d.payload?.type === 'user' ? '#1890ff' : '#ff4d4f',
 *       size: (d) => 20 + ((d.payload?.importance ?? 0) * 30),
 *       stroke: (d) => d.payload?.active ? '#52c41a' : '#d9d9d9'
 *     }
 *   }
 * }
 * ```
 */

const meta: Meta = {
  title: 'Canvas/Styling/Nodes/AntV Function-Based Styling',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * Basic function-based styling using global styles
 */
export const BasicFunctionStyling: Story = {
  render: () => {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '600px';
    
    const canvas = new Canvas({
      container: div,
      width: 800,
      height: 600,
      backgroundColor: '#1a1a1a',
      // Global styles with function-based properties
      styles: {
        node: {
          // Color based on node type
          fill: (d) => {
            const type = d.payload?.type;
            if (type === 'user') return '#1890ff';
            if (type === 'group') return '#52c41a';
            if (type === 'system') return '#faad14';
            return '#d9d9d9';
          },
          // Size based on importance
          size: (d) => 20 + ((d.payload?.importance ?? 0.5) * 30),
          // Border color based on active state
          stroke: (d) => d.payload?.active ? '#ffffff' : '#595959',
          strokeWidth: 2,
          // Halo effect for important nodes
          halo: (d) => (d.payload?.importance ?? 0) > 0.7,
          haloStroke: '#faad14',
          haloStrokeWidth: 4,
        },
      },
    });

    canvas.init().then(() => {
      // Add nodes with different types and importance levels
      canvas.render({
        nodes: [
          { 
            id: 'user1', 
            x: 200, 
            y: 150,
            label: 'Admin User',
            payload: { type: 'user', importance: 0.9, active: true }
          },
          { 
            id: 'user2', 
            x: 400, 
            y: 150,
            label: 'Regular User',
            payload: { type: 'user', importance: 0.5, active: false }
          },
          { 
            id: 'group1', 
            x: 200, 
            y: 300,
            label: 'Admin Group',
            payload: { type: 'group', importance: 0.8, active: true }
          },
          { 
            id: 'group2', 
            x: 400, 
            y: 300,
            label: 'User Group',
            payload: { type: 'group', importance: 0.4, active: false }
          },
          { 
            id: 'system1', 
            x: 300, 
            y: 450,
            label: 'System Process',
            payload: { type: 'system', importance: 0.6, active: true }
          },
        ],
        edges: [
          { id: 'e1', source: 'user1', target: 'group1' },
          { id: 'e2', source: 'user2', target: 'group2' },
          { id: 'e3', source: 'group1', target: 'system1' },
          { id: 'e4', source: 'group2', target: 'system1' },
        ],
      });
    });

    return div;
  },
};

/**
 * Conditional styling based on node properties
 */
export const ConditionalFunctionStyling: Story = {
  render: () => {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '600px';
    
    const canvas = new Canvas({
      container: div,
      width: 800,
      height: 600,
      backgroundColor: '#1a1a1a',
      styles: {
        node: {
          // Different shapes based on type (requires shape to be set on node data)
          fill: (d) => {
            const status = d.payload?.status;
            switch (status) {
              case 'success': return '#52c41a';
              case 'warning': return '#faad14';
              case 'error': return '#ff4d4f';
              case 'info': return '#1890ff';
              default: return '#8c8c8c';
            }
          },
          size: 40,
          stroke: '#ffffff',
          strokeWidth: (d) => d.payload?.status === 'error' ? 3 : 2,
          // Show halo for errors
          halo: (d) => d.payload?.status === 'error',
          haloStroke: '#ff4d4f',
          haloStrokeWidth: 6,
          // Label styling based on status
          labelStyle: {
            fill: '#ffffff',
            fontSize: 12,
            fontWeight: (d) => d.payload?.status === 'error' ? 'bold' : 'normal',
          } as any,
        },
      },
    });

    canvas.init().then(() => {
      canvas.render({
        nodes: [
          { 
            id: 'n1', 
            x: 150, 
            y: 200,
            label: 'Success',
            payload: { status: 'success' }
          },
          { 
            id: 'n2', 
            x: 300, 
            y: 200,
            label: 'Warning',
            payload: { status: 'warning' }
          },
          { 
            id: 'n3', 
            x: 450, 
            y: 200,
            label: 'Error',
            payload: { status: 'error' }
          },
          { 
            id: 'n4', 
            x: 600, 
            y: 200,
            label: 'Info',
            payload: { status: 'info' }
          },
          { 
            id: 'n5', 
            x: 300, 
            y: 350,
            label: 'Pending',
            payload: { status: 'pending' }
          },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n5' },
          { id: 'e2', source: 'n2', target: 'n5' },
          { id: 'e3', source: 'n3', target: 'n5' },
          { id: 'e4', source: 'n4', target: 'n5' },
        ],
      });
    });

    return div;
  },
};

/**
 * Mixed approach: Global function-based defaults + Individual style overrides
 */
export const MixedFunctionStyling: Story = {
  render: () => {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '600px';
    
    const canvas = new Canvas({
      container: div,
      width: 800,
      height: 600,
      backgroundColor: '#1a1a1a',
      // Global function-based defaults
      styles: {
        node: {
          fill: (d) => d.payload?.category === 'primary' ? '#1890ff' : '#8c8c8c',
          size: (d) => 30 + ((d.payload?.level ?? 1) * 10),
          stroke: '#ffffff',
          strokeWidth: 2,
        },
      },
    });

    canvas.init().then(() => {
      canvas.render({
        nodes: [
          // Uses global function-based styling
          { 
            id: 'n1', 
            x: 200, 
            y: 200,
            label: 'Level 3',
            payload: { category: 'primary', level: 3 }
          },
          // Uses global styling
          { 
            id: 'n2', 
            x: 400, 
            y: 200,
            label: 'Level 2',
            payload: { category: 'secondary', level: 2 }
          },
          // Individual style override with function
          { 
            id: 'n3', 
            x: 300, 
            y: 350,
            label: 'Special',
            payload: { category: 'primary', level: 4 },
            style: {
              fill: (d) => '#52c41a', // Override with custom function
              halo: true,
              haloStroke: '#52c41a',
              haloStrokeWidth: 4,
            },
          },
          // Individual style with static value override
          { 
            id: 'n4', 
            x: 500, 
            y: 350,
            label: 'Custom',
            payload: { category: 'primary', level: 1 },
            style: {
              fill: '#faad14', // Static override
              size: 50, // Static size
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n3' },
          { id: 'e2', source: 'n2', target: 'n3' },
          { id: 'e3', source: 'n3', target: 'n4' },
        ],
      });
    });

    return div;
  },
};

/**
 * Advanced: Gradient-based styling using node metrics
 */
export const GradientFunctionStyling: Story = {
  render: () => {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '600px';
    
    // Helper function to generate gradient color
    const getGradientColor = (value: number, min: number, max: number): string => {
      const normalized = (value - min) / (max - min);
      const r = Math.round(255 * normalized);
      const g = Math.round(100 * (1 - normalized));
      const b = Math.round(255 * (1 - normalized));
      return `rgb(${r}, ${g}, ${b})`;
    };
    
    const canvas = new Canvas({
      container: div,
      width: 800,
      height: 600,
      backgroundColor: '#1a1a1a',
      styles: {
        node: {
          // Gradient color based on metric value
          fill: (d) => {
            const value = d.payload?.metric ?? 0;
            return getGradientColor(value, 0, 100);
          },
          // Size proportional to metric
          size: (d) => 20 + ((d.payload?.metric ?? 0) * 0.3),
          stroke: '#ffffff',
          strokeWidth: 1,
          // Halo for high values
          halo: (d) => (d.payload?.metric ?? 0) > 75,
          haloStroke: '#ff4d4f',
          haloStrokeWidth: 3,
        },
      },
    });

    canvas.init().then(() => {
      // Generate nodes with metric values
      const nodes = [];
      const edges = [];
      
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 4; j++) {
          const id = `n${i}-${j}`;
          const metric = (i * 4 + j) * 5; // 0 to 95
          
          nodes.push({
            id,
            x: 100 + i * 150,
            y: 100 + j * 120,
            label: `${metric}`,
            payload: { metric },
          });
          
          // Connect to next node in row
          if (j < 3) {
            edges.push({
              id: `e${id}-v`,
              source: id,
              target: `n${i}-${j + 1}`,
            });
          }
          
          // Connect to next column
          if (i < 4) {
            edges.push({
              id: `e${id}-h`,
              source: id,
              target: `n${i + 1}-${j}`,
            });
          }
        }
      }
      
      canvas.render({ nodes, edges });
    });

    return div;
  },
};

/**
 * Complex: Network monitoring dashboard with dynamic styling
 */
export const NetworkMonitoringDashboard: Story = {
  render: () => {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '600px';
    
    const canvas = new Canvas({
      container: div,
      width: 800,
      height: 600,
      backgroundColor: '#0a0a0a',
      styles: {
        node: {
          fill: (d) => {
            const health = d.payload?.health ?? 100;
            const load = d.payload?.load ?? 0;
            
            // Red if unhealthy
            if (health < 50) return '#ff4d4f';
            // Orange if high load
            if (load > 80) return '#faad14';
            // Yellow if medium load
            if (load > 50) return '#fadb14';
            // Green if healthy
            return '#52c41a';
          },
          size: (d) => {
            const connections = d.payload?.connections ?? 1;
            return 25 + Math.sqrt(connections) * 5;
          },
          stroke: (d) => {
            const isActive = d.payload?.isActive ?? false;
            return isActive ? '#ffffff' : '#595959';
          },
          strokeWidth: (d) => d.payload?.isActive ? 3 : 1,
          halo: (d) => {
            const health = d.payload?.health ?? 100;
            return health < 30; // Critical health
          },
          haloStroke: '#ff4d4f',
          haloStrokeWidth: 5,
          labelStyle: {
            fill: '#ffffff',
            fontSize: 10,
            fontWeight: (d) => d.payload?.isActive ? 'bold' : 'normal',
          } as any,
        },
        edge: {
          stroke: (d) => {
            const bandwidth = d.payload?.bandwidth ?? 0;
            if (bandwidth > 80) return '#ff4d4f';
            if (bandwidth > 50) return '#faad14';
            return '#1890ff';
          },
          strokeWidth: (d) => {
            const bandwidth = d.payload?.bandwidth ?? 10;
            return Math.max(1, bandwidth / 25);
          },
          alpha: (d) => {
            const latency = d.payload?.latency ?? 0;
            return Math.max(0.3, 1 - (latency / 200));
          },
        } as any,
      },
    });

    canvas.init().then(() => {
      canvas.render({
        nodes: [
          { 
            id: 'server1', 
            x: 200, 
            y: 150,
            label: 'Server 1',
            payload: { 
              health: 95, 
              load: 45, 
              connections: 150, 
              isActive: true 
            }
          },
          { 
            id: 'server2', 
            x: 600, 
            y: 150,
            label: 'Server 2',
            payload: { 
              health: 30, 
              load: 85, 
              connections: 200, 
              isActive: true 
            }
          },
          { 
            id: 'lb1', 
            x: 400, 
            y: 300,
            label: 'Load Balancer',
            payload: { 
              health: 100, 
              load: 60, 
              connections: 350, 
              isActive: true 
            }
          },
          { 
            id: 'db1', 
            x: 250, 
            y: 450,
            label: 'Database 1',
            payload: { 
              health: 85, 
              load: 70, 
              connections: 80, 
              isActive: false 
            }
          },
          { 
            id: 'db2', 
            x: 550, 
            y: 450,
            label: 'Database 2',
            payload: { 
              health: 40, 
              load: 90, 
              connections: 120, 
              isActive: true 
            }
          },
        ],
        edges: [
          { 
            id: 'e1', 
            source: 'server1', 
            target: 'lb1',
            payload: { bandwidth: 45, latency: 20 }
          },
          { 
            id: 'e2', 
            source: 'server2', 
            target: 'lb1',
            payload: { bandwidth: 85, latency: 15 }
          },
          { 
            id: 'e3', 
            source: 'lb1', 
            target: 'db1',
            payload: { bandwidth: 30, latency: 50 }
          },
          { 
            id: 'e4', 
            source: 'lb1', 
            target: 'db2',
            payload: { bandwidth: 95, latency: 80 }
          },
        ],
      });
    });

    return div;
  },
};
