/**
 * **Group visibility** — hide/show a group container *and its whole subtree* as a
 * unit. A "group" is a container node (`style.group`) whose members are its
 * `parentId` descendants. Unlike `hideNode` (node only, no cascade), `hideGroup`
 * / `showGroup` sweep the container + every descendant in **one flush → one
 * paint**; incident edges follow automatically. The layer emits one
 * `group:visibility { groupId, hidden }` per container that actually transitioned
 * (shown in the log), and `hiddenGroups()` lists the hidden containers for a UI.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer } from '@invana/graph';
import type { GraphEdge, GraphNode } from '@invana/graph';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Groups/GroupVisibility' };
export default meta;
type Story = StoryObj;

export const GroupVisibilityStory: Story = {
  name: 'GroupVisibility',
  render: () => createContainer({ id: 'graph-group-visibility' }),

  play: async ({ canvasElement }) => {
    const groupStyle = (fill: number) => ({
      shape: { kind: 'circle' as const, radius: 34 },
      bgFill: fill,
      bgStrokeColor: 0x6b7fff,
      bgStrokeWidth: 1,
      group: { autoFit: true, padding: 22 },
    });
    const memberStyle = (fill: number) => ({ shape: { kind: 'circle' as const, radius: 16 }, bgFill: fill });

    const nodes: GraphNode[] = [
      { id: 'group-a', type: 'group', position: { x: -160, y: 0 }, style: groupStyle(0xdbe4ff) },
      { id: 'a1', type: 'member', parentId: 'group-a', position: { x: -188, y: 0 }, style: memberStyle(0x3b82f6) },
      { id: 'a2', type: 'member', parentId: 'group-a', position: { x: -132, y: 0 }, style: memberStyle(0x3b82f6) },
      { id: 'group-b', type: 'group', position: { x: 160, y: 0 }, style: groupStyle(0xffe4e6) },
      { id: 'b1', type: 'member', parentId: 'group-b', position: { x: 132, y: 0 }, style: memberStyle(0xf43f5e) },
      { id: 'b2', type: 'member', parentId: 'group-b', position: { x: 188, y: 0 }, style: memberStyle(0xf43f5e) },
      { id: 'hub', type: 'hub', position: { x: 0, y: 140 }, style: memberStyle(0x10b981) },
    ];
    const edge = (id: string, source: string, target: string): GraphEdge => ({
      id,
      source,
      target,
      style: { strokeColor: 0x94a3b8, strokeWidth: 1.2, arrowTargetShape: 'none' },
    });
    const edges: GraphEdge[] = [edge('a1-a2', 'a1', 'a2'), edge('b1-b2', 'b1', 'b2'), edge('a2-hub', 'a2', 'hub'), edge('b1-hub', 'b1', 'hub')];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-group-visibility')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    await canvas.init({
      container,
      autoResize: true,
      config: { behaviours: { pan: { enabled: true }, zoom: { enabled: true } } },
    });
    canvas.camera.fitContent(graph.getBounds(), 60);

    const settings = {
      hiddenGroups: '—',
      hiddenNodes: 0,
      lastEvent: '—',
      hideGroupA: () => graph.hideGroup('group-a'),
      showGroupA: () => graph.showGroup('group-a'),
      toggleGroupB: () => graph.toggleGroupHidden('group-b'),
      showAll: () => graph.showAllHidden(),
    };

    const gui = new GUI({ title: 'Group visibility' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'hideGroupA').name('Hide group A (+ subtree)');
    gui.add(settings, 'showGroupA').name('Show group A');
    gui.add(settings, 'toggleGroupB').name('Toggle group B');
    gui.add(settings, 'showAll').name('Show all');
    gui.add(settings, 'hiddenGroups').name('hidden groups').listen().disable();
    gui.add(settings, 'hiddenNodes').name('hidden nodes').listen().disable();
    gui.add(settings, 'lastEvent').name('last group event').listen().disable();

    const refresh = (): void => {
      const groups = graph.hiddenGroups();
      settings.hiddenGroups = groups.length > 0 ? groups.join(', ') : '—';
      settings.hiddenNodes = graph.store.hiddenNodeCount();
    };
    refresh();
    // Fires once per container that transitioned (no-op calls emit nothing).
    onStoryTeardown(
      graph.events.on('group:visibility', ({ groupId, hidden }) => {
        settings.lastEvent = `${groupId} → ${hidden ? 'hidden' : 'shown'}`;
        refresh();
      }),
    );
    // Also refresh counts on the underlying node visibility churn (descendants).
    onStoryTeardown(graph.store.events.on('node:visibility', refresh));
  },
};
