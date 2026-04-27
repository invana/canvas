/**
 * Dashed Flow Animation
 *
 * Flows dashes along the border in one direction by continuously advancing the
 * dash offset, giving a "data-flow" or "current" visual metaphor.
 * Demonstrated on all shape types supported by ShapePlugin — all shapes carry
 * a `border.dash` spec so the flowing dashes are visible.
 *
 * Options:
 *   - speed      — dash offset increment per frame
 *   - direction  — `1` = forward along path, `-1` = reverse
 *   - color      — override border color
 *   - repeat     — loop count before stopping (-1 = infinite)
 *
 * Requires a `border.dash` spec on the shape to be visible.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas';
import { createContainer } from '../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '7. Animations/Nodes & Edges' };
export default meta;
type Story = StoryObj;

export const DashedFlow: Story = {
  name: 'Dashed Flow',
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

    const dash = { length: 14, gap: 7 };

    shapes.setData([
      // ── Row 1: solid shapes (forward flow) ──────────────────────────────
      {
        id: 'circle',  type: 'circle' as const,  x: -440, y: -180, radius: 50,
        fill: { type: 'solid' as const, color: '#1e293b' },
        border: { color: '#38bdf8', width: 2.5, dash }, label: { text: 'circle' },
      },
      {
        id: 'ellipse', type: 'ellipse' as const, x: -220, y: -180, radiusX: 65, radiusY: 40,
        fill: { type: 'solid' as const, color: '#1e1e2e' },
        border: { color: '#a78bfa', width: 2.5, dash }, label: { text: 'ellipse' },
      },
      {
        id: 'rect',    type: 'rect' as const,    x: 0,    y: -180, width: 100, height: 80,
        fill: { type: 'solid' as const, color: '#1e293b' },
        border: { color: '#34d399', width: 2.5, dash }, label: { text: 'rect' },
      },
      {
        id: 'rectR',   type: 'rect' as const,    x: 220,  y: -180, width: 100, height: 80, cornerRadius: 20,
        fill: { type: 'solid' as const, color: '#1c1917' },
        border: { color: '#fb923c', width: 2.5, dash }, label: { text: 'rounded rect' },
      },
      {
        id: 'star',    type: 'star' as const,    x: 440,  y: -180, radius: 55, points: 5,
        fill: { type: 'solid' as const, color: '#1a1a2e' },
        border: { color: '#f472b6', width: 2.5, dash }, label: { text: 'star' },
      },
      // ── Row 2: polygon shapes (reverse flow) ────────────────────────────
      {
        id: 'tri',     type: 'polygon' as const, x: -440, y: 60, radius: 55, sides: 3, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#0c1a2e' },
        border: { color: '#22d3ee', width: 2.5, dash }, label: { text: 'triangle' },
      },
      {
        id: 'dia',     type: 'polygon' as const, x: -220, y: 60, radius: 55, sides: 4,
        fill: { type: 'solid' as const, color: '#0a1a0a' },
        border: { color: '#a3e635', width: 2.5, dash }, label: { text: 'diamond' },
      },
      {
        id: 'pent',    type: 'polygon' as const, x: 0,    y: 60, radius: 55, sides: 5, rotation: -Math.PI / 2,
        fill: { type: 'solid' as const, color: '#1c0a00' },
        border: { color: '#fdba74', width: 2.5, dash }, label: { text: 'pentagon' },
      },
      {
        id: 'hex',     type: 'polygon' as const, x: 220,  y: 60, radius: 55, sides: 6,
        fill: { type: 'solid' as const, color: '#160a2e' },
        border: { color: '#c084fc', width: 2.5, dash }, label: { text: 'hexagon' },
      },
      {
        id: 'oct',     type: 'polygon' as const, x: 440,  y: 60, radius: 55, sides: 8,
        fill: { type: 'solid' as const, color: '#1c0a14' },
        border: { color: '#fb7185', width: 2.5, dash }, label: { text: 'octagon' },
      },
      // ── Row 3: path shapes ───────────────────────────────────────────────
      {
        id: 'line',    type: 'line' as const, x1: -470, y1: 295, x2: -170, y2: 295,
        border: { color: '#67e8f9', width: 3, dash }, label: { text: 'line' },
      },
      {
        id: 'abezier', type: 'autoBezier' as const,
        from: { x: -50, y: 278 }, to: { x: 150, y: 318 }, curvature: 60,
        border: { color: '#86efac', width: 3, dash }, label: { text: 'auto-bezier' },
      },
      {
        id: 'bezier',  type: 'bezier' as const,
        from: { x: 230, y: 295 }, cp1: { x: 310, y: 255 }, cp2: { x: 390, y: 335 }, to: { x: 470, y: 295 },
        border: { color: '#fca5a5', width: 3, dash }, label: { text: 'bezier' },
      },
    ] as never[]);

    // Row 1 & paths: forward flow; Row 2: reverse flow
    const fwdIds = ['circle', 'ellipse', 'rect', 'rectR', 'star', 'line', 'abezier', 'bezier'];
    const revIds = ['tri', 'dia', 'pent', 'hex', 'oct'];

    for (const id of fwdIds) shapes.animate(id, { dashedFlow: { speed: 2, direction:  1 } });
    for (const id of revIds) shapes.animate(id, { dashedFlow: { speed: 2, direction: -1 } });

    const gui = new GUI({ title: 'dashedFlow', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const p = { speed: 2, color: '' };

    const restart = () => {
      for (const id of fwdIds) shapes.animate(id, { dashedFlow: { speed: p.speed, direction:  1, color: p.color || undefined } });
      for (const id of revIds) shapes.animate(id, { dashedFlow: { speed: p.speed, direction: -1, color: p.color || undefined } });
    };

    gui.add(p, 'speed', 0.1, 10, 0.1).onChange(restart);
    gui.addColor(p, 'color').name('color override (blank=spec)').onChange(restart);
    gui.add({ stop: () => { for (const id of [...fwdIds, ...revIds]) shapes.stopAnimation(id, 'dashedFlow'); } }, 'stop').name('■ Stop all');
    gui.add({ play: restart }, 'play').name('▶ Play all');
  },
};
