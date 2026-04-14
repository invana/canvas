/**
 * Force Layout Tree Story
 * 
 * Demonstrates a large tree rendered with the force layout plugin.
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, PluginRegistry } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
import { generateRandomTree } from '@invana/example-datasets';
import { createContainer } from '../../../src/div-utils';

// Register plugins
PluginRegistry.register('graph-data', GraphDataPlugin);
PluginRegistry.register('layout-d3-force', D3ForceLayoutPlugin);

const meta: Meta = {
  title: 'Layouts/d3-force Trees',
};

export default meta;
type Story = StoryObj;



const rawTreeData = generateRandomTree(5000)
console.log('Generated random tree data:', rawTreeData);
/**
 * Convert generated tree data to canvas format
 */
const convertRandomTreeData = () => {
  return {
    nodes: rawTreeData.nodes.map((node: any) => ({
      id: node.index.toString(),
      shape: 'circle' as const,
      size: 5,
      label: "Node",
    })),
    edges: rawTreeData.edges.map((edge: any, idx: number) => ({
      id: `e${idx}`,
      source: edge.source.toString(),
      target: edge.target.toString(),
      pathType: 'straight' as const,
    })),
  };
};


export const RawTree: Story = {
  name: 'Raw Tree',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const graphData = convertRandomTreeData();

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'solid',
            color: '#202020',
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            data: graphData,
            styles: {
              node: {
                fill:   '#249cc4',              
                stroke: () => '#fdfdfd',  // Gray stroke for light background
                strokeWidth: () => 1,
                labelFontSize: () => 10,
                labelFill: () => '#ffffff',  // Black text for light background
                labelPosition: () => "top-right",
              },
              edge: {
                stroke: () => '#767676',  // Gray edges for light background
                strokeWidth: () => 1,
                strokeAlpha: () => 0.6,
              },
            },
            fitOnRender: false,
            fitPadding: 80,
          },
        },
        {
          plugin: 'layout-d3-force',
          key: 'layout',
          options: {
            // Use the layout plugin defaults
            animate: false
          },
        },
      ],
    });

    await canvas.init();
    console.log('Canvas initialized');

    // Verify graph data was rendered (use the key from config: 'graph')
    // const graphDataPlugin = canvas.getPluginByKey('graph') as GraphDataPlugin;
    // console.log('GraphDataPlugin:', graphDataPlugin);
    // console.log('Renderer nodes count:', graphDataPlugin.renderer?.getNodes().length);

    // Graph is already rendered via declarative config (data passed in options)
    // Now start the force layout to position the nodes
    const layoutPlugin = canvas.getPluginByKey('layout') as D3ForceLayoutPlugin;
    
    if (!layoutPlugin) {
      console.error('Layout plugin not found!');
      return;
    }
    
    await layoutPlugin.start();
  },
};
