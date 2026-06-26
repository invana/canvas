/**
 * `GeometricLayout` — `snake` mode. Like `grid`, but every other row reverses
 * direction (a serpentine / boustrophedon fill), so consecutive nodes in store
 * order stay adjacent across row breaks instead of jumping back to the left edge.
 *
 * Rides the shared `OneShotPositionLayout` base, so switching `mode` or tweaking
 * spacing re-runs the layout and the nodes **glide** to their new slots. Use
 * **Shuffle → re-layout** to scatter the nodes and watch them snake back into rows.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, DragNodeBehaviour, GraphLayer, type GraphNode, ThemeBehaviour } from '@invana/graph';
import { GeometricLayout, type GeometricLayoutMode } from '@invana/graph-layout-geometric';
import type { EasingName } from '@invana/canvas';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph-layouts/geometric/Snake' };
export default meta;
type Story = StoryObj;

export const Snake: Story = {
  render: () => createContainer({ id: 'graph-geometric-snake' }),

  play: async ({ canvasElement }) => {
    const PALETTE = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
      0x14b8a6, 0xa3e635,
    ] as const;
    const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;
    const EASINGS: EasingName[] = ['linear', 'easeOutCubic', 'easeInOutCubic', 'easeInOutSine', 'easeOutQuad'];

    const graphData = {
      nodes: lesMiserables.nodes.map((n) => ({
        id: n.id,
        data: n.data,
        style: { bgFill: PALETTE[groupOf(n as GraphNode) % PALETTE.length]! },
      })),
      edges: lesMiserables.edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-geometric-snake')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: graphData } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));
    const layout = new GeometricLayout({ id: 'geo', targetLayerId: 'graph' });
    canvas.layouts.add(layout);

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
          edge: { style: { strokeColor: 0x475569, strokeWidth: 0.6, arrowTargetShape: 'none' } },
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
        geo: {
          mode: 'snake' as GeometricLayoutMode,
          columns: 12,
          columnGap: 60,
          rowGap: 60,
          transition: true as boolean,
          transitionEase: 'easeInOutCubic' as EasingName,
        },
      },
      activeLayout: 'geo',
    };

    onStoryTeardown(layout.events.on('end', () => canvas.camera.fitContent(graph.getBounds(), 60)));
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const gui = new GUI({ title: 'GeometricLayout — Snake' });
    onStoryTeardown(() => gui.destroy());
    const geo = canvasOptions.layouts.geo;
    const push = (): void => canvas.update({ layouts: { geo } });

    const folder = gui.addFolder('Layout');
    folder.add(geo, 'mode', ['grid', 'snake', 'circular'] satisfies GeometricLayoutMode[]).onChange(push);
    folder.add(geo, 'columns', 2, 24, 1).onChange(push);
    folder.add(geo, 'columnGap', 20, 160, 5).onChange(push);
    folder.add(geo, 'rowGap', 20, 160, 5).onChange(push);

    const trans = gui.addFolder('Transition');
    trans.add(geo, 'transition').name('glide').onChange(push);
    trans.add(geo, 'transitionEase', EASINGS).onChange(push);

    const shuffle = (): void => {
      const ids = Array.from(graph.store.nodes(), (n: GraphNode) => n.id);
      const buf = new Float32Array(ids.length * 2);
      for (let i = 0; i < buf.length; i++) buf[i] = (Math.random() - 0.5) * 1400;
      graph.store.setPositionsBulk(ids, buf);
      void canvas.runLayout('geo');
    };
    gui.add({ shuffle }, 'shuffle').name('Shuffle → re-layout');
    gui.add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 60) }, 'fit').name('Fit to content');
  },
};
