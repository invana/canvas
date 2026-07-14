import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphCanvas, GraphLayer, TextResolutionLODBehaviour, ThemeBehaviour } from '@invana/graph';
import type { ShapeLabelStyle } from '@invana/canvas';
import {
  D3HierarchyLayout,
  type D3HierarchyLayoutMode,
  type D3HierarchyLayoutOptions,
} from '@invana/graph-layout-d3-hierarchy';
import type { LayoutOptions } from '@invana/canvas';
import { lifeTreeAsGraph, type LifeTreeKingdom } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph-layouts/d3-hierarchy/TreeOfLife' };
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
    // finished radial layout, so the label hint is applied *after* the active
    // layout settles. See {@link applyRadialLabels} below.
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
          style: {
            // Only leaves get a visible dot; internal clades shrink to a
            // near-invisible pip so the radial "lines" dominate the read.
            shape: {
              kind: 'circle' as const,
              radius: (n.data.isLeaf ? settings.leafNodeSize : settings.internalNodeSize) / 2,
            },
            bgFill: colorFor(n.data.kingdom),
          },
        })),
        edges: data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          // Per-edge stroke override — wins over the layer template's
          // `edge.style.strokeColor`.
          style: { strokeColor: colorFor(kingdomOf.get(e.target)) },
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

          const baseStyle = { ...(node.style ?? {}) };

          // Internal clades and the disabled-labels mode share the clear path.
          if (!settings.showLabels || !meta.isLeaf) {
            if ('labelStyle' in baseStyle) {
              delete (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle;
              graph.store.updateNode(node.id, { style: baseStyle });
            }
            continue;
          }

          const r = Math.hypot(pos.x, pos.y);
          if (r < 1e-3) continue;
          const theta = Math.atan2(pos.y, pos.x);
          const isLeftHalf = pos.x < 0;
          const displayName = meta.name.replace(/_/g, ' ');
          const estimatedHalfWidth = (displayName.length * settings.labelFontSize * 0.55) / 2;
          const radialDist = estimatedHalfWidth + settings.leafNodeSize / 2 + 4;

          const labelStyle: ShapeLabelStyle = {
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

          graph.store.updateNode(node.id, { style: { ...baseStyle, labelStyle } });
        }
      });
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    // Register layers / behaviours / layout by id, build one serialisable
    // `canvasOptions`, then `init()` last. Per-item node fills + per-edge
    // strokes ride on `initData`; the literal edge template lives in config.
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-tree-of-life')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: buildGraphData() },
    });

    canvas.layers.add(
      new BackgroundLayer({ id: 'bg', options: { type: 'solid' } }),
    );
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));

    const labelResolutionLOD = new TextResolutionLODBehaviour({
      id: 'label-resolution',
      targetLayerId: 'graph',
    });
    canvas.behaviours.register(labelResolutionLOD);

    const layout = new D3HierarchyLayout({
      id: 'radial',
      targetLayerId: 'graph',
    } as D3HierarchyLayoutOptions & LayoutOptions);
    canvas.layouts.add(layout);

    const canvasOptions = {
      layers: {
        bg: { type: 'solid', color: '#f8fafc' },
        graph: {
          edge: {
            style: {
              strokeColor: UNCLASSIFIED_COLOR,
              strokeWidth: settings.edgeStrokeWidth,
              strokeAlpha: settings.edgeAlpha,
              arrowTargetShape: 'none',
              shape: {
                // `step-radial` matches d3's `linkStep` helper.
                pathType: 'step-radial',
                sourceAnchor: 'center',
                targetAnchor: 'center',
              },
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: {
          enabled: true,
          mode: 'system',
          light: { backgroundColor: '#f8fafc', color: '#0f172a' },
          dark: { backgroundColor: '#0b1220', color: '#e5e7eb' },
        },
        'label-resolution': { enabled: settings.sharpLabelsOnZoom },
      },
      layouts: {
        radial: {
          mode: settings.mode,
          radius: settings.radius,
        },
      },
      activeLayout: 'radial',
    };

    // Once the active layout settles, attach the rim labels (their rotation
    // depends on each leaf's final (x, y)) and fit.
    onStoryTeardown(
      layout.events.on('end', () => {
        applyRadialLabels();
        canvas.camera.fitContent(graph.getBounds(), 80);
      }),
    );

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Rebuild the graph's content from `settings` and reload it. Used by the
    // GUI controls that change per-item data (node sizes, edge colours).
    const reloadData = (): void => {
      graph.setData(buildGraphData());
    };

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'TreeOfLife' });
    onStoryTeardown(() => gui.destroy());

    const pushLayout = (): void =>
      canvas.update({ layouts: { radial: canvasOptions.layouts.radial } });

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder
      .add(settings, 'mode', ['radial-cluster', 'radial-tree'] satisfies D3HierarchyLayoutMode[])
      .onChange((v: D3HierarchyLayoutMode) => {
        canvasOptions.layouts.radial.mode = v;
        pushLayout();
      });
    layoutFolder.add(settings, 'radius', 200, 1200, 10).onFinishChange((v: number) => {
      canvasOptions.layouts.radial.radius = v;
      pushLayout();
    });

    // Node sizes are baked per-item into the data.
    const style = gui.addFolder('Style');
    style.add(settings, 'leafNodeSize', 1, 8, 0.5).onChange(reloadData);
    style.add(settings, 'internalNodeSize', 0, 6, 0.5).onChange(reloadData);
    style.add(settings, 'edgeStrokeWidth', 0.2, 4, 0.1).onChange((v: number) => {
      canvasOptions.layers.graph.edge.style.strokeWidth = v;
      canvas.update({ layers: { graph: { edge: { style: { strokeWidth: v } } } } });
    });
    style.add(settings, 'edgeAlpha', 0, 1, 0.05).onChange((v: number) => {
      canvasOptions.layers.graph.edge.style.strokeAlpha = v;
      canvas.update({ layers: { graph: { edge: { style: { strokeAlpha: v } } } } });
    });

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(applyRadialLabels);
    labels.add(settings, 'labelFontSize', 6, 16, 1).onChange(applyRadialLabels);
    labels
      .add(settings, 'sharpLabelsOnZoom')
      .name('Sharp on zoom')
      .onChange((on: boolean) => (on ? labelResolutionLOD.enable() : labelResolutionLOD.disable()));

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit').name('Re-fit camera');
  },
};
