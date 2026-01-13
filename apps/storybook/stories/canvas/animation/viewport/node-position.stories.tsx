/**
 * Node Position Stories
 * 
 * Demonstrates basic graph rendering with positioned nodes:
 * - 4 nodes (A, B, C, D) arranged in a square layout
 * - Different shapes for visual distinction
 * - Edges connecting nodes in a cycle pattern
 * 
 * Uses GraphDataPlugin for rendering graph data
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import { createContainer } from '../../../../src/div-utils';

const meta: Meta = {
  title: 'Canvas/Animation/Viewport',
};

export default meta;
type Story = StoryObj;

export const NodePosition: Story = {
  name: 'Node Position',
  render: () => {
    const container = createContainer();
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // Create canvas with default behavior
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      behavior: 'default',
    });

    await canvas.init();

    // Create and register GraphDataPlugin
    const graphPlugin = new GraphDataPlugin({
      fitOnRender: true,
      fitPadding: 50
    });
    await canvas.registerPlugin(graphPlugin);

    // Set simple graph data with 4 nodes and 4 edges
    graphPlugin.setData({
      nodes: [
        { 
          id: 'A', 
          x: -150, 
          y: -150, 
          shape: 'circle' as const, 
          size: 50, 
          label: 'Node A',
          style: { fill: '#4a90e2', stroke: '#2c5aa0', strokeWidth: 3 }
        },
        { 
          id: 'B', 
          x: 150, 
          y: -150, 
          shape: 'rect' as const, 
          width: 100, 
          height: 70, 
          cornerRadius: 10,
          label: 'Node B',
          style: { fill: '#50c878', stroke: '#2d7a4a', strokeWidth: 3 }
        },
        { 
          id: 'C', 
          x: -150, 
          y: 150, 
          shape: 'diamond' as const, 
          size: 60, 
          label: 'Node C',
          style: { fill: '#ff6b6b', stroke: '#cc3333', strokeWidth: 3 }
        },
        { 
          id: 'D', 
          x: 150, 
          y: 150, 
          shape: 'hexagon' as const, 
          size: 55, 
          label: 'Node D',
          style: { fill: '#ffd93d', stroke: '#ccaa00', strokeWidth: 3 }
        },
      ],
      edges: [
        { 
          id: 'e1', 
          source: 'A', 
          target: 'B', 
          pathType: 'bezier' as const,
          style: { stroke: '#666', strokeWidth: 2 }
        },
        { 
          id: 'e2', 
          source: 'B', 
          target: 'D', 
          pathType: 'bezier' as const,
          style: { stroke: '#666', strokeWidth: 2 }
        },
        { 
          id: 'e3', 
          source: 'D', 
          target: 'C', 
          pathType: 'bezier' as const,
          style: { stroke: '#666', strokeWidth: 2 }
        },
        { 
          id: 'e4', 
          source: 'C', 
          target: 'A', 
          pathType: 'bezier' as const,
          style: { stroke: '#666', strokeWidth: 2 }
        },
      ],
    });

    // Animate nodes one by one - move each node up by 100 pixels
    const nodeIds = ['A', 'B', 'C', 'D'];
    const nodeData = graphPlugin.getNodeData();
    
    nodeIds.forEach((nodeId, index) => {
      setTimeout(() => {
        const node = nodeData.get(nodeId);
        if (node) {
          graphPlugin.updateNodePosition(nodeId, node.x, node.y - 100);
        }
      }, (index + 1) * 1000); // 1 second gap between each update
    });
  }
};
