/**
 * ShapePlugin — Body Animations
 *
 * Demonstrates shape-body animation types:
 *   - breathe       — scale breathe effect
 *   - colorCycle    — fill color cycles through a palette
 *   - pulse         — radiating rings from the shape (halo)
 *   - fadeIn        — fade in from transparent on mount
 *
 * Use the GUI to enable/disable each animation type.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ShapePlugin' };
export default meta;
type Story = StoryObj;

export const BodyAnimations: Story = {
  name: 'Body Animations',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#111827' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1f2937', backgroundColor: '#111827', size: 1.5, spacing: 30,
    }));

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    shapes.setData([
      {
        id: 'breathe', type: 'circle', x: -240, y: 0, radius: 60,
        fill: { type: 'solid', color: '#0ea5e9' },
        border: { color: '#7dd3fc', width: 2 },
        label: { text: 'breathe' },
      },
      {
        id: 'colorCycle', type: 'polygon', x: 0, y: 0, radius: 60, sides: 6,
        fill: { type: 'solid', color: '#8b5cf6' },
        border: { color: '#c4b5fd', width: 2 },
        label: { text: 'colorCycle' },
      },
      {
        id: 'pulse', type: 'star', x: 240, y: 0, radius: 55,
        fill: { type: 'solid', color: '#f59e0b' },
        border: { color: '#fcd34d', width: 2 },
        label: { text: 'pulse' },
      },
      {
        id: 'fadeIn', type: 'rect', x: -55, y: 140, width: 130, height: 90,
        fill: { type: 'solid', color: '#10b981' },
        border: { color: '#6ee7b7', width: 2 },
        label: { text: 'fadeIn (replay)' },
      },
    ] as never[]);

    // Start animations
    shapes.animate('breathe', { breathe: { minScale: 0.88, maxScale: 1.12, speed: 1.2 } });
    shapes.animate('colorCycle', { colorCycle: {
      colors: ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'],
      speed: 1,
    }});
    shapes.animate('pulse', { pulse: { ringCount: 3, speed: 1.5, maxRadius: 90 } });
    shapes.animate('fadeIn', { fadeIn: { duration: 1.5 } });

    // GUI
    const gui = new GUI({ title: 'Body Animations', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = {
      breathe: true, breatheSpeed: 1.2,
      colorCycle: true, cycleSpeed: 1,
      pulse: true, pulseSpeed: 1.5,
    };

    const breatheF = gui.addFolder('breathe');
    breatheF.add(params, 'breathe').name('active').onChange((v: boolean) => {
      if (v) shapes.animate('breathe', { breathe: { minScale: 0.88, maxScale: 1.12, speed: params.breatheSpeed } });
      else shapes.stopAnimation('breathe');
    });
    breatheF.add(params, 'breatheSpeed', 0.1, 4, 0.1).name('speed').onChange((v: number) => {
      if (params.breathe) shapes.animate('breathe', { breathe: { minScale: 0.88, maxScale: 1.12, speed: v } });
    });

    const cycleF = gui.addFolder('colorCycle');
    cycleF.add(params, 'colorCycle').name('active').onChange((v: boolean) => {
      if (v) shapes.animate('colorCycle', { colorCycle: {
        colors: ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'], speed: params.cycleSpeed,
      }});
      else shapes.stopAnimation('colorCycle');
    });
    cycleF.add(params, 'cycleSpeed', 0.1, 4, 0.1).name('speed').onChange((v: number) => {
      if (params.colorCycle) shapes.animate('colorCycle', { colorCycle: {
        colors: ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'], speed: v,
      }});
    });

    const pulseF = gui.addFolder('pulse');
    pulseF.add(params, 'pulse').name('active').onChange((v: boolean) => {
      if (v) shapes.animate('pulse', { pulse: { ringCount: 3, speed: params.pulseSpeed, maxRadius: 90 } });
      else shapes.stopAnimation('pulse');
    });
    pulseF.add(params, 'pulseSpeed', 0.1, 4, 0.1).name('speed').onChange((v: number) => {
      if (params.pulse) shapes.animate('pulse', { pulse: { ringCount: 3, speed: v, maxRadius: 90 } });
    });

    gui.add({ replayFade: () => {
      shapes.stopAnimation('fadeIn');
      shapes.update('fadeIn', {});   // force redraw at alpha=1
      shapes.animate('fadeIn', { fadeIn: { duration: 1.5 } });
    }}, 'replayFade').name('▶ Replay fadeIn');
  },
};
