import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { DragNodeBehaviour, GraphLayer, MiniMapLayer, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Layer/MiniMap' };
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
      },
      style: {
        shape: { kind: 'circle', radius: 9 },
        bgFill: groupColors[n.data.group % groupColors.length],
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-minimap')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: lesMiserables.edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 80);
    void new D3ForceLayout({
      charge: { strength: -120 },
      link: { distance: 50 },
      collide: { radius: 14 },
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

    // Every option from MiniMapLayerOptions exposed here.
    const toCss = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
    const parseColor = (s: string): number => parseInt(s.replace('#', ''), 16);
    const settings = {
      enableDrag: true,
      position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      width: 240,
      height: 160,
      backgroundColor: toCss(0x0f172a),
      borderColor: toCss(0x444444),
      borderWidth: 1,
      viewportFill: toCss(0xfacc15),
      viewportStroke: toCss(0xf59e0b),
      viewportFillAlpha: 0.25,
      viewportStrokeWidth: 2,
      padding: 20,
      margin: 10,
    };
    const apply = (): void => {
      minimap.setOptions({
        enableDrag: settings.enableDrag,
        position: settings.position,
        width: settings.width,
        height: settings.height,
        backgroundColor: parseColor(settings.backgroundColor),
        borderColor: parseColor(settings.borderColor),
        borderWidth: settings.borderWidth,
        viewportFill: parseColor(settings.viewportFill),
        viewportStroke: parseColor(settings.viewportStroke),
        viewportFillAlpha: settings.viewportFillAlpha,
        viewportStrokeWidth: settings.viewportStrokeWidth,
        padding: settings.padding,
        margin: settings.margin,
      });
    };
    const gui = new GUI({ title: 'Minimap' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enableDrag').onChange(apply);
    gui
      .add(settings, 'position', ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange(apply);
    gui.add(settings, 'width', 100, 400, 10).onChange(apply);
    gui.add(settings, 'height', 80, 300, 10).onChange(apply);
    gui.add(settings, 'padding', 0, 100, 5).onChange(apply);
    gui.add(settings, 'margin', 0, 60, 2).onChange(apply);
    const bgFolder = gui.addFolder('Chrome');
    bgFolder.addColor(settings, 'backgroundColor').onChange(apply);
    bgFolder.addColor(settings, 'borderColor').onChange(apply);
    bgFolder.add(settings, 'borderWidth', 0, 6, 0.5).onChange(apply);
    const vpFolder = gui.addFolder('Viewport indicator');
    vpFolder.addColor(settings, 'viewportFill').onChange(apply);
    vpFolder.addColor(settings, 'viewportStroke').onChange(apply);
    vpFolder.add(settings, 'viewportFillAlpha', 0, 1, 0.05).onChange(apply);
    vpFolder.add(settings, 'viewportStrokeWidth', 0, 6, 0.5).onChange(apply);

    const hint = document.createElement('div');
    hint.style.cssText =
      'position:absolute; top:10px; left:10px; padding:6px 10px; background:rgba(15,23,42,.85); color:#f8fafc; font:12px/1.2 ui-monospace, monospace; border-radius:4px; z-index:100;';
    hint.textContent = 'Click or drag the minimap to pan the main camera';
    container.appendChild(hint);
  },
};
