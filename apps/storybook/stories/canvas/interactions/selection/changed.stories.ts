import type { Meta, StoryObj } from '@storybook/html';
import { action } from 'storybook/actions';
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import { createContainer } from '../../../../src/div-utils';

const meta: Meta = {
  title: 'Canvas/Interactions/Selection',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const GRAPH_DATA = {
  nodes: [
    { id: 'a', x: -250, y: -120, shape: 'circle',   size: 44, label: 'Alpha'   },
    { id: 'b', x:  -80, y: -120, shape: 'rect',     width: 90, height: 56, label: 'Beta'    },
    { id: 'c', x:   80, y: -120, shape: 'diamond',  size: 50, label: 'Gamma'   },
    { id: 'd', x:  250, y: -120, shape: 'hexagon',  size: 44, label: 'Delta'   },
    { id: 'e', x: -160, y:  100, shape: 'star',     size: 44, label: 'Epsilon' },
    { id: 'f', x:    0, y:  100, shape: 'ellipse',  width: 90, height: 56, label: 'Zeta'    },
    { id: 'g', x:  160, y:  100, shape: 'triangle', size: 44, label: 'Eta'     },
  ],
  edges: [
    { id: 'e1', source: 'a', target: 'b', pathType: 'bezier' },
    { id: 'e2', source: 'b', target: 'c', pathType: 'bezier' },
    { id: 'e3', source: 'c', target: 'd', pathType: 'bezier' },
    { id: 'e4', source: 'a', target: 'e', pathType: 'bezier' },
    { id: 'e5', source: 'b', target: 'f', pathType: 'bezier' },
    { id: 'e6', source: 'd', target: 'g', pathType: 'bezier' },
    { id: 'e7', source: 'e', target: 'f', pathType: 'bezier' },
    { id: 'e8', source: 'f', target: 'g', pathType: 'bezier' },
  ],
};

export const SelectionChanged: Story = {
  name: 'selection:changed',
  render: () => createContainer({ id: 'cvs-sel-changed' }),
  play: async () => {
    const container = document.getElementById('cvs-sel-changed');
    if (!container) return;
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [{ plugin: 'background', key: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0d1117', color: '#30363d', size: 1.5, spacing: 28, alpha: 0.7 } }],
    });
    await canvas.init();
    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 70 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);

    const log = action('selection:changed');
    canvas.on('selection:changed', ({ nodes, edges }) => {
      log({
        nodes: nodes.map((n: any) => n.data.id),
        nodeCount: nodes.length,
        edges: edges.map((e: any) => e.data.id),
        edgeCount: edges.length,
      });
    });
  },
};
