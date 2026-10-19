import { useCallback } from 'react';
import type { Canvas } from '@invana/canvas';
import type { ClickSelectBehaviour, ContextMenuEvent, GraphLayer } from '@invana/graph';
import { inBoardMode, useBoardMode, useCanvas } from '@invana/canvas-react';
import type { MenuItem } from '@invana/ui';

import type { ToolbarIcon } from '../components';
import type { MenuHeader } from '../components/MenuItemList';
import { nodeSwatchColor } from '../view-panels/element-display';
import { commandMenuItems, type CommandMenuRef } from './commandMenuItems';
import { GraphContextMenuRoot, type GraphContextMenuContext } from './GraphContextMenuBase';

/** What every board menu entry can say about itself. */
interface BoardMenuEntryBase {
  /** Board modes the entry shows in. Default: every mode. */
  modes?: string[];
}

/** A row that runs a command — label, shortcut, disabled and checked come from the command. */
export interface BoardMenuCommand extends CommandMenuRef, BoardMenuEntryBase {
  /** Removes or deletes something: drawn in the destructive colour, last in its group. */
  destructive?: boolean;
}

/** A row that runs a function — for what is not a command (open a panel the host owns). */
export interface BoardMenuAction extends BoardMenuEntryBase {
  id: string;
  label: string;
  onClick: () => void;
  icon?: ToolbarIcon;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
}

/** A line between groups. */
export interface BoardMenuSeparator extends BoardMenuEntryBase {
  separator: true;
}

/** One entry of a board menu. */
export type BoardMenuEntry = BoardMenuCommand | BoardMenuAction | BoardMenuSeparator;

/** A node or edge menu's context: the shared one, the element and its type. */
export interface BoardTargetMenuContext extends GraphContextMenuContext {
  readonly id: string;
  readonly type: string;
  readonly data: unknown;
}

/** The selection menu's context: what is selected. */
export interface BoardSelectionMenuContext extends GraphContextMenuContext {
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
}

export interface BoardContextMenusProps {
  /** GraphLayer the menus watch. Default `'graph'`. */
  layerId?: string;
  /** `ClickSelectBehaviour` the selection is read from. Default `'click-select'`. */
  selectBehaviourId?: string;
  /** Right-click on the empty board. */
  board?: (ctx: GraphContextMenuContext) => BoardMenuEntry[];
  /** Right-click on a node that is not part of a larger selection. */
  node?: (ctx: BoardTargetMenuContext) => BoardMenuEntry[];
  /** Right-click on a relationship. */
  edge?: (ctx: BoardTargetMenuContext) => BoardMenuEntry[];
  /** Right-click on a node that is one of two or more selected. */
  selection?: (ctx: BoardSelectionMenuContext) => BoardMenuEntry[];
  /** Icons by name for command entries, merged over the control-panel registry. */
  icons?: Record<string, ToolbarIcon>;
}

/**
 * The board's **right-click menus** — the empty board, a node, a relationship,
 * a selection — each headed by what it is for (`LHR · airport` with the type's
 * colour, `Board · Network`, `Selection · 12 nodes`), then its verbs.
 *
 * Entries are commands by name (label, shortcut, disabled and checked follow the
 * command), functions, or separators, and any of them may be limited to board
 * `modes`, so one declaration covers Explore, Edit and Annotate. A right-click
 * on a node that is part of a selection of two or more opens the selection
 * menu; any other node is selected as its menu opens, so the commands act on it.
 * Separators that end up leading, trailing or doubled are dropped.
 */
export function BoardContextMenus({
  layerId = 'graph',
  selectBehaviourId = 'click-select',
  board,
  node,
  edge,
  selection,
  icons,
}: BoardContextMenusProps) {
  const canvas = useCanvas();
  const mode = useBoardMode(canvas);

  const toItems = useCallback(
    (entries: readonly BoardMenuEntry[]): MenuItem[] => menuItems(canvas, entries, mode, icons),
    [canvas, mode, icons],
  );

  const buildBoard = useCallback(
    (_e: ContextMenuEvent, base: GraphContextMenuContext) =>
      board ? { items: toItems(board(base)), header: { title: 'Board', sub: presetLabel(canvas) } } : [],
    [board, toItems, canvas],
  );

  const buildNode = useCallback(
    (e: ContextMenuEvent, base: GraphContextMenuContext) => {
      const id = e.id as string;
      const select = canvas.behaviours.get<ClickSelectBehaviour>(selectBehaviourId);
      const picked = select?.getSelectedShapeIds() ?? [];
      if (selection && picked.length > 1 && picked.includes(id)) {
        const edgeIds = select?.getSelectedConnectorIds() ?? [];
        return {
          items: toItems(selection({ ...base, nodeIds: picked, edgeIds })),
          header: { title: 'Selection', sub: `${picked.length} nodes` },
        };
      }
      if (!node) return [];
      if (select && !select.isSelected(id)) {
        select.clearSelection();
        select.select(id, 'shape');
      }
      const layer = canvas.layers.get<GraphLayer>(layerId);
      const n = layer?.store.getNode(id);
      const type = n?.type ?? '';
      const swatch = n && layer ? nodeSwatchColor(layer.resolveNodeStyle(n)) : undefined;
      const header: MenuHeader = { title: id, sub: type, ...(swatch ? { swatch } : {}) };
      return { items: toItems(node({ ...base, id, type, data: e.data })), header };
    },
    [canvas, layerId, selectBehaviourId, node, selection, toItems],
  );

  const buildEdge = useCallback(
    (e: ContextMenuEvent, base: GraphContextMenuContext) => {
      if (!edge) return [];
      const id = e.id as string;
      const ed = canvas.layers.get<GraphLayer>(layerId)?.store.getEdge(id);
      const type = ed?.type ?? '';
      const title = ed ? `${ed.source} → ${ed.target}` : id;
      return { items: toItems(edge({ ...base, id, type, data: e.data })), header: { title, sub: type } };
    },
    [canvas, layerId, edge, toItems],
  );

  return (
    <>
      {board && <GraphContextMenuRoot target="canvas" id="board-menu" layerId={layerId} build={buildBoard} />}
      {(node || selection) && <GraphContextMenuRoot target="node" id="board-node-menu" layerId={layerId} build={buildNode} />}
      {edge && <GraphContextMenuRoot target="edge" id="board-edge-menu" layerId={layerId} build={buildEdge} />}
    </>
  );
}

/** The active layout preset's name, for the board menu's header. */
function presetLabel(canvas: Canvas): string | undefined {
  const id = canvas.store.view.getState().definition.layoutPreset?.id;
  if (!id) return undefined;
  return canvas.commands.options('layout.preset').find((o) => o.value === id)?.label ?? id;
}

/** Entries → kit `MenuItem`s for the current mode, with separators tidied. */
export function menuItems(
  canvas: Canvas,
  entries: readonly BoardMenuEntry[],
  mode: string | null,
  icons?: Record<string, ToolbarIcon>,
): MenuItem[] {
  const out: MenuItem[] = [];
  const ids = new Map<string, number>();
  /** The id, suffixed when an earlier row took it — a command listed twice with other args. */
  const unique = (id: string): string => {
    const seen = ids.get(id) ?? 0;
    ids.set(id, seen + 1);
    return seen === 0 ? id : `${id}#${seen}`;
  };
  let n = 0;
  for (const entry of entries) {
    if (!inBoardMode(entry.modes, mode)) continue;
    if ('separator' in entry) {
      if (out.length > 0 && !out[out.length - 1]!.separator) out.push({ id: `sep-${n++}`, label: '', separator: true });
      continue;
    }
    if ('command' in entry) {
      const items = commandMenuItems(canvas, [entry], icons ? { icons } : {});
      for (const item of items) out.push({ ...item, id: unique(item.id), ...(entry.destructive ? { destructive: true } : {}) });
      continue;
    }
    out.push({
      id: unique(entry.id),
      label: entry.label,
      ...(entry.icon ? { icon: entry.icon } : {}),
      ...(entry.shortcut ? { shortcut: entry.shortcut } : {}),
      ...(entry.destructive ? { destructive: true } : {}),
      ...(entry.disabled ? { disabled: true } : { onClick: entry.onClick }),
    });
  }
  while (out.length > 0 && out[out.length - 1]!.separator) out.pop();
  return out;
}
