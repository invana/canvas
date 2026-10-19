/**
 * **Canvas Explorer — the Invana Explorer board, context menu first.** On screen
 * only what changes what a drag does (the mode and its tools), what must be seen
 * (the minimap and the zoom) and the panel rail; every other verb is on a
 * right-click menu, and on ⌘K.
 *
 * | Where | What | canvas-ui |
 * |---|---|---|
 * | top-left | the mode picker, then the mode's tools — Select ▾ (Select · Lasso · Box); in Edit *Add node* · *Connect*; in Annotate its tools, not built yet | `<BoardModes>` (canvas-react) · `board-mode` widget · `select.mode` / `tool.active` items with `modes` |
 * | top-right | the panel rail — Legend · Styling · History, Properties (Edit) or Notes (Annotate), a line, Export — and one floating panel left of it | `<BoardPanels>` · `LegendViewPanel` · `StylingViewPanel` · `HistoryViewPanel` · `ElementInspectorViewPanel` · `ExportViewPanel` |
 * | bottom-left | the view dock: the minimap over − · the zoom field ▾ · + · Fit · lock | `MiniMapLayer` · `zoom-field` widget |
 * | right-click | the board, a node, a relationship, a selection — each headed by what it is for | `<BoardContextMenus>` · `<BoardLayoutPopover>` (*Layout…* at the pointer) |
 * | footer | the hint, and the pan | `view-readout` (`show: 'pan'`) |
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
 * Not built yet: Annotate's tools (no annotation layer draws them), editing a
 * property in Edit (Properties shows the selection, read-only), and exporting an
 * image of the selection (the engine captures the view or the whole board).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import type { Canvas, CanvasConfig } from '@invana/canvas';
import { selectedElementIds, type ClickSelectBehaviour, type GraphCanvas, type GraphData, type GraphLayer } from '@invana/graph';
import {
  BoardModes,
  ClickInspectBehaviour,
  ControlPanel,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  ElkLayout,
  MiniMapLayer,
  NodeCentralityBehaviour,
  useCanvas,
  type BoardModeSpec
} from '@invana/canvas-react';
import {
  BOARD_LAYOUT_COMMAND,
  BOARD_PANEL_COMMAND,
  BoardContextMenus,
  BoardLayoutPopover,
  BoardPanels,
  CommandPalette,
  ControlItems,
  ElementInspectorViewPanel,
  ExportViewPanel,
  GraphCanvasApp,
  HISTORY_CONTROL_ITEMS,
  HistoryViewPanel,
  LegendViewPanel,
  PlaybookPresenterBar,
  StylingViewPanel,
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
    // Annotate's tools are drawn so the mode reads whole; no layer draws them yet.
    c.commands.register('annotate.tool', { label: 'Not built yet', isEnabled: () => false, run: () => {} });
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
        modes: ['edit'],
        render: (c) => <ElementInspectorViewPanel canvas={c as GraphCanvas} />
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
      <ElkLayout id="elk" targetLayerId="graph" />
      <NodeCentralityBehaviour id="size-by-connections" enabled={false} />
      {/* What Properties reads: the clicked element. */}
      <ClickInspectBehaviour id="click-inspect" targetLayerId="graph" />
      <CreateNodeBehaviour id="create-node" targetLayerId="graph" modes={['add']} />
      <DrawEdgeBehaviour id="draw-edge" targetLayerId="graph" modes={['connect']} />
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
          ...ANNOTATE_TOOLS
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
        modes={WORK}
        items={[{ type: 'text', text: 'Right-click anything for its actions · ⌘K for every command' }]}
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
  { id: 'edit-properties', label: 'Edit properties', shortcut: '↵', modes: ['edit'], onClick: () => openPanel(canvas, 'properties') },
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
/** *Add a node here* — a new character where the menu was opened. */
function addNodeAt(canvas: GraphCanvas, at: { x: number; y: number }): void {
  added += 1;
  graph(canvas)?.store.addData({ nodes: [{ id: `New character ${added}`, type: 'character', position: { x: at.x, y: at.y } }], edges: [] });
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
  layer.store.addData({
    nodes: lesMiserables.nodes.filter((n) => added.has(n.id)),
    edges: lesMiserables.edges.filter((e) => !drawnEdges.has(e.id) && after.has(e.source) && after.has(e.target))
  });
}
