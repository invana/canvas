/**
 * Canvas/Nodes/Behaviours — Brush Select
 *
 * Demonstrates the opt-in `BrushSelectPlugin` on a small force-laid-out tree.
 * Hold the configured `trigger` modifier and drag on the canvas background to
 * draw a selection rectangle — every shape (and optionally connector) enclosed
 * is unioned into the selection. Cooperates with `ClickSelectPlugin` when both
 * are registered.
 *
 * Use the GUI panel to flip every option at runtime — `trigger`, `immediately`,
 * `clearOnBackground`, and the `enableElements` toggles for shapes/connectors.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  GraphDataPlugin,
  ClickSelectPlugin,
  BrushSelectPlugin,
  type BrushModifierKey,
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
          'Click-and-drag rectangular selection on the canvas background. Unions enclosed shapes (and optionally connectors) with the existing selection. Cooperates with ClickSelectPlugin when both are registered.',
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
    id:          `e${i}`,
    source:      String(e.source),
    target:      String(e.target),
    pathType:    'straight' as const,
    interactive: true,
  })),
};

export const BrushSelect: Story = {
  name: 'Brush Select',
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

    // Click-select pairs nicely with the brush — selecting a node and then
    // shift-dragging extends the selection through the same store.
    const clickSelect = new ClickSelectPlugin({
      multiple:          true,
      trigger:           ['shift'],
      state:             'selected',
      clearOnBackground: false, // brush owns background-clear behaviour here
    });
    await canvas.plugins.register(clickSelect);

    const brush = new BrushSelectPlugin({
      trigger:           ['shift'],
      enableElements:    ['shape', 'connector'],
      immediately:       false,
      clearOnBackground: true,
      onSelect:          snap => console.log('[brush-select] selection:', snap),
    });
    await canvas.plugins.register(brush);

    graph.setData(GRAPH_DATA);
    await layout.start();
    setTimeout(() => graph.fitContent(60), 1200);

    // ── lil-gui ────────────────────────────────────────────────────────────
    const params = {
      trigger:            'shift' as 'none' | BrushModifierKey,
      immediately:        false,
      clearOnBackground:  true,
      enableShapes:       true,
      enableConnectors:   true,
      selectedShapes:     0,
      selectedConnectors: 0,
    };

    const gui = new GUI({ container, title: 'Brush Select' });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const sync = () => {
      const trigger: BrushModifierKey[] =
        params.trigger === 'none' ? [] : [params.trigger];
      const enableElements: Array<'shape' | 'connector'> = [];
      if (params.enableShapes)     enableElements.push('shape');
      if (params.enableConnectors) enableElements.push('connector');
      brush.setOptions({
        trigger,
        immediately:       params.immediately,
        clearOnBackground: params.clearOnBackground,
        enableElements,
      });
      // Keep ClickSelectPlugin's modifier in lockstep so shift-click still
      // multi-selects when the brush trigger changes.
      clickSelect.setOptions({ trigger: trigger });
    };

    gui.add(params, 'trigger', ['none', 'shift', 'control', 'alt', 'meta'])
      .name('trigger (modifier)').onChange(sync);
    gui.add(params, 'immediately').name('immediately').onChange(sync);
    gui.add(params, 'clearOnBackground').name('clearOnBackground').onChange(sync);
    gui.add(params, 'enableShapes').name('select shapes').onChange(sync);
    gui.add(params, 'enableConnectors').name('select connectors').onChange(sync);

    gui.add(params, 'selectedShapes').name('selected shapes').listen().disable();
    gui.add(params, 'selectedConnectors').name('selected connectors').listen().disable();

    clickSelect.store.on('selection:changed', snap => {
      params.selectedShapes     = snap.shapeIds.length;
      params.selectedConnectors = snap.connectorIds.length;
    });
  },
};
