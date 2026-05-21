import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  Canvas,
  DevInfoLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphLayer, LabelResolutionLODBehaviour } from '@invana/graph';
import type { ShapeLabelStyle } from '@invana/canvas';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { h1b2019AsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-hierarchy/Pack' };
export default meta;
type Story = StoryObj;

export const Pack: Story = {
  render: () => createContainer({ id: 'graph-pack' }),

  play: async ({ canvasElement }) => {
    // ── About ────────────────────────────────────────────────────────────
    // Mirrors https://observablehq.com/@d3/pack-rollup/2 — a `d3.pack` over
    // the H-1B 2019 dataset rolled up by State → City → Employer, with the
    // leaf value being the sum of all four petition outcomes (initial /
    // continuing × approvals / denials).
    //
    // The d3 recipe:
    //   const rollup = d3.rollup(rows, D => d3.sum(D, d => d.IA + d.ID + d.CA + d.CD),
    //                            d => d.State, d => d.City, d => d.Employer);
    //   const root = d3.hierarchy(rollup).sum(([, v]) => v).sort((a,b) => b.value - a.value);
    //   d3.pack().size([w, h]).padding(3)(root);
    // We mirror the visualisation; the rollup itself was done offline so the
    // dataset package ships a pre-aggregated JSON instead of a 22k-row CSV.
    // See `@invana/graph-datasets` / `h1b2019AsGraph`.

    // ── Settings ─────────────────────────────────────────────────────────
    const settings = {
      size: 2000,
      padding: 3,
      // The full dataset has 21 763 employer leaves + ~3 000 cities + 55
      // states + the same count of (invisible) parent→child edges. That's
      // ~50 000 Pixi Container instances — enough to OOM the renderer on
      // first paint. Filter to leaves whose petition total clears this
      // threshold; cities / states that end up with no kept children are
      // pruned. Default 10 ⇒ ~1 450 employers + their containers ≈ 4 000
      // total objects, which renders snappily. Dial down to 1 to see the
      // full d3.pack-rollup picture (heavier first paint).
      minLeafValue: 10,
      // d3's example renders inner nodes as `fill: #fff` + `stroke: #bbb`
      // and leaves as `fill: #ddd` (no stroke). Reproduced below.
      innerFill: 0xffffff,
      innerStroke: 0xbbbbbb,
      innerStrokeWidth: 1,
      leafFill: 0xdddddd,
      showLabels: true,
      // d3's example only labels leaves whose radius exceeds 10. Below that
      // the label wouldn't fit and the page would be label-noise. The
      // exact-d3 default (10) is exposed so the user can dial it.
      labelMinRadius: 10,
      // Cap so the largest employer bubble doesn't blast its label across
      // the screen. d3 uses a fixed 10px; we let the label scale up to a
      // bubble-sized font and then clamp here.
      maxLabelFontSize: 14,
    };

    // ── Build node/edge data from the rollup dataset ─────────────────────
    //
    // Two-pass prune:
    //   1. Walk leaves; keep only those with `value >= minLeafValue`.
    //   2. Re-walk the tree bottom-up; drop any inner node (city / state)
    //      that lost all its descendants. The pack layout will then derive
    //      `sum` from the surviving leaves only, so a city with a single
    //      kept employer still shows up sized to that one petition count.
    const buildGraphData = () => {
      const data = h1b2019AsGraph();

      // Children-by-parent index to drive the bottom-up sweep without
      // mutating the source data.
      const childrenOf = new Map<string, string[]>();
      for (const e of data.edges) {
        let list = childrenOf.get(e.source);
        if (!list) {
          list = [];
          childrenOf.set(e.source, list);
        }
        list.push(e.target);
      }
      const nodeById = new Map(data.nodes.map((n) => [n.id, n] as const));

      const keep = new Set<string>();
      // Returns true if `id` (or any descendant) survived. Inner nodes
      // survive iff they have a surviving child; leaves survive iff their
      // value clears the threshold.
      const visit = (id: string): boolean => {
        const node = nodeById.get(id);
        if (!node) return false;
        if (node.data.isLeaf) {
          if ((node.data.value ?? 0) >= settings.minLeafValue) {
            keep.add(id);
            return true;
          }
          return false;
        }
        let kept = false;
        for (const childId of childrenOf.get(id) ?? []) {
          if (visit(childId)) kept = true;
        }
        if (kept) keep.add(id);
        return kept;
      };
      // Root is the one node whose id never appears as an edge target.
      // Build the set once (O(E)) — the prior `edges.some(...)` form was
      // O(N·E), which on the full 22k-node dataset is ~6×10⁸ comparisons
      // and a tab-killer on its own.
      const targets = new Set(data.edges.map((e) => e.target));
      for (const n of data.nodes) {
        if (!targets.has(n.id)) visit(n.id);
      }

      return {
        nodes: data.nodes
          .filter((n) => keep.has(n.id))
          .map((n) => {
            const isLeaf = n.data.isLeaf;
            return {
              id: n.id,
              data: {
                // Pack writes the real diameter onto `data.size` once it
                // runs; this placeholder keeps a fresh setData from flashing
                // at the renderer's default node size.
                size: 0.1,
                // Pack reads `data.value` (default accessor). Inner nodes
                // omit it — pack's `sum` rolls them up from leaves.
                ...(n.data.value !== undefined ? { value: n.data.value } : {}),
                name: n.data.name,
                isLeaf,
                depth: n.data.depth,
              },
              style: {
                bgFill: isLeaf ? settings.leafFill : settings.innerFill,
                bgStrokeColor: isLeaf ? 0xffffff : settings.innerStroke,
                bgStrokeWidth: isLeaf ? 0 : settings.innerStrokeWidth,
              },
            };
          }),
        edges: data.edges
          .filter((e) => keep.has(e.source) && keep.has(e.target))
          .map((e) => ({ id: e.id, source: e.source, target: e.target })),
      };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-pack')!;
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
          // Pack conveys hierarchy through enclosure, not links. Edges are
          // required by the layout (so it can derive the tree) but rendered
          // fully transparent so only the packed circles read.
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

    // Dev overlay — useful here to watch the camera zoom cross the
    // LabelResolutionLODBehaviour's tier threshold (default 1.5×) and to
    // sanity-check node / edge counts after the `minLeafValue` filter.
    canvas.layers.add(new DevInfoLayer({ id: 'dev', corner: 'top-left' }));

    // Registered after the `graph` layer is added — the behaviour resolves
    // its target layer at register-time, so the layer must exist first.
    canvas.behaviours.register(
      new LabelResolutionLODBehaviour({
        id: 'label-resolution',
        layerId: 'graph',
        enabled: true,
      }),
    );

    let layout: D3HierarchyLayout | null = null;

    /**
     * Centre a name label inside every bubble whose packed radius exceeds
     * `labelMinRadius` — employer leaves get their company name, city
     * circles get the city, state circles get the state code. The root
     * ("H-1B 2019") is skipped because its label would sit at the chart
     * centre on top of every leaf.
     *
     * The packed diameter is read off `style.shape.radius` — `D3HierarchyLayout`
     * writes the resolved size onto each node's shape spec (see its
     * `store.updateNode(id, { style: { shape: { kind: 'circle', radius } } })`
     * pack branch), so this has to run *after* `layout.apply()`.
     *
     * `placement: 'inside-center'` carries the containment contract (see
     * [[feedback_label_placement_containment]]) — the LabelDecoration runs
     * its shrink → truncate → hide fit cascade against the host's inner box
     * so the label is guaranteed to stay inside the bubble. We just hand it
     * a generous starting font size (`maxLabelFontSize`) and a floor
     * (`minFontSize`) below which it stops shrinking and hides instead.
     */
    const applyLeafLabels = (): void => {
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
          delete (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle;
          const radius =
            (baseStyle.shape as { radius?: number } | undefined)?.radius ?? 0;

          if (
            settings.showLabels &&
            (data.depth ?? 0) > 0 &&
            radius >= settings.labelMinRadius &&
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

    const run = async (): Promise<void> => {
      layout?.stop();
      graph.setData(buildGraphData());

      layout = new D3HierarchyLayout({
        mode: 'pack',
        size: [settings.size, settings.size],
        padding: settings.padding,
        // Default value accessor reads `data.value`; default sort is
        // descending by value. Both match d3's example.
      });
      await layout.apply(graph);
      applyLeafLabels();
      canvas.camera.fitContent(graph.getBounds(), 40);
    };

    await run();
    onStoryTeardown(() => layout?.stop());

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Pack' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder.add(settings, 'size', 500, 4000, 100).onChange(run);
    layoutFolder.add(settings, 'padding', 0, 20, 0.5).onChange(run);
    // Dataset filter — see `settings.minLeafValue` rationale. At 1 the full
    // d3.pack-rollup picture renders (slow first paint, ≈ 50 k objects); the
    // default 10 keeps it under 5 k.
    layoutFolder
      .add(settings, 'minLeafValue', 1, 100, 1)
      .name('min petitions / leaf')
      .onChange(run);

    const style = gui.addFolder('Style');
    style.addColor(settings, 'innerFill').onChange(run);
    style.addColor(settings, 'innerStroke').onChange(run);
    style.add(settings, 'innerStrokeWidth', 0, 4, 0.5).onChange(run);
    style.addColor(settings, 'leafFill').onChange(run);

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(applyLeafLabels);
    labels.add(settings, 'labelMinRadius', 0, 60, 1).onChange(applyLeafLabels);
    labels.add(settings, 'maxLabelFontSize', 6, 32, 1).onChange(applyLeafLabels);

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 40) }, 'refit').name('Re-fit camera');
  },
};
