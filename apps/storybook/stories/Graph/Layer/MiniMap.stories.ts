import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, MiniMapLayer, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Graph/Layer/MiniMap' };
export default meta;
type Story = StoryObj;

export const MiniMap: Story = {
  render: () => createContainer({ id: 'graph-minimap' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-minimap')!;
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

    canvas.camera.fitContent(graph.getBounds(), 80);
    void new D3ForceLayout({
      charge: -120,
      linkDistance: 50,
      linkStrength: 0.5,
      collide: 14,
    })
      .apply(graph)
      .then(() => canvas.camera.fitContent(graph.getBounds(), 80));

    const minimap = new MiniMapLayer({
      id: 'minimap',
      options: {
        graphLayerId: 'graph',
        width: 240,
        height: 160,
        backgroundColor: 0x0f172a,
        viewportFill: 0xfacc15,
        viewportStroke: 0xf59e0b,
        viewportFillAlpha: 0.25,
        position: 'bottom-right',
      },
    });
    canvas.layers.add(minimap);

    const settings = {
      enableDrag: true,
      position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      width: 240,
      height: 160,
      padding: 20,
    };
    const apply = (): void => {
      minimap.setOptions({
        enableDrag: settings.enableDrag,
        position: settings.position,
        width: settings.width,
        height: settings.height,
        padding: settings.padding,
      });
    };
    const gui = new GUI({ title: 'Minimap' });
    gui.add(settings, 'enableDrag').onChange(apply);
    gui
      .add(settings, 'position', ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange(apply);
    gui.add(settings, 'width', 100, 400, 10).onChange(apply);
    gui.add(settings, 'height', 80, 300, 10).onChange(apply);
    gui.add(settings, 'padding', 0, 100, 5).onChange(apply);

    const hint = document.createElement('div');
    hint.style.cssText =
      'position:absolute; top:10px; left:10px; padding:6px 10px; background:rgba(15,23,42,.85); color:#f8fafc; font:12px/1.2 ui-monospace, monospace; border-radius:4px; z-index:100;';
    hint.textContent = 'Click or drag the minimap to pan the main camera';
    container.appendChild(hint);
  },
};
