/**
 * Edge Interaction Events
 *
 * All edge-level events emitted via the canvas.events bus:
 *   • edge:clicked
 *   • edge:dblclicked
 *   • edge:hover / edge:hoverend
 *   • edge:selected / edge:deselected
 */

import type { Meta, StoryObj } from '@storybook/html';
import { buildCanvas, createLogLayout, GRAPH_DATA, makeLogger } from './_shared';

const meta: Meta = {
  title: 'Canvas/Interactions/Edge',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------

export const EdgeClick: Story = {
  name: 'edge:clicked',
  render: () =>
    createLogLayout('cvs-edge-click', 'edge:clicked', 'Click any edge'),
  play: async () => {
    const container = document.getElementById('cvs-edge-click');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-edge-click', '#58a6ff');

    canvas.on('edge:clicked', ({ edge, position }) => {
      log('edge:clicked', {
        id:     edge.data.id,
        source: String(edge.data.source ?? '—'),
        target: String(edge.data.target ?? '—'),
        screen: `(${Math.round(position.screen.x)}, ${Math.round(position.screen.y)})`,
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      });
    });
  },
};

// ---------------------------------------------------------------------------

export const EdgeDoubleClick: Story = {
  name: 'edge:dblclicked',
  render: () =>
    createLogLayout('cvs-edge-dbl', 'edge:dblclicked', 'Double-click any edge'),
  play: async () => {
    const container = document.getElementById('cvs-edge-dbl');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-edge-dbl', '#f78166');

    canvas.on('edge:dblclicked', ({ edge, position }) => {
      log('edge:dblclicked', {
        id:     edge.data.id,
        source: String(edge.data.source ?? '—'),
        target: String(edge.data.target ?? '—'),
        screen: `(${Math.round(position.screen.x)}, ${Math.round(position.screen.y)})`,
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      });
    });
  },
};

// ---------------------------------------------------------------------------

export const EdgeHover: Story = {
  name: 'edge:hover / edge:hoverend',
  render: () =>
    createLogLayout(
      'cvs-edge-hover',
      'edge:hover / edge:hoverend',
      'Move the pointer over edges',
    ),
  play: async () => {
    const container = document.getElementById('cvs-edge-hover');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-edge-hover', '#3fb950');

    canvas.on('edge:hover', ({ edge, position }) => {
      log('edge:hover', {
        id:     edge.data.id,
        source: String(edge.data.source ?? '—'),
        target: String(edge.data.target ?? '—'),
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      }, '#3fb950');
    });

    canvas.on('edge:hoverend', ({ edge }) => {
      log('edge:hoverend', {
        id:     edge.data.id,
        source: String(edge.data.source ?? '—'),
        target: String(edge.data.target ?? '—'),
      }, '#8b949e');
    });
  },
};

// ---------------------------------------------------------------------------

export const EdgeSelection: Story = {
  name: 'edge:selected / edge:deselected',
  render: () =>
    createLogLayout(
      'cvs-edge-sel',
      'edge:selected / edge:deselected',
      'Click an edge · Shift+click for multi-select · click background to clear',
    ),
  play: async () => {
    const container = document.getElementById('cvs-edge-sel');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-edge-sel', '#3fb950');

    canvas.on('edge:selected', ({ edge }) => {
      log('edge:selected', {
        id:     edge.data.id,
        source: String(edge.data.source ?? '—'),
        target: String(edge.data.target ?? '—'),
      }, '#3fb950');
    });

    canvas.on('edge:deselected', ({ edge }) => {
      log('edge:deselected', {
        id:     edge.data.id,
        source: String(edge.data.source ?? '—'),
        target: String(edge.data.target ?? '—'),
      }, '#f78166');
    });
  },
};
