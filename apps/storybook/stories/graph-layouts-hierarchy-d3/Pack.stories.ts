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

const meta: Meta = { title: 'graph-layouts-hierarchy-d3/Pack' };
export default meta;
type Story = StoryObj;

export const Pack: Story = {
  render: () => createContainer({ id: 'graph-pack' }),

  play: async ({ canvasElement }) => {
    // ── Settings ─────────────────────────────────────────────────────────
    // Pack is the d3 enclosure layout — every node becomes a circle whose
    // area is proportional to its accumulated `value`, and children are
    // packed inside their parent. There are no edges in the visual; the
    // hierarchy is conveyed entirely by containment.
    //
    // The d3 example's recipe:
    //   const root = d3.hierarchy(data).sum(d => d.value).sort((a,b) => b.value - a.value);
    //   const pack = d3.pack().size([w, h]).padding(3);
    //   pack(root);
    // We mirror that — `D3HierarchyLayout` does the `.sum`/`.sort` and
    // `pack()` configuration internally; we just pass `mode: 'pack'`.
    const settings = {
      size: 800,
      padding: 3,
      // Tint internal nodes with a depth-based ramp; leaves get a single
      // accent fill so the structure reads as "containers + contents", the
      // same separation the d3 example uses.
      colorByDepth: true,
      leafFill: 0xfde68a, // amber-200
      strokeAlpha: 0.5,
    };

    // Depth-based colour ramp (cool indigo → cool sky for inner nodes).
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
      const innerColorAt = (depth: number): number => {
        const t = maxDepth === 0 ? 0 : depth / maxDepth;
        // Cool ramp: 250° indigo → 200° sky-blue, low saturation, light.
        return hslToHex(250 - t * 50, 0.35, 0.92 - t * 0.06);
      };
      return {
        nodes: data.nodes.map((n) => ({
          id: n.id,
          // The pack layout will overwrite `size` with the computed diameter
          // once it runs. Until then a tiny placeholder keeps the node from
          // flashing at default size during the initial setData.
          data: {
            // Carry value through so D3HierarchyLayout's pack accessor finds
            // it (defaults to `data.value`, treats missing as 1).
            ...(n.data.value !== undefined ? { value: n.data.value } : {}),
            size: 0.1,
            fill: settings.colorByDepth && !n.data.isLeaf
              ? innerColorAt(n.data.depth)
              : settings.leafFill,
            stroke: 0x64748b,
            strokeWidth: n.data.isLeaf ? 0 : 0.5,
            alpha: n.data.isLeaf ? 1 : settings.strokeAlpha,
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
        nodeDefaults: { shape: 'circle', size: 0.1 },
        edgeDefaults: {
          // Pack conveys hierarchy through enclosure, not links. The data
          // still has parent→child edges (the layout needs them to build
          // the tree), but they're rendered fully transparent so only the
          // packed circles read.
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
    const gui = new GUI({ title: 'Pack' });
    onStoryTeardown(() => gui.destroy());

    const layoutFolder = gui.addFolder('Layout');
    layoutFolder.add(settings, 'size', 200, 2000, 50).onChange(run);
    layoutFolder.add(settings, 'padding', 0, 20, 0.5).onChange(run);

    const style = gui.addFolder('Style');
    style.add(settings, 'colorByDepth').onChange(run);
    style.addColor(settings, 'leafFill').onChange(run);
    style.add(settings, 'strokeAlpha', 0, 1, 0.05).onChange(run);

    gui.add({ refit: () => canvas.camera.fitContent(graph.getBounds(), 40) }, 'refit').name('Re-fit camera');
  },
};
