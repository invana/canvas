/**
 * FadeIn Animation
 *
 * Fades the shape from a starting alpha up to full opacity using wall-clock
 * elapsed time, so it is unaffected by frame-rate spikes.
 * Demonstrated on all shape types supported by ShapePlugin.
 *
 * Options:
 *   - duration  — total fade time in ms
 *   - from      — starting alpha (0 = invisible, 1 = no effect)
 *   - repeat    — replay count before stopping (-1 = infinite loop)
 *
 * Use the "▶ Replay all" button to restart the animation at any time.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas';
import { createContainer } from '../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '7. Animations/Nodes & Edges' };
export default meta;
type Story = StoryObj;

const ALL_IDS = ['circle', 'ellipse', 'rect', 'rectR', 'star', 'tri', 'dia', 'pent', 'hex', 'oct', 'line', 'abezier', 'bezier'];

export const FadeIn: Story = {
  name: 'Fade In',
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

    // Stagger durations so shapes finish at different times
    const durations: Record<string, number> = {
      circle: 400,  ellipse: 600,  rect: 800,   rectR: 1000, star: 1200,
      tri:   1400,  dia:    1600,  pent: 1800,  hex:   2000, oct:  2200,
      line:  1000,  abezier: 1400, bezier: 1800,
    };

    const playAll = () => {
      for (const id of ALL_IDS) {
        shapes.stopAnimation(id, 'fadeIn');
        shapes.animate(id, { fadeIn: { duration: durations[id]!, from: 0, repeat: 1 } });
      }
    };
    playAll();

    // GUI — controls 'hex' only
    const gui = new GUI({ title: 'fadeIn', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const p = { duration: 2000, from: 0, repeat: 1 };

    const replayHex = () => {
      shapes.stopAnimation('hex', 'fadeIn');
      shapes.animate('hex', { fadeIn: { duration: p.duration, from: p.from, repeat: p.repeat } });
    };

    gui.add(p, 'duration', 100, 5000, 100).name('duration (ms)').onChange(replayHex);
    gui.add(p, 'from', 0, 0.9, 0.05).name('start alpha').onChange(replayHex);
    gui.add(p, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange(replayHex);
    gui.add({ replayAll: playAll }, 'replayAll').name('▶ Replay all');
    gui.add({ replayHex }, 'replayHex').name('▶ Replay "hexagon"');
  },
};
