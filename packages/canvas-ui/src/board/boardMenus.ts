/**
 * The board's right-click menus, as `BoardContextMenus` takes them.
 *
 * Every verb a board offers on its own — layout, fit, history, the minimap and
 * grid, hide, focus, copy, and in Edit add · edit · delete — plus a host's own
 * entries per target, appended in their own group. *Expand neighbours* runs
 * {@link GRAPH_EXPAND_COMMAND}, which appears only once a host registers it
 * (`GraphBoard`'s `onExpand`): expanding needs the host's data.
 */

import type { Canvas } from '@invana/canvas';
import { type ClickSelectBehaviour, type GraphLayer, type GraphNode, UNKNOWN_TYPE } from '@invana/graph';
import type {
  BoardContextMenusProps,
  BoardMenuEntry,
  BoardSelectionMenuContext,
  BoardTargetMenuContext,
} from '../menus/BoardContextMenus';
import type { GraphContextMenuContext } from '../menus/GraphContextMenuBase';
import { BOARD_LAYOUT_COMMAND } from './BoardLayoutPopover';
import { BOARD_PANEL_COMMAND } from './BoardPanels';
import { editElement } from '../view-panels/element';

/** Expand the selected nodes' neighbours — registered by the host that can fetch them. */
export const GRAPH_EXPAND_COMMAND = 'graph.expand';

/** A host's own entries, appended to each menu in their own group. */
export interface BoardMenuExtras {
  board?: (ctx: GraphContextMenuContext) => BoardMenuEntry[];
  node?: (ctx: BoardTargetMenuContext) => BoardMenuEntry[];
  edge?: (ctx: BoardTargetMenuContext) => BoardMenuEntry[];
  selection?: (ctx: BoardSelectionMenuContext) => BoardMenuEntry[];
}

export interface DefaultBoardMenusOptions {
  /** GraphLayer the menus act on. Default `'graph'`. */
  layerId?: string;
  /** `ClickSelectBehaviour` id. Default `'click-select'`. */
  selectBehaviourId?: string;
  /** *Centre on it* zooms to at least this scale. Default `2`. */
  focusZoom?: number;
  /** A new node's id. Default `new-<uuid>`. */
  newId?: () => string;
  /** The host's own entries. */
  extra?: BoardMenuExtras;
}

/** Open a rail panel — unless it is already open, which the command would close. */
export function openBoardPanel(canvas: Canvas, id: string): void {
  if (canvas.commands.value(BOARD_PANEL_COMMAND) !== id) void canvas.commands.run(BOARD_PANEL_COMMAND, { value: id });
}

/** Open an element in the Element panel's editor. */
export function openElementEditor(canvas: Canvas, kind: 'node' | 'edge', id: string, isNew = false): void {
  editElement(canvas, { kind, id }, { isNew });
  openBoardPanel(canvas, 'element');
}

/** A drawn element's id until a backend gives it its own. */
export function newBoardElementId(): string {
  return `new-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

/** Hide every node or relationship of `type`. */
export function hideType(canvas: Canvas, kind: 'node' | 'edge', type: string, layerId = 'graph'): void {
  const store = canvas.layers.get<GraphLayer>(layerId)?.store;
  if (!store) return;
  if (kind === 'node') {
    for (const n of store.nodes()) if (String(n.type) === type) store.setNodeHidden(n.id, true);
  } else {
    for (const e of store.edges()) if (String(e.type) === type) store.setEdgeHidden(e.id, true);
  }
}

const withExtra = <C>(base: BoardMenuEntry[], extra: ((ctx: C) => BoardMenuEntry[]) | undefined, ctx: C) => {
  const more = extra?.(ctx) ?? [];
  return more.length > 0 ? [...base, { separator: true as const }, ...more] : base;
};

/** The board's four menus, with the host's {@link BoardMenuExtras}. */
export function defaultBoardMenus(
  options: DefaultBoardMenusOptions = {},
): Pick<BoardContextMenusProps, 'board' | 'node' | 'edge' | 'selection'> {
  const { layerId = 'graph', selectBehaviourId = 'click-select', focusZoom = 2, newId = newBoardElementId, extra } = options;
  const layerOf = (canvas: Canvas) => canvas.layers.get<GraphLayer>(layerId);
  const select = (canvas: Canvas) => canvas.behaviours.get<ClickSelectBehaviour>(selectBehaviourId);
  const erase: BoardMenuEntry = { command: 'graph.erase', label: 'Delete', shortcut: '⌫', destructive: true, modes: ['edit'] };

  return {
    board: (ctx) =>
      withExtra(
        [
          {
            id: 'add-here',
            label: 'Add a node here',
            shortcut: 'N',
            modes: ['edit'],
            onClick: () => {
              const node: GraphNode = {
                id: newId(),
                type: UNKNOWN_TYPE,
                position: { x: ctx.world.x, y: ctx.world.y },
                pinned: true,
              };
              layerOf(ctx.canvas)?.store.addData({ nodes: [node], edges: [] });
              openElementEditor(ctx.canvas, 'node', node.id, true);
            },
          },
          { separator: true, modes: ['edit'] },
          { command: BOARD_LAYOUT_COMMAND, args: { x: ctx.screen.x, y: ctx.screen.y }, label: 'Layout…' },
          { command: 'camera.fit', label: 'Fit to screen', shortcut: '⇧1' },
          { separator: true },
          { command: 'history.undo', label: 'Undo', shortcut: '⌘Z' },
          { command: 'history.redo', label: 'Redo', shortcut: '⇧⌘Z' },
          { separator: true },
          { command: 'layer.visible', args: { id: 'minimap' }, label: 'Minimap' },
          { command: 'layer.visible', args: { id: 'background' }, label: 'Background grid' },
          { command: 'view.lock', label: 'Lock the view' },
          { separator: true },
          { id: 'export', label: 'Export…', shortcut: '⇧⌘E', onClick: () => openBoardPanel(ctx.canvas, 'export') },
        ],
        extra?.board,
        ctx,
      ),
    node: (ctx) =>
      withExtra(
        [
          { command: GRAPH_EXPAND_COMMAND, label: 'Expand neighbours' },
          { id: 'focus', label: 'Centre on it', onClick: () => layerOf(ctx.canvas)?.focusNode(ctx.id, { zoom: focusZoom }) },
          { separator: true },
          { id: 'hide', label: 'Hide', shortcut: 'H', onClick: () => layerOf(ctx.canvas)?.store.setNodeHidden(ctx.id, true) },
          { id: 'hide-type', label: `Hide every ${ctx.type}`, onClick: () => hideType(ctx.canvas, 'node', ctx.type, layerId) },
          { id: 'style', label: `Style ${ctx.type}…`, onClick: () => openBoardPanel(ctx.canvas, 'styling') },
          { separator: true },
          { id: 'copy-id', label: 'Copy id', onClick: () => void navigator.clipboard?.writeText(ctx.id) },
          { separator: true, modes: ['edit'] },
          {
            id: 'edit-element',
            label: 'Edit node',
            shortcut: '↵',
            modes: ['edit'],
            onClick: () => openElementEditor(ctx.canvas, 'node', ctx.id),
          },
          erase,
        ],
        extra?.node,
        ctx,
      ),
    edge: (ctx) =>
      withExtra(
        [
          {
            id: 'select-ends',
            label: 'Select its two nodes',
            onClick: () => {
              const e = layerOf(ctx.canvas)?.store.getEdge(ctx.id);
              if (e) select(ctx.canvas)?.selectMultiple([{ id: e.source }, { id: e.target }]);
            },
          },
          { separator: true },
          { id: 'hide', label: 'Hide', onClick: () => layerOf(ctx.canvas)?.store.setEdgeHidden(ctx.id, true) },
          ...(ctx.type
            ? [{ id: 'hide-type', label: `Hide every ${ctx.type}`, onClick: () => hideType(ctx.canvas, 'edge', ctx.type, layerId) }]
            : []),
          { separator: true, modes: ['edit'] },
          {
            id: 'edit-element',
            label: 'Edit relationship',
            modes: ['edit'],
            onClick: () => openElementEditor(ctx.canvas, 'edge', ctx.id),
          },
          erase,
        ],
        extra?.edge,
        ctx,
      ),
    selection: (ctx) =>
      withExtra(
        [
          { command: GRAPH_EXPAND_COMMAND, label: 'Expand all' },
          {
            id: 'hide',
            label: 'Hide',
            onClick: () => {
              for (const n of ctx.nodeIds) layerOf(ctx.canvas)?.store.setNodeHidden(n, true);
            },
          },
          { id: 'export', label: 'Export the selection…', onClick: () => openBoardPanel(ctx.canvas, 'export') },
          { separator: true },
          { id: 'clear', label: 'Clear selection', shortcut: 'Esc', onClick: () => select(ctx.canvas)?.clearSelection() },
          { separator: true, modes: ['edit'] },
          erase,
        ],
        extra?.selection,
        ctx,
      ),
  };
}
