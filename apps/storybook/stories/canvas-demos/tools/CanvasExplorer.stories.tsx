/**
 * **Canvas Explorer — the Invana Explorer board, context menu first.** On screen
 * only what changes what a drag does (the mode and its tools), what must be seen
 * (the minimap and the zoom) and the panel rail; every other verb is on a
 * right-click menu, and on ⌘K.
 *
 * The whole board is one component, `<GraphBoard>` (canvas-ui); this story
 * passes it data, a model, a save, an expansion and a playbook — what a host
 * knows — and adds one panel of its own (*Notes*, Annotate's).
 *
 * | Where | What | canvas-ui |
 * |---|---|---|
 * | top-left | the mode picker, then the mode's tools — Select ▾ (Select · Lasso · Box); in Edit *Add node* · *Connect*; in Annotate its tools, not built yet; in both, Undo · Redo · Redraw | `BOARD_ROW_ITEMS` · `BOARD_VIEW_ROW_ITEMS` |
 * | top-right | the panel rail — Legend · Styling · History · Element, Notes (Annotate), Changes with its count (Edit, or while unsaved), a line, Export — and one floating panel left of it | `defaultBoardPanels` + `panels` |
 * | bottom-left | the view dock: the minimap over − · the zoom field ▾ · + · Fit · lock | `BOARD_DOCK_ITEMS` |
 * | right-click | the board, a node, a relationship, a selection — each headed by what it is for | `defaultBoardMenus` · `<BoardLayoutPopover>` (*Layout…* at the pointer) |
 *
 * **Edit.** *Add node* (N): click the board to drop a node. *Connect* (C): drag
 * from a node onto another to draw a relationship — or, with any tool, hold
 * Shift and drag, as in the Modeller's stitching. While connecting a press on a
 * node draws, it does not move the node. A new node is pinned where it was
 * dropped, so the board does not re-flow. What is drawn opens as *New node* /
 * *New relationship* in the Element panel: its id is made up, its type is asked for —
 * offered from the board's types, required — and its Cancel takes it back off.
 *
 * **Unsaved changes.** What is added, edited or deleted is marked until saved
 * (`UnsavedChangesBehaviour`): new is dashed at half fill, edited gains a dot,
 * deleted stays as a ghost (`UnsavedGhostLayer`). The rail's **Changes** button
 * carries the count (`unsaved.count`) and opens the Changes panel
 * (`ChangesViewPanel`): added · edited · deleted, each revertible, Discard all ·
 * Save. It is Edit's, and every work mode's while something is unsaved. Save
 * runs the story's `onSave`, a stand-in for the engine's write. *Expand
 * neighbours* writes as `engine`, so what it pulls in is not unsaved.
 *
 * **The model.** The Element panel is strict over the board's model
 * (`MODEL`): a type is picked from it, a type's keys are its rows, *Add
 * property* lists only that type's keys not set yet, each key appears once, and
 * changing the type swaps the keys.
 *
 * **Element.** Clicking a node or a relationship opens it in *Element*
 * (`ElementViewPanel`), read-only. In Edit, the panel's *Edit*, *Edit
 * node* / *Edit relationship* on the right-click menu, or drawing the element turns it into its
 * editor (`editElement`); Apply saves and returns to the view.
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
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { selectedElementIds, type GraphCanvas, type GraphData, type GraphLayer } from '@invana/graph';
import { GraphBoard, type BoardPanelSpec } from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import { EmptyState } from '@invana/ui';
import { Sparkles, StickyNote } from 'lucide-react';

const meta: Meta = { title: 'canvas-demos/tools/CanvasExplorer' };
export default meta;
type Story = StoryObj;

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

/**
 * The board's model, as Studio's Explorer gets it from the graph's published
 * model: each type with its property keys. Strict — a type and its keys come
 * from here only.
 */
const MODEL = {
  nodeTypes: [
    { type: 'character', keys: [{ key: 'group', kind: 'number' }, { key: 'name', kind: 'text' }, { key: 'born', kind: 'date' }, { key: 'alias', kind: 'text' }] },
    { type: 'place', keys: [{ key: 'name', kind: 'text' }, { key: 'city', kind: 'text' }, { key: 'kind', kind: 'text' }] }
  ],
  edgeTypes: [{ type: 'co-appears-with', keys: [{ key: 'value', kind: 'number' }, { key: 'chapter', kind: 'text' }] }]
};

/** Annotate's own panel — drawn so the mode reads whole. */
const NOTES: BoardPanelSpec = {
  id: 'notes',
  title: 'Notes',
  icon: 'sticky-note',
  modes: ['annotate'],
  render: () => (
    <EmptyState icon={<StickyNote />} title="No notes yet" description="Notes, shapes and highlights over the graph are not built yet." />
  )
};

/** Notes sits before Export. */
const withNotes = (rail: BoardPanelSpec[]) => {
  const at = rail.findIndex((p) => p.id === 'export');
  return [...rail.slice(0, at), NOTES, ...rail.slice(at)];
};

/** The stand-in for the engine's write: a moment's wait, then the board is saved. */
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 600));

const PANEL_OPTIONS = {
  element: { schema: MODEL, strictSchema: true },
  changes: { saveTarget: 'Saves to the stand-in backend · Les Misérables', onSave: save },
  export: { filename: 'les-miserables' }
};

const NARRATION_ICON = (
  <span className="bg-primary/15 text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full">
    <Sparkles className="size-3" />
  </span>
);

const CONFIG: CanvasConfig = {};

export const CanvasExplorerStory: Story = {
  name: 'CanvasExplorer',
  render: () => <Explorer />
};

function Explorer() {
  const data = useMemo(firstAnswer, []);
  return (
    <div style={{ height: '100vh' }}>
      <GraphBoard
        data={data}
        config={CONFIG}
        playbook={PLAYBOOK as never}
        narrationIcon={NARRATION_ICON}
        onExpand={(_ids, canvas) => expandSelection(canvas)}
        panelOptions={PANEL_OPTIONS}
        panels={withNotes}
      />
    </div>
  );
}

/**
 * Add every neighbour of the selected nodes from the full Les Misérables graph,
 * with the edges that join them to what is drawn — added, never replacing. The
 * active layout re-draws on the new nodes; the selection stays.
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
