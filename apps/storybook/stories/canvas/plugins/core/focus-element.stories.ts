import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, GraphDataPlugin, type FocusElementPlugin } from '@invana/canvas-core';
import { createContainer } from '../../../../src/div-utils';

const GRAPH_DATA = {
  nodes: [
    { id: 'n1', x: -260, y: -120, shape: 'circle',   size: 44, label: 'Node A' },
    { id: 'n2', x:  -40, y: -120, shape: 'rect',     width: 100, height: 54, label: 'Node B' },
    { id: 'n3', x:  190, y: -120, shape: 'diamond',  size: 52, label: 'Node C' },
    { id: 'n4', x: -150, y:  120, shape: 'hexagon',  size: 46, label: 'Node D' },
    { id: 'n5', x:   80, y:  120, shape: 'star',     size: 46, label: 'Node E' },
    { id: 'n6', x:  310, y:  120, shape: 'triangle', size: 50, label: 'Node F' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
    { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' },
    { id: 'e3', source: 'n1', target: 'n4', pathType: 'bezier' },
    { id: 'e4', source: 'n2', target: 'n5', pathType: 'bezier' },
    { id: 'e5', source: 'n3', target: 'n6', pathType: 'bezier' },
    { id: 'e6', source: 'n4', target: 'n5', pathType: 'bezier' },
    { id: 'e7', source: 'n5', target: 'n6', pathType: 'bezier' },
  ],
};

const GRAPH_STYLES = {
  node: { fill: '#4cc9f0', stroke: '#ffffff', strokeWidth: 2, labelFill: '#ffffff',
    states: { selected: { stroke: '#ffd166', strokeWidth: 4 }, active: { halo: true, haloStroke: '#8b5cf6', haloStrokeWidth: 4 } } },
  edge: { stroke: '#94a3b8', strokeWidth: 2,
    states: { selected: { stroke: '#ffd166', strokeWidth: 3 }, active: { stroke: '#8b5cf6', strokeWidth: 3 } } },
};

const meta: Meta = {
  title: 'Canvas/Plugins/Core',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const FocusElement: Story = {
  render: () => createContainer({ id: 'plugin-focus-element', height: '600px' }),
  play: async () => {
    const container = document.getElementById('plugin-focus-element');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: false,
      plugins: [
        { plugin: 'background', key: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0f172a', color: '#334155', size: 1.5, spacing: 28, alpha: 0.75 } },
        { plugin: 'click-select',  key: 'click-select' },
        { plugin: 'focus-element', key: 'focus-element' },
      ],
    });
    await canvas.init();
    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);
    graphPlugin.setStyles(GRAPH_STYLES as any);

    const gui = new GUI({ container, title: 'Focus' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    const actions = {
      focusSelected: () => canvas.getPlugin<FocusElementPlugin>('focus-element')?.focusSelected(),
      resetView:     () => canvas.viewport?.fitWorld(),
    };
    gui.add(actions, 'focusSelected').name('Focus Selected');
    gui.add(actions, 'resetView').name('Reset View');
  },
};
