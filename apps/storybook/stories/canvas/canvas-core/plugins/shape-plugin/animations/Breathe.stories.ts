/**
 * Breathe Animation
 *
 * Oscillates the shape scale using a sine wave, creating a "living" breathing
 * effect. The scale is applied to the PixiJS Container — no Graphics redraw
 * is needed, so it is GPU-friendly even at high frame rates.
 * Demonstrated on all shape types supported by ShapePlugin.
 *
 * Options:
 *   - amplitude  — peak scale delta (e.g. 0.15 = ±15% of normal size)
 *   - duration   — one full cycle in ms
 *   - repeat     — number of cycles before stopping (-1 = infinite)
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas';
import { createContainer } from '../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '7. Animations/Nodes & Edges' };
export default meta;
type Story = StoryObj;

export const Breathe: Story = {
  name: 'Breathe',
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

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    shapes.setData([
      // ── Row 1: solid shapes ──────────────────────────────────────────────
      {
        id: 'circle',  type: 'circle' as const,  x: -440, y: -180, radius: 50,
        fill: { type: 'solid' as const, color: '#1e40af' },
        border: { color: '#93c5fd', width: 2 }, label: { text: 'circle' },
      },
      {
        id: 'ellipse', type: 'ellipse' as const, x: -220, y: -180, radiusX: 65, radiusY: 40,
        fill: { type: 'solid' as const, color: '#4c1d95' },
        border: { color: '#c4b5fd', width: 2 }, label: { text: 'ellipse' },
      },
      {
        id: 'rect',    type: 'rect' as const,    x: 0,    y: -180, width: 100, height: 80,
        fill: { type: 'solid' as const, color: '#065f46' },
        border: { color: '#6ee7b7', width: 2 }, label: { text: 'rect' },
      },
      {
        id: 'rectR',   type: 'rect' as const,    x: 220,  y: -180, width: 100, height: 80, cornerRadius: 20,
        fill: { type: 'solid' as const, color: '#78350f' },
        border: { color: '#fcd34d', width: 2 }, label: { text: 'rounded rect' },
      },
      {
        id: 'star',    type: 'star' as const,    x: 440,  y: -180, radius: 55, points: 5,
        fill: { type: 'solid' as const, color: '#881337' },
        border: { color: '#fda4af', width: 2 }, label: { text: 'star' },
      },
      // ── Row 2: polygon shapes ────────────────────────────────────────────
      {
        id: 'tri',     type: 'polygon' as const, x: -440, y: 60, radius: 55, sides: 3, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#0c4a6e' },
        border: { color: '#67e8f9', width: 2 }, label: { text: 'triangle' },
      },
      {
        id: 'dia',     type: 'polygon' as const, x: -220, y: 60, radius: 55, sides: 4,
        fill: { type: 'solid' as const, color: '#14532d' },
        border: { color: '#86efac', width: 2 }, label: { text: 'diamond' },
      },
      {
        id: 'pent',    type: 'polygon' as const, x: 0,    y: 60, radius: 55, sides: 5, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#7c2d12' },
        border: { color: '#fdba74', width: 2 }, label: { text: 'pentagon' },
      },
      {
        id: 'hex',     type: 'polygon' as const, x: 220,  y: 60, radius: 55, sides: 6,
        fill: { type: 'solid' as const, color: '#3b0764' },
        border: { color: '#d8b4fe', width: 2 }, label: { text: 'hexagon' },
      },
      {
        id: 'oct',     type: 'polygon' as const, x: 440,  y: 60, radius: 55, sides: 8,
        fill: { type: 'solid' as const, color: '#4c0519' },
        border: { color: '#fbb6ce', width: 2 }, label: { text: 'octagon' },
      },
      // ── Row 3: path shapes ───────────────────────────────────────────────
      {
        id: 'line',    type: 'line' as const, x1: -470, y1: 295, x2: -170, y2: 295,
        border: { color: '#7dd3fc', width: 3 }, label: { text: 'line' },
      },
      {
        id: 'abezier', type: 'autoBezier' as const,
        from: { x: -50, y: 278 }, to: { x: 150, y: 318 }, curvature: 60,
        border: { color: '#a7f3d0', width: 3 }, label: { text: 'auto-bezier' },
      },
      {
        id: 'bezier',  type: 'bezier' as const,
        from: { x: 230, y: 295 }, cp1: { x: 310, y: 255 }, cp2: { x: 390, y: 335 }, to: { x: 470, y: 295 },
        border: { color: '#fde68a', width: 3 }, label: { text: 'bezier' },
      },
    ] as never[]);

    // Stagger amplitude & duration across shapes
    const presets: Record<string, { amplitude: number; duration: number }> = {
      circle:  { amplitude: 0.06, duration: 3500 },
      ellipse: { amplitude: 0.10, duration: 2800 },
      rect:    { amplitude: 0.08, duration: 2200 },
      rectR:   { amplitude: 0.12, duration: 2600 },
      star:    { amplitude: 0.15, duration: 1800 },
      tri:     { amplitude: 0.08, duration: 3000 },
      dia:     { amplitude: 0.10, duration: 2400 },
      pent:    { amplitude: 0.12, duration: 2000 },
      hex:     { amplitude: 0.12, duration: 2000 },
      oct:     { amplitude: 0.08, duration: 2600 },
      line:    { amplitude: 0.12, duration: 2000 },
      abezier: { amplitude: 0.12, duration: 2200 },
      bezier:  { amplitude: 0.12, duration: 2400 },
    };
    for (const [id, opts] of Object.entries(presets)) {
      shapes.animate(id, { breathe: opts });
    }

    // GUI — controls 'hex' live
    const gui = new GUI({ title: 'breathe', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const p = { amplitude: 0.12, duration: 2000, repeat: -1 };

    const restart = () =>
      shapes.animate('hex', { breathe: { amplitude: p.amplitude, duration: p.duration, repeat: p.repeat } });

    gui.add(p, 'amplitude', 0.01, 0.5, 0.01).onChange(restart);
    gui.add(p, 'duration', 200, 5000, 100).name('duration (ms)').onChange(restart);
    gui.add(p, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange(restart);
    gui.add({ stop: () => shapes.stopAnimation('hex', 'breathe') }, 'stop').name('■ Stop (hex)');
    gui.add({ play: restart }, 'play').name('▶ Play (hex)');
  },
};
