import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, NodeStates, type CanvasNode } from '@invana/canvas-core';
import { createContainer } from '../../../../src/div-utils';

const meta: Meta = {
  title: 'Elements/Nodes/States',
};

export default meta;
type Story = StoryObj;

/**
 * Shows all 6 built-in node states side by side:
 * default, active, selected, highlighted, muted, disabled
 */
export const DefaultStates: Story = {
  name: 'Default States',
  parameters: { layout: 'fullscreen' },
  render: () => createContainer({ id: 'nodes-default-states' }),
  play: async () => {
    const container = document.getElementById('nodes-default-states');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 900,
      height: container.clientHeight || 600,
      behavior: false,
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);

    const STATES = [
      NodeStates.DEFAULT,
      NodeStates.ACTIVE,
      NodeStates.SELECTED,
      NodeStates.HIGHLIGHTED,
      NodeStates.MUTED,
      NodeStates.DISABLED,
    ];

    const nodes: CanvasNode[] = STATES.map((state, i) => ({
      id: `node-${state}`,
      x: (i - (STATES.length - 1) / 2) * 160,
      y: 0,
      shape: 'circle' as const,
      size: 40,
      label: state,
      style: {
        labelPosition: 'bottom' as const,
        labelOffsetY: 15,
        labelFontSize: 13,
        labelFill: '#555',
      },
      // 'default' is always active; set the others explicitly
      states: state === NodeStates.DEFAULT ? [] : [state],
    }));

    graphPlugin.setData({ nodes, edges: [] });
  },
};
