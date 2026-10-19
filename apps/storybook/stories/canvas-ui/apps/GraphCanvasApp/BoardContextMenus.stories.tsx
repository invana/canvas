/**
 * **Board context menus — every verb on right-click.** `<BoardContextMenus>`
 * opens a menu on the empty board, a node, a relationship, or a selection of two
 * or more, each headed by what it is for (`Board · Network`, `@jack · User`
 * with the type's colour, `Selection · 4 nodes`). Entries are commands by name —
 * label, shortcut, disabled and checked follow the command — functions, or
 * separators, and any of them may be limited to board `modes`:
 *
 * | Menu | Rows | Edit adds |
 * |---|---|---|
 * | Board | Layout… (the card at the pointer, `<BoardLayoutPopover>`) · Fit · Undo · Redo · Minimap · Lock the view | *Add a node here* |
 * | Node | Centre on it · Hide · Hide every *type* · Copy id | *Delete* (red, last) |
 * | Relationship | Select its two nodes · Hide | *Delete* |
 * | Selection | Hide · Clear selection | *Delete* |
 *
 * Box-select (Shift-drag) a few nodes, then right-click one of them for the
 * selection menu. Switch to Edit from the row to see the Edit rows join.
 * A menu near the board's edge opens up / left so it stays on the board.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { Canvas, CanvasConfig } from '@invana/canvas';
import type { ClickSelectBehaviour, GraphLayer } from '@invana/graph';
import { BoardModes, ControlPanel, ElkLayout, MiniMapLayer, type BoardModeSpec } from '@invana/canvas-react';
import {
  BOARD_LAYOUT_COMMAND,
  BoardContextMenus,
  BoardLayoutPopover,
  GraphCanvasApp,
  type BoardContextMenusProps
} from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BoardContextMenus' };
export default meta;
type Story = StoryObj;

const MODES: BoardModeSpec[] = [
  { id: 'explore', label: 'Explore', icon: 'compass', description: 'Look, ask and expand' },
  { id: 'edit', label: 'Edit', icon: 'pencil', description: 'Add, change and delete data' }
];

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

function graph(canvas: Canvas): GraphLayer | undefined {
  return canvas.layers.get<GraphLayer>('graph');
}

/** `graph.typeVisible` toggles, so hide only a type that is showing. */
function hideType(canvas: Canvas, kind: 'node' | 'edge', type: string): void {
  if (!graph(canvas)?.hiddenTypes[kind].includes(type)) void canvas.commands.run('graph.typeVisible', { layerId: 'graph', kind, type });
}

let added = 0;

const BOARD: NonNullable<BoardContextMenusProps['board']> = ({ canvas, screen, world }) => [
  {
    id: 'add-here',
    label: 'Add a node here',
    shortcut: 'N',
    modes: ['edit'],
    onClick: () => {
      added += 1;
      graph(canvas)?.store.addData({ nodes: [{ id: `New user ${added}`, type: 'User', position: { x: world.x, y: world.y } }], edges: [] });
    }
  },
  { separator: true, modes: ['edit'] },
  { command: BOARD_LAYOUT_COMMAND, args: { x: screen.x, y: screen.y }, label: 'Layout…' },
  { command: 'camera.fit', label: 'Fit to screen', shortcut: '⇧1' },
  { separator: true },
  { command: 'history.undo', label: 'Undo', shortcut: '⌘Z' },
  { command: 'history.redo', label: 'Redo', shortcut: '⇧⌘Z' },
  { separator: true },
  { command: 'layer.visible', args: { id: 'minimap' }, label: 'Minimap' },
  { command: 'view.lock', label: 'Lock the view' }
];

const NODE: NonNullable<BoardContextMenusProps['node']> = ({ canvas, id, type }) => [
  { id: 'focus', label: 'Centre on it', onClick: () => graph(canvas)?.focusNode(id, { zoom: 1.5 }) },
  { separator: true },
  { id: 'hide', label: 'Hide', shortcut: 'H', onClick: () => graph(canvas)?.store.setNodeHidden(id, true) },
  { id: 'hide-type', label: `Hide every ${type}`, onClick: () => hideType(canvas, 'node', type) },
  { separator: true },
  { id: 'copy-id', label: 'Copy id', shortcut: '⌘C', onClick: () => void navigator.clipboard?.writeText(id) },
  { separator: true, modes: ['edit'] },
  { command: 'graph.erase', label: 'Delete', shortcut: '⌫', destructive: true, modes: ['edit'] }
];

const EDGE: NonNullable<BoardContextMenusProps['edge']> = ({ canvas, id }) => [
  {
    id: 'select-ends',
    label: 'Select its two nodes',
    onClick: () => {
      const e = graph(canvas)?.store.getEdge(id);
      if (e) canvas.behaviours.get<ClickSelectBehaviour>('click-select')?.selectMultiple([{ id: e.source }, { id: e.target }]);
    }
  },
  { id: 'hide', label: 'Hide', onClick: () => graph(canvas)?.store.setEdgeHidden(id, true) },
  { separator: true, modes: ['edit'] },
  { command: 'graph.erase', label: 'Delete', shortcut: '⌫', destructive: true, modes: ['edit'] }
];

const SELECTION: NonNullable<BoardContextMenusProps['selection']> = ({ canvas, nodeIds }) => [
  { id: 'hide', label: 'Hide', onClick: () => nodeIds.forEach((n) => graph(canvas)?.store.setNodeHidden(n, true)) },
  { id: 'clear', label: 'Clear selection', shortcut: 'Esc', onClick: () => canvas.behaviours.get<ClickSelectBehaviour>('click-select')?.clearSelection() },
  { separator: true, modes: ['edit'] },
  { command: 'graph.erase', label: 'Delete', shortcut: '⌫', destructive: true, modes: ['edit'] }
];

export const BoardContextMenusStory: Story = {
  name: 'BoardContextMenus',
  render: () => {
    const data = useMemo(() => twitterActivity, []);
    return (
      <GraphCanvasApp data={data} config={CONFIG} header={{ title: 'BoardContextMenus' }}>
        <BoardModes modes={MODES} />
        {/* Tree, Flow and Radial are ELK presets — without it the Layout card offers Network alone. */}
        <ElkLayout id="elk" targetLayerId="graph" />
        <MiniMapLayer backgroundLayerId="background" position="bottom-left" />
        <ControlPanel id="row" position="top-left" offset={12} surface="hairline" items={[{ type: 'widget', widget: 'board-mode' }]} />
        <ControlPanel
          id="hint"
          placement="footer-left"
          items={[{ type: 'text', text: 'Right-click the board, a node or a relationship · Shift-drag to select several' }]}
        />
        <BoardContextMenus board={BOARD} node={NODE} edge={EDGE} selection={SELECTION} />
        <BoardLayoutPopover />
      </GraphCanvasApp>
    );
  }
};
