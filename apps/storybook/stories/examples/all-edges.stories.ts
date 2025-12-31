/**
 * All Edge Types Matrix
 * Showcases all edge types (line, bezier, orthogonal) connecting all node shapes
 * Demonstrates edge boundary offsets and intersection angles
 */

import type { Meta, StoryObj } from '@storybook/html';
import { BackgroundPlugin, Canvas } from '@invana/canvas-core';
import GUI from 'lil-gui';

const meta: Meta = {
  title: 'Examples/All Edge Types Matrix',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// Helper to create container
const createContainer = () => {
  const container = document.createElement('div');
  container.id = 'canvas-example';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.margin = '0';
  container.style.padding = '0';
  return container;
};

// All available node shapes
const NODE_SHAPES = [
  'circle',
  'rect',
  'diamond',
  'hexagon',
  'ellipse',
  'triangle',
  'star',
  'pentagon',
  'octagon',
] as const;

// All available edge types
const EDGE_TYPES = ['line', 'bezier', 'orthogonal'] as const;


export const AngledConnections: Story = {
  name: 'Angled Connections Showcase',
  render: () => {
    const container = createContainer();
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // Create a star pattern to showcase various angles
    const centerNode = {
      id: 'center',
      x: 0,
      y: 0,
      shape: 'circle' as const,
      size: 60,
      label: 'Center',
    };

    const nodes: any[] = [centerNode];
    const edges: any[] = [];
    
    const shapes = ['rect', 'diamond', 'hexagon', 'triangle', 'pentagon', 'star', 'octagon', 'ellipse'];
    const radius = 300;
    const angleStep = (Math.PI * 2) / shapes.length;
    
    shapes.forEach((shape, index) => {
      const angle = index * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      const nodeId = `outer-${shape}`;
      nodes.push({
        id: nodeId,
        x,
        y,
        shape,
        size: 50,
        label: shape,
      });
      
      // Connect with different edge types
      const edgeType = EDGE_TYPES[index % EDGE_TYPES.length];
      edges.push({
        id: `e-${index}`,
        source: 'center',
        target: nodeId,
        pathType: edgeType,
        label: `${angle.toFixed(1)}°`,
      });
      
      // Connect to next outer node (circular)
      const nextIndex = (index + 1) % shapes.length;
      const nextShape = shapes[nextIndex];
      edges.push({
        id: `e-outer-${index}`,
        source: nodeId,
        target: `outer-${nextShape}`,
        pathType: EDGE_TYPES[(index + 1) % EDGE_TYPES.length],
      });
    });

    const canvas = new Canvas({
      container,
      behavior: 'default',
      edgeBoundaryOffset: 10,
      styles: {
        node: {
          fill: '#9b59b6',
          stroke: '#8e44ad',
          strokeWidth: 2,
          halo: true    
        },
        edge: {
          stroke: '#7f8c8d',
          strokeWidth: 2,
    
        },
      },
    });

    await canvas.init();
    const bgPlugin = new BackgroundPlugin();
    canvas.registerPlugin(bgPlugin);
    bgPlugin.setBackground({
      type: 'pattern' as const,
      patternType: 'dots' as const,
      color: '#595959',
      backgroundColor: '#212121',
      size: 1.5,
      spacing: 30,
      alpha: 0.6
    });

    canvas.render({ nodes, edges });

    // Add GUI controls
    const gui = new GUI({ title: 'Angle Controls' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
    container.appendChild(gui.domElement);

    const settings = {
      edgeBoundaryOffset: 10,
      strokeWidth: 2,
      showAngles: true,
    };

    gui.add(settings, 'edgeBoundaryOffset', 0, 50, 1)
      .name('Edge Offset')
      .onChange((value: number) => {
        canvas.setOptions({ edgeBoundaryOffset: value });
        canvas.render({ nodes, edges });
      });

    gui.add(settings, 'strokeWidth', 1, 10, 0.5)
      .name('Stroke Width')
      .onChange((value: number) => {
        canvas.setStyles({
          edge: {
            strokeWidth: value,
          },
        });
      });

    gui.add(settings, 'showAngles')
      .name('Show Angles')
      .onChange((value: boolean) => {
        canvas.setStyles({
          edge: {
            label: value ? {
              text: (edge: any) => edge.label || '',
              fontSize: 10,
              fill: '#34495e',
              backgroundColor: '#ecf0f1',
              padding: 4,
            } : {
              text: '',
            },
          },
        });
      });
  },
};
