/**
 * Canvas Background Interaction Events
 *
 * All canvas-background events emitted via the canvas.events bus:
 *   • canvas:clicked
 *   • canvas:dblclicked
 *   • canvas:contextmenu
 */

import type { Meta, StoryObj } from '@storybook/html';
import { buildCanvas, createLogLayout, GRAPH_DATA, makeLogger } from './_shared';

const meta: Meta = {
  title: 'Canvas/Interactions/Canvas',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------

export const CanvasClick: Story = {
  name: 'canvas:clicked',
  render: () =>
    createLogLayout(
      'cvs-canvas-click',
      'canvas:clicked',
      'Click an empty area of the canvas (not a node/edge)',
    ),
  play: async () => {
    const container = document.getElementById('cvs-canvas-click');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-canvas-click', '#58a6ff');

    canvas.on('canvas:clicked', ({ position }) => {
      log('canvas:clicked', {
        screen: `(${Math.round(position.screen.x)}, ${Math.round(position.screen.y)})`,
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      });
    });
  },
};

// ---------------------------------------------------------------------------

export const CanvasDoubleClick: Story = {
  name: 'canvas:dblclicked',
  render: () =>
    createLogLayout(
      'cvs-canvas-dbl',
      'canvas:dblclicked',
      'Double-click an empty area of the canvas',
    ),
  play: async () => {
    const container = document.getElementById('cvs-canvas-dbl');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-canvas-dbl', '#f78166');

    canvas.on('canvas:dblclicked', ({ position }) => {
      log('canvas:dblclicked', {
        screen: `(${Math.round(position.screen.x)}, ${Math.round(position.screen.y)})`,
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      });
    });
  },
};

// ---------------------------------------------------------------------------

export const CanvasContextMenu: Story = {
  name: 'canvas:contextmenu',
  render: () =>
    createLogLayout(
      'cvs-canvas-ctx',
      'canvas:contextmenu',
      'Right-click an empty area of the canvas (browser menu suppressed)',
    ),
  play: async () => {
    const container = document.getElementById('cvs-canvas-ctx');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-canvas-ctx', '#d2a8ff');

    canvas.on('canvas:contextmenu', ({ position }) => {
      log('canvas:contextmenu', {
        screen: `(${Math.round(position.screen.x)}, ${Math.round(position.screen.y)})`,
        world:  `(${Math.round(position.world.x)}, ${Math.round(position.world.y)})`,
      });
    });
  },
};
