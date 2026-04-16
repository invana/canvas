/**
 * Background — Dots
 *
 * Tiled dot pattern.
 * Toggle followCamera to see the dots scroll & scale with the camera.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, DrawingPlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../../src/div-utils.js';
import { drawScatter } from './_utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/BackgroundPlugin' };
export default meta;
type Story = StoryObj;

export const Dots: Story = {
  name: 'Dots',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const bg = new BackgroundPlugin({
      key: 'bg',
      type: 'pattern',
      patternType: 'dots',
      color: '#4a4a6a',
      backgroundColor: '#1a1a2e',
      size: 2,
      spacing: 28,
      alpha: 0.8,
      followCamera: false,
    });

    const canvas = new Canvas({ container, backgroundColor: '#1a1a2e' });
    await canvas.init();
    await canvas.plugins.register(bg);

    const draw = new DrawingPlugin({ key: 'draw', zIndex: 10 });
    await canvas.plugins.register(draw);
    drawScatter(draw, container.clientWidth || 800, container.clientHeight || 600);

    const gui = new GUI({ title: 'Background — Dots', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = {
      followCamera: false,
      backgroundColor: '#1a1a2e',
      color: '#4a4a6a',
      size: 2,
      spacing: 28,
      alpha: 0.8,
    };
    gui.add(params, 'followCamera').name('Follow camera').onChange((v: boolean) => bg.setOptions({ followCamera: v }));
    gui.addColor(params, 'backgroundColor').name('Background').onChange((v: string) => bg.setOptions({ backgroundColor: v }));
    gui.addColor(params, 'color').name('Dot colour').onChange((v: string) => bg.setOptions({ color: v }));
    gui.add(params, 'size', 0.5, 8, 0.5).name('Dot size').onChange((v: number) => bg.setOptions({ size: v }));
    gui.add(params, 'spacing', 10, 80, 2).name('Spacing').onChange((v: number) => bg.setOptions({ spacing: v }));
    gui.add(params, 'alpha', 0, 1, 0.05).name('Alpha').onChange((v: number) => bg.setOptions({ alpha: v }));
  },
};
