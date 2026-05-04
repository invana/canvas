/**
 * Demos the low-level `drawLineConnector` + router primitives from the
 * `draw` module — polyline-only, no markers, no labels.
 *
 * Pattern shows the layer's job (composition):
 *   1. extend `WorldLayer` to make a tiny generic layer
 *   2. after mount, request a `Graphics` via `layer.createGraphics()`
 *   3. caller routes endpoints with `draw.straightRouter(s, t)` → polyline
 *   4. caller hands the polyline to `draw.drawLineConnector(g, polyline, spec)`
 *
 * Connector primitives know nothing about markers or labels. Adding an arrow
 * head or a midpoint label is a separate `draw.drawArrow` / `draw.drawPlainText`
 * call issued by the same layer at the polyline endpoint / midpoint — but
 * this story keeps to the connector primitive alone for review clarity.
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
  title: 'Canvas/Draw/Line',
};
export default meta;
type Story = StoryObj;

// Edges expressed as `(source, target, style)`. A real layer would project
// these from domain data and re-route on endpoint change; for the demo
// they're literal.
const edges = [
  { source: { x: 80,  y: 80  }, target: { x: 540, y: 80  }, stroke: 0x4f9cf9, strokeWidth: 2 },
  { source: { x: 80,  y: 130 }, target: { x: 540, y: 200 }, stroke: 0x10b981, strokeWidth: 3 },
  { source: { x: 80,  y: 200 }, target: { x: 540, y: 130 }, stroke: 0xf59e0b, strokeWidth: 2, cap: 'round' as const },
  { source: { x: 80,  y: 280 }, target: { x: 540, y: 280 }, stroke: 0xef4444, strokeWidth: 1 },
  { source: { x: 80,  y: 320 }, target: { x: 540, y: 360 }, stroke: 0xa855f7, strokeWidth: 4, strokeAlpha: 0.5 },
];

export const StraightLines: Story = {
  render: () => createContainer({ id: 'cvs-lines' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-lines')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'lines', options: {} });
    canvas.layers.add(layer);

    const g = layer.createGraphics('lines-gfx');

    for (const e of edges) {
      // Layer step 1: route the endpoints into a polyline.
      const polyline = draw.straightRouter(e.source, e.target);
      // Layer step 2: draw the polyline. The connector primitive does NOT
      // receive endpoints — it only knows about the polyline + the stroke
      // style. That's the single-responsibility split.
      draw.drawLineConnector(g, polyline, {
        kind: 'line',
        source: { kind: 'point', ...e.source },
        target: { kind: 'point', ...e.target },
        stroke: e.stroke,
        strokeWidth: e.strokeWidth,
        strokeAlpha: e.strokeAlpha,
        cap: e.cap,
      });
    }
  },
};
