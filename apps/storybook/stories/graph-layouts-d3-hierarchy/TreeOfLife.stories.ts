import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphLayer, LabelResolutionLODBehaviour, type NodeLabelHint } from '@invana/graph';
import { D3HierarchyLayout, type D3HierarchyLayoutMode } from '@invana/graph-layout-d3-hierarchy';
import { lifeTreeAsGraph, type LifeTreeKingdom } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'graph-layouts/d3-hierarchy/TreeOfLife' };
export default meta;
type Story = StoryObj;

export const TreeOfLife: Story = {
  render: () => createContainer({ id: 'graph-tree-of-life' }),

  play: async ({ canvasElement }) => {
    // d3's tree-of-life uses radial-cluster so every species sits on the outer
    // rim regardless of subtree depth — that's what produces the recognisable
    // circular "fan" with labels reading outward.
    //
    // Colours follow d3.schemeCategory10[0..2]: steel-blue / orange / green,
    // mapped to the three domains of life. Internal node circles and the
    // edges entering them inherit the same colour as the kingdom they sit in,
    // so each domain reads as a coherent sub-fan.
    const KINGDOM_COLOR: Record<LifeTreeKingdom, number> = {
      Bacteria: 0x1f77b4, // schemeCategory10[0]
      Eukaryota: 0xff7f0e, // schemeCategory10[1]
      Archaea: 0x2ca02c, // schemeCategory10[2]
    };
    /** Fallback for the two pre-domain wrapper nodes (root, root's child). */
    const UNCLASSIFIED_COLOR = 0x94a3b8;

    const settings = {
      mode: 'radial-cluster' as D3HierarchyLayoutMode,
      // 145 leaves want enough perimeter arc to keep their labels apart.
      // 540 ≈ what d3's example uses (`outerRadius - 170`) for a tight read.
      radius: 540,
      edgeAlpha: 0.85,
      edgeStrokeWidth: 1,
      leafNodeSize: 2.5,
      internalNodeSize: 1.5,
      showLabels: true,
      labelFontSize: 8,
      // Sharp glyph textures past a zoom threshold — same trick the other
      // hierarchy stories use; relevant here because the dataset has 145
      // 8-12 char labels that go soft when over-magnified.
      sharpLabelsOnZoom: true,
    };

    // ── Build graph data from the parsed Newick tree ──────────────────────
    //
    // Node colour comes from the kingdom field stashed on every flattened
    // node. Edge colour matches the *target* node's kingdom, so the colour
    // travels along the link into its subtree (d3 does the same with
    // `--color: <category>` on each link element).
    //
    // We can't bake labels into nodeDefaults here for the same reason as
    // RadialTree: each leaf's text rotation depends on its (x, y) in the
    // finished radial layout, so the label hint is applied *after*
    // `layout.apply()`. See {@link applyRadialLabels} below.
    const kingdomOf = new Map<string, LifeTreeKingdom | undefined>();
    const nodeMeta = new Map<string, { name: string; isLeaf: boolean }>();

    const buildGraphData = () => {
      const data = lifeTreeAsGraph();
      kingdomOf.clear();
      nodeMeta.clear();
      for (const n of data.nodes) {
        kingdomOf.set(n.id, n.data.kingdom);
        nodeMeta.set(n.id, { name: n.data.name, isLeaf: n.data.isLeaf });
      }
      const colorFor = (k: LifeTreeKingdom | undefined): number =>
        k ? KINGDOM_COLOR[k] : UNCLASSIFIED_COLOR;
      return {
        nodes: data.nodes.map((n) => ({
          id: n.id,
          data: {
            // Only leaves get a visible dot; internal clades shrink to a
            // near-invisible pip so the radial "lines" dominate the read.
            size: n.data.isLeaf ? settings.leafNodeSize : settings.internalNodeSize,
            fill: colorFor(n.data.kingdom),
            stroke: false as const,
          },
        })),
        edges: data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          // Per-edge stroke override — `EdgeRenderHints.stroke` on edge.data
          // wins over `edgeDefaults.stroke` in `resolveEdgeHints`.
          data: { stroke: colorFor(kingdomOf.get(e.target)) },
        })),
      };
    };

    /**
     * Place each *leaf* species name on the rim, rotated to read radially
     * outward. Internal-clade labels are intentionally suppressed — at 191
     * leaves any clade text would overplot the species names. Mirrors the
     * `text.attr("transform", d => ...)` block in d3's tree-of-life.
     *
     * The two-rotation trick (θ on the right half, θ + π on the left half)
     * keeps the baseline reading outward without anything ending up
     * upside-down.
     */
    const applyRadialLabels = (): void => {
      graph.store.batch(() => {
        for (const node of graph.store.nodes()) {
          const pos = graph.store.getPosition(node.id);
          const meta = nodeMeta.get(node.id);
          if (!pos || !meta) continue;

          const next = { ...(node.data as object) } as Record<string, unknown>;

          // Internal clades and the disabled-labels mode share the clear path.
          if (!settings.showLabels || !meta.isLeaf) {
            if ('label' in next) {
              delete next.label;
              graph.store.updateNode(node.id, { data: next });
            }
            continue;
          }

          const r = Math.hypot(pos.x, pos.y);
          if (r < 1e-3) continue;
          const theta = Math.atan2(pos.y, pos.x);
          const isLeftHalf = pos.x < 0;
          // d3-radial-cluster's `text-anchor: start, dx: 6` trick: the leaf
          // sits at the *inner* end of the rotated label, text reading
          // outward. Pixi has no text-anchor; push the centroid past the
          // leaf by half the estimated label width (+ leaf radius + gap)
          // so the inner edge of the rotated text lands next to the leaf.
          const displayName = meta.name.replace(/_/g, ' ');
          const estimatedHalfWidth = (displayName.length * settings.labelFontSize * 0.55) / 2;
          const radialDist = estimatedHalfWidth + settings.leafNodeSize / 2 + 4;

          const label: NodeLabelHint = {
            content: {
              kind: 'text',
              text: displayName,
              fontSize: settings.labelFontSize,
              fontWeight: 400,
              fill: 0x0f172a,
            },
            placement: 'center',
            offset: {
              x: radialDist * Math.cos(theta),
              y: radialDist * Math.sin(theta),
            },
            rotation: isLeftHalf ? theta + Math.PI : theta,
          };

          graph.store.updateNode(node.id, { data: { ...next, label } });
        }
      });
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-tree-of-life')!;
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
        nodeDefaults: { shape: 'circle', size: settings.leafNodeSize, stroke: false },
        edgeDefaults: {
          stroke: UNCLASSIFIED_COLOR,
          strokeWidth: settings.edgeStrokeWidth,
          alpha: settings.edgeAlpha,
          arrow: false,
          // `step-radial` matches d3's `linkStep` helper used by the canonical
          // Tree of Life example: a constant-radius arc along the parent's
          // tier, then a straight radial line out to the child. Produces the
          // boxy cluster-dendrogram fan you see in the d3 reference, where
          // each clade reads as a horizontal arc with straight outward spokes
          // — different from the smooth `bump-radial` used by RadialTree.
          pathType: 'step-radial',
          // `center` anchor so the tangent at each endpoint is the true
          // node-centre angle (radial-perfect). The leaf dots over-draw the
          // tail of the curve, so visually the edge still terminates at the
          // boundary.
          anchor: 'center',
        },
      },
    });
    canvas.layers.add(graph);

    const labelResolutionLOD = new LabelResolutionLODBehaviour({
      id: 'label-resolution',
      layerId: 'graph',
      enabled: settings.sharpLabelsOnZoom,
    });
    canvas.behaviours.register(labelResolutionLOD);

    let layout: D3HierarchyLayout | null = null;

    const run = async (): Promise<void> => {
      layout?.stop();
      graph.setData(buildGraphData());

      layout = new D3HierarchyLayout({
        mode: settings.mode,
        radius: settings.radius,
      });
      await layout.apply(graph);
      applyRadialLabels();
      canvas.camera.fitContent(graph.getBounds(), 80);
    };

    await run();
    onStoryTeardown(() => layout?.stop());

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'TreeOfLife' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder
      .add(settings, 'mode', ['radial-cluster', 'radial-tree'] satisfies D3HierarchyLayoutMode[])
      .onChange(run);
    layoutFolder.add(settings, 'radius', 200, 1200, 10).onChange(run);

    const style = gui.addFolder('Style');
    style.add(settings, 'leafNodeSize', 1, 8, 0.5).onChange(run);
    style.add(settings, 'internalNodeSize', 0, 6, 0.5).onChange(run);
    style.add(settings, 'edgeStrokeWidth', 0.2, 4, 0.1).onChange(run);
    style.add(settings, 'edgeAlpha', 0, 1, 0.05).onChange(run);

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(run);
    labels.add(settings, 'labelFontSize', 6, 16, 1).onChange(run);
    labels
      .add(settings, 'sharpLabelsOnZoom')
      .name('Sharp on zoom')
      .onChange((on: boolean) => (on ? labelResolutionLOD.enable() : labelResolutionLOD.disable()));

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit').name('Re-fit camera');
  },
};
