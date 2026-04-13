/**
 * Viewport Interaction Events
 *
 * All viewport-level events emitted via the canvas.events bus:
 *   • viewport:zoomed
 *   • viewport:panned
 */

import type { Meta, StoryObj } from '@storybook/html';
import { buildCanvas, createLogLayout, GRAPH_DATA, makeLogger } from './_shared';

const meta: Meta = {
  title: 'Canvas/Interactions/Viewport',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------

export const ViewportZoom: Story = {
  name: 'viewport:zoomed',
  render: () =>
    createLogLayout(
      'cvs-vp-zoom',
      'viewport:zoomed',
      'Scroll / pinch to zoom the viewport',
    ),
  play: async () => {
    const container = document.getElementById('cvs-vp-zoom');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-vp-zoom', '#e3b341');

    canvas.on('viewport:zoomed', ({ scale }) => {
      log('viewport:zoomed', {
        scale: scale.toFixed(4),
        percent: `${(scale * 100).toFixed(1)}%`,
      });
    });
  },
};

// ---------------------------------------------------------------------------

export const ViewportPan: Story = {
  name: 'viewport:panned',
  render: () =>
    createLogLayout(
      'cvs-vp-pan',
      'viewport:panned',
      'Middle-click drag (or configured button) to pan the viewport',
    ),
  play: async () => {
    const container = document.getElementById('cvs-vp-pan');
    if (!container) return;
    const { canvas } = await buildCanvas(container, GRAPH_DATA);
    const log = makeLogger('cvs-vp-pan', '#ffa657');

    canvas.on('viewport:panned', ({ x, y }) => {
      log('viewport:panned', {
        x: Math.round(x).toString(),
        y: Math.round(y).toString(),
      });
    });
  },
};
