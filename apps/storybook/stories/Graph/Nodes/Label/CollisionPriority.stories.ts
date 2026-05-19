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
 * Six tightly-packed nodes, one per built-in shape kind, with overlapping
 * labels. Roles:
 *
 * - **force-circle** — `forceShow: true` (always visible).
 * - **pri-low-rect** — `priority: 1` (should lose to its neighbour).
 * - **pri-high-arc** — `priority: 10` (high wins).
 * - **plain-pentagon** — `priority: 5` (mid).
 * - **pinned-star** / **pinned-polygon** — `collisionGroup: 'pinned'`
 *   (their own group; never compete with the rest).
 */
export const CollisionPriority: Story = {
  render: () => createContainer({ id: 'graph-label-collision-priority' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'force-circle',     position: { x: -200, y: 0 }, style: { shape: { kind: 'circle', radius: 10 },                                                                  labelText: 'forceShow: circle — always',           labelForceShow: true } },
      { id: 'pri-low-rect',     position: { x: -100, y: 0 }, style: { shape: { kind: 'rect', width: 26, height: 18, cornerRadius: 4 },                                        labelText: 'priority 1: rect — should hide',       labelPriority: 1 } },
      { id: 'pri-high-arc',     position: { x: -50,  y: 0 }, style: { shape: { kind: 'arc', innerR: 5, outerR: 12, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },         labelText: 'priority 10: arc — should win',        labelPriority: 10 } },
      { id: 'plain-pentagon',   position: { x: 30,   y: 0 }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 11 },                                               labelText: 'plain: pentagon — degree tie',         labelPriority: 5 } },
      { id: 'pinned-star',      position: { x: 120,  y: 0 }, style: { shape: { kind: 'star', points: 5, outerRadius: 12, innerRadius: 5 },                                    labelText: 'pinned A: star — own group',           labelCollisionGroup: 'pinned', labelPriority: 1 } },
      { id: 'pinned-polygon',   position: { x: 200,  y: 0 }, style: { shape: { kind: 'polygon', vertices: [ { x: 11, y: 0 }, { x: 5, y: -10 }, { x: -5, y: -10 }, { x: -11, y: 0 }, { x: -5, y: 10 }, { x: 5, y: 10 } ] }, labelText: 'pinned B: polygon — own group', labelCollisionGroup: 'pinned', labelPriority: 1 } },
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
      updateStyle('force-circle',   { labelForceShow: settings.forceShowLeft });
      updateStyle('pri-low-rect',   { labelPriority: settings.lowPriority });
      updateStyle('pri-high-arc',   { labelPriority: settings.highPriority });
      updateStyle('pinned-star',    { labelCollisionGroup: settings.pinnedSeparateGroup ? 'pinned' : undefined });
      updateStyle('pinned-polygon', { labelCollisionGroup: settings.pinnedSeparateGroup ? 'pinned' : undefined });
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
