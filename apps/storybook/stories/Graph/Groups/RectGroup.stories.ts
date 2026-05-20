import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  NodeResizeBehaviour,
  type GraphEdge,
  type GraphNode,
  type GroupOptions,
  type NodeStyle,
} from '@invana/graph';
import type { TogglePlacement } from '@invana/canvas/primitives';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Groups/RectGroup' };
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
 * Comprehensive rectangular group demo. Every field on {@link GroupOptions}
 * is wired to the lil-gui panel so you can flip behaviours live and watch
 * the layer react: autoFit / fixed-size, padding, headerHeight,
 * behindChildren z-order, collapsed state, frame bg variant, and the
 * `+`/`−` toggle placement (keyword + custom coords).
 *
 * `CollapseExpandBehaviour` and `NodeResizeBehaviour` are registered so
 * the GUI's `userResizable` flag actually mounts the selection-frame
 * handles, and the toggle button responds to clicks.
 */
export const RectGroup: Story = {
  render: () => createContainer({ id: 'graph-rect-group' }),

  play: async ({ canvasElement }) => {
    const settings = {
      // Fit & layout
      autoFit: true,
      padding: 20,
      headerHeight: 0,
      behindChildren: true,
      // Size (used as floor with autoFit, exact size without)
      width: 80,
      height: 60,
      // Collapse / resize
      collapsed: false,
      userResizable: false,
      // Toggle button
      togglePlacement: 'bottom' as TogglePlacement | 'custom',
      togglePosX: 0,
      togglePosY: 0,
      // Frame paint
      bgVariant: 'filled' as 'filled' | 'stroke-only' | 'ghost',
    };

    const variantStyle = (
      v: typeof settings.bgVariant,
    ): { bgFill?: number; bgAlpha?: number } => {
      if (v === 'stroke-only') return { bgFill: undefined, bgAlpha: undefined };
      if (v === 'ghost') return { bgFill: 0x6b7fff, bgAlpha: 0.08 };
      return { bgFill: 0xf5f7ff, bgAlpha: 1 };
    };

    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          // Small declared base — `autoFit: true` grows the frame around
          // children when expanded; on collapse the layer reuses this
          // declared size so the super-node reads as node-sized.
          shape: { kind: 'rect', width: 80, height: 60, cornerRadius: 8 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: {
            autoFit: settings.autoFit,
            padding: settings.padding,
            headerHeight: settings.headerHeight,
            behindChildren: settings.behindChildren,
            collapsed: settings.collapsed,
            userResizable: settings.userResizable,
          },
          labelText: 'Group A',
          labelColor: 0x6b7fff,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      {
        id: 'node1',
        parentId: 'group-a',
        position: { x: -50, y: -30 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node1',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
      {
        id: 'node2',
        parentId: 'group-a',
        position: { x: 50, y: -30 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node2',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
      {
        id: 'node3',
        parentId: 'group-a',
        position: { x: 0, y: 80 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node3',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
    ];

    const edges: GraphEdge[] = [];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-rect-group')!;
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
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new NodeResizeBehaviour({ id: 'resize', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);

    const apply = (): void => {
      const node = graph.store.getNode('group-a');
      if (!node) return;
      const priorStyle = (node.style ?? {}) as NodeStyle;
      const priorShape = priorStyle.shape;
      // Resolve togglePlacement — `'custom'` switches to absolute coords.
      const togglePlacement =
        settings.togglePlacement === 'custom'
          ? { x: settings.togglePosX, y: settings.togglePosY }
          : settings.togglePlacement;
      const group: GroupOptions = {
        autoFit: settings.autoFit,
        padding: settings.padding,
        headerHeight: settings.headerHeight,
        behindChildren: settings.behindChildren,
        collapsed: settings.collapsed,
        userResizable: settings.userResizable,
        width: settings.width,
        height: settings.height,
        togglePlacement,
      };
      graph.store.updateNode('group-a', {
        style: {
          ...priorStyle,
          // Bg variant override — spread after prior so stroke-only clears
          // the leftover bgFill / bgAlpha.
          ...variantStyle(settings.bgVariant),
          // Sync width/height onto the declared shape too so non-autoFit
          // reads them and autoFit treats them as the floor.
          shape: priorShape?.kind === 'rect'
            ? { ...priorShape, width: settings.width, height: settings.height }
            : priorShape,
          group,
        },
      });
    };

    const gui = new GUI({ title: 'Group options' });
    onStoryTeardown(() => gui.destroy());

    const fit = gui.addFolder('Fit & layout');
    fit.add(settings, 'autoFit').onChange(apply);
    fit.add(settings, 'padding', 0, 60, 1).onChange(apply);
    fit.add(settings, 'headerHeight', 0, 40, 1).onChange(apply);
    fit.add(settings, 'behindChildren').onChange(apply);
    fit
      .add(settings, 'width', 30, 400, 1)
      .name('width (floor / fixed)')
      .onChange(apply);
    fit
      .add(settings, 'height', 30, 400, 1)
      .name('height (floor / fixed)')
      .onChange(apply);

    const state = gui.addFolder('State');
    state.add(settings, 'collapsed').name('collapsed (programmatic)').onChange(apply);
    state.add(settings, 'userResizable').onChange(apply);

    const toggle = gui.addFolder('Toggle button');
    toggle
      .add(settings, 'togglePlacement', [...TOGGLE_PLACEMENTS, 'custom'])
      .onChange(apply);
    toggle
      .add(settings, 'togglePosX', -200, 200, 1)
      .name('custom posX (when custom)')
      .onChange(apply);
    toggle
      .add(settings, 'togglePosY', -200, 200, 1)
      .name('custom posY (when custom)')
      .onChange(apply);

    const frame = gui.addFolder('Frame paint');
    frame.add(settings, 'bgVariant', ['filled', 'stroke-only', 'ghost']).onChange(apply);
  },
};
