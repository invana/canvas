/**
 * Node Styles — Image / Texture Fill
 *
 * Demonstrates texture fills via ShapePlugin.registerTexture() using
 * inline SVG pattern data-URLs. Every shape type is shown with each texture.
 * GUI alpha + scale controls update all shapes simultaneously.
 *
 * Textures: grid · stripes · checkers · dots · waves · diamonds
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';
import { TEXTURES } from './textures.js';

const meta: Meta = { title: '2. Node Styles / Image' };
export default meta;
type Story = StoryObj;

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
    const devInfo = new DevInfoPlugin({ key: 'dev-info', enabled: false });
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
      textureAlpha: 1.0,
      borderWidth: 1.5,
      borderAlpha: 0.7,
      dashed: false,
      dashLength: 8,
      dashGap: 4,
      devInfo: false,
    };

    const applyToAll = () => {
      TEXTURE_KEYS.forEach(textureKey => {
        shapeIds(textureKey).forEach((id, si) => {
          shapes.update(id, {
            fill: { type: 'texture', src: textureKey, alpha: state.textureAlpha },
            border: {
              color: SHAPE_COLORS[si]!,
              width: state.borderWidth,
              alpha: state.borderAlpha,
              ...(state.dashed ? { dash: { length: state.dashLength, gap: state.dashGap } } : {}),
            },
          });
        });
      });
    };

    const tf = gui.addFolder('Texture');
    tf.add(state, 'textureAlpha', 0, 1, 0.05).name('Alpha').onChange(applyToAll);
    const bf = gui.addFolder('Border');
    bf.add(state, 'borderWidth', 0, 8, 0.5).name('Width').onChange(applyToAll);
    bf.add(state, 'borderAlpha', 0, 1, 0.05).name('Alpha').onChange(applyToAll);
    bf.add(state, 'dashed').name('Dashed').onChange(applyToAll);
    bf.add(state, 'dashLength', 1, 30, 1).name('Dash length').onChange(applyToAll);
    bf.add(state, 'dashGap', 1, 20, 1).name('Dash gap').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
