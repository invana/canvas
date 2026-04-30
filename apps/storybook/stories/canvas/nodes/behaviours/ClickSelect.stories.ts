/**
 * Canvas/Nodes/Behaviours — Click Select
 *
 * Demonstrates the opt-in `ClickSelectPlugin` on a small force-laid-out
 * tree. Use the GUI panel to explore every option at runtime — `enable`,
 * `multiple`, `trigger`, `degree`, `direction`, `state`, `unselectedState`,
 * `clearOnBackground`.
 *
 * Clicking a node selects it (applying `state`). With `multiple: true`,
 * holding the configured `trigger` modifier toggles additional elements
 * into the selection. When `degree > 0`, neighbours within N hops join
 * the selection. When `unselectedState` is set, every other element
 * receives that state. Clicking the empty background clears the
 * selection (when `clearOnBackground` is true).
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  GraphDataPlugin,
  ClickSelectPlugin,
  type SelectableElement,
  type SelectDirection,
  type SelectModifierKey,
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
          'Applies a visual state to clicked elements. Supports modifier-driven multi-select, multi-hop neighbour highlighting, dimming of unselected elements, directional traversal, clear-on-background, and selection callbacks.',
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

export const ClickSelect: Story = {
  name: 'Click Select',
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

    const clickSelect = new ClickSelectPlugin({
      enable:            true,
      multiple:          true,
      trigger:           ['shift'],
      degree:            1,
      direction:         'both',
      state:             'selected',
      unselectedState:   'muted',
      clearOnBackground: true,
      onSelect:          (el: SelectableElement) => console.log('[click-select] select:',   el.id, el.type),
      onDeselect:        (el: SelectableElement) => console.log('[click-select] deselect:', el.id, el.type),
      onSelectionChange: snap => console.log('[click-select] selection:', snap),
    });
    await canvas.plugins.register(clickSelect);

    graph.setData(GRAPH_DATA);
    await layout.start();
    setTimeout(() => graph.fitContent(60), 1200);

    // ── lil-gui ────────────────────────────────────────────────────────────
    const params = {
      enable:            true,
      multiple:          true,
      trigger:           'shift' as 'none' | SelectModifierKey,
      degree:            1,
      direction:         'both' as SelectDirection,
      state:             'selected',
      unselectedState:   'muted' as 'none' | 'muted' | 'inactive' | 'disabled',
      clearOnBackground: true,
      selectedShapes:    0,
      selectedConnectors: 0,
    };

    const gui = new GUI({ container, title: 'Click Select' });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    gui.add(params, 'enable').name('enable')
      .onChange((v: boolean) => clickSelect.setOptions({ enable: v }));

    gui.add(params, 'multiple').name('multiple')
      .onChange((v: boolean) => clickSelect.setOptions({ multiple: v }));

    gui.add(params, 'trigger', ['none', 'shift', 'control', 'alt', 'meta'])
      .name('trigger (modifier)')
      .onChange((v: 'none' | SelectModifierKey) =>
        clickSelect.setOptions({ trigger: v === 'none' ? [] : [v] }),
      );

    gui.add(params, 'degree', 0, 3, 1).name('degree (hops)')
      .onChange((v: number) => clickSelect.setOptions({ degree: v }));

    gui.add(params, 'direction', ['both', 'in', 'out']).name('direction')
      .onChange((v: string) => clickSelect.setOptions({ direction: v as SelectDirection }));

    gui.add(params, 'state', ['selected', 'active', 'highlighted'])
      .name('state')
      .onChange((v: string) => clickSelect.setOptions({ state: v }));

    gui.add(params, 'unselectedState', ['none', 'muted', 'inactive', 'disabled'])
      .name('unselectedState')
      .onChange((v: string) =>
        clickSelect.setOptions({ unselectedState: v === 'none' ? '' : v }),
      );

    gui.add(params, 'clearOnBackground').name('clearOnBackground')
      .onChange((v: boolean) => clickSelect.setOptions({ clearOnBackground: v }));

    gui.add(params, 'selectedShapes').name('selected shapes').listen().disable();
    gui.add(params, 'selectedConnectors').name('selected connectors').listen().disable();

    clickSelect.store.on('selection:changed', snap => {
      params.selectedShapes     = snap.shapeIds.length;
      params.selectedConnectors = snap.connectorIds.length;
    });
  },
};
