import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, type MiniMapPlugin } from '@invana/canvas-core';
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
  title: 'Plugins/MiniMap',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

/**
 * An overview minimap in the bottom-right corner.
 * Drag nodes to see the minimap update in real-time.
 */
export const MiniMap: Story = {
  render: () => createContainer({ id: 'plugin-minimap' }),
  play: async () => {
    const container = document.getElementById('plugin-minimap');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: false,
      plugins: [
        { plugin: 'drag-element', key: 'drag-element' },
        {
          plugin: 'minimap',
          key: 'minimap',
          options: {
            width:           280,
            height:          180,
            position:        'bottom-right',
            padding:         18,
            backgroundColor: 0x0b1220,
          },
        },
      ],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: false, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);
    const layout = new D3ForceLayoutPlugin({ charge: -200, collisionRadius: 25, animate: true, iterations: 300 });
    await canvas.registerPlugin(layout);
    await layout.start();

    canvas.getPlugin<MiniMapPlugin>('minimap')?.refresh();
  },
};
