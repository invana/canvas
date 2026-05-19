/**
 * Force-directed lattice — mirrors
 * https://observablehq.com/@d3/force-directed-lattice.
 *
 * An `n × n` grid where each node links to its right and down neighbour.
 * Run through `forceLink + forceManyBody + forceCenter`, the rigid link
 * lengths fight the n-body repulsion and the cluster settles into a
 * gently-deformed lattice — the structure is entirely emergent from the
 * link topology.
 *
 * The GUI exposes every d3-force knob the simulation actually uses
 * (simulation alpha/decay, link, charge, center).
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-force/Lattice' };
export default meta;
type Story = StoryObj;

export const Lattice: Story = {
  render: () => createContainer({ id: 'graph-d3-lattice' }),

  play: async ({ canvasElement }) => {
    // ── Lattice data ─────────────────────────────────────────────────────
    // n × n grid; each node links to (i, j+1) and (i+1, j). Node fill is a
    // simple 2D gradient so distortions in the final layout are easy to read.
    const settings = {
      n: 20,

      // Simulation parameters
      alpha: 1,
      alphaMin: 0.001,
      alphaDecay: 0.0228,
      velocityDecay: 0.4,

      // forceLink
      linkDistance: 30,
      linkStrength: 1,
      linkIterations: 1,

      // forceManyBody
      chargeStrength: -30,
      chargeTheta: 0.9,
      chargeDistanceMax: Infinity,

      // forceCenter
      centerX: 0,
      centerY: 0,
      centerStrength: 1,
    };

    type LatticeNodeData = { i: number; j: number };
    // Captured by the `bgFill` resolver below so the 2D gradient rescales
    // when the grid is rebuilt at a new size.
    let gridSize = Math.max(2, Math.floor(settings.n));

    const buildGraphData = (): { nodes: GraphNode<LatticeNodeData>[]; edges: GraphEdge[] } => {
      const n = Math.max(2, Math.floor(settings.n));
      gridSize = n;
      const nodes: GraphNode<LatticeNodeData>[] = [];
      const edges: GraphEdge[] = [];

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          nodes.push({ id: `${i},${j}`, data: { i, j } });
          if (j < n - 1) {
            edges.push({
              id: `h-${i}-${j}`,
              source: `${i},${j}`,
              target: `${i},${j + 1}`,
            });
          }
          if (i < n - 1) {
            edges.push({
              id: `v-${i}-${j}`,
              source: `${i},${j}`,
              target: `${i + 1},${j}`,
            });
          }
        }
      }

      return { nodes, edges };
    };

    const lerpChannel = (a: number, b: number, t: number): number =>
      Math.round(a + (b - a) * t);

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container =
      canvasElement.querySelector<HTMLDivElement>('#graph-d3-lattice')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    canvas.layers.add(
      new BackgroundLayer({
        id: 'bg',
        options: {
          type: 'pattern',
          patternType: 'dots',
          mode: 'auto',
          backgroundColor: { light: '#f8fafc', dark: '#0f172a' },
          color: { light: '#94a3b8', dark: '#475569' },
          size: 1.5,
          spacing: 24,
          alpha: 0.85,
        },
      }),
    );

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 3 },
            // 2D gradient: top-left warm → bottom-right cool. Rescales each
            // rebuild via `gridSize` captured from `buildGraphData`.
            bgFill: (n: GraphNode) => {
              const d = n.data as LatticeNodeData;
              const t = gridSize <= 1 ? 0 : (d.i + d.j) / (2 * (gridSize - 1));
              const r = lerpChannel(0xf9, 0x38, t);
              const g = lerpChannel(0x73, 0x82, t);
              const b = lerpChannel(0x16, 0xf6, t);
              return (r << 16) | (g << 8) | b;
            },
          },
        },
        edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.8, arrowTargetShape: 'none' } },
      },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    let layout: D3ForceLayout | null = null;

    const buildLayout = (): D3ForceLayout =>
      new D3ForceLayout({
        alpha: settings.alpha,
        alphaMin: settings.alphaMin,
        alphaDecay: settings.alphaDecay,
        velocityDecay: settings.velocityDecay,
        link: {
          distance: settings.linkDistance,
          strength: settings.linkStrength,
          iterations: settings.linkIterations,
        },
        charge: {
          strength: settings.chargeStrength,
          theta: settings.chargeTheta,
          distanceMax: settings.chargeDistanceMax,
        },
        center: {
          x: settings.centerX,
          y: settings.centerY,
          strength: settings.centerStrength,
        },
      });

    const run = (): void => {
      layout?.stop();
      graph.setData(buildGraphData());
      layout = buildLayout();
      void layout.apply(graph);
    };

    run();

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'D3ForceLayout — Lattice' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => layout?.stop());

    const grid = gui.addFolder('Lattice');
    grid.add(settings, 'n', 4, 40, 1).name('n (grid size)');

    const sim = gui.addFolder('Simulation');
    sim.add(settings, 'alpha', 0, 1, 0.01);
    sim.add(settings, 'alphaMin', 0.0001, 0.1, 0.0001);
    sim.add(settings, 'alphaDecay', 0.001, 0.1, 0.001);
    sim.add(settings, 'velocityDecay', 0, 1, 0.01);

    const link = gui.addFolder('forceLink');
    link.add(settings, 'linkDistance', 5, 120, 1).name('distance');
    link.add(settings, 'linkStrength', 0, 2, 0.01).name('strength');
    link.add(settings, 'linkIterations', 1, 10, 1).name('iterations');

    const charge = gui.addFolder('forceManyBody');
    charge.add(settings, 'chargeStrength', -300, 0, 1).name('strength');
    charge.add(settings, 'chargeTheta', 0, 2, 0.05).name('theta');
    charge.add(settings, 'chargeDistanceMax', 50, 2000, 10).name('distanceMax');

    const center = gui.addFolder('forceCenter');
    center.add(settings, 'centerX', -500, 500, 10).name('x');
    center.add(settings, 'centerY', -500, 500, 10).name('y');
    center.add(settings, 'centerStrength', 0, 2, 0.01).name('strength');

    gui.add({ apply: () => run() }, 'apply').name('Apply (rebuild + run)');
    gui.add({ stop: () => layout?.stop() }, 'stop').name('Stop');
    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
