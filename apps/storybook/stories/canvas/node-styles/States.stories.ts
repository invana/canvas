/**
 * GraphPlugin — States
 *
 * Demonstrates the named-state system built into every element.
 * States overlay DrawStyle overrides on top of the base style —
 * useful for hover, selection, error, disabled, and custom app states.
 *
 * Three circles:
 *   1  Default  — base style only
 *   2  Hovered  — 'hovered' state active (lighter border + fill)
 *   3  Selected — 'selected' state active (bright ring)
 *
 * A lil-gui panel lets you toggle any state at runtime.
 *
 * API used:
 *   setState(id, stateName, active)
 *   clearState(id, stateName)
 *   getStates(id)
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  GraphPlugin,
  type CircleNodeSpec,
} from '@invana/plugins-graph-data';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Node Styles/States' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  name: 'States',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 30,
    }));

    const elements = new GraphPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    const G = 200;

    // ── Node 1 — default ──────────────────────────────────────────────────
    elements.addNode('circle', {
      id: 'n-default', x: -G, y: 0, radius: 50,
      label: 'Default',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
      states: {
        hovered:  { fill: '#2563eb', stroke: '#93c5fd', strokeWidth: 3 },
        selected: { fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 3 },
      },
      interactive: true,
    } as CircleNodeSpec);

    // ── Node 2 — hovered ──────────────────────────────────────────────────
    elements.addNode('circle', {
      id: 'n-hovered', x: 0, y: 0, radius: 50,
      label: 'Hovered',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
      states: {
        hovered:  { fill: '#2563eb', stroke: '#93c5fd', strokeWidth: 3 },
        selected: { fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 3 },
      },
      interactive: true,
    } as CircleNodeSpec);
    elements.setState('n-hovered', 'hovered', true);

    // ── Node 3 — selected ─────────────────────────────────────────────────
    elements.addNode('circle', {
      id: 'n-selected', x: G, y: 0, radius: 50,
      label: 'Selected',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
      states: {
        hovered:  { fill: '#2563eb', stroke: '#93c5fd', strokeWidth: 3 },
        selected: { fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 3 },
      },
      interactive: true,
    } as CircleNodeSpec);
    elements.setState('n-selected', 'selected', true);

    // ── Custom state: 'error' ─────────────────────────────────────────────
    elements.addNode('circle', {
      id: 'n-error', x: -G * 0.5, y: G * 1.2, radius: 50,
      label: 'Error state',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
      states: {
        error:  { fill: '#7f1d1d', stroke: '#fca5a5', strokeWidth: 3 },
        warning:{ fill: '#78350f', stroke: '#fcd34d', strokeWidth: 3 },
      },
      interactive: true,
    } as CircleNodeSpec);
    elements.setState('n-error', 'error', true);

    elements.addNode('circle', {
      id: 'n-warning', x: G * 0.5, y: G * 1.2, radius: 50,
      label: 'Warning state',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
      states: {
        error:  { fill: '#7f1d1d', stroke: '#fca5a5', strokeWidth: 3 },
        warning:{ fill: '#78350f', stroke: '#fcd34d', strokeWidth: 3 },
      },
      interactive: true,
    } as CircleNodeSpec);
    elements.setState('n-warning', 'warning', true);

    elements.fitContent();

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'States', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = {
      defaultHovered: false,
      defaultSelected: false,
      hoverHovered: true,
      hoverSelected: false,
      selectHovered: false,
      selectSelected: true,
      errorActive: true,
      warningActive: true,
    };

    const folder1 = gui.addFolder('n-default');
    folder1.add(params, 'defaultHovered').name('hovered').onChange((v: boolean) => elements.setState('n-default', 'hovered', v));
    folder1.add(params, 'defaultSelected').name('selected').onChange((v: boolean) => elements.setState('n-default', 'selected', v));

    const folder2 = gui.addFolder('n-hovered');
    folder2.add(params, 'hoverHovered').name('hovered').onChange((v: boolean) => elements.setState('n-hovered', 'hovered', v));
    folder2.add(params, 'hoverSelected').name('selected').onChange((v: boolean) => elements.setState('n-hovered', 'selected', v));

    const folder3 = gui.addFolder('n-selected');
    folder3.add(params, 'selectHovered').name('hovered').onChange((v: boolean) => elements.setState('n-selected', 'hovered', v));
    folder3.add(params, 'selectSelected').name('selected').onChange((v: boolean) => elements.setState('n-selected', 'selected', v));

    const folder4 = gui.addFolder('custom states');
    folder4.add(params, 'errorActive').name('error').onChange((v: boolean) => elements.setState('n-error', 'error', v));
    folder4.add(params, 'warningActive').name('warning').onChange((v: boolean) => elements.setState('n-warning', 'warning', v));
  },
};
