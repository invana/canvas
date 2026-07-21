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

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphCanvas, DragNodeBehaviour, GraphLayer, ThemeBehaviour } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { generateLattice } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-force/Lattice' };
export default meta;
type Story = StoryObj;

export const Lattice: Story = {
  render: () => createContainer({ id: 'graph-d3-lattice' }),

  play: async ({ canvasElement }) => {
    // `nodeSize` sizes the lattice grid (data). Everything else — layer styles,
    // behaviour flags, force params — lives in `canvasOptions` below.
    const nodeSize = 20;
    const graphData = generateLattice(nodeSize);

    // ── Add everything, then init() last ─────────────────────────────────
    const container =
      canvasElement.querySelector<HTMLDivElement>('#graph-d3-lattice')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // 1) Register layers / behaviours / layout by id (mounting is deferred until
    //    init). Only wiring lives here — all settings are in the config below.
    const graph = new GraphLayer({ id: 'graph', options: { initData: graphData } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));
    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    // 2) init() last — renderer + ALL settings in one serialisable config,
    //    keyed by id. Could come from a settings UI or a saved file;
    //    `canvas.get()` reads it back. `enabled: true` turns a behaviour on.

    const canvasOptions = {
        layers: {
          bg: {
            type: 'pattern',
            patternType: 'dots',
            backgroundColor: '#0f172a',
            color: '#475569',
            size: 1.5,
            spacing: 24,
            alpha: 0.85,
          },
          graph: {
            node: { style: { shape: { kind: 'circle', radius: 3 }, bgFill: 0x60a5fa } },
            edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.8, arrowTargetShape: 'none' } },
          },
        },
        behaviours: {
          pan: { enabled: true },
          zoom: { enabled: true },
          'drag-node': { enabled: true },
          theme: {
            enabled: true,
            mode: 'system',
            light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
            dark: { backgroundColor: '#0f172a', color: '#475569' },
          },
        },
        layouts: { 
          force: {
            alpha: 1,
            alphaMin: 0.001,
            alphaDecay: 0.0228,
            velocityDecay: 0.4,
            link: { distance: 30, strength: 1, iterations: 1 },
            charge: { strength: -30, theta: 0.9, distanceMax: Infinity },
            center: { x: 0, y: 0, strength: 1 },
          },
        },
        // Which layout runs — GraphCanvas auto-applies it to its target layer
        // when data arrives (below) and on any later topology change.
        activeLayout: 'force',
      };
    await canvas.init({
      container,
      autoResize: true,
      config: canvasOptions,
    });
    // Data was set on the graph layer (options.data); on mount it loads, and the
    // active 'force' layout auto-runs against it. Nothing else to call.

    // ── GUI ──────────────────────────────────────────────────────────────
    // Controls bind straight to `canvasOptions` (the config is the source of
    // truth) and push the change live through canvas.update.
    const gui = new GUI({ title: 'D3ForceLayout — Lattice' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => forceLayout.stop());

    const node = canvasOptions.layers.graph.node.style;
    const edge = canvasOptions.layers.graph.edge.style;

    const look = gui.addFolder('Appearance (live — canvas.update)');
    look.addColor(node, 'bgFill').onChange((v: number) =>
      canvas.update({ layers: { graph: { node: { style: { bgFill: v } } } } }),
    );
    look.add(node.shape, 'radius', 1, 12, 0.5).onChange((v: number) =>
      canvas.update({ layers: { graph: { node: { style: { shape: { kind: 'circle', radius: v } } } } } }),
    );
    look.addColor(edge, 'strokeColor').onChange((v: number) =>
      canvas.update({ layers: { graph: { edge: { style: { strokeColor: v } } } } }),
    );
    look.add(edge, 'strokeWidth', 0.2, 4, 0.1).onChange((v: number) =>
      canvas.update({ layers: { graph: { edge: { style: { strokeWidth: v } } } } }),
    );

    // Force-param edits push the whole `settings` back through update(), which
    // re-heats the running sim. `onFinishChange` so the re-heat fires once per
    // adjustment, not on every drag tick.
    const applyForce = (): void => canvas.update({ layouts: { force: canvasOptions.layouts.force } });

    const sim = gui.addFolder('Simulation');
    sim.add(canvasOptions.layouts.force, 'alpha', 0, 1, 0.01).onFinishChange(applyForce);
    sim.add(canvasOptions.layouts.force, 'alphaMin', 0.0001, 0.1, 0.0001).onFinishChange(applyForce);
    sim.add(canvasOptions.layouts.force, 'alphaDecay', 0.001, 0.1, 0.001).onFinishChange(applyForce);
    sim.add(canvasOptions.layouts.force, 'velocityDecay', 0, 1, 0.01).onFinishChange(applyForce);

    const link = gui.addFolder('forceLink');
    link.add(canvasOptions.layouts.force.link, 'distance', 5, 120, 1).onFinishChange(applyForce);
    link.add(canvasOptions.layouts.force.link, 'strength', 0, 2, 0.01).onFinishChange(applyForce);
    link.add(canvasOptions.layouts.force.link, 'iterations', 1, 10, 1).onFinishChange(applyForce);

    const charge = gui.addFolder('forceManyBody');
    charge.add(canvasOptions.layouts.force.charge, 'strength', -300, 0, 1).onFinishChange(applyForce);
    charge.add(canvasOptions.layouts.force.charge, 'theta', 0, 2, 0.05).onFinishChange(applyForce);
    charge.add(canvasOptions.layouts.force.charge, 'distanceMax', 50, 2000, 10).onFinishChange(applyForce);

    const center = gui.addFolder('forceCenter');
    center.add(canvasOptions.layouts.force.center, 'x', -500, 500, 10).onFinishChange(applyForce);
    center.add(canvasOptions.layouts.force.center, 'y', -500, 500, 10).onFinishChange(applyForce);
    center.add(canvasOptions.layouts.force.center, 'strength', 0, 2, 0.01).onFinishChange(applyForce);

    gui.add({ stop: () => forceLayout.stop() }, 'stop').name('Stop');
    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
