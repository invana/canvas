/**
 * ElementPlugin — Animations
 *
 * Demonstrates the built-in animation handlers available via
 * `ElementPlugin.animate()`:
 *
 *   - breathe       — scale pulse (inhale / exhale)
 *   - fadeIn        — alpha 0 → 1 (once)
 *   - colorCycle    — cycles fill colour through a palette
 *   - pulse         — expanding halo ring
 *   - borderGlow    — pulsing border width / colour
 *   - marchingAnts  — animated dash offset
 *   - dashedFlow    — same as marchingAnts with directional control
 *
 * A lil-gui panel lets you start / stop each animation at runtime.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, ElementPlugin } from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: '7. Animations' };
export default meta;
type Story = StoryObj;

// ── helpers ────────────────────────────────────────────────────────────────

const DARK_BG = '#0f172a';
const GAP = 180;

// ── Breathe ────────────────────────────────────────────────────────────────

export const Breathe: Story = {
  name: 'Breathe',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    elements.addSolid('circle', {
      id: 'n1', x: -GAP, y: 0, radius: 50, label: 'slow',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'n2', x: 0, y: 0, radius: 50, label: 'default',
      style: { fill: '#1e3a5f', stroke: '#a78bfa', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'n3', x: GAP, y: 0, radius: 50, label: 'fast',
      style: { fill: '#1e3a5f', stroke: '#f472b6', strokeWidth: 2 },
    });

    elements.animate('n1', { breathe: { period: 3000, amplitude: 0.08 } });
    elements.animate('n2', { breathe: { period: 1500, amplitude: 0.15 } });
    elements.animate('n3', { breathe: { period: 600,  amplitude: 0.20 } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Breathe running').onChange((v: boolean) => {
      if (v) {
        elements.animate('n1', { breathe: { period: 3000, amplitude: 0.08 } });
        elements.animate('n2', { breathe: { period: 1500, amplitude: 0.15 } });
        elements.animate('n3', { breathe: { period: 600,  amplitude: 0.20 } });
      } else {
        elements.clearAnimation('n1', 'breathe');
        elements.clearAnimation('n2', 'breathe');
        elements.clearAnimation('n3', 'breathe');
      }
    });
  },
};

// ── FadeIn ─────────────────────────────────────────────────────────────────

export const FadeIn: Story = {
  name: 'FadeIn',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    const addAll = () => {
      elements.addSolid('circle',  { id: 'fa1', x: -GAP, y: 0, radius: 50, label: '500ms',  style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 } });
      elements.addSolid('rect',    { id: 'fa2', x:     0, y: 0, width: 90, height: 90, label: '1000ms', style: { fill: '#1f2d3d', stroke: '#a78bfa', strokeWidth: 2 } });
      elements.addSolid('ellipse', { id: 'fa3', x:  GAP, y: 0, radiusX: 65, radiusY: 40, label: '2000ms', style: { fill: '#1f2d3d', stroke: '#f472b6', strokeWidth: 2 } });
      elements.animate('fa1', { fadeIn: { duration: 500 } });
      elements.animate('fa2', { fadeIn: { duration: 1000 } });
      elements.animate('fa3', { fadeIn: { duration: 2000 } });
    };

    addAll();

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { replay: () => { elements.clear(); addAll(); } };
    gui.add(params, 'replay').name('Replay fade-in');
  },
};

// ── ColorCycle ─────────────────────────────────────────────────────────────

export const ColorCycle: Story = {
  name: 'ColorCycle',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    elements.addSolid('circle', {
      id: 'cc1', x: -GAP, y: 0, radius: 50, label: 'fire',
      style: { fill: '#7f1d1d', stroke: '#fca5a5', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'cc2', x: 0, y: 0, radius: 50, label: 'ocean',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'cc3', x: GAP, y: 0, radius: 50, label: 'rainbow',
      style: { fill: '#1a1a2e', stroke: '#a78bfa', strokeWidth: 2 },
    });

    elements.animate('cc1', { colorCycle: { colors: ['#dc2626', '#f97316', '#fbbf24'], period: 1200 } });
    elements.animate('cc2', { colorCycle: { colors: ['#0284c7', '#06b6d4', '#0891b2'], period: 2000 } });
    elements.animate('cc3', { colorCycle: { colors: ['#f43f5e', '#a855f7', '#3b82f6', '#10b981'], period: 3000 } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Running').onChange((v: boolean) => {
      if (v) {
        elements.animate('cc1', { colorCycle: { colors: ['#dc2626', '#f97316', '#fbbf24'], period: 1200 } });
        elements.animate('cc2', { colorCycle: { colors: ['#0284c7', '#06b6d4', '#0891b2'], period: 2000 } });
        elements.animate('cc3', { colorCycle: { colors: ['#f43f5e', '#a855f7', '#3b82f6', '#10b981'], period: 3000 } });
      } else {
        elements.clearAnimation('cc1', 'colorCycle');
        elements.clearAnimation('cc2', 'colorCycle');
        elements.clearAnimation('cc3', 'colorCycle');
      }
    });
  },
};

// ── Pulse (halo ring) ──────────────────────────────────────────────────────

export const Pulse: Story = {
  name: 'Pulse',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    elements.addSolid('circle', {
      id: 'p1', x: -GAP, y: 0, radius: 40, label: 'slow',
      style: { fill: '#1e3a5f', stroke: '#3b82f6', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'p2', x: 0, y: 0, radius: 40, label: 'default',
      style: { fill: '#3b0764', stroke: '#a855f7', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'p3', x: GAP, y: 0, radius: 40, label: 'fast',
      style: { fill: '#450a0a', stroke: '#ef4444', strokeWidth: 2 },
    });

    elements.animate('p1', { pulse: { period: 3000, color: '#3b82f6', maxRadius: 90 } });
    elements.animate('p2', { pulse: { period: 1500, color: '#a855f7', maxRadius: 80 } });
    elements.animate('p3', { pulse: { period: 800,  color: '#ef4444', maxRadius: 75 } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Running').onChange((v: boolean) => {
      ['p1', 'p2', 'p3'].forEach(id => {
        if (v) elements.animate(id, { pulse: { period: 1500, color: '#a855f7', maxRadius: 80 } });
        else elements.clearAnimation(id, 'pulse');
      });
    });
  },
};

// ── BorderGlow ─────────────────────────────────────────────────────────────

export const BorderGlow: Story = {
  name: 'BorderGlow',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    elements.addSolid('circle', {
      id: 'bg1', x: -GAP, y: 0, radius: 50, label: 'width only',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
    });
    elements.addSolid('rect', {
      id: 'bg2', x: 0, y: 0, width: 100, height: 80, label: 'colour',
      style: { fill: '#1f2937', stroke: '#f59e0b', strokeWidth: 2 },
    });
    elements.addSolid('hexagon', {
      id: 'bg3', x: GAP, y: 0, radius: 55, label: 'both',
      style: { fill: '#1a0033', stroke: '#a78bfa', strokeWidth: 2 },
    });

    elements.animate('bg1', { borderGlow: { minWidth: 1, maxWidth: 6, period: 1200 } });
    elements.animate('bg2', { borderGlow: { minWidth: 1, maxWidth: 5, period: 900, color: '#fbbf24' } });
    elements.animate('bg3', { borderGlow: { minWidth: 2, maxWidth: 8, period: 1600, color: '#c084fc' } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Running').onChange((v: boolean) => {
      ['bg1', 'bg2', 'bg3'].forEach(id => {
        if (v) elements.animate(id, { borderGlow: { minWidth: 2, maxWidth: 6, period: 1200 } });
        else elements.clearAnimation(id, 'borderGlow');
      });
    });
  },
};

// ── MarchingAnts ───────────────────────────────────────────────────────────

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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    elements.addSolid('circle', {
      id: 'ma1', x: -GAP, y: 0, radius: 50, label: 'circle',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 3, dashArray: [8, 6] },
    });
    elements.addSolid('rect', {
      id: 'ma2', x: 0, y: 0, width: 100, height: 80, label: 'rect',
      style: { fill: '#1f2937', stroke: '#f59e0b', strokeWidth: 3, dashArray: [10, 6] },
    });
    elements.addSolid('diamond', {
      id: 'ma3', x: GAP, y: 0, width: 100, height: 80, label: 'diamond',
      style: { fill: '#1a0033', stroke: '#a78bfa', strokeWidth: 3, dashArray: [8, 5] },
    });

    elements.animate('ma1', { marchingAnts: { speed: 0.3 } });
    elements.animate('ma2', { marchingAnts: { speed: 0.5, borderColor: '#fbbf24' } });
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

// ── DashedFlow ─────────────────────────────────────────────────────────────

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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    elements.addSolid('circle', {
      id: 'df1', x: -GAP, y: 0, radius: 50, label: 'forward',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 3, dashArray: [8, 6] },
    });
    elements.addSolid('circle', {
      id: 'df2', x: GAP, y: 0, radius: 50, label: 'reverse',
      style: { fill: '#1e3a5f', stroke: '#f472b6', strokeWidth: 3, dashArray: [8, 6] },
    });

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
