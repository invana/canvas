import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  COLLAPSED_STATE,
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  NodeResizeBehaviour,
  ThemeBehaviour,
  type GraphEdge,
  type GraphNode,
  type GroupOptions,
  type NodeStyle
} from '@invana/graph';
import type { TogglePlacement } from '@invana/canvas';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Groups/RectGroup' };
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
export const RectGroupStory: Story = {
  name: 'RectGroup',
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
      bgVariant: 'filled' as 'filled' | 'stroke-only' | 'ghost'
    };

    // Alpha only — the *fill* is the theme's `cardBg`, so the three variants are
    // three weights of one themed colour rather than three pinned hexes.
    // `stroke-only` still unsets `bgFill` outright: a transparent interior is
    // what keeps a cross-group connector visible (see `GroupWithEdges`).
    const variantStyle = (
      v: typeof settings.bgVariant,
    ): { bgFill?: undefined; bgAlpha?: number } => {
      if (v === 'stroke-only') return { bgFill: undefined, bgAlpha: undefined };
      return { bgAlpha: v === 'ghost' ? 0.08 : 1 };
    };

    const nodes: GraphNode[] = [
      { type: 'node',
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          // Small declared base — `autoFit: true` grows the frame around
          // children when expanded; on collapse the layer reuses this
          // declared size so the super-node reads as node-sized.
          shape: { kind: 'rect', width: 80, height: 60, cornerRadius: 8 },
          // No frame colour: an unset `bgFill` / `bgStrokeColor` resolves from
          // the theme (`cardBg` / `divider`) and re-resolves on every switch.
          bgStrokeWidth: 1,
          group: {
            autoFit: settings.autoFit,
            padding: settings.padding,
            headerHeight: settings.headerHeight,
            behindChildren: settings.behindChildren,
            userResizable: settings.userResizable
          },
          labelText: 'Group A',
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left'
        }
      },
      { type: 'node',
        id: 'node1',
        parentId: 'group-a',
        position: { x: -50, y: -30 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node1',
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6
        }
      },
      { type: 'node',
        id: 'node2',
        parentId: 'group-a',
        position: { x: 50, y: -30 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node2',
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6
        }
      },
      { type: 'node',
        id: 'node3',
        parentId: 'group-a',
        position: { x: 0, y: 80 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node3',
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6
        }
      },
    ];

    const edges: GraphEdge[] = [];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-rect-group')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', targetLayerId: 'graph' }),
    );
    canvas.behaviours.register(new NodeResizeBehaviour({ id: 'resize', targetLayerId: 'graph' }));

    const canvasOptions = {
      behaviours: {
        // Named-palette mode: no `targetLayerId`, no `light`/`dark` shorthand,
        // so the whole canvas recolours — frame, labels, edges and backdrop —
        // and follows the toolbar's *family* as well as its light/dark kind.
        theme: { enabled: true, mode: 'document' },
        pan: { enabled: true },
        zoom: { enabled: true },
        drag: { enabled: true },
        'collapse-expand': { enabled: true },
        resize: { enabled: true }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 100);

    const apply = (): void => {
      const node = graph.store.getNode('group-a');
      if (!node) return;
      // Drop the paint keys before re-spreading: `updateNode` replaces `style`
      // wholesale, and a leftover `bgFill: undefined` from `stroke-only` would
      // keep the frame transparent after switching back to `filled`.
      const prior = { ...((node.style ?? {}) as NodeStyle) } as Record<string, unknown>;
      delete prior.bgFill;
      delete prior.bgAlpha;
      const priorStyle = prior as NodeStyle;
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
        userResizable: settings.userResizable,
        width: settings.width,
        height: settings.height,
        togglePlacement
      };
      graph.store.updateNode('group-a', {
        style: {
          ...priorStyle,
          ...variantStyle(settings.bgVariant),
          // Sync width/height onto the declared shape too so non-autoFit
          // reads them and autoFit treats them as the floor.
          shape: priorShape?.kind === 'rect'
            ? { ...priorShape, width: settings.width, height: settings.height }
            : priorShape,
          group
        }
      });
      // Open / closed is a node *state*, not a group option — same channel the
      // `+` / `−` toggle writes to.
      graph.store.setNodeState('group-a', COLLAPSED_STATE, settings.collapsed);
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
  }
};
