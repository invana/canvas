import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour
} from '@invana/canvas';
import { DragNodeBehaviour, GraphCanvas, GraphLayer, type GraphEdge, type GraphNode, ThemeBehaviour } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { generateRandomTree } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-force/RandomTree' };
export default meta;
type Story = StoryObj;

export const RandomTreeStory: Story = {
  name: 'RandomTree',
  render: () => createContainer({ id: 'graph-d3-tree' }),

  play: async ({ canvasElement }) => {
    // ── Tree data ────────────────────────────────────────────────────────
    const settings = {
      nodeCount: 500,
      chargeStrength: -60,
      chargeDistanceMax: 120,
      linkDistance: 18,
      collideRadius: 5,
      xyAnchorStrength: 0.04
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

    type TreeNodeData = { depth: number };
    // Updated each rebuild; the layer-level `bgFill` resolver closes over it
    // so colours rescale automatically when the tree grows or shrinks.
    let maxDepth = 0;

    const buildGraphData = (): { nodes: GraphNode<TreeNodeData>[]; edges: GraphEdge[] } => {
      const tree = generateRandomTree(settings.nodeCount);

      // Depth via BFS from the root (id '0'). The dataset doesn't carry depth,
      // but the topology is a tree so a single pass over edges is enough — the
      // generator emits ids in parent-before-child order.
      const depths = new Map<string, number>(tree.nodes.map((n) => [n.id, 0]));
      for (const e of tree.edges) depths.set(e.target, (depths.get(e.source) ?? 0) + 1);
      maxDepth = 0;
      for (const d of depths.values()) if (d > maxDepth) maxDepth = d;

      const nodes: GraphNode<TreeNodeData>[] = tree.nodes.map((n) => ({ type: 'node',
        id: n.id,
        data: { depth: depths.get(n.id)! }
      }));
      return { nodes, edges: tree.edges };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-d3-tree')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The `bgFill` resolver closes over `maxDepth` so it can't be serialised —
    // it stays in the constructor; the literal circle shape goes to config.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: buildGraphData(),
        node: {
          style: {
            // 30° orange (root) → 220° blue (leaves), rescaling per rebuild.
            bgFill: (n: GraphNode) => {
              const depth = (n.data as TreeNodeData).depth;
              const t = maxDepth === 0 ? 0 : depth / maxDepth;
              return hslToHex(30 + t * 190, 0.65, 0.55);
            }
          }
        }
      }
    });

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));

    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    const canvasOptions = {
      layers: {
        bg: { type: 'solid', backgroundColor: '#0b1220' },
        graph: {
          node: { style: { shape: { kind: 'circle', radius: 4 } } },
          edge: { style: { strokeColor: 0x64748b, strokeWidth: 0.8, arrowTargetShape: 'none' } }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        theme: {
          enabled: true,
          mode: 'system',
          light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
          dark: { backgroundColor: '#0b1220', color: '#475569' }
        }
      },
      layouts: {
        force: {
          charge: {
            strength: settings.chargeStrength,
            distanceMax: settings.chargeDistanceMax
          },
          link: { distance: settings.linkDistance },
          collide: { radius: settings.collideRadius },
          center: { x: 0, y: 0 },
          // Gentle XY anchor keeps the cluster from drifting off-frame
          // without compressing branch spread.
          x: { strength: settings.xyAnchorStrength },
          y: { strength: settings.xyAnchorStrength }
        }
      },
      activeLayout: 'force'
    };

    // initData loads on mount; `activeLayout` runs itself once data is present.
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Re-feed live data; the topology change re-triggers the active layout.
    const rebuild = (): void => graph.setData(buildGraphData());

    // Push edited force params back through config; re-heats the sim once.
    const reheat = (): void =>
      canvas.update({ layouts: { force: canvasOptions.layouts.force } });

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'RandomTree' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => forceLayout.stop());

    const tree = gui.addFolder('Tree');
    tree.add(settings, 'nodeCount', 10, 5000, 10);

    const forces = gui.addFolder('Forces');
    forces
      .add(canvasOptions.layouts.force.charge, 'strength', -500, 0, 5)
      .name('chargeStrength')
      .onFinishChange(reheat);
    forces
      .add(canvasOptions.layouts.force.charge, 'distanceMax', 20, 600, 5)
      .name('charge.distanceMax')
      .onFinishChange(reheat);
    forces
      .add(canvasOptions.layouts.force.link, 'distance', 5, 100, 1)
      .name('linkDistance')
      .onFinishChange(reheat);
    forces
      .add(canvasOptions.layouts.force.collide, 'radius', 0, 30, 0.5)
      .name('collideRadius')
      .onFinishChange(reheat);
    forces
      .add(canvasOptions.layouts.force.x, 'strength', 0, 0.2, 0.005)
      .name('x/y anchor strength')
      .onFinishChange((v: number) => {
        canvasOptions.layouts.force.y.strength = v;
        reheat();
      });

    gui.add({ rebuild }, 'rebuild').name('Rebuild & re-apply');
  }
};
