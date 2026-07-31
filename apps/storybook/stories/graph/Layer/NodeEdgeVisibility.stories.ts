/**
 * First-class **per-element visibility** on nodes and edges. Select elements and
 * hide them, hide a whole community by predicate, or show everything again — and
 * watch that:
 *
 *   - hiding a **node** also removes its **incident edges** (the store's derived
 *     cascade — no per-edge bookkeeping, and the edges are *not* flagged hidden),
 *   - hidden elements are **culled**, not alpha-0 — clicking where a hidden node
 *     was hits nothing (hit-test excludes them),
 *   - a bulk hide is **one flush → one paint**, emitting one `node:visibility`
 *     per element (shown in the live event log).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ClickSelectBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import type { GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Layer/NodeEdgeVisibility' };
export default meta;
type Story = StoryObj;

export const NodeEdgeVisibilityStory: Story = {
  name: 'NodeEdgeVisibility',
  render: () => createContainer({ id: 'graph-node-edge-visibility' }),

  play: async ({ canvasElement }) => {
    const groupOf = (n: GraphNode): number =>
      (n.data as { group?: number } | undefined)?.group ?? 0;
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-edge-visibility')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: data } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'click-select', targetLayerId: 'graph' }));

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
        behaviours: { pan: { enabled: true }, zoom: { enabled: true }, 'click-select': { enabled: true, multiple: true } },
        layers: {
          graph: {
            node: { style: { shape: { kind: 'circle', radius: 7 }, bgFill: 0x60a5fa } },
            edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1 } },
          },
        },
        activeLayout: 'force',
      },
    });

    const select = canvas.behaviours.get<ClickSelectBehaviour>('click-select')!;

    const settings = {
      hiddenNodes: 0,
      hiddenEdges: 0,
      lastEvent: '—',
      hideSelected: () => {
        graph.store.batch(() => {
          graph.hideNodes(select.getSelectedShapeIds());
          graph.hideEdges(select.getSelectedConnectorIds());
        });
        select.clearSelection();
      },
      hideGroup0: () => graph.store.hideNodesByPredicate((n) => groupOf(n) === 0),
      showAll: () => graph.store.showAllHidden(),
    };

    const gui = new GUI({ title: 'Visibility' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'hideSelected').name('Hide selected');
    gui.add(settings, 'hideGroup0').name('Hide community 0 (predicate)');
    gui.add(settings, 'showAll').name('Show all');
    gui.add(settings, 'hiddenNodes').name('hidden nodes').listen().disable();
    gui.add(settings, 'hiddenEdges').name('hidden edges').listen().disable();
    gui.add(settings, 'lastEvent').name('last event').listen().disable();

    const refresh = (label: string): void => {
      settings.hiddenNodes = graph.store.hiddenNodeCount();
      settings.hiddenEdges = graph.store.hiddenEdgeCount();
      settings.lastEvent = label;
    };
    // Only explicit hide/show emit these — incident-edge auto-hide is derived
    // (no edge:visibility), which is exactly why hiding a node still drops its
    // edges from the picture without flooding the log.
    onStoryTeardown(graph.store.events.on('node:visibility', ({ nodeId, hidden }) => refresh(`node ${nodeId} → ${hidden ? 'hidden' : 'shown'}`)));
    onStoryTeardown(graph.store.events.on('edge:visibility', ({ edgeId, hidden }) => refresh(`edge ${edgeId} → ${hidden ? 'hidden' : 'shown'}`)));
  },
};
