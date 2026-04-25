/**
 * Pulse Animation
 *
 * Draws expanding ripple rings radiating outward from the shape.
 * Rings are rendered on a rented HaloPool Graphics — the shape's own Graphics
 * is untouched, making this one of the lowest-cost animation types.
 * Demonstrated on all shape types supported by ShapePlugin.
 *
 * Options:
 *   - maxRadius  — how far rings expand beyond the shape edge in px
 *   - duration   — one full pulse cycle in ms
 *   - color      — ring color (defaults to shape fill color)
 *   - repeat     — cycle count before stopping (-1 = infinite)
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '7. Animations/Nodes & Edges' };
export default meta;
type Story = StoryObj;

export const Pulse: Story = {
  name: 'Pulse',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0a0a0f' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1a1a2e', backgroundColor: '#0a0a0f', size: 1.5, spacing: 30,
    }));

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    shapes.setData([
      // ── Row 1: solid shapes ──────────────────────────────────────────────
      {
        id: 'circle',  type: 'circle' as const,  x: -440, y: -180, radius: 50,
        fill: { type: 'solid' as const, color: '#3b82f6' },
        border: { color: '#93c5fd', width: 2 }, label: { text: 'circle' },
      },
      {
        id: 'ellipse', type: 'ellipse' as const, x: -220, y: -180, radiusX: 65, radiusY: 40,
        fill: { type: 'solid' as const, color: '#8b5cf6' },
        border: { color: '#c4b5fd', width: 2 }, label: { text: 'ellipse' },
      },
      {
        id: 'rect',    type: 'rect' as const,    x: 0,    y: -180, width: 100, height: 80,
        fill: { type: 'solid' as const, color: '#10b981' },
        border: { color: '#6ee7b7', width: 2 }, label: { text: 'rect' },
      },
      {
        id: 'rectR',   type: 'rect' as const,    x: 220,  y: -180, width: 100, height: 80, cornerRadius: 20,
        fill: { type: 'solid' as const, color: '#f59e0b' },
        border: { color: '#fcd34d', width: 2 }, label: { text: 'rounded rect' },
      },
      {
        id: 'star',    type: 'star' as const,    x: 440,  y: -180, radius: 55, points: 5,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#fda4af', width: 2 }, label: { text: 'star' },
      },
      // ── Row 2: polygon shapes ────────────────────────────────────────────
      {
        id: 'tri',     type: 'polygon' as const, x: -440, y: 60, radius: 55, sides: 3, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#06b6d4' },
        border: { color: '#67e8f9', width: 2 }, label: { text: 'triangle' },
      },
      {
        id: 'dia',     type: 'polygon' as const, x: -220, y: 60, radius: 55, sides: 4,
        fill: { type: 'solid' as const, color: '#84cc16' },
        border: { color: '#bef264', width: 2 }, label: { text: 'diamond' },
      },
      {
        id: 'pent',    type: 'polygon' as const, x: 0,    y: 60, radius: 55, sides: 5, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#f97316' },
        border: { color: '#fdba74', width: 2 }, label: { text: 'pentagon' },
      },
      {
        id: 'hex',     type: 'polygon' as const, x: 220,  y: 60, radius: 55, sides: 6,
        fill: { type: 'solid' as const, color: '#a855f7' },
        border: { color: '#d8b4fe', width: 2 }, label: { text: 'hexagon' },
      },
      {
        id: 'oct',     type: 'polygon' as const, x: 440,  y: 60, radius: 55, sides: 8,
        fill: { type: 'solid' as const, color: '#ec4899' },
        border: { color: '#f9a8d4', width: 2 }, label: { text: 'octagon' },
      },
      // ── Row 3: path shapes ───────────────────────────────────────────────
      {
        id: 'line',    type: 'line' as const, x1: -470, y1: 295, x2: -170, y2: 295,
        border: { color: '#38bdf8', width: 3 }, label: { text: 'line' },
      },
      {
        id: 'abezier', type: 'autoBezier' as const,
        from: { x: -50, y: 278 }, to: { x: 150, y: 318 }, curvature: 60,
        border: { color: '#4ade80', width: 3 }, label: { text: 'auto-bezier' },
      },
      {
        id: 'bezier',  type: 'bezier' as const,
        from: { x: 230, y: 295 }, cp1: { x: 310, y: 255 }, cp2: { x: 390, y: 335 }, to: { x: 470, y: 295 },
        border: { color: '#fb923c', width: 3 }, label: { text: 'bezier' },
      },
    ] as never[]);

    // Stagger durations so pulses ripple at different rates
    const presets: Record<string, { maxRadius: number; duration: number }> = {
      circle:  { maxRadius: 60,  duration: 900  },
      ellipse: { maxRadius: 55,  duration: 1100 },
      rect:    { maxRadius: 60,  duration: 1300 },
      rectR:   { maxRadius: 60,  duration: 1000 },
      star:    { maxRadius: 70,  duration: 800  },
      tri:     { maxRadius: 65,  duration: 1200 },
      dia:     { maxRadius: 65,  duration: 1000 },
      pent:    { maxRadius: 65,  duration: 1100 },
      hex:     { maxRadius: 70,  duration: 1200 },
      oct:     { maxRadius: 65,  duration: 950  },
      line:    { maxRadius: 40,  duration: 1400 },
      abezier: { maxRadius: 40,  duration: 1600 },
      bezier:  { maxRadius: 40,  duration: 1200 },
    };
    for (const [id, opts] of Object.entries(presets)) {
      shapes.animate(id, { pulse: { ...opts, repeat: -1 } });
    }

    // GUI — controls 'hex' live
    const gui = new GUI({ title: 'pulse', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const p = { maxRadius: 70, duration: 1200, color: '', repeat: -1 };

    const restart = () =>
      shapes.animate('hex', {
        pulse: {
          maxRadius: p.maxRadius,
          duration: p.duration,
          color: p.color || undefined,
          repeat: p.repeat,
        },
      });

    gui.add(p, 'maxRadius', 10, 200, 5).name('max radius (px)').onChange(restart);
    gui.add(p, 'duration', 200, 5000, 100).name('duration (ms)').onChange(restart);
    gui.addColor(p, 'color').name('ring color (blank=fill)').onChange(restart);
    gui.add(p, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange(restart);
    gui.add({ stop: () => shapes.stopAnimation('hex', 'pulse') }, 'stop').name('■ Stop (hex)');
    gui.add({ play: restart }, 'play').name('▶ Play (hex)');
  },
};
