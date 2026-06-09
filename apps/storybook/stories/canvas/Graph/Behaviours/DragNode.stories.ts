/**
 * `DragNodeBehaviour` — drag a graph node and (optionally) pin it on release.
 *
 * The lil-gui panel surfaces every constructor option:
 *
 *   - `enabled` toggles the behaviour at runtime via `BehaviourRegistry.setEnabled`.
 *   - `pinOnRelease` flips the post-drag pin. When `true`, the released node
 *     gets `GraphNode.pinned = true` and `D3ForceLayout` holds it via `fx/fy`
 *     across future ticks; when `false`, the sim is free to nudge it again.
 *   - `dragCursor` is read at drag-start; changing it remounts the behaviour
 *     so the next gesture picks the new cursor.
 *   - `groupAware` matters only when the dragged node is itself a compound
 *     group. The lesMiserables dataset has no groups — left here for parity.
 *   - `filter` is demoed via a `filterMode` dropdown that maps to a real
 *     predicate (`'all' | 'even-only' | 'odd-only'`); odd-only means only
 *     nodes at odd indices can be grabbed.
 *
 * Pinned nodes are visualised through a layer-level `'is-pinned'` state
 * (orange stroke + outer halo) toggled in lockstep with the store's
 * `pinned` field. A `pinned` count + "Unpin all" button live next to the
 * options.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type DragNodeBehaviourOptions,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Behaviours/DragNode' };
export default meta;
type Story = StoryObj;

export const DragNode: Story = {
  render: () => createContainer({ id: 'graph-drag-node' }),

  play: async ({ canvasElement }) => {
    const GROUP_COLORS = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    const nodes: GraphNode[] = lesMiserables.nodes.map((n, index) => ({
      id: n.id,
      data: { group: n.data.group, index },
      style: {
        shape: { kind: 'circle', radius: 8 },
        bgFill: GROUP_COLORS[n.data.group % GROUP_COLORS.length],
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-drag-node')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: lesMiserables.edges },
        node: {
          // Custom layer-level state so a pinned node is unmistakable from
          // an un-pinned one. The state is toggled in the `node:update`
          // subscriber below whenever `patch.pinned` flips.
          state: {
            'is-pinned': {
              bgStrokeColor: 0xf97316,
              bgStrokeWidth: 3,
            },
          },
        },
      },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    const canvasOptions = {
      layers: {
        graph: {
          edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 0.8 } },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
      },
      layouts: {
        force: {
          charge: { strength: -150 },
          link: { distance: 55 },
          collide: { radius: 14 },
          center: { x: 0, y: 0 },
        },
      },
      activeLayout: 'force',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Mirror the store's `pinned` flag onto the layer's `is-pinned` state so
    // a pin gets an orange stroke (and unpin removes it).
    graph.store.events.on('node:update', ({ nodeId, patch }) => {
      if (!('pinned' in patch)) return;
      graph.store.setNodeState(nodeId, 'is-pinned', patch.pinned === true);
    });

    // ─── Behaviour wiring ─────────────────────────────────────────────────
    // The behaviour is rebuilt whenever an option that isn't `enabled` flips,
    // since `DragNodeBehaviourOptions` are read once in the constructor.
    // `enabled` itself routes through `setEnabled` so no remount is needed.
    const settings = {
      enabled: true,
      pinOnRelease: false,
      dragCursor: 'grabbing' as 'grabbing' | 'grab' | 'move' | 'crosshair' | 'none',
      groupAware: true,
      filterMode: 'all' as 'all' | 'even-only' | 'odd-only',
      pinnedCount: 0,
      unpinAll: () => {
        for (const n of graph.store.nodes()) {
          if (n.pinned) graph.store.setPinned(n.id, false);
        }
      },
    };

    const buildOptions = (): DragNodeBehaviourOptions => {
      const opts: DragNodeBehaviourOptions = {
        id: 'drag-node',
        targetLayerId: 'graph',
        enabled: settings.enabled,
        pinOnRelease: settings.pinOnRelease,
        dragCursor: settings.dragCursor,
        groupAware: settings.groupAware,
      };
      if (settings.filterMode === 'even-only') {
        opts.filter = (id: string): boolean => {
          const n = graph.store.getNode(id);
          return ((n?.data as { index?: number } | undefined)?.index ?? 0) % 2 === 0;
        };
      } else if (settings.filterMode === 'odd-only') {
        opts.filter = (id: string): boolean => {
          const n = graph.store.getNode(id);
          return ((n?.data as { index?: number } | undefined)?.index ?? 0) % 2 === 1;
        };
      }
      return opts;
    };

    const remount = (): void => {
      if (canvas.behaviours.has('drag-node')) canvas.behaviours.unregister('drag-node');
      canvas.behaviours.register(new DragNodeBehaviour(buildOptions()));
    };
    remount();

    // Keep the `pinned` counter in the GUI live.
    graph.store.events.on('node:update', ({ patch }) => {
      if (!('pinned' in patch)) return;
      let count = 0;
      for (const n of graph.store.nodes()) if (n.pinned) count++;
      settings.pinnedCount = count;
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    });

    // ─── lil-gui ──────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'DragNodeBehaviour' });
    onStoryTeardown(() => gui.destroy());

    gui
      .add(settings, 'enabled')
      .onChange((v: boolean) => canvas.behaviours.setEnabled('drag-node', v));
    gui.add(settings, 'pinOnRelease').onChange(remount);
    gui
      .add(settings, 'dragCursor', ['grabbing', 'grab', 'move', 'crosshair', 'none'])
      .onChange(remount);
    gui.add(settings, 'groupAware').onChange(remount);
    gui
      .add(settings, 'filterMode', ['all', 'even-only', 'odd-only'])
      .onChange(remount);
    gui.add(settings, 'pinnedCount').name('pinned (count)').disable();
    gui.add(settings, 'unpinAll').name('Unpin all');
  },
};
