/**
 * Canvas/Nodes/Behaviours — Hover Activate
 *
 * Demonstrates the opt-in `HoverActivatePlugin` on a small force-laid-out
 * tree. Use the GUI panel to explore every option at runtime — `state`,
 * `inactiveState`, `degree`, `direction`, `enable`, `animation`.
 *
 * Hovering a node applies `state` to it (and its `degree`-hop neighbours
 * + connecting edges, when `degree > 0`). When `inactiveState` is set,
 * every other element receives that state instead.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  GraphDataPlugin,
  HoverActivatePlugin,
  type HoverableElement,
  type HoverDirection,
} from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { generateRandomTree } from '@invana/plugin-example-datasets';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = {
  title: 'Canvas/Nodes/Behaviours',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Applies a visual state to hovered elements. Supports multi-hop neighbour highlighting, inactive dimming, directional traversal, and hover callbacks.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const rawTree = generateRandomTree(16);
const GRAPH_DATA = {
  nodes: rawTree.nodes.map(n => ({
    id:          String(n.index),
    shape:       'circle' as const,
    size:        20,
    label:       `N${n.index}`,
    interactive: true,
  })),
  edges: rawTree.edges.map((e, i) => ({
    id:       `e${i}`,
    source:   String(e.source),
    target:   String(e.target),
    pathType: 'straight' as const,
  })),
};

export const HoverActivate: Story = {
  name: 'Hover Activate',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width:           container.clientWidth  || 1200,
      height:          container.clientHeight || 800,
      backgroundColor: '#0f172a',
    });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key:             'bg',
      type:            'pattern',
      patternType:     'dots',
      color:           '#1e293b',
      backgroundColor: '#0f172a',
      size:            1,
      spacing:         30,
    }));

    const graph = new GraphDataPlugin({ key: 'graph-data' });
    await canvas.plugins.register(graph);

    graph.setStyles({
      node: {
        fill:        () => '#3fcbeb',
        stroke:      () => '#ffffff',
        strokeWidth: () => 2,
      },
      edge: {
        stroke:      () => '#94a3b8',
        strokeWidth: () => 1.5,
      },
    });

    const layout = new D3ForceLayoutPlugin({
      charge:          -250,
      collisionRadius: 25,
      animate:         true,
      iterations:      300,
    });
    await canvas.plugins.register(layout);

    const hoverPlugin = new HoverActivatePlugin({
      state:      'active',
      degree:     1,
      direction:  'both',
      enable:     true,
      animation:  true,
      onHover:    (el: HoverableElement) => console.log('[hover-activate] hover:',    el.id),
      onHoverEnd: (el: HoverableElement) => console.log('[hover-activate] hoverEnd:', el.id),
    });
    await canvas.plugins.register(hoverPlugin);

    graph.setData(GRAPH_DATA);
    await layout.start();
    setTimeout(() => graph.fitContent(60), 1200);

    // ── lil-gui ────────────────────────────────────────────────────────────
    const params = {
      enable:        true,
      state:         'active',
      inactiveState: 'none',
      degree:        1,
      direction:     'both',
      animation:     true,
    };

    const gui = new GUI({ container, title: 'Hover Activate' });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    gui.add(params, 'enable').name('enable')
      .onChange((v: boolean) => hoverPlugin.setOptions({ enable: v }));

    gui.add(params, 'state', ['active', 'selected', 'highlight', 'hovered']).name('state')
      .onChange((v: string) => hoverPlugin.setOptions({ state: v }));

    gui.add(params, 'inactiveState', ['none', 'inactive', 'disabled']).name('inactiveState')
      .onChange((v: string) =>
        hoverPlugin.setOptions({ inactiveState: v === 'none' ? undefined : v }),
      );

    gui.add(params, 'degree', 0, 3, 1).name('degree')
      .onChange((v: number) => hoverPlugin.setOptions({ degree: v }));

    gui.add(params, 'direction', ['both', 'in', 'out']).name('direction')
      .onChange((v: string) => hoverPlugin.setOptions({ direction: v as HoverDirection }));

    gui.add(params, 'animation').name('animation (reserved)')
      .onChange((v: boolean) => hoverPlugin.setOptions({ animation: v }));
  },
};
