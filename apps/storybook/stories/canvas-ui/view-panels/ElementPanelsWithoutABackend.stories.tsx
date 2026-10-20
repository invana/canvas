/**
 * **The Element and Changes panels with no backend — every act a plain callback.**
 *
 * The same two panels the Explorer board uses, wired to nothing but this story's
 * own state: what is saved lives in an array, the way a script or a test would
 * keep it. Each act the panels offer is a prop the host may take:
 *
 * | Panel | Prop | Here |
 * |---|---|---|
 * | `ElementViewPanel` | `onApply(edit)` | writes the values to the board store, and logs them |
 * | | `onCancel(target)` · `onDelete(target)` | logged; Delete removes the element from the board |
 * | | `onEditingChange(target)` | the editor's open element, shown above the log |
 * | `ChangesViewPanel` | `onSave(changes)` | appends the net change to the saved list; the board is then marked saved |
 * | | `onDiscard()` · `onRevert(kind, id)` | logged, then the tracker's own discard / revert |
 *
 * Leave a prop out and the panel does the default: Apply writes the board store,
 * Save runs the host's `unsaved.save` command. Click a character, *Edit*, change a
 * key, Apply, then *Save* in the Changes panel and watch the saved list grow.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Canvas } from '@invana/canvas';
import { BoardModes, ClickInspectBehaviour, UnsavedChangesBehaviour } from '@invana/canvas-react';
import type { GraphCanvas, GraphLayer, UnsavedChangesBehaviour as Tracker } from '@invana/graph';
import {
  ChangesCount,
  ChangesViewPanel,
  ElementViewPanel,
  GraphCanvasApp,
  type ElementTarget
} from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import { Eyebrow } from '@invana/ui';
import { useCallback, useMemo, useState } from 'react';

const meta: Meta = { title: 'canvas-ui/view-panels/ElementPanelsWithoutABackend' };
export default meta;
type Story = StoryObj;

/** The model the editor follows — strict: types and keys from here only. */
const MODEL = {
  nodeTypes: [{ type: 'character', keys: [{ key: 'group', kind: 'number' }, { key: 'alias', kind: 'text' }] }],
  edgeTypes: [{ type: 'co-appears-with', keys: [{ key: 'chapter', kind: 'text' }] }]
};

export const ElementPanelsWithoutABackendStory: Story = {
  name: 'ElementPanelsWithoutABackend',
  render: () => <WithoutABackend />
};

function WithoutABackend() {
  const data = useMemo(() => {
    const ids = new Set(['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius', 'Thenardier']);
    return {
      nodes: lesMiserables.nodes.filter((n) => ids.has(n.id)),
      edges: lesMiserables.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
    };
  }, []);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [saved, setSaved] = useState<unknown[]>([]);
  const [editing, setEditing] = useState<ElementTarget | null>(null);
  const say = useCallback((line: string) => setLog((l) => [line, ...l].slice(0, 12)), []);
  const onReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);

  const right = canvas ? (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <ElementViewPanel
        canvas={canvas}
        editable
        schema={MODEL}
        strictSchema
        onEditingChange={setEditing}
        onApply={(edit) => {
          // The host's own write: here, the board store.
          const store = canvas.layers.get<GraphLayer>('graph')?.store;
          if (edit.kind === 'node') store?.updateNode(edit.id, { type: edit.values.type, data: edit.values.data });
          else store?.updateEdge(edit.id, { type: edit.values.type, data: edit.values.data });
          say(`apply ${edit.kind} ${edit.id} ${JSON.stringify(edit.values.data)}`);
        }}
        onCancel={(t) => say(`cancel ${t.kind} ${t.id}`)}
        onDelete={(t) => {
          const store = canvas.layers.get<GraphLayer>('graph')?.store;
          if (t.kind === 'node') store?.removeNode(t.id);
          else store?.removeEdge(t.id);
          say(`delete ${t.kind} ${t.id}`);
        }}
      />
      <div className="flex items-center gap-2">
        <Eyebrow>Changes</Eyebrow>
        <ChangesCount canvas={canvas} />
      </div>
      <ChangesViewPanel
        canvas={canvas}
        saveTarget="Saves to this story's list"
        onSave={async (changes) => {
          setSaved((s) => [...s, changes]);
          say('save');
        }}
        onDiscard={() => {
          say('discard all');
          canvas.behaviours.get<Tracker>('unsaved-changes')?.discard();
        }}
        onRevert={(kind, id) => {
          say(`revert ${kind} ${id}`);
          canvas.behaviours.get<Tracker>('unsaved-changes')?.revert(kind, id);
        }}
      />
      <Eyebrow>Editing</Eyebrow>
      <pre className="text-xs">{editing ? JSON.stringify(editing) : '—'}</pre>
      <Eyebrow>Log</Eyebrow>
      <pre className="text-xs whitespace-pre-wrap">{log.join('\n') || '—'}</pre>
      <Eyebrow>Saved ({saved.length})</Eyebrow>
      <pre className="max-h-48 overflow-auto text-xs">{JSON.stringify(saved, null, 1)}</pre>
    </div>
  ) : null;

  return (
    <GraphCanvasApp data={data} showHeader={false} onReady={onReady} right={{ content: right, defaultSize: '380px' }}>
      <BoardModes modes={[{ id: 'edit', label: 'Edit' }]} />
      <ClickInspectBehaviour id="click-inspect" targetLayerId="graph" />
      <UnsavedChangesBehaviour />
    </GraphCanvasApp>
  );
}
