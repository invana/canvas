/**
 * `GeometricLayout` — `circular` mode. Nodes are spaced evenly around a single
 * circle in store iteration order; the graph's edges then form chords across it
 * (a classic circular / arc-diagram backdrop). The radius auto-derives from the
 * node count and `nodeSpacing`, or pin it with `radius`.
 *
 * Rides the shared `OneShotPositionLayout` base, so switching `mode` or tweaking
 * the circle re-runs the layout and the nodes **glide** to their new slots. Use
 * **Shuffle → re-layout** to scatter the nodes and watch them settle onto the ring.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, DragNodeBehaviour, GraphLayer, type GraphNode, ThemeBehaviour } from '@invana/graph';
import { GeometricLayout, type GeometricLayoutMode } from '@invana/graph-layout-geometric';
import type { EasingName } from '@invana/canvas';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layouts/geometric/Circular' };
export default meta;
type Story = StoryObj;

export const Circular: Story = {
  render: () => createContainer({ id: 'graph-geometric-circular' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-geometric-circular')!;
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
          edge: { style: { strokeColor: 0x475569, strokeWidth: 0.5, strokeAlpha: 0.7, arrowTargetShape: 'none' } },
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
          mode: 'circular' as GeometricLayoutMode,
          radius: 320,
          nodeSpacing: 50,
          startAngle: -Math.PI / 2,
          clockwise: true,
          transition: true as boolean,
          transitionEase: 'easeInOutCubic' as EasingName,
        },
      },
      activeLayout: 'geo',
    };

    onStoryTeardown(layout.events.on('end', () => canvas.camera.fitContent(graph.getBounds(), 60)));
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const gui = new GUI({ title: 'GeometricLayout — Circular' });
    onStoryTeardown(() => gui.destroy());
    const geo = canvasOptions.layouts.geo;
    const push = (): void => canvas.update({ layouts: { geo } });

    const folder = gui.addFolder('Layout');
    folder.add(geo, 'mode', ['grid', 'snake', 'circular'] satisfies GeometricLayoutMode[]).onChange(push);
    folder.add(geo, 'radius', 80, 800, 10).onChange(push);
    folder.add(geo, 'nodeSpacing', 10, 160, 5).name('nodeSpacing (auto-r)').onChange(push);
    folder.add(geo, 'startAngle', -Math.PI, Math.PI, 0.05).onChange(push);
    folder.add(geo, 'clockwise').onChange(push);

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
