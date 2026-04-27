/**
 * Background — Lines
 *
 * Horizontal rule pattern.
 * Toggle followCamera to see lines scroll with the camera.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, DrawingPlugin } from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';
import { drawScatter } from '../_utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: 'canvas/Plugins/Background' };
export default meta;
type Story = StoryObj;

export const BackgroundLines: Story = {
  name: 'Lines',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const bg = new BackgroundPlugin({
      key: 'bg',
      type: 'pattern',
      patternType: 'lines',
      color: '#333355',
      backgroundColor: '#0d0d1a',
      size: 1,
      spacing: 20,
      alpha: 0.7,
      followCamera: false,
    });

    const canvas = new Canvas({ container, backgroundColor: '#0d0d1a' });
    await canvas.init();
    await canvas.plugins.register(bg);

    const draw = new DrawingPlugin({ key: 'draw', zIndex: 10 });
    await canvas.plugins.register(draw);
    drawScatter(draw, container.clientWidth || 800, container.clientHeight || 600);

    const gui = new GUI({ title: 'Background — Lines', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = {
      followCamera: false,
      backgroundColor: '#0d0d1a',
      color: '#333355',
      spacing: 20,
      alpha: 0.7,
    };
    gui.add(params, 'followCamera').name('Follow camera').onChange((v: boolean) => bg.setOptions({ followCamera: v }));
    gui.addColor(params, 'backgroundColor').name('Background').onChange((v: string) => bg.setOptions({ backgroundColor: v }));
    gui.addColor(params, 'color').name('Line colour').onChange((v: string) => bg.setOptions({ color: v }));
    gui.add(params, 'spacing', 5, 80, 5).name('Spacing').onChange((v: number) => bg.setOptions({ spacing: v }));
    gui.add(params, 'alpha', 0, 1, 0.05).name('Alpha').onChange((v: number) => bg.setOptions({ alpha: v }));
  },
};
