/**
 * Node Styles — Radial Gradient
 *
 * Demonstrates radial gradient fills on every built-in node shape.
 * Each shape uses a distinct inner-to-outer color scheme, constructed
 * with PixiJS 8's FillGradient in local (normalised 0–1) space.
 *
 * Gradient styles used:
 *   centered (inner glow)  ·  offset center  ·  tight inner  ·  soft outer
 *
 * Shapes shown (grid, 4 columns):
 *   circle · ellipse · rect · rounded-rect
 *   diamond · hexagon · triangle · pentagon
 *   star-5pt · star-6pt
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, BackgroundPlugin, ElementPlugin, FillGradient,
  type CircleElementSpec,
  type EllipseElementSpec,
  type RectElementSpec,
  type DiamondElementSpec,
  type HexagonElementSpec,
  type PolygonElementSpec,
  type StarElementSpec,
} from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Nodes/Styling/Color/Radial Gradient' };
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

/**
 * Centered radial gradient: bright centre → dark edge (inner glow effect).
 */
function centreGlow(inner: string, outer: string): FillGradient {
  return new FillGradient({
    type: 'radial',
    center:      { x: 0.5, y: 0.5 },
    innerRadius: 0,
    outerCenter: { x: 0.5, y: 0.5 },
    outerRadius: 0.5,
    colorStops: [
      { offset: 0, color: inner },
      { offset: 1, color: outer },
    ],
    textureSpace: 'local',
  });
}

/**
 * Offset radial gradient: glow from upper-left corner.
 */
function cornerGlow(inner: string, outer: string): FillGradient {
  return new FillGradient({
    type: 'radial',
    center:      { x: 0.25, y: 0.25 },
    innerRadius: 0,
    outerCenter: { x: 0.5,  y: 0.5  },
    outerRadius: 0.75,
    colorStops: [
      { offset: 0,   color: inner },
      { offset: 1,   color: outer },
    ],
    textureSpace: 'local',
  });
}

/**
 * Three-stop radial: centre → mid ring → edge.
 */
function threeStop(c0: string, c1: string, c2: string): FillGradient {
  return new FillGradient({
    type: 'radial',
    center:      { x: 0.5, y: 0.5 },
    innerRadius: 0,
    outerCenter: { x: 0.5, y: 0.5 },
    outerRadius: 0.5,
    colorStops: [
      { offset: 0,   color: c0 },
      { offset: 0.5, color: c1 },
      { offset: 1,   color: c2 },
    ],
    textureSpace: 'local',
  });
}

export const RadialGradient: Story = {
  name: 'Radial Gradient',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    const BORDER = { stroke: '#ffffff', strokeWidth: 2 };
    const HOVER  = { strokeWidth: 3.5 };
    const SEL    = { stroke: '#ffffff', strokeWidth: 4 };

    // 0 — circle — white centre → cyan edge (centre glow)
    elements.addSolid('circle', {
      id: 'rg-circle', ...pos(0), radius: RADIUS,
      label: 'Circle',
      style:  { fill: centreGlow('#b2f5ff', '#0e7490'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as CircleElementSpec);

    // 1 — ellipse — soft pink centre → purple edge (centre glow)
    elements.addSolid('ellipse', {
      id: 'rg-ellipse', ...pos(1),
      radiusX: RADIUS * 1.4, radiusY: RADIUS * 0.65,
      label: 'Ellipse',
      style:  { fill: centreGlow('#fce7f3', '#7e22ce'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as EllipseElementSpec);

    // 2 — rect — yellow centre → orange edge (centre glow)
    elements.addSolid('rect', {
      id: 'rg-rect',
      x: pos(2).x - RADIUS, y: pos(2).y - RADIUS * 0.7,
      width: RADIUS * 2, height: RADIUS * 1.4,
      cornerRadius: 0,
      label: 'Rect',
      style:  { fill: centreGlow('#fef08a', '#c2410c'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as RectElementSpec);

    // 3 — rounded rect — mint centre → forest edge (centre glow)
    elements.addSolid('rect', {
      id: 'rg-rounded-rect',
      x: pos(3).x - RADIUS, y: pos(3).y - RADIUS * 0.7,
      width: RADIUS * 2, height: RADIUS * 1.4,
      cornerRadius: 14,
      label: 'Rounded Rect',
      style:  { fill: centreGlow('#d1fae5', '#065f46'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as RectElementSpec);

    // 4 — diamond — bright red centre → dark violet edge (three-stop)
    elements.addSolid('diamond', {
      id: 'rg-diamond', ...pos(4), radius: RADIUS,
      label: 'Diamond',
      style:  { fill: threeStop('#fef2f2', '#ef4444', '#1e1b4b'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as DiamondElementSpec);

    // 5 — hexagon — sky blue centre → deep navy edge (three-stop)
    elements.addSolid('hexagon', {
      id: 'rg-hexagon', ...pos(5), radius: RADIUS,
      label: 'Hexagon',
      style:  { fill: threeStop('#e0f2fe', '#38bdf8', '#0f172a'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as HexagonElementSpec);

    // 6 — triangle — corner glow: rose upper-left → dark edge
    elements.addSolid('polygon', {
      id: 'rg-triangle', ...pos(6), radius: RADIUS, sides: 3,
      label: 'Triangle',
      style:  { fill: cornerGlow('#fecdd3', '#9f1239'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as PolygonElementSpec);

    // 7 — pentagon — corner glow: amber upper-left → brown edge
    elements.addSolid('polygon', {
      id: 'rg-pentagon', ...pos(7), radius: RADIUS, sides: 5,
      label: 'Pentagon',
      style:  { fill: cornerGlow('#fef3c7', '#92400e'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as PolygonElementSpec);

    // 8 — star 5-point — white centre → indigo edge (three-stop)
    elements.addSolid('star', {
      id: 'rg-star5', ...pos(8), radius: RADIUS, points: 5,
      label: 'Star (5pt)',
      style:  { fill: threeStop('#ede9fe', '#818cf8', '#1e1b4b'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as StarElementSpec);

    // 9 — star 6-point — teal centre → dark teal edge (centre glow)
    elements.addSolid('star', {
      id: 'rg-star6', ...pos(9), radius: RADIUS, points: 6,
      label: 'Star (6pt)',
      style:  { fill: centreGlow('#ccfbf1', '#134e4a'), ...BORDER },
      states: { hovered: HOVER, selected: SEL },
      interactive: true,
    } as StarElementSpec);

    elements.fit();
  },
};
