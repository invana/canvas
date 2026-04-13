/**
 * Selection Interaction Events
 *
 * The consolidated selection event emitted via the canvas.events bus:
 *   • selection:changed — fired after every selection change, carrying
 *     the full current set of selected nodes and edges.
 *
 * Combines node:selected, node:deselected, edge:selected, edge:deselected
 * into one convenient batch event.
 */

import type { Meta, StoryObj } from '@storybook/html';
import { buildCanvas, createLogLayout, makeLogger } from './_shared';

const meta: Meta = {
  title: 'Canvas/Interactions/Selection',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// Richer graph so users can discover multi-select across both nodes and edges
const RICH_GRAPH = {
  nodes: [
    { id: 'a', x: -250, y: -120, shape: 'circle',  size: 44, label: 'Alpha'   },
    { id: 'b', x:  -80, y: -120, shape: 'rect',    width: 90, height: 56, label: 'Beta'  },
    { id: 'c', x:   80, y: -120, shape: 'diamond', size: 50, label: 'Gamma'   },
    { id: 'd', x:  250, y: -120, shape: 'hexagon', size: 44, label: 'Delta'   },
    { id: 'e', x: -160, y:  100, shape: 'star',    size: 44, label: 'Epsilon' },
    { id: 'f', x:    0, y:  100, shape: 'ellipse', width: 90, height: 56, label: 'Zeta'  },
    { id: 'g', x:  160, y:  100, shape: 'triangle',size: 44, label: 'Eta'     },
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

// ---------------------------------------------------------------------------

export const SelectionChanged: Story = {
  name: 'selection:changed',
  render: () =>
    createLogLayout(
      'cvs-sel-changed',
      'selection:changed',
      'Click to select · Shift+click for multi-select · click background to clear',
    ),
  play: async () => {
    const container = document.getElementById('cvs-sel-changed');
    if (!container) return;
    const { canvas } = await buildCanvas(container, RICH_GRAPH, 70);
    const log = makeLogger('cvs-sel-changed', '#3fb950');

    canvas.on('selection:changed', ({ nodes, edges }) => {
      const nodeIds = nodes.map((n: any) => n.data.id).join(', ') || '(none)';
      const edgeIds = edges.map((e: any) => e.data.id).join(', ') || '(none)';
      log('selection:changed', {
        nodeCount: nodes.length.toString(),
        nodes:     nodeIds,
        edgeCount: edges.length.toString(),
        edges:     edgeIds,
      }, nodes.length + edges.length > 0 ? '#3fb950' : '#8b949e');
    });
  },
};
