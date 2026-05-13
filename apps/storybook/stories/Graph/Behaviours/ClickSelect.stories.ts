import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ClickSelectBehaviour, GraphLayer, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Graph/Behaviours/ClickSelect' };
export default meta;
type Story = StoryObj;

export const ClickSelect: Story = {
  render: () => createContainer({ id: 'graph-click-select' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-click-select')!;
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

    graph.setNodeStateConfig('selected', { stroke: 0xf97316, strokeWidth: 4 });
    graph.setEdgeStateConfig('selected', { stroke: 0xf97316, strokeWidth: 2.5 });
    graph.setNodeStateConfig('muted', { alpha: 0.2 });
    graph.setEdgeStateConfig('muted', { alpha: 0.15 });

    canvas.camera.fitContent(graph.getBounds(), 80);
    void new D3ForceLayout({
      charge: -120,
      linkDistance: 50,
      linkStrength: 0.5,
      collide: 14,
    })
      .apply(graph)
      .then(() => canvas.camera.fitContent(graph.getBounds(), 80));

    const counter = document.createElement('div');
    counter.style.cssText =
      'position:absolute; top:10px; left:10px; padding:6px 10px; background:rgba(15,23,42,.85); color:#f8fafc; font:12px/1.2 ui-monospace, monospace; border-radius:4px; z-index:100;';
    counter.textContent = 'selected: 0 nodes, 0 edges';
    container.appendChild(counter);

    const click = new ClickSelectBehaviour({
      id: 'click-select',
      layerId: 'graph',
      enabled: true,
      multiple: true,
      trigger: ['shift'],
      degree: 0,
      state: 'selected',
      onSelectionChange: ({ shapeIds, connectorIds }) => {
        counter.textContent = `selected: ${shapeIds.length} nodes, ${connectorIds.length} edges`;
      },
    });
    canvas.behaviours.register(click);

    const settings = {
      enabled: true,
      multiple: true,
      degree: 0,
      direction: 'both' as 'in' | 'out' | 'both',
      muteUnselected: false,
      clearOnBackground: true,
    };
    const apply = (): void => {
      if (settings.enabled) click.enable();
      else click.disable();
      click.setOptions({
        multiple: settings.multiple,
        degree: settings.degree,
        direction: settings.direction,
        unselectedState: settings.muteUnselected ? 'muted' : '',
        clearOnBackground: settings.clearOnBackground,
      });
    };
    const gui = new GUI({ title: 'Click-select' });
    gui.add(settings, 'enabled').onChange(apply);
    gui.add(settings, 'multiple').onChange(apply);
    gui.add(settings, 'degree', 0, 4, 1).onChange(apply);
    gui.add(settings, 'direction', ['in', 'out', 'both']).onChange(apply);
    gui.add(settings, 'muteUnselected').onChange(apply);
    gui.add(settings, 'clearOnBackground').onChange(apply);
    gui.add({ clear: () => click.clearSelection() }, 'clear');
  },
};
