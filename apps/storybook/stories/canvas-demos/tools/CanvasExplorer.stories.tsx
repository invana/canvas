/**
 * **Canvas Explorer — the Invana Explorer board, context menu first.** On screen
 * only what changes what a drag does (the mode and its tools), what must be seen
 * (the minimap and the zoom) and the panel rail; every other verb is on a
 * right-click menu, and on ⌘K.
 *
 * | Where | What | canvas-ui |
 * |---|---|---|
 * | top-left | the mode picker, then the mode's tools — Select ▾ (Select · Lasso · Box); in Edit *Add node* · *Connect*; in Annotate its tools, not built yet; in both, Undo · Redo · Redraw | `<BoardModes>` (canvas-react) · `board-mode` widget · `select.mode` / `tool.active` items with `modes` |
 * | top-right | the panel rail — Legend · Styling · History · Properties, Notes (Annotate), Changes with its count (Edit, or while unsaved), a line, Export — and one floating panel left of it | `<BoardPanels>` · `LegendViewPanel` · `StylingViewPanel` · `HistoryViewPanel` · `PropertiesViewPanel` · `ChangesViewPanel` · `ExportViewPanel` |
 * | bottom-left | the view dock: the minimap over − · the zoom field ▾ · + · Fit · lock | `MiniMapLayer` · `zoom-field` widget |
 * | right-click | the board, a node, a relationship, a selection — each headed by what it is for | `<BoardContextMenus>` · `<BoardLayoutPopover>` (*Layout…* at the pointer) |
 * | footer | the hint, and the pan | `view-readout` (`show: 'pan'`) |
 *
 * **Edit.** *Add node* (N): click the board to drop a node. *Connect* (C): drag
 * from a node onto another to draw a relationship — or, with any tool, hold
 * Shift and drag, as in the Modeller's stitching. While connecting a press on a
 * node draws, it does not move the node. A new node is pinned where it was
 * dropped, so the board does not re-flow.
 *
 * **Unsaved changes.** What is added, edited or deleted is marked until saved
 * (`UnsavedChangesBehaviour`): new is dashed at half fill, edited gains a dot,
 * deleted stays as a ghost (`UnsavedGhostLayer`). The rail's **Changes** button
 * carries the count (`unsaved.count`) and opens the Changes panel
 * (`ChangesViewPanel`): added · edited · deleted, each revertible, Discard all ·
 * Save. It is Edit's, and every work mode's while something is unsaved. Save
 * runs the story's `unsaved.save`, a stand-in for the engine's write. *Expand
 * neighbours* writes as `engine`, so what it pulls in is not unsaved.
 *
 * **Properties.** Clicking a node or a relationship opens it in *Properties*
 * (`PropertiesViewPanel`), read-only. In Edit, the panel's *Edit*, *Edit
 * properties* on the right-click menu, or drawing the element turns it into its
 * editor (`editProperties`); Apply saves and returns to the view.
 *
 * **Modes.** Explore · Edit · Annotate are work modes; Focus (⌘\) leaves the
 * drawing alone, the picker fading until the pointer moves; Present walks the
 * board's playbook — the row is the picker and ◀ n/N ▶, the presenter at the
 * bottom. Esc returns to Explore. The mode is the viewer's and is never saved.
 *
 * The board opens on Valjean and the characters who share a scene with him.
 * *Expand neighbours* pulls the selected node's neighbours in from the rest of
 * Les Misérables — the stand-in for the engine's expansion run.
 *
 * Not built yet: Annotate's tools (no annotation layer draws them), and exporting
 * an image of the selection (the engine captures the view or the whole board).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Canvas, CanvasConfig } from '@invana/canvas';
import {
  selectedElementIds,
  type ClickInspectBehaviour as ClickInspect,
  type ClickSelectBehaviour,
  UNSAVED_COUNT_COMMAND,
  type UnsavedChangesBehaviour as UnsavedChanges,
  type GraphCanvas,
  type GraphData,
  type GraphEdge,
  type GraphLayer,
  type GraphNode
} from '@invana/graph';
import {
  BoardModes,
  ClickInspectBehaviour,
  ControlPanel,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  ElkLayout,
  MiniMapLayer,
  NodeCentralityBehaviour,
  UnsavedChangesBehaviour,
  UnsavedGhostLayer,
  useBoardMode,
  useCanvas,
  type BoardModeSpec
} from '@invana/canvas-react';
import {
  BOARD_LAYOUT_COMMAND,
  BOARD_PANEL_COMMAND,
  BoardContextMenus,
  BoardLayoutPopover,
  BoardPanels,
  ChangesCount,
  ChangesViewPanel,
  CommandPalette,
  ControlItems,
  ExportViewPanel,
  GraphCanvasApp,
  HISTORY_CONTROL_ITEMS,
  HistoryViewPanel,
  LegendViewPanel,
  PlaybookPresenterBar,
  PropertiesViewPanel,
  StylingViewPanel,
  UNSAVED_SAVE_COMMAND,
  editProperties,
  type BoardContextMenusProps,
  type BoardPanelSpec,
  type ControlWidget
} from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import { EmptyState } from '@invana/ui';
import { Sparkles, StickyNote } from 'lucide-react';

const meta: Meta = { title: 'canvas-demos/tools/CanvasExplorer' };
export default meta;
type Story = StoryObj;

/** The board's edge margin, and the gap between pieces of chrome. */
const EDGE = 12;
/** The view dock: the minimap over a 30 px bar, one width. */
const DOCK_W = 184;
const MINIMAP_H = 116;
const DOCK_BAR_H = 32;

const MODES: BoardModeSpec[] = [
  { id: 'explore', label: 'Explore', icon: 'compass', description: 'Look, ask and expand' },
  { id: 'edit', label: 'Edit', icon: 'pencil', description: 'Add, change and delete data' },
  { id: 'annotate', label: 'Annotate', icon: 'sticky-note', description: 'Notes and shapes over the graph' },
  { id: 'focus', label: 'Focus', icon: 'scan-eye', description: 'Just the graph — no tools', group: 'view', shortcut: { key: '\\', mod: true } },
  { id: 'present', label: 'Present', icon: 'presentation', description: 'Walk through the answers', group: 'view' }
];
const WORK = ['explore', 'edit', 'annotate'];
const VIEW = ['focus', 'present'];

/** Valjean and everyone who shares a scene with him — what the first answer drew. */
function firstAnswer(): GraphData {
  const ids = new Set(['Valjean']);
  for (const e of lesMiserables.edges) {
    if (e.source === 'Valjean') ids.add(e.target);
    if (e.target === 'Valjean') ids.add(e.source);
  }
  return {
    nodes: lesMiserables.nodes.filter((n) => ids.has(n.id)),
    edges: lesMiserables.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
  };
}

/** The board opens on the Network preset. */
const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

const PLAYBOOK = {
  version: 1 as const,
  title: 'Who holds Les Misérables together?',
  source: 'graph',
  steps: [
    {
      id: 'cast',
      title: 'Who shares a scene with Valjean?',
      narration: '36 characters do — more than with anyone else in the novel.',
      view: { camera: 'all' as const }
    },
    {
      id: 'hub',
      title: 'Who holds the story together?',
      narration: 'Valjean, with Javert, Fantine, Cosette and Marius at the centre of his scenes.',
      view: {
        select: ['Valjean'],
        focus: { ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius'] },
        camera: 'focus' as const
      }
    }
  ]
};

export const CanvasExplorerStory: Story = {
  name: 'CanvasExplorer',
  render: () => <Explorer />
};

function Explorer() {
  const data = useMemo(firstAnswer, []);
  const [styling, setStyling] = useState({});

  const onReady = useCallback((c: GraphCanvas | null) => {
    if (!c) return;
    void c.playbook.load(PLAYBOOK);
    c.commands.register('explorer.expand', {
      label: 'Expand neighbours',
      isEnabled: (cv) => selectedElementIds(cv, 'click-select').nodeIds.length > 0,
      run: (cv) => expandSelection(cv as GraphCanvas)
    });
    // The stand-in for the engine's write: a moment's wait, then the board is saved.
    c.commands.register(UNSAVED_SAVE_COMMAND, {
      label: 'Save changes',
      run: async (cv) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        cv.behaviours.get<UnsavedChanges>('unsaved-changes')?.markSaved();
      }
    });
    // Annotate's tools are drawn so the mode reads whole; no layer draws them yet.
    c.commands.register('annotate.tool', { label: 'Not built yet', isEnabled: () => false, run: () => {} });
    // A node press either moves the node or draws from it — never both.
    c.behaviours.get('drag-node')?.setModes?.(['select', 'add', 'delete']);
    // A click shows the element in Properties.
    c.behaviours.get<ClickInspect>('click-inspect')?.events.on('inspect:change', (t) => {
      if (t !== null) openPanel(c, 'properties');
    });
  }, []);

  /** Leaving a mode puts its tools down: back to Select, and the minimap only where there are tools. */
  const onModeChange = useCallback((mode: string, canvas: Canvas) => {
    if (mode !== 'edit') void canvas.commands.run('tool.active', { value: 'select' });
    canvas.layers.get('minimap')?.setVisible(WORK.includes(mode));
    // Present opens on the first step, not before it.
    if (mode === 'present' && canvas.playbook.index < 0) void canvas.playbook.next();
  }, []);

  const panels = useMemo<BoardPanelSpec[]>(
    () => [
      { id: 'legend', title: 'Legend', icon: 'legend', render: (c) => <LegendViewPanel canvas={c as GraphCanvas} className="p-2" /> },
      {
        id: 'styling',
        title: 'Styling',
        icon: 'palette',
        actions: (
          <ControlItems
            items={[{ type: 'toggle', command: 'behaviour.toggle', args: { id: 'size-by-connections' }, icon: 'size-by-connections', label: 'Size by connections' }]}
          />
        ),
        render: (c) => <StylingViewPanel canvas={c as GraphCanvas} value={styling} onChange={setStyling} />
      },
      {
        id: 'history',
        title: 'Canvas history',
        icon: 'history',
        actions: <ControlItems items={HISTORY_CONTROL_ITEMS} />,
        render: (c) => <HistoryViewPanel canvas={c} showUndoRedo={false} />
      },
      {
        id: 'properties',
        title: 'Properties',
        icon: 'properties',
        modes: ['explore', 'edit'],
        render: (c) => <PropertiesPanel canvas={c} />
      },
      {
        id: 'changes',
        title: 'Changes',
        icon: 'changes',
        modes: ['edit'],
        alsoWhen: UNSAVED_COUNT_COMMAND,
        badge: UNSAVED_COUNT_COMMAND,
        count: <ChangesCount />,
        render: (c) => <ChangesViewPanel canvas={c} saveTarget="Saves to the stand-in backend · Les Misérables" />
      },
      {
        id: 'notes',
        title: 'Notes',
        icon: 'sticky-note',
        modes: ['annotate'],
        render: () => (
          <EmptyState
            icon={<StickyNote />}
            title="No notes yet"
            description="Notes, shapes and highlights over the graph are not built yet."
          />
        )
      },
      {
        id: 'export',
        title: 'Export',
        icon: 'download',
        separatorBefore: true,
        render: (c) => <ExportViewPanel canvas={c} filename="les-miserables" />
      }
    ],
    [styling]
  );

  const widgets = useMemo<Record<string, ControlWidget>>(
    () => ({
      presenter: ({ canvas: c }) => (
        <PlaybookPresenterBar
          canvas={c}
          variant="compact"
          className="w-[540px] shadow-lg"
          narrationIcon={
            <span className="bg-primary/15 text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="size-3" />
            </span>
          }
        />
      )
    }),
    []
  );

  return (
    <GraphCanvasApp data={data} showHeader={false} config={CONFIG} onReady={onReady} controlPanels={{ widgets }}>
      <BoardModeBridge onModeChange={onModeChange} />
      <EditKeys />
      <ElkLayout id="elk" targetLayerId="graph" />
      <NodeCentralityBehaviour id="size-by-connections" enabled={false} />
      {/* What Properties reads: the clicked element. */}
      <ClickInspectBehaviour id="click-inspect" targetLayerId="graph" />
      <EditTools />
      {/* What is not saved yet: marked on the graph, deletions drawn as ghosts under it. */}
      <UnsavedChangesBehaviour />
      <UnsavedGhostLayer />
      <MiniMapLayer
        backgroundLayerId="background"
        position="bottom-left"
        width={DOCK_W}
        height={MINIMAP_H}
        margin={{ x: EDGE, y: EDGE + DOCK_BAR_H }}
      />

      {/* The row, while working: the picker, then the mode's tools. */}
      <ControlPanel
        id="row"
        position="top-left"
        offset={EDGE}
        surface="hairline"
        modes={WORK}
        items={[
          { type: 'widget', widget: 'board-mode' },
          { type: 'divider' },
          {
            type: 'choice',
            key: 'select-mode',
            command: 'select.mode',
            label: 'Select',
            display: 'dropdown',
            options: [
              { value: 'click', label: 'Select', icon: 'pointer' },
              { value: 'lasso', label: 'Lasso select', icon: 'lasso' },
              { value: 'brush', label: 'Box select', icon: 'select-box' }
            ]
          },
          { type: 'divider', modes: ['edit', 'annotate'] },
          { type: 'toggle', key: 'add', command: 'tool.active', args: { value: 'add' }, icon: 'node-add', label: 'Add node (N)', modes: ['edit'] },
          { type: 'toggle', key: 'connect', command: 'tool.active', args: { value: 'connect' }, icon: 'connect', label: 'Connect (C)', modes: ['edit'] },
          ...ANNOTATE_TOOLS,
          // While changing the board: step back, step forward, and draw it again.
          { type: 'divider', modes: ['edit', 'annotate'] },
          { type: 'command', key: 'undo', command: 'history.undo', icon: 'undo', label: 'Undo (⌘Z)', modes: ['edit', 'annotate'] },
          { type: 'command', key: 'redo', command: 'history.redo', icon: 'redo', label: 'Redo (⇧⌘Z)', modes: ['edit', 'annotate'] },
          { type: 'command', key: 'redraw', command: 'graph.redraw', icon: 'refresh', label: 'Redraw', modes: ['edit', 'annotate'] }
        ]}
      />
      {/* The row, while viewing: the picker alone (Focus), or with the stepper (Present); faded until the pointer moves. */}
      <ControlPanel
        id="row-view"
        position="top-left"
        offset={EDGE}
        surface="hairline"
        modes={VIEW}
        fade="idle"
        items={[
          { type: 'widget', widget: 'board-mode' },
          { type: 'divider', modes: ['present'] },
          { type: 'widget', widget: 'playbook-stepper', modes: ['present'] }
        ]}
      />

      <BoardPanels panels={panels} defaultOpen="legend" offset={EDGE} modes={WORK} />

      {/* The view dock's bar, under the minimap. */}
      <ControlPanel
        id="dock"
        position="bottom-left"
        offset={EDGE}
        width={DOCK_W}
        surface="hairline"
        modes={WORK}
        items={[
          { type: 'widget', widget: 'zoom-field' },
          { type: 'command', key: 'fit', command: 'camera.fit', icon: 'fit', label: 'Fit to screen (⇧1)' },
          { type: 'toggle', key: 'lock', command: 'view.lock', icon: 'lock-open', activeIcon: 'lock', label: 'Lock the view', activeLabel: 'Unlock the view' }
        ]}
      />

      <ControlPanel
        id="presenter"
        position="bottom"
        offset={EDGE}
        surface={false}
        modes={['present']}
        items={[{ type: 'widget', widget: 'presenter' }]}
      />

      <ControlPanel
        id="hint"
        placement="footer-left"
        modes={['explore', 'annotate']}
        items={[{ type: 'text', text: 'Right-click anything for its actions · ⌘K for every command' }]}
      />
      <ControlPanel
        id="hint-edit"
        placement="footer-left"
        modes={['edit']}
        items={[{ type: 'text', text: 'Add node (N): click the board · Connect (C): drag node to node — or Shift-drag with any tool' }]}
      />
      <ControlPanel id="readout" placement="footer-right" items={[{ type: 'widget', widget: 'view-readout', options: { show: 'pan' } }]} />

      <BoardContextMenus board={BOARD_MENU} node={NODE_MENU} edge={EDGE_MENU} selection={SELECTION_MENU} />
      <BoardLayoutPopover />
      <CommandPalette />
    </GraphCanvasApp>
  );
}

/** Mounts `<BoardModes>` and tells the story when the mode moves, with the canvas it moved on. */
function BoardModeBridge({ onModeChange }: { onModeChange: (mode: string, canvas: Canvas) => void }) {
  const canvas = useCanvas();
  return <BoardModes modes={MODES} escapeTo="explore" onModeChange={(m) => onModeChange(m, canvas)} />;
}

/**
 * Edit's keys: N picks *Add node*, C *Connect*, and holding Shift connects until
 * it is let go — the tool in hand comes back. Only in Edit, and never while
 * typing in a field.
 */
function EditKeys() {
  const canvas = useCanvas();
  useEffect(() => {
    let held: string | null = null;
    const editing = () => canvas.commands.value('board.mode') === 'edit';
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]') !== null;
    const tool = (value: string) => void canvas.commands.run('tool.active', { value });
    const release = () => {
      if (held === null) return;
      tool(held);
      held = null;
    };
    const down = (e: KeyboardEvent) => {
      if (!editing() || typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const current = String(canvas.commands.value('tool.active') ?? 'select');
      if (e.key === 'Shift') {
        if (held === null && current !== 'connect') {
          held = current;
          tool('connect');
        }
      } else if (e.key === 'n' || e.key === 'N') tool(current === 'add' ? 'select' : 'add');
      else if (e.key === 'c' || e.key === 'C') tool(current === 'connect' ? 'select' : 'connect');
    };
    const up = (e: KeyboardEvent) => e.key === 'Shift' && release();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', release);
    };
  }, [canvas]);
  return null;
}

/**
 * Edit's drawing tools. A dropped node is a pinned character where the click
 * was; a drawn relationship is a scene shared. Either opens in *Properties*.
 */
function EditTools() {
  const canvas = useCanvas();
  return (
    <>
      <CreateNodeBehaviour
        id="create-node"
        targetLayerId="graph"
        modes={['add']}
        createNode={(world) => newCharacter(world)}
        onNodeCreate={(n) => editElement(canvas, 'node', n.id)}
      />
      <DrawEdgeBehaviour
        id="draw-edge"
        targetLayerId="graph"
        modes={['connect']}
        createEdge={(source, target) => newScene(source, target)}
        onEdgeCreate={(e) => editElement(canvas, 'edge', e.id)}
      />
    </>
  );
}

/** *Properties*: read-only in Explore, editable in Edit. */
function PropertiesPanel({ canvas }: { canvas: Canvas }) {
  const mode = useBoardMode(canvas);
  return <PropertiesViewPanel canvas={canvas} editable={mode === 'edit'} />;
}

/** Annotate's tools — drawn, not built yet. */
const ANNOTATE_TOOLS = (
  [
    ['note', 'sticky-note', 'Note (S)'],
    ['shape', 'shape', 'Shape (R)'],
    ['arrow', 'arrow', 'Arrow (A)'],
    ['text', 'text', 'Text (T)'],
    ['highlight', 'highlight', 'Highlight (H)']
  ] as const
).map(([key, icon, label]) => ({ type: 'command' as const, key, command: 'annotate.tool', icon, label: `${label} — not built yet`, modes: ['annotate'] }));

// ── the right-click menus ───────────────────────────────────────────────────

const BOARD_MENU: NonNullable<BoardContextMenusProps['board']> = ({ canvas, screen, world }) => [
  { id: 'add-here', label: 'Add a node here', shortcut: 'N', modes: ['edit'], onClick: () => addNodeAt(canvas as GraphCanvas, world) },
  { separator: true, modes: ['edit'] },
  { command: BOARD_LAYOUT_COMMAND, args: { x: screen.x, y: screen.y }, label: 'Layout…' },
  { command: 'camera.fit', label: 'Fit to screen', shortcut: '⇧1' },
  { separator: true },
  { command: 'history.undo', label: 'Undo', shortcut: '⌘Z' },
  { command: 'history.redo', label: 'Redo', shortcut: '⇧⌘Z' },
  { separator: true },
  { command: 'layer.visible', args: { id: 'minimap' }, label: 'Minimap' },
  { command: 'layer.visible', args: { id: 'background' }, label: 'Background grid' },
  { command: 'view.lock', label: 'Lock the view' },
  { separator: true },
  { id: 'export-image', label: 'Export image…', shortcut: '⇧⌘E', onClick: () => openPanel(canvas, 'export') },
  { id: 'export-data', label: 'Export data…', onClick: () => openPanel(canvas, 'export') }
];

const NODE_MENU: NonNullable<BoardContextMenusProps['node']> = ({ canvas, id, type }) => [
  { command: 'explorer.expand', label: 'Expand neighbours' },
  { id: 'focus', label: 'Centre on it', onClick: () => graph(canvas)?.focusNode(id, { zoom: 1.5 }) },
  { separator: true },
  { id: 'hide', label: 'Hide', shortcut: 'H', onClick: () => graph(canvas)?.store.setNodeHidden(id, true) },
  { id: 'hide-type', label: `Hide every ${type}`, onClick: () => hideType(canvas, 'node', type) },
  { id: 'style', label: `Style ${type}…`, onClick: () => openPanel(canvas, 'styling') },
  { separator: true },
  { id: 'copy-id', label: 'Copy id', shortcut: '⌘C', onClick: () => void navigator.clipboard?.writeText(id) },
  { separator: true, modes: ['edit'] },
  { id: 'edit-properties', label: 'Edit properties', shortcut: '↵', modes: ['edit'], onClick: () => editElement(canvas, 'node', id) },
  { command: 'graph.erase', label: 'Delete', shortcut: '⌫', destructive: true, modes: ['edit'] }
];

const EDGE_MENU: NonNullable<BoardContextMenusProps['edge']> = ({ canvas, id, type }) => [
  {
    id: 'select-ends',
    label: 'Select its two nodes',
    onClick: () => {
      const e = graph(canvas)?.store.getEdge(id);
      if (e) canvas.behaviours.get<ClickSelectBehaviour>('click-select')?.selectMultiple([{ id: e.source }, { id: e.target }]);
    }
  },
  { separator: true },
  { id: 'hide', label: 'Hide', onClick: () => graph(canvas)?.store.setEdgeHidden(id, true) },
  ...(type ? [{ id: 'hide-type', label: `Hide every ${type}`, onClick: () => hideType(canvas, 'edge', type) }] : []),
  { separator: true, modes: ['edit'] },
  { id: 'edit-properties', label: 'Edit properties', modes: ['edit'], onClick: () => editElement(canvas, 'edge', id) },
  { command: 'graph.erase', label: 'Delete', shortcut: '⌫', destructive: true, modes: ['edit'] }
];

const SELECTION_MENU: NonNullable<BoardContextMenusProps['selection']> = ({ canvas, nodeIds }) => [
  { command: 'explorer.expand', label: 'Expand all' },
  { id: 'hide', label: 'Hide', onClick: () => nodeIds.forEach((n) => graph(canvas)?.store.setNodeHidden(n, true)) },
  { id: 'export', label: 'Export the selection…', onClick: () => openPanel(canvas, 'export') },
  { separator: true },
  { id: 'clear', label: 'Clear selection', shortcut: 'Esc', onClick: () => canvas.behaviours.get<ClickSelectBehaviour>('click-select')?.clearSelection() },
  { separator: true, modes: ['edit'] },
  { command: 'graph.erase', label: 'Delete', shortcut: '⌫', destructive: true, modes: ['edit'] }
];

/** Hide a whole type — `graph.typeVisible` toggles, so only when it is showing. The legend brings it back. */
function hideType(canvas: Canvas, kind: 'node' | 'edge', type: string): void {
  if (!graph(canvas)?.hiddenTypes[kind].includes(type)) void canvas.commands.run('graph.typeVisible', { layerId: 'graph', kind, type });
}

function graph(canvas: Canvas): GraphLayer | undefined {
  return canvas.layers.get<GraphLayer>('graph');
}

/** Open a rail panel — unless it is already open, which the command would close. */
function openPanel(canvas: Canvas, id: string): void {
  if (canvas.commands.value(BOARD_PANEL_COMMAND) !== id) void canvas.commands.run(BOARD_PANEL_COMMAND, { value: id });
}

let added = 0;
/** A new character, pinned where it was dropped — the board does not re-flow around it. */
function newCharacter(at: { x: number; y: number }): GraphNode {
  added += 1;
  return { id: `New character ${added}`, type: 'character', position: { x: at.x, y: at.y }, pinned: true };
}

let drawn = 0;
/** A drawn relationship: a scene the two share. */
function newScene(source: string, target: string): GraphEdge {
  drawn += 1;
  return { id: `drawn-${drawn}`, type: 'co-appears-with', source, target };
}

/** Open an element's editor in *Properties*. */
function editElement(canvas: Canvas, kind: 'node' | 'edge', id: string): void {
  editProperties(canvas, { kind, id });
  openPanel(canvas, 'properties');
}

/** *Add a node here* — a new character where the menu was opened. */
function addNodeAt(canvas: GraphCanvas, at: { x: number; y: number }): void {
  const node = newCharacter(at);
  graph(canvas)?.store.addData({ nodes: [node], edges: [] });
  editElement(canvas, 'node', node.id);
}

/**
 * Add every neighbour of the selected nodes from the full Les Misérables graph,
 * with the edges that join them to what is drawn — added, never replacing. The
 * active layout preset re-draws on the new nodes; the selection stays.
 */
function expandSelection(canvas: GraphCanvas): void {
  const layer = canvas.layers.get<GraphLayer>('graph');
  if (!layer) return;
  const picked = new Set(selectedElementIds(canvas, 'click-select').nodeIds);
  const drawn = new Set([...layer.store.nodes()].map((n) => n.id));
  const added = new Set<string>();
  for (const e of lesMiserables.edges) {
    if (picked.has(e.source) && !drawn.has(e.target)) added.add(e.target);
    if (picked.has(e.target) && !drawn.has(e.source)) added.add(e.source);
  }
  const after = new Set([...drawn, ...added]);
  const drawnEdges = new Set([...layer.store.edges()].map((e) => e.id));
  // Data from the backend, not a change of the viewer's: written as the engine.
  layer.store.applyDelta(
    {
      added: {
        nodes: lesMiserables.nodes.filter((n) => added.has(n.id)),
        edges: lesMiserables.edges.filter((e) => !drawnEdges.has(e.id) && after.has(e.source) && after.has(e.target))
      }
    },
    { actor: 'engine', title: 'expand neighbours' }
  );
}
