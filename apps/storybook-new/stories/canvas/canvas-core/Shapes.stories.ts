/**
 * Shapes — canvas-core-new drawing capabilities
 *
 * A visual catalogue of every primitive available through DrawingPlugin:
 *
 *  Row 0  Circle · Ellipse · Rounded Rect · Rectangle
 *  Row 1  Triangle · Diamond · Pentagon · Hexagon
 *  Row 2  Star-5 · Star-6 · Lines · Bezier curves
 *  Row 3  Dashed Circle · Dotted Circle · Dashed Rect · Dotted Rect
 *  Row 4  Dashed Line · Dotted Line · Orthogonal · Rounded Orthogonal
 *  Row 5  ▶ Triangle · ◆ Diamond · ■ Square · ● Circle  (arrow heads)
 *  Row 6  Circle Glow · Rect Glow · Ripple · Selection Highlight
 *
 * All shapes drawn using only the public @invana/canvas-core-new API.
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, DrawingPlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = {
  title: '2. Node Styles',
};
export default meta;
type Story = StoryObj;

// ─── palette ─────────────────────────────────────────────────────────────────
const PALETTE = [
  '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
  '#ce93d8', '#4dd0e1', '#aed581', '#ff8a65',
  '#90caf9', '#ffe082', '#80cbc4', '#ef9a9a',
];
const STROKE = '#1a1a2e';
const BG = '#1a1a2e';

const COL_COUNT = 4;
const CELL_W = 180;
const CELL_H = 170;
const RADIUS = 50;
const PAD_TOP = 60;

const cx = (col: number) => col * CELL_W + CELL_W / 2;
const cy = (row: number) => PAD_TOP + row * CELL_H + CELL_H / 2;
const color = (i: number) => PALETTE[i % PALETTE.length]!;

// ─── story ───────────────────────────────────────────────────────────────────
export const AllShapes: Story = {
  name: 'All Shapes',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      backgroundColor: BG,
    });
    await canvas.init();

    await canvas.plugins.register(
      new BackgroundPlugin({
        key: 'bg',
        type: 'pattern',
        patternType: 'dots',
        color: '#2a2a3e',
        backgroundColor: BG,
        size: 1.5,
        spacing: 28,
        alpha: 0.8,
      }),
    );

    const draw = new DrawingPlugin({ key: 'shapes', zIndex: 10 });
    await canvas.plugins.register(draw);

    let idx = 0;

    // ── Row 0 — basic shapes ───────────────────────────────────────────────
    draw.circle(cx(0), cy(0), RADIUS, { fill: color(idx), stroke: STROKE, strokeWidth: 2 });
    draw.label('Circle', cx(0), cy(0) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.ellipse(cx(1), cy(0), RADIUS * 1.4, RADIUS * 0.7, { fill: color(idx), stroke: STROKE, strokeWidth: 2 });
    draw.label('Ellipse', cx(1), cy(0) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.rect(cx(2) - RADIUS, cy(0) - RADIUS * 0.65, RADIUS * 2, RADIUS * 1.3, {
      fill: color(idx), stroke: STROKE, strokeWidth: 2, cornerRadius: 16,
    });
    draw.label('Rounded Rect', cx(2), cy(0) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.rect(cx(3) - RADIUS, cy(0) - RADIUS * 0.65, RADIUS * 2, RADIUS * 1.3, {
      fill: color(idx), stroke: STROKE, strokeWidth: 2,
    });
    draw.label('Rectangle', cx(3), cy(0) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // ── Row 1 — polygons ──────────────────────────────────────────────────
    draw.polygon(cx(0), cy(1), RADIUS, 3, { fill: color(idx), stroke: STROKE, strokeWidth: 2 });
    draw.label('Triangle', cx(0), cy(1) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.polygon(cx(1), cy(1), RADIUS, 4, { fill: color(idx), stroke: STROKE, strokeWidth: 2, rotation: 0 });
    draw.label('Diamond', cx(1), cy(1) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.polygon(cx(2), cy(1), RADIUS, 5, { fill: color(idx), stroke: STROKE, strokeWidth: 2 });
    draw.label('Pentagon', cx(2), cy(1) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.polygon(cx(3), cy(1), RADIUS, 6, { fill: color(idx), stroke: STROKE, strokeWidth: 2 });
    draw.label('Hexagon', cx(3), cy(1) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // ── Row 2 — stars · lines · bezier ───────────────────────────────────
    draw.star(cx(0), cy(2), RADIUS, { fill: color(idx), stroke: STROKE, strokeWidth: 2, points: 5 });
    draw.label('Star (5pt)', cx(0), cy(2) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.star(cx(1), cy(2), RADIUS, { fill: color(idx), stroke: STROKE, strokeWidth: 2, points: 6, innerRatio: 0.5 });
    draw.label('Star (6pt)', cx(1), cy(2) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI;
      draw.line(cx(2) - Math.cos(a) * RADIUS, cy(2) - Math.sin(a) * RADIUS,
                cx(2) + Math.cos(a) * RADIUS, cy(2) + Math.sin(a) * RADIUS,
                { stroke: color(idx + i), strokeWidth: 2 });
    }
    draw.label('Lines', cx(2), cy(2) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    [-60, -40, -20, 0, 20, 40, 60].forEach((c, i) => {
      draw.autoBezier({ x: cx(3) - RADIUS, y: cy(2) }, { x: cx(3) + RADIUS, y: cy(2) },
                      { stroke: color(idx + i), strokeWidth: 2 }, c);
    });
    draw.label('Bezier', cx(3), cy(2) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // ── Row 3 — dashed / dotted shapes ───────────────────────────────────
    draw.dashedCircle(cx(0), cy(3), RADIUS, { color: color(idx), strokeWidth: 2.5, dashLength: 10, gapLength: 6 });
    draw.label('Dashed Circle', cx(0), cy(3) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.dottedCircle(cx(1), cy(3), RADIUS, { color: color(idx), strokeWidth: 4, dotSpacing: 10 });
    draw.label('Dotted Circle', cx(1), cy(3) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.dashedRect(cx(2) - RADIUS, cy(3) - RADIUS * 0.65, RADIUS * 2, RADIUS * 1.3,
                    { color: color(idx), strokeWidth: 2.5, dashLength: 10, gapLength: 6 });
    draw.label('Dashed Rect', cx(2), cy(3) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    draw.dottedRect(cx(3) - RADIUS, cy(3) - RADIUS * 0.65, RADIUS * 2, RADIUS * 1.3,
                    { color: color(idx), strokeWidth: 4, dotSpacing: 10 });
    draw.label('Dotted Rect', cx(3), cy(3) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // ── Row 4 — dashed lines · orthogonal paths ──────────────────────────
    for (let i = 0; i < 5; i++) {
      const y = cy(4) - RADIUS + i * (RADIUS * 2 / 4);
      draw.dashedLine(cx(0) - RADIUS, y, cx(0) + RADIUS, y,
                      { color: color(idx + i), strokeWidth: 2, dashLength: 8, gapLength: 5 });
    }
    draw.label('Dashed Lines', cx(0), cy(4) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    for (let i = 0; i < 5; i++) {
      const y = cy(4) - RADIUS + i * (RADIUS * 2 / 4);
      draw.dottedLine(cx(1) - RADIUS, y, cx(1) + RADIUS, y,
                      { color: color(idx + i), strokeWidth: 3, dotSpacing: 8 });
    }
    draw.label('Dotted Lines', cx(1), cy(4) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // Orthogonal (sharp corners)
    draw.orthogonal(
      { from: { x: cx(2) - RADIUS, y: cy(4) - RADIUS * 0.5 },
        to:   { x: cx(2) + RADIUS, y: cy(4) + RADIUS * 0.5 },
        sourceDirection: 'right', targetDirection: 'top' },
      { stroke: color(idx), strokeWidth: 2.5 },
    );
    draw.label('Orthogonal', cx(2), cy(4) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // Rounded orthogonal
    draw.roundedOrthogonal(
      { from: { x: cx(3) - RADIUS, y: cy(4) - RADIUS * 0.5 },
        to:   { x: cx(3) + RADIUS, y: cy(4) + RADIUS * 0.5 },
        sourceDirection: 'right', targetDirection: 'top', cornerRadius: 14 },
      { stroke: color(idx), strokeWidth: 2.5 },
    );
    draw.label('Rounded Ortho', cx(3), cy(4) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // ── Row 5 — arrow heads ──────────────────────────────────────────────
    const arrowAngle = 0; // pointing right
    const aSize = 28;

    // Render all 9 arrowhead types spread across 4 cells
    const arrowTypes = [
      ['triangle', 'thinTriangle', 'triangleOutline'],
      ['diamond', 'diamondOutline'],
      ['square', 'squareOutline'],
      ['circle', 'circleOutline'],
    ] as const;

    arrowTypes.forEach((group, col) => {
      const spacing = (RADIUS * 2) / (group.length + 1);
      group.forEach((type, i) => {
        const ay = cy(5) - RADIUS + spacing * (i + 1);
        // Draw a short stem line
        draw.line(cx(col) - RADIUS * 0.6, ay, cx(col) + RADIUS * 0.25, ay,
                  { stroke: color(idx), strokeWidth: 1.5 });
        draw.arrowHead({ x: cx(col) + RADIUS * 0.25, y: ay, angle: arrowAngle, size: aSize },
                       type, { fill: color(idx), stroke: color(idx), strokeWidth: 1.5, fillAlpha: 0.9 });
        idx++;
      });
      const label = group.join(' / ');
      draw.label(label, cx(col), cy(5) + RADIUS + 12, { color: '#ccc', fontSize: 10 });
    });

    // ── Row 6 — effects ──────────────────────────────────────────────────
    // Circle glow
    draw.circleGlow({ x: cx(0), y: cy(6), radius: RADIUS * 0.5, glowSize: RADIUS * 0.6 },
                    { color: color(idx), alpha: 0.5 });
    draw.circle(cx(0), cy(6), RADIUS * 0.5, { fill: color(idx), stroke: STROKE, strokeWidth: 2 });
    draw.label('Circle Glow', cx(0), cy(6) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // Rect glow
    const rgx = cx(1) - RADIUS * 0.8;
    const rgy = cy(6) - RADIUS * 0.55;
    const rgw = RADIUS * 1.6;
    const rgh = RADIUS * 1.1;
    draw.rectGlow({ x: rgx, y: rgy, width: rgw, height: rgh, glowSize: 28, cornerRadius: 10 },
                  { color: color(idx), alpha: 0.5 });
    draw.rect(rgx, rgy, rgw, rgh, { fill: color(idx), stroke: STROKE, strokeWidth: 2, cornerRadius: 10 });
    draw.label('Rect Glow', cx(1), cy(6) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // Ripple
    draw.ripple({ x: cx(2), y: cy(6), radius: RADIUS * 0.15, maxRadius: RADIUS * 0.9, ringCount: 4 },
                { color: color(idx), strokeWidth: 2, alpha: 0.7 });
    draw.circle(cx(2), cy(6), RADIUS * 0.15, { fill: color(idx), fillAlpha: 0.9 });
    draw.label('Ripple', cx(2), cy(6) + RADIUS + 12, { color: '#ccc', fontSize: 12 });
    idx++;

    // Selection highlight
    const shx = cx(3) - RADIUS * 0.85;
    const shy = cy(6) - RADIUS * 0.6;
    draw.rect(shx, shy, RADIUS * 1.7, RADIUS * 1.2, { fill: color(idx), stroke: STROKE, strokeWidth: 2, cornerRadius: 8 });
    draw.selectionHighlight(shx - 5, shy - 5, RADIUS * 1.7 + 10, RADIUS * 1.2 + 10,
                            { color: '#58a6ff', strokeWidth: 2.5, alpha: 0.9 }, 12);
    draw.label('Selection', cx(3), cy(6) + RADIUS + 12, { color: '#ccc', fontSize: 12 });

    // ── camera ────────────────────────────────────────────────────────────
    const totalW = COL_COUNT * CELL_W;
    const totalH = 7 * CELL_H + PAD_TOP + 40;
    canvas.camera.panTo(totalW / 2, totalH / 2);
    canvas.camera.fitContent(40);
  },
};
