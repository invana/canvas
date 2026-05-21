import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
  type GroupOptions,
  type NodeStyle,
} from '@invana/graph';
import type { TogglePlacement } from '@invana/canvas/primitives';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Behaviours/CollapseExpand' };
export default meta;
type Story = StoryObj;

const TOGGLE_PLACEMENTS: TogglePlacement[] = [
  'top',
  'right',
  'bottom',
  'left',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'inside-top',
  'inside-right',
  'inside-bottom',
  'inside-left',
];

/**
 * Group + outside node + cross-group edge. Click the `−` / `+` toggle at
 * the bottom of the group's frame to collapse / expand — descendants
 * hide, the frame renders as a super-node carrying a count badge, and
 * the cross edge re-routes to the group automatically.
 *
 * The lil-gui surfaces the full configurable surface:
 *
 * - **Behaviour** — `enabled` flag (live disable / re-enable to test).
 * - **Group state** — `collapsed` (programmatic flip, equivalent to
 *   clicking the toggle).
 * - **Toggle button** — `togglePlacement` keyword or raw `{ x, y }`
 *   coords (`'custom'` mode uses the slider values).
 */
export const CollapseExpand: Story = {
  render: () => createContainer({ id: 'graph-collapse-expand' }),

  play: async ({ canvasElement }) => {
    const settings = {
      behaviourEnabled: true,
      collapsed: false,
      togglePlacement: 'bottom' as TogglePlacement | 'custom',
      togglePosX: 0,
      togglePosY: 60,
    };

    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 32 },
          bgFill: 0xb4c0e9,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 24 },
        },
      },
      {
        id: 'node1',
        parentId: 'group-a',
        position: { x: -28, y: 0 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
      {
        id: 'node2',
        parentId: 'group-a',
        position: { x: 28, y: 0 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
      {
        id: 'outside',
        position: { x: 240, y: 0 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
    ];

    const edges: GraphEdge[] = [
      {
        id: 'cross',
        source: 'node2',
        target: 'outside',
        style: { strokeColor: 0x94a3b8, strokeWidth: 1, arrowTargetShape: 'none' },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-collapse-expand')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag', layerId: 'graph', enabled: true }),
    );
    const collapseExpand = new CollapseExpandBehaviour({
      id: 'collapse-expand',
      layerId: 'graph',
      enabled: settings.behaviourEnabled,
    });
    canvas.behaviours.register(collapseExpand);

    canvas.camera.fitContent(graph.getBounds(), 100);

    const applyGroupOptions = (): void => {
      const node = graph.store.getNode('group-a');
      if (!node) return;
      const priorStyle = (node.style ?? {}) as NodeStyle;
      const togglePlacement =
        settings.togglePlacement === 'custom'
          ? { x: settings.togglePosX, y: settings.togglePosY }
          : settings.togglePlacement;
      const priorGroup = (priorStyle.group ?? {}) as GroupOptions;
      graph.store.updateNode('group-a', {
        style: {
          ...priorStyle,
          group: {
            ...priorGroup,
            collapsed: settings.collapsed,
            togglePlacement,
          },
        },
      });
    };

    const gui = new GUI({ title: 'CollapseExpand' });
    onStoryTeardown(() => gui.destroy());

    const beh = gui.addFolder('Behaviour');
    beh
      .add(settings, 'behaviourEnabled')
      .name('enabled')
      .onChange((on: boolean) => (on ? collapseExpand.enable() : collapseExpand.disable()));

    const state = gui.addFolder('Group state');
    state.add(settings, 'collapsed').name('collapsed (programmatic)').onChange(applyGroupOptions);

    const toggle = gui.addFolder('Toggle button');
    toggle
      .add(settings, 'togglePlacement', [...TOGGLE_PLACEMENTS, 'custom'])
      .onChange(applyGroupOptions);
    toggle
      .add(settings, 'togglePosX', -200, 200, 1)
      .name('custom posX')
      .onChange(applyGroupOptions);
    toggle
      .add(settings, 'togglePosY', -200, 200, 1)
      .name('custom posY')
      .onChange(applyGroupOptions);
  },
};
