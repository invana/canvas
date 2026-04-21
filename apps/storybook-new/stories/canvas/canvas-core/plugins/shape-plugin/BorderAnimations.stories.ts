/**
 * ShapePlugin — Border Animations
 *
 * Demonstrates border/outline animation types:
 *   - marchingAnts  — animated dashes marching around the border
 *   - dashedFlow    — flow-direction dashes along the border
 *   - borderGlow    — pulsing glow around the border
 *
 * Use the GUI to play/pause each animation independently.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ShapePlugin' };
export default meta;
type Story = StoryObj;

export const BorderAnimations: Story = {
  name: 'Border Animations',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#121212' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#333333', backgroundColor: '#121212', size: 1.5, spacing: 28,
    }));

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    shapes.setData([
      {
        id: 'ants', type: 'circle', x: -200, y: 0, radius: 65,
        fill: { type: 'solid', color: '#1e293b' },
        border: { color: '#38bdf8', width: 2.5, dash: { length: 12, gap: 6 } },
        label: { text: 'marchingAnts' },
      },
      {
        id: 'flow', type: 'rect', x: -55, y: -50, width: 140, height: 100,
        fill: { type: 'solid', color: '#1e1e2e' },
        border: { color: '#a78bfa', width: 2.5, dash: { length: 14, gap: 7 } },
        label: { text: 'dashedFlow' },
      },
      {
        id: 'glow', type: 'polygon', x: 200, y: 0, radius: 65, sides: 6,
        fill: { type: 'solid', color: '#1a1a1a' },
        border: { color: '#34d399', width: 2, alpha: 0.9 },
        label: { text: 'borderGlow' },
      },
    ] as never[]);

    // Start animations
    shapes.animate('ants', { marchingAnts: { speed: 1.5 } });
    shapes.animate('flow', { dashedFlow: { speed: 2, direction: 1 } });
    shapes.animate('glow', { borderGlowPulse: { minAlpha: 0.3, maxAlpha: 1.0, speed: 2 } });

    // GUI
    const gui = new GUI({ title: 'Border Animations', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = {
      marchingAnts: true,
      dashedFlow: true,
      borderGlow: true,
      antsSpeed: 1.5,
      flowSpeed: 2,
      glowSpeed: 2,
    };

    const antsFolder = gui.addFolder('marchingAnts');
    antsFolder.add(params, 'marchingAnts').name('active').onChange((v: boolean) => {
      if (v) shapes.animate('ants', { marchingAnts: { speed: params.antsSpeed } });
      else shapes.stopAnimation('ants');
    });
    antsFolder.add(params, 'antsSpeed', 0.1, 5, 0.1).name('speed').onChange((v: number) => {
      if (params.marchingAnts) shapes.animate('ants', { marchingAnts: { speed: v } });
    });

    const flowFolder = gui.addFolder('dashedFlow');
    flowFolder.add(params, 'dashedFlow').name('active').onChange((v: boolean) => {
      if (v) shapes.animate('flow', { dashedFlow: { speed: params.flowSpeed, direction: 1 } });
      else shapes.stopAnimation('flow');
    });
    flowFolder.add(params, 'flowSpeed', 0.1, 5, 0.1).name('speed').onChange((v: number) => {
      if (params.dashedFlow) shapes.animate('flow', { dashedFlow: { speed: v, direction: 1 } });
    });

    const glowFolder = gui.addFolder('borderGlow');
    glowFolder.add(params, 'borderGlow').name('active').onChange((v: boolean) => {
      if (v) shapes.animate('glow', { borderGlowPulse: { minAlpha: 0.3, maxAlpha: 1.0, speed: params.glowSpeed } });
      else shapes.stopAnimation('glow');
    });
    glowFolder.add(params, 'glowSpeed', 0.1, 5, 0.1).name('speed').onChange((v: number) => {
      if (params.borderGlow) shapes.animate('glow', { borderGlowPulse: { minAlpha: 0.3, maxAlpha: 1.0, speed: v } });
    });
  },
};
