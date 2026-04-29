/**
 * Node Styles — Linear Gradient
 *
 * Demonstrates linear gradient fills on every built-in node shape.
 * Each shape uses a distinct gradient direction and color scheme,
 * constructed with PixiJS 8's FillGradient in local (normalised 0–1) space.
 *
 * Gradient directions used across the grid:
 *   left → right  ·  top → bottom  ·  diagonal  ·  right → left
 *   bottom → top  ·  diagonal (alt)  …
 *
 * Shapes shown (grid, 4 columns):
 *   circle · ellipse · rect · rounded-rect
 *   diamond · hexagon · triangle · pentagon
 *   star-5pt · star-6pt
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, FillGradient } from '@invana/canvas';
import {
  ElementPlugin,
  type CircleElementSpec,
  type EllipseElementSpec,
  type RectElementSpec,
  type DiamondElementSpec,
  type HexagonElementSpec,
  type PolygonElementSpec,
  type StarElementSpec,
} from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Nodes/Styling/Color/Linear Gradient' };
export default meta;
type Story = StoryObj;

// ── Grid layout ───────────────────────────────────────────────────────────────
const COLS   = 4;
const CELL   = 160;
const RADIUS = 44;

function pos(n: number): { x: number; y: number } {
  const col = n % COLS;
  const row = Math.floor(n / COLS);
  return {
    x: (col - (COLS - 1) / 2) * CELL,
    y: (row - 0.5) * CELL,
  };
}

// ── Gradient helpers ──────────────────────────────────────────────────────────

/** Horizontal left → right */
function hGrad(from: string, to: string): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0.5 },
    end:   { x: 1, y: 0.5 },
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to   },
    ],
    textureSpace: 'local',
  });
}

/** Vertical top → bottom */
function vGrad(from: string, to: string): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: 0.5, y: 0 },
    end:   { x: 0.5, y: 1 },
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to   },
    ],
    textureSpace: 'local',
  });
}

/** Diagonal top-left → bottom-right */
function dGrad(from: string, mid: string, to: string): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end:   { x: 1, y: 1 },
    colorStops: [
      { offset: 0,   color: from },
      { offset: 0.5, color: mid  },
      { offset: 1,   color: to   },
    ],
    textureSpace: 'local',
  });
}

export const LinearGradient: Story = {
  name: 'Linear Gradient',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 30,
    }));

    const elements = new ElementPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    const BORDER = { stroke: '#ffffff', strokeWidth: 2 };
    const HOVER  = { strokeWidth: 3.5 };
    const SEL    = { stroke: '#ffffff', strokeWidth: 4 };

    // 0 — circle  — cyan → blue (horizontal)
    elements.addNode('circle', {
      id: 'lg-circle', ...pos(0), radius: RADIUS,
      label: 'Circle',
      style:  { fill: hGrad('#3fcbeb', '#2563eb'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as CircleElementSpec);

    // 1 — ellipse — purple → pink (horizontal)
    elements.addNode('ellipse', {
      id: 'lg-ellipse', ...pos(1),
      radiusX: RADIUS * 1.4, radiusY: RADIUS * 0.65,
      label: 'Ellipse',
      style:  { fill: hGrad('#a78bfa', '#ec4899'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as EllipseElementSpec);

    // 2 — rect — orange → yellow (top → bottom)
    elements.addNode('rect', {
      id: 'lg-rect',
      x: pos(2).x - RADIUS, y: pos(2).y - RADIUS * 0.7,
      width: RADIUS * 2, height: RADIUS * 1.4,
      cornerRadius: 0,
      label: 'Rect',
      style:  { fill: vGrad('#fb923c', '#fde68a'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as RectElementSpec);

    // 3 — rounded rect — green → teal (top → bottom)
    elements.addNode('rect', {
      id: 'lg-rounded-rect',
      x: pos(3).x - RADIUS, y: pos(3).y - RADIUS * 0.7,
      width: RADIUS * 2, height: RADIUS * 1.4,
      cornerRadius: 14,
      label: 'Rounded Rect',
      style:  { fill: vGrad('#34d399', '#0d9488'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as RectElementSpec);

    // 4 — diamond — red → orange → yellow (diagonal)
    elements.addNode('diamond', {
      id: 'lg-diamond', ...pos(4), radius: RADIUS,
      label: 'Diamond',
      style:  { fill: dGrad('#ef4444', '#f97316', '#fbbf24'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as DiamondElementSpec);

    // 5 — hexagon — indigo → cyan (diagonal)
    elements.addNode('hexagon', {
      id: 'lg-hexagon', ...pos(5), radius: RADIUS,
      label: 'Hexagon',
      style:  { fill: dGrad('#6366f1', '#3fcbeb', '#06b6d4'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as HexagonElementSpec);

    // 6 — triangle — rose → violet (horizontal)
    elements.addNode('polygon', {
      id: 'lg-triangle', ...pos(6), radius: RADIUS, sides: 3,
      label: 'Triangle',
      style:  { fill: hGrad('#fb7185', '#7c3aed'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as PolygonElementSpec);

    // 7 — pentagon — sky → emerald (top → bottom)
    elements.addNode('polygon', {
      id: 'lg-pentagon', ...pos(7), radius: RADIUS, sides: 5,
      label: 'Pentagon',
      style:  { fill: vGrad('#38bdf8', '#10b981'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as PolygonElementSpec);

    // 8 — star 5-point — amber → pink (diagonal)
    elements.addNode('star', {
      id: 'lg-star5', ...pos(8), radius: RADIUS, points: 5,
      label: 'Star (5pt)',
      style:  { fill: dGrad('#fbbf24', '#f472b6', '#818cf8'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as StarElementSpec);

    // 9 — star 6-point — teal → purple (horizontal)
    elements.addNode('star', {
      id: 'lg-star6', ...pos(9), radius: RADIUS, points: 6,
      label: 'Star (6pt)',
      style:  { fill: hGrad('#2dd4bf', '#7c3aed'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as StarElementSpec);

    elements.fitContent();
  },
};
