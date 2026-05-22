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
import { flareAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph-layouts/d3-hierarchy/Sunburst' };
export default meta;
type Story = StoryObj;

export const Sunburst: Story = {
  render: () => createContainer({ id: 'graph-sunburst' }),

  play: async ({ canvasElement }) => {
    // ── About ────────────────────────────────────────────────────────────
    // Mirrors https://observablehq.com/@d3/sunburst/2 — a `d3.partition` over
    // the Flare software hierarchy, projected to polar coordinates so every
    // node renders as an annular sector. Each ring covers an area
    // proportional to its summed `value`, so the outer leaves visually
    // represent file size while still being grouped under their top-level
    // category.
    //
    // The d3 recipe:
    //   const root = d3.hierarchy(data).sum(d => d.value).sort((a,b) => b.value - a.value);
    //   d3.partition().size([2π, radius²])(root);
    //   // each node now has (x0, x1, y0, y1); render with d3.arc()
    //
    // Our `D3HierarchyLayout({ mode: 'sunburst' })` runs the same partition,
    // writes `{shape: 'arc', innerR, outerR, startAngle, endAngle}` onto each
    // node's `data`, and `GraphLayer` renders the resulting `ArcShape`s. The
    // tree topology comes from parent→child edges (rendered fully
    // transparent — like the Pack story, hierarchy is conveyed by enclosure).

    // ── Settings ─────────────────────────────────────────────────────────
    const settings = {
      radius: 400,
      // Stroke between siblings — d3's example uses 1px white separators so
      // adjacent arcs read as discrete cells rather than a single ring of
      // colour.
      strokeColor: 0xffffff,
      strokeWidth: 1,
      // Labels only on arcs wide enough to fit text comfortably — d3's
      // example uses `(y0 + y1) * (x1 - x0) > 10` (rough heuristic in d3's
      // own coordinate scaling). In our world coords that maps roughly to a
      // tangential arc length cutoff.
      showLabels: true,
      labelMinArcPx: 14,
      labelFontSize: 10,
      sharpLabelsOnZoom: true,
    };

    // d3.schemeCategory10-ish palette. Top-level Flare branches get a stable
    // colour; their descendants inherit it with depth-based lightness so
    // outer rings read as lighter shades of the same hue.
    const categoryColors: Record<string, [number, number, number]> = {
      // Hue, saturation, base lightness for HSL ramp.
      analytics: [12, 0.75, 0.5],   // red-orange
      animate: [32, 0.85, 0.55],    // orange
      data: [55, 0.7, 0.55],        // yellow
      display: [110, 0.55, 0.5],    // green
      flex: [165, 0.55, 0.45],      // teal
      physics: [200, 0.6, 0.5],     // blue
      query: [225, 0.55, 0.55],     // indigo
      scale: [265, 0.55, 0.6],      // purple
      util: [305, 0.55, 0.55],      // magenta
      vis: [340, 0.6, 0.55],        // pink
    };

    const hslToHex = (h: number, s: number, l: number): number => {
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const hh = h / 60;
      const x = c * (1 - Math.abs((hh % 2) - 1));
      let r = 0, g = 0, b = 0;
      if (hh < 1) [r, g, b] = [c, x, 0];
      else if (hh < 2) [r, g, b] = [x, c, 0];
      else if (hh < 3) [r, g, b] = [0, c, x];
      else if (hh < 4) [r, g, b] = [0, x, c];
      else if (hh < 5) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
      const m = l - c / 2;
      const to8 = (v: number): number => Math.round((v + m) * 255);
      return (to8(r) << 16) | (to8(g) << 8) | to8(b);
    };

    /**
     * Resolve a fill colour for a given (group, depth, maxDepth). Inner
     * rings stay near the category's base lightness; outer rings lighten
     * toward white so the ramp reads as "deeper into the tree = lighter".
     */
    const fillFor = (group: string | undefined, depth: number, maxDepth: number): number => {
      if (!group) return 0xe5e7eb; // neutral grey for the root cell
      const cat = categoryColors[group] ?? [220, 0.4, 0.6];
      const [h, s, baseL] = cat;
      // Lerp lightness from `baseL` (depth 1) toward 0.85 (deepest leaf).
      const t = maxDepth <= 1 ? 0 : Math.max(0, (depth - 1) / (maxDepth - 1));
      const l = baseL + (0.85 - baseL) * t;
      return hslToHex(h, s, l);
    };

    // Names cached for the post-layout label pass — labels can only be
    // attached once `apply()` resolves each node's arc (we need the mid-angle
    // to rotate the text, and the arc width to decide whether to show it).
    interface NodeMeta {
      name: string;
      group: string | undefined;
      depth: number;
    }
    const nodeMeta = new Map<string, NodeMeta>();

    const buildGraphData = () => {
      const data = flareAsGraph();
      nodeMeta.clear();
      let maxDepth = 0;
      for (const n of data.nodes) {
        if (n.data.depth > maxDepth) maxDepth = n.data.depth;
        nodeMeta.set(n.id, {
          name: n.data.name,
          group: n.data.group,
          depth: n.data.depth,
        });
      }
      return {
        nodes: data.nodes.map((n) => ({
          id: n.id,
          data: {
            // The layout reads `data.value` via its default value accessor —
            // only leaves carry one, inner nodes get summed by d3.hierarchy.
            ...(n.data.value !== undefined ? { value: n.data.value } : {}),
          },
          style: {
            // Placeholder zero-size arc — D3HierarchyLayout('sunburst')
            // overwrites `style.shape` with the resolved arc geometry once
            // it runs.
            shape: {
              kind: 'arc' as const,
              innerR: 0,
              outerR: 0,
              startAngle: 0,
              endAngle: 0,
            },
            bgFill: fillFor(n.data.group, n.data.depth, maxDepth),
            bgStrokeColor: settings.strokeColor,
            bgStrokeWidth: settings.strokeWidth,
          },
        })),
        edges: data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      };
    };

    /**
     * Attach labels to arcs wide enough to fit text. The d3 example shows a
     * label when the tangential arc length at the midradius exceeds a
     * threshold (~14 px). We replicate that: arc length = (outerR + innerR)/2
     * × sweep angle. Text rotates so the baseline reads radially outward,
     * flipping by π on the left half so labels stay right-way-up — same
     * trick as the RadialTree story.
     *
     * `placement: 'inside-center'` enforces the wedge-containment contract
     * (see [[feedback_label_placement_containment]]): the LabelDecoration's
     * fit cascade shrinks / truncates / hides the label so it stays inside
     * the arc's AABB. The arc-length pre-filter still suppresses labels on
     * slivers where the engine would just hide them anyway, which keeps the
     * scene quieter than letting every arc try.
     */
    const applySunburstLabels = (): void => {
      graph.store.batch(() => {
        for (const node of graph.store.nodes()) {
          const baseStyle = {
            ...((node.style as Record<string, unknown> | undefined) ?? {}),
          };
          delete (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle;

          const shape = baseStyle.shape as
            | { kind?: string; innerR?: number; outerR?: number; startAngle?: number; endAngle?: number }
            | undefined;
          if (
            settings.showLabels &&
            shape &&
            shape.kind === 'arc' &&
            shape.innerR !== undefined &&
            shape.outerR !== undefined &&
            shape.startAngle !== undefined &&
            shape.endAngle !== undefined
          ) {
            const sweep = shape.endAngle - shape.startAngle;
            const midR = (shape.innerR + shape.outerR) / 2;
            const arcLen = sweep * midR;
            const meta = nodeMeta.get(node.id);
            if (meta && arcLen >= settings.labelMinArcPx && meta.depth > 0) {
              const midAngle = (shape.startAngle + shape.endAngle) / 2;
              const flipped = Math.cos(midAngle) < 0;
              const rotation = flipped ? midAngle + Math.PI : midAngle;
              const labelStyle: ShapeLabelStyle = {
                content: {
                  kind: 'text',
                  text: meta.name,
                  fontSize: settings.labelFontSize,
                  fontWeight: 500,
                  fill: 0x0f172a,
                },
                placement: 'inside-center',
                rotation,
                minFontSize: 6,
              };
              (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle = labelStyle;
            }
          }

          graph.store.updateNode(node.id, { style: baseStyle });
        }
      });
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-sunburst')!;
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
            bgFill: 0xcccccc,
            bgStrokeColor: settings.strokeColor,
            bgStrokeWidth: settings.strokeWidth,
          },
        },
        edge: {
          // Hierarchy is conveyed by ring enclosure, not links. Edges are
          // required so the layout can derive the tree topology but stay
          // fully transparent at render time. Same trick as the Pack story.
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

    canvas.layers.add(new DevInfoLayer({ id: 'dev', corner: 'top-left' }));

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
        mode: 'sunburst',
        radius: settings.radius,
        // Default value accessor reads `data.value`; default sort is
        // descending by value. Both match d3's example.
      });
      await layout.apply(graph);
      applySunburstLabels();
      canvas.camera.fitContent(graph.getBounds(), 40);
    };

    await run();
    onStoryTeardown(() => layout?.stop());

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Sunburst' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder.add(settings, 'radius', 120, 1000, 10).onChange(run);

    const style = gui.addFolder('Style');
    style.addColor(settings, 'strokeColor').onChange(run);
    style.add(settings, 'strokeWidth', 0, 4, 0.5).onChange(run);

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(applySunburstLabels);
    labels.add(settings, 'labelMinArcPx', 0, 80, 1).onChange(applySunburstLabels);
    labels.add(settings, 'labelFontSize', 6, 18, 1).onChange(applySunburstLabels);
    labels
      .add(settings, 'sharpLabelsOnZoom')
      .name('Sharp on zoom')
      .onChange((on: boolean) => (on ? labelResolutionLOD.enable() : labelResolutionLOD.disable()));

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 40) }, 'refit').name('Re-fit camera');
  },
};
