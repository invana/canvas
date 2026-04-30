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

const STATES = [
  { id: 'state-default',   label: 'default',   activeState: null        },
  { id: 'state-hovered',   label: 'hovered',   activeState: 'hovered'   },
  { id: 'state-selected',  label: 'selected',  activeState: 'selected'  },
  { id: 'state-active',    label: 'active',    activeState: 'active'    },
  { id: 'state-highlight', label: 'highlight', activeState: 'highlight' },
  { id: 'state-inactive',  label: 'inactive',  activeState: 'inactive'  },
  { id: 'state-disabled',  label: 'disabled',  activeState: 'disabled'  },
];

const stateSpecs = STATES.map((s, i) => ({
  type: 'circle',
  spec: {
    id:          s.id,
    x:           (i - (STATES.length - 1) / 2) * GAP_X,
    y:           0,
    radius:      RADIUS,
    label:       s.label,
    style:       BASE_STYLE,
    interactive: true,
  } as BaseShapeSpec,
}));

export const AllStates: Story = {
  name: 'All States',
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
    graph.setDataSpec(stateSpecs);

    STATES.forEach(s => {
      if (s.activeState) graph.addState(s.id, s.activeState);
    });

    graph.fitContent(60);
  },
};
