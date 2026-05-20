import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
  type NodeStyle,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Groups/RectGroup' };
export default meta;
type Story = StoryObj;

/**
 * Single rectangular compound group enclosing three nodes. Mirrors the
 * outer-frame look in the reference UI: a thin blue stroke around a very
 * light blue fill, label tucked at the top-left corner of the frame.
 *
 * The lil-gui panel toggles `autoFit` and bumps `padding` /
 * `headerHeight` so you can see the frame's tracking math react live —
 * uncheck `autoFit` and the frame stops following children when they're
 * dragged.
 */
export const RectGroup: Story = {
  render: () => createContainer({ id: 'graph-rect-group' }),

  play: async ({ canvasElement }) => {
    const settings = {
      autoFit: true,
      padding: 20,
      headerHeight: 0,
      // `'filled'` → light fill behind children (default look).
      // `'stroke-only'` → no `bgFill`, transparent interior so cross edges
      //   stay visible (matches the GroupWithEdges fix).
      // `'ghost'` → low-alpha tint that hints at the frame without
      //   occluding the canvas underneath.
      bgVariant: 'filled' as 'filled' | 'stroke-only' | 'ghost',
    };

    /**
     * Resolve the bg paint fields for the current `bgVariant`. The store
     * replaces `style` wholesale on update; we spread these onto the rest
     * of the prior style each apply.
     */
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
          // children while expanded; on collapse the layer reuses this
          // declared size so the super-node reads as node-sized.
          shape: { kind: 'rect', width: 80, height: 60, cornerRadius: 8 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: {
            autoFit: settings.autoFit,
            padding: settings.padding,
            headerHeight: settings.headerHeight,
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
      // Drag freely — clicking a child node drags only that child
      // (children sit at zIndex 0 vs the group's −1, so PixiJS's
      // topmost-hit semantics resolve to the child). Clicking the
      // group's empty frame area drags the whole group; `groupAware`
      // defaults to true and translates every descendant in lockstep.
      new DragNodeBehaviour({ id: 'drag', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);

    const gui = new GUI({ title: 'Rect group' });
    onStoryTeardown(() => gui.destroy());
    const apply = (): void => {
      const node = graph.store.getNode('group-a');
      if (!node) return;
      const priorStyle = (node.style ?? {}) as NodeStyle;
      const priorGroup = priorStyle.group ?? {};
      const variant = variantStyle(settings.bgVariant);
      graph.store.updateNode('group-a', {
        style: {
          ...priorStyle,
          // Spread the variant *after* the prior style so it overrides
          // any leftover `bgFill` / `bgAlpha` (otherwise stroke-only
          // wouldn't drop the existing fill).
          ...variant,
          group: {
            ...priorGroup,
            autoFit: settings.autoFit,
            padding: settings.padding,
            headerHeight: settings.headerHeight,
          },
        },
      });
    };
    gui.add(settings, 'autoFit').onChange(apply);
    gui.add(settings, 'padding', 0, 60, 1).onChange(apply);
    gui.add(settings, 'headerHeight', 0, 40, 1).onChange(apply);
    gui
      .add(settings, 'bgVariant', ['filled', 'stroke-only', 'ghost'])
      .name('bgVariant')
      .onChange(apply);
  },
};
