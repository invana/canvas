import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphLayer } from '@invana/graph';
import type { ShapeLabelStyle } from '@invana/canvas';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { flareAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-hierarchy/Bubble' };
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
      size: 1000,
      padding: 3,
      leafStrokeWidth: 0,
      showLabels: true,
      // Cap: even huge bubbles never use a font larger than this. Keeps the
      // outliers (e.g. "FlareVis" if it ever appeared) from drowning out the
      // surrounding bubbles' labels.
      maxLabelFontSize: 14,
      // Skip the label when the bubble is too small to fit any readable text
      // (in world units — pre-zoom). The user can still pan/zoom in and see
      // the bubble; the label just doesn't render at this LOD.
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
    // parent→child edges D3HierarchyLayout needs to derive the tree.
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
              // the default size during the initial setData.
              size: 0.1,
              name: n.data.name,
              isLeaf,
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
        node: {
          style: {
            shape: (n) => {
              const size = (n.data as { size?: number } | undefined)?.size ?? 0.1;
              return { kind: 'circle', radius: size / 2 };
            },
          },
        },
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
    });
    canvas.layers.add(graph);

    let layout: D3HierarchyLayout | null = null;

    /**
     * Centre a label inside every leaf bubble, sized to fit. `d3.pack()`
     * writes the final diameter onto `data.size` (see D3HierarchyLayout —
     * `sizes.set(id, 2 * r)`), so this has to run *after* `layout.apply()`.
     *
     * Font sizing: text width is roughly `fontSize * charCount * 0.55`
     * for sans-serif. Solving for `fontSize` so the text spans ~85% of
     * the diameter gives `fontSize = diameter * 0.85 / (chars * 0.55)`.
     * Clamped to `maxLabelFontSize` so huge bubbles don't shout, and
     * labels are skipped entirely when even a 4px font would overflow
     * (i.e. the bubble is smaller than `minLabelDiameter`).
     */
    const applyBubbleLabels = (): void => {
      graph.store.batch(() => {
        for (const node of graph.store.nodes()) {
          const data = node.data as {
            size?: number;
            name?: string;
            isLeaf?: boolean;
          };
          const baseStyle = { ...(node.style ?? {}) };
          // Always clear stale labels so re-runs (font size, settings
          // toggles) don't accumulate.
          delete (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle;

          if (
            settings.showLabels &&
            data.isLeaf === true &&
            data.size !== undefined &&
            data.size >= settings.minLabelDiameter &&
            data.name
          ) {
            const chars = Math.max(4, data.name.length);
            const fontSize = Math.min(
              settings.maxLabelFontSize,
              (data.size * 0.85) / (chars * 0.55),
            );
            const labelStyle: ShapeLabelStyle = {
              content: {
                kind: 'text',
                text: data.name,
                fontSize,
                fontWeight: 500,
                fill: 0x0f172a,
              },
              placement: 'center',
            };
            (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle = labelStyle;
          }

          graph.store.updateNode(node.id, { style: baseStyle });
        }
      });
    };

    const run = async (): Promise<void> => {
      layout?.stop();
      graph.setData(buildGraphData());

      layout = new D3HierarchyLayout({
        mode: 'pack',
        size: [settings.size, settings.size],
        padding: settings.padding,
        // Default value accessor reads `data.value`; default sort is
        // descending by value. Both match d3's example, so no overrides.
      });
      await layout.apply(graph);
      // Labels are size-dependent (font scales with packed diameter), so
      // they have to be attached *after* layout writes `data.size`.
      applyBubbleLabels();
      canvas.camera.fitContent(graph.getBounds(), 40);
    };

    await run();
    onStoryTeardown(() => layout?.stop());

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Bubble' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder.add(settings, 'size', 200, 2000, 50).onChange(run);
    layoutFolder.add(settings, 'padding', 0, 20, 0.5).onChange(run);

    const style = gui.addFolder('Style');
    style.add(settings, 'leafStrokeWidth', 0, 4, 0.5).onChange(run);

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
