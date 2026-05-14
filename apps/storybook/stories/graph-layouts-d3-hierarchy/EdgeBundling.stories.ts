import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  GraphLayer,
  HoverActivateBehaviour,
  LabelResolutionLODBehaviour,
  type NodeLabelHint,
} from '@invana/graph';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { flareImportsAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'graph-layouts/d3-hierarchy/EdgeBundling' };
export default meta;
type Story = StoryObj;

export const EdgeBundling: Story = {
  render: () => createContainer({ id: 'graph-edge-bundling' }),

  play: async ({ canvasElement }) => {
    // ── Settings ─────────────────────────────────────────────────────────
    //
    // `beta` is the bundle tension d3-shape calls `curveBundle.beta(β)` —
    // higher pulls the curve toward the hierarchy ancestor path; lower
    // straightens edges toward the chord. 0.85 is the d3 demo default.
    const settings = {
      radius: 480,
      beta: 0.85,
      edgeAlpha: 0.45,
      edgeStrokeWidth: 0.7,
      leafSize: 3,
      showLabels: true,
      labelFontSize: 9,
      hoverDegree: 1,
      sharpLabelsOnZoom: true,
    };

    // ── Build flare graph + synthetic imports ───────────────────────────
    //
    // `flareImportsAsGraph` returns the same node set as `flareAsGraph` plus
    // two edge sets: tree (parent→child, fed to the radial-cluster layout)
    // and import (leaf→leaf, rendered as bundled curves). Inner-node
    // positions from the layout double as the control points for the
    // bundle curves, so we keep inner nodes in the graph but invisible.
    const { nodes: rawNodes, treeEdges, importEdges } = flareImportsAsGraph();

    // Lookups we'll need both before and after the layout runs.
    const leafIds = new Set<string>();
    const nameById = new Map<string, string>();
    for (const n of rawNodes) {
      nameById.set(n.id, n.data.name);
      if (n.data.isLeaf) leafIds.add(n.id);
    }

    // Render hints: leaves are visible dots; inner nodes are positioned by
    // the layout (we need their coords for the bundle path) but painted
    // invisible — the d3 demo only shows class names on the rim.
    const nodes = rawNodes.map((n) => ({
      id: n.id,
      data: n.data.isLeaf
        ? {
            shape: 'circle' as const,
            size: settings.leafSize,
            fill: 0x1f2937,
            stroke: false as const,
          }
        : {
            shape: 'circle' as const,
            size: 0,
            fill: false as const,
            stroke: false as const,
            alpha: 0,
          },
    }));

    // Parent map for the LCA walk — built once from the tree edges so the
    // per-import-edge waypoint computation is O(depth).
    const parentOf = new Map<string, string>();
    for (const e of treeEdges) parentOf.set(e.target, e.source);

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-bundling')!;
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
          color: { light: '#f8fafc', dark: '#0b1220' },
          mode: 'auto',
        },
      }),
    );

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        nodeDefaults: { shape: 'circle', size: settings.leafSize, stroke: false },
        edgeDefaults: {
          stroke: 0x94a3b8,
          strokeWidth: settings.edgeStrokeWidth,
          alpha: settings.edgeAlpha,
          arrow: false,
          pathType: 'bundle',
          // `center` (vs `boundary`) so endpoints sit on the leaf centre —
          // matters because the bundle curve uses the chord between
          // endpoints as its β=0 baseline, and we want that chord to start
          // at the leaf position the layout assigned, not at a trimmed
          // boundary point that depends on the leaf glyph's size.
          anchor: 'center',
        },
      },
    });
    canvas.layers.add(graph);

    // Active / inactive state palettes — the hover behaviour swaps these on
    // hovered leaves and their 1-hop neighbours, dimming the rest.
    graph.setNodeStateConfig('active', { fill: 0xf97316, stroke: 0xf97316, strokeWidth: 1 });
    graph.setEdgeStateConfig('active', { stroke: 0xf97316, strokeWidth: 1.5, alpha: 0.95 });
    graph.setNodeStateConfig('inactive', { alpha: 0.18 });
    graph.setEdgeStateConfig('inactive', { alpha: 0.08 });

    const labelResolutionLOD = new LabelResolutionLODBehaviour({
      id: 'label-resolution',
      layerId: 'graph',
      enabled: settings.sharpLabelsOnZoom,
    });
    canvas.behaviours.register(labelResolutionLOD);

    let layout: D3HierarchyLayout | null = null;

    /**
     * Walk `leaf` up to the root, collecting ids. Cached per leaf since the
     * LCA computation looks it up for every import edge incident on that
     * leaf (and many edges hit the same source).
     */
    const ancestorsCache = new Map<string, string[]>();
    const ancestorsOf = (id: string): string[] => {
      const cached = ancestorsCache.get(id);
      if (cached) return cached;
      const out: string[] = [];
      let cur: string | undefined = id;
      while (cur) {
        out.push(cur);
        cur = parentOf.get(cur);
      }
      ancestorsCache.set(id, out);
      return out;
    };

    /**
     * Hierarchy waypoints for an import edge `a → b`, in the order the
     * bundle curve should traverse them:
     *
     *   `[a.parent, ..., LCA, ..., b.parent]`
     *
     * Endpoints `a` and `b` themselves are NOT included — the `straight`
     * router prepends source + appends target, so the final polyline the
     * pathStyle sees is `[a, ...waypoints, b]`.
     *
     * Each id is replaced with its post-layout `(x, y)` from the store.
     * Inner nodes have positions even though they're invisible.
     */
    const bundleWaypoints = (a: string, b: string): { x: number; y: number }[] => {
      const A = ancestorsOf(a);
      const B = ancestorsOf(b);

      // Walk from the *root* end of both ancestor chains; the LCA is the
      // last shared id before they diverge.
      let i = A.length - 1;
      let j = B.length - 1;
      while (i >= 0 && j >= 0 && A[i] === B[j]) {
        i--;
        j--;
      }
      // After the loop A[i+1] === B[j+1] === LCA (both definitely exist —
      // any two nodes in a single tree share the root at minimum).
      const out: { x: number; y: number }[] = [];
      // a's parent chain up to and including the LCA.
      for (let k = 1; k <= i + 1; k++) {
        const pos = graph.store.getPosition(A[k]!);
        if (pos) out.push({ x: pos.x, y: pos.y });
      }
      // b's parent chain back down from the LCA's child to b's parent.
      for (let k = j; k >= 1; k--) {
        const pos = graph.store.getPosition(B[k]!);
        if (pos) out.push({ x: pos.x, y: pos.y });
      }
      return out;
    };

    /**
     * After the radial-cluster layout has positioned all nodes:
     *  1. attach a rotated label to each leaf (d3 demo style);
     *  2. swap the tree edges out for the import edges, each carrying its
     *     bundle waypoints and the `'bundle'` pathType in `edge.data`.
     */
    const applyLabelsAndBundles = (): void => {
      graph.store.batch(() => {
        // 1. Labels — only on leaves; inner nodes are invisible.
        for (const node of graph.store.nodes()) {
          if (!leafIds.has(node.id)) continue;
          const pos = graph.store.getPosition(node.id);
          if (!pos) continue;
          const r = Math.hypot(pos.x, pos.y);
          if (r < 1e-3) continue;

          const theta = Math.atan2(pos.y, pos.x);
          const isLeftHalf = pos.x < 0;
          // d3-radial-cluster's `text-anchor: start, dx: 6` trick: the leaf
          // sits at the *inner* end of the label, text reading outward. Pixi
          // has no text-anchor; instead we push the label's centroid past
          // the leaf by half the estimated text width (+ leaf radius + gap),
          // so after `rotation: theta` the inner edge of the rotated label
          // lands next to the leaf and the text extends outward.
          const name = nameById.get(node.id) ?? node.id;
          const estimatedHalfWidth = (name.length * settings.labelFontSize * 0.55) / 2;
          const radialDist = estimatedHalfWidth + settings.leafSize / 2 + 4;

          const baseData = node.data as Record<string, unknown>;
          if (!settings.showLabels) {
            if ('label' in baseData) {
              const next = { ...baseData };
              delete next.label;
              graph.store.updateNode(node.id, { data: next });
            }
            continue;
          }

          const label: NodeLabelHint = {
            content: {
              kind: 'text',
              text: name,
              fontSize: settings.labelFontSize,
              fontWeight: 500,
              fill: 0x0f172a,
            },
            placement: 'center',
            offset: {
              x: radialDist * Math.cos(theta),
              y: radialDist * Math.sin(theta),
            },
            rotation: isLeftHalf ? theta + Math.PI : theta,
          };
          graph.store.updateNode(node.id, { data: { ...baseData, label } });
        }

        // 2. Drop tree edges. Iterate a snapshot of ids — removeEdge
        //    mutates the adjacency views.
        const existingIds: string[] = [];
        for (const e of graph.store.edges()) existingIds.push(e.id);
        for (const id of existingIds) graph.store.removeEdge(id);

        // 3. Add bundled import edges. Each carries its hierarchy
        //    waypoints + `pathType: 'bundle'` so GraphLayer routes via the
        //    `straight` router + `bundle` pathStyle.
        const bundleOpts = { beta: settings.beta };
        for (const e of importEdges) {
          if (!leafIds.has(e.source) || !leafIds.has(e.target)) continue;
          const waypoints = bundleWaypoints(e.source, e.target);
          graph.store.addEdge({
            id: e.id,
            source: e.source,
            target: e.target,
            data: {
              pathType: 'bundle',
              pathStyleOpts: bundleOpts,
              waypoints,
              alpha: settings.edgeAlpha,
              strokeWidth: settings.edgeStrokeWidth,
              arrow: false,
              anchor: 'center',
            },
          });
        }
      });
    };

    /**
     * Re-style only — used by GUI sliders that don't need a full re-layout
     * (alpha, beta, stroke width). Updates per-edge `pathStyleOpts.beta`
     * and the visual params in-place.
     */
    const restyleEdges = (): void => {
      const bundleOpts = { beta: settings.beta };
      graph.store.batch(() => {
        for (const e of graph.store.edges()) {
          const base = (e.data as Record<string, unknown> | undefined) ?? {};
          graph.store.updateEdge(e.id, {
            data: {
              ...base,
              pathStyleOpts: bundleOpts,
              alpha: settings.edgeAlpha,
              strokeWidth: settings.edgeStrokeWidth,
            },
          });
        }
      });
    };

    // ── Run layout ────────────────────────────────────────────────────────
    const run = async (): Promise<void> => {
      layout?.stop();
      ancestorsCache.clear();
      graph.setData({ nodes, edges: treeEdges });

      layout = new D3HierarchyLayout({
        mode: 'radial-cluster',
        radius: settings.radius,
      });
      await layout.apply(graph);

      applyLabelsAndBundles();
      canvas.camera.fitContent(graph.getBounds(), 80);
    };

    await run();
    onStoryTeardown(() => layout?.stop());

    // Hover registers *after* the graph layer is mounted; the behaviour
    // resolves its target layer at register-time.
    const hover = new HoverActivateBehaviour({
      id: 'hover',
      layerId: 'graph',
      enabled: true,
      state: 'active',
      // inactiveState: 'inactive',
      degree: settings.hoverDegree,
      direction: 'both',
    });
    canvas.behaviours.register(hover);

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'EdgeBundling' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder.add(settings, 'radius', 200, 900, 10).onChange(run);

    const curve = gui.addFolder('Curve');
    curve.add(settings, 'beta', 0, 1, 0.01).name('β (bundle tension)').onChange(restyleEdges);
    curve.add(settings, 'edgeAlpha', 0.05, 1, 0.01).onChange(restyleEdges);
    curve.add(settings, 'edgeStrokeWidth', 0.2, 3, 0.1).onChange(restyleEdges);

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(run);
    labels.add(settings, 'labelFontSize', 6, 18, 1).onChange(run);
    labels
      .add(settings, 'sharpLabelsOnZoom')
      .name('Sharp on zoom')
      .onChange((on: boolean) => (on ? labelResolutionLOD.enable() : labelResolutionLOD.disable()));

    const interaction = gui.addFolder('Hover');
    interaction
      .add(settings, 'hoverDegree', 1, 4, 1)
      .name('neighbour hops')
      .onChange((n: number) => hover.setOptions({ degree: n }));

    gui
      .add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit')
      .name('Re-fit camera');
  },
};
