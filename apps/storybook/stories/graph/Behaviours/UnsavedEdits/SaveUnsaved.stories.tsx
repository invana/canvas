/**
 * **Saving unsaved changes as ordered edit ops.** `unsavedToEditOps` turns the
 * tracker's net change into the list a backend applies — deletes first, then
 * adds, then updates; a relationship's changed type as delete + add. Keys the
 * host owns (`hidden`, here any `_`-prefixed key) are never sent.
 * `saveUnsaved(canvas, persist)` sends them through the host's `persist`, then
 * gives each new element the id the backend returned (`adoptBackendIds`).
 *
 * | Do | Op it adds |
 * |---|---|
 * | *Rename Valjean* | `update_node` with `set` |
 * | *Add Gervais* | `add_node`, then the backend's id adopted on save |
 * | *Remove an edge* | `delete_edge`, first in the list |
 * | *Save* | the ops go to the stand-in backend; the board is saved |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import { UnsavedChangesBehaviour } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import {
  saveUnsaved,
  unsavedToEditOps,
  type EditOp,
  type GraphCanvas,
  type GraphLayer,
  type UnsavedChangesBehaviour as Tracker
} from '@invana/graph';
import { Button, Eyebrow, PanelBox } from '@invana/ui';
import { valjeanScenes } from '../../../canvas-ui/apps/GraphBoard/data';

const meta: Meta = { title: 'graph/Behaviours/UnsavedEdits/SaveUnsaved' };
export default meta;
type Story = StoryObj;

const hidden = (key: string) => key.startsWith('_');

export const SaveUnsavedStory: Story = {
  name: 'SaveUnsaved',
  render: function Render() {
    const data = useMemo(valjeanScenes, []);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    const onReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);
    return (
      <GraphCanvasApp
        data={data}
        config={{ layoutPreset: { id: 'network' } }}
        onReady={onReady}
        header={{ title: 'SaveUnsaved' }}
        right={{ content: <Ops canvas={canvas} />, defaultSize: '380px' }}
      >
        <UnsavedChangesBehaviour />
      </GraphCanvasApp>
    );
  }
};

function Ops({ canvas }: { canvas: GraphCanvas | null }) {
  const [pending, setPending] = useState<EditOp[]>([]);
  const [sent, setSent] = useState<{ ops: EditOp[]; ids: Record<string, string> } | null>(null);
  const store = () => canvas?.layers.get<GraphLayer>('graph')?.store;
  const refresh = () => {
    const tracker = canvas?.behaviours.get<Tracker>('unsaved-changes');
    const s = store();
    setPending(tracker && s ? unsavedToEditOps(tracker, s, { hidden }) : []);
  };
  const act = (fn: () => void) => () => {
    fn();
    refresh();
  };
  return (
    <PanelBox title="Edit ops">
      <Button onClick={act(() => store()?.updateNode('Valjean', { data: { alias: 'Madeleine', _seenBy: 'host' } }))}>Rename Valjean</Button>
      <Button onClick={act(() => store()?.addNode({ id: 'new-gervais', type: 'character', data: { name: 'Petit Gervais', _draft: true } }))}>
        Add Gervais
      </Button>
      <Button
        onClick={act(() => {
          const first = [...(store()?.edges() ?? [])][0];
          if (first) store()?.removeEdge(first.id);
        })}
      >
        Remove an edge
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          if (!canvas) return;
          await saveUnsaved(
            canvas,
            async (ops) => {
              const ids: Record<string, string> = {};
              for (const op of ops) if (op.op === 'add_node') ids[op.ref] = `db-${op.ref.slice(4)}`;
              setSent({ ops, ids });
              return { ids };
            },
            { hidden }
          );
          canvas.behaviours.get<Tracker>('unsaved-changes')?.markSaved();
          refresh();
        }}
      >
        Save
      </Button>
      <Eyebrow>{`Unsaved — ${pending.length} ops`}</Eyebrow>
      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(pending, null, 1)}</pre>
      <Eyebrow>Last save</Eyebrow>
      <pre className="text-xs whitespace-pre-wrap">{sent ? JSON.stringify(sent, null, 1) : '—'}</pre>
    </PanelBox>
  );
}
