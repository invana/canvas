/**
 * DashedFlow animation — animated dash offset with directional control
 *
 * Two circles with dashed borders flowing in opposite directions.
 * A lil-gui toggle lets you start / stop the animation at runtime.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphPlugin, type CircleNodeSpec } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Animations/Nodes' };
export default meta;
type Story = StoryObj;

const DARK_BG = '#0f172a';
const GAP = 180;

export const DashedFlow: Story = {
  name: 'DashedFlow',
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
      id: 'df1', x: -GAP, y: 0, radius: 50, label: 'forward',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 3, dashArray: [8, 6] },
    } as CircleNodeSpec);
    elements.addNode('circle', {
      id: 'df2', x: GAP, y: 0, radius: 50, label: 'reverse',
      style: { fill: '#1e3a5f', stroke: '#f472b6', strokeWidth: 3, dashArray: [8, 6] },
    } as CircleNodeSpec);

    elements.fitContent();

    elements.animate('df1', { dashedFlow: { speed: 0.4, direction: 1 } });
    elements.animate('df2', { dashedFlow: { speed: 0.4, direction: -1 } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Running').onChange((v: boolean) => {
      if (v) {
        elements.animate('df1', { dashedFlow: { speed: 0.4, direction: 1 } });
        elements.animate('df2', { dashedFlow: { speed: 0.4, direction: -1 } });
      } else {
        elements.clearAnimation('df1', 'dashedFlow');
        elements.clearAnimation('df2', 'dashedFlow');
      }
    });
  },
};
