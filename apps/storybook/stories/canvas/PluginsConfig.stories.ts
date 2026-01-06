/**
 * Plugin Configuration Story
 * 
 * Demonstrates passing graph data through Canvas options using the plugins array.
 * This is a declarative approach where data is provided upfront during canvas creation.
 * 
 * Two approaches shown:
 * 1. Declarative (this story): Pass everything via CanvasOptions.plugins
 * 2. Imperative (Theming.stories): Create plugin, register it, call setData()
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, BackgroundPlugin, PluginRegistry } from '@invana/canvas-core';
import { createContainer } from '../../src/div-utils';

// Register GraphDataPlugin before using it declaratively
PluginRegistry.register('graph-data', GraphDataPlugin);

const meta: Meta = {
  title: 'Canvas/Plugin Configuration',
};

export default meta;
type Story = StoryObj;

// Sample graph data
const graphData = {
  nodes: [
    { id: 'n1', x: -200, y: -100, shape: 'circle' as const, size: 50, label: 'Node 1' },
    { id: 'n2', x: 0, y: -100, shape: 'rect' as const, width: 80, height: 60, label: 'Node 2' },
    { id: 'n3', x: 200, y: -100, shape: 'diamond' as const, size: 60, label: 'Node 3' },
    { id: 'n4', x: -200, y: 100, shape: 'hexagon' as const, size: 55, label: 'Node 4' },
    { id: 'n5', x: 0, y: 100, shape: 'star' as const, size: 55, label: 'Node 5' },
    { id: 'n6', x: 200, y: 100, shape: 'triangle' as const, size: 50, label: 'Node 6' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' as const },
    { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' as const },
    { id: 'e3', source: 'n1', target: 'n4', pathType: 'polyline' as const },
    { id: 'e4', source: 'n2', target: 'n5', pathType: 'bezier' as const },
    { id: 'e5', source: 'n3', target: 'n6', pathType: 'polyline' as const },
    { id: 'e6', source: 'n4', target: 'n5', pathType: 'bezier' as const },
    { id: 'e7', source: 'n5', target: 'n6', pathType: 'bezier' as const },
  ],
};

/**
 * Declarative Plugin Configuration
 * 
 * Pass graph data directly in Canvas options using the plugins array.
 * The canvas will automatically create and initialize the plugin with your data.
 */
export const DeclarativePlugins: Story = {
  name: 'Declarative Plugin Configuration',
  render: () => {
    const container = createContainer();
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // Create canvas with all plugins and data configured upfront
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [
        // Background plugin
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'grid',
            color: '#e0e0e0',
            backgroundColor: '#ffffff',
            spacing: 20,
            lineWidth: 1,
            alpha: 0.5,
          },
        },
        // Graph data plugin with data and styles
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            data: graphData,
            styles: {
              node: {
                fill: () => '#5cd43e',
                stroke: () => '#2d8f1a',
                strokeWidth: () => 2,
                labelFontSize: () => 14,
                labelFill: () => '#000000',
              },
              edge: {
                stroke: () => '#999999',
                strokeWidth: () => 2,
              },
            },
            fitOnRender: true,
            fitPadding: 50,
          },
        },
      ],
    });

    // Just init - everything is already configured!
    await canvas.init();

    console.log('Canvas initialized with declarative plugin configuration');
    console.log('Graph plugin:', canvas.getPlugin('graph'));
    console.log('Background plugin:', canvas.getPlugin('bg'));
  },
};

/**
 * Imperative Plugin Configuration
 * 
 * Traditional approach: create canvas, register plugins manually, set data.
 * More flexible for dynamic scenarios where you need to change data frequently.
 */
export const ImperativePlugins: Story = {
  name: 'Imperative Plugin Configuration',
  render: () => {
    const container = createContainer();
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // Create canvas with minimal options
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      behavior: 'default',
    });

    await canvas.init();

    // Register background plugin
    const bgPlugin = new BackgroundPlugin();
    await canvas.registerPlugin(bgPlugin, { userKey: 'bg' });
    bgPlugin.setOptions({
      type: 'pattern',
      patternType: 'dots',
      color: '#b3d9ff',
      backgroundColor: '#f5f5f5',
      size: 2,
      spacing: 25,
      alpha: 0.6,
    });

    // Register graph plugin
    const graphPlugin = new GraphDataPlugin({
      fitOnRender: true,
      fitPadding: 50,
    });
    await canvas.registerPlugin(graphPlugin, { userKey: 'graph' });

    // Set data and styles
    graphPlugin.setData(graphData);
    graphPlugin.setStyles({
      node: {
        fill: () => '#1890ff',
        stroke: () => '#0050b3',
        strokeWidth: () => 2,
        labelFontSize: () => 14,
        labelFill: () => '#000000',
      },
      edge: {
        stroke: () => '#d9d9d9',
        strokeWidth: () => 2,
      },
    });

    console.log('Canvas initialized with imperative plugin configuration');
    console.log('Graph plugin:', canvas.getPlugin('graph'));
    console.log('Background plugin:', canvas.getPlugin('bg'));
  },
};

/**
 * Comparing Both Approaches
 * 
 * Declarative:
 * ✅ Cleaner code - everything in one place
 * ✅ Better for static/initial configuration
 * ✅ Serializable (can save/load canvas state)
 * ❌ Less flexible for dynamic changes
 * 
 * Imperative:
 * ✅ More flexible - change data anytime
 * ✅ Better for interactive apps with frequent updates
 * ✅ Explicit control over plugin lifecycle
 * ❌ More verbose
 * ❌ Not serializable
 */
