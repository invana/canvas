/**
 * Force-directed graph — Les Misérables co-occurrence network.
 *
 * Mirrors the canonical Observable example
 * (https://observablehq.com/@d3/force-directed-graph/2): just three
 * forces — `forceLink`, `forceManyBody`, `forceCenter` — and only their
 * primary knobs (link distance, charge strength, center coords) exposed
 * in the GUI.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DevInfoLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { GraphCanvas, DragNodeBehaviour, GraphLayer, type GraphNode, ThemeBehaviour } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/d3-force/LesMiserables' };
export default meta;
type Story = StoryObj;

export const LesMiserables: Story = {
  render: () => createContainer({ id: 'graph-d3-force' }),

  play: async ({ canvasElement }) => {
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    type LesMisNodeData = { group: number };
    const nodes: GraphNode<LesMisNodeData>[] = lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: { group: n.data.group },
    }));

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-d3-force')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The `bgFill`-by-group resolver is non-serialisable → it stays in the
    // constructor. Literal node/edge style lives in `canvasOptions` below.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: lesMiserables.edges },
        node: {
          style: {
            bgFill: (n: GraphNode) =>
              groupColors[(n.data as LesMisNodeData).group % groupColors.length]!,
          },
        },
      },
    });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(new DevInfoLayer({ id: 'dev-info' }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));
    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

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
          node: { style: { shape: { kind: 'circle', radius: 5 } } },
          edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 0.5 } },
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
      // Matches the Observable example's three forces — `link`, `charge`,
      // `center` — with only `center` exposed in the GUI. A force is only
      // instantiated when its option key is present, so `link: {}` / `charge: {}`
      // add those forces while leaving every knob at d3-force's own defaults;
      // without them the sim runs `forceCenter` alone and the nodes never
      // spread (they collapse into a tight, unreadable ball).
      layouts: {
        force: { link: {}, charge: {}, center: { x: 0, y: 0 } },
      },
      activeLayout: 'force',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    // initData loads on mount and the active 'force' layout auto-runs against it.

    const gui = new GUI({ title: 'D3ForceLayout' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => forceLayout.stop());

    // Center edits push the whole force config back through update(), which
    // re-heats the running sim. `onFinishChange` so the re-heat fires once.
    const applyForce = (): void =>
      canvas.update({ layouts: { force: canvasOptions.layouts.force } });

    gui.add(canvasOptions.layouts.force.center, 'x', -1000, 1000, 10)
      .name('center.x')
      .onFinishChange(applyForce);
    gui.add(canvasOptions.layouts.force.center, 'y', -1000, 1000, 10)
      .name('center.y')
      .onFinishChange(applyForce);

    gui.add({ stop: () => forceLayout.stop() }, 'stop').name('Stop');
    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
