import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphCanvas, GraphLayer, LabelResolutionLODBehaviour } from '@invana/graph';
import type { ShapeLabelStyle } from '@invana/canvas';
import { D3HierarchyLayout, type D3HierarchyLayoutMode } from '@invana/graph-layout-d3-hierarchy';
import { flareAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { SystemThemeBehaviour } from '../../../system-theme';

const meta: Meta = { title: 'canvas/graph-layouts/d3-hierarchy/RadialTree' };
export default meta;
type Story = StoryObj;

export const RadialTree: Story = {
  render: () => createContainer({ id: 'graph-radial-tree' }),

  play: async ({ canvasElement }) => {
    // ── Settings ─────────────────────────────────────────────────────────
    const settings = {
      mode: 'radial-tree' as D3HierarchyLayoutMode,
      // Bumped from 380 → 480 to give the per-leaf labels enough perimeter
      // arc to avoid overlapping their neighbours when fully zoomed in.
      // d3's radial-cluster/2 example sizes the diagram off `cx, cy = width/2`
      // and lets the SVG viewBox grow with the label ring — same idea.
      radius: 480,
      edgeAlpha: 0.6,
      edgeStrokeWidth: 0.6,
      nodeSize: 3,
      colorByDepth: true,
      showLabels: true,
      labelFontSize: 9,
      // Zoom-aware label sharpness — see Cluster.stories.ts for rationale.
      sharpLabelsOnZoom: true,
    };

    // Depth-based color ramp (warm root → cool leaves), pre-converted to
    // 0xRRGGBB ints. Same hue scheme as the existing RandomTree story so the
    // two reads visually consistent side-by-side.
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
    //
    // Labels can't be baked into `nodeDefaults` at build-time: in a radial
    // layout each node's "outward" direction depends on its final (x, y) —
    // which only the layout knows. So we stash `name` + `isLeaf` for every
    // id here and project them onto a `label` hint *after* the layout
    // resolves positions. See {@link applyRadialLabels}.
    const nodeMeta = new Map<string, { name: string; isLeaf: boolean }>();

    const buildGraphData = () => {
      const data = flareAsGraph();
      nodeMeta.clear();
      let maxDepth = 0;
      for (const n of data.nodes) {
        if (n.data.depth > maxDepth) maxDepth = n.data.depth;
        nodeMeta.set(n.id, { name: n.data.name, isLeaf: n.data.isLeaf });
      }
      const colorAt = (depth: number): number => {
        const t = maxDepth === 0 ? 0 : depth / maxDepth;
        return hslToHex(30 + t * 190, 0.65, 0.55); // 30° orange → 220° blue
      };
      return {
        nodes: data.nodes.map((n) => ({
          id: n.id,
          style: {
            bgFill: settings.colorByDepth ? colorAt(n.data.depth) : 0x1f2937,
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
     * d3 radial-cluster/2's text transform:
     *   rotate(x - 90) translate(y, 0) rotate(x >= π ? 180 : 0)
     *   .attr("x", d.x < π === !d.children ? 6 : -6)
     *
     * The two-rotation pattern keeps the text upright (no upside-down labels
     * on the left half), and the conditional `x` puts leaves on the outside
     * and internal nodes on the inside of the perimeter circle.
     *
     * Our `ShapeLabelStyle.rotation` rotates the label around its centroid,
     * and `placement: 'center' + offset.{x,y}` lets us position that
     * centroid at any screen-space offset from the host. So we:
     *
     *   1. Read the node's final position from the store.
     *   2. Compute the angle θ from the layout origin.
     *   3. Place the label `radialDist` units along (cos θ, sin θ) — outward
     *      for leaves (+6), inward for internal nodes (−6) — matching d3.
     *   4. Rotate by θ (or θ + π on the left half) so the baseline reads
     *      radially outward and stays right-way-up.
     */
    const applyRadialLabels = (): void => {
      if (!settings.showLabels) {
        // Clear any labels left over from a prior run.
        graph.store.batch(() => {
          for (const node of graph.store.nodes()) {
            const baseStyle = { ...(node.style ?? {}) };
            if ('labelStyle' in baseStyle) {
              delete (baseStyle as { labelStyle?: ShapeLabelStyle }).labelStyle;
              graph.store.updateNode(node.id, { style: baseStyle });
            }
          }
        });
        return;
      }

      graph.store.batch(() => {
        for (const node of graph.store.nodes()) {
          const pos = graph.store.getPosition(node.id);
          const meta = nodeMeta.get(node.id);
          if (!pos || !meta) continue;
          // Root sits at the origin — no meaningful radial direction.
          const r = Math.hypot(pos.x, pos.y);
          if (r < 1e-3) continue;

          const theta = Math.atan2(pos.y, pos.x);
          const isLeftHalf = pos.x < 0;
          const estimatedHalfWidth = (meta.name.length * settings.labelFontSize * 0.55) / 2;
          const signedDist =
            estimatedHalfWidth + settings.nodeSize / 2 + 4;
          const radialDist = meta.isLeaf ? signedDist : -signedDist;

          const labelStyle: ShapeLabelStyle = {
            content: {
              kind: 'text',
              text: meta.name,
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

          graph.store.updateNode(node.id, {
            style: { ...(node.style ?? {}), labelStyle },
          });
        }
      });
    };

    // ── Canvas setup — register everything, then init() last ─────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-radial-tree')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        // Initial content rides on the layer; per-item depth-colour fills
        // live on the data rows (see buildGraphData).
        initData: buildGraphData(),
        edge: {
          style: {
            shape: {
              // `bump-radial` matches d3.linkRadial().
              pathType: 'bump-radial',
              // `center` anchor: don't trim endpoints to the node boundary.
              sourceAnchor: 'center',
              targetAnchor: 'center',
            },
          },
        },
      },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', targetLayerId: 'bg' }));

    // Registered before init — resolves its target layer at register-time, so
    // the `graph` layer must exist first (it does).
    const labelResolutionLOD = new LabelResolutionLODBehaviour({
      id: 'label-resolution',
      targetLayerId: 'graph',
    });
    canvas.behaviours.register(labelResolutionLOD);

    // Kept mutable: `D3HierarchyLayout` reads its params at construction
    // (no live `setOptions`), so each GUI-driven re-layout rebuilds it.
    let layout = new D3HierarchyLayout({ mode: settings.mode, radius: settings.radius });

    const canvasOptions = {
      layers: {
        bg: { type: 'solid', backgroundColor: '#f8fafc' },
        graph: {
          node: { style: { shape: { kind: 'circle', radius: settings.nodeSize / 2 } } },
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: settings.edgeStrokeWidth,
              strokeAlpha: settings.edgeAlpha,
              arrowTargetShape: 'none',
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'label-resolution': { enabled: settings.sharpLabelsOnZoom },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc' },
          dark: { backgroundColor: '#0b1220' },
        },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ── Run layout ───────────────────────────────────────────────────────
    // `D3HierarchyLayout` is one-shot synchronous and not yet wired for the
    // engine's `activeLayout` auto-run, so we drive it explicitly. The
    // per-leaf labels are position-dependent (each node's rotation = angle
    // from origin), so they're attached on the layout's `end`.
    const run = async (): Promise<void> => {
      layout.stop();
      graph.setData(buildGraphData());
      layout = new D3HierarchyLayout({ mode: settings.mode, radius: settings.radius });
      await layout.apply(graph);
      applyRadialLabels();
      canvas.camera.fitContent(graph.getBounds(), 80);
    };

    await run();
    onStoryTeardown(() => layout.stop());

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'RadialTree' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder
      .add(settings, 'mode', ['radial-tree', 'radial-cluster', 'tree', 'cluster'] satisfies D3HierarchyLayoutMode[])
      .onChange(() => void run());
    layoutFolder.add(settings, 'radius', 80, 1200, 10).onChange(() => void run());

    const style = gui.addFolder('Style');
    style.add(settings, 'nodeSize', 1, 10, 0.5).onChange((radius: number) => {
      canvas.update({ layers: { graph: { node: { style: { shape: { kind: 'circle', radius: radius / 2 } } } } } });
      void run();
    });
    style.add(settings, 'colorByDepth').onChange(() => void run());
    style.add(settings, 'edgeStrokeWidth', 0.2, 4, 0.1).onChange((strokeWidth: number) => {
      canvas.update({ layers: { graph: { edge: { style: { strokeWidth } } } } });
    });
    style.add(settings, 'edgeAlpha', 0, 1, 0.05).onChange((strokeAlpha: number) => {
      canvas.update({ layers: { graph: { edge: { style: { strokeAlpha } } } } });
    });

    const labels = gui.addFolder('Labels');
    labels.add(settings, 'showLabels').onChange(() => applyRadialLabels());
    labels.add(settings, 'labelFontSize', 6, 18, 1).onChange(() => applyRadialLabels());
    labels
      .add(settings, 'sharpLabelsOnZoom')
      .name('Sharp on zoom')
      .onChange((on: boolean) => (on ? labelResolutionLOD.enable() : labelResolutionLOD.disable()));

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'refit').name('Re-fit camera');
  },
};
