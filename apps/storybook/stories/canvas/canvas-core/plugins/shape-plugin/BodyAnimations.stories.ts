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
 * Animations are addressed by type name, not by a 'body'/'border' layer key.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec } from '@invana/canvas';
import { createContainer } from '../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '7. Animations/Nodes & Edges' };
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

    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    shapes.setData([
      {
        id: 'breathe', type: 'circle', x: -240, y: 0, radius: 60,
        fill: { type: 'solid', color: '#0ea5e9' },
        border: { color: '#7dd3fc', width: 2 },
      },
      {
        id: 'label-breathe', type: 'label', x: -240, y: 80,
        text: 'breathe', style: { fill: '#e2e8f0', fontSize: 14 },
      },
      {
        id: 'colorCycle', type: 'polygon', x: 0, y: 0, radius: 60, sides: 6,
        fill: { type: 'solid', color: '#8b5cf6' },
        border: { color: '#c4b5fd', width: 2 },
      },
      {
        id: 'label-colorCycle', type: 'label', x: 0, y: 80,
        text: 'colorCycle', style: { fill: '#e2e8f0', fontSize: 14 },
      },
      {
        id: 'pulse', type: 'star', x: 240, y: 0, radius: 55,
        fill: { type: 'solid', color: '#f59e0b' },
        border: { color: '#fcd34d', width: 2 },
      },
      {
        id: 'label-pulse', type: 'label', x: 240, y: 80,
        text: 'pulse', style: { fill: '#e2e8f0', fontSize: 14 },
      },
      {
        id: 'fadeIn', type: 'rect', x: -55, y: 180, width: 130, height: 90,
        fill: { type: 'solid', color: '#10b981' },
        border: { color: '#6ee7b7', width: 2 },
      },
      {
        id: 'label-fadeIn', type: 'label', x: -55, y: 280,
        text: 'fadeIn (replay)', style: { fill: '#e2e8f0', fontSize: 14 },
      },
    ] as ShapeSpec[]);

    // Each animation type is now the key — no wrapping 'body'/'border' layer
    shapes.animate('breathe',    { breathe:    { amplitude: 0.12, duration: 1667 } });
    shapes.animate('colorCycle', { colorCycle: { colors: ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'], duration: 800 } });
    shapes.animate('pulse',      { pulse:      { maxRadius: 90, duration: 1200, repeat: -1 } });
    shapes.animate('fadeIn',     { fadeIn:     { duration: 1500, from: 0 } });

    // GUI
    const gui = new GUI({ title: 'Body Animations', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = {
      devInfo: true,
      breathe:    { active: true,  duration: 1667, repeat: -1 },
      colorCycle: { active: true,  duration: 800,  repeat: -1 },
      pulse:      { active: true,  duration: 1200, repeat: -1 },
      fadeIn:     {                duration: 1500, repeat:  1 },
    };

    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));

    const breatheF = gui.addFolder('breathe');
    breatheF.add(params.breathe, 'active').onChange((v: boolean) => {
      if (v) shapes.animate('breathe', { breathe: { amplitude: 0.12, duration: params.breathe.duration, repeat: params.breathe.repeat } });
      else    shapes.stopAnimation('breathe', 'breathe');
    });
    breatheF.add(params.breathe, 'duration', 200, 5000, 100).onChange((v: number) => {
      if (params.breathe.active) shapes.animate('breathe', { breathe: { amplitude: 0.12, duration: v, repeat: params.breathe.repeat } });
    });
    breatheF.add(params.breathe, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange((v: number) => {
      if (params.breathe.active) shapes.animate('breathe', { breathe: { amplitude: 0.12, duration: params.breathe.duration, repeat: v } });
    });

    const cycleF = gui.addFolder('colorCycle');
    cycleF.add(params.colorCycle, 'active').onChange((v: boolean) => {
      if (v) shapes.animate('colorCycle', { colorCycle: { colors: ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'], duration: params.colorCycle.duration, repeat: params.colorCycle.repeat } });
      else    shapes.stopAnimation('colorCycle', 'colorCycle');
    });
    cycleF.add(params.colorCycle, 'duration', 100, 3000, 100).onChange((v: number) => {
      if (params.colorCycle.active) shapes.animate('colorCycle', { colorCycle: { colors: ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'], duration: v, repeat: params.colorCycle.repeat } });
    });
    cycleF.add(params.colorCycle, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange((v: number) => {
      if (params.colorCycle.active) shapes.animate('colorCycle', { colorCycle: { colors: ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'], duration: params.colorCycle.duration, repeat: v } });
    });

    const pulseF = gui.addFolder('pulse');
    pulseF.add(params.pulse, 'active').onChange((v: boolean) => {
      if (v) shapes.animate('pulse', { pulse: { maxRadius: 90, duration: params.pulse.duration, repeat: params.pulse.repeat } });
      else    shapes.stopAnimation('pulse', 'pulse');
    });
    pulseF.add(params.pulse, 'duration', 200, 5000, 100).onChange((v: number) => {
      if (params.pulse.active) shapes.animate('pulse', { pulse: { maxRadius: 90, duration: v, repeat: params.pulse.repeat } });
    });
    pulseF.add(params.pulse, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange((v: number) => {
      if (params.pulse.active) shapes.animate('pulse', { pulse: { maxRadius: 90, duration: params.pulse.duration, repeat: v } });
    });

    const replayFadeIn = () => {
      shapes.stopAnimation('fadeIn', 'fadeIn');
      shapes.animate('fadeIn', { fadeIn: { duration: params.fadeIn.duration, from: 0, repeat: params.fadeIn.repeat } });
    };

    const fadeF = gui.addFolder('fadeIn');
    fadeF.add(params.fadeIn, 'duration', 200, 5000, 100).onChange(replayFadeIn);
    fadeF.add(params.fadeIn, 'repeat', -1, 20, 1).name('repeat (-1=∞)').onChange(replayFadeIn);
    fadeF.add({ replay: replayFadeIn }, 'replay').name('▶ Replay');
  },
};
