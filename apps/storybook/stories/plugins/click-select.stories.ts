import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, GraphDataPlugin, ClickSelectPlugin, PluginRegistry, type SelectDirection } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
import { generateRandomTree } from '@invana/example-datasets';
import { createContainer } from '../../src/div-utils';

PluginRegistry.register('layout-d3-force', D3ForceLayoutPlugin);

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
  title: 'Plugins/Click Select',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const ClickSelect: Story = {
  name: 'Click Select',
  render: () => createContainer({ id: 'cs-main' }),
  play: async () => {
    const container = document.getElementById('cs-main');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern' as const,
            patternType: 'dots' as const,
            backgroundColor: '#0f172a',
            color: '#334155',
            size: 1.5,
            spacing: 28,
            alpha: 0.7,
          },
        },
        {
          plugin: 'click-select',
          key: 'click-select',
          options: {
            enable: true,
            multiple: true,
            trigger: ['shift'],
            degree: 1,
            direction: 'both' as SelectDirection,
            state: 'selected',
            unselectedState: 'muted',
            clearOnBackground: true,
          },
        },
      ],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: false, fitPadding: 60 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);

    const layout = new D3ForceLayoutPlugin({
      charge: -200,
      collisionRadius: 25,
      animate: true,
      iterations: 300,
    });
    await canvas.registerPlugin(layout);
    await layout.start();

    const selectPlugin = canvas.getPlugin<ClickSelectPlugin>('click-select')!;

    const gui = new GUI({ container, title: 'Click Select' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    const settings = {
      enable: true,
      multiple: true,
      trigger: 'shift',
      degree: 1,
      direction: 'both',
      state: 'selected',
      unselectedState: 'muted',
      clearOnBackground: true,
      selectedNodes: 0,
      selectedEdges: 0,
    };

    const update = () =>
      selectPlugin.setOptions({
        enable: settings.enable,
        multiple: settings.multiple,
        trigger: settings.trigger === 'none' ? [] : [settings.trigger],
        degree: settings.degree,
        direction: settings.direction as SelectDirection,
        state: settings.state,
        unselectedState: settings.unselectedState,
        clearOnBackground: settings.clearOnBackground,
      });

    gui.add(settings, 'enable').name('enable').onChange(update);
    gui.add(settings, 'multiple').name('multiple').onChange(update);
    gui.add(settings, 'trigger', ['none', 'shift', 'control', 'alt', 'meta']).name('trigger (modifier key)').onChange(update);
    gui.add(settings, 'degree', 0, 3, 1).name('degree (neighbor hops)').onChange(update);
    gui.add(settings, 'direction', ['both', 'in', 'out']).name('direction').onChange(update);
    gui.add(settings, 'state', ['selected', 'active', 'highlighted']).name('state').onChange(update);
    gui.add(settings, 'unselectedState', ['muted', '']).name('unselectedState (dim non-selected)').onChange(update);
    gui.add(settings, 'clearOnBackground').name('clearOnBackground').onChange(update);
    gui.add(settings, 'selectedNodes').name('selectedNodes').listen().disable();
    gui.add(settings, 'selectedEdges').name('selectedEdges').listen().disable();

    update(); // sync plugin with initial settings

    canvas.on('selection:changed', ({ nodes, edges }: { nodes: any[]; edges: any[] }) => {
      settings.selectedNodes = nodes.length;
      settings.selectedEdges = edges.length;
    });
  },
};
