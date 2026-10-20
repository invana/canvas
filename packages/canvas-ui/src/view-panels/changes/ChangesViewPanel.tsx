// ChangesViewPanel — what on the board is not saved yet, and the acts that settle it.
//
// The rail's **Changes** panel over `UnsavedChangesBehaviour`: the elements added,
// edited and deleted since the last save, grouped in that order on the kit's
// `DiffList` (the sign is spelled out, never colour alone). A row shows its
// element — name, type, and for an edit what changed — and frames it on the board
// when clicked; its ↺ reverts that one change (a node with what hangs on it).
// The foot is *Discard all* and *Save n changes*.
//
// The canvas never writes to a backend. *Save* runs the `unsaved.save` command the
// host registers: it sends `tracker.changes()` and, once the backend accepted
// them, calls `tracker.markSaved()`. A save that throws keeps every change and says
// so. A host that cannot save here (a member without write access) passes
// `saveDisabledReason`: the changes stay, Save is disabled, and the reason shows.

import type { Canvas } from '@invana/canvas';
import { useCommandStates, useUnsavedChanges } from '@invana/canvas-react';
import type { GraphEdge, GraphLayer, GraphNode, UnsavedChangesSummary } from '@invana/graph';
import { Alert, AlertDescription, AlertTitle, Button, DiffList, DiffRow, EmptyState, Eyebrow, Spinner, cn } from '@invana/ui';
import { CircleCheck, RotateCcw } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { displayNameOf, isRecord, labelOfEdge, labelOfNode, nodeSwatchColor } from '../element-display';

/** The command *Save* runs. The host registers it; see {@link ChangesViewPanel}. */
export const UNSAVED_SAVE_COMMAND = 'unsaved.save';

export interface ChangesViewPanelProps {
  /** The live canvas engine. */
  canvas: Canvas;
  /** The `UnsavedChangesBehaviour` id. Default `'unsaved-changes'`. */
  trackerId?: string;
  /** The graph layer the changes are on. Default `'graph'`. */
  layerId?: string;
  /** Where Save writes — the foot's line, `Saves to Neo4j 5.26 · Routes out of LHR`. */
  saveTarget?: ReactNode;
  /** Why this viewer cannot save. Set, the changes stay and Save is disabled. */
  saveDisabledReason?: ReactNode;
  className?: string;
}

/** One change, as a row draws it. */
interface Row {
  key: string;
  kind: 'node' | 'edge';
  id: string;
  op: 'add' | 'change' | 'remove';
  name: string;
  type: string;
  swatch?: string;
  /** For an edit: the first changed field, its saved value and its value now. */
  diff?: { field: string; from: string; to: string };
}

/**
 * The board's **Changes** panel: added, edited and deleted elements since the
 * last save, each revertible, with Discard all and Save. Pair it with an
 * `UnsavedChangesBehaviour` and a rail button badged by `unsaved.count`.
 */
export function ChangesViewPanel({
  canvas,
  trackerId = 'unsaved-changes',
  layerId = 'graph',
  saveTarget,
  saveDisabledReason,
  className,
}: ChangesViewPanelProps) {
  const { summary, tracker, discard } = useUnsavedChanges(trackerId, canvas);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const layer = canvas.layers.get<GraphLayer>(layerId);
  const { states } = useCommandStates([{ command: UNSAVED_SAVE_COMMAND }], canvas);
  const canSave = !saveDisabledReason && !!states[0]?.enabled;

  if (!tracker || !layer) {
    return <EmptyState title="Changes are not tracked here" description="This board keeps no record of what is unsaved." />;
  }
  if (summary.count === 0) {
    return (
      <EmptyState
        icon={<CircleCheck />}
        title="Everything is saved"
        description="What you add, change or delete on the board shows here until it is saved."
      />
    );
  }

  const groups = rowsOf(summary, layer, tracker);
  const save = async (): Promise<void> => {
    setSaving(true);
    setFailed(false);
    try {
      await canvas.commands.runAsync(UNSAVED_SAVE_COMMAND);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };
  const focus = (row: Row): void => {
    if (row.op === 'remove') return;
    if (row.kind === 'node') layer.focusNode(row.id, { zoom: 1.5 });
    else layer.focusEdges([row.id]);
  };

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {failed && (
          <Alert tone="destructive">
            <AlertTitle>Couldn’t save</AlertTitle>
            <AlertDescription>Nothing was saved; your {summary.count} changes are kept.</AlertDescription>
          </Alert>
        )}
        {saveDisabledReason && (
          <Alert>
            <AlertTitle>You can change this board, not the graph</AlertTitle>
            <AlertDescription>{saveDisabledReason}</AlertDescription>
          </Alert>
        )}
        {groups.map(([title, rows]) => (
          <section key={title} className="flex flex-col gap-0.5">
            <Eyebrow>
              {title} · {rows.length}
            </Eyebrow>
            <DiffList>
              {rows.map((row) => (
                <DiffRow key={row.key} op={row.op} className={cn('items-center', saving && 'opacity-60')}>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => focus(row)}
                      disabled={row.op === 'remove'}
                      title={row.op === 'remove' ? undefined : 'Show it on the board'}
                      className="hover:bg-accent flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md px-1 py-1 text-left disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className={cn('size-2 shrink-0', row.kind === 'node' ? 'rounded-full' : 'rounded-[2px]', !row.swatch && 'bg-muted-foreground')}
                          style={row.swatch ? { background: row.swatch } : undefined}
                        />
                        <span className={cn('truncate font-semibold', row.op === 'remove' && 'line-through')}>{row.name}</span>
                        <span className="text-muted-foreground shrink-0 font-mono text-xs">{row.type}</span>
                      </span>
                      {row.diff && (
                        <span className="flex items-center gap-1 font-mono text-xs">
                          <span className="text-muted-foreground">{row.diff.field}</span>
                          <span className="text-muted-foreground line-through">{row.diff.from}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-semibold">{row.diff.to}</span>
                        </span>
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Revert ${row.name}`}
                      title="Revert this change"
                      disabled={saving}
                      onClick={() => tracker.revert(row.kind, row.id)}
                    >
                      <RotateCcw />
                    </Button>
                  </span>
                </DiffRow>
              ))}
            </DiffList>
          </section>
        ))}
      </div>
      <div className="border-border flex shrink-0 flex-col gap-2 border-t p-2">
        {saveTarget && <span className="text-muted-foreground text-xs">{saveTarget}</span>}
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" disabled={saving} onClick={discard}>
            Discard all
          </Button>
          <Button size="sm" disabled={saving || !canSave} onClick={() => void save()}>
            {saving && <Spinner />}
            {saving ? 'Saving…' : failed ? 'Try again' : `Save ${summary.count} ${summary.count === 1 ? 'change' : 'changes'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The panel bar's count — `6 unsaved` in the warning tone, nothing while saved. */
export function ChangesCount({ canvas, trackerId = 'unsaved-changes' }: { canvas?: Canvas; trackerId?: string }) {
  const { count } = useUnsavedChanges(trackerId, canvas);
  return count ? <span className="text-warning">{count} unsaved</span> : null;
}

/** The changes as rows, grouped Added · Edited · Deleted, empty groups left out. */
function rowsOf(
  s: UnsavedChangesSummary,
  layer: GraphLayer,
  tracker: { before: (kind: 'node' | 'edge', id: string) => Record<string, unknown> | undefined },
): Array<[string, Row[]]> {
  const store = layer.store;
  const nodeName = (id: string) => {
    const n = store.getNode(id);
    return n ? displayNameOf(n) : id;
  };
  const nodeRow = (n: GraphNode, op: Row['op']): Row => {
    const swatch = op === 'remove' ? undefined : nodeSwatchColor(layer.resolveNodeStyle(n));
    return { key: 'n:' + n.id, kind: 'node', id: n.id, op, name: displayNameOf(n), type: labelOfNode(n), ...(swatch ? { swatch } : {}) };
  };
  const edgeRow = (e: GraphEdge, op: Row['op']): Row => ({
    key: 'e:' + e.id,
    kind: 'edge',
    id: e.id,
    op,
    name: `${nodeName(e.source)} → ${nodeName(e.target)}`,
    type: labelOfEdge(e),
  });
  const withDiff = (row: Row, current: Record<string, unknown> | undefined): Row => {
    const diff = firstDiff(tracker.before(row.kind, row.id), current);
    return diff ? { ...row, diff } : row;
  };
  const nodes = (ids: string[]) => ids.flatMap((id) => (store.getNode(id) ? [store.getNode(id)!] : []));
  const edges = (ids: string[]) => ids.flatMap((id) => (store.getEdge(id) ? [store.getEdge(id)!] : []));

  const added = [...nodes(s.nodes.new).map((n) => nodeRow(n, 'add')), ...edges(s.edges.new).map((e) => edgeRow(e, 'add'))];
  const edited = [
    ...nodes(s.nodes.edited).map((n) => withDiff(nodeRow(n, 'change'), n as unknown as Record<string, unknown>)),
    ...edges(s.edges.edited).map((e) => withDiff(edgeRow(e, 'change'), e as unknown as Record<string, unknown>)),
  ];
  const deleted = [...s.nodes.deleted.map((n) => nodeRow(n, 'remove')), ...s.edges.deleted.map((e) => edgeRow(e, 'remove'))];
  return ([['Added', added], ['Edited', edited], ['Deleted', deleted]] as Array<[string, Row[]]>).filter(([, rows]) => rows.length > 0);
}

/** The first field that changed — inside `data` by key, `style.labelText` as `label`, else the field. */
function firstDiff(before: Record<string, unknown> | undefined, current: Record<string, unknown> | undefined): Row['diff'] {
  if (!before || !current) return undefined;
  for (const [field, was] of Object.entries(before)) {
    const now = current[field];
    if (field === 'data' && (isRecord(was) || isRecord(now))) {
      const a = isRecord(was) ? was : {};
      const b = isRecord(now) ? now : {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (text(a[k]) !== text(b[k])) return { field: k, from: text(a[k]), to: text(b[k]) };
      }
      continue;
    }
    if (field === 'style' && isRecord(was) && isRecord(now) && text(was.labelText) !== text(now.labelText)) {
      return { field: 'label', from: text(was.labelText), to: text(now.labelText) };
    }
    if (text(was) !== text(now)) return { field, from: text(was), to: text(now) };
  }
  return undefined;
}

function text(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—';
  return typeof v === 'string' ? v : JSON.stringify(v);
}
