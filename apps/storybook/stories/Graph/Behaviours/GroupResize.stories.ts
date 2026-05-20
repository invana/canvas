import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  NodeResizeBehaviour,
  type GraphEdge,
  type GraphNode,
  type NodeStyle,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Behaviours/GroupResize' };
export default meta;
type Story = StoryObj;

/**
 * Comprehensive `NodeResizeBehaviour` demo. Two hosts:
 * - A compound **group** with `style.group.userResizable: true` (writes
 *   back to `style.group.width / height`).
 * - A plain **rect** with `style.resizable: true` (writes back to
 *   `style.shape.width / height`).
 *
 * The lil-gui surfaces every constructor option (`handleRadius`,
 * `handleFill`, `frameColor`, dash pattern, `framePadding`, `minSize`)
 * plus the `enabled` flag and per-host resizable toggles. Constructor
 * options re-register the behaviour live so you can see the selection-
 * frame restyle without reloading the story.
 */
export const GroupResize: Story = {
  render: () => createContainer({ id: 'graph-group-resize' }),

  play: async ({ canvasElement }) => {
    const settings = {
      // Group-side
      groupResizable: true,
      groupAutoFit: false,
      // Plain-rect side
      shapeResizable: true,
      // Behaviour
      enabled: true,
      handleRadius: 5,
      handleFill: 0xffffff,
      frameColor: 0x6b7fff,
      dashLength: 5,
      gapLength: 4,
      framePadding: 4,
      minSize: 20,
    };

    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 260, height: 200, cornerRadius: 8 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { userResizable: true, autoFit: false, padding: 16 },
          labelText: 'Group (drag corners)',
          labelColor: 0x6b7fff,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      {
        id: 'node1',
        parentId: 'group-a',
        position: { x: 60, y: 60 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
      {
        id: 'node2',
        parentId: 'group-a',
        position: { x: 200, y: 60 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
      {
        id: 'plain-rect',
        position: { x: 380, y: 30 },
        style: {
          shape: { kind: 'rect', width: 180, height: 140, cornerRadius: 6 },
          bgFill: 0xfef9c3,
          bgStrokeColor: 0xeab308,
          bgStrokeWidth: 1,
          resizable: true,
          labelText: 'Plain rect (resizable)',
          labelColor: 0xa16207,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
    ];

    const edges: GraphEdge[] = [];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-group-resize')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    // Keep the filter on this story: dragging the frame would conflict
    // with the corner-handle gesture (both consume pointerdown on the
    // same host).
    canvas.behaviours.register(
      new DragNodeBehaviour({
        id: 'drag',
        layerId: 'graph',
        enabled: true,
        filter: (id) => graph.getGroupRole(id) !== 'expanded',
      }),
    );

    /**
     * Constructor-time NodeResize options take effect via re-register —
     * the behaviour stashes them on construction; live updates flow
     * through a destroy → re-register cycle. Cheap (the canvas registry
     * disposes mounts cleanly) and visually instant.
     */
    const buildResize = () =>
      new NodeResizeBehaviour({
        id: 'resize',
        layerId: 'graph',
        enabled: settings.enabled,
        handleRadius: settings.handleRadius,
        handleFill: settings.handleFill,
        frameColor: settings.frameColor,
        dashArray: [settings.dashLength, settings.gapLength],
        framePadding: settings.framePadding,
        minSize: settings.minSize,
      });
    canvas.behaviours.register(buildResize());

    const reregisterResize = (): void => {
      canvas.behaviours.unregister('resize');
      canvas.behaviours.register(buildResize());
    };

    canvas.camera.fitContent(graph.getBounds(), 100);

    const setGroupOption = (key: 'userResizable' | 'autoFit', value: boolean): void => {
      const node = graph.store.getNode('group-a');
      if (!node) return;
      const priorStyle = (node.style ?? {}) as NodeStyle;
      const priorGroup = priorStyle.group ?? {};
      graph.store.updateNode('group-a', {
        style: { ...priorStyle, group: { ...priorGroup, [key]: value } },
      });
    };

    const setShapeResizable = (value: boolean): void => {
      const node = graph.store.getNode('plain-rect');
      if (!node) return;
      const priorStyle = (node.style ?? {}) as NodeStyle;
      graph.store.updateNode('plain-rect', {
        style: { ...priorStyle, resizable: value },
      });
    };

    const gui = new GUI({ title: 'NodeResize options' });
    onStoryTeardown(() => gui.destroy());

    const beh = gui.addFolder('Behaviour');
    beh
      .add(settings, 'enabled')
      .onChange(reregisterResize);
    beh
      .add(settings, 'handleRadius', 2, 14, 1)
      .onChange(reregisterResize);
    beh.addColor(settings, 'handleFill').onChange(reregisterResize);
    beh.addColor(settings, 'frameColor').onChange(reregisterResize);
    beh.add(settings, 'dashLength', 0, 24, 1).onChange(reregisterResize);
    beh.add(settings, 'gapLength', 0, 24, 1).onChange(reregisterResize);
    beh.add(settings, 'framePadding', 0, 20, 1).onChange(reregisterResize);
    beh.add(settings, 'minSize', 5, 60, 1).onChange(reregisterResize);

    const hosts = gui.addFolder('Per-host flags');
    hosts
      .add(settings, 'groupResizable')
      .name('group.userResizable')
      .onChange((v: boolean) => setGroupOption('userResizable', v));
    hosts
      .add(settings, 'groupAutoFit')
      .name('group.autoFit (floor mode)')
      .onChange((v: boolean) => setGroupOption('autoFit', v));
    hosts
      .add(settings, 'shapeResizable')
      .name('plain rect: style.resizable')
      .onChange(setShapeResizable);
  },
};
