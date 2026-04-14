import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, NodeStates, type CanvasNode } from '@invana/canvas-core';
import GUI from 'lil-gui';
import { createContainer } from '../../../../src/div-utils';

const meta: Meta = {
  title: 'Elements/Nodes/States',
};

export default meta;
type Story = StoryObj;

/**
 * Shows multiple states active simultaneously with priority ordering.
 * Toggle checkboxes to combine built-in and custom states.
 */
export const MultipleStates: Story = {
  name: 'Multiple States',
  parameters: { layout: 'fullscreen' },
  render: () => createContainer({ id: 'nodes-multiple-states', height: '70vh' }),
  play: async () => {
    const container = document.getElementById('nodes-multiple-states');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 500,
      behavior: 'default',
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 100 });
    await canvas.registerPlugin(graphPlugin);

    graphPlugin.setStyles({
      node: {
        fill: 0x1890ff,
        stroke: '#0050b3',
        strokeWidth: 2,
        states: {
          loading: { fill: 0x8c8c8c, stroke: '#595959' },
          error:   { fill: 0xff4d4f, stroke: '#cf1322', strokeWidth: 3 },
        },
      },
    });

    const nodes: CanvasNode[] = [
      {
        id: 'multi',
        x: 0,
        y: 0,
        shape: 'circle' as const,
        size: 50,
        label: 'Node',
      },
    ];
    graphPlugin.setData({ nodes, edges: [] });

    const node = graphPlugin.renderer?.getNode('multi');
    if (!node) return;

    // ── lil-gui controls ────────────────────────────────────────────
    const params = {
      selected:    false,
      highlighted: false,
      muted:       false,
      disabled:    false,
      loading:     false,
      error:       false,
    };

    type ParamKey = keyof typeof params;
    const stateMap: Record<ParamKey, string> = {
      selected:    NodeStates.SELECTED,
      highlighted: NodeStates.HIGHLIGHTED,
      muted:       NodeStates.MUTED,
      disabled:    NodeStates.DISABLED,
      loading:     'loading',
      error:       'error',
    };

    const gui = new GUI({ container, title: 'Toggle States' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    (Object.keys(params) as ParamKey[]).forEach((key) => {
      gui.add(params, key).name(key).onChange((v: boolean) => {
        node.setState(stateMap[key], v);
      });
    });
  },
};