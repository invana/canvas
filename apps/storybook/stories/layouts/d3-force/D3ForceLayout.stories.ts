/**
 * D3 Force Layout Story
 * 
 * Demonstrates force-directed graph layout using the D3ForceLayoutPlugin
 * from @invana/layouts-d3-force package (separate from canvas-core).
 * 
 * Uses the Les Misérables dataset - character co-occurrence network from
 * Victor Hugo's novel (77 nodes, 254 edges).
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, PluginRegistry } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
import { lesMiserablesDataRaw } from '@invana/example-datasets';
import { createContainer } from '../../../src/div-utils';

// Register plugins
PluginRegistry.register('graph-data', GraphDataPlugin);
PluginRegistry.register('layout-d3-force', D3ForceLayoutPlugin);

const meta: Meta = {
  title: 'Layouts/d3-force',
};

export default meta;
type Story = StoryObj;

// Color palette for groups
const groupColors = [
  '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3',
  '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd'
];

/**
 * Convert Les Misérables raw data to canvas format
 */
const convertLesMiserablesData = () => {
  return {
    nodes: lesMiserablesDataRaw.nodes.map((node: any) => ({
      id: node.id,
      // x: 0, // D3 force layout will compute positions
      // y: 0,
      shape: 'circle' as const,
      size: 25,
      label: node.id,
    })),
    edges: lesMiserablesDataRaw.edges.map((edge: any, idx: number) => ({
      id: `e${idx}`,
      source: edge.source,
      target: edge.target,
      pathType: 'bezier' as const,
    })),
  };
};

/**
 * Les Misérables Network
 * 
 * Character co-occurrence network from Victor Hugo's Les Misérables.
 * 77 characters (nodes) connected by 254 co-appearances (edges).
 * Node colors represent community groups.
 */
export const LesMiserables: Story = {
  name: 'Les Misérables Network',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const graphData = convertLesMiserablesData();

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
            color: '#1a1a1a',
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            data: graphData,
            styles: {
              node: {
                fill: (node: any) => {
                  const rawNode = lesMiserablesDataRaw.nodes.find((n: any) => n.id === node.id);
                  return groupColors[rawNode?.group % groupColors.length] || '#8dd3c7';
                },
                stroke: () => '#ffffff',
                strokeWidth: () => 2,
                labelFontSize: () => 10,
                labelFill: () => '#ffffff',
              },
              edge: {
                stroke: () => '#444444',
                strokeWidth: () => 1,
                strokeAlpha: () => 0.6,
              },
            },
            fitOnRender: true,
            fitPadding: 80,
          },
        },
        {
          plugin: 'layout-d3-force',
          key: 'layout',
          options: {
            // charge: -400,         // Stronger repulsion for better spread
            // linkDistance: 100,    // More space between connected nodes
            // collisionRadius: 30,  // Prevent overlap
            // animate: true,
          },
        },
      ],
    });

    await canvas.init();

    // Start force layout (use getPluginByKey for declarative config)
    const layoutPlugin = canvas.getPluginByKey('layout') as D3ForceLayoutPlugin;
    
    if (!layoutPlugin) {
      console.error('Layout plugin not found!');
      return;
    }
    
    console.log('Les Misérables: Starting force layout (77 nodes, 254 edges)...');
    await layoutPlugin.start();
    console.log('Les Misérables: Layout complete!');
  },
};
