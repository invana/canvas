/**
 * Border Glow Animation
 *
 * Oscillates the border stroke width between `minWidth` and `maxWidth` using a
 * sine wave, producing a pulsing glow effect around the shape edge.
 * Demonstrated on all shape types supported by ShapePlugin.
 *
 * Options:
 *   - minWidth  — minimum stroke width in px (default: 1)
 *   - maxWidth  — maximum stroke width in px (default: 6)
 *   - duration  — one oscillation cycle in ms (default: 1000)
 *   - color     — override border color
 *   - repeat    — cycle count before stopping (-1 = infinite)
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ShapePlugin/Animations' };
export default meta;
type Story = StoryObj;

export const BorderGlow: Story = {
  name: 'Border Glow',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#080810' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#16162a', backgroundColor: '#080810', size: 1.5, spacing: 30,
    }));

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    shapes.setData([
      // ── Row 1: solid shapes ──────────────────────────────────────────────
      {
        id: 'circle',  type: 'circle' as const,  x: -440, y: -180, radius: 50,
        fill: { type: 'solid' as const, color: '#1e3a5f' },
        border: { color: '#38bdf8', width: 2 }, label: { text: 'circle' },
      },
      {
        id: 'ellipse', type: 'ellipse' as const, x: -220, y: -180, radiusX: 65, radiusY: 40,
        fill: { type: 'solid' as const, color: '#2d1b69' },
        border: { color: '#a78bfa', width: 2 }, label: { text: 'ellipse' },
      },
      {
        id: 'rect',    type: 'rect' as const,    x: 0,    y: -180, width: 100, height: 80,
        fill: { type: 'solid' as const, color: '#064e3b' },
        border: { color: '#34d399', width: 2 }, label: { text: 'rect' },
      },
      {
        id: 'rectR',   type: 'rect' as const,    x: 220,  y: -180, width: 100, height: 80, cornerRadius: 20,
        fill: { type: 'solid' as const, color: '#451a03' },
        border: { color: '#fb923c', width: 2 }, label: { text: 'rounded rect' },
      },
      {
        id: 'star',    type: 'star' as const,    x: 440,  y: -180, radius: 55, points: 5,
        fill: { type: 'solid' as const, color: '#4a1942' },
        border: { color: '#f472b6', width: 2 }, label: { text: 'star' },
      },
      // ── Row 2: polygon shapes ────────────────────────────────────────────
      {
        id: 'tri',     type: 'polygon' as const, x: -440, y: 60, radius: 55, sides: 3, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#0c3547' },
        border: { color: '#22d3ee', width: 2 }, label: { text: 'triangle' },
      },
      {
        id: 'dia',     type: 'polygon' as const, x: -220, y: 60, radius: 55, sides: 4,
        fill: { type: 'solid' as const, color: '#1a2e05' },
        border: { color: '#a3e635', width: 2 }, label: { text: 'diamond' },
      },
      {
        id: 'pent',    type: 'polygon' as const, x: 0,    y: 60, radius: 55, sides: 5, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#431407' },
        border: { color: '#fdba74', width: 2 }, label: { text: 'pentagon' },
      },
      {
        id: 'hex',     type: 'polygon' as const, x: 220,  y: 60, radius: 55, sides: 6,
        fill: { type: 'solid' as const, color: '#2e1065' },
        border: { color: '#c084fc', width: 2 }, label: { text: 'hexagon' },
      },
      {
        id: 'oct',     type: 'polygon' as const, x: 440,  y: 60, radius: 55, sides: 8,
        fill: { type: 'solid' as const, color: '#500724' },
        border: { color: '#fb7185', width: 2 }, label: { text: 'octagon' },
      },
      // ── Row 3: path shapes ───────────────────────────────────────────────
      {
        id: 'line',    type: 'line' as const, x1: -470, y1: 295, x2: -170, y2: 295,
        border: { color: '#67e8f9', width: 3 }, label: { text: 'line' },
      },
      {
        id: 'abezier', type: 'autoBezier' as const,
        from: { x: -50, y: 278 }, to: { x: 150, y: 318 }, curvature: 60,
        border: { color: '#86efac', width: 3 }, label: { text: 'auto-bezier' },
      },
      {
        id: 'bezier',  type: 'bezier' as const,
        from: { x: 230, y: 295 }, cp1: { x: 310, y: 255 }, cp2: { x: 390, y: 335 }, to: { x: 470, y: 295 },
        border: { color: '#fca5a5', width: 3 }, label: { text: 'bezier' },
      },
    ] as never[]);

    // Animate all shapes with staggered durations
    const presets: Record<string, { minWidth: number; maxWidth: number; duration: number }> = {
      circle:  { minWidth: 1, maxWidth: 8,  duration: 700  },
      ellipse: { minWidth: 1, maxWidth: 6,  duration: 900  },
      rect:    { minWidth: 1, maxWidth: 10, duration: 1100 },
      rectR:   { minWidth: 1, maxWidth: 7,  duration: 800  },
      star:    { minWidth: 1, maxWidth: 9,  duration: 600  },
      tri:     { minWidth: 1, maxWidth: 8,  duration: 1000 },
      dia:     { minWidth: 1, maxWidth: 6,  duration: 750  },
      pent:    { minWidth: 1, maxWidth: 7,  duration: 850  },
      hex:     { minWidth: 1, maxWidth: 10, duration: 800  },
      oct:     { minWidth: 1, maxWidth: 8,  duration: 950  },
      line:    { minWidth: 1, maxWidth: 6,  duration: 1200 },
      abezier: { minWidth: 1, maxWidth: 6,  duration: 1400 },
      bezier:  { minWidth: 1, maxWidth: 6,  duration: 1000 },
    };
    for (const [id, opts] of Object.entries(presets)) {
      shapes.animate(id, { borderGlow: opts });
    }

    // GUI — controls 'hex' live
    const gui = new GUI({ title: 'borderGlow', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const p = { minWidth: 1, maxWidth: 10, duration: 800, color: '', repeat: -1 };

    const restart = () =>
      shapes.animate('hex', {
        borderGlow: {
          minWidth: p.minWidth,
          maxWidth: p.maxWidth,
          duration: p.duration,
          color: p.color || undefined,
          repeat: p.repeat,
        },
      });

    gui.add(p, 'minWidth', 0.5, 5, 0.5).name('min width (px)').onChange(restart);
    gui.add(p, 'maxWidth', 1, 20, 0.5).name('max width (px)').onChange(restart);
    gui.add(p, 'duration', 100, 4000, 100).name('duration (ms)').onChange(restart);
    gui.addColor(p, 'color').name('color override (blank=spec)').onChange(restart);
    gui.add(p, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange(restart);
    gui.add({ stop: () => shapes.stopAnimation('hex', 'borderGlow') }, 'stop').name('■ Stop (hex)');
    gui.add({ play: restart }, 'play').name('▶ Play (hex)');
  },
};
