/**
 * MarchingAnts animation — animated dash offset
 *
 * Three shapes with animated dashed borders at different speeds.
 * A lil-gui toggle lets you start / stop the animation at runtime.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphPlugin, type CircleNodeSpec, type RectNodeSpec, type DiamondNodeSpec } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Animations/Nodes' };
export default meta;
type Story = StoryObj;

const DARK_BG = '#0f172a';
const GAP = 180;

export const MarchingAnts: Story = {
  name: 'MarchingAnts',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: DARK_BG });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: DARK_BG, size: 1.5, spacing: 30,
    }));

    const elements = new GraphPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    elements.addNode('circle', {
      id: 'ma1', x: -GAP, y: 0, radius: 50, label: 'circle',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 3, dashArray: [8, 6] },
    } as CircleNodeSpec);
    elements.addNode('rect', {
      id: 'ma2', x: 0, y: 0, width: 100, height: 80, label: 'rect',
      style: { fill: '#1f2937', stroke: '#f59e0b', strokeWidth: 3, dashArray: [10, 6] },
    } as RectNodeSpec);
    elements.addNode('diamond', {
      id: 'ma3', x: GAP, y: 0, radius: 55, label: 'diamond',
      style: { fill: '#1a0033', stroke: '#a78bfa', strokeWidth: 3, dashArray: [8, 5] },
    } as DiamondNodeSpec);

    elements.fitContent();

    elements.animate('ma1', { marchingAnts: { speed: 0.3 } });
    elements.animate('ma2', { marchingAnts: { speed: 0.5, color: '#fbbf24' } });
    elements.animate('ma3', { marchingAnts: { speed: 0.8 } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Running').onChange((v: boolean) => {
      ['ma1', 'ma2', 'ma3'].forEach(id => {
        if (v) elements.animate(id, { marchingAnts: { speed: 0.3 } });
        else elements.clearAnimation(id, 'marchingAnts');
      });
    });
  },
};
