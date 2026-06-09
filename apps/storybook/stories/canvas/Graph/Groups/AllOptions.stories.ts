import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  NodeResizeBehaviour,
  type GraphEdge,
  type GraphNode,
  type GroupOptions,
  type NodeStyle,
} from '@invana/graph';
import type { ShapeLabelPlacement, TogglePlacement } from '@invana/canvas/primitives';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Groups/AllOptions' };
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

const LABEL_PLACEMENTS: ShapeLabelPlacement[] = [
  'center',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
  'top-left',
  'inside-top',
  'inside-top-right',
  'inside-right',
  'inside-bottom-right',
  'inside-bottom',
  'inside-bottom-left',
  'inside-left',
  'inside-top-left',
  'inside-center',
];

/**
 * Single-group playground. Every option that affects how a group renders
 * is exposed in the lil-gui: shape kind + size, the full
 * {@link GroupOptions} surface, the flat paint fields on
 * `NodeStyle.bg*`, the label fields, and live enable/disable for the
 * three group-related behaviours (drag, collapse/expand, resize).
 *
 * Three child circles live inside the group so autoFit, collapse, and
 * resize all have something visible to act on.
 */
export const AllOptions: Story = {
  render: () => createContainer({ id: 'graph-all-options' }),

  play: async ({ canvasElement }) => {
    const settings = {
      // ─── Shape ──────────────────────────────────────────────────
      shapeKind: 'rect' as 'rect' | 'circle',
      width: 80,
      height: 60,
      radius: 36,
      cornerRadius: 8,
      // ─── Group (full GroupOptions) ──────────────────────────────
      autoFit: true,
      padding: 20,
      headerHeight: 0,
      behindChildren: true,
      collapsed: false,
      userResizable: false,
      togglePlacement: 'bottom' as TogglePlacement | 'custom',
      togglePosX: 0,
      togglePosY: 60,
      // ─── Frame paint ────────────────────────────────────────────
      bgFill: 0xf5f7ff,
      bgAlpha: 1,
      bgStrokeColor: 0x6b7fff,
      bgStrokeWidth: 1,
      bgStrokeAlpha: 1,
      bgStrokeDashOn: false,
      bgStrokeDash: 4,
      bgStrokeGap: 3,
      // ─── Label ──────────────────────────────────────────────────
      labelText: 'Group A',
      labelColor: 0x6b7fff,
      labelFontSize: 11,
      labelFontWeight: 600,
      labelPlacement: 'inside-top-left' as ShapeLabelPlacement,
      labelOffsetX: 0,
      labelOffsetY: 0,
      // ─── Behaviours ─────────────────────────────────────────────
      dragEnabled: true,
      collapseEnabled: true,
      resizeEnabled: true,
    };

    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: settings.width, height: settings.height, cornerRadius: settings.cornerRadius },
          bgFill: settings.bgFill,
          bgStrokeColor: settings.bgStrokeColor,
          bgStrokeWidth: settings.bgStrokeWidth,
          group: {
            autoFit: settings.autoFit,
            padding: settings.padding,
          },
          labelText: settings.labelText,
          labelColor: settings.labelColor,
          labelFontSize: settings.labelFontSize,
          labelFontWeight: settings.labelFontWeight,
          labelPlacement: settings.labelPlacement,
        },
      },
      {
        id: 'node1',
        parentId: 'group-a',
        position: { x: -50, y: -30 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6, labelText: 'node1', labelPlacement: 'bottom', labelOffsetY: 6, labelColor: 0x334155, labelFontSize: 12 },
      },
      {
        id: 'node2',
        parentId: 'group-a',
        position: { x: 50, y: -30 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6, labelText: 'node2', labelPlacement: 'bottom', labelOffsetY: 6, labelColor: 0x334155, labelFontSize: 12 },
      },
      {
        id: 'node3',
        parentId: 'group-a',
        position: { x: 0, y: 70 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6, labelText: 'node3', labelPlacement: 'bottom', labelOffsetY: 6, labelColor: 0x334155, labelFontSize: 12 },
      },
    ];

    const edges: GraphEdge[] = [];

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-all-options')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const dragBehaviour = new DragNodeBehaviour({
      id: 'drag',
      layerId: 'graph',
      // Skip dragging the expanded frame here — `NodeResize` and drag
      // would race for the same pointer-down otherwise. Toggle the
      // resize behaviour off in the GUI and you can drag the frame.
      filter: (id) => graph.getGroupRole(id) !== 'expanded',
    });
    canvas.behaviours.register(dragBehaviour);
    const collapseBehaviour = new CollapseExpandBehaviour({
      id: 'collapse-expand',
      layerId: 'graph',
    });
    canvas.behaviours.register(collapseBehaviour);
    const resizeBehaviour = new NodeResizeBehaviour({
      id: 'resize',
      layerId: 'graph',
    });
    canvas.behaviours.register(resizeBehaviour);

    // Initial enabled-state comes from `settings.*Enabled`; the GUI toggles
    // them live via each instance's enable()/disable() below.
    const canvasOptions = {
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        drag: { enabled: settings.dragEnabled },
        'collapse-expand': { enabled: settings.collapseEnabled },
        resize: { enabled: settings.resizeEnabled },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 100);

    /** Build the full {@link NodeStyle} for the group from the current settings. */
    const buildStyle = (): NodeStyle => {
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
        togglePlacement,
        ...(settings.shapeKind === 'rect'
          ? { width: settings.width, height: settings.height }
          : { radius: settings.radius }),
      };
      const shape =
        settings.shapeKind === 'rect'
          ? ({ kind: 'rect' as const, width: settings.width, height: settings.height, cornerRadius: settings.cornerRadius })
          : ({ kind: 'circle' as const, radius: settings.radius });
      const bgStrokeDashArray: readonly [number, number] | undefined =
        settings.bgStrokeDashOn ? [settings.bgStrokeDash, settings.bgStrokeGap] : undefined;
      return {
        shape,
        bgFill: settings.bgFill,
        bgAlpha: settings.bgAlpha,
        bgStrokeColor: settings.bgStrokeColor,
        bgStrokeWidth: settings.bgStrokeWidth,
        bgStrokeAlpha: settings.bgStrokeAlpha,
        ...(bgStrokeDashArray ? { bgStrokeDashArray } : {}),
        group,
        labelText: settings.labelText,
        labelColor: settings.labelColor,
        labelFontSize: settings.labelFontSize,
        labelFontWeight: settings.labelFontWeight,
        labelPlacement: settings.labelPlacement,
        labelOffsetX: settings.labelOffsetX,
        labelOffsetY: settings.labelOffsetY,
      };
    };

    const apply = (): void => {
      graph.store.updateNode('group-a', { style: buildStyle() });
    };

    const gui = new GUI({ title: 'Group — all options' });
    onStoryTeardown(() => gui.destroy());

    const shape = gui.addFolder('Shape');
    shape.add(settings, 'shapeKind', ['rect', 'circle']).onChange(apply);
    shape.add(settings, 'width', 30, 400, 1).name('width (rect)').onChange(apply);
    shape.add(settings, 'height', 30, 400, 1).name('height (rect)').onChange(apply);
    shape.add(settings, 'radius', 20, 200, 1).name('radius (circle)').onChange(apply);
    shape.add(settings, 'cornerRadius', 0, 40, 1).name('cornerRadius (rect)').onChange(apply);

    const group = gui.addFolder('Group');
    group.add(settings, 'autoFit').onChange(apply);
    group.add(settings, 'padding', 0, 60, 1).onChange(apply);
    group.add(settings, 'headerHeight', 0, 40, 1).onChange(apply);
    group.add(settings, 'behindChildren').onChange(apply);
    group.add(settings, 'collapsed').name('collapsed (programmatic)').onChange(apply);
    group.add(settings, 'userResizable').onChange(apply);

    const toggle = gui.addFolder('Toggle button');
    toggle
      .add(settings, 'togglePlacement', [...TOGGLE_PLACEMENTS, 'custom'])
      .onChange(apply);
    toggle.add(settings, 'togglePosX', -200, 200, 1).name('custom posX').onChange(apply);
    toggle.add(settings, 'togglePosY', -200, 200, 1).name('custom posY').onChange(apply);

    const paint = gui.addFolder('Frame paint');
    paint.addColor(settings, 'bgFill').onChange(apply);
    paint.add(settings, 'bgAlpha', 0, 1, 0.05).onChange(apply);
    paint.addColor(settings, 'bgStrokeColor').onChange(apply);
    paint.add(settings, 'bgStrokeWidth', 0, 6, 0.5).onChange(apply);
    paint.add(settings, 'bgStrokeAlpha', 0, 1, 0.05).onChange(apply);
    paint.add(settings, 'bgStrokeDashOn').name('dashed stroke').onChange(apply);
    paint.add(settings, 'bgStrokeDash', 1, 24, 1).name('dash length').onChange(apply);
    paint.add(settings, 'bgStrokeGap', 0, 24, 1).name('gap length').onChange(apply);

    const label = gui.addFolder('Label');
    label.add(settings, 'labelText').onChange(apply);
    label.addColor(settings, 'labelColor').onChange(apply);
    label.add(settings, 'labelFontSize', 8, 32, 1).onChange(apply);
    label.add(settings, 'labelFontWeight', [300, 400, 500, 600, 700, 800]).onChange(apply);
    label.add(settings, 'labelPlacement', LABEL_PLACEMENTS).onChange(apply);
    label.add(settings, 'labelOffsetX', -40, 40, 1).onChange(apply);
    label.add(settings, 'labelOffsetY', -40, 40, 1).onChange(apply);

    const beh = gui.addFolder('Behaviours');
    beh.add(settings, 'dragEnabled').name('DragNode enabled').onChange((on: boolean) => (on ? dragBehaviour.enable() : dragBehaviour.disable()));
    beh.add(settings, 'collapseEnabled').name('CollapseExpand enabled').onChange((on: boolean) => (on ? collapseBehaviour.enable() : collapseBehaviour.disable()));
    beh.add(settings, 'resizeEnabled').name('NodeResize enabled').onChange((on: boolean) => (on ? resizeBehaviour.enable() : resizeBehaviour.disable()));

    // Apply once on load so any settings defaults that diverged from the
    // initial GraphNode declaration take effect immediately.
    apply();
  },
};
