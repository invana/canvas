/**
 * ShapePlugin — Shape Sampler
 *
 * One of every supported shape type with solid fill + border.
 * Row 1: closed filled shapes
 * Row 2: dashed/dotted outlines + effect shapes
 * Row 3: paths and curves
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import { createContainer } from '../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles' };
export default meta;
type Story = StoryObj;

const COLORS = ['#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#ce93d8', '#4dd0e1'];
const col = (i: number) => COLORS[i % COLORS.length] as string;

export const ShapeSampler: Story = {
  name: 'Shape Sampler',
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

    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    const G = 130, ox = -2.5 * G;
    const wb = { color: '#ffffff', width: 1.5, alpha: 0.4 };

    shapes.setData([
      // ── Row 1: closed filled ──────────────────────────────────────────────
      { id: 'r1c1', type: 'circle',  x: ox + G * 0, y: -G, radius: 45,
        fill: { type: 'solid', color: col(0) }, border: wb },
      { id: 'r1c2', type: 'ellipse', x: ox + G * 1, y: -G, radiusX: 60, radiusY: 32,
        fill: { type: 'solid', color: col(1) }, border: wb },
      { id: 'r1c3', type: 'rect',    x: ox + G * 2 - 45, y: -G - 32, width: 90, height: 65,
        fill: { type: 'solid', color: col(2) }, border: wb },
      { id: 'r1c4', type: 'polygon', x: ox + G * 3, y: -G, radius: 45, sides: 6,
        fill: { type: 'solid', color: col(3) }, border: wb },
      { id: 'r1c5', type: 'star',    x: ox + G * 4, y: -G, radius: 45,
        fill: { type: 'solid', color: col(4) }, border: wb },
      { id: 'r1c6', type: 'polygon', x: ox + G * 5, y: -G, radius: 45, sides: 3,
        fill: { type: 'solid', color: col(5) }, border: wb },

      // ── Row 2: dashed/dotted + effect shapes ─────────────────────────────
      { id: 'r2c1', type: 'dashedCircle', x: ox + G * 0, y: G, radius: 45,
        border: { color: col(0), width: 2, dash: { length: 8, gap: 5 } } },
      { id: 'r2c2', type: 'dottedCircle', x: ox + G * 1, y: G, radius: 45,
        border: { color: col(1), width: 2 } },
      { id: 'r2c3', type: 'dashedRect',   x: ox + G * 2 - 45, y: G - 32, width: 90, height: 65,
        border: { color: col(2), width: 2, dash: { length: 10, gap: 5 } } },
      { id: 'r2c4', type: 'dottedRect',   x: ox + G * 3 - 45, y: G - 32, width: 90, height: 65,
        border: { color: col(3), width: 2 } },
      { id: 'r2c5', type: 'circleGlow',   x: ox + G * 4, y: G, radius: 32,
        border: { color: col(4), width: 1, alpha: 0.8 } },
      { id: 'r2c6', type: 'rippleRing',   x: ox + G * 5, y: G, radius: 40,
        border: { color: col(5), width: 2, alpha: 0.9 } },

      // ── Row 3: paths ─────────────────────────────────────────────────────
      { id: 'r3c1', type: 'line',
        x1: ox + G * 0 - 50, y1: G * 2, x2: ox + G * 0 + 50, y2: G * 2,
        border: { color: col(0), width: 3 } },
      { id: 'r3c2', type: 'dashedLine',
        x1: ox + G * 1 - 50, y1: G * 2, x2: ox + G * 1 + 50, y2: G * 2,
        border: { color: col(1), width: 3, dash: { length: 10, gap: 6 } } },
      { id: 'r3c3', type: 'dottedLine',
        x1: ox + G * 2 - 50, y1: G * 2, x2: ox + G * 2 + 50, y2: G * 2,
        border: { color: col(2), width: 3 } },
      { id: 'r3c4', type: 'autoBezier',
        from: { x: ox + G * 3 - 50, y: G * 2 - 25 },
        to:   { x: ox + G * 3 + 50, y: G * 2 + 25 },
        border: { color: col(3), width: 3 } },
      { id: 'r3c5', type: 'bezier',
        from: { x: ox + G * 4 - 50, y: G * 2 },
        cp1:  { x: ox + G * 4,      y: G * 2 - 70 },
        to:   { x: ox + G * 4 + 50, y: G * 2 },
        border: { color: col(4), width: 3 } },
    ] as never[]);

    // GUI
    const gui = new GUI({ title: 'Shape Sampler', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = { devInfo: true };
    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
