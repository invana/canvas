import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, GraphDataPlugin, FocusElementPlugin } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
import { generateRandomTree } from '@invana/example-datasets';
import { createContainer } from '../../src/div-utils';

const rawTree = generateRandomTree(16);
const GRAPH_DATA = {
  nodes: rawTree.nodes.map((n: any) => ({
    id: String(n.index),
    shape: 'circle' as const,
    size: 10,
    label: `N${n.index}`,
  })),
  edges: rawTree.edges.map((e: any, i: number) => ({
    id: `e${i}`,
    source: String(e.source),
    target: String(e.target),
    pathType: 'straight' as const,
  })),
};

const meta: Meta = {
  title: 'Plugins/Focus Element',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

/**
 * Click any node or edge to center the viewport on it with a smooth animation.
 *
 * Options:
 * - **enable** — toggle click-to-focus on/off
 * - **duration** — animation duration in ms
 * - **easing** — animation easing curve
 * - **Focus Selected** — programmatically focus currently selected elements
 * - **Reset View** — fit all content back in viewport
 */
export const FocusElement: Story = {
  render: () => createContainer({ id: 'plugin-focus-element' }),
  play: async () => {
    const container = document.getElementById('plugin-focus-element');
    if (!container) return;

    const focusPlugin = new FocusElementPlugin({
      animation: { duration: 500, easing: 'ease-in' },
      enable: true,
    });

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: false,
      plugins: [
        { plugin: 'click-select', key: 'click-select' },
      ],
    });
    await canvas.init();
    await canvas.registerPlugin(focusPlugin);

    const graphPlugin = new GraphDataPlugin({ fitOnRender: false, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);
    const layout = new D3ForceLayoutPlugin({ charge: -200, collisionRadius: 25, animate: true, iterations: 300 });
    await canvas.registerPlugin(layout);
    await layout.start();

    // GUI state
    const guiState = {
      enable: true,
      duration: 500,
      easing: 'ease-in' as 'ease-in' | 'ease-in-out' | 'ease-out' | 'linear',
    };

    const applyOptions = () => {
      focusPlugin.setOptions({
        enable: guiState.enable,
        animation: { duration: guiState.duration, easing: guiState.easing },
      });
    };

    const actions = {
      focusSelected: () => focusPlugin.focusSelected(),
      resetView:     () => canvas.viewport?.fitContent(80),
    };

    const gui = new GUI({ container, title: 'Focus Element' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    gui.add(guiState, 'enable').name('Enable').onChange(applyOptions);
    gui.add(guiState, 'duration', 0, 2000, 50).name('Duration (ms)').onChange(applyOptions);
    gui.add(guiState, 'easing', ['ease-in', 'ease-in-out', 'ease-out', 'linear']).name('Easing').onChange(applyOptions);
    gui.add(actions, 'focusSelected').name('Focus Selected');
    gui.add(actions, 'resetView').name('Reset View');
  },
};
