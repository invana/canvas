/**
 * **Whole-layer visibility.** `layer.setVisible(false / true)` hides/shows an
 * entire layer, repaints, and emits `scene:layer:visibilitychange { id, visible }`
 * on the canvas bus (logged below). Toggling the **graph** layer:
 *
 *   - blanks it *and* makes it **non-interactive** — hit-testing is suppressed, so
 *     clicks/hover over where it was hit nothing (not just invisible-but-clickable),
 *   - the **minimap** (a dependent layer) reacts automatically and blanks with it.
 *
 * Toggle the minimap independently to show each layer's `visible` is its own.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, MiniMapLayer } from '@invana/graph';
import type { GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Layer/LayerVisibility' };
export default meta;
type Story = StoryObj;

export const LayerVisibility: Story = {
  render: () => createContainer({ id: 'graph-layer-visibility' }),

  play: async ({ canvasElement }) => {
    const groupOf = (n: GraphNode): number =>
      (n.data as { group?: number } | undefined)?.group ?? 0;
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layer-visibility')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    const graph = new GraphLayer({ id: 'graph', options: { initData: data } });
    canvas.layers.add(graph);
    canvas.layers.add(
      new MiniMapLayer({ id: 'minimap', options: { graphLayerId: 'graph', backgroundLayerId: 'bg' } }),
    );

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const force = new D3ForceLayout({
      id: 'force',
      targetLayerId: 'graph',
      charge: { strength: -240 },
      link: { distance: 70 },
      animate: false,
    });
    canvas.layouts.add(force);
    onStoryTeardown(() => force.stop());

    await canvas.init({
      container,
      autoResize: true,
      config: {
        behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
        layers: {
          graph: {
            node: { style: { shape: { kind: 'circle', radius: 7 }, bgFill: 0x60a5fa } },
            edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1 } },
          },
        },
        activeLayout: 'force',
      },
    });

    const settings = {
      graphVisible: true,
      minimapVisible: true,
      lastEvent: '—',
    };

    const gui = new GUI({ title: 'Layer visibility' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'graphVisible').name('graph layer').onChange((v: boolean) => graph.setVisible(v));
    gui
      .add(settings, 'minimapVisible')
      .name('minimap layer')
      .onChange((v: boolean) => canvas.layers.get('minimap')?.setVisible(v));
    gui.add(settings, 'lastEvent').name('last bus event').listen().disable();

    onStoryTeardown(
      canvas.events.on('scene:layer:visibilitychange', ({ id, visible }) => {
        settings.lastEvent = `${id} → ${visible ? 'visible' : 'hidden'}`;
      }),
    );
  },
};
