/**
 * DrawingPlugin — Kids Art
 *
 * A silly hand-drawn kids scene built entirely with DrawingPlugin.
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
 * Primitives exercised: circle, ellipse, rect, polygon, star, line,
 *   bezier, dottedCircle, dashedLine, circleGlow, label
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, DrawingPlugin } from '@invana/canvas';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = {
  title: '5. Layers & Overlays/Drawing',
};
export default meta;
type Story = StoryObj;

export const KidsArt: Story = {
  name: 'Kids Art',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    const canvas = new Canvas({
      container,
      width: W,
      height: H,
      backgroundColor: '#87CEEB', // sky blue
    });
    await canvas.init();

    const draw = new DrawingPlugin({ key: 'kids-art', zIndex: 10 });
    await canvas.plugins.register(draw);

    const GY = Math.floor(H * 0.76); // y-coordinate where ground begins

    // ── Ground ─────────────────────────────────────────────────────────────
    draw.rect(0, GY, W, H - GY, { fill: '#4a8c3f', stroke: '#2d6625', strokeWidth: 2 });

    // ── Rainbow (drawn early so clouds paint over it) ───────────────────
    const rainbowColors = ['#FF0000', '#FF7700', '#FFFF00', '#00BB00', '#0055FF', '#8800CC'];
    rainbowColors.forEach((c, i) => {
      const r = 255 - i * 25;
      draw.bezier(
        { x: 35, y: GY },
        { x: 210, y: GY - r * 1.5 },
        { x: 385, y: GY },
        { stroke: c, strokeWidth: 13, strokeAlpha: 0.72 },
      );
    });

    // ── Sun ────────────────────────────────────────────────────────────────
    const SX = W - 125, SY = 90;
    draw.circleGlow({ x: SX, y: SY, radius: 52, glowSize: 48 }, { color: '#FFA500', alpha: 0.28 });
    draw.circle(SX, SY, 52, { fill: '#FFD700', stroke: '#FFA500', strokeWidth: 3 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      draw.line(
        SX + Math.cos(a) * 62, SY + Math.sin(a) * 62,
        SX + Math.cos(a) * 90, SY + Math.sin(a) * 90,
        { stroke: '#FFD700', strokeWidth: 3 },
      );
    }

    // ── Clouds ─────────────────────────────────────────────────────────────
    const drawCloud = (cx: number, cy: number, s: number) =>
      draw
        .ellipse(cx,           cy,           54 * s, 33 * s, { fill: '#ffffff', fillAlpha: 0.93 })
        .ellipse(cx - 36 * s,  cy + 9 * s,   38 * s, 25 * s, { fill: '#ffffff', fillAlpha: 0.93 })
        .ellipse(cx + 36 * s,  cy + 9 * s,   36 * s, 25 * s, { fill: '#ffffff', fillAlpha: 0.93 })
        .ellipse(cx + 16 * s,  cy - 18 * s,  28 * s, 21 * s, { fill: '#ffffff', fillAlpha: 0.93 })
        .ellipse(cx - 16 * s,  cy - 14 * s,  26 * s, 20 * s, { fill: '#ffffff', fillAlpha: 0.93 });

    drawCloud(195, 78,  1);
    drawCloud(468, 58,  0.78);
    drawCloud(320, 120, 0.62);

    // ── House ──────────────────────────────────────────────────────────────
    const HX = 145, HY = 300, HW = 185, HH = GY - 300;
    const HCX = HX + Math.floor(HW / 2); // 237

    // Body
    draw.rect(HX, HY, HW, HH, { fill: '#D2A679', stroke: '#8B5E3C', strokeWidth: 3 });

    // Roof  (triangle, one vertex pointing up; base lands on house top)
    //   Formula: cy_roof = HY - R×0.5  →  base bottom = HY
    draw.polygon(HCX, HY - 54, 108, 3, { fill: '#CC3300', stroke: '#991100', strokeWidth: 3 });

    // Chimney (drawn after roof so it paints over the slope)
    draw.rect(HX + 134, HY - 82, 27, 90, { fill: '#8B5E3C', stroke: '#5C3A1E', strokeWidth: 2 });

    // Smoke puffs
    draw
      .dottedCircle(HX + 148, HY - 92, 11, { color: '#cccccc', strokeWidth: 2.5, dotSpacing: 6 })
      .dottedCircle(HX + 154, HY - 110, 9,  { color: '#bbbbbb', strokeWidth: 2,   dotSpacing: 5 });

    // Door
    draw.rect(HX + 68, HY + HH - 78, 50, 78, { fill: '#5C3A1E', stroke: '#3a2210', strokeWidth: 2 });
    // Door knob
    draw.circle(HX + 113, HY + HH - 38, 5, { fill: '#FFD700' });

    // Windows
    draw
      .rect(HX + 10,  HY + 14, 48, 42, { fill: '#ADD8E6', stroke: '#8B5E3C', strokeWidth: 2 })
      .rect(HX + 127, HY + 14, 48, 42, { fill: '#ADD8E6', stroke: '#8B5E3C', strokeWidth: 2 });

    // Window crosses
    draw
      .line(HX + 34,  HY + 14, HX + 34,  HY + 56, { stroke: '#8B5E3C', strokeWidth: 2 })
      .line(HX + 10,  HY + 35, HX + 58,  HY + 35, { stroke: '#8B5E3C', strokeWidth: 2 })
      .line(HX + 151, HY + 14, HX + 151, HY + 56, { stroke: '#8B5E3C', strokeWidth: 2 })
      .line(HX + 127, HY + 35, HX + 175, HY + 35, { stroke: '#8B5E3C', strokeWidth: 2 });

    // ── Trees ──────────────────────────────────────────────────────────────
    // Tree left
    draw
      .rect(75, GY - 70, 22, 70, { fill: '#7B4F2E', stroke: '#5C3A1E', strokeWidth: 2 })
      .circle(86, GY - 88, 48, { fill: '#3a8c2f', stroke: '#2d6625', strokeWidth: 2 });

    // Tree right
    draw
      .rect(488, GY - 92, 19, 92, { fill: '#7B4F2E', stroke: '#5C3A1E', strokeWidth: 2 })
      .circle(497, GY - 110, 44, { fill: '#4a9e3a', stroke: '#2d6625', strokeWidth: 2 });

    // ── Stick figure ───────────────────────────────────────────────────────
    const FX = 595, FY = GY; // feet at ground level
    draw
      .circle(FX, FY - 76, 22, { fill: '#FFDAB9', stroke: '#8B5E3C', strokeWidth: 2 })    // head
      .circle(FX - 8, FY - 81, 4, { fill: '#333333' })                                    // eye L
      .circle(FX + 8, FY - 81, 4, { fill: '#333333' })                                    // eye R
      .bezier(                                                                              // smile
        { x: FX - 9, y: FY - 68 },
        { x: FX,     y: FY - 62 },
        { x: FX + 9, y: FY - 68 },
        { stroke: '#8B5E3C', strokeWidth: 2 },
      )
      .line(FX, FY - 54, FX, FY - 10, { stroke: '#8B5E3C', strokeWidth: 3 })              // body
      .line(FX - 32, FY - 34, FX + 32, FY - 34, { stroke: '#8B5E3C', strokeWidth: 3 })   // arms
      .line(FX, FY - 10, FX - 24, FY + 30, { stroke: '#8B5E3C', strokeWidth: 3 })        // leg L
      .line(FX, FY - 10, FX + 24, FY + 30, { stroke: '#8B5E3C', strokeWidth: 3 });       // leg R

    // Shirt (little triangle on torso)
    draw.polygon(FX, FY - 32, 22, 3, { fill: '#E63946', stroke: '#C1121F', strokeWidth: 1 });

    // ── Flowers ────────────────────────────────────────────────────────────
    const flowers = [
      { x: 400, y: GY + 22, r: 14, c: '#FF69B4' },
      { x: 440, y: GY + 30, r: 11, c: '#FF1493' },
      { x: 416, y: GY + 40, r: 12, c: '#FFB347' },
      { x: 648, y: GY + 18, r: 13, c: '#DA70D6' },
      { x: 675, y: GY + 28, r: 10, c: '#FF69B4' },
      { x: 540, y: GY + 35, r: 11, c: '#FF4081' },
    ];
    flowers.forEach(({ x, y, r, c }) =>
      draw
        .star(x, y, r, { fill: c, stroke: '#ffffff', strokeWidth: 1, points: 6 })
        .circle(x, y, Math.floor(r * 0.44), { fill: '#FFD700' }),
    );

    // ── Path across the ground ─────────────────────────────────────────────
    draw.dashedLine(0, GY + 8, W, GY + 8, {
      color: '#ffffff', strokeWidth: 2.5, dashLength: 18, gapLength: 10,
    });

    // ── Title ──────────────────────────────────────────────────────────────
    draw.label('✦  MY DRAWING  ✦  by Tommy, Age 5  ✦', W / 2, H - 24, {
      color: '#2d6625',
      fontSize: 16,
    });
  },
};
