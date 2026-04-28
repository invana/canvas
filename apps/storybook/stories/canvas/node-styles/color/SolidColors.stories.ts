/**
 * Node Styles — Solid Colors
 *
 * Demonstrates every built-in node shape filled with a distinct solid color.
 * Each shape also carries hover / selected state overrides so interactions are
 * visible when you mouse over or click a node.
 *
 * Shapes shown (grid, 4 columns):
 *   circle · ellipse · rect · rounded-rect
 *   diamond · hexagon · triangle · pentagon
 *   star-5pt · star-6pt
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type CircleElementSpec,
  type EllipseElementSpec,
  type RectElementSpec,
  type DiamondElementSpec,
  type HexagonElementSpec,
  type PolygonElementSpec,
  type StarElementSpec,
} from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Nodes/Styling/Color/Solid Colors' };
export default meta;
type Story = StoryObj;

// ── Grid layout ───────────────────────────────────────────────────────────────
const COLS      = 4;
const CELL      = 160;
const RADIUS    = 44;

function pos(n: number): { x: number; y: number } {
  const col = n % COLS;
  const row = Math.floor(n / COLS);
  return {
    x: (col - (COLS - 1) / 2) * CELL,
    y: (row - 0.5) * CELL,
  };
}

// ── Color palette (one per shape) ─────────────────────────────────────────────
const PALETTE = [
  { fill: '#3fcbeb', hover: '#7de0f4', selected: '#ffffff' }, // cyan
  { fill: '#a78bfa', hover: '#c4b5fd', selected: '#ffffff' }, // purple
  { fill: '#fb923c', hover: '#fdba74', selected: '#ffffff' }, // orange
  { fill: '#34d399', hover: '#6ee7b7', selected: '#ffffff' }, // green
  { fill: '#f472b6', hover: '#f9a8d4', selected: '#ffffff' }, // pink
  { fill: '#fbbf24', hover: '#fcd34d', selected: '#ffffff' }, // amber
  { fill: '#f87171', hover: '#fca5a5', selected: '#ffffff' }, // red
  { fill: '#818cf8', hover: '#a5b4fc', selected: '#ffffff' }, // indigo
  { fill: '#2dd4bf', hover: '#5eead4', selected: '#ffffff' }, // teal
  { fill: '#fb7185', hover: '#fda4af', selected: '#ffffff' }, // rose
];

function states(c: typeof PALETTE[number]) {
  return {
    hovered:  { fill: c.hover,    strokeWidth: 3.5 },
    selected: { stroke: c.selected, strokeWidth: 4 },
  };
}

export const SolidColors: Story = {
  name: 'Solid Colors',
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

    // 0 — circle
    const c0 = PALETTE[0]!;
    elements.addSolid('circle', {
      id: 'sc-circle', ...pos(0), radius: RADIUS,
      label: 'Circle',
      style:  { fill: c0.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c0), interactive: true,
    } as CircleElementSpec);

    // 1 — ellipse
    const c1 = PALETTE[1]!;
    elements.addSolid('ellipse', {
      id: 'sc-ellipse', ...pos(1),
      radiusX: RADIUS * 1.4, radiusY: RADIUS * 0.65,
      label: 'Ellipse',
      style:  { fill: c1.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c1), interactive: true,
    } as EllipseElementSpec);

    // 2 — rect
    const c2 = PALETTE[2]!;
    elements.addSolid('rect', {
      id: 'sc-rect',
      x: pos(2).x - RADIUS, y: pos(2).y - RADIUS * 0.7,
      width: RADIUS * 2, height: RADIUS * 1.4,
      cornerRadius: 0,
      label: 'Rect',
      style:  { fill: c2.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c2), interactive: true,
    } as RectElementSpec);

    // 3 — rounded rect
    const c3 = PALETTE[3]!;
    elements.addSolid('rect', {
      id: 'sc-rounded-rect',
      x: pos(3).x - RADIUS, y: pos(3).y - RADIUS * 0.7,
      width: RADIUS * 2, height: RADIUS * 1.4,
      cornerRadius: 14,
      label: 'Rounded Rect',
      style:  { fill: c3.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c3), interactive: true,
    } as RectElementSpec);

    // 4 — diamond
    const c4 = PALETTE[4]!;
    elements.addSolid('diamond', {
      id: 'sc-diamond', ...pos(4), radius: RADIUS,
      label: 'Diamond',
      style:  { fill: c4.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c4), interactive: true,
    } as DiamondElementSpec);

    // 5 — hexagon
    const c5 = PALETTE[5]!;
    elements.addSolid('hexagon', {
      id: 'sc-hexagon', ...pos(5), radius: RADIUS,
      label: 'Hexagon',
      style:  { fill: c5.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c5), interactive: true,
    } as HexagonElementSpec);

    // 6 — triangle (polygon, sides=3)
    const c6 = PALETTE[6]!;
    elements.addSolid('polygon', {
      id: 'sc-triangle', ...pos(6), radius: RADIUS, sides: 3,
      label: 'Triangle',
      style:  { fill: c6.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c6), interactive: true,
    } as PolygonElementSpec);

    // 7 — pentagon (polygon, sides=5)
    const c7 = PALETTE[7]!;
    elements.addSolid('polygon', {
      id: 'sc-pentagon', ...pos(7), radius: RADIUS, sides: 5,
      label: 'Pentagon',
      style:  { fill: c7.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c7), interactive: true,
    } as PolygonElementSpec);

    // 8 — star 5-point
    const c8 = PALETTE[8]!;
    elements.addSolid('star', {
      id: 'sc-star5', ...pos(8), radius: RADIUS, points: 5,
      label: 'Star (5pt)',
      style:  { fill: c8.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c8), interactive: true,
    } as StarElementSpec);

    // 9 — star 6-point
    const c9 = PALETTE[9]!;
    elements.addSolid('star', {
      id: 'sc-star6', ...pos(9), radius: RADIUS, points: 6,
      label: 'Star (6pt)',
      style:  { fill: c9.fill, stroke: '#ffffff', strokeWidth: 2 },
      states: states(c9), interactive: true,
    } as StarElementSpec);

    elements.fitContent();
  },
};
