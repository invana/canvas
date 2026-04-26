/**
 * Node Styles — Shape
 *
 * Every supported shape type, plus variant explorations:
 *   - Closed solids (circle, ellipse, rect, polygon, star)
 *   - Rectangle corner radii
 *   - Polygon sides (3 → 8)
 *   - Star points and inner-ratio
 *   - Shape rotations
 *   - Dashed / dotted variants
 *   - Effect shapes (circleGlow, rippleRing)
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas-core-new';
import type { ShapeSpec } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Shape' };
export default meta;
type Story = StoryObj;

const wb = { color: '#ffffff', width: 1.5, alpha: 0.5 };
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const c = (i: number) => COLORS[i % COLORS.length] as string;

function lbl(id: string, x: number, y: number, text: string): ShapeSpec {
  return { id, type: 'label', x, y, text, color: '#888', fontSize: 9 } as ShapeSpec;
}

export const AllShapes: Story = {
  name: 'All Shapes',
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
    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);
    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    const GAP = 150;
    const R = 45;

    // Row 1: Closed solids
    const row1: ShapeSpec[] = [
      { id: 'circle',  type: 'circle',  x: -3 * GAP, y: -200, radius: R, fill: { type: 'solid', color: c(0) }, border: wb },
      { id: 'ellipse', type: 'ellipse', x: -2 * GAP, y: -200, radiusX: R + 20, radiusY: R - 15, fill: { type: 'solid', color: c(1) }, border: wb },
      { id: 'rect',    type: 'rect',    x: -1 * GAP - 45, y: -200 - 40, width: 90, height: 80, fill: { type: 'solid', color: c(2) }, border: wb },
      { id: 'hex',     type: 'polygon', x: 0, y: -200, radius: R, sides: 6, fill: { type: 'solid', color: c(3) }, border: wb },
      { id: 'star5',   type: 'star',    x: 1 * GAP, y: -200, radius: R, fill: { type: 'solid', color: c(4) }, border: wb },
      { id: 'tri',     type: 'polygon', x: 2 * GAP, y: -200, radius: R, sides: 3, fill: { type: 'solid', color: c(5) }, border: wb },
      { id: 'oct',     type: 'polygon', x: 3 * GAP, y: -200, radius: R, sides: 8, fill: { type: 'solid', color: c(6) }, border: wb },
    ];
    const row1Labels: ShapeSpec[] = [
      lbl('l1a', -3 * GAP, -200 + R + 14, 'circle'),
      lbl('l1b', -2 * GAP, -200 + R + 14, 'ellipse'),
      lbl('l1c', -1 * GAP, -200 + 40 + 14, 'rect'),
      lbl('l1d', 0, -200 + R + 14, 'polygon (6)'),
      lbl('l1e', 1 * GAP, -200 + R + 14, 'star (5)'),
      lbl('l1f', 2 * GAP, -200 + R + 14, 'polygon (3)'),
      lbl('l1g', 3 * GAP, -200 + R + 14, 'polygon (8)'),
    ];

    // Row 2: Rect corner radii
    const corners = [0, 5, 10, 15, 25, 45];
    const row2: ShapeSpec[] = corners.flatMap((r, i) => [
      { id: `cr-${i}`, type: 'rect', x: -2.5 * GAP + i * GAP - 40, y: -50 - 40, width: 80, height: 80, cornerRadius: r, fill: { type: 'solid', color: c(i) }, border: wb } as ShapeSpec,
      lbl(`crl-${i}`, -2.5 * GAP + i * GAP, -50 + 40 + 14, `r=${r}`),
    ]);

    // Row 3: Polygon sides 3–9
    const sides = [3, 4, 5, 6, 7, 8, 9];
    const row3: ShapeSpec[] = sides.flatMap((s, i) => [
      { id: `poly-${s}`, type: 'polygon', x: -3 * GAP + i * GAP, y: 120, radius: R, sides: s, fill: { type: 'solid', color: c(i) }, border: wb } as ShapeSpec,
      lbl(`poly-lbl-${s}`, -3 * GAP + i * GAP, 120 + R + 14, `${s} sides`),
    ]);

    // Row 4: Stars — points & inner ratio
    const starVariants = [
      { points: 3, innerRatio: 0.4 },
      { points: 4, innerRatio: 0.4 },
      { points: 5, innerRatio: 0.4 },
      { points: 5, innerRatio: 0.6 },
      { points: 5, innerRatio: 0.8 },
      { points: 6, innerRatio: 0.4 },
      { points: 8, innerRatio: 0.4 },
    ];
    const row4: ShapeSpec[] = starVariants.flatMap(({ points, innerRatio }, i) => [
      { id: `star-${i}`, type: 'star', x: -3 * GAP + i * GAP, y: 280, radius: R, points, innerRatio, fill: { type: 'solid', color: c(i) }, border: wb } as ShapeSpec,
      lbl(`star-lbl-${i}`, -3 * GAP + i * GAP, 280 + R + 14, `${points}pt r=${innerRatio}`),
    ]);

    // Row 5: Rotations (polygon)
    const rotations = [0, 30, 60, 90, 120, 150, 180];
    const row5: ShapeSpec[] = rotations.flatMap((rot, i) => [
      { id: `rot-${i}`, type: 'polygon', x: -3 * GAP + i * GAP, y: 440, radius: R, sides: 4, rotation: rot, fill: { type: 'solid', color: c(i) }, border: wb } as ShapeSpec,
      lbl(`rot-lbl-${i}`, -3 * GAP + i * GAP, 440 + R + 14, `${rot}°`),
    ]);

    // Row 6: Dashed / dotted variants
    const dashRow: ShapeSpec[] = [
      { id: 'dashed-c', type: 'dashedCircle', x: -3 * GAP, y: 600, radius: R, fill: { type: 'solid', color: c(0) }, border: { color: '#60a5fa', width: 2, alpha: 0.9 } },
      { id: 'dotted-c', type: 'dottedCircle', x: -2 * GAP, y: 600, radius: R, fill: { type: 'solid', color: c(1) }, border: { color: '#34d399', width: 2, alpha: 0.9 } },
      { id: 'dashed-r', type: 'dashedRect', x: -1 * GAP - 40, y: 600 - 40, width: 80, height: 80, fill: { type: 'solid', color: c(2) }, border: { color: '#fbbf24', width: 2, alpha: 0.9 } },
      { id: 'dotted-r', type: 'dottedRect', x: 0 - 40, y: 600 - 40, width: 80, height: 80, fill: { type: 'solid', color: c(3) }, border: { color: '#f87171', width: 2, alpha: 0.9 } },
      { id: 'glow-c', type: 'circleGlow', x: 1 * GAP, y: 600, radius: R, fill: { type: 'solid', color: c(4) } },
      { id: 'ripple-c', type: 'rippleRing', x: 2 * GAP, y: 600, radius: R, fill: { type: 'solid', color: c(5) } },
    ];
    const dashLabels: ShapeSpec[] = [
      lbl('dl1', -3 * GAP, 600 + R + 14, 'dashedCircle'),
      lbl('dl2', -2 * GAP, 600 + R + 14, 'dottedCircle'),
      lbl('dl3', -1 * GAP, 600 + 40 + 14, 'dashedRect'),
      lbl('dl4', 0, 600 + 40 + 14, 'dottedRect'),
      lbl('dl5', 1 * GAP, 600 + R + 14, 'circleGlow'),
      lbl('dl6', 2 * GAP, 600 + R + 14, 'rippleRing'),
    ];

    shapes.setData([
      ...row1, ...row1Labels,
      ...row2,
      ...row3,
      ...row4,
      ...row5,
      ...dashRow, ...dashLabels,
    ]);

    const gui = new GUI({ title: 'Node Shapes', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = { devInfo: true };
    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
