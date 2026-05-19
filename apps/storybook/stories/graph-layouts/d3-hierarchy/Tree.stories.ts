import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphLayer, LabelResolutionLODBehaviour } from '@invana/graph';
import {
  D3HierarchyLayout,
  type CartesianOrientation,
  type D3HierarchyLayoutMode,
} from '@invana/graph-layout-d3-hierarchy';
import { flareAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-hierarchy/Tree' };
export default meta;
type Story = StoryObj;

export const Tree: Story = {
  render: () => createContainer({ id: 'graph-tree' }),

  play: async ({ canvasElement }) => {
    // ── Settings ─────────────────────────────────────────────────────────
    // Tidy tree (Reingold-Tilford via `d3.tree()`) compresses subtrees
    // tighter than `d3.cluster()` — internal nodes sit on top of their
    // children's centroid, so leaves at different depths land at different
    // depths on screen (rather than aligned at the rightmost column the way
    // a dendrogram does).
    //
    // The d3 example's recipe:
    //   const dx = 10;
    //   const dy = width / (root.height + 1);
    //   d3.tree().nodeSize([dx, dy])(d3.hierarchy(data));
    // We mirror that with `nodeSize: [siblingSpacing, depthSpacing]` and
    // let the camera fit the result instead of pre-computing dy from a
    // viewport width.
    const settings = {
      mode: 'tree' as D3HierarchyLayoutMode,
      orientation: 'horizontal' as CartesianOrientation,
      // d3 tree/2 uses dx=10, dy=width/(root.height+1). With label-bearing
      // leaves the default dx is too tight — bump sibling spacing to 14 so
      // leaf labels don't overlap vertically when fully zoomed-in.
      siblingSpacing: 14,
      depthSpacing: 160,
      edgeAlpha: 0.55,
      edgeStrokeWidth: 0.7,
      nodeRadius: 2.5,
      colorByDepth: true,
      showLabels: true,
      labelFontSize: 10,
      // Zoom-aware label sharpness — see Cluster.stories.ts for rationale.
      sharpLabelsOnZoom: true,
    };

    // Depth-based colour ramp (warm root → cool leaves). Kept identical to
    // the Cluster story so a side-by-side comparison reads as "same data,
    // different layout algorithm".
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
          data: {
            size: settings.nodeRadius * 2,
            fill: settings.colorByDepth ? colorAt(n.data.depth) : 0x1f2937,
            stroke: false as const,
            // d3 tree/2's label rule: leaves get their name on the right
            // side, internal nodes on the left. With horizontal orientation
            // that lines labels up *away* from the subtree they belong to,
            // so they don't overprint the children below.
            ...(settings.showLabels
              ? {
                  label: {
                    content: {
                      kind: 'text' as const,
                      text: n.data.name,
                      fontSize: settings.labelFontSize,
                      fontWeight: 500,
                      fill: 0x0f172a,
                    },
                    placement: (n.data.isLeaf ? 'right' : 'left') as
                      | 'left'
                      | 'right',
                    offset: { x: n.data.isLeaf ? 4 : -4 },
                  },
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
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-tree')!;
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
        node: { style: { shape: { kind: 'circle', radius: settings.nodeRadius } } },
        edge: {
          style: {
            strokeColor: 0x94a3b8,
            strokeWidth: settings.edgeStrokeWidth,
            strokeAlpha: settings.edgeAlpha,
            arrowTargetShape: 'none',
            // `bezier` with `axis: 'h'` matches d3.linkHorizontal(). Don't
            // rely on `axis: 'auto'` — for sibling pairs whose parent sits
            // between them, `dy > dx` flips auto to vertical and produces
            // wrong-direction S-curves crossing the tree.
            shape: {
              pathType: 'bezier',
              pathStyleOpts: { axis: 'h' },
              // Centre-anchor so the bezier tangent at each endpoint matches
              // the node centre rather than the trimmed boundary cut. Nodes
              // overdraw the inner part of the curve.
              sourceAnchor: 'center',
              targetAnchor: 'center',
            },
          },
        },
      },
    });
    canvas.layers.add(graph);

    // Registered after the `graph` layer is added — the behaviour resolves
    // its target layer at register-time, so the layer must exist first.
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
        orientation: settings.orientation,
        // d3's `tree.nodeSize([dx, dy])` — dx is sibling spacing, dy is
        // depth spacing. Per-node spacing (vs. a fixed `size` bounding
        // box) keeps siblings consistently spaced no matter how unbalanced
        // a subtree is.
        nodeSize: [settings.siblingSpacing, settings.depthSpacing],
      });
      await layout.apply(graph);
      canvas.camera.fitContent(graph.getBounds(), 20);
    };

    await run();
    onStoryTeardown(() => layout?.stop());

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Tree' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder
      .add(settings, 'mode', ['tree', 'cluster'] satisfies D3HierarchyLayoutMode[])
      .onChange(run);
    layoutFolder
      .add(settings, 'orientation', ['horizontal', 'vertical'] satisfies CartesianOrientation[])
      .onChange(run);
    layoutFolder.add(settings, 'siblingSpacing', 4, 40, 1).onChange(run);
    layoutFolder.add(settings, 'depthSpacing', 30, 300, 5).onChange(run);

    const style = gui.addFolder('Style');
    style.add(settings, 'nodeRadius', 1, 8, 0.5).onChange(run);
    style.add(settings, 'colorByDepth').onChange(run);
    style.add(settings, 'edgeStrokeWidth', 0.2, 4, 0.1).onChange(run);
    style.add(settings, 'edgeAlpha', 0, 1, 0.05).onChange(run);

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(run);
    labels.add(settings, 'labelFontSize', 6, 18, 1).onChange(run);
    labels
      .add(settings, 'sharpLabelsOnZoom')
      .name('Sharp on zoom')
      .onChange((on: boolean) => (on ? labelResolutionLOD.enable() : labelResolutionLOD.disable()));

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 20) }, 'refit').name('Re-fit camera');
  },
};
