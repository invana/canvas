import type { Meta, StoryObj } from '@storybook/html-vite';
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
      data: {
        group: n.data.group,
        fill: groupColors[n.data.group % groupColors.length],
        size: 18,
        stroke: 0xffffff,
        strokeWidth: 1,
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
      options: { edgeDefaults: { stroke: 0xcbd5e1, strokeWidth: 1, arrow: false } },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: lesMiserables.edges });

    // Visual states — the GUI can switch between any of these names.
    graph.setNodeStateConfig('active', { stroke: 0xfacc15, strokeWidth: 3 });
    graph.setEdgeStateConfig('active', { stroke: 0xfacc15, strokeWidth: 2 });
    graph.setNodeStateConfig('highlighted', { stroke: 0xf97316, strokeWidth: 4 });
    graph.setEdgeStateConfig('highlighted', { stroke: 0xf97316, strokeWidth: 2.5 });
    graph.setNodeStateConfig('inactive', { alpha: 0.2 });
    graph.setEdgeStateConfig('inactive', { alpha: 0.15 });
    graph.setNodeStateConfig('dimmed', { alpha: 0.45 });
    graph.setEdgeStateConfig('dimmed', { alpha: 0.4 });

    canvas.camera.fitContent(graph.getBounds(), 80);
    void new D3ForceLayout({
      charge: { strength: -120 },
      link: { distance: 50 },
      collide: { radius: 14 },
    })
      .apply(graph)
      .then(() => canvas.camera.fitContent(graph.getBounds(), 80));

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    const hover = new HoverActivateBehaviour({
      id: 'hover',
      layerId: 'graph',
      enabled: true,
      state: 'active',
      inactiveState: 'inactive',
      degree: 1,
      direction: 'both',
    });
    canvas.behaviours.register(hover);

    // Every option from HoverActivateBehaviourOptions is bound below.
    // `hoveredId` is a read-only display fed by onHover / onHoverEnd.
    const settings = {
      enable: true,
      state: 'active' as 'active' | 'highlighted',
      'inactiveState (dim non-hovered)': 'inactive' as 'inactive' | 'dimmed' | 'none',
      'degree (neighbor hops)': 1,
      direction: 'both' as 'in' | 'out' | 'both',
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
    gui.add(settings, 'state', ['active', 'highlighted']).onChange(apply);
    gui
      .add(settings, 'inactiveState (dim non-hovered)', ['inactive', 'dimmed', 'none'])
      .onChange(apply);
    gui.add(settings, 'degree (neighbor hops)', 0, 4, 1).onChange(apply);
    gui.add(settings, 'direction', ['in', 'out', 'both']).onChange(apply);
    gui.add(settings, 'hoveredId').disable();
  },
};
