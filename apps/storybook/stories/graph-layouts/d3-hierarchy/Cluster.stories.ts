import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphCanvas, GraphLayer, TextResolutionLODBehaviour, ThemeBehaviour } from '@invana/graph';
import {
  D3HierarchyLayout,
  type CartesianOrientation,
  type D3HierarchyLayoutMode,
  type D3HierarchyLayoutOptions,
} from '@invana/graph-layout-d3-hierarchy';
import type { LayoutOptions } from '@invana/canvas';
import { flareAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-hierarchy/Cluster' };
export default meta;
type Story = StoryObj;

export const Cluster: Story = {
  render: () => createContainer({ id: 'graph-cluster' }),

  play: async ({ canvasElement }) => {
    // ── Settings ─────────────────────────────────────────────────────────
    const settings = {
      // `nodeSize` (per-node spacing) keeps the dendrogram readable for
      // ~250-node Flare. d3's cluster/2 example uses ~10px between siblings;
      // bumped to 14 here because label-bearing leaves need vertical room
      // to avoid overlapping text.
      siblingSpacing: 14,
      depthSpacing: 160,
      edgeStrokeWidth: 0.7,
      nodeRadius: 2.5,
      colorByDepth: true,
      showLabels: true,
      labelFontSize: 10,
      // Zoom-aware label sharpness: bumps Pixi's Text resolution once the
      // camera zooms past a threshold so glyph textures don't sample-blur.
      // Tier-based to avoid frame stutter on every zoom step — see
      // `TextResolutionLODBehaviour`.
      sharpLabelsOnZoom: true,
    };

    // Depth-based color ramp (warm root → cool leaves).
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

    // ── Build node/edge data from Flare ──────────────────────────────────
    // Per-item style carries the depth-derived fill and (when enabled) the
    // flat `label*` fields, riding in as initial content (`options.initData`).
    // The previous version stashed these on `data`, which `GraphLayer` treats
    // as opaque domain payload — so neither the fill nor the label ever
    // reached the renderer and the dendrogram came out as edges only with no
    // visible nodes or text.
    const buildGraphData = () => {
      const data = flareAsGraph();
      let maxDepth = 0;
      for (const n of data.nodes) {
        if (n.data.depth > maxDepth) maxDepth = n.data.depth;
      }
      const colorAt = (depth: number): number => {
        const t = maxDepth === 0 ? 0 : depth / maxDepth;
        return hslToHex(30 + t * 190, 0.65, 0.55); // 30° orange → 220° blue
      };
      return {
        nodes: data.nodes.map((n) => ({
          id: n.id,
          data: { name: n.data.name, depth: n.data.depth, isLeaf: n.data.isLeaf },
          style: {
            bgFill: settings.colorByDepth ? colorAt(n.data.depth) : 0x1f2937,
            // d3 cluster/2's label rule: leaves get their name on the right,
            // internal nodes on the left. With horizontal orientation that
            // lines labels up *away* from the subtree they belong to, so
            // they don't overprint children below.
            ...(settings.showLabels
              ? {
                  labelText: n.data.name,
                  labelFontSize: settings.labelFontSize,
                  labelFontWeight: 500,
                  labelColor: 0x0f172a,
                  labelPlacement: (n.data.isLeaf ? 'right' : 'left') as
                    | 'left'
                    | 'right',
                  labelOffsetX: n.data.isLeaf ? 4 : -4,
                }
              : {}),
          },
        })),
        edges: data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-cluster')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: buildGraphData() },
    });

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));

    // Resolves its target layer at register-time, so the layer must exist
    // first. Enabled via config (`sharpLabelsOnZoom`), not the constructor.
    const labelResolutionLOD = new TextResolutionLODBehaviour({
      id: 'label-resolution',
      targetLayerId: 'graph',
    });
    canvas.behaviours.register(labelResolutionLOD);

    const layout = new D3HierarchyLayout({
      id: 'hierarchy',
      targetLayerId: 'graph',
    } as D3HierarchyLayoutOptions & LayoutOptions);
    canvas.layouts.add(layout);

    const canvasOptions = {
      layers: {
        bg: { type: 'solid', backgroundColor: '#0b1220' },
        graph: {
          node: { style: { shape: { kind: 'circle', radius: settings.nodeRadius } } },
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: settings.edgeStrokeWidth,
              strokeAlpha: 0.55,
              arrowTargetShape: 'none',
              // `bezier` with `axis: 'h'` matches d3.linkHorizontal() — control
              // points always pull along the horizontal axis. Don't rely on
              // `axis: 'auto'` here: in a horizontal cluster, sibling pairs whose
              // parent sits between them have `dy > dx`, which would flip auto
              // to vertical and produce wrong-direction S-curves crossing the
              // tree.
              shape: {
                pathType: 'bezier',
                pathStyleOpts: { axis: 'h' },
                // Centre-anchor so the tangent at each endpoint matches the node
                // centre rather than the trimmed boundary cut. Same trick the
                // RadialTree story uses; nodes draw on top of the curve.
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
          light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
          dark: { backgroundColor: '#0b1220', color: '#475569' },
        },
        'label-resolution': { enabled: settings.sharpLabelsOnZoom },
      },
      layouts: {
        hierarchy: {
          mode: 'cluster' as D3HierarchyLayoutMode,
          orientation: 'horizontal' as CartesianOrientation,
          // Per-node spacing (`nodeSize`) keeps siblings consistently-spaced
          // regardless of subtree imbalance — preferred over `size` for
          // dendrograms with many leaves.
          nodeSize: [settings.siblingSpacing, settings.depthSpacing] as [number, number],
        },
      },
      activeLayout: 'hierarchy',
    };

    // Fit the camera once the layout settles — fires on the initial auto-run
    // and on every re-heat (spacing / mode / orientation edits).
    onStoryTeardown(
      layout.events.on('end', () => canvas.camera.fitContent(graph.getBounds(), 20)),
    );
    onStoryTeardown(() => layout.stop());

    // initData loads on mount; `activeLayout` runs itself once data is present.
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Re-feed live data for settings that drive per-item style (fill / labels).
    const rebuildData = (): void => graph.setData(buildGraphData());

    // Push edited layout params back through config; re-runs the layout once.
    const reapplyLayout = (): void =>
      canvas.update({ layouts: { hierarchy: canvasOptions.layouts.hierarchy } });

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Cluster' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder
      .add(canvasOptions.layouts.hierarchy, 'mode', ['cluster', 'tree'] satisfies D3HierarchyLayoutMode[])
      .onChange(reapplyLayout);
    layoutFolder
      .add(canvasOptions.layouts.hierarchy, 'orientation', ['horizontal', 'vertical'] satisfies CartesianOrientation[])
      .onChange(reapplyLayout);
    layoutFolder
      .add(settings, 'siblingSpacing', 4, 40, 1)
      .onChange((v: number) => {
        canvasOptions.layouts.hierarchy.nodeSize[0] = v;
        reapplyLayout();
      });
    layoutFolder
      .add(settings, 'depthSpacing', 30, 300, 5)
      .onChange((v: number) => {
        canvasOptions.layouts.hierarchy.nodeSize[1] = v;
        reapplyLayout();
      });

    const style = gui.addFolder('Style');
    style
      .add(settings, 'nodeRadius', 1, 8, 0.5)
      .onChange((v: number) =>
        canvas.update({
          layers: { graph: { node: { style: { shape: { kind: 'circle', radius: v } } } } },
        }),
      );
    style.add(settings, 'colorByDepth').onChange(rebuildData);
    style
      .add(settings, 'edgeStrokeWidth', 0.2, 4, 0.1)
      .onChange((v: number) =>
        canvas.update({ layers: { graph: { edge: { style: { strokeWidth: v } } } } }),
      );
    style
      .add({ edgeAlpha: 0.55 }, 'edgeAlpha', 0, 1, 0.05)
      .onChange((v: number) =>
        canvas.update({ layers: { graph: { edge: { style: { strokeAlpha: v } } } } }),
      );

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(rebuildData);
    labels.add(settings, 'labelFontSize', 6, 18, 1).onChange(rebuildData);
    labels
      .add(settings, 'sharpLabelsOnZoom')
      .name('Sharp on zoom')
      .onChange((on: boolean) => (on ? labelResolutionLOD.enable() : labelResolutionLOD.disable()));

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit').name('Re-fit camera');
  },
};
