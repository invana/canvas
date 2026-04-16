import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, type GroupsPlugin } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
import { generateRandomTree } from '@invana/example-datasets';
import { createContainer } from '../../src/div-utils';

const rawTree = generateRandomTree(16);
const GRAPH_DATA = {
  nodes: rawTree.nodes.map((n: any) => ({
    id: String(n.index),
    shape: 'circle' as const,
    size: 10,
    label: `N${n.index}`,
  })),
  edges: rawTree.edges.map((e: any, i: number) => ({
    id: `e${i}`,
    source: String(e.source),
    target: String(e.target),
    pathType: 'straight' as const,
  })),
};

const meta: Meta = {
  title: 'Plugins/Groups',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

/**
 * Visual grouping of nodes with labelled bounding boxes.
 */
export const Groups: Story = {
  render: () => createContainer({ id: 'plugin-groups' }),
  play: async () => {
    const container = document.getElementById('plugin-groups');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: false,
      plugins: ['groups'],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: false, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);
    const layout = new D3ForceLayoutPlugin({ charge: -200, collisionRadius: 25, animate: true, iterations: 300 });
    await canvas.registerPlugin(layout);
    await layout.start();

    const groups = canvas.getPlugin<GroupsPlugin>('groups');
    groups?.addGroup({
      id:      'cluster-1',
      nodeIds: ['0', '1', '2', '3', '4'],
      x: -340, y: -220, width: 420, height: 430,
      label: 'Cluster A',
      style: { stroke: '#38bdf8', strokeWidth: 2 },
    });
    groups?.addGroup({
      id:      'cluster-2',
      nodeIds: ['5', '6', '7', '8', '9'],
      x: -10, y: -220, width: 470, height: 430,
      label: 'Cluster B',
      style: { stroke: '#a78bfa', strokeWidth: 2 },
    });
  },
};
