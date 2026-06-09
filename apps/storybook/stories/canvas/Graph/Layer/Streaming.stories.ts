import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphEdge, type GraphNode } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Layer/Streaming' };
export default meta;
type Story = StoryObj;

/**
 * Streaming-data reference — every tick pushes a batch of add / update /
 * remove operations through `graph.store.applyDelta({...})`. Subscribers
 * (the renderer) see exactly one flush per tick regardless of batch size.
 *
 * The store is the source of truth; the layer orchestrates store →
 * renderer. CRUD methods live on `graph.store`:
 *
 * - `store.addNode` / `addEdge`        — strict add (throws on duplicate)
 * - `store.upsertNode` / `upsertEdge`  — add-or-merge (streaming-friendly)
 * - `store.updateNode` / `updateEdge`  — partial patch
 * - `store.removeNode` / `removeEdge`  — remove (node remove cascades incident edges)
 * - `store.addData({ nodes, edges })`  — append-style bulk add in one batch
 * - `store.applyDelta({ added, updated, removed })` — single-call streaming delta
 * - `store.batch(fn)` / `store.flush()` — batching + drain
 * - `store.clear()`                    — wipe everything
 *
 * `GraphLayer.setData(data)` is the only data-mutation method on the layer —
 * it's the destructive bulk-load ("load my graph"). For everything else
 * reach for the store directly.
 */
export const Streaming: Story = {
  render: () => createContainer({ id: 'graph-streaming' }),

  play: async ({ canvasElement }) => {
    const palette = [
      0x3b82f6, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-streaming')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The `bgFill`-by-group resolver is non-serialisable → it stays in the
    // constructor. Literal node/edge style lives in `canvasOptions` below.
    // Data is seeded + streamed at runtime (below), so there's no `initData`.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            // Resolver — colour follows the node's `data.group`, so a feed
            // only has to push `{ id, position, data: { group } }` and the
            // layer paints it for free. Same data shape covers initial seed,
            // upsert, and update.
            bgFill: (n: GraphNode) => {
              const group = (n.data as { group?: number } | undefined)?.group ?? 0;
              return palette[group % palette.length]!;
            },
          },
        },
      },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: { style: { shape: { kind: 'circle', radius: 7 }, bgStrokeColor: 0xffffff, bgStrokeWidth: 1 } },
          edge: { style: { strokeColor: 0x9ca3af, strokeWidth: 1, arrowTargetShape: 'none' } },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // World extent for random positions. Camera fits this box on first
    // frame so the user sees the whole playground regardless of zoom.
    const W = 800;
    const H = 600;
    const rand = (min: number, max: number): number => min + Math.random() * (max - min);
    const randInt = (n: number): number => Math.floor(Math.random() * n);
    const randomPos = (): { x: number; y: number } => ({
      x: rand(-W / 2, W / 2),
      y: rand(-H / 2, H / 2),
    });

    // Monotonic id allocator — easier than UUIDs and reads cleanly in
    // devtools. Every node we mint reuses these.
    let nodeSeq = 0;
    let edgeSeq = 0;
    const nextNodeId = (): string => `n-${nodeSeq++}`;
    const nextEdgeId = (): string => `e-${edgeSeq++}`;

    // Seed the layer with a small starting set so the streaming feed has
    // something to mutate from frame zero.
    const seed = (count: number): void => {
      const nodes: GraphNode[] = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          id: nextNodeId(),
          position: randomPos(),
          data: { group: randInt(palette.length) },
        });
      }
      const edges: GraphEdge[] = [];
      // Spanning-ish edges — every node except the first gets one edge
      // back to a random earlier node, giving the seed graph some structure.
      for (let i = 1; i < nodes.length; i++) {
        edges.push({
          id: nextEdgeId(),
          source: nodes[i]!.id,
          target: nodes[randInt(i)]!.id,
        });
      }
      // Destructive load is the layer-level convenience; everything else
      // (additions, updates, removals) goes through the store.
      graph.setData({ nodes, edges });
    };
    seed(40);
    canvas.camera.fitContent(graph.getBounds(), 80);

    // ─── Streaming tick ─────────────────────────────────────────────────
    // Each tick builds one `applyDelta` payload covering adds, updates,
    // and removes simultaneously. Subscribers see a single flush no matter
    // how many items the tick touched.
    const tick = (): void => {
      const liveNodeIds: string[] = [];
      for (const n of graph.store.nodes()) liveNodeIds.push(n.id);
      const liveEdgeIds: string[] = [];
      for (const e of graph.store.edges()) liveEdgeIds.push(e.id);

      const pick = <T>(arr: readonly T[]): T => arr[randInt(arr.length)]!;

      // Canonical state names a feed might push. Sampled when the
      // "include state" GUI toggle is on.
      const canonicalStates = [
        'hovered', 'selected', 'highlighted', 'dimmed', 'disabled',
      ] as const;

      // ADD — fresh nodes at random positions; sparse new edges anchored
      // to existing nodes so the renderer always finds both endpoints.
      // With `include state` on, each added node carries a random
      // canonical state in its payload — the renderer applies it
      // automatically without any setNodeState call.
      const addedNodes: GraphNode[] = [];
      for (let i = 0; i < settings.addNodes; i++) {
        addedNodes.push({
          id: nextNodeId(),
          position: randomPos(),
          data: { group: randInt(palette.length) },
          ...(settings.includeState
            ? { states: [pick(canonicalStates)] }
            : {}),
        });
      }
      const addedEdges: GraphEdge[] = [];
      if (liveNodeIds.length + addedNodes.length >= 2) {
        const pool = liveNodeIds.concat(addedNodes.map((n) => n.id));
        for (let i = 0; i < settings.addEdges; i++) {
          const s = pick(pool);
          const t = pick(pool);
          if (t === s) continue;
          addedEdges.push({ id: nextEdgeId(), source: s, target: t });
        }
      }

      // UPDATE — patch a random subset's group (which the resolver fills
      // colour from) and nudge their position so motion is visible.
      const updatedNodes: Array<{ id: string; patch: Partial<GraphNode> }> = [];
      for (let i = 0; i < settings.updateNodes && liveNodeIds.length > 0; i++) {
        const id = pick(liveNodeIds);
        const cur = graph.store.getPosition(id) ?? { x: 0, y: 0 };
        updatedNodes.push({
          id,
          patch: {
            position: {
              x: Math.max(-W / 2, Math.min(W / 2, cur.x + rand(-25, 25))),
              y: Math.max(-H / 2, Math.min(H / 2, cur.y + rand(-25, 25))),
            },
            data: { group: randInt(palette.length) },
          },
        });
      }

      // REMOVE — pick random ids to drop. Node removal cascade-removes
      // incident edges automatically (store-side default).
      const removedNodeIds: string[] = [];
      for (let i = 0; i < settings.removeNodes && liveNodeIds.length > 0; i++) {
        const id = pick(liveNodeIds);
        if (!removedNodeIds.includes(id)) removedNodeIds.push(id);
      }
      const removedEdgeIds: string[] = [];
      for (let i = 0; i < settings.removeEdges && liveEdgeIds.length > 0; i++) {
        const id = pick(liveEdgeIds);
        if (!removedEdgeIds.includes(id)) removedEdgeIds.push(id);
      }

      graph.store.applyDelta({
        added: { nodes: addedNodes, edges: addedEdges },
        updated: { nodes: updatedNodes },
        removed: { nodeIds: removedNodeIds, edgeIds: removedEdgeIds },
      });

      // Update live counters on the GUI (cheap — just text fields).
      stats.nodeCount = graph.store.nodeCount();
      stats.edgeCount = graph.store.edgeCount();
      stats.storeVersion = graph.store.version;
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    };

    // ─── GUI ────────────────────────────────────────────────────────────
    const settings = {
      tickMs: 250,
      addNodes: 3,
      addEdges: 4,
      updateNodes: 6,
      removeNodes: 1,
      removeEdges: 2,
      running: true,
      // When on, each added node carries `state: [name]` — the renderer
      // paints the state automatically (no imperative setNodeState).
      includeState: false,
    };
    const stats = {
      nodeCount: graph.store.nodeCount(),
      edgeCount: graph.store.edgeCount(),
      storeVersion: graph.store.version,
    };

    let timer: ReturnType<typeof setInterval> | null = null;
    const startTimer = (): void => {
      if (timer !== null) clearInterval(timer);
      timer = setInterval(() => {
        if (settings.running) tick();
      }, settings.tickMs);
    };
    onStoryTeardown(() => {
      if (timer !== null) clearInterval(timer);
    });
    startTimer();

    const gui = new GUI({ title: 'Streaming' });
    onStoryTeardown(() => gui.destroy());

    const rate = gui.addFolder('rate');
    rate.add(settings, 'tickMs', 60, 2000, 20).name('tick (ms)').onChange(startTimer);
    rate.add(settings, 'running').name('running');

    const add = gui.addFolder('add per tick');
    add.add(settings, 'addNodes', 0, 20, 1).name('nodes');
    add.add(settings, 'addEdges', 0, 20, 1).name('edges');
    add.add(settings, 'includeState').name('include state (data-driven)');

    const upd = gui.addFolder('update per tick').close();
    upd.add(settings, 'updateNodes', 0, 30, 1).name('nodes');

    const rem = gui.addFolder('remove per tick').close();
    rem.add(settings, 'removeNodes', 0, 10, 1).name('nodes');
    rem.add(settings, 'removeEdges', 0, 10, 1).name('edges');

    const reset = gui.addFolder('seed').close();
    reset.add({ reseed: () => seed(40) }, 'reseed').name('reseed (40 nodes)');
    reset.add({ clear: () => graph.store.clear() }, 'clear').name('clear store');

    const statsFolder = gui.addFolder('stats');
    statsFolder.add(stats, 'nodeCount').name('nodes').disable();
    statsFolder.add(stats, 'edgeCount').name('edges').disable();
    statsFolder.add(stats, 'storeVersion').name('store.version').disable();

    // Runtime mass-update — iterate the store and write per-node `style`
    // patches. State styling is layer-template-only in v3, but per-node
    // style.shape / style.bgFill can still be rewritten on the fly.
    const defaultsFolder = gui.addFolder('mass-update runtime').close();
    const uniformFill = { color: 0xfacc15 };
    const massUpdate = (patch: Record<string, unknown>): void => {
      graph.store.batch(() => {
        for (const n of graph.store.nodes()) {
          const existing = (n.style as Record<string, unknown> | undefined) ?? {};
          graph.store.updateNode(n.id, { style: { ...existing, ...patch } });
        }
      });
    };
    defaultsFolder
      .add(
        { uniform: () => massUpdate({ bgFill: uniformFill.color }) },
        'uniform',
      )
      .name('uniform fill (static)');
    defaultsFolder.addColor(uniformFill, 'color').name('uniform color');
    defaultsFolder
      .add(
        {
          byGroup: () =>
            graph.store.batch(() => {
              for (const n of graph.store.nodes()) {
                const group = (n.data as { group?: number } | undefined)?.group ?? 0;
                const existing = (n.style as Record<string, unknown> | undefined) ?? {};
                graph.store.updateNode(n.id, {
                  style: { ...existing, bgFill: palette[group % palette.length]! },
                });
              }
            }),
        },
        'byGroup',
      )
      .name('by-group fill (per-node)');
    defaultsFolder
      .add(
        { biggerNodes: () => massUpdate({ shape: { kind: 'circle', radius: 12 } }) },
        'biggerNodes',
      )
      .name('size: 24');
    defaultsFolder
      .add(
        { smallerNodes: () => massUpdate({ shape: { kind: 'circle', radius: 7 } }) },
        'smallerNodes',
      )
      .name('size: 14');
  },
};
