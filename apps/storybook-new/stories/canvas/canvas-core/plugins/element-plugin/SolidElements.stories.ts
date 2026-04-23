/**
 * ElementPlugin — Solid Elements
 *
 * One of every built-in solid type arranged in a grid:
 *
 *  Row 1  Circle · Rect · Ellipse
 *  Row 2  Polygon (hex) · Diamond · Star
 *
 * Demonstrates:
 *   - `addSolid(type, spec)` API
 *   - `style` (DrawStyle: fill, stroke, strokeWidth)
 *   - `label` rendering
 *   - `fit()` camera
 */
import type { Meta, StoryObj } from '@storybook/html';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type CircleElementSpec, type RectElementSpec, type EllipseElementSpec,
  type PolygonElementSpec, type DiamondElementSpec, type StarElementSpec,
} from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ElementPlugin' };
export default meta;
type Story = StoryObj;

const COLORS = ['#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#ce93d8', '#4dd0e1'];
const c = (i: number) => COLORS[i % COLORS.length] as string;

const G = 160;   // grid cell size
const ROW1 = -G / 2;
const ROW2 =  G / 2 + 20;

export const SolidElements: Story = {
  name: 'Solid Elements',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#1a1a2e' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#333355', backgroundColor: '#1a1a2e', size: 1.5, spacing: 30,
    }));

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    // ── Row 1 ──────────────────────────────────────────────────────────────
    elements.addSolid('circle', {
      id: 'circle', x: -G, y: ROW1, radius: 50,
      label: 'Circle',
      style: { fill: c(0), stroke: '#ffffff', strokeWidth: 2 },
      interactive: true,
    } as CircleElementSpec);

    elements.addSolid('rect', {
      id: 'rect', x: 0 - 55, y: ROW1 - 40, width: 110, height: 80, cornerRadius: 12,
      label: 'Rect',
      style: { fill: c(1), stroke: '#ffffff', strokeWidth: 2 },
      interactive: true,
    } as RectElementSpec);

    elements.addSolid('ellipse', {
      id: 'ellipse', x: G, y: ROW1, radiusX: 70, radiusY: 38,
      label: 'Ellipse',
      style: { fill: c(2), stroke: '#ffffff', strokeWidth: 2 },
      interactive: true,
    } as EllipseElementSpec);

    // ── Row 2 ──────────────────────────────────────────────────────────────
    elements.addSolid('polygon', {
      id: 'polygon', x: -G, y: ROW2 + 60, radius: 50, sides: 6,
      label: 'Polygon (6)',
      style: { fill: c(3), stroke: '#ffffff', strokeWidth: 2 },
      interactive: true,
    } as PolygonElementSpec);

    elements.addSolid('diamond', {
      id: 'diamond', x: 0, y: ROW2 + 60, radius: 52,
      label: 'Diamond',
      style: { fill: c(4), stroke: '#ffffff', strokeWidth: 2 },
      interactive: true,
    } as DiamondElementSpec);

    elements.addSolid('star', {
      id: 'star', x: G, y: ROW2 + 60, radius: 52,
      label: 'Star',
      style: { fill: c(5), stroke: '#ffffff', strokeWidth: 2 },
      interactive: true,
    } as StarElementSpec);

    elements.fit();
  },
};
