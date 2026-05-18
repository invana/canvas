import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  LabelCollisionBehaviour,
  type NodeData,
  type NodeStyle,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/CollisionPriority' };
export default meta;
type Story = StoryObj;

/**
 * `LabelCollisionBehaviour` hides labels whose screen-space bounds
 * overlap. Three knobs on `NodeStyle` shape the outcome:
 *
 * - `labelPriority` — higher wins when two labels collide.
 * - `labelCollisionGroup` — partitions the collision graph; labels in
 *   different groups never compete.
 * - `labelForceShow` — bypass collision entirely (always render).
 *
 * Six tightly-packed nodes with overlapping labels. The middle pair sets
 * `priority: 10` vs `priority: 1` (high wins). The right pair sets a
 * dedicated `collisionGroup: 'pinned'` (never competes with the rest).
 * The leftmost node sets `forceShow: true` so it ignores the collision
 * verdict.
 */
export const CollisionPriority: Story = {
  render: () => createContainer({ id: 'graph-label-collision-priority' }),

  play: async ({ canvasElement }) => {
    // Six nodes packed close enough that all six labels overlap at zoom 1.
    // Each label text is intentionally long to force overlap.
    const nodes: NodeData[] = [
      { id: 'force',         position: { x: -200, y: 0 },  style: { labelText: 'forceShow — always visible', labelForceShow: true } },
      { id: 'pri-low',       position: { x: -100, y: 0 },  style: { labelText: 'priority 1 — should hide',   labelPriority: 1 } },
      { id: 'pri-high',      position: { x: -50,  y: 0 },  style: { labelText: 'priority 10 — should win',   labelPriority: 10 } },
      { id: 'plain-a',       position: { x: 30,   y: 0 },  style: { labelText: 'plain label A — degree tie', labelPriority: 5 } },
      { id: 'group-pinned-a', position: { x: 120, y: 0 },  style: { labelText: 'pinned A — own group', labelCollisionGroup: 'pinned', labelPriority: 1 } },
      { id: 'group-pinned-b', position: { x: 200, y: 0 },  style: { labelText: 'pinned B — own group', labelCollisionGroup: 'pinned', labelPriority: 1 } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-collision-priority')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 10 },
            bgFill: 0x4f9cf9,
            bgStrokeColor: 0x1d4ed8,
            labelFontSize: 12,
            labelFontWeight: 600,
            labelColor: 0x454545,
            labelPlacement: 'bottom',
            labelOffsetY: 4,
            labelBackgroundFill: 0xffffff,
            labelBackgroundStrokeColor: 0xcbd5e1,
            labelBackgroundStrokeWidth: 1,
            labelBackgroundCornerRadius: 4,
            labelBackgroundPadding: 4,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    // The behaviour is what *enforces* the priority / group / forceShow
    // fields above. Without it, every label renders regardless of overlap.
    canvas.behaviours.register(
      new LabelCollisionBehaviour({
        id: 'label-collision',
        layerId: 'graph',
        enabled: true,
        prioritise: 'priority-field',
      }),
    );

    canvas.camera.fitContent(graph.getBounds(), 80);

    const settings = {
      collisionEnabled: true,
      pinnedSeparateGroup: true,
      forceShowLeft: true,
      lowPriority: 1,
      highPriority: 10,
    };
    const apply = (): void => {
      const labelCollision = canvas.behaviours.get('label-collision');
      if (labelCollision) {
        if (settings.collisionEnabled) labelCollision.enable();
        else labelCollision.disable();
      }

      const updateStyle = (id: string, patch: Partial<NodeStyle>): void => {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        graph.store.updateNode(id, { style: { ...prev, ...patch } });
      };
      updateStyle('force',          { labelForceShow: settings.forceShowLeft });
      updateStyle('pri-low',        { labelPriority: settings.lowPriority });
      updateStyle('pri-high',       { labelPriority: settings.highPriority });
      updateStyle('group-pinned-a', { labelCollisionGroup: settings.pinnedSeparateGroup ? 'pinned' : undefined });
      updateStyle('group-pinned-b', { labelCollisionGroup: settings.pinnedSeparateGroup ? 'pinned' : undefined });
    };
    const gui = new GUI({ title: 'Collision' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'collisionEnabled').name('behaviour enabled').onChange(apply);
    gui.add(settings, 'forceShowLeft').name('forceShow (leftmost)').onChange(apply);
    gui.add(settings, 'pinnedSeparateGroup').name('pinned in own group').onChange(apply);
    gui.add(settings, 'lowPriority', 0, 20, 1).onChange(apply);
    gui.add(settings, 'highPriority', 0, 20, 1).onChange(apply);
  },
};
