/**
 * Canvas/Nodes/States — Custom State Styles
 *
 * Static row showing how to define custom state names (warning / error /
 * success / info / processing) via `spec.states` and activate them at render
 * time with `graph.addState()`.
 *
 * Each node carries the full CUSTOM_STATE_STYLES map in its spec so any state
 * can be switched on later — only one state is pre-activated per node here.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { DrawStyle, BaseShapeSpec } from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/States' };
export default meta;
type Story = StoryObj;

const RADIUS = 40;
const GAP_X  = 160;

const BASE_STYLE: DrawStyle = { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 };

/**
 * Custom state style map passed to `spec.states`.
 * Each key is a state name; the value is merged over the base style while that
 * state is active.  Any string key is valid — not limited to built-in states.
 */
const CUSTOM_STATE_STYLES: Record<string, DrawStyle> = {
  warning:    { fill: '#f59e0b', stroke: '#fde68a', strokeWidth: 3 },
  error:      { fill: '#dc2626', stroke: '#fca5a5', strokeWidth: 3 },
  success:    { fill: '#16a34a', stroke: '#86efac', strokeWidth: 3 },
  info:       { fill: '#2563eb', stroke: '#93c5fd', strokeWidth: 3 },
  processing: { fill: '#7c3aed', stroke: '#c4b5fd', strokeWidth: 3 },
};

const STATES_ROW = [
  { id: 'cs-default',    label: 'default',    state: null           },
  { id: 'cs-warning',    label: 'warning',    state: 'warning'      },
  { id: 'cs-error',      label: 'error',      state: 'error'        },
  { id: 'cs-success',    label: 'success',    state: 'success'      },
  { id: 'cs-info',       label: 'info',       state: 'info'         },
  { id: 'cs-processing', label: 'processing', state: 'processing'   },
];

const stateRowSpecs = STATES_ROW.map((s, i) => ({
  type: 'circle',
  spec: {
    id:          s.id,
    x:           (i - (STATES_ROW.length - 1) / 2) * GAP_X,
    y:           0,
    radius:      RADIUS,
    label:       s.label,
    style:       BASE_STYLE,
    interactive: true,
    states:      CUSTOM_STATE_STYLES,
  } as BaseShapeSpec,
}));

export const CustomStates: Story = {
  name: 'Custom States',
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
    graph.setDataSpec(stateRowSpecs);

    STATES_ROW.forEach(s => {
      if (s.state) graph.addState(s.id, s.state);
    });

    graph.fitContent(60);
  },
};
