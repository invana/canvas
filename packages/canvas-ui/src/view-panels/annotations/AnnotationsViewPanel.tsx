/**
 * `AnnotationsViewPanel` — the board's annotations, to read and act on.
 *
 * | View | Shows |
 * |---|---|
 * | list | filter by author; *On this board* (each with its own eye) and *Elsewhere in this graph* (with *Load*); a strip when some are hidden |
 * | record | one node or relationship: its values, each annotatable in Annotate; what is on it |
 * | detail | one annotation: what it says, what it is on, the value then and now, who wrote it; *Show on the board*, *Delete* |
 *
 * Bare content like every `view-panels/` surface — the rail opens it in a
 * `FloatingPanel` with the title. Reads and writes through the board's
 * `AnnotationsProvider`.
 */

import type { Canvas } from '@invana/canvas';
import { useBoardMode } from '@invana/canvas-react';
import { Textarea } from '@invana/forms';
import type { GraphLayer } from '@invana/graph';
import {
  AnnotationRow,
  AuthorMark,
  Button,
  cn,
  EmptyState,
  Eyebrow,
  PropertyList,
  PropertyRow,
  SegmentedControl,
} from '@invana/ui';
import { ChevronLeft, Eye, EyeOff, Highlighter, MessageSquareText, StickyNote, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { authorGroup, DRAFT_ID, labelOf, recordsOf, useAnnotations, whereOf } from '../../board/annotations/AnnotationsProvider';
import { fmt } from '../../board/annotations/AnnotationsOverlay';
import type { BoardAnnotation } from '../../board/annotations/types';
import { BOARD_IDS } from '../../board/presets';

export interface AnnotationsViewPanelProps {
  canvas: Canvas | null;
  className?: string;
}

type Filter = 'all' | 'mine' | 'others' | 'assistant';

export function AnnotationsViewPanel({ canvas, className }: AnnotationsViewPanelProps) {
  const ctx = useAnnotations();
  const view = ctx.panel;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {ctx.error && <p className="text-destructive px-1 text-xs">{ctx.error}</p>}
      {view.kind === 'list' && <ListView />}
      {view.kind === 'record' && canvas && <RecordView canvas={canvas} recordId={view.recordId} />}
      {view.kind === 'detail' && canvas && <DetailView canvas={canvas} id={view.id} />}
    </div>
  );
}

/** `n here` — the panel's count beside its title. */
export function AnnotationsCount() {
  const ctx = useAnnotations();
  const n = ctx.annotations.filter((a) => ctx.onBoard(a)).length;
  return n ? <>{n} here</> : null;
}

function rowProps(a: BoardAnnotation) {
  return {
    kind: a.kind,
    color: a.color,
    text: a.kind === 'group' ? a.label || 'Group' : a.text || (a.kind === 'highlight' ? a.records.map((r) => r.label || r.id).join(' · ') : ''),
    where: whereOf(a),
    author: { name: a.author.name, kind: a.author.kind, ...(a.author.initials ? { initials: a.author.initials } : {}), ...(a.author.tone ? { tone: a.author.tone } : {}) },
    ...(a.meta ? { meta: a.meta } : {}),
    ...(a.sessionTag ? { sessionTag: a.sessionTag } : {}),
  };
}

function ListView() {
  const ctx = useAnnotations();
  const [filter, setFilter] = useState<Filter>('all');
  const list = ctx.annotations.filter((a) => a.id !== DRAFT_ID && (filter === 'all' || authorGroup(a, ctx.isMine) === filter));
  const here = list.filter((a) => ctx.onBoard(a));
  const elsewhere = list.filter((a) => !ctx.onBoard(a));
  const hiddenHere = ctx.annotations.filter((a) => ctx.onBoard(a) && ctx.hidden(a)).length;
  const counts = (f: Filter) => ctx.annotations.filter((a) => f === 'all' || authorGroup(a, ctx.isMine) === f).length;
  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: `All ${counts('all')}` },
    { value: 'mine', label: `You ${counts('mine')}` },
    { value: 'others', label: `Others ${counts('others')}` },
    ...(counts('assistant') ? [{ value: 'assistant' as const, label: `Assistant ${counts('assistant')}` }] : []),
  ];

  if (ctx.annotations.length === 0) {
    return (
      <EmptyState
        icon={<StickyNote className="size-5" aria-hidden="true" />}
        title="Nothing annotated on this graph yet"
        description={
          ctx.actor.canWrite
            ? 'Pick Annotate in the mode picker, then click a node or relationship to say what the data says.'
            : (ctx.actor.whyNot ?? 'You can view annotations here when someone adds them.')
        }
      />
    );
  }
  return (
    <>
      {hiddenHere > 0 && (
        <div className="bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
          <EyeOff className="size-3.5" aria-hidden="true" />
          <span className="flex-1">
            {ctx.view.hidden.all ? `All ${here.length} hidden on this board, for everyone who opens it` : `${hiddenHere} hidden on this board`}
          </span>
          <Button size="xs" variant="ghost" onClick={ctx.showAll}>
            Show
          </Button>
        </div>
      )}
      <SegmentedControl size="xs" options={filters} value={filter} onValueChange={(v) => setFilter(v as Filter)} />
      <Eyebrow>On this board · {here.length}</Eyebrow>
      {here.length === 0 && <p className="text-muted-foreground px-1 text-xs">None from {filter === 'mine' ? 'you' : filter === 'all' ? 'anyone' : filter} on what this board has loaded.</p>}
      {here.map((a) => {
        const off = ctx.hidden(a);
        return (
          <AnnotationRow
            key={a.id}
            {...rowProps(a)}
            selected={ctx.selectedId === a.id}
            dimmed={off}
            onSelect={() => {
              ctx.select(a.id);
              ctx.openPanel({ kind: 'detail', id: a.id });
            }}
            trailing={
              <Button size="xs" variant="ghost" aria-label={off ? 'Show on this board' : 'Hide on this board'} title={off ? 'Show on this board' : 'Hide on this board'} onClick={() => ctx.toggleHideId(a.id)}>
                {off ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            }
          />
        );
      })}
      {elsewhere.length > 0 && <Eyebrow>Elsewhere in this graph · {elsewhere.length}</Eyebrow>}
      {elsewhere.map((a) => (
        <AnnotationRow
          key={a.id}
          {...rowProps(a)}
          dimmed
          selected={ctx.selectedId === a.id}
          onSelect={() => ctx.openPanel({ kind: 'detail', id: a.id })}
          {...(ctx.canLoad
            ? {
                trailing: (
                  <Button size="xs" variant="outline" onClick={() => ctx.load(a.records.map((r) => r.id))}>
                    Load
                  </Button>
                ),
              }
            : {})}
        />
      ))}
      <p className="text-muted-foreground px-1 pt-2 text-xs">Annotations belong to the graph. Any board that loads their records shows them.</p>
    </>
  );
}

function Back() {
  const ctx = useAnnotations();
  return (
    <Button size="xs" variant="ghost" className="self-start" onClick={() => ctx.openPanel({ kind: 'list' })}>
      <ChevronLeft aria-hidden="true" />
      All annotations
    </Button>
  );
}

function RecordView({ canvas, recordId }: { canvas: Canvas; recordId: string }) {
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas);
  const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
  const n = layer?.store.getNode(recordId);
  const e = n ? undefined : layer?.store.getEdge(recordId);
  const kind: 'node' | 'edge' = n ? 'node' : 'edge';
  const rec = n ?? e;
  const name = labelOf(layer, recordId, kind);
  const props = Object.entries((rec?.data ?? {}) as Record<string, unknown>).filter(([, v]) => v === null || typeof v !== 'object');
  const can = mode === 'annotate' && ctx.actor.canWrite;
  const on = ctx.annotations.filter((a) => a.records.some((r) => r.id === recordId));
  const count = (k: string) => on.filter((a) => a.kind === 'value' && a.prop === k).length;
  const records = recordsOf(canvas, [recordId], kind);

  return (
    <>
      <Back />
      <div className="flex items-center gap-2 px-1">
        <span className="font-semibold">{name}</span>
        <span className="text-muted-foreground font-mono text-xs">{rec?.type ?? kind}</span>
      </div>
      {!rec && <p className="text-muted-foreground px-1 text-xs">This record is not on the board.</p>}
      {can && rec && (
        <div className="flex flex-wrap gap-1.5 px-1">
          <Button size="xs" variant="secondary" onClick={() => ctx.begin({ kind: 'note', records })}>
            <StickyNote aria-hidden="true" />
            Annotate {name}
          </Button>
          {kind === 'node' && (
            <Button size="xs" variant="secondary" onClick={() => ctx.begin({ kind: 'highlight', records })}>
              <Highlighter aria-hidden="true" />
              Highlight
            </Button>
          )}
        </div>
      )}
      {props.length > 0 && (
        <>
          <Eyebrow>Properties</Eyebrow>
          <PropertyList>
            {props.map(([k, v]) => (
              <PropertyRow key={k} label={k} mono>
                <span className="flex items-center gap-1.5">
                  <span className="min-w-0 flex-1 truncate">{fmt(v)}</span>
                  {count(k) > 0 && <span className="text-muted-foreground text-xs">{count(k)}</span>}
                  {can && (
                    <Button size="xs" variant="ghost" aria-label={`Annotate ${k}`} title="Annotate this value" onClick={() => ctx.begin({ kind: 'value', records, prop: k, valueThen: v })}>
                      <MessageSquareText aria-hidden="true" />
                    </Button>
                  )}
                </span>
              </PropertyRow>
            ))}
          </PropertyList>
        </>
      )}
      <Eyebrow>On {name} · {on.length}</Eyebrow>
      {on.length === 0 && <p className="text-muted-foreground px-1 text-xs">{can ? 'Nothing on it yet. Annotate a value above, or the whole record.' : 'Nothing on it yet.'}</p>}
      {on.map((a) => (
        <AnnotationRow key={a.id} {...rowProps(a)} selected={ctx.selectedId === a.id} onSelect={() => ctx.openPanel({ kind: 'detail', id: a.id })} />
      ))}
    </>
  );
}

function DetailView({ canvas, id }: { canvas: Canvas; id: string }) {
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas);
  const a = ctx.annotations.find((x) => x.id === id);
  const [text, setText] = useState(a?.text ?? '');
  useEffect(() => setText(a?.text ?? ''), [a?.text]);
  if (!a) {
    return (
      <>
        <Back />
        <p className="text-muted-foreground px-1 text-xs">This annotation is gone.</p>
      </>
    );
  }
  const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
  const editable = mode === 'annotate' && a.canEdit && a.kind !== 'highlight';
  const r0 = a.records[0];
  const rec = r0 ? (r0.kind === 'node' ? layer?.store.getNode(r0.id) : layer?.store.getEdge(r0.id)) : undefined;
  const now = a.kind === 'value' && a.prop && rec ? fmt((rec.data as Record<string, unknown> | undefined)?.[a.prop]) : null;
  const then = a.valueThen === undefined ? null : fmt(a.valueThen);
  const onBoard = ctx.onBoard(a);
  const names = a.records.map((r) => r.label || r.id);

  return (
    <>
      <Back />
      <div className="flex items-center gap-2 px-1">
        <AuthorMark kind={a.author.kind} name={a.author.name} {...(a.author.initials ? { initials: a.author.initials } : {})} {...(a.author.tone ? { tone: a.author.tone } : {})} />
        <span className="font-semibold">{a.kind === 'group' ? 'Group' : a.kind === 'highlight' ? 'Highlight' : 'Annotation'}</span>
        <span className="text-muted-foreground text-xs">
          {a.author.name}
          {a.meta ? ` · ${a.meta}` : ''}
        </span>
      </div>
      {editable ? (
        <Textarea
          aria-label={a.kind === 'group' ? 'Group name' : 'Annotation text'}
          rows={3}
          value={a.kind === 'group' ? (a.label ?? '') : text}
          onChange={(e) => (a.kind === 'group' ? ctx.update(a.id, { label: e.target.value }) : setText(e.target.value))}
          onBlur={() => a.kind !== 'group' && text.trim() && text !== a.text && ctx.update(a.id, { text: text.trim() })}
        />
      ) : (
        <p className="px-1">{a.kind === 'group' ? a.label || 'Group' : a.text}</p>
      )}
      <PropertyList>
        <PropertyRow label="On" mono>
          {a.kind === 'value' ? `${names[0]} · ${a.prop}` : names.slice(0, 6).join(' · ') + (names.length > 6 ? ` +${names.length - 6}` : '')}
        </PropertyRow>
        {a.kind === 'value' && (
          <PropertyRow label="Value" mono>
            {onBoard ? now : `${then} when noted`}
            {onBoard && then !== null && then !== now && <span className="text-warning block text-xs">Was {then} when noted. The annotation keeps what it said.</span>}
          </PropertyRow>
        )}
        <PropertyRow label="From">{a.author.kind === 'assistant' ? `The assistant${a.meta ? ` · ${a.meta}` : ''}` : `Written by ${a.author.name}${a.meta ? `, ${a.meta}` : ''}`}</PropertyRow>
        <PropertyRow label="Seen in">
          {a.sessionTag ? `Only the session “${a.sessionTag}”` : `The graph: every board and session that loads ${names.length > 2 ? 'its records' : names.join(' or ')}`}
        </PropertyRow>
      </PropertyList>
      <div className="flex items-center gap-1.5 border-t pt-2">
        {onBoard && (
          <Button
            size="xs"
            variant="secondary"
            onClick={() => {
              ctx.select(a.id);
              if (ctx.hidden(a)) ctx.showAll();
              frame(canvas, layer, a.records.map((r) => r.id));
            }}
          >
            Show on the board
          </Button>
        )}
        {!onBoard && ctx.canLoad && (
          <Button size="xs" variant="secondary" onClick={() => ctx.load(a.records.map((r) => r.id))}>
            Load its records
          </Button>
        )}
        <span className="flex-1" />
        {a.canDelete && (
          <Button size="xs" variant="ghost" className="text-destructive" onClick={() => ctx.remove(a.id)}>
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>
      {!a.canDelete && <p className="text-muted-foreground px-1 text-xs">{a.whyNot ?? `Only ${a.author.name} can delete it`}</p>}
    </>
  );
}

/** The camera frames the records' nodes — a relationship by its two ends. */
function frame(canvas: Canvas, layer: GraphLayer | undefined, ids: string[]): void {
  const pts: { x: number; y: number }[] = [];
  for (const id of ids) {
    const e = layer?.store.getEdge(id);
    for (const n of e ? [e.source, e.target] : [id]) {
      const p = layer?.store.getNode(n) ? layer.store.getPosition(n) : undefined;
      if (p) pts.push(p);
    }
  }
  if (!pts.length) return;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  canvas.camera.fitContent({ x, y, width: Math.max(...xs) - x || 1, height: Math.max(...ys) - y || 1 }, 160);
}
