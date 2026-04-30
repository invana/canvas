/**
 * MiniMapPlugin — bird's-eye overview with a draggable viewport indicator.
 *
 * The minimap renders all graph-data nodes/edges into a small overlay in the
 * corner of the canvas. Click to jump the camera; drag the indicator to pan
 * continuously. Use the lil-gui panel (top-right) to live-tweak every option.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  GraphDataPlugin,
  MiniMapPlugin,
  type MiniMapPosition,
} from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { generateRandomTree } from '@invana/plugin-example-datasets';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = {
  title: 'Plugins/MiniMap',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

// ─── data ────────────────────────────────────────────────────────────────────
const rawTree = generateRandomTree(60);
const GRAPH_DATA = {
  nodes: rawTree.nodes.map((n) => ({
    id:    String(n.index),
    shape: 'circle' as const,
    size:  14,
    label: `N${n.index}`,
  })),
  edges: rawTree.edges.map((e, i) => ({
    id:       `e${i}`,
    source:   String(e.source),
    target:   String(e.target),
    pathType: 'straight' as const,
  })),
};

// ─── story ───────────────────────────────────────────────────────────────────
export const MiniMap: Story = {
  name: 'MiniMap',
  render: () => createContainer({ id: 'plugin-minimap' }),
  play: async () => {
    const container = document.getElementById('plugin-minimap');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width:  container.clientWidth  || 1200,
      height: container.clientHeight || 800,
      backgroundColor: '#0b1220',
    });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg',
      type: 'pattern',
      patternType: 'dots',
      color: '#1e293b',
      backgroundColor: '#0b1220',
      size: 1,
      spacing: 30,
    }));

    const graph = new GraphDataPlugin({ key: 'graph-data' });
    await canvas.plugins.register(graph);
    graph.setStyles({
      node: {
        fill:        () => '#4fc3f7',
        stroke:      () => '#0b1220',
        strokeWidth: () => 1.5,
      },
      edge: {
        stroke:      () => '#334155',
        strokeWidth: () => 1,
      },
    });
    graph.setData(GRAPH_DATA);

    const layout = new D3ForceLayoutPlugin({
      charge: -200, collisionRadius: 25, animate: true, iterations: 300,
    });
    await canvas.plugins.register(layout);
    await layout.start();

    const minimap = new MiniMapPlugin({
      width:               280,
      height:              180,
      position:            'bottom-right',
      padding:             18,
      backgroundColor:     0x0b1220,
      viewportFill:        0x4a90d9,
      viewportStroke:      0x2a70b9,
      viewportFillAlpha:   0.3,
      viewportStrokeWidth: 2,
      enableDrag:          true,
    });
    await canvas.plugins.register(minimap);

    // Refresh bounds once the layout has produced positions.
    setTimeout(() => minimap.refresh(), 800);

    // ── lil-gui panel ────────────────────────────────────────────────────────
    const state = {
      width:               280,
      height:              180,
      position:            'bottom-right' as MiniMapPosition,
      padding:             18,
      backgroundColor:     '#0b1220',
      viewportFill:        '#4a90d9',
      viewportStroke:      '#2a70b9',
      viewportFillAlpha:   0.3,
      viewportStrokeWidth: 2,
      enableDrag:          true,
      visible:             true,
      refresh:             () => minimap.refresh(),
    };

    const hexToNum = (h: string): number => parseInt(h.replace('#', ''), 16);
    const apply = () => minimap.setOptions({
      width:               state.width,
      height:              state.height,
      position:            state.position,
      padding:             state.padding,
      backgroundColor:     hexToNum(state.backgroundColor),
      viewportFill:        hexToNum(state.viewportFill),
      viewportStroke:      hexToNum(state.viewportStroke),
      viewportFillAlpha:   state.viewportFillAlpha,
      viewportStrokeWidth: state.viewportStrokeWidth,
      enableDrag:          state.enableDrag,
    });

    const gui = new GUI({ title: 'MiniMap', width: 260 });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
    container.appendChild(gui.domElement);

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder.add(state, 'width',   100, 500, 10).onChange(apply);
    layoutFolder.add(state, 'height',   80, 400, 10).onChange(apply);
    layoutFolder.add(state, 'position', ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange(apply);
    layoutFolder.add(state, 'padding',  0, 200, 1).onChange(apply);

    const colorFolder = gui.addFolder('Colors');
    colorFolder.addColor(state, 'backgroundColor').onChange(apply);
    colorFolder.addColor(state, 'viewportFill').onChange(apply);
    colorFolder.addColor(state, 'viewportStroke').onChange(apply);
    colorFolder.add(state, 'viewportFillAlpha',   0, 1, 0.05).onChange(apply);
    colorFolder.add(state, 'viewportStrokeWidth', 0, 8, 0.5).onChange(apply);

    const behaviorFolder = gui.addFolder('Behavior');
    behaviorFolder.add(state, 'enableDrag').onChange(apply);
    behaviorFolder.add(state, 'visible').onChange((v: boolean) => v ? minimap.show() : minimap.hide());
    behaviorFolder.add(state, 'refresh').name('refresh()');
  },
};
