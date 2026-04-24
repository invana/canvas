/**
 * ElementPlugin — Fill Styles
 *
 * Demonstrates every `DrawStyle` variant available on solid elements:
 *
 *  Row 1  Solid fills — opaque color fills with different hues
 *  Row 2  Transparent fills — `fillAlpha` from 1.0 → 0.1
 *  Row 3  Stroke-only — fill removed (`fillAlpha: 0`), only stroke shows
 *  Row 4  Stroke weight — strokeWidth from 1 → 12, same fill
 *  Row 5  Stroke alpha  — strokeAlpha from 1.0 → 0.2 at fixed width
 *
 * Demonstrates:
 *   - `style.fill`        — hex color string
 *   - `style.fillAlpha`   — per-element fill transparency
 *   - `style.stroke`      — hex stroke color
 *   - `style.strokeWidth` — stroke thickness in world pixels
 *   - `style.strokeAlpha` — stroke transparency
 *
 * All elements are `circle` for a clean comparison; the concepts apply
 * equally to rect, ellipse, polygon, diamond, star and hexagon.
 */
import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type CircleElementSpec,
} from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ElementPlugin' };
export default meta;
type Story = StoryObj;

const R   = 40;
const GAP = 110;

// ── colour palette ────────────────────────────────────────────────────────────
const FILLS   = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#ec4899'];
const STROKE  = '#ffffff';
const BGFILL  = '#3b82f6';

export const FillStyles: Story = {
  name: 'Fill Styles',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true, fitPadding: 80 });
    await canvas.plugins.register(elements);

    const rows = [
      { id: 'solid',        label: 'solid fill',    y: -GAP * 2 },
      { id: 'fillalpha',    label: 'fill alpha',     y: -GAP },
      { id: 'strokeonly',   label: 'stroke only',    y: 0 },
      { id: 'strokeweight', label: 'stroke weight',  y:  GAP },
      { id: 'strokealpha',  label: 'stroke alpha',   y:  GAP * 2 },
    ];

    // Row label — draw as the first element far left
    const LABEL_X = -(FILLS.length * GAP) / 2 - 90;
    rows.forEach(row => {
      elements.addSolid('circle', {
        id: `lbl-${row.id}`, x: LABEL_X, y: row.y, radius: 2,
        label: row.label,
        style: { fill: '#475569', fillAlpha: 0 },
      } as CircleElementSpec);
    });

    // ── Row 1: solid fills ────────────────────────────────────────────────
    FILLS.forEach((fill, i) => {
      const x = -(FILLS.length - 1) * GAP / 2 + i * GAP;
      elements.addSolid('circle', {
        id: `solid-${i}`, x, y: -GAP * 2, radius: R,
        label: fill,
        style: { fill, stroke: STROKE, strokeWidth: 2 },
        interactive: true,
      } as CircleElementSpec);
    });

    // ── Row 2: fill alpha ─────────────────────────────────────────────────
    const alphas = [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.1];
    alphas.forEach((fillAlpha, i) => {
      const x = -(alphas.length - 1) * GAP / 2 + i * GAP;
      elements.addSolid('circle', {
        id: `fillalpha-${i}`, x, y: -GAP, radius: R,
        label: `α=${fillAlpha}`,
        style: { fill: BGFILL, fillAlpha, stroke: STROKE, strokeWidth: 2 },
        interactive: true,
      } as CircleElementSpec);
    });

    // ── Row 3: stroke-only (fillAlpha = 0) ───────────────────────────────
    FILLS.forEach((fill, i) => {
      const x = -(FILLS.length - 1) * GAP / 2 + i * GAP;
      elements.addSolid('circle', {
        id: `strokeonly-${i}`, x, y: 0, radius: R,
        label: 'no fill',
        style: { fill, fillAlpha: 0, stroke: fill, strokeWidth: 3 },
        interactive: true,
      } as CircleElementSpec);
    });

    // ── Row 4: stroke weight ──────────────────────────────────────────────
    const widths = [1, 2, 3, 5, 7, 10, 14];
    widths.forEach((strokeWidth, i) => {
      const x = -(widths.length - 1) * GAP / 2 + i * GAP;
      elements.addSolid('circle', {
        id: `sw-${i}`, x, y: GAP, radius: R,
        label: `sw=${strokeWidth}`,
        style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth },
        interactive: true,
      } as CircleElementSpec);
    });

    // ── Row 5: stroke alpha ───────────────────────────────────────────────
    const sAlphas = [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.1];
    sAlphas.forEach((strokeAlpha, i) => {
      const x = -(sAlphas.length - 1) * GAP / 2 + i * GAP;
      elements.addSolid('circle', {
        id: `sa-${i}`, x, y: GAP * 2, radius: R,
        label: `sα=${strokeAlpha}`,
        style: { fill: '#1e3a5f', stroke: '#f472b6', strokeWidth: 5, strokeAlpha },
        interactive: true,
      } as CircleElementSpec);
    });

    elements.fit();

    // ── GUI: live-edit first row color ───────────────────────────────────
    const gui = new GUI({ title: 'Style editor', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = {
      fill:        '#ef4444',
      fillAlpha:   1,
      stroke:      '#ffffff',
      strokeWidth: 2,
    };
    gui.addColor(params, 'fill').onChange((v: string) => {
      elements.updateSolid('solid-0', { style: { fill: v, stroke: params.stroke, strokeWidth: params.strokeWidth } } as Partial<CircleElementSpec>);
    });
    gui.add(params, 'fillAlpha', 0, 1, 0.05).onChange((v: number) => {
      elements.updateSolid('solid-0', { style: { fill: params.fill, fillAlpha: v, stroke: params.stroke, strokeWidth: params.strokeWidth } } as Partial<CircleElementSpec>);
    });
    gui.addColor(params, 'stroke').onChange((v: string) => {
      elements.updateSolid('solid-0', { style: { fill: params.fill, stroke: v, strokeWidth: params.strokeWidth } } as Partial<CircleElementSpec>);
    });
    gui.add(params, 'strokeWidth', 0, 20, 0.5).onChange((v: number) => {
      elements.updateSolid('solid-0', { style: { fill: params.fill, stroke: params.stroke, strokeWidth: v } } as Partial<CircleElementSpec>);
    });
  },
};
