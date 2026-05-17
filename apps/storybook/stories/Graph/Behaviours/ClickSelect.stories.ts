import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphNode,
  type SelectModifierKey,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

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
      data: { group: n.data.group },
      style: {
        shape: { kind: 'circle', radius: 9 },
        bgFill: groupColors[n.data.group % groupColors.length],
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-click-select')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          state: {
            selected: { bgStrokeColor: 0xf97316, bgStrokeWidth: 4 },
            highlighted: { bgStrokeColor: 0xfacc15, bgStrokeWidth: 4 },
            muted: { bgAlpha: 0.2 },
            dimmed: { bgAlpha: 0.45 },
          },
        },
        edge: {
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' },
          state: {
            selected: { strokeColor: 0xf97316, strokeWidth: 2.5 },
            highlighted: { strokeColor: 0xfacc15, strokeWidth: 2.5 },
            muted: { strokeAlpha: 0.15 },
            dimmed: { strokeAlpha: 0.4 },
          },
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

    const click = new ClickSelectBehaviour({
      id: 'click-select',
      layerId: 'graph',
      enabled: true,
      multiple: true,
      trigger: ['shift'],
      degree: 1,
      state: 'selected',
      clearOnBackground: true,
    });
    canvas.behaviours.register(click);

    // Every option from ClickSelectBehaviourOptions is bound below. The two
    // read-only counters are updated by `onSelectionChange`.
    const settings = {
      enable: true,
      multiple: true,
      'trigger (modifier key)': 'shift' as SelectModifierKey | 'none',
      'degree (neighbor hops)': 1,
      direction: 'both' as 'in' | 'out' | 'both',
      state: 'selected' as 'selected' | 'highlighted',
      'unselectedState (dim non-selected)': 'muted' as 'muted' | 'dimmed' | 'none',
      clearOnBackground: true,
      selectedNodes: 0,
      selectedEdges: 0,
    };

    const apply = (): void => {
      if (settings.enable) click.enable();
      else click.disable();
      const trigger =
        settings['trigger (modifier key)'] === 'none'
          ? []
          : [settings['trigger (modifier key)'] as SelectModifierKey];
      const unsel =
        settings['unselectedState (dim non-selected)'] === 'none'
          ? ''
          : settings['unselectedState (dim non-selected)'];
      click.setOptions({
        multiple: settings.multiple,
        trigger,
        degree: settings['degree (neighbor hops)'],
        direction: settings.direction,
        state: settings.state,
        unselectedState: unsel,
        clearOnBackground: settings.clearOnBackground,
      });
    };

    // Wire the selection counters back to GUI displays.
    click.setOptions({
      onSelectionChange: ({ shapeIds, connectorIds }) => {
        settings.selectedNodes = shapeIds.length;
        settings.selectedEdges = connectorIds.length;
        gui.controllersRecursive().forEach((c) => c.updateDisplay());
      },
    });

    const gui = new GUI({ title: 'Click Select' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enable').onChange(apply);
    gui.add(settings, 'multiple').onChange(apply);
    gui
      .add(settings, 'trigger (modifier key)', ['shift', 'control', 'alt', 'meta', 'none'])
      .onChange(apply);
    gui.add(settings, 'degree (neighbor hops)', 0, 4, 1).onChange(apply);
    gui.add(settings, 'direction', ['in', 'out', 'both']).onChange(apply);
    gui.add(settings, 'state', ['selected', 'highlighted']).onChange(apply);
    gui
      .add(settings, 'unselectedState (dim non-selected)', ['muted', 'dimmed', 'none'])
      .onChange(apply);
    gui.add(settings, 'clearOnBackground').onChange(apply);
    gui.add(settings, 'selectedNodes').disable();
    gui.add(settings, 'selectedEdges').disable();
    gui.add({ clear: () => click.clearSelection() }, 'clear');
  },
};
