import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Behaviours/Select/BrushSelect' };
export default meta;
type Story = StoryObj;

export const BrushSelect: Story = {
  render: () => createContainer({ id: 'graph-brush-select' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-brush-select')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: { state: { selected: { bgStrokeColor: 0xf97316, bgStrokeWidth: 4 } } },
        edge: {
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' },
          state: { selected: { strokeColor: 0xf97316, strokeWidth: 2.5 } },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: lesMiserables.edges });

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

    // ClickSelectBehaviour first so Brush can delegate to it for unified
    // selection state. Default `clickSelectId` matches its id below.
    const click = new ClickSelectBehaviour({
      id: 'click-select',
      layerId: 'graph',
      enabled: true,
      multiple: true,
      trigger: ['shift'],
    });
    canvas.behaviours.register(click);

    const brush = new BrushSelectBehaviour({
      id: 'brush-select',
      layerId: 'graph',
      enabled: true,
      trigger: ['shift'],
      enableElements: ['shape', 'connector'],
      style: {
        fill: 0x1677ff,
        fillAlpha: 0.12,
        stroke: 0x1677ff,
        strokeWidth: 1,
        strokeDash: [4, 4],
      },
    });
    canvas.behaviours.register(brush);

    // Every option from BrushSelectBehaviourOptions surfaced here.
    const toCss = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
    const settings = {
      enable: true,
      pickShapes: true,
      pickConnectors: true,
      'trigger (modifier key)': 'shift' as 'shift' | 'control' | 'alt' | 'meta' | 'none',
      immediately: false,
      state: 'selected' as 'selected' | 'highlighted',
      clearOnBackground: true,
      'style.fill': toCss(0x1677ff),
      'style.fillAlpha': 0.12,
      'style.stroke': toCss(0x1677ff),
      'style.strokeAlpha': 0.8,
      'style.strokeWidth': 1,
      'style.dashLen': 4,
      'style.gapLen': 4,
    };
    const parseColor = (s: string): number => parseInt(s.replace('#', ''), 16);
    const apply = (): void => {
      if (settings.enable) brush.enable();
      else brush.disable();
      const enableElements: ('shape' | 'connector')[] = [];
      if (settings.pickShapes) enableElements.push('shape');
      if (settings.pickConnectors) enableElements.push('connector');
      const trigger =
        settings['trigger (modifier key)'] === 'none'
          ? []
          : [settings['trigger (modifier key)']];
      brush.setOptions({
        enableElements,
        trigger,
        immediately: settings.immediately,
        state: settings.state,
        clearOnBackground: settings.clearOnBackground,
        style: {
          fill: parseColor(settings['style.fill']),
          fillAlpha: settings['style.fillAlpha'],
          stroke: parseColor(settings['style.stroke']),
          strokeAlpha: settings['style.strokeAlpha'],
          strokeWidth: settings['style.strokeWidth'],
          strokeDash: [settings['style.dashLen'], settings['style.gapLen']],
        },
      });
    };

    const gui = new GUI({ title: 'Brush Select' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enable').onChange(apply);
    gui.add(settings, 'pickShapes').onChange(apply);
    gui.add(settings, 'pickConnectors').onChange(apply);
    gui
      .add(settings, 'trigger (modifier key)', ['shift', 'control', 'alt', 'meta', 'none'])
      .onChange(apply);
    gui.add(settings, 'immediately').onChange(apply);
    gui.add(settings, 'state', ['selected', 'highlighted']).onChange(apply);
    gui.add(settings, 'clearOnBackground').onChange(apply);
    const styleFolder = gui.addFolder('Style');
    styleFolder.addColor(settings, 'style.fill').onChange(apply);
    styleFolder.add(settings, 'style.fillAlpha', 0, 1, 0.05).onChange(apply);
    styleFolder.addColor(settings, 'style.stroke').onChange(apply);
    styleFolder.add(settings, 'style.strokeAlpha', 0, 1, 0.05).onChange(apply);
    styleFolder.add(settings, 'style.strokeWidth', 0, 6, 0.5).onChange(apply);
    styleFolder.add(settings, 'style.dashLen', 0, 20, 1).onChange(apply);
    styleFolder.add(settings, 'style.gapLen', 0, 20, 1).onChange(apply);
    gui.add({ clear: () => click.clearSelection() }, 'clear');

    // Helper text
    const hint = document.createElement('div');
    hint.style.cssText =
      'position:absolute; top:10px; left:10px; padding:6px 10px; background:rgba(15,23,42,.85); color:#f8fafc; font:12px/1.2 ui-monospace, monospace; border-radius:4px; z-index:100;';
    hint.textContent = 'Hold shift + drag on empty space to brush-select';
    container.appendChild(hint);
  },
};
