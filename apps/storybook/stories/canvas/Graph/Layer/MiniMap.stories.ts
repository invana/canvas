import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  DragNodeBehaviour,
  GraphLayer,
  MiniMapLayer,
  type GraphNode,
} from '@invana/graph';
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

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-minimap')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: lesMiserables.edges } },
    });
    // `graphLayerId` is cross-layer wiring → constructor; the minimap's visual
    // options live in the serialisable config below.
    const minimap = new MiniMapLayer({ id: 'minimap', options: { graphLayerId: 'graph' } });
    canvas.layers.add(graph);
    canvas.layers.add(minimap);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    const canvasOptions = {
      layers: {
        graph: {
          edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
        },
        // Every option from MiniMapLayerOptions exposed here.
        minimap: {
          enableDrag: true,
          position: 'bottom-right',
          width: 240,
          height: 160,
          backgroundColor: 0x0f172a,
          borderColor: 0x444444,
          borderWidth: 1,
          viewportFill: 0xfacc15,
          viewportStroke: 0xf59e0b,
          viewportFillAlpha: 0.25,
          viewportStrokeWidth: 2,
          padding: 20,
          margin: 10,
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
      },
      layouts: {
        force: { charge: { strength: -120 }, link: { distance: 50 }, collide: { radius: 14 } },
      },
      activeLayout: 'force',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // The active 'force' layout auto-runs on mount; fit once it settles, plus
    // an initial fit so the first frame is framed.
    onStoryTeardown(
      forceLayout.events.on('end', () => canvas.camera.fitContent(graph.getBounds(), 80)),
    );
    canvas.camera.fitContent(graph.getBounds(), 80);

    // GUI binds straight to the config and pushes each change live via update().
    const mm = canvasOptions.layers.minimap;
    const push = (patch: Record<string, unknown>): void =>
      canvas.update({ layers: { minimap: patch } });

    const gui = new GUI({ title: 'Minimap' });
    onStoryTeardown(() => gui.destroy());
    gui.add(mm, 'enableDrag').onChange((v: boolean) => push({ enableDrag: v }));
    gui
      .add(mm, 'position', ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange((v: string) => push({ position: v }));
    gui.add(mm, 'width', 100, 400, 10).onChange((v: number) => push({ width: v }));
    gui.add(mm, 'height', 80, 300, 10).onChange((v: number) => push({ height: v }));
    gui.add(mm, 'padding', 0, 100, 5).onChange((v: number) => push({ padding: v }));
    gui.add(mm, 'margin', 0, 60, 2).onChange((v: number) => push({ margin: v }));
    const bgFolder = gui.addFolder('Chrome');
    bgFolder.addColor(mm, 'backgroundColor').onChange((v: number) => push({ backgroundColor: v }));
    bgFolder.addColor(mm, 'borderColor').onChange((v: number) => push({ borderColor: v }));
    bgFolder.add(mm, 'borderWidth', 0, 6, 0.5).onChange((v: number) => push({ borderWidth: v }));
    const vpFolder = gui.addFolder('Viewport indicator');
    vpFolder.addColor(mm, 'viewportFill').onChange((v: number) => push({ viewportFill: v }));
    vpFolder.addColor(mm, 'viewportStroke').onChange((v: number) => push({ viewportStroke: v }));
    vpFolder.add(mm, 'viewportFillAlpha', 0, 1, 0.05).onChange((v: number) => push({ viewportFillAlpha: v }));
    vpFolder.add(mm, 'viewportStrokeWidth', 0, 6, 0.5).onChange((v: number) => push({ viewportStrokeWidth: v }));

    const hint = document.createElement('div');
    hint.style.cssText =
      'position:absolute; top:10px; left:10px; padding:6px 10px; background:rgba(15,23,42,.85); color:#f8fafc; font:12px/1.2 ui-monospace, monospace; border-radius:4px; z-index:100;';
    hint.textContent = 'Click or drag the minimap to pan the main camera';
    container.appendChild(hint);
  },
};
