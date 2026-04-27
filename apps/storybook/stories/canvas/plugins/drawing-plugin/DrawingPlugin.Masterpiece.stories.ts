/**
 * DrawingPlugin — Masterpiece
 *
 * "Squares with Concentric Circles" — a tribute to Wassily Kandinsky, 1913.
 * Twelve colour-study squares arranged in a 4×3 grid, each bearing five
 * concentric rings painted in contrasting hues.
 *
 * ── ARCHITECTURAL NOTE ──────────────────────────────────────────────────────
 * DrawingPlugin renders ALL shapes onto a SINGLE shared PixiJS Graphics
 * object. This means:
 *   • No per-shape identity — clear() wipes the entire canvas in one call
 *   • PixiJS cannot dispatch pointer events to individual shapes
 *   • Suitable for: static overlays, decorative backgrounds, diagrams
 *   • NOT suitable for: interactive nodes / edges (use graph-canvas for that)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * 12 groups × 5 circles + 7 grid lines — all batched into ONE Graphics call.
 * Primitives exercised: rect, circle, circleGlow, line, label
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DrawingPlugin } from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = {
  title: 'canvas/Plugins/Drawing',
};
export default meta;
type Story = StoryObj;

// ── Grid layout ─────────────────────────────────────────────────────────────
const COLS = 4;
const ROWS = 3;
// Cells fill (W × TITLE_OFFSET_TOP_MARGIN), title bar uses the remaining strip

// ── Background colour for each of the 12 squares (left→right, top→bottom) ──
const SQUARE_BG = [
  '#b71c1c', '#1a237e', '#1b5e20', '#e65100',
  '#4a148c', '#006064', '#bf360c', '#0d47a1',
  '#3e2723', '#880e4f', '#33691e', '#f57f17',
];

// ── Five concentric ring colours per square (outer ring → inner dot) ─────────
// Each row is [ring1, ring2, ring3, ring4, centre]
const RINGS: [string, string, string, string, string][] = [
  ['#f48fb1', '#ffcc80', '#80cbc4', '#e8f5e9', '#ffffff'],
  ['#ce93d8', '#80deea', '#ffcc80', '#c5cae9', '#ffffff'],
  ['#a5d6a7', '#fff59d', '#ef9a9a', '#b3e5fc', '#ffffff'],
  ['#ffcc80', '#b0bec5', '#ce93d8', '#f8bbd0', '#ffffff'],
  ['#80deea', '#f48fb1', '#fff59d', '#dce775', '#ffffff'],
  ['#ffcc80', '#a5d6a7', '#80cbc4', '#e1bee7', '#ffffff'],
  ['#ef9a9a', '#90caf9', '#c5e1a5', '#ffe082', '#ffffff'],
  ['#b39ddb', '#80cbc4', '#ffcc80', '#b2dfdb', '#ffffff'],
  ['#fff59d', '#f48fb1', '#80deea', '#c8e6c9', '#ffffff'],
  ['#90caf9', '#ffe082', '#a5d6a7', '#f8bbd0', '#ffffff'],
  ['#c5e1a5', '#b39ddb', '#ffcc80', '#b3e5fc', '#ffffff'],
  ['#80cbc4', '#ef9a9a', '#fff59d', '#e3f2fd', '#ffffff'],
];

// Ring radii (outer → inner, in px relative to a 200px-wide cell)
const RADII = [80, 60, 42, 26, 10] as const;

export const Masterpiece: Story = {
  name: 'Masterpiece',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    // Reserve 34 px at the bottom for the title bar
    const GRID_H = H - 34;
    const CW = Math.floor(W / COLS);
    const CH = Math.floor(GRID_H / ROWS);

    const canvas = new Canvas({
      container,
      width: W,
      height: H,
      backgroundColor: '#111111',
    });
    await canvas.init();

    const draw = new DrawingPlugin({ key: 'masterpiece', zIndex: 10 });
    await canvas.plugins.register(draw);

    // Scale ring radii to the actual cell size (reference: 200 px wide cell)
    const scale = Math.min(CW, CH) / 200;
    const radii = RADII.map((r) => Math.round(r * scale));

    // ── 4×3 grid of colour-study squares ─────────────────────────────────
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const i = row * COLS + col;
        const cx = col * CW + Math.floor(CW / 2);
        const cy = row * CH + Math.floor(CH / 2);
        const rings = RINGS[i]!;
        const bg    = SQUARE_BG[i]!;

        // Coloured background square
        draw.rect(col * CW, row * CH, CW, CH, { fill: bg });

        // Concentric rings — outer to inner (each painted on top of previous)
        draw
          .circle(cx, cy, radii[0]!, { fill: rings[0] })
          .circle(cx, cy, radii[1]!, { fill: rings[1] })
          .circle(cx, cy, radii[2]!, { fill: rings[2] })
          .circle(cx, cy, radii[3]!, { fill: rings[3] })
          .circle(cx, cy, radii[4]!, { fill: rings[4] });

        // Subtle glow on the outermost ring
        draw.circleGlow(
          { x: cx, y: cy, radius: radii[0]!, glowSize: Math.round(radii[0]! * 0.35) },
          { color: rings[0], alpha: 0.22 },
        );
      }
    }

    // ── Grid separators (thick black lines between cells) ─────────────────
    for (let c = 1; c < COLS; c++) {
      draw.line(c * CW, 0, c * CW, GRID_H, { stroke: '#000000', strokeWidth: 4 });
    }
    for (let r = 1; r < ROWS; r++) {
      draw.line(0, r * CH, W, r * CH, { stroke: '#000000', strokeWidth: 4 });
    }
    // Outer frame
    draw.rect(0, 0, W, GRID_H, { stroke: '#000000', strokeWidth: 5 });

    // ── Title bar ─────────────────────────────────────────────────────────
    draw.rect(0, GRID_H, W, H - GRID_H, { fill: '#000000' });
    draw.label(
      'Squares with Concentric Circles  ·  after Wassily Kandinsky, 1913',
      W / 2,
      GRID_H + (H - GRID_H) / 2 - 7,
      { color: '#cccccc', fontSize: 13 },
    );
  },
};
