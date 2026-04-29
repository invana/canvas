/**
 * D3 Force Layout — Les Misérables
 *
 * Character co-occurrence network from Victor Hugo's novel rendered with
 * D3ForceLayoutPlugin. Nodes are coloured by character group.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { lesMiserablesDataRaw } from '@invana/plugin-example-datasets';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Layouts/D3 Force/Les Misérables' };
export default meta;
type Story = StoryObj;

/** One colour per group (groups 0–10). */
const GROUP_COLORS: Record<number, string> = {
  0:  '#94a3b8',
  1:  '#60a5fa',
  2:  '#34d399',
  3:  '#f472b6',
  4:  '#fb923c',
  5:  '#a78bfa',
  6:  '#facc15',
  7:  '#f87171',
  8:  '#38bdf8',
  9:  '#4ade80',
  10: '#e879f9',
};

export const LesMiserables: Story = {
  name: 'Les Misérables',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
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
        fill:        n => GROUP_COLORS[(n.data?.['group'] as number) ?? 0] ?? '#94a3b8',
        stroke:      () => '#0f172a',
        strokeWidth: () => 1.5,
      },
      edge: {
        stroke:      () => '#334155',
        strokeWidth: () => 1,
      },
    });

    const layout = new D3ForceLayoutPlugin({ charge: -300, linkDistance: 80, animate: true });
    await canvas.plugins.register(layout);

    graph.setData({
      nodes: lesMiserablesDataRaw.nodes.map(n => ({
        id:     n.id,
        label:  n.id,
        shape:  'circle' as const,
        size:   28,
        interactive: true,
        draggable:   true,
        data:   { group: n.group },
      })),
      edges: lesMiserablesDataRaw.edges.map((e, i) => ({
        id:       `e-${i}`,
        source:   e.source,
        target:   e.target,
        pathType: 'straight' as const,
      })),
    });

    await layout.start();

    // Fit once the simulation has warmed up
    setTimeout(() => graph.fitContent(60), 1500);
  },
};
