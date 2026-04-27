/**
 * Background — Interactive
 *
 * All options in one place. Switch type, pattern, colours, and toggle
 * followCamera to compare fixed vs world-tracking background.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, DrawingPlugin } from '@invana/canvas';
import type { BackgroundType, PatternType } from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';
import { drawScatter } from '../_utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: 'canvas/Plugins/Background' };
export default meta;
type Story = StoryObj;

export const BackgroundInteractive: Story = {
  name: 'Interactive',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const bg = new BackgroundPlugin({
      key: 'bg',
      type: 'pattern',
      patternType: 'dots',
      color: '#595959',
      backgroundColor: '#1a1a2e',
      size: 1.5,
      spacing: 30,
      alpha: 0.6,
      followCamera: false,
    });

    const canvas = new Canvas({ container, backgroundColor: '#1a1a2e' });
    await canvas.init();
    await canvas.plugins.register(bg);

    const draw = new DrawingPlugin({ key: 'draw', zIndex: 10 });
    await canvas.plugins.register(draw);
    drawScatter(draw, container.clientWidth || 800, container.clientHeight || 600);

    const gui = new GUI({ title: 'Background — Interactive', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = {
      type: 'pattern' as BackgroundType,
      patternType: 'dots' as PatternType,
      followCamera: false,
      backgroundColor: '#1a1a2e',
      color: '#595959',
      size: 1.5,
      spacing: 30,
      alpha: 0.6,
    };

    gui.add(params, 'type', ['solid', 'pattern']).name('Type').onChange((v: BackgroundType) => bg.setOptions({ type: v }));
    gui.add(params, 'patternType', ['dots', 'grid', 'lines']).name('Pattern').onChange((v: PatternType) => bg.setOptions({ patternType: v }));
    gui.add(params, 'followCamera').name('Follow camera').onChange((v: boolean) => bg.setOptions({ followCamera: v }));
    gui.addColor(params, 'backgroundColor').name('Background').onChange((v: string) => bg.setOptions({ backgroundColor: v }));
    gui.addColor(params, 'color').name('Pattern colour').onChange((v: string) => bg.setOptions({ color: v }));
    gui.add(params, 'size', 0.5, 8, 0.5).name('Size').onChange((v: number) => bg.setOptions({ size: v }));
    gui.add(params, 'spacing', 5, 100, 2).name('Spacing').onChange((v: number) => bg.setOptions({ spacing: v }));
    gui.add(params, 'alpha', 0, 1, 0.05).name('Alpha').onChange((v: number) => bg.setOptions({ alpha: v }));
  },
};
