/**
 * Background — Grid
 *
 * Tiled grid lines.
 * Toggle followCamera so the grid shifts and zooms with the camera —
 * great for a blueprint / CAD feel.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, DrawingPlugin } from '@invana/canvas';
import { createContainer } from '../../../../../src/div-utils.js';
import { drawScatter } from '../_utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '5. Layers & Overlays/Background' };
export default meta;
type Story = StoryObj;

export const BackgroundGrid: Story = {
  name: 'Grid',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const bg = new BackgroundPlugin({
      key: 'bg',
      type: 'pattern',
      patternType: 'grid',
      color: '#2a2a50',
      backgroundColor: '#12121e',
      size: 1,
      spacing: 40,
      alpha: 0.9,
      followCamera: false,
    });

    const canvas = new Canvas({ container, backgroundColor: '#12121e' });
    await canvas.init();
    await canvas.plugins.register(bg);

    const draw = new DrawingPlugin({ key: 'draw', zIndex: 10 });
    await canvas.plugins.register(draw);
    drawScatter(draw, container.clientWidth || 800, container.clientHeight || 600);

    const gui = new GUI({ title: 'Background — Grid', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = {
      followCamera: false,
      backgroundColor: '#12121e',
      color: '#2a2a50',
      spacing: 40,
      alpha: 0.9,
    };
    gui.add(params, 'followCamera').name('Follow camera').onChange((v: boolean) => bg.setOptions({ followCamera: v }));
    gui.addColor(params, 'backgroundColor').name('Background').onChange((v: string) => bg.setOptions({ backgroundColor: v }));
    gui.addColor(params, 'color').name('Line colour').onChange((v: string) => bg.setOptions({ color: v }));
    gui.add(params, 'spacing', 10, 100, 5).name('Cell size').onChange((v: number) => bg.setOptions({ spacing: v }));
    gui.add(params, 'alpha', 0, 1, 0.05).name('Alpha').onChange((v: number) => bg.setOptions({ alpha: v }));
  },
};
