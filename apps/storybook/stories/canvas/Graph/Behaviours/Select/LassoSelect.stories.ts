import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  LassoSelectBehaviour,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Behaviours/Select/LassoSelect' };
export default meta;
type Story = StoryObj;

export const LassoSelect: Story = {
  render: () => createContainer({ id: 'graph-lasso-select' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-lasso-select')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: lesMiserables.edges } },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph' }));

    const click = new ClickSelectBehaviour({ id: 'click-select', layerId: 'graph' });
    canvas.behaviours.register(click);

    const lasso = new LassoSelectBehaviour({ id: 'lasso-select', layerId: 'graph' });
    canvas.behaviours.register(lasso);

    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    const canvasOptions = {
      layers: {
        graph: {
          node: { state: { selected: { bgStrokeColor: 0xf97316, bgStrokeWidth: 4 } } },
          edge: {
            style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' },
            state: { selected: { strokeColor: 0xf97316, strokeWidth: 2.5 } },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
        'lasso-select': {
          enabled: true,
          trigger: ['shift'],
          enableElements: ['shape', 'connector'],
          style: {
            fill: 0x14b8a6,
            fillAlpha: 0.12,
            stroke: 0x14b8a6,
            strokeWidth: 1.5,
            strokeDash: [6, 4],
          },
        },
      },
      layouts: {
        force: {
          charge: { strength: -120 },
          link: { distance: 50 },
          collide: { radius: 14 },
        },
      },
      activeLayout: 'force',
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });
    onStoryTeardown(
      forceLayout.events.on('end', () => canvas.camera.fitContent(graph.getBounds(), 80)),
    );
    canvas.camera.fitContent(graph.getBounds(), 80);

    // Every option from LassoSelectBehaviourOptions exposed here.
    const toCss = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
    const parseColor = (s: string): number => parseInt(s.replace('#', ''), 16);
    const settings = {
      enable: true,
      pickShapes: true,
      pickConnectors: true,
      'trigger (modifier key)': 'shift' as 'shift' | 'control' | 'alt' | 'meta' | 'none',
      immediately: false,
      state: 'selected' as 'selected' | 'highlighted',
      clearOnBackground: true,
      'style.fill': toCss(0x14b8a6),
      'style.fillAlpha': 0.12,
      'style.stroke': toCss(0x14b8a6),
      'style.strokeAlpha': 0.8,
      'style.strokeWidth': 1.5,
      'style.dashLen': 6,
      'style.gapLen': 4,
    };
    const apply = (): void => {
      if (settings.enable) lasso.enable();
      else lasso.disable();
      const enableElements: ('shape' | 'connector')[] = [];
      if (settings.pickShapes) enableElements.push('shape');
      if (settings.pickConnectors) enableElements.push('connector');
      const trigger =
        settings['trigger (modifier key)'] === 'none'
          ? []
          : [settings['trigger (modifier key)']];
      lasso.setOptions({
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

    const gui = new GUI({ title: 'Lasso Select' });
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

    const hint = document.createElement('div');
    hint.style.cssText =
      'position:absolute; top:10px; left:10px; padding:6px 10px; background:rgba(15,23,42,.85); color:#f8fafc; font:12px/1.2 ui-monospace, monospace; border-radius:4px; z-index:100;';
    hint.textContent = 'Hold shift + drag a freeform loop on empty space';
    container.appendChild(hint);
  },
};
