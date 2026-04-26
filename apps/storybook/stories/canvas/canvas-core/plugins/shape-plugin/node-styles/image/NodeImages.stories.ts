/**
 * Node Styles — Image / Texture Fill
 *
 * Demonstrates texture fills via ShapePlugin.registerTexture() using
 * inline SVG pattern data-URLs. Every shape type is shown with each texture.
 * GUI alpha + scale controls update all shapes simultaneously.
 *
 * Textures: grid · stripes · checkers · dots · waves · diamonds
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Image' };
export default meta;
type Story = StoryObj;

// ── Inline SVG pattern textures as data-URLs ──────────────────────────────────
const svgToUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const TEXTURES: Record<string, string> = {
  grid: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#1e3a5f"/><path d="M0 0h32M0 16h32M0 32h32M0 0v32M16 0v32M32 0v32" stroke="#38bdf8" stroke-width="0.75" fill="none"/></svg>`),
  stripes: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#1a2e1a"/><path d="M0 0l32 32M-8 0l32 32M8 0l32 32M-16 0l32 32M16 0l32 32" stroke="#4ade80" stroke-width="3" fill="none"/></svg>`),
  checkers: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#1c1c2e"/><rect x="0" y="0" width="16" height="16" fill="#7c3aed"/><rect x="16" y="16" width="16" height="16" fill="#7c3aed"/></svg>`),
  dots: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="#1a1a2e"/><circle cx="12" cy="12" r="4" fill="#f59e0b"/><circle cx="0" cy="0" r="2.5" fill="#f59e0b"/><circle cx="24" cy="0" r="2.5" fill="#f59e0b"/><circle cx="0" cy="24" r="2.5" fill="#f59e0b"/><circle cx="24" cy="24" r="2.5" fill="#f59e0b"/></svg>`),
  waves: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="#1e1b4b"/><path d="M0 10 Q10 0 20 10 Q30 20 40 10" stroke="#818cf8" stroke-width="2.5" fill="none"/><path d="M0 20 Q10 10 20 20 Q30 30 40 20" stroke="#818cf8" stroke-width="2.5" fill="none"/><path d="M0 0 Q10 -10 20 0 Q30 10 40 0" stroke="#818cf8" stroke-width="2.5" fill="none"/></svg>`),
  diamonds: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#2d1515"/><path d="M16 2l14 14-14 14L2 16z" stroke="#f87171" stroke-width="1.5" fill="#3d1515"/><circle cx="16" cy="16" r="2.5" fill="#f87171"/></svg>`),
};

const TEXTURE_KEYS = Object.keys(TEXTURES);
const SHAPE_COLORS = ['#38bdf8', '#4ade80', '#a78bfa', '#fbbf24', '#818cf8', '#f87171'];
const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const R = 42;

function buildTextureNode(rowId: string, si: number, x: number, y: number, textureKey: string, alpha: number): ShapeSpec {
  const fill = { type: 'texture' as const, src: textureKey, alpha };
  const border = { color: SHAPE_COLORS[si]!, width: 1.5, alpha: 0.7 };
  switch (si) {
    case 0: return { id: `${rowId}-circle`,  type: 'circle',  x, y, radius: R, fill, border };
    case 1: return { id: `${rowId}-ellipse`, type: 'ellipse', x, y, radiusX: R + 14, radiusY: R - 12, fill, border };
    case 2: return { id: `${rowId}-rect`,    type: 'rect',    x: x - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, fill, border };
    case 3: return { id: `${rowId}-hex`,     type: 'polygon', x, y, radius: R, sides: 6, fill, border };
    case 4: return { id: `${rowId}-star`,    type: 'star',    x, y, radius: R, fill, border };
    default: return { id: `${rowId}-tri`,    type: 'polygon', x, y, radius: R, sides: 3, fill, border };
  }
}

function shapeIds(rowId: string): string[] {
  return ['circle', 'ellipse', 'rect', 'hex', 'star', 'tri'].map(t => `${rowId}-${t}`);
}

export const NodeImages: Story = {
  name: 'Node Image / Texture Fill',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // Register all textures before canvas init
    await Promise.all(TEXTURE_KEYS.map(key => ShapePlugin.registerTexture(key, TEXTURES[key]!)));

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

    const ROW_GAP = 140;
    const startY = -(TEXTURE_KEYS.length - 1) / 2 * ROW_GAP;

    const colHeaders: ShapeSpec[] = ['Circle', 'Ellipse', 'Rect', 'Hexagon', 'Star', 'Triangle'].map((lbl, si) => ({
      id: `imgchdr-${si}`, type: 'label', x: startX + si * GAP, y: startY - 100, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));

    const rowHeaders: ShapeSpec[] = TEXTURE_KEYS.map((key, ri) => ({
      id: `imgrhdr-${ri}`, type: 'label', x: startX - 110, y: startY + ri * ROW_GAP,
      text: key.charAt(0).toUpperCase() + key.slice(1), color: '#555', fontSize: 10,
    } as ShapeSpec));

    const allNodes: ShapeSpec[] = TEXTURE_KEYS.flatMap((textureKey, ri) =>
      Array.from({ length: N }, (_, si) =>
        buildTextureNode(textureKey, si, startX + si * GAP, startY + ri * ROW_GAP, textureKey, 1)
      )
    );

    shapes.setData([...colHeaders, ...rowHeaders, ...allNodes]);

    const gui = new GUI({ title: 'Node Images', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = {
      alpha: 1.0,
      borderWidth: 1.5,
      borderAlpha: 0.7,
      devInfo: true,
    };

    const applyToAll = () => {
      TEXTURE_KEYS.forEach(textureKey => {
        shapeIds(textureKey).forEach((id, si) => {
          shapes.update(id, {
            fill: { type: 'texture', src: textureKey, alpha: state.alpha },
            border: { color: SHAPE_COLORS[si]!, width: state.borderWidth, alpha: state.borderAlpha },
          });
        });
      });
    };

    const lf = gui.addFolder('Live Controls (all textures)');
    lf.add(state, 'alpha', 0, 1, 0.05).name('Texture alpha').onChange(applyToAll);
    lf.add(state, 'borderWidth', 0, 8, 0.5).name('Border width').onChange(applyToAll);
    lf.add(state, 'borderAlpha', 0, 1, 0.05).name('Border alpha').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
