import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, GraphDataPlugin, PluginRegistry, type HoverActivatePlugin, type HoverDirection, type HoverableElement } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
import { generateRandomTree } from '@invana/example-datasets';
import { createContainer } from '../../src/div-utils';

PluginRegistry.register('layout-d3-force', D3ForceLayoutPlugin);

// ---------------------------------------------------------------------------
// Build a compact tree (~16 nodes) suitable for degree-highlight demos
// ---------------------------------------------------------------------------
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
  title: 'Plugins/Hover Activate',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Applies a visual state to hovered elements. Supports multi-hop neighbor highlighting, inactive dimming, directional traversal, and hover callbacks.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Story: full options explorer
// ---------------------------------------------------------------------------
export const HoverActivate: Story = {
  name: 'Hover Activate',
  render: () => createContainer({ id: 'plugin-hover-activate' }),
  play: async () => {
    const container = document.getElementById('plugin-hover-activate');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: false,
      plugins: [
        {
          plugin: 'hover-activate',
          key: 'hover-activate',
          options: {
            state: 'active',
            degree: 1,
            direction: 'both' as HoverDirection,
            neighborState: 'highlighted',
            hoverDelay: 0,
            enable: true,
            animation: true,
            onHover: (el: HoverableElement) => console.log('[hover-activate] hover:', el.id),
            onHoverEnd: (el: HoverableElement) => console.log('[hover-activate] hoverEnd:', el.id),
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
    //   linkDistance: 120,
      collisionRadius: 25,
      animate: true,
      iterations: 300,
    });
    await canvas.registerPlugin(layout);
    await layout.start();

    const hoverPlugin = canvas.getPlugin<HoverActivatePlugin>('hover-activate')!;

    // lil-gui (top-right)
    const params = {
      enable:        true,
      state:         'active',
      inactiveState: 'none',
      degree:        1,
      direction:     'both',
      neighborState: 'highlighted',
      hoverDelay:    0,
      animation:     true,
    };

    const gui = new GUI({ container, title: 'Options' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    gui.add(params, 'enable').name('enable')
      .onChange((v: boolean) => hoverPlugin.setOptions({ enable: v }));

    gui.add(params, 'state', ['active', 'selected', 'highlighted']).name('state')
      .onChange((v: string) => hoverPlugin.setOptions({ state: v }));

    gui.add(params, 'inactiveState', ['none', 'muted', 'highlighted']).name('inactiveState')
      .onChange((v: string) => hoverPlugin.setOptions({ inactiveState: v === 'none' ? undefined : v }));

    gui.add(params, 'neighborState', ['highlighted', 'active', 'selected']).name('neighborState')
      .onChange((v: string) => hoverPlugin.setOptions({ neighborState: v }));

    gui.add(params, 'degree', 0, 3, 1).name('degree')
      .onChange((v: number) => hoverPlugin.setOptions({ degree: v }));

    gui.add(params, 'direction', ['both', 'in', 'out']).name('direction')
      .onChange((v: string) => hoverPlugin.setOptions({ direction: v as HoverDirection }));

    gui.add(params, 'hoverDelay', 0, 500, 25).name('hoverDelay (ms)')
      .onChange((v: number) => hoverPlugin.setOptions({ hoverDelay: v }));

    gui.add(params, 'animation').name('animation (reserved)')
      .onChange((v: boolean) => hoverPlugin.setOptions({ animation: v }));
  },
};
 