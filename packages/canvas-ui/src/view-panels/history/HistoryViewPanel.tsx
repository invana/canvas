// HistoryViewPanel — the canvas's **record**: every applied history entry,
// newest first, with who made it (`actor`), what it was (its title, the view
// action, or a data summary like "+3 nodes · −1 edge"), the playbook step that
// produced it and a *streamed* badge for merged feed writes. Filter by actor;
// Undo / Redo through the engine's `history.*` commands. RFC
// `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F36.
//
// Read-only apart from Undo / Redo: `canvas.history` has no jump-to-entry, and
// entries come only from the canvas's own writes. Per D-13 this panel shows every
// entry; a presenter shows steps only.

import type { Canvas, Delta, DeltaRecord, LogEntry } from '@invana/canvas';
import { CanvasContext, useHistoryEntries } from '@invana/canvas-react';
import { Badge, Button, Card, Separator, cn } from '@invana/ui';
import { useContext, useEffect, useMemo, useState } from 'react';

import { ACTIVE_CLASS } from '../../components/styles';
import { HistoryToolbar } from '../../toolbars/HistoryToolbar';

export interface HistoryViewPanelProps {
  /**
   * The live canvas engine. Optional: inside a `<Canvas>` / `<GraphCanvas>` tree
   * the nearest one is used. `null` (not ready yet) renders a placeholder.
   */
  canvas?: Canvas | null;
  /** Show the Undo / Redo bar. Default `true`. */
  showUndoRedo?: boolean;
  /** Extra classes for the panel root. */
  className?: string;
}

/**
 * The canvas's history as a panel: applied entries newest first, each with its
 * label, actor, step and streamed badges and age; an actor filter; Undo / Redo.
 * Drop it inside a canvas tree with no props, or pass `canvas` to target a
 * specific instance.
 */
export function HistoryViewPanel({ canvas, className, ...rest }: HistoryViewPanelProps) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === undefined ? fromContext : canvas;
  if (!resolved) {
    return (
      <Card className={cn('flex h-full w-full items-center justify-center', className)}>
        <p className="text-muted-foreground p-4 text-base">No canvas yet.</p>
      </Card>
    );
  }
  return <HistoryViewPanelContent canvas={resolved} className={className} {...rest} />;
}

/** `n` + a noun, pluralised (`plural` defaults to `noun + 's'`). */
function count(n: number, noun: string, plural = `${noun}s`): string {
  return `${n} ${n === 1 ? noun : plural}`;
}

/**
 * One source's net delta as short phrases: `+3 nodes`, `−1 edge`, `2 updated`,
 * `4 hidden`, `1 shown`, `1 pinned`. Empty categories are left out.
 */
function summariseDelta(delta: Delta<DeltaRecord, DeltaRecord>): string[] {
  const out: string[] = [];
  const addedNodes = delta.added?.nodes?.length ?? 0;
  const addedEdges = delta.added?.edges?.length ?? 0;
  const removedNodes = delta.removed?.nodeIds?.length ?? 0;
  const removedEdges = delta.removed?.edgeIds?.length ?? 0;
  const updated = (delta.updated?.nodes?.length ?? 0) + (delta.updated?.edges?.length ?? 0);
  const hidden = (delta.hidden?.nodeIds?.length ?? 0) + (delta.hidden?.edgeIds?.length ?? 0);
  const shown = (delta.shown?.nodeIds?.length ?? 0) + (delta.shown?.edgeIds?.length ?? 0);
  const pinned = delta.pinned?.length ?? 0;
  if (addedNodes) out.push(`+${count(addedNodes, 'node')}`);
  if (addedEdges) out.push(`+${count(addedEdges, 'edge')}`);
  if (removedNodes) out.push(`−${count(removedNodes, 'node')}`);
  if (removedEdges) out.push(`−${count(removedEdges, 'edge')}`);
  if (updated) out.push(`${updated} updated`);
  if (hidden) out.push(`${hidden} hidden`);
  if (shown) out.push(`${shown} shown`);
  if (pinned) out.push(`${pinned} pinned`);
  return out;
}

/** A short age: `now`, `12s`, `3m`, `2h`. `at` is `performance.now()` ms. */
function age(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 5) return 'now';
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

/** The panel body — runs only with a live `canvas`, so the hooks can't throw. */
function HistoryViewPanelContent({ canvas, showUndoRedo = true, className }: HistoryViewPanelProps & { canvas: Canvas }) {
  const [actor, setActor] = useState<string | undefined>(undefined);
  const all = useHistoryEntries(undefined, canvas);
  const actors = useMemo(() => [...new Set(all.map((e) => e.actor))].sort(), [all]);
  // A filter on an actor who no longer has entries (after undo / clear) shows all.
  const active = actor !== undefined && actors.includes(actor) ? actor : undefined;
  const shown = useMemo(
    () => (active === undefined ? all : all.filter((e) => e.actor === active)).slice().reverse(),
    [all, active],
  );

  // Ages go stale without a log change; tick every 15 s.
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    setNow(performance.now());
    const timer = setInterval(() => setNow(performance.now()), 15_000);
    return () => clearInterval(timer);
  }, [all]);

  return (
    <div className={cn('flex h-full flex-col gap-2 overflow-hidden p-2 text-base', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm whitespace-nowrap">{count(all.length, 'entry', 'entries')}</span>
        {showUndoRedo && <HistoryToolbar canvas={canvas} showRedraw={false} />}
      </div>

      {actors.length > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" className={cn('h-6 px-2 text-sm', active === undefined && ACTIVE_CLASS)} onClick={() => setActor(undefined)}>
            All
          </Button>
          {actors.map((a) => (
            <Button
              key={a}
              variant="ghost"
              size="sm"
              className={cn('h-6 px-2 text-sm', active === a && ACTIVE_CLASS)}
              onClick={() => setActor(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      )}

      <Separator />

      <ol className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {shown.map((entry) => (
          <HistoryRow key={entry.id} entry={entry} canvas={canvas} now={now} />
        ))}
        {shown.length === 0 && <li className="text-muted-foreground px-2 text-sm">Nothing recorded yet.</li>}
      </ol>
    </div>
  );
}

/** One entry: label, data summary, actor / step / streamed badges, age. */
function HistoryRow({ entry, canvas, now }: { entry: LogEntry; canvas: Canvas; now: number }) {
  // Entries are the log's records; a merged streamed entry is the same object
  // with more ops, so recompute on every render rather than memoising by identity.
  const data = canvas.history.entryData(entry).flatMap((d) => summariseDelta(d.delta));
  let action: string | undefined;
  for (const part of entry.parts) if (part.kind === 'view' && part.action) (action ??= part.action);
  const label = entry.title ?? action ?? (data.length > 0 ? 'Data change' : 'Change');
  const stepIndex = entry.stepId ? canvas.playbook.steps.findIndex((s) => s.id === entry.stepId) : -1;
  const step = stepIndex >= 0 ? canvas.playbook.steps[stepIndex] : undefined;

  return (
    <li className="hover:bg-muted flex flex-col gap-0.5 rounded-md px-2 py-1">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">{age(entry.at, now)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {entry.actor}
        </Badge>
        {entry.stepId && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]" title={step?.title ?? entry.stepId}>
            {step ? `step ${stepIndex + 1}` : 'step'}
          </Badge>
        )}
        {entry.coalesced && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            streamed
          </Badge>
        )}
        {data.length > 0 && <span className="text-muted-foreground text-[11px]">{data.join(' · ')}</span>}
      </div>
    </li>
  );
}
