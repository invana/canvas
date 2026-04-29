/**
 * ELK Layered Layout — Random Tree
 *
 * A randomly generated tree rendered with ElkLayoutPlugin using the
 * `layered` algorithm, which excels at hierarchical / DAG structures.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { ElkLayoutPlugin } from '@invana/plugin-layouts-elkjs';
import { generateRandomTree } from '@invana/plugin-example-datasets';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Layouts/ELK/Random Tree' };
export default meta;
type Story = StoryObj;

export const RandomTree: Story = {
  name: 'Random Tree (layered)',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width:  container.clientWidth  || 1200,
      height: container.clientHeight || 800,
      backgroundColor: '#0f172a',
    });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg',
      type: 'pattern',
      patternType: 'dots',
      color: '#1e293b',
      backgroundColor: '#0f172a',
      size: 1,
      spacing: 30,
    }));

    const graph = new GraphDataPlugin({ key: 'graph-data' });
    await canvas.plugins.register(graph);

    graph.setStyles({
      node: {
        fill:        () => '#6366f1',
        stroke:      () => '#818cf8',
        strokeWidth: () => 1.5,
      },
      edge: {
        stroke:      () => '#334155',
        strokeWidth: () => 1.5,
      },
    });

    const layout = new ElkLayoutPlugin({
      algorithm: 'layered',
      layoutOptions: {
        'elk.direction':          'DOWN',
        'elk.spacing.nodeNode':   '40',
        'elk.layered.spacing.nodeNodeBetweenLayers': '60',
      },
      defaultNodeWidth:  60,
      defaultNodeHeight: 36,
    });
    await canvas.plugins.register(layout);

    const { nodes: treeNodes, edges: treeEdges } = generateRandomTree(24);

    graph.setData({
      nodes: treeNodes.map(n => ({
        id:          String(n.index),
        label:       String(n.index),
        shape:       'rect' as const,
        data:        { width: 60, height: 36 },
        interactive: true,
        draggable:   true,
      })),
      edges: treeEdges.map((e, i) => ({
        id:       `e-${i}`,
        source:   String(e.source),
        target:   String(e.target),
        pathType: 'orthogonal' as const,
      })),
    });

    await layout.run();
    graph.fitContent(60);
  },
};
