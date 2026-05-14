import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphLayer } from '@invana/graph';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { flareAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'graph-layouts-hierarchy-d3/Bubble' };
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
              // Internal nodes (including the root) stay transparent so
              // only the leaf bubbles read visually, matching the d3
              // example. Leaves get the categorical fill.
              fill: isLeaf ? colorFor(n.data.group) : 0xffffff,
              stroke: 0xffffff,
              strokeWidth: isLeaf ? settings.leafStrokeWidth : 0,
              alpha: isLeaf ? 1 : 0,
              // Carried through so future label rendering / tooltips can
              // use it. Flare's `name` is the class name (e.g. "Easing");
              // `value` is the metric the bubble area is proportional to.
              label: n.data.name,
              name: n.data.name,
              group: n.data.group,
              ...(n.data.value !== undefined ? { value: n.data.value } : {}),
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
        nodeDefaults: { shape: 'circle', size: 0.1 },
        edgeDefaults: {
          // Bubble chart conveys grouping by enclosure, not links. Edges
          // are required by the layout (so it can derive the tree) but
          // rendered fully transparent.
          stroke: 0x000000,
          strokeWidth: 0,
          alpha: 0,
          arrow: false,
        },
      },
    });
    canvas.layers.add(graph);

    let layout: D3HierarchyLayout | null = null;

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

    gui
      .add(
        { refit: () => canvas.camera.fitContent(graph.getBounds(), 40) },
        'refit',
      )
      .name('Re-fit camera');
  },
};
