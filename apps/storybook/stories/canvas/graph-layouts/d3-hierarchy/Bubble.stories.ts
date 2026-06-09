import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphCanvas, GraphLayer } from '@invana/graph';
import type { ShapeLabelStyle } from '@invana/canvas';
import {
  D3HierarchyLayout,
  type D3HierarchyLayoutOptions,
} from '@invana/graph-layout-d3-hierarchy';
import { flareAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { SystemThemeBehaviour } from '../../../system-theme';

const meta: Meta = { title: 'canvas/graph-layouts/d3-hierarchy/Bubble' };
export default meta;
type Story = StoryObj;

export const Bubble: Story = {
  render: () => createContainer({ id: 'graph-bubble' }),

  play: async ({ canvasElement }) => {
    // ── About ────────────────────────────────────────────────────────────
    // Mirrors https://observablehq.com/@d3/bubble-chart/2 — a "bubble chart"
    // is `d3.pack` applied to the Flare hierarchy where only the *leaves*
    // read visually, and each leaf is coloured by its top-level ancestor
    // (analytics, animate, data, display, flex, physics, query, scale, util,
    // vis). Internal nodes (root + sub-packages) are still computed by pack
    // so the enclosure math works, but they're drawn fully transparent.
    //
    // The d3 recipe:
    //   const root = d3.hierarchy(data).sum(d => d.value);
    //   d3.pack().size([w, h]).padding(3)(root);
    //   // colour leaves by d3.scaleOrdinal(d3.schemeTableau10) keyed on
    //   // the leaf's depth-1 ancestor name.
    // We mirror that — `D3HierarchyLayout` does `.sum`/`.sort` + `pack()`
    // configuration internally; `@invana/graph-datasets`'s `flareAsGraph()`
    // pre-computes the depth-1 ancestor name as `data.group` so we don't
    // have to walk the tree at render time.

    // ── Settings ─────────────────────────────────────────────────────────
    const settings = {
      leafStrokeWidth: 0,
      showLabels: true,
      // Initial font size handed to every leaf label. `'inside-center'`
      // placement runs shrink → truncate → hide against the bubble's
      // inner box, so this is an upper bound — small bubbles get a
      // smaller rendered size automatically.
      maxLabelFontSize: 14,
      // Skip the label entirely when the bubble is too small to fit any
      // readable text. The fit cascade also hides labels that can't make
      // it down to `minFontSize: 6`, but the diameter cutoff keeps the
      // d3-bubble-chart look (only "real" bubbles get labels at all).
      minLabelDiameter: 16,
    };

    // ── Categorical palette (d3.schemeTableau10) ─────────────────────────
    // Per-leaf fill is determined by its `group` (top-level Flare branch).
    const tableau10 = [
      0x4e79a7, 0xf28e2c, 0xe15759, 0x76b7b2, 0x59a14f,
      0xedc949, 0xaf7aa1, 0xff9da7, 0x9c755f, 0xbab0ab,
    ];

    // ── Build node/edge data from Flare ──────────────────────────────────
    // The full Flare graph — every internal node + every leaf, plus the
    // parent→child edges D3HierarchyLayout needs to derive the tree. The
    // per-leaf fill / stroke rides on each node's `style`, carried in as
    // initial content (`options.initData`).
    const buildGraphData = () => {
      const data = flareAsGraph();

      // Discover groups in first-seen order so the palette assignment is
      // stable across renders. Falls back to Flare's natural depth-1
      // ordering: analytics, animate, data, display, flex, physics,
      // query, scale, util, vis.
      const groups: string[] = [];
      for (const n of data.nodes) {
        const g = n.data.group;
        if (g && !groups.includes(g)) groups.push(g);
      }
      const colorFor = (group: string | undefined): number => {
        if (!group) return 0xffffff;
        const idx = groups.indexOf(group);
        return tableau10[idx % tableau10.length]!;
      };

      return {
        nodes: data.nodes.map((n) => {
          const isLeaf = n.data.isLeaf;
          return {
            id: n.id,
            data: {
              // Pack writes the real diameter onto `data.size` once it
              // runs — this is just a placeholder so nodes don't flash at
              // the default size during the initial load.
              size: 0.1,
              name: n.data.name,
              isLeaf,
              depth: n.data.depth,
              group: n.data.group,
              ...(n.data.value !== undefined ? { value: n.data.value } : {}),
            },
            style: {
              // Internal nodes (including the root) stay transparent so
              // only the leaf bubbles read visually, matching the d3
              // example. Leaves get the categorical fill.
              bgFill: isLeaf ? colorFor(n.data.group) : 0xffffff,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: isLeaf ? settings.leafStrokeWidth : 0,
              bgAlpha: isLeaf ? 1 : 0,
            },
          };
        }),
        edges: data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-bubble')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The `shape` resolver reads each node's packed `data.size`, so it can't
    // be serialised — it stays in the constructor. The transparent-edge
    // literal style goes to config.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: buildGraphData(),
        node: {
          style: {
            shape: (n) => {
              const size = (n.data as { size?: number } | undefined)?.size ?? 0.1;
              return { kind: 'circle', radius: size / 2 };
            },
          },
        },
      },
    });

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', layerId: 'bg' }));

    const layout = new D3HierarchyLayout({
      id: 'hierarchy',
      targetLayerId: 'graph',
    } as D3HierarchyLayoutOptions);
    canvas.layouts.add(layout);

    const canvasOptions = {
      layers: {
        bg: { type: 'solid', backgroundColor: '#0b1220' },
        graph: {
          edge: {
            // Bubble chart conveys grouping by enclosure, not links. Edges
            // are required by the layout (so it can derive the tree) but
            // rendered fully transparent.
            style: {
              strokeColor: 0x000000,
              strokeWidth: 0,
              strokeAlpha: 0,
              arrowTargetShape: 'none',
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
          dark: { backgroundColor: '#0b1220', color: '#475569' },
        },
      },
      layouts: {
        hierarchy: {
          mode: 'pack',
          size: [1000, 1000] as [number, number],
          padding: 3,
          // Default value accessor reads `data.value`; default sort is
          // descending by value. Both match d3's example, so no overrides.
        },
      },
      activeLayout: 'hierarchy',
    };

    /**
     * Centre a label inside every bubble — leaves *and* inner sub-package
     * nodes. The packed diameter is read off `style.shape.radius` —
     * `D3HierarchyLayout` writes the resolved size onto each node's shape
     * spec (see its `store.updateNode(id, { style: { shape: { kind: 'circle',
     * radius } } })` pack branch), so this has to run *after* the layout's
     * `end` event.
     *
     * `placement: 'inside-center'` carries the containment contract (see
     * [[feedback_label_placement_containment]]) — the LabelDecoration's
     * fit cascade shrinks the font until it fits inside the bubble's
     * inner box, truncates if shrinking hits `minFontSize`, and hides
     * the label entirely if even the truncated form won't fit. That makes
     * it safe to attach a label to every node and let the cascade decide
     * which ones actually render. The root ("flare") is skipped because
     * its label would just sit at the visual centre on top of every
     * leaf — informationally redundant.
     */
    const applyBubbleLabels = (): void => {
      graph.store.batch(() => {
        for (const node of graph.store.nodes()) {
          const data = node.data as {
            name?: string;
            isLeaf?: boolean;
            depth?: number;
          };
          const baseStyle = {
            ...((node.style as Record<string, unknown> | undefined) ?? {}),
          };
          // Always clear stale labels so re-runs (font size, settings
          // toggles) don't accumulate.
          delete (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle;
          const radius =
            (baseStyle.shape as { radius?: number } | undefined)?.radius ?? 0;
          const diameter = radius * 2;

          if (
            settings.showLabels &&
            (data.depth ?? 0) > 0 &&
            diameter >= settings.minLabelDiameter &&
            data.name
          ) {
            const labelStyle: ShapeLabelStyle = {
              content: {
                kind: 'text',
                text: data.name,
                fontSize: settings.maxLabelFontSize,
                fontWeight: 500,
                fill: 0x0f172a,
              },
              placement: 'inside-center',
              minFontSize: 6,
            };
            (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle = labelStyle;
          }

          graph.store.updateNode(node.id, { style: baseStyle });
        }
      });
    };

    // Labels are size-dependent (font scales with packed diameter), so they
    // have to be attached *after* the layout writes `data.size`. Wire it to
    // the layout's `end` event, then fit the camera — fires on the initial
    // auto-run and on every re-heat (`size` / `padding` edits).
    onStoryTeardown(
      layout.events.on('end', () => {
        applyBubbleLabels();
        canvas.camera.fitContent(graph.getBounds(), 40);
      }),
    );
    onStoryTeardown(() => layout.stop());

    // initData loads on mount; `activeLayout` runs itself once data is present.
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Bubble' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder
      .add(canvasOptions.layouts.hierarchy.size, '0', 200, 2000, 50)
      .name('size')
      .onChange((v: number) => {
        canvasOptions.layouts.hierarchy.size[1] = v;
        canvas.update({ layouts: { hierarchy: canvasOptions.layouts.hierarchy } });
      });
    layoutFolder
      .add(canvasOptions.layouts.hierarchy, 'padding', 0, 20, 0.5)
      .onChange(() =>
        canvas.update({ layouts: { hierarchy: canvasOptions.layouts.hierarchy } }),
      );

    const style = gui.addFolder('Style');
    // Per-leaf stroke rides on node `style`, so a width change re-feeds data;
    // the topology is unchanged but the styles refresh.
    style
      .add(settings, 'leafStrokeWidth', 0, 4, 0.5)
      .onChange(() => graph.setData(buildGraphData()));

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(applyBubbleLabels);
    labels.add(settings, 'maxLabelFontSize', 6, 32, 1).onChange(applyBubbleLabels);
    labels.add(settings, 'minLabelDiameter', 0, 80, 1).onChange(applyBubbleLabels);

    gui
      .add(
        { refit: () => canvas.camera.fitContent(graph.getBounds(), 40) },
        'refit',
      )
      .name('Re-fit camera');
  },
};
