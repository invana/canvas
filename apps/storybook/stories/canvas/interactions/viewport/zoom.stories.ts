import type { Meta, StoryObj } from '@storybook/html';
import { action } from 'storybook/actions';
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import { createContainer } from '../../../../src/div-utils';

const GRAPH_DATA = {
  nodes: [
    { id: 'n1', x: -220, y: -110, shape: 'circle',  size: 44, label: 'Circle'  },
    { id: 'n2', x:    0, y: -110, shape: 'rect',    width: 90, height: 56, label: 'Rect' },
    { id: 'n3', x:  220, y: -110, shape: 'diamond', size: 50, label: 'Diamond' },
    { id: 'n4', x: -110, y:  110, shape: 'hexagon', size: 44, label: 'Hexagon' },
    { id: 'n5', x:  110, y:  110, shape: 'star',    size: 44, label: 'Star'    },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
    { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' },
    { id: 'e3', source: 'n1', target: 'n4', pathType: 'bezier' },
    { id: 'e4', source: 'n3', target: 'n5', pathType: 'bezier' },
    { id: 'e5', source: 'n4', target: 'n5', pathType: 'bezier' },
  ],
};

const meta: Meta = {
  title: 'Canvas/Interactions/Viewport',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const ViewportZoom: Story = {
  name: 'viewport:zoomed',
  render: () => createContainer({ id: 'cvs-vp-zoom' }),
  play: async () => {
    const container = document.getElementById('cvs-vp-zoom');
    if (!container) return;
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [{ plugin: 'background', key: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0d1117', color: '#30363d', size: 1.5, spacing: 28, alpha: 0.7 } }],
    });
    await canvas.init();
    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 60 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);

    const log = action('viewport:zoomed');
    canvas.viewport.on('zoomed', () => {
      const scale = canvas.viewport.scaled;
      log({ scale: parseFloat(scale.toFixed(4)), percent: `${(scale * 100).toFixed(1)}%` });
    });
  },
};
