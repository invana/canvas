/**
 * Canvas/Nodes/States — Custom State (Interactive)
 *
 * A single node with a GUI panel to toggle custom states at runtime.
 * Shows how `graph.addState()` / `graph.removeState()` can be called at any
 * point after render — not just during setup.
 *
 * Multiple states can be active simultaneously; their styles are merged in
 * activation order (last-activated properties win on conflict).
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { DrawStyle, BaseShapeSpec } from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/States' };
export default meta;
type Story = StoryObj;

const BASE_STYLE: DrawStyle = { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 };

const CUSTOM_STATE_STYLES: Record<string, DrawStyle> = {
  warning:    { fill: '#f59e0b', stroke: '#fde68a', strokeWidth: 3 },
  error:      { fill: '#dc2626', stroke: '#fca5a5', strokeWidth: 3 },
  success:    { fill: '#16a34a', stroke: '#86efac', strokeWidth: 3 },
  info:       { fill: '#2563eb', stroke: '#93c5fd', strokeWidth: 3 },
  processing: { fill: '#7c3aed', stroke: '#c4b5fd', strokeWidth: 3 },
};

export const CustomInteractiveState: Story = {
  name: 'Custom State — Interactive',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#0f172a',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern', patternType: 'dots',
            color: '#1e293b', backgroundColor: '#0f172a',
            size: 1.5, spacing: 30,
          },
        },
        { plugin: 'graph-data', key: 'graph' },
      ],
    });
    await canvas.init();

    const graph = canvas.plugins.get<GraphDataPlugin>('graph')!;

    graph.setDataSpec([{
      type: 'circle',
      spec: {
        id:          'node',
        x:           0,
        y:           0,
        radius:      60,
        label:       'node',
        style:       BASE_STYLE,
        interactive: true,
        states:      CUSTOM_STATE_STYLES,
      } as BaseShapeSpec,
    }]);

    graph.fitContent(160);

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Custom States', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params: Record<string, boolean> = {
      warning:    false,
      error:      false,
      success:    false,
      info:       false,
      processing: false,
    };

    const toggle = (state: string, active: boolean) => {
      if (active) graph.addState('node', state);
      else        graph.removeState('node', state);
    };

    Object.keys(params).forEach(state => {
      gui.add(params, state).onChange((v: boolean) => toggle(state, v));
    });

    gui.add({
      clearAll: () => {
        Object.keys(params).forEach(s => {
          params[s] = false;
          graph.removeState('node', s);
        });
        gui.controllersRecursive().forEach(c => c.updateDisplay());
      },
    }, 'clearAll').name('Clear All');
  },
};
