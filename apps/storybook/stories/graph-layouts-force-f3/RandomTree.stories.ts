import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphLayer, type GraphEdge, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { generateRandomTree } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'graph-layouts-force-d3/RandomTree' };
export default meta;
type Story = StoryObj;

export const RandomTree: Story = {
  render: () => createContainer({ id: 'graph-d3-tree' }),

  play: async ({ canvasElement }) => {
    // ── Tree data ────────────────────────────────────────────────────────
    const settings = {
      nodeCount: 500,
      chargeStrength: -60,
      chargeDistanceMax: 120,
      linkDistance: 18,
      collideRadius: 5,
      xyAnchorStrength: 0.04,
    };

    // HSL→hex for depth-based colouring (warm root → cool leaves).
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

    const buildGraphData = (): { nodes: GraphNode[]; edges: GraphEdge[] } => {
      const tree = generateRandomTree(settings.nodeCount);

      // Depth via BFS from root (index 0). The dataset doesn't carry depth,
      // but the topology is a tree so a single pass over edges is enough.
      const depths = new Array<number>(tree.nodes.length).fill(0);
      for (const e of tree.edges) depths[e.target] = depths[e.source]! + 1;
      let maxDepth = 0;
      for (const d of depths) if (d > maxDepth) maxDepth = d;

      const colorAt = (depth: number): number => {
        const t = maxDepth === 0 ? 0 : depth / maxDepth;
        return hslToHex(30 + t * 190, 0.65, 0.55); // 30° orange → 220° blue
      };
      const nodes: GraphNode[] = tree.nodes.map((n) => ({
        id: String(n.index),
        data: { fill: colorAt(depths[n.index]!), size: 8 },
      }));
      const edges: GraphEdge[] = tree.edges.map((e, i) => ({
        id: `e${i}`,
        source: String(e.source),
        target: String(e.target),
      }));
      return { nodes, edges };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-d3-tree')!;
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
        edgeDefaults: { stroke: 0x64748b, strokeWidth: 0.8, arrow: false },
      },
    });
    canvas.layers.add(graph);

    let layout: D3ForceLayout | null = null;
    let offDataChanged: (() => void) | null = null;

    const run = (): void => {
      layout?.stop();
      offDataChanged?.();

      graph.setData(buildGraphData());

      offDataChanged = graph.events.on('data:changed', () => {
        canvas.camera.fitContent(graph.getBounds(), 60);
      });

      layout = new D3ForceLayout({
        charge: {
          strength: settings.chargeStrength,
          distanceMax: settings.chargeDistanceMax,
        },
        link: { distance: settings.linkDistance },
        collide: { radius: settings.collideRadius },
        center: { x: 0, y: 0 },
        // Gentle XY anchor keeps the cluster from drifting off-frame
        // without compressing branch spread.
        x: { strength: settings.xyAnchorStrength },
        y: { strength: settings.xyAnchorStrength },
      });
      void layout.apply(graph).then(() => {
        offDataChanged?.();
        offDataChanged = null;
        canvas.camera.fitContent(graph.getBounds(), 60);
      });
    };

    run();

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'RandomTree' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => offDataChanged?.());
    onStoryTeardown(() => layout?.stop());

    const tree = gui.addFolder('Tree');
    tree.add(settings, 'nodeCount', 10, 5000, 10);

    const forces = gui.addFolder('Forces');
    forces.add(settings, 'chargeStrength', -500, 0, 5);
    forces.add(settings, 'chargeDistanceMax', 20, 600, 5).name('charge.distanceMax');
    forces.add(settings, 'linkDistance', 5, 100, 1);
    forces.add(settings, 'collideRadius', 0, 30, 0.5);
    forces.add(settings, 'xyAnchorStrength', 0, 0.2, 0.005).name('x/y anchor strength');

    gui.add({ rebuild: () => run() }, 'rebuild').name('Rebuild & re-apply');
  },
};
