/**
 * ColorCycle Animation
 *
 * Transitions the shape fill through a user-defined palette of colors.
 * The active color is written to `_animOverrides.colorOverride` and applied
 * via the standard `ShapeObject.draw()` path — no extra draw logic required.
 * Demonstrated on all shape types supported by ShapePlugin.
 *
 * Options:
 *   - colors    — ordered array of hex colors to cycle through
 *   - duration  — ms per color step
 *   - repeat    — full-palette cycle count before stopping (-1 = infinite)
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ShapePlugin/Animations' };
export default meta;
type Story = StoryObj;

const PALETTES: Record<string, string[]> = {
  neon:    ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#e879f9'],
  ocean:   ['#0ea5e9', '#06b6d4', '#14b8a6', '#34d399', '#60a5fa'],
  sunset:  ['#f97316', '#f59e0b', '#eab308', '#dc2626', '#be185d'],
  cool:    ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
};

const ALL_IDS = ['circle', 'ellipse', 'rect', 'rectR', 'star', 'tri', 'dia', 'pent', 'hex', 'oct', 'line', 'abezier', 'bezier'];

export const ColorCycle: Story = {
  name: 'Color Cycle',
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
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'circle' },
      },
      {
        id: 'ellipse', type: 'ellipse' as const, x: -220, y: -180, radiusX: 65, radiusY: 40,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'ellipse' },
      },
      {
        id: 'rect',    type: 'rect' as const,    x: 0,    y: -180, width: 100, height: 80,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'rect' },
      },
      {
        id: 'rectR',   type: 'rect' as const,    x: 220,  y: -180, width: 100, height: 80, cornerRadius: 20,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'rounded rect' },
      },
      {
        id: 'star',    type: 'star' as const,    x: 440,  y: -180, radius: 55, points: 5,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'star' },
      },
      // ── Row 2: polygon shapes ────────────────────────────────────────────
      {
        id: 'tri',     type: 'polygon' as const, x: -440, y: 60, radius: 55, sides: 3, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'triangle' },
      },
      {
        id: 'dia',     type: 'polygon' as const, x: -220, y: 60, radius: 55, sides: 4,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'diamond' },
      },
      {
        id: 'pent',    type: 'polygon' as const, x: 0,    y: 60, radius: 55, sides: 5, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'pentagon' },
      },
      {
        id: 'hex',     type: 'polygon' as const, x: 220,  y: 60, radius: 55, sides: 6,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'hexagon' },
      },
      {
        id: 'oct',     type: 'polygon' as const, x: 440,  y: 60, radius: 55, sides: 8,
        fill: { type: 'solid' as const, color: '#f43f5e' },
        border: { color: '#ffffff', width: 1.5, alpha: 0.3 }, label: { text: 'octagon' },
      },
      // ── Row 3: path shapes (border color cycles) ─────────────────────────
      {
        id: 'line',    type: 'line' as const, x1: -470, y1: 295, x2: -170, y2: 295,
        border: { color: '#f43f5e', width: 3 }, label: { text: 'line' },
      },
      {
        id: 'abezier', type: 'autoBezier' as const,
        from: { x: -50, y: 278 }, to: { x: 150, y: 318 }, curvature: 60,
        border: { color: '#f43f5e', width: 3 }, label: { text: 'auto-bezier' },
      },
      {
        id: 'bezier',  type: 'bezier' as const,
        from: { x: 230, y: 295 }, cp1: { x: 310, y: 255 }, cp2: { x: 390, y: 335 }, to: { x: 470, y: 295 },
        border: { color: '#f43f5e', width: 3 }, label: { text: 'bezier' },
      },
    ] as never[]);

    const start = (palette: string[], duration: number, repeat: number) => {
      for (const id of ALL_IDS) {
        shapes.animate(id, { colorCycle: { colors: palette, duration, repeat } });
      }
    };

    start(PALETTES.neon, 600, -1);

    const gui = new GUI({ title: 'colorCycle', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const p = { palette: 'neon', duration: 600, repeat: -1 };

    const restart = () => start(PALETTES[p.palette]!, p.duration, p.repeat);

    gui.add(p, 'palette', Object.keys(PALETTES)).onChange(restart);
    gui.add(p, 'duration', 100, 3000, 50).name('duration per step (ms)').onChange(restart);
    gui.add(p, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange(restart);
    gui.add({ stop: () => { for (const id of ALL_IDS) shapes.stopAnimation(id, 'colorCycle'); } }, 'stop').name('■ Stop all');
    gui.add({ play: restart }, 'play').name('▶ Play all');
  },
};
