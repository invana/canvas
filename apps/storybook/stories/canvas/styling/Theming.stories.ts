/**
 * Theming Stories
 * 
 * Demonstrates dynamic theme switching with:
 * - Blueprint style (dark blue with grid)
 * - Minimal Light (white with subtle dots)
 * - Dark theme (dark gray with dots)
 * 
 * Uses lil-gui for interactive theme switching
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin } from '@invana/canvas-core';
import GUI from 'lil-gui';
import { createContainer, getFullHeightContainer } from '../../../src/div-utils';

const meta: Meta = {
  title: 'Canvas/Styling/Theming',
};

export default meta;
type Story = StoryObj;

// Theme configurations
const themes = {
  blueprint: {
    name: 'Blueprint',
    styles: {
      node: {
        fill: '#58a6ff',
        stroke: '#ffffff',
        strokeWidth: 2,
      },
      edge: {
        stroke: '#58a6ff',
        strokeWidth: 2,
      }
    },
    background: {
      type: 'pattern' as const,
      patternType: 'grid' as const,
      color: '#b3e7ff',
      backgroundColor: '#0b2f66',
      spacing: 25,
      lineWidth: 0.5,
      alpha: 0.8
    }
  },
  light: {
    name: 'Minimal Light',
    styles: {
      node: {
        fill: '#5cd43e',
        stroke: '#333',
        strokeWidth: 2,
      },
      edge: {
        stroke: '#666',
        strokeWidth: 2,
      }
    },
    background: {
      type: 'pattern' as const,
      patternType: 'dots' as const,
      color: '#b0b0b0',
      backgroundColor: '#fafafa',
      size: 1.5,
      spacing: 30,
      alpha: 0.6
    }
  },
  dark: {
    name: 'Dark',
    styles: {
      node: {
        fill: '#2043dc',
        stroke: '#e37200',
        strokeWidth: 2,
      },
      edge: {
        stroke: '#58a6ff',
        strokeWidth: 2,
      }
    },
    background: {
      type: 'pattern' as const,
      patternType: 'dots' as const,
      color: '#595959',
      backgroundColor: '#212121',
      size: 1.5,
      spacing: 30,
      alpha: 0.6
    }
  }
};

// Helper to generate sample graph data
const generateGraphData = () => ({
  nodes: [
    { 
      id: 'n1', x: -300, y: -150, shape: 'circle' as const, size: 40, label: 'Circle',
      style: { strokeWidth: 2 }
    },
    { 
      id: 'n2', x: -100, y: -150, shape: 'rect' as const, width: 80, height: 60, cornerRadius: 8, label: 'Rect',
      style: { fill: '#50c878',strokeWidth: 2 }
    },
    { 
      id: 'n3', x: 100, y: -150, shape: 'diamond' as const, size: 50, label: 'Diamond',
      style: { fill: '#ff6b6b',strokeWidth: 2 }
    },
    { 
      id: 'n4', x: 300, y: -150, shape: 'hexagon' as const, size: 45, label: 'Hexagon',
      style: { fill: '#ffd93d',strokeWidth: 2 }
    },
    { 
      id: 'n5', x: -300, y: 0, shape: 'ellipse' as const, width: 100, height: 60, label: 'Ellipse',
      style: { fill: '#6c5ce7',strokeWidth: 2 }
    },
    { 
      id: 'n6', x: -100, y: 0, shape: 'triangle' as const, size: 50, label: 'Triangle',
      style: { fill: '#ff85a2',strokeWidth: 2 }
    },
    { 
      id: 'n7', x: 100, y: 0, shape: 'star' as const, size: 50, label: 'Star',
      style: { fill: '#a29bfe',strokeWidth: 2 }
    },
    { 
      id: 'n8', x: 300, y: 0, shape: 'pentagon' as const, size: 45, label: 'Pentagon',
      style: { fill: '#fd79a8',strokeWidth: 2 }
    },
    { 
      id: 'n9', x: -200, y: 150, shape: 'octagon' as const, size: 45, label: 'Octagon',
      style: { fill: '#74b9ff',strokeWidth: 2 }
    },
    { 
      id: 'n10', x: 0, y: 150, shape: 'star' as const, size: 45, label: 'Star (5-point)',
      style: { fill: '#55efc4',strokeWidth: 2 }
    },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n5', pathType: 'bezier' as const },
    { id: 'e2', source: 'n2', target: 'n6', pathType: 'bezier' as const },
    { id: 'e3', source: 'n3', target: 'n7', pathType: 'bezier' as const },
    { id: 'e4', source: 'n4', target: 'n8', pathType: 'bezier' as const },
    { id: 'e5', source: 'n5', target: 'n9', pathType: 'bezier' as const },
    { id: 'e6', source: 'n6', target: 'n10', pathType: 'bezier' as const },
  ],
});

export const Theming: Story = {
  name: 'Theming',
  render: () => {
    const container = createContainer();
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');

    if (!container) return;

      let currentTheme = "blueprint";
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        data: generateGraphData(),
        styles: themes.blueprint.styles,
      });

      await canvas.init();

      // Register background plugin
      const bgPlugin = new BackgroundPlugin();
      canvas.registerPlugin(bgPlugin);
      bgPlugin.setBackground(themes.blueprint.background);

      canvas.render();

      // Create GUI for theme switching - positioned at top-right
      const gui = new GUI({ container });
      gui.domElement.style.position = 'absolute';
      gui.domElement.style.top = '10px';
      gui.domElement.style.right = '10px';
      
      const settings = { theme: 'blueprint' };
      
      gui.add(settings, 'theme', ['blueprint', 'light', 'dark'])
        .name('Theme')
        .onChange((value: string) => {
          currentTheme = value;
          const theme = themes[value as keyof typeof themes];
          
          // Update default styles for new elements
          canvas.setStyles(theme.styles);
          
          // Update all existing nodes with new theme
          const nodes = canvas.renderer.getNodes();
          nodes.forEach(node => {
            if (theme.styles.node) {
              node.updateNodeStyle(theme.styles.node as any);
              node.forceRender(); // Force immediate re-render
            }
          });
          
          // Update all existing edges with new theme
          const edges = canvas.renderer.getEdges();
          edges.forEach(edge => {
            if (theme.styles.edge) {
              edge.updateEdgeStyle(theme.styles.edge as any);
              edge.forceRender(); // Force immediate re-render
            }
          });
          
          // Update background
          bgPlugin.setBackground(theme.background);
        });
  }
};

