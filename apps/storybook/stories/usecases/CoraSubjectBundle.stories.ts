/**
 * **Cora — subject-bundled subset** — a lightweight (~75-node) slice of
 * the Cora citation network demonstrating `pathType: 'bundle'` over a
 * flat graph. Cora has no hierarchy of its own, so bundle has nothing
 * to ride on by default. Here the `subject` field on each paper plays
 * the role of "cluster" — nodes are hand-positioned in three regions
 * (one per subject) and every cross-subject edge routes through both
 * regions' centroids as bundle waypoints. The visual is the classic
 * scattered-blobs-joined-by-ribbons look from the screenshot.
 *
 * For the *dense* full-Cora view (no bundling — additive bezier
 * overlap), see `CoraCitationNetwork.stories.ts`. For the pathType
 * mechanics on a stripped-down example, see
 * `Graph/Edges/Types/Bundle.stories.ts`.
 *
 * Exercises: `bundle` pathStyle with explicit `waypoints` derived from
 * an external clustering signal (the `subject` field), per-edge route
 * decisions (intra-cluster = direct; inter-cluster = bundled through
 * centroids), static layout with no force simulation.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  type EdgeData,
  type GraphEdge,
  type NodeData,
} from '@invana/graph';
import { cora, type CoraNodeData } from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'Usecases/Cora Subject Bundle' };
export default meta;
type Story = StoryObj;

export const CoraSubjectBundle: Story = {
  render: () => createContainer({ id: 'usecase-cora-subject-bundle' }),

  play: async ({ canvasElement }) => {
    // Three of Cora's seven subjects — a triangle of clusters reads
    // cleaner than a row, and 3 inter-cluster channels (NN↔RL, NN↔GA,
    // RL↔GA) is enough to show the bundling without crowding.
    const FOCUS_SUBJECTS = [
      'Neural_Networks',
      'Reinforcement_Learning',
      'Genetic_Algorithms',
    ] as const;
    type FocusSubject = (typeof FOCUS_SUBJECTS)[number];

    // Hand-picked cluster centres — also serve as bundle waypoints.
    // The triangle keeps each pair of clusters visibly separated so
    // ribbons fan out instead of overlapping along a single corridor.
    const CENTROIDS: Record<FocusSubject, { x: number; y: number }> = {
      Neural_Networks:        { x:    0, y: -200 },
      Reinforcement_Learning: { x: -260, y:  140 },
      Genetic_Algorithms:     { x:  260, y:  140 },
    };

    const SUBJECT_FILL: Record<FocusSubject, number> = {
      Neural_Networks:        0x2563eb, // blue
      Reinforcement_Learning: 0xf59e0b, // amber
      Genetic_Algorithms:     0xec4899, // pink
    };

    const PER_SUBJECT = 25; // 75 nodes total — light enough to read
    const CLUSTER_RADIUS = 70;

    const settings = {
      beta: 0.85,
      edgeAlpha: 0.45,
      edgeWidth: 0.9,
      nodeRadius: 4,
      colorBySource: true,
    };

    // ── Subset the dataset ───────────────────────────────────────────────
    // Take the first PER_SUBJECT papers per focus subject. Keep edges
    // only when both endpoints survived the filter.
    const focusSet = new Set<string>(FOCUS_SUBJECTS);
    const buckets = new Map<FocusSubject, typeof cora.nodes[number][]>();
    for (const s of FOCUS_SUBJECTS) buckets.set(s, []);
    for (const n of cora.nodes) {
      if (!focusSet.has(n.data.subject)) continue;
      const bucket = buckets.get(n.data.subject as FocusSubject)!;
      if (bucket.length < PER_SUBJECT) bucket.push(n);
    }

    // Position nodes in a small radial scatter around each centroid so
    // they don't all stack at one point.
    const nodes: NodeData<CoraNodeData>[] = [];
    for (const [subject, papers] of buckets) {
      const c = CENTROIDS[subject];
      papers.forEach((p, i) => {
        // Two interleaved rings so 25 dots in ~70 world units doesn't
        // collide visually.
        const theta = (i / papers.length) * Math.PI * 2;
        const r = CLUSTER_RADIUS * (i % 2 === 0 ? 1 : 0.55);
        nodes.push({
          id: p.id,
          data: p.data,
          position: { x: c.x + r * Math.cos(theta), y: c.y + r * Math.sin(theta) },
        });
      });
    }

    const subjectById = new Map<string, FocusSubject>();
    for (const n of nodes) {
      if (!n.data) continue;
      subjectById.set(n.id, n.data.subject as FocusSubject);
    }

    // Decide per-edge waypoints: intra-cluster gets none (direct);
    // inter-cluster routes through both centroids so multiple edges
    // sharing the same cluster pair visually bundle together.
    const waypointsFor = (
      sourceId: string,
      targetId: string,
    ): ReadonlyArray<{ x: number; y: number }> => {
      const s = subjectById.get(sourceId)!;
      const t = subjectById.get(targetId)!;
      if (s === t) return [];
      return [CENTROIDS[s], CENTROIDS[t]];
    };

    const ids = new Set(nodes.map((n) => n.id));
    const edges: EdgeData[] = cora.edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: {},
        style: {
          shape: {
            pathType: 'bundle',
            sourceAnchor: 'center',
            targetAnchor: 'center',
            pathStyleOpts: { beta: settings.beta },
            waypoints: waypointsFor(e.source, e.target),
          },
        },
      }));

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#usecase-cora-subject-bundle',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    canvas.layers.add(
      new BackgroundLayer({
        id: 'bg',
        options: {
          type: 'solid',
          mode: 'auto',
          color: { light: '#ffffff', dark: '#0b1220' },
        },
      }),
    );

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: settings.nodeRadius },
            bgFill: (n) => {
              const d = n.data as CoraNodeData | undefined;
              return d ? SUBJECT_FILL[d.subject as FocusSubject] : 0x64748b;
            },
            bgAlpha: 0.95,
            bgStrokeWidth: 0,
          },
          state: {
            hovered: {
              bgStrokeColor: 0xfbbf24,
              bgStrokeWidth: 1.6,
              shape: { kind: 'circle', radius: settings.nodeRadius + 2 },
            },
          },
        },
        edge: {
          style: {
            shape: { pathType: 'bundle', sourceAnchor: 'center', targetAnchor: 'center' },
            // bgFill resolver doesn't run on edges — colour is per-edge
            // restamped in `restyleEdges` since it depends on the
            // source's subject.
            strokeWidth: settings.edgeWidth,
            strokeAlpha: settings.edgeAlpha,
            arrowTargetShape: 'none',
          },
          state: {
            highlighted: { strokeAlpha: 0.95, strokeWidth: settings.edgeWidth + 0.8 },
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new HoverActivateBehaviour({
        id: 'hover',
        layerId: 'graph',
        enabled: true,
        state: 'hovered',
        degree: 1,
        direction: 'both',
      }),
    );

    // ── Per-edge restyle (β, alpha, width, source-coloured strokes) ─────
    // Edge colour depends on the source node's subject — needs a
    // per-edge stamp rather than a layer-template resolver.
    const restyleEdges = (): void => {
      const pathStyleOpts = { beta: settings.beta };
      graph.store.batch(() => {
        for (const e of graph.store.edges() as IterableIterator<GraphEdge>) {
          const sourceSubject = subjectById.get(e.source);
          const stroke =
            settings.colorBySource && sourceSubject
              ? SUBJECT_FILL[sourceSubject]
              : 0x64748b;
          graph.store.updateEdge(e.id, {
            style: {
              shape: {
                pathType: 'bundle',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts,
                waypoints: waypointsFor(e.source, e.target),
              },
              strokeColor: stroke,
              strokeWidth: settings.edgeWidth,
              strokeAlpha: settings.edgeAlpha,
              arrowTargetShape: 'none',
            },
          });
        }
      });
    };
    restyleEdges();

    canvas.camera.fitContent(graph.getBounds(), 80);

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Cora — subject bundle' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'beta', 0, 1, 0.01).name('β (tension)').onChange(restyleEdges);
    gui.add(settings, 'edgeAlpha', 0.05, 1, 0.01).name('edge alpha').onChange(restyleEdges);
    gui.add(settings, 'edgeWidth', 0.3, 3, 0.1).name('edge width').onChange(restyleEdges);
    gui
      .add(settings, 'colorBySource')
      .name('colour by source subject')
      .onChange(restyleEdges);

    gui.add(
      { count: `${nodes.length} nodes / ${edges.length} edges` },
      'count',
    ).disable();

    gui
      .add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit')
      .name('Re-fit camera');
  },
};
