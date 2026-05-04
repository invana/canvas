/**
 * Demos the low-level `drawCircle` paint primitive from `@invana/canvas`'s
 * `draw` module — bypassing `ShapesRenderer` entirely.
 *
 * Pattern:
 *   1. extend `WorldLayer` to make a tiny generic layer (no opinions)
 *   2. after mount, request a `Graphics` via `layer.createGraphics(id)`
 *   3. call `draw.drawCircle(g, spec)` against that Graphics
 *
 * No registry, no hit-testing, no decorations — just the paint function and
 * a Graphics. This is the API that ER-diagram authors / swimlane plugins /
 * custom layers would use directly when they don't need the registry's
 * managed-entity machinery.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  draw,
} from '@invana/canvas';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = {
  title: 'Canvas/Draw',
};
export default meta;
type Story = StoryObj;

/**
 * Simplest possible usage: request one Graphics, draw one circle.
 * Shows the minimum plumbing needed to paint anything on a layer.
 */
export const Circle: Story = {
  render: () => createContainer({ id: 'cvs-circle' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-circle')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'circles-layer', options: {} });
    canvas.layers.add(layer);

    // Step 1 — request a Graphics from the layer (the layer owns its lifetime).
    const g1 = layer.createGraphics('single-circle-gfx');

    // Step 2 — paint into it with the draw primitive.
    const single = { x: 300, y: 160, r: 70 };
    draw.drawCircle(g1, { kind: 'circle', ...single, fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 3 });

    // One Graphics holds all circles — no separate Graphics per shape needed.
    const g2 = layer.createGraphics('multi-circle-gfx');

    const circles = [
      // large, semi-transparent fill with stroke
      { x: 100, y: 160, r: 70, fill: 0xa855f7, fillAlpha: 0.35, stroke: 0x6b21a8, strokeWidth: 3 },
      // medium, solid fill
      { x: 100, y: 160, r: 50, fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2 },
      // medium, accent colour
      { x: 100, y: 160, r: 40, fill: 0x10b981, stroke: 0x065f46, strokeWidth: 2 },
    ];

    for (const c of circles) {
      draw.drawCircle(g2, { kind: 'circle', ...c });
    }

    canvas.camera.fitContent(layer.getBounds(), 120);
  },
};
