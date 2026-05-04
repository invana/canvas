/**
 * Demos the low-level `drawLineConnector` + `drawCurveConnector` + router
 * primitives from the `draw` module — polyline-only, no markers, no labels.
 *
 * Pattern shows the layer's job (composition):
 *   1. extend `WorldLayer` to make a tiny generic layer
 *   2. after mount, request a `Graphics` via `layer.createGraphics()`
 *   3. caller routes endpoints with a router → polyline
 *   4. caller hands the polyline to a connector primitive
 *
 * Two Graphics-ownership patterns are demonstrated:
 *   - SingleGraphicsMultipleLines: one Graphics holds all edges (one GPU batch,
 *     mixed routers and connector types are fine)
 *   - MultipleGraphicsEdgeGroups: one Graphics per logical group, enabling
 *     independent z-ordering and selective `.clear()` + redraw
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

// ─── SingleGraphicsMultipleLines ─────────────────────────────────────────────
// All edges — different routers and connector primitives — drawn into ONE
// Graphics. One Graphics = one GPU draw call regardless of how many edges or
// which routers/connectors produced the polylines.
const singleGfxEdges = [
  // straight router + line connector
  { source: { x: 60, y: 80  }, target: { x: 540, y: 80  }, router: 'straight', conn: 'line',  stroke: 0x4f9cf9, strokeWidth: 2 },
  { source: { x: 60, y: 130 }, target: { x: 540, y: 130 }, router: 'straight', conn: 'line',  stroke: 0x06b6d4, strokeWidth: 3, cap: 'round' as const },
  // orthogonal router + line connector (hard right-angle elbows)
  { source: { x: 60, y: 200 }, target: { x: 540, y: 280 }, router: 'orthog',   conn: 'line',  stroke: 0xf59e0b, strokeWidth: 2 },
  { source: { x: 60, y: 260 }, target: { x: 540, y: 330 }, router: 'orthog',   conn: 'line',  stroke: 0xef4444, strokeWidth: 1 },
  // orthogonal router + curve connector (elbows become smooth arcs)
  { source: { x: 60, y: 390 }, target: { x: 540, y: 450 }, router: 'orthog',   conn: 'curve', stroke: 0xa855f7, strokeWidth: 2 },
  { source: { x: 60, y: 430 }, target: { x: 540, y: 490 }, router: 'orthog',   conn: 'curve', stroke: 0xec4899, strokeWidth: 3 },
  // bezier router + curve connector
  { source: { x: 60, y: 540 }, target: { x: 540, y: 500 }, router: 'bezier',   conn: 'curve', stroke: 0x10b981, strokeWidth: 2 },
  { source: { x: 60, y: 590 }, target: { x: 540, y: 550 }, router: 'bezier',   conn: 'curve', stroke: 0x22d3ee, strokeWidth: 3 },
];

export const SingleGraphicsMultipleLines: Story = {
  render: () => createContainer({ id: 'cvs-single-gfx' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-single-gfx')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'single-gfx-layer', options: {} });
    canvas.layers.add(layer);

    // ONE Graphics for all edges — mixed routers and connector types are fine.
    const g = layer.createGraphics('all-lines-gfx');

    for (const e of singleGfxEdges) {
      const polyline =
        e.router === 'orthog'  ? draw.orthogonalRouter(e.source, e.target) :
        e.router === 'bezier'  ? draw.bezierRouter(e.source, e.target)     :
                                 draw.straightRouter(e.source, e.target);

      if (e.conn === 'curve') {
        draw.drawCurveConnector(g, polyline, {
          kind: 'curve',
          source: { kind: 'point', ...e.source },
          target: { kind: 'point', ...e.target },
          stroke: e.stroke,
          strokeWidth: e.strokeWidth,
          cap: e.cap,
        });
      } else {
        draw.drawLineConnector(g, polyline, {
          kind: 'line',
          source: { kind: 'point', ...e.source },
          target: { kind: 'point', ...e.target },
          stroke: e.stroke,
          strokeWidth: e.strokeWidth,
          cap: e.cap,
        });
      }
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── MultipleGraphicsEdgeGroups ───────────────────────────────────────────────
// Three logical groups, each in its own Graphics. Same draw primitives as
// above — the difference is ownership: each group can be independently
// z-ordered, cleared, and redrawn without touching the others.
const dataFlowEdges = [
  { source: { x: 60, y: 80  }, target: { x: 540, y: 80  }, stroke: 0x3b82f6, strokeWidth: 3 },
  { source: { x: 60, y: 130 }, target: { x: 540, y: 130 }, stroke: 0x4f9cf9, strokeWidth: 2 },
  { source: { x: 60, y: 180 }, target: { x: 540, y: 180 }, stroke: 0x93c5fd, strokeWidth: 1 },
];

const routingEdges = [
  { source: { x: 60, y: 270 }, target: { x: 540, y: 330 }, stroke: 0x10b981, strokeWidth: 2 },
  { source: { x: 60, y: 310 }, target: { x: 540, y: 370 }, stroke: 0x34d399, strokeWidth: 2 },
  { source: { x: 60, y: 350 }, target: { x: 540, y: 290 }, stroke: 0x6ee7b7, strokeWidth: 1 },
];

const dependencyEdges = [
  { source: { x: 60, y: 450 }, target: { x: 540, y: 410 }, stroke: 0xf97316, strokeWidth: 2, strokeAlpha: 0.7 },
  { source: { x: 60, y: 500 }, target: { x: 540, y: 460 }, stroke: 0xfb923c, strokeWidth: 2, strokeAlpha: 0.7 },
  { source: { x: 60, y: 540 }, target: { x: 540, y: 510 }, stroke: 0xfdba74, strokeWidth: 3, strokeAlpha: 0.5 },
];

export const MultipleGraphicsEdgeGroups: Story = {
  render: () => createContainer({ id: 'cvs-multi-gfx' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-multi-gfx')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'multi-gfx-layer', options: {} });
    canvas.layers.add(layer);

    // Group 1: data-flow edges — straight lines, blue palette.
    const gDataFlow = layer.createGraphics('data-flow-gfx');
    for (const e of dataFlowEdges) {
      const polyline = draw.straightRouter(e.source, e.target);
      draw.drawLineConnector(gDataFlow, polyline, {
        kind: 'line',
        source: { kind: 'point', ...e.source },
        target: { kind: 'point', ...e.target },
        stroke: e.stroke,
        strokeWidth: e.strokeWidth,
      });
    }

    // Group 2: network-routing edges — orthogonal paths, green palette.
    const gRouting = layer.createGraphics('routing-gfx');
    for (const e of routingEdges) {
      const polyline = draw.orthogonalRouter(e.source, e.target);
      draw.drawLineConnector(gRouting, polyline, {
        kind: 'line',
        source: { kind: 'point', ...e.source },
        target: { kind: 'point', ...e.target },
        stroke: e.stroke,
        strokeWidth: e.strokeWidth,
      });
    }

    // Group 3: dependency arcs — bezier curves, orange palette, semi-transparent.
    const gDependencies = layer.createGraphics('dependencies-gfx');
    for (const e of dependencyEdges) {
      const polyline = draw.bezierRouter(e.source, e.target);
      draw.drawCurveConnector(gDependencies, polyline, {
        kind: 'curve',
        source: { kind: 'point', ...e.source },
        target: { kind: 'point', ...e.target },
        stroke: e.stroke,
        strokeWidth: e.strokeWidth,
        strokeAlpha: e.strokeAlpha,
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── StraightLines ────────────────────────────────────────────────────────────
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
