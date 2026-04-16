import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, GraphDataPlugin, type ZoomControlPlugin } from '@invana/canvas-core';
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
  title: 'Plugins/Zoom Control',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

/**
 * Programmatic zoom with scroll-wheel support and min/max zoom limits.
 */
export const ZoomControl: Story = {
  render: () => createContainer({ id: 'plugin-zoom-control' }),
  play: async () => {
    const container = document.getElementById('plugin-zoom-control');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: false,
      plugins: [
        {
          plugin: 'zoom-control',
          key: 'zoom-control',
          options: { minZoom: 0.4, maxZoom: 3, wheelSensitivity: 0.001, zoomToCursor: true },
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

    const gui = new GUI({ container, title: 'Zoom' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    const actions = {
      zoomIn:  () => canvas.getPlugin<ZoomControlPlugin>('zoom-control')?.zoomIn(),
      zoomOut: () => canvas.getPlugin<ZoomControlPlugin>('zoom-control')?.zoomOut(),
      reset:   () => canvas.getPlugin<ZoomControlPlugin>('zoom-control')?.resetZoom(),
    };
    gui.add(actions, 'zoomIn').name('Zoom +');
    gui.add(actions, 'zoomOut').name('Zoom -');
    gui.add(actions, 'reset').name('Reset Zoom');
  },
};
