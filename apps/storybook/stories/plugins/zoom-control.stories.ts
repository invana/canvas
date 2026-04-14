import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, GraphDataPlugin, type ZoomControlPlugin } from '@invana/canvas-core';
import { createContainer } from '../../src/div-utils';

const GRAPH_DATA = {
  nodes: [
    { id: 'n1', x: -260, y: -120, shape: 'circle'   as const, size: 44,              label: 'Node A' },
    { id: 'n2', x:  -40, y: -120, shape: 'rect'     as const, width: 100, height: 54, label: 'Node B' },
    { id: 'n3', x:  190, y: -120, shape: 'diamond'  as const, size: 52,              label: 'Node C' },
    { id: 'n4', x: -150, y:  120, shape: 'hexagon'  as const, size: 46,              label: 'Node D' },
    { id: 'n5', x:   80, y:  120, shape: 'star'     as const, size: 46,              label: 'Node E' },
    { id: 'n6', x:  310, y:  120, shape: 'triangle' as const, size: 50,              label: 'Node F' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' as const },
    { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' as const },
    { id: 'e3', source: 'n1', target: 'n4', pathType: 'bezier' as const },
    { id: 'e4', source: 'n2', target: 'n5', pathType: 'bezier' as const },
    { id: 'e5', source: 'n3', target: 'n6', pathType: 'bezier' as const },
    { id: 'e6', source: 'n4', target: 'n5', pathType: 'bezier' as const },
    { id: 'e7', source: 'n5', target: 'n6', pathType: 'bezier' as const },
  ],
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

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);

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
