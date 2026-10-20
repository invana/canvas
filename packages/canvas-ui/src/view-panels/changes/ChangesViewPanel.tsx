// ChangesViewPanel — what on the board is not saved yet, and the acts that settle it.
//
// The rail's **Changes** panel over `UnsavedChangesBehaviour`: the elements added,
// edited and deleted since the last save, grouped in that order on the kit's
// `DiffList` as unsaved rows (`marker="chip"`: the sign in an amber square, muted
// for a deletion — spelled out, never colour alone). A row shows its element —
// name, type, and under it what happened: *New airport*, the edit as
// `runways 2 → 3`, *Deleted with MUC* — and frames it on the board when clicked;
// its ↺ reverts that one change (a node with what hangs on it). The foot is
// *Discard all* and *Save n changes*. A new element still without a type says
// *Needs a type*, and Save waits until every one has one.
//
// The canvas never writes to a backend. *Save* goes where the host says, one of
// two ways:
//
// - **`onSave(changes)`** — a prop: any async function, given `tracker.changes()`
//   (a REST call, a file write, nothing at all). Once it resolves the panel marks
//   the board saved. The host owns what happens; no command is involved.
// - **the `unsaved.save` command**, when no `onSave` is given — what a host that
//   also saves from a toolbar or a key registers. It sends the changes and calls
//   `tracker.markSaved()` itself.
//
// A save that throws keeps every change and says so. *Discard all* and each row's
// ↺ do the tracker's own `discard()` / `revert()` unless the host takes them with
// `onDiscard` / `onRevert`. A host that cannot save here (a member without write
// access) passes `saveDisabledReason`: the changes stay, Save is disabled, and
// the reason shows. With no backend at all, the panel and the tracker still work:
// Save just marks the board saved.

import type { Canvas } from '@invana/canvas';
import { useCommandStates, useUnsavedChanges } from '@invana/canvas-react';
import type { Delta } from '@invana/canvas';
import type { GraphEdge, GraphLayer, GraphNode, UnsavedChangesSummary } from '@invana/graph';
import { Alert, AlertDescription, AlertTitle, Button, DiffList, DiffRow, EmptyState, Eyebrow, Spinner, cn } from '@invana/ui';
import { CircleAlert, CircleCheck, Lock, RotateCcw } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { NO_TYPE, displayNameOf, isRecord, labelOfEdge, labelOfNode, nodeSwatchColor } from '../element-display';

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
  /**
   * Save the changes — given the net change since the last save. When it
   * resolves the board is marked saved; when it throws, nothing is and the
   * error shows. Without it, Save runs the host's `unsaved.save` command.
   */
  onSave?: (changes: Delta<GraphNode, GraphEdge>) => Promise<void> | void;
  /** *Discard all*, instead of the tracker's own discard. */
  onDiscard?: () => void;
  /** One row's ↺, instead of the tracker's own revert. */
  onRevert?: (kind: 'node' | 'edge', id: string) => void;
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
  /** The line under the name: what happened, or what is still owed. */
  note?: string;
  /** A new element with no type yet — it cannot be saved. */
  untyped?: boolean;
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
  onSave,
  onDiscard,
  onRevert,
  className,
}: ChangesViewPanelProps) {
  const { summary, tracker, discard } = useUnsavedChanges(trackerId, canvas);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [savedNow, setSavedNow] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const layer = canvas.layers.get<GraphLayer>(layerId);
  const { states } = useCommandStates([{ command: UNSAVED_SAVE_COMMAND }], canvas);

  if (!tracker || !layer) {
    return <EmptyState title="Changes are not tracked here" description="This board keeps no record of what is unsaved." />;
  }
  if (summary.count === 0) {
    return (
      <EmptyState
        icon={<CircleCheck className="text-success" />}
        title="Everything is saved"
        description={savedNow ? 'Saved just now.' : 'Nothing has changed since the last save.'}
      />
    );
  }

  const groups = rowsOf(summary, layer, tracker);
  const untyped = groups.flatMap(([, rows]) => rows).filter((r) => r.untyped).length;
  // Save is the host's `onSave` when given, else its `unsaved.save` command.
  const canSave = !saveDisabledReason && untyped === 0 && (onSave ? true : !!states[0]?.enabled);
  const save = async (): Promise<void> => {
    if (!canSave) return;
    setSaving(true);
    setFailed(null);
    try {
      if (onSave) {
        await onSave(tracker.changes());
        tracker.markSaved();
      } else {
        await canvas.commands.runAsync(UNSAVED_SAVE_COMMAND);
      }
      setSavedNow(true);
      setPicked(null);
    } catch (err) {
      setFailed(err instanceof Error && err.message ? err.message : 'The graph didn’t answer.');
    } finally {
      setSaving(false);
    }
  };
  const focus = (row: Row): void => {
    setPicked(row.key);
    if (row.kind === 'node') layer.focusNode(row.id, { zoom: 1.5 });
    else layer.focusEdges([row.id]);
  };
  const foot = saveDisabledReason
    ? null
    : untyped > 0
      ? `Give ${untyped === 1 ? 'the new element' : `all ${untyped} new elements`} a type to save.`
      : saveTarget;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1.5">
        {failed !== null && (
          <Alert tone="destructive" role="alert">
            <CircleAlert />
            <AlertTitle>Couldn’t save</AlertTitle>
            <AlertDescription>
              {failed} Nothing was saved; your {summary.count} changes are kept.
              <Button variant="outline" size="sm" disabled={saving} onClick={() => void save()}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {saveDisabledReason && (
          <Alert>
            <Lock />
            <AlertTitle>You can change this board, not the graph</AlertTitle>
            <AlertDescription>{saveDisabledReason}</AlertDescription>
          </Alert>
        )}
        {groups.map(([title, rows]) => (
          <section key={title} className="flex flex-col gap-0.5">
            <Eyebrow>
              {title} {rows.length}
            </Eyebrow>
            <DiffList>
              {rows.map((row) => (
                <DiffRow
                  key={row.key}
                  op={row.op}
                  marker="chip"
                  {...(row.type ? { kind: row.type } : {})}
                  description={describe(row)}
                  selected={picked === row.key}
                  {...(row.op === 'remove' ? {} : { onActivate: () => focus(row), activateTitle: 'Show it on the board' })}
                  actions={
                    saving ? undefined : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Revert ${row.name}`}
                        title="Revert this change"
                        onClick={() => {
                          if (picked === row.key) setPicked(null);
                          if (onRevert) onRevert(row.kind, row.id);
                          else tracker.revert(row.kind, row.id);
                        }}
                      >
                        <RotateCcw />
                      </Button>
                    )
                  }
                  className={cn(saving && 'opacity-60')}
                >
                  <span
                    aria-hidden="true"
                    className={cn('size-2 shrink-0', row.kind === 'node' ? 'rounded-full' : 'rounded-[2px]', !row.swatch && 'bg-muted-foreground')}
                    style={row.swatch ? { background: row.swatch } : undefined}
                  />
                  <span className={cn('truncate', row.op === 'remove' && 'line-through')}>{row.name}</span>
                </DiffRow>
              ))}
            </DiffList>
          </section>
        ))}
      </div>
      <div className="border-border flex shrink-0 flex-col gap-2 border-t p-2.5">
        {foot && <span className={cn('text-xs', untyped > 0 ? 'text-warning' : 'text-muted-foreground')}>{foot}</span>}
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={() => {
              setPicked(null);
              setFailed(null);
              setSavedNow(false);
              if (onDiscard) onDiscard();
              else discard();
            }}
          >
            Discard all
          </Button>
          <Button size="sm" disabled={saving || !canSave} onClick={() => void save()}>
            {saving && <Spinner />}
            {saving ? 'Saving…' : failed !== null ? 'Try again' : `Save ${summary.count} ${summary.count === 1 ? 'change' : 'changes'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The line under a row's name: the edit as `field from → to`, else its note. */
function describe(row: Row): ReactNode {
  if (row.diff) {
    return (
      <span className="flex items-center gap-1 font-mono">
        <span>{row.diff.field}</span>
        <span className="line-through">{row.diff.from}</span>
        <span>→</span>
        <span className="text-foreground font-semibold">{row.diff.to}</span>
      </span>
    );
  }
  if (row.untyped) return <span className="text-warning">Needs a type</span>;
  return row.note;
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
    const n = store.getNode(id) ?? s.nodes.deleted.find((d) => d.id === id);
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

  const deletedNodes = new Set(s.nodes.deleted.map((n) => n.id));
  const deletedEdges = s.edges.deleted;
  // Untyped is read off the element itself — blank, or the store's `unknown` — since
  // the display label falls back to `node` / `edge`.
  const isNew = (row: Row, type: unknown): Row =>
    typeof type === 'string' && type.trim() !== '' && type !== NO_TYPE
      ? { ...row, note: `New ${row.type}` }
      : { ...row, type: '', untyped: true };
  const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

  const added = [
    ...nodes(s.nodes.new).map((n) => isNew(nodeRow(n, 'add'), n.type)),
    ...edges(s.edges.new).map((e) => isNew(edgeRow(e, 'add'), e.type)),
  ];
  const edited = [
    ...nodes(s.nodes.edited).map((n) => withDiff(nodeRow(n, 'change'), n as unknown as Record<string, unknown>)),
    ...edges(s.edges.edited).map((e) => withDiff(edgeRow(e, 'change'), e as unknown as Record<string, unknown>)),
  ];
  const deleted = [
    ...s.nodes.deleted.map((n) => {
      const along = deletedEdges.filter((e) => e.source === n.id || e.target === n.id).length;
      const row = nodeRow(n, 'remove');
      return along ? { ...row, note: `Deleted with ${plural(along, 'relationship')}` } : row;
    }),
    ...deletedEdges.map((e) => {
      const gone = [e.source, e.target].find((id) => deletedNodes.has(id));
      const row = edgeRow(e, 'remove');
      return gone ? { ...row, note: `Deleted with ${nodeName(gone)}` } : row;
    }),
  ];
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
