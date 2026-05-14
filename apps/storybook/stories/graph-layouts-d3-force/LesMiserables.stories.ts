/**
 * Force-directed graph — Les Misérables co-occurrence network.
 *
 * Mirrors the canonical Observable example
 * (https://observablehq.com/@d3/force-directed-graph/2): just three
 * forces — `forceLink`, `forceManyBody`, `forceCenter` — and only their
 * primary knobs (link distance, charge strength, center coords) exposed
 * in the GUI.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { DragNodeBehaviour, GraphLayer, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import { DevInfoLayer } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

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

    const nodes: GraphNode[] = lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: {
        group: n.data.group,
        fill: groupColors[n.data.group % groupColors.length],
        size: 10,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-d3-force')!;
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
    canvas.layers.add(new DevInfoLayer({ id: 'dev-info' }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edgeDefaults: { stroke: 0xcbd5e1, strokeWidth: 0.5, arrow: true },
      },
    });
    canvas.layers.add(graph);

    graph.setData({ nodes, edges: lesMiserables.edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    // Matches the Observable example's three forces — `link`, `charge`,
    // `center` — with only `center` exposed in the GUI. `link` and
    // `charge` run at d3-force's own defaults.
    const settings = {
      centerX: 0,
      centerY: 0,
    };

    let layout: D3ForceLayout = buildLayout();

    function buildLayout(): D3ForceLayout {
      const next = new D3ForceLayout({
        link: {},
        charge: {},
        center: { x: settings.centerX, y: settings.centerY },
      });
      // Fit only after the run settles. `forceCenter` keeps the layout
      // around (0, 0) during the sim, so the user can pan / zoom / drag
      // freely while it runs — no per-tick refit fighting their input.
      // next.events.on('end', () => canvas.camera.fitContent(graph.getBounds(), 80));
      return next;
    }

    const run = (): void => {
      void layout.apply(graph);
    };

    const reapply = (): void => {
      layout.stop();
      layout = buildLayout();
      run();
    };

    run();

    const gui = new GUI({ title: 'D3ForceLayout' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => layout.stop());

    gui.add(settings, 'centerX', -1000, 1000, 10).name('center.x');
    gui.add(settings, 'centerY', -1000, 1000, 10).name('center.y');

    gui.add({ apply: () => reapply() }, 'apply').name('Apply (rebuild + run)');
    gui.add({ stop: () => layout.stop() }, 'stop').name('Stop');
    gui.add(
      { fit: () => canvas.camera.fitContent(graph.getBounds(), 80) },
      'fit',
    ).name('Fit to content');
  },
};
