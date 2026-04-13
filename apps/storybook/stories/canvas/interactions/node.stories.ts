/**
 * Node Interaction Events
 *
 * All node-level events emitted via the canvas.events bus:
 *   • node:clicked
 *   • node:dblclicked
 *   • node:contextmenu
 *   • node:hover / node:hoverend
 *   • node:dragstart / node:drag / node:dragend
 *   • node:selected / node:deselected
 */

import type { Meta, StoryObj } from '@storybook/html';
import { buildCanvas, createLogLayout, GRAPH_DATA, makeLogger } from './_shared';

const meta: Meta = {
  title: 'Canvas/Interactions/Node',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------

export const NodeClick: Story = {
  name: 'node:clicked',
  render: () => createLogLayout('cvs-node-click', 'node:clicked', 'Click any node'),
  play: async () => {
    const container = document.getElementById('cvs-node-click');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-node-click', '#58a6ff');

    canvas.on('node:clicked', ({ node, position }) => {
      log('node:clicked', {
        id:     node.data.id,
        label:  String(node.data.label ?? '—'),
        screen: `(${Math.round(position.screen.x)}, ${Math.round(position.screen.y)})`,
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      });
    });
  },
};

// ---------------------------------------------------------------------------

export const NodeDoubleClick: Story = {
  name: 'node:dblclicked',
  render: () =>
    createLogLayout('cvs-node-dbl', 'node:dblclicked', 'Double-click any node'),
  play: async () => {
    const container = document.getElementById('cvs-node-dbl');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-node-dbl', '#f78166');

    canvas.on('node:dblclicked', ({ node, position }) => {
      log('node:dblclicked', {
        id:     node.data.id,
        label:  String(node.data.label ?? '—'),
        screen: `(${Math.round(position.screen.x)}, ${Math.round(position.screen.y)})`,
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      });
    });
  },
};

// ---------------------------------------------------------------------------

export const NodeContextMenu: Story = {
  name: 'node:contextmenu',
  render: () =>
    createLogLayout(
      'cvs-node-ctx',
      'node:contextmenu',
      'Right-click any node (browser menu suppressed)',
    ),
  play: async () => {
    const container = document.getElementById('cvs-node-ctx');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-node-ctx', '#d2a8ff');

    canvas.on('node:contextmenu', ({ node, position }) => {
      log('node:contextmenu', {
        id:     node.data.id,
        label:  String(node.data.label ?? '—'),
        screen: `(${Math.round(position.screen.x)}, ${Math.round(position.screen.y)})`,
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      });
    });
  },
};

// ---------------------------------------------------------------------------

export const NodeHover: Story = {
  name: 'node:hover / node:hoverend',
  render: () =>
    createLogLayout(
      'cvs-node-hover',
      'node:hover / node:hoverend',
      'Move the pointer over nodes',
    ),
  play: async () => {
    const container = document.getElementById('cvs-node-hover');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-node-hover', '#3fb950');

    canvas.on('node:hover', ({ node, position }) => {
      log('node:hover', {
        id:    node.data.id,
        label: String(node.data.label ?? '—'),
        world: `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      }, '#3fb950');
    });

    canvas.on('node:hoverend', ({ node }) => {
      log('node:hoverend', {
        id:    node.data.id,
        label: String(node.data.label ?? '—'),
      }, '#8b949e');
    });
  },
};

// ---------------------------------------------------------------------------

export const NodeDrag: Story = {
  name: 'node:drag events',
  render: () =>
    createLogLayout(
      'cvs-node-drag',
      'node:dragstart / node:drag / node:dragend',
      'Drag any node to a new position',
    ),
  play: async () => {
    const container = document.getElementById('cvs-node-drag');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-node-drag', '#e3b341');

    canvas.on('node:dragstart', ({ node, x, y }) => {
      log('node:dragstart', {
        id:  node.data.id,
        pos: `(${Math.round(x)}, ${Math.round(y)})`,
      }, '#e3b341');
    });

    canvas.on('node:drag', ({ node, x, y }) => {
      log('node:drag', {
        id:  node.data.id,
        pos: `(${Math.round(x)}, ${Math.round(y)})`,
      }, '#ffa657');
    });

    canvas.on('node:dragend', ({ node, x, y }) => {
      log('node:dragend', {
        id:       node.data.id,
        finalPos: `(${Math.round(x)}, ${Math.round(y)})`,
      }, '#58a6ff');
    });
  },
};

// ---------------------------------------------------------------------------

export const NodeSelection: Story = {
  name: 'node:selected / node:deselected',
  render: () =>
    createLogLayout(
      'cvs-node-sel',
      'node:selected / node:deselected',
      'Click a node · Shift+click for multi-select · click background to clear',
    ),
  play: async () => {
    const container = document.getElementById('cvs-node-sel');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-node-sel', '#3fb950');

    canvas.on('node:selected', ({ node }) => {
      log('node:selected', {
        id:    node.data.id,
        label: String(node.data.label ?? '—'),
      }, '#3fb950');
    });

    canvas.on('node:deselected', ({ node }) => {
      log('node:deselected', {
        id:    node.data.id,
        label: String(node.data.label ?? '—'),
      }, '#f78166');
    });
  },
};
