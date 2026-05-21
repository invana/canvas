import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Behaviours/HoverActivate' };
export default meta;
type Story = StoryObj;

export const HoverActivate: Story = {
  render: () => createContainer({ id: 'graph-hover-activate' }),

  play: async ({ canvasElement }) => {
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];
    const nodes: GraphNode[] = lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: { group: n.data.group },
      style: {
        shape: { kind: 'circle', radius: 9 },
        bgFill: groupColors[n.data.group % groupColors.length],
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-hover-activate')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          // `hovered` and `dimmed` come from the canonical defaults; this
          // override just bumps `highlighted` to a sharper orange so the
          // N-hop neighbour ring is unmistakable in the demo.
          state: {
            highlighted: { bgStrokeColor: 0xf97316, bgStrokeWidth: 4 },
          },
        },
        edge: {
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' },
          state: {
            highlighted: { strokeColor: 0xf97316, strokeWidth: 2.5 },
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: lesMiserables.edges });

    void new D3ForceLayout({
      charge: { strength: -120 },
      link: { distance: 50 },
      collide: { radius: 14 },
      center: { x: 0, y: 0 },
    }).apply(graph);

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    const hover = new HoverActivateBehaviour({
      id: 'hover',
      layerId: 'graph',
      enabled: true,
      state: 'hovered',
      inactiveState: 'dimmed',
      degree: 1,
      direction: 'both',
      // At low zoom, multiply each hovered node's gfx.scale so the same
      // node — original colour, stroke, label — just grows visually.
      zoomThreshold: 0.4,
      zoomedOutScale: 3,
    });
    canvas.behaviours.register(hover);

    // Every option from HoverActivateBehaviourOptions is bound below.
    // `hoveredId` is a read-only display fed by onHover / onHoverEnd.
    const settings = {
      enable: true,
      state: 'hovered' as 'hovered' | 'highlighted',
      'inactiveState (dim non-hovered)': 'dimmed' as 'dimmed' | 'none',
      'degree (neighbor hops)': 1,
      direction: 'both' as 'in' | 'out' | 'both',
      // Zoom-tier knobs — `zoomedOutScale` of 1 (or 0) disables the
      // multiplier. The trigger is `camera.scale <= zoomThreshold`.
      zoomedOutScale: 3,
      zoomThreshold: 0.4,
      hoveredId: '—',
    };
    const apply = (): void => {
      if (settings.enable) hover.enable();
      else hover.disable();
      const inactive =
        settings['inactiveState (dim non-hovered)'] === 'none'
          ? undefined
          : settings['inactiveState (dim non-hovered)'];
      hover.setOptions({
        state: settings.state,
        inactiveState: inactive,
        degree: settings['degree (neighbor hops)'],
        direction: settings.direction,
        zoomThreshold: settings.zoomThreshold,
        zoomedOutScale: settings.zoomedOutScale,
      });
    };
    hover.setOptions({
      onHover: (el) => {
        settings.hoveredId = el.id;
        gui.controllersRecursive().forEach((c) => c.updateDisplay());
      },
      onHoverEnd: () => {
        settings.hoveredId = '—';
        gui.controllersRecursive().forEach((c) => c.updateDisplay());
      },
    });

    const gui = new GUI({ title: 'Hover Activate' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enable').onChange(apply);
    gui.add(settings, 'state', ['hovered', 'highlighted']).onChange(apply);
    gui
      .add(settings, 'inactiveState (dim non-hovered)', ['dimmed', 'none'])
      .onChange(apply);
    gui.add(settings, 'degree (neighbor hops)', 0, 4, 1).onChange(apply);
    gui.add(settings, 'direction', ['in', 'out', 'both']).onChange(apply);
    gui.add(settings, 'zoomedOutScale', 1, 8, 0.25).onChange(apply);
    gui.add(settings, 'zoomThreshold', 0.05, 2, 0.05).onChange(apply);
    gui.add(settings, 'hoveredId').disable();
  },
};
