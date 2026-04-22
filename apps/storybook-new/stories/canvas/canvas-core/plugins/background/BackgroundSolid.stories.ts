/**
 * Background — Solid
 *
 * Simple flat colour fill. No pattern, no tiles.
 * GUI: pick background colour.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, DrawingPlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';
import { drawScatter } from '../_utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/BackgroundPlugin' };
export default meta;
type Story = StoryObj;

export const Solid: Story = {
  name: 'Solid',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const bg = new BackgroundPlugin({ key: 'bg', type: 'solid', backgroundColor: '#1a1a2e' });

    const canvas = new Canvas({ container, backgroundColor: '#1a1a2e' });
    await canvas.init();
    await canvas.plugins.register(bg);

    const draw = new DrawingPlugin({ key: 'draw', zIndex: 10 });
    await canvas.plugins.register(draw);
    drawScatter(draw, container.clientWidth || 800, container.clientHeight || 600);

    const gui = new GUI({ title: 'Background — Solid', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = { backgroundColor: '#1a1a2e' };
    gui.addColor(params, 'backgroundColor').name('Colour').onChange((v: string) => bg.setOptions({ backgroundColor: v }));
  },
};
