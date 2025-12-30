/**
 * All Edge Types Matrix
 * Showcases all edge types (line, bezier, orthogonal) connecting all node shapes
 * Demonstrates edge boundary offsets and intersection angles
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@invana/canvas-core';
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

// Generate comprehensive edge matrix
const generateEdgeMatrix = () => {
  const nodes: any[] = [];
  const edges: any[] = [];
  
  // Layout configuration
  const cols = 5;
  const rowSpacing = 200;
  const colSpacing = 220;
  const startX = -400;
  const startY = -600;
  
  // Create a grid of nodes with all shapes
  NODE_SHAPES.forEach((shape, shapeIndex) => {
    const row = Math.floor(shapeIndex / cols);
    const col = shapeIndex % cols;
    const x = startX + col * colSpacing;
    const y = startY + row * rowSpacing;
    
    nodes.push({
      id: `node-${shape}`,
      x,
      y,
      shape,
      size: shape === 'ellipse' ? undefined : 50,
      width: shape === 'ellipse' || shape === 'rect' ? 100 : undefined,
      height: shape === 'ellipse' || shape === 'rect' ? 60 : undefined,
      label: shape.charAt(0).toUpperCase() + shape.slice(1),
    });
  });
  
  // Create edges between adjacent nodes with different edge types
  let edgeId = 0;
  NODE_SHAPES.forEach((sourceShape, sourceIndex) => {
    // Connect to next node in row (horizontal)
    if ((sourceIndex + 1) % cols !== 0 && sourceIndex + 1 < NODE_SHAPES.length) {
      const targetShape = NODE_SHAPES[sourceIndex + 1];
      const edgeType = EDGE_TYPES[edgeId % EDGE_TYPES.length];
      edges.push({
        id: `e-h-${edgeId}`,
        source: `node-${sourceShape}`,
        target: `node-${targetShape}`,
        pathType: edgeType,
        label: edgeType,
      });
      edgeId++;
    }
    
    // Connect to node below (vertical)
    if (sourceIndex + cols < NODE_SHAPES.length) {
      const targetShape = NODE_SHAPES[sourceIndex + cols];
      const edgeType = EDGE_TYPES[edgeId % EDGE_TYPES.length];
      edges.push({
        id: `e-v-${edgeId}`,
        source: `node-${sourceShape}`,
        target: `node-${targetShape}`,
        pathType: edgeType,
        label: edgeType,
      });
      edgeId++;
    }
    
    // Connect to diagonal (showcase angles)
    if ((sourceIndex + 1) % cols !== 0 && sourceIndex + cols + 1 < NODE_SHAPES.length) {
      const targetShape = NODE_SHAPES[sourceIndex + cols + 1];
      const edgeType = EDGE_TYPES[edgeId % EDGE_TYPES.length];
      edges.push({
        id: `e-d-${edgeId}`,
        source: `node-${sourceShape}`,
        target: `node-${targetShape}`,
        pathType: edgeType,
        label: edgeType,
      });
      edgeId++;
    }
  });
  
  return { nodes, edges };
};

export const AllEdgeTypesMatrix: Story = {
  name: 'All Edge Types Matrix',
  render: () => {
    const container = createContainer();
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const { nodes, edges } = generateEdgeMatrix();

    const canvas = new Canvas({
      container,
      behavior: 'default',
      edgeBoundaryOffset: 5,
      styles: {
        node: {
          fill: '#4a90e2',
          stroke: '#2c5aa0',
          strokeWidth: 2,
          label: {
            text: (node: any) => node.label || node.id,
            fontSize: 12,
            fill: '#ffffff',
          },
        },
        edge: {
          stroke: '#666666',
          strokeWidth: 2,
          label: {
            text: (edge: any) => edge.label || '',
            fontSize: 10,
            fill: '#666666',
            backgroundColor: '#ffffff',
            padding: 4,
          },
        },
      },
    });

    await canvas.init();
    canvas.render({ nodes, edges });

    // Add GUI controls for edge boundary offset
    const gui = new GUI({ title: 'Edge Controls' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
    container.appendChild(gui.domElement);

    const settings = {
      edgeBoundaryOffset: 5,
      strokeWidth: 2,
      showLabels: true,
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

    gui.add(settings, 'showLabels')
      .name('Show Labels')
      .onChange((value: boolean) => {
        canvas.setStyles({
          edge: {
            label: value ? {
              text: (edge: any) => edge.label || '',
              fontSize: 10,
              fill: '#666666',
              backgroundColor: '#ffffff',
              padding: 4,
            } : {
              text: '',
            },
          },
        });
      });
  },
};

export const EdgeTypeComparison: Story = {
  name: 'Edge Type Comparison',
  render: () => {
    const container = createContainer();
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // Create three columns showing the same connections with different edge types
    const nodes: any[] = [];
    const edges: any[] = [];
    
    const shapes = ['circle', 'rect', 'diamond', 'hexagon', 'star'];
    const edgeTypes: any[] = ['line', 'bezier', 'orthogonal'];
    
    edgeTypes.forEach((edgeType, colIndex) => {
      const xOffset = (colIndex - 1) * 400;
      
      // Create vertical column of nodes
      shapes.forEach((shape, rowIndex) => {
        const nodeId = `${edgeType}-${shape}`;
        nodes.push({
          id: nodeId,
          x: xOffset,
          y: rowIndex * 150 - 300,
          shape,
          size: 50,
          label: colIndex === 0 ? shape : '',
        });
        
        // Connect to next node
        if (rowIndex < shapes.length - 1) {
          edges.push({
            id: `e-${edgeType}-${rowIndex}`,
            source: nodeId,
            target: `${edgeType}-${shapes[rowIndex + 1]}`,
            pathType: edgeType,
            label: rowIndex === 0 ? edgeType : '',
          });
        }
      });
      
      // Add title node
      nodes.push({
        id: `title-${edgeType}`,
        x: xOffset,
        y: -450,
        shape: 'rect',
        width: 100,
        height: 40,
        label: edgeType.toUpperCase(),
      });
    });

    const canvas = new Canvas({
      container,
      behavior: 'default',
      edgeBoundaryOffset: 8,
      styles: {
        node: {
          fill: '#e74c3c',
          stroke: '#c0392b',
          strokeWidth: 2,
          label: {
            text: (node: any) => node.label || '',
            fontSize: 14,
            fill: '#ffffff',
            fontWeight: 'bold',
          },
        },
        edge: {
          stroke: '#34495e',
          strokeWidth: 3,
          label: {
            text: (edge: any) => edge.label || '',
            fontSize: 12,
            fill: '#2c3e50',
            backgroundColor: '#ecf0f1',
            padding: 6,
          },
        },
      },
    });

    await canvas.init();
    canvas.render({ nodes, edges });

    // Add GUI controls
    const gui = new GUI({ title: 'Comparison Controls' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
    container.appendChild(gui.domElement);

    const settings = {
      edgeBoundaryOffset: 8,
      curved: true,
    };

    gui.add(settings, 'edgeBoundaryOffset', 0, 50, 1)
      .name('Edge Offset')
      .onChange((value: number) => {
        canvas.setOptions({ edgeBoundaryOffset: value });
        canvas.render({ nodes, edges });
      });
  },
};

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
      background: {
        type: 'pattern' as const,
        patternType: 'grid' as const,
        color: '#b3e7ff',
        backgroundColor: '#212121',
        spacing: 25,
        lineWidth: 0.5,
        alpha: 0.8,
        follow: true
      },
      styles: {
        node: {
          fill: '#9b59b6',
          stroke: '#8e44ad',
          strokeWidth: 2,
    
        },
        edge: {
          stroke: '#7f8c8d',
          strokeWidth: 2,
    
        },
      },
    });

    await canvas.init();
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
