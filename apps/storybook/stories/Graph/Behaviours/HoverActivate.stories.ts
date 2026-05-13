import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, HoverActivateBehaviour, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

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
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: { edgeDefaults: { stroke: 0xcbd5e1, strokeWidth: 1, arrow: false } },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: lesMiserables.edges });

    // Visual states — node + edge each get an 'active' (highlighted) and
    // 'inactive' (dimmed) override.
    graph.setNodeStateConfig('active', { stroke: 0xfacc15, strokeWidth: 3 });
    graph.setEdgeStateConfig('active', { stroke: 0xfacc15, strokeWidth: 2 });
    graph.setNodeStateConfig('inactive', { alpha: 0.2 });
    graph.setEdgeStateConfig('inactive', { alpha: 0.15 });

    canvas.camera.fitContent(graph.getBounds(), 80);
    void new D3ForceLayout({
      charge: -120,
      linkDistance: 50,
      linkStrength: 0.5,
      collide: 14,
    })
      .apply(graph)
      .then(() => canvas.camera.fitContent(graph.getBounds(), 80));

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

    // GUI exposes every option.
    const settings = {
      enabled: true,
      degree: 1,
      direction: 'both' as 'in' | 'out' | 'both',
      inactiveState: 'inactive' as 'inactive' | 'none',
    };
    const apply = (): void => {
      if (settings.enabled) hover.enable();
      else hover.disable();
      hover.setOptions({
        degree: settings.degree,
        direction: settings.direction,
        inactiveState: settings.inactiveState === 'none' ? undefined : 'inactive',
      });
    };
    const gui = new GUI({ title: 'Hover-activate' });
    gui.add(settings, 'enabled').onChange(apply);
    gui.add(settings, 'degree', 0, 4, 1).onChange(apply);
    gui.add(settings, 'direction', ['in', 'out', 'both']).onChange(apply);
    gui.add(settings, 'inactiveState', ['inactive', 'none']).onChange(apply);
  },
};
