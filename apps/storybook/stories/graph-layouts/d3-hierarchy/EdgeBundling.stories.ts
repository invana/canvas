import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphCanvas, GraphLayer, HoverActivateBehaviour, TextResolutionLODBehaviour, ThemeBehaviour } from '@invana/graph';
import type { ShapeLabelStyle } from '@invana/canvas';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { flareImportsAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-hierarchy/EdgeBundling' };
export default meta;
type Story = StoryObj;

export const EdgeBundlingStory: Story = {
  name: 'EdgeBundling',
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
      type: 'node',
      style: n.data.isLeaf
        ? {
            shape: { kind: 'circle' as const, radius: settings.leafSize / 2 },
            bgFill: 0x1f2937,
          }
        : {
            shape: { kind: 'circle' as const, radius: 0 },
            bgAlpha: 0,
          },
    }));

    // Parent map for the LCA walk — built once from the tree edges so the
    // per-import-edge waypoint computation is O(depth).
    const parentOf = new Map<string, string>();
    for (const e of treeEdges) parentOf.set(e.target, e.source);

    // ── Canvas setup — register everything, then init() last ─────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-bundling')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    const graph = new GraphLayer({
      id: 'graph',
      // Initial content rides on the layer: leaves start as the tree (the
      // import edges are swapped in after layout — see applyLabelsAndBundles).
      options: { initData: { nodes, edges: treeEdges } },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));

    const labelResolutionLOD = new TextResolutionLODBehaviour({
      id: 'label-resolution',
      targetLayerId: 'graph',
    });
    canvas.behaviours.register(labelResolutionLOD);

    // Hover resolves its target layer at register-time; the graph layer
    // already exists above.
    const hover = new HoverActivateBehaviour({
      id: 'hover',
      targetLayerId: 'graph',
    });
    canvas.behaviours.register(hover);

    // Kept mutable: `D3HierarchyLayout` reads its params at construction
    // (no live `setOptions`), so each GUI-driven re-layout rebuilds it.
    let layout = new D3HierarchyLayout({ mode: 'radial-cluster', radius: settings.radius });

    const canvasOptions = {
      layers: {
        bg: { type: 'solid', backgroundColor: '#f8fafc' },
        graph: {
          // Override the canonical `hovered` / `dimmed` defaults with the
          // brighter orange / heavier fade that reads on a dense bundling
          // diagram.
          node: {
            state: {
              hovered: { bgFill: 0xf97316, bgStrokeColor: 0xf97316, bgStrokeWidth: 1 },
              dimmed: { bgAlpha: 0.18 },
            },
          },
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: settings.edgeStrokeWidth,
              strokeAlpha: settings.edgeAlpha,
              arrowTargetShape: 'none',
              shape: {
                pathType: 'bundle',
                // `center` (vs `boundary`) so endpoints sit on the leaf centre.
                sourceAnchor: 'center',
                targetAnchor: 'center',
              },
            },
            state: {
              hovered: { strokeColor: 0xf97316, strokeWidth: 1.5, strokeAlpha: 0.95 },
              dimmed: { strokeAlpha: 0.08 },
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        hover: {
          enabled: true,
          state: 'hovered',
          // inactiveState: 'dimmed',
          degree: settings.hoverDegree,
          direction: 'both',
        },
        'label-resolution': { enabled: settings.sharpLabelsOnZoom },
        theme: {
          enabled: true,
          mode: 'system',
          light: { backgroundColor: '#f8fafc' },
          dark: { backgroundColor: '#0b1220' },
        },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

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

          const baseStyle = { ...(node.style ?? {}) };
          if (!settings.showLabels) {
            if ('labelStyle' in baseStyle) {
              delete (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle;
              graph.store.updateNode(node.id, { style: baseStyle });
            }
            continue;
          }

          const labelStyle: ShapeLabelStyle = {
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
          graph.store.updateNode(node.id, { style: { ...baseStyle, labelStyle } });
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
          graph.store.addEdge({ type: 'edge',
            id: e.id,
            source: e.source,
            target: e.target,
            style: {
              strokeAlpha: settings.edgeAlpha,
              strokeWidth: settings.edgeStrokeWidth,
              arrowTargetShape: 'none',
              shape: {
                pathType: 'bundle',
                pathStyleOpts: bundleOpts,
                waypoints,
                sourceAnchor: 'center',
                targetAnchor: 'center',
              },
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
          const baseStyle = (e.style as Record<string, unknown> | undefined) ?? {};
          const baseShape = (baseStyle.shape as Record<string, unknown> | undefined) ?? {};
          graph.store.updateEdge(e.id, {
            style: {
              ...baseStyle,
              strokeAlpha: settings.edgeAlpha,
              strokeWidth: settings.edgeStrokeWidth,
              shape: { ...baseShape, pathStyleOpts: bundleOpts },
            },
          });
        }
      });
    };

    // ── Run layout ───────────────────────────────────────────────────────
    // `D3HierarchyLayout` is one-shot synchronous and not yet wired for the
    // engine's `activeLayout` auto-run, so we drive it explicitly. The bundle
    // waypoints + rim labels are position-dependent, so they're applied after
    // the layout completes.
    const run = async (): Promise<void> => {
      layout.stop();
      ancestorsCache.clear();
      graph.setData({ nodes, edges: treeEdges });
      layout = new D3HierarchyLayout({ mode: 'radial-cluster', radius: settings.radius });
      await layout.apply(graph);
      applyLabelsAndBundles();
      canvas.camera.fitContent(graph.getBounds(), 80);
    };

    await run();
    onStoryTeardown(() => layout.stop());

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'EdgeBundling' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder.add(settings, 'radius', 200, 900, 10).onChange(() => void run());

    const curve = gui.addFolder('Curve');
    curve.add(settings, 'beta', 0, 1, 0.01).name('β (bundle tension)').onChange(restyleEdges);
    curve.add(settings, 'edgeAlpha', 0.05, 1, 0.01).onChange(restyleEdges);
    curve.add(settings, 'edgeStrokeWidth', 0.2, 3, 0.1).onChange(restyleEdges);

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(() => void run());
    labels.add(settings, 'labelFontSize', 6, 18, 1).onChange(() => void run());
    labels
      .add(settings, 'sharpLabelsOnZoom')
      .name('Sharp on zoom')
      .onChange((on: boolean) => (on ? labelResolutionLOD.enable() : labelResolutionLOD.disable()));

    const interaction = gui.addFolder('Hover');
    interaction
      .add(settings, 'hoverDegree', 1, 4, 1)
      .name('neighbour hops')
      .onChange((n: number) => canvas.update({ behaviours: { hover: { degree: n } } }));

    gui
      .add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit')
      .name('Re-fit camera');
  },
};
