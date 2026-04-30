/**
 * Canvas/Nodes/States — All States (Interactive)
 *
 * A single node with a GUI panel to toggle every built-in state at runtime.
 * The node relies entirely on the DEFAULT_NODE_STATES fallbacks built into
 * BaseShape — no `spec.states` overrides are needed for built-in state names.
 *
 * Built-in states (G6-aligned):
 *   hovered   — pointer-enter emphasis
 *   selected  — click selection
 *   active    — currently interacting
 *   highlight — focus / emphasis
 *   inactive  — dimmed / unfocused
 *   disabled  — non-interactive appearance
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

const BUILT_IN_STATES = ['hovered', 'selected', 'active', 'highlight', 'inactive', 'disabled'] as const;

export const AllStatesInteractive: Story = {
  name: 'All States — Interactive',
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

    // No spec.states needed — built-in state names resolve via DEFAULT_NODE_STATES.
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
      } as BaseShapeSpec,
    }]);

    graph.fitContent(160);

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Built-in States', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params: Record<string, boolean> = {};
    BUILT_IN_STATES.forEach(s => { params[s] = false; });

    const toggle = (state: string, active: boolean) => {
      if (active) graph.addState('node', state);
      else        graph.removeState('node', state);
    };

    BUILT_IN_STATES.forEach(state => {
      gui.add(params, state).onChange((v: boolean) => toggle(state, v));
    });

    gui.add({
      clearAll: () => {
        BUILT_IN_STATES.forEach(s => {
          params[s] = false;
          graph.removeState('node', s);
        });
        gui.controllersRecursive().forEach(c => c.updateDisplay());
      },
    }, 'clearAll').name('Clear All');
  },
};
