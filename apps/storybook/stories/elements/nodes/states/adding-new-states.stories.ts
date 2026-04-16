import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, type CanvasNode } from '@invana/canvas-core';
import { createContainer } from '../../../../src/div-utils';

const meta: Meta = {
  title: 'Elements/Nodes/States',
};

export default meta;
type Story = StoryObj;

/**
 * Shows how to define and use your own custom states beyond the built-ins.
 * Custom states are declared in setStyles() and activated via the `states` array
 * on each node (or by calling node.setState() at runtime).
 */
export const CreateYourOwnStates: Story = {
  name: 'Create Your Own States',
  parameters: { layout: 'fullscreen' },
  render: () => createContainer({ id: 'nodes-custom-states' }),
  play: async () => {
    const container = document.getElementById('nodes-custom-states');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 900,
      height: container.clientHeight || 600,
      behavior: 'default',
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);

    // Define custom state appearances alongside the base style
    graphPlugin.setStyles({
      node: {
        fill: 0x1890ff,
        stroke: '#0050b3',
        strokeWidth: 2,
        states: {
          loading: {
            fill: 0x8c8c8c,
            stroke: '#595959',
            strokeWidth: 2,
          },
          error: {
            fill: 0xff4d4f,
            stroke: '#cf1322',
            strokeWidth: 3,
          },
          warning: {
            fill: 0xfaad14,
            stroke: '#d48806',
            strokeWidth: 3,
          },
          success: {
            fill: 0x52c41a,
            stroke: '#389e0d',
            strokeWidth: 2,
          },
        },
      },
    });

    const CUSTOM_STATES = [
      { id: 'normal',  label: 'normal\n(default)',  states: [] },
      { id: 'loading', label: 'loading',  states: ['loading'] },
      { id: 'error',   label: 'error',    states: ['error'] },
      { id: 'warning', label: 'warning',  states: ['warning'] },
      { id: 'success', label: 'success',  states: ['success'] },
    ];

    const nodes: CanvasNode[] = CUSTOM_STATES.map((item, i) => ({
      id: item.id,
      x: (i - (CUSTOM_STATES.length - 1) / 2) * 160,
      y: 0,
      shape: 'circle' as const,
      size: 40,
      label: item.label,
      style: {
        labelPosition: 'bottom' as const,
        labelOffsetY: 15,
        labelFontSize: 13,
        labelFill: '#555',
      },
      states: item.states,
    }));

    graphPlugin.setData({ nodes, edges: [] });
  },
};

