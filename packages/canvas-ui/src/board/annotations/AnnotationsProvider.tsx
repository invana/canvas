/**
 * `AnnotationsProvider` — the one place the board's annotations, how they are
 * shown, and what is selected live, so the overlay, the Annotations panel and
 * the Legend's section always agree.
 *
 * Controlled like `styling`: pass `annotations` and the callbacks and the host
 * owns the list; leave them out and the provider keeps its own (a story, a
 * host with no backend yet). The same for `view` / `onViewChange`.
 *
 * It also listens to the board: which records are loaded (an annotation is
 * drawn only when one of its records is), and in Annotate a click on a node or
 * relationship opens that record in the Annotations panel.
 */

import type { Canvas } from '@invana/canvas';
import { useBoardMode, useGraphCanvas } from '@invana/canvas-react';
import type { ClickInspectBehaviour, GraphLayer } from '@invana/graph';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { BOARD_PANEL_COMMAND } from '../BoardPanels';
import { BOARD_IDS } from '../presets';
import {
  type AnnotationActor,
  type AnnotationDraft,
  type AnnotationHideKey,
  type AnnotationPatch,
  type AnnotationRecordRef,
  type AnnotationView,
  type BoardAnnotation,
  DEFAULT_ANNOTATION_VIEW,
} from './types';

/** The id of the annotation being written and not yet saved. */
export const DRAFT_ID = '__draft__';

/** What the Annotations panel shows. */
export type AnnotationsPanelView = { kind: 'list' } | { kind: 'record'; recordId: string } | { kind: 'detail'; id: string };

export interface AnnotationsProviderProps {
  annotations?: readonly BoardAnnotation[];
  onCreate?: (draft: AnnotationDraft) => void | Promise<unknown>;
  onUpdate?: (id: string, patch: AnnotationPatch) => void | Promise<unknown>;
  onDelete?: (id: string) => void | Promise<unknown>;
  /** *Load* on an annotation whose records are not on the board. */
  onLoadRecords?: (ids: string[]) => void;
  view?: AnnotationView;
  onViewChange?: (next: AnnotationView) => void;
  actor?: AnnotationActor;
  children?: ReactNode;
}

export interface AnnotationsContextValue {
  annotations: readonly BoardAnnotation[];
  /** The one being written, drawn and listed like the rest. */
  draft: BoardAnnotation | null;
  view: AnnotationView;
  actor: AnnotationActor;
  /** Node and relationship ids on the board now. */
  loaded: ReadonlySet<string>;
  selectedId: string | null;
  panel: AnnotationsPanelView;
  error: string | null;
  canLoad: boolean;
  isMine: (a: BoardAnnotation) => boolean;
  onBoard: (a: BoardAnnotation) => boolean;
  /** Hidden by the Legend or one by one — never in Present for a step's own. */
  hidden: (a: BoardAnnotation) => boolean;
  select: (id: string | null) => void;
  openPanel: (view: AnnotationsPanelView) => void;
  /** Start writing one: on a record, on a value, a highlight or a group. */
  begin: (draft: Omit<AnnotationDraft, 'text' | 'color'> & { color?: AnnotationDraft['color']; text?: string }) => void;
  /** Save the one being written, or drop it when it says nothing. */
  commit: (text: string, label?: string) => void;
  cancel: () => void;
  update: (id: string, patch: AnnotationPatch) => void;
  remove: (id: string) => void;
  setView: (next: AnnotationView) => void;
  toggleHide: (key: AnnotationHideKey) => void;
  toggleHideId: (id: string) => void;
  showAll: () => void;
  load: (ids: string[]) => void;
}

const AnnotationsContext = createContext<AnnotationsContextValue | null>(null);

/** The board's annotations. Throws outside a `GraphBoard`. */
export function useAnnotations(): AnnotationsContextValue {
  const ctx = useContext(AnnotationsContext);
  if (!ctx) throw new Error('useAnnotations needs an AnnotationsProvider — a GraphBoard has one.');
  return ctx;
}

/** The board's annotations, or `null` where there are none — the Legend reads this. */
export function useAnnotationsOptional(): AnnotationsContextValue | null {
  return useContext(AnnotationsContext);
}

let localSeq = 0;

export function AnnotationsProvider({
  annotations: annotationsProp,
  onCreate,
  onUpdate,
  onDelete,
  onLoadRecords,
  view: viewProp,
  onViewChange,
  actor = { canWrite: true, canSaveView: true },
  children,
}: AnnotationsProviderProps) {
  const canvas = useGraphCanvas();
  const mode = useBoardMode(canvas);

  const [ownList, setOwnList] = useState<BoardAnnotation[]>([]);
  const raw = annotationsProp ?? ownList;
  const [ownView, setOwnView] = useState<AnnotationView>(DEFAULT_ANNOTATION_VIEW);
  const view = viewProp ?? ownView;
  const setView = useCallback((next: AnnotationView) => (onViewChange ?? setOwnView)(next), [onViewChange]);

  const [draft, setDraft] = useState<BoardAnnotation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<AnnotationsPanelView>({ kind: 'list' });
  const [error, setError] = useState<string | null>(null);
  const loaded = useLoadedIds(canvas);
  // A record written without a name takes the one the board draws for it, once it is loaded.
  const annotations = useMemo(() => {
    const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
    return raw.map((a) =>
      a.records.every((r) => r.label)
        ? a
        : { ...a, records: a.records.map((r) => (r.label || !loaded.has(r.id) ? r : { ...r, label: labelOf(layer, r.id, r.kind) })) },
    );
  }, [raw, loaded, canvas]);

  const isMine = useCallback(
    (a: BoardAnnotation) => a.author.kind === 'person' && (a.author.id ? a.author.id === actor.id : a.canEdit === true),
    [actor.id],
  );
  const onBoard = useCallback((a: BoardAnnotation) => a.records.some((r) => loaded.has(r.id)), [loaded]);
  const hidden = useCallback(
    (a: BoardAnnotation) => {
      const h = view.hidden;
      if (h.all || view.hiddenIds?.includes(a.id)) return true;
      if (a.author.kind === 'assistant' ? h.assistant : isMine(a) ? h.mine : h.others) return true;
      return (a.kind === 'highlight' && !!h.highlight) || (a.kind === 'group' && !!h.group);
    },
    [view, isMine],
  );

  const openPanel = useCallback(
    (next: AnnotationsPanelView) => {
      setPanel(next);
      if (canvas.commands.value(BOARD_PANEL_COMMAND) !== 'annotations') void canvas.commands.run(BOARD_PANEL_COMMAND, { value: 'annotations' });
    },
    [canvas],
  );

  // Writes: the host's, or the provider's own list.
  const report = useCallback((p: void | Promise<unknown>) => {
    if (p && typeof (p as Promise<unknown>).then === 'function') {
      (p as Promise<unknown>).then(
        () => setError(null),
        (e: unknown) => setError(e instanceof Error ? e.message : "Couldn't save — try again"),
      );
    }
  }, []);
  const begin = useCallback<AnnotationsContextValue['begin']>(
    (d) => {
      if (!actor.canWrite) return;
      setDraft({
        id: DRAFT_ID,
        kind: d.kind,
        records: d.records,
        prop: d.prop ?? null,
        valueThen: d.valueThen,
        text: d.text ?? '',
        label: d.label ?? '',
        color: d.color ?? (d.kind === 'group' ? 'blue' : 'amber'),
        author: { id: actor.id ?? null, name: 'You', kind: 'person', initials: 'Y' },
        meta: 'just now',
        canEdit: true,
        canDelete: true,
      });
      setSelectedId(DRAFT_ID);
      // A highlight says nothing: it is saved as drawn.
      if (d.kind === 'highlight') {
        setDraft(null);
        saveRef.current({ kind: 'highlight', records: d.records, text: d.text ?? '', color: d.color ?? 'amber' });
      }
    },
    [actor.canWrite, actor.id],
  );
  const save = useCallback(
    (d: AnnotationDraft) => {
      if (onCreate) return report(onCreate(d));
      const a: BoardAnnotation = {
        ...d,
        id: `local-${++localSeq}`,
        author: { id: actor.id ?? null, name: 'You', kind: 'person', initials: 'Y' },
        meta: 'just now',
        canEdit: true,
        canDelete: true,
      };
      setOwnList((l) => [...l, a]);
      setSelectedId(a.id);
    },
    [onCreate, report, actor.id],
  );
  const saveRef = useRef(save);
  saveRef.current = save;
  const commit = useCallback(
    (text: string, label?: string) => {
      setDraft((d) => {
        if (!d) return null;
        const says = text.trim();
        if ((d.kind === 'note' || d.kind === 'value') && !says) return null;
        saveRef.current({
          kind: d.kind,
          records: [...d.records],
          ...(d.prop ? { prop: d.prop } : {}),
          ...(d.valueThen !== undefined ? { valueThen: d.valueThen } : {}),
          text: says,
          label: (label ?? d.label ?? '').trim(),
          color: d.color,
        });
        return null;
      });
    },
    [],
  );
  const cancel = useCallback(() => setDraft(null), []);
  const update = useCallback(
    (id: string, patch: AnnotationPatch) => {
      if (id === DRAFT_ID) return setDraft((d) => (d ? { ...d, ...patch } : d));
      if (onUpdate) return report(onUpdate(id, patch));
      setOwnList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    },
    [onUpdate, report],
  );
  const remove = useCallback(
    (id: string) => {
      setSelectedId((s) => (s === id ? null : s));
      setPanel((p) => (p.kind === 'detail' && p.id === id ? { kind: 'list' } : p));
      if (onDelete) return report(onDelete(id));
      setOwnList((l) => l.filter((a) => a.id !== id));
    },
    [onDelete, report],
  );

  const toggleHide = useCallback(
    (key: AnnotationHideKey) => {
      const h = { ...view.hidden, [key]: !view.hidden[key] };
      if (key !== 'all' && !h[key]) h.all = false;
      setView({ ...view, hidden: h });
    },
    [view, setView],
  );
  const toggleHideId = useCallback(
    (id: string) => {
      const ids = new Set(view.hiddenIds ?? []);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      setView({ ...view, hiddenIds: [...ids] });
    },
    [view, setView],
  );
  const showAll = useCallback(() => setView({ ...view, hidden: {}, hiddenIds: [] }), [view, setView]);
  const load = useCallback((ids: string[]) => onLoadRecords?.(ids), [onLoadRecords]);

  // Leaving Annotate drops what was being written and the selection.
  useEffect(() => {
    if (mode !== 'annotate') {
      setDraft(null);
      setSelectedId(null);
    }
  }, [mode]);

  // In Annotate, a click on a record opens it in the panel: its values, each one annotatable.
  const modeRef = useRef(mode);
  modeRef.current = mode;
  useEffect(() => {
    const inspect = canvas.behaviours.get<ClickInspectBehaviour>(BOARD_IDS.clickInspect);
    return inspect?.events.on('inspect:change', (t) => {
      if (!t || modeRef.current !== 'annotate') return;
      if (canvas.commands.value('tool.active') && canvas.commands.value('tool.active') !== 'select') return;
      // After the board's own reaction to the click, so the panel it opens is this one.
      setTimeout(() => openPanel({ kind: 'record', recordId: t.id }), 0);
    });
  }, [canvas, openPanel]);

  const value = useMemo<AnnotationsContextValue>(
    () => ({
      annotations,
      draft,
      view,
      actor,
      loaded,
      selectedId,
      panel,
      error,
      canLoad: onLoadRecords !== undefined,
      isMine,
      onBoard,
      hidden,
      select: setSelectedId,
      openPanel,
      begin,
      commit,
      cancel,
      update,
      remove,
      setView,
      toggleHide,
      toggleHideId,
      showAll,
      load,
    }),
    [annotations, draft, view, actor, loaded, selectedId, panel, error, onLoadRecords, isMine, onBoard, hidden, openPanel, begin, commit, cancel, update, remove, setView, toggleHide, toggleHideId, showAll, load],
  );
  return <AnnotationsContext.Provider value={value}>{children}</AnnotationsContext.Provider>;
}

/** The ids of the nodes and relationships on the board, kept current a frame at a time. */
function useLoadedIds(canvas: Canvas): ReadonlySet<string> {
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    let frame: number | null = null;
    let layer: GraphLayer | undefined;
    const read = () => {
      frame = null;
      layer ??= canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
      if (!layer) return;
      const next = new Set<string>();
      for (const n of layer.store.nodes()) next.add(n.id);
      for (const e of layer.store.edges()) next.add(e.id);
      setIds((prev) => (same(prev, next) ? prev : next));
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(read);
    };
    const offs: (() => void)[] = [];
    const attach = () => {
      layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
      if (!layer || offs.length) return;
      for (const ev of ['node:add', 'node:remove', 'edge:add', 'edge:remove'] as const) offs.push(layer.store.events.on(ev, schedule));
      offs.push(layer.events.on('data:changed', schedule));
      schedule();
    };
    attach();
    // The layer registers in the same commit as this effect on a first mount.
    const retry = requestAnimationFrame(attach);
    return () => {
      cancelAnimationFrame(retry);
      if (frame !== null) cancelAnimationFrame(frame);
      for (const off of offs) off();
    };
  }, [canvas]);
  return ids;
}

function same(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of b) if (!a.has(x)) return false;
  return true;
}

/** `By you`, `By others`, `By the assistant` — what the Legend and the panel call each author group. */
export function authorGroup(a: BoardAnnotation, isMine: (a: BoardAnnotation) => boolean): 'mine' | 'others' | 'assistant' {
  return a.author.kind === 'assistant' ? 'assistant' : isMine(a) ? 'mine' : 'others';
}

/** What an annotation is on, in words: `DXB · on_time`, `LHR–DXB`, `7 records`. */
export function whereOf(a: BoardAnnotation): string {
  if (a.kind === 'note' || a.kind === 'value') {
    const r = a.records[0];
    const name = r?.label || r?.id || '';
    return a.kind === 'value' && a.prop ? `${name} · ${a.prop}` : name;
  }
  return `${a.records.length} record${a.records.length === 1 ? '' : 's'}`;
}

/** The record refs of the given ids, labelled as the board draws them. */
export function recordsOf(canvas: Canvas, ids: string[], kind: 'node' | 'edge'): AnnotationRecordRef[] {
  const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
  return ids.map((id) => ({ id, kind, label: labelOf(layer, id, kind) }));
}

/** A record's name: its label, else its id. A relationship is named by its two ends — `LHR–DXB`. */
export function labelOf(layer: GraphLayer | undefined, id: string, kind: 'node' | 'edge'): string {
  if (kind === 'edge') {
    const e = layer?.store.getEdge(id);
    return e ? `${labelOf(layer, e.source, 'node')}–${labelOf(layer, e.target, 'node')}` : id;
  }
  const rec = layer?.store.getNode(id);
  if (!rec) return id;
  // What the board draws as its label, first — the name a reader sees.
  const drawn = (layer!.resolveNodeStyle(rec) as { labelText?: unknown }).labelText;
  if (typeof drawn === 'string' && drawn) return drawn;
  const data = (rec.data ?? {}) as Record<string, unknown>;
  for (const k of ['label', 'name', 'title', 'code', 'id']) {
    const v = data[k];
    if (typeof v === 'string' && v) return v;
  }
  return rec.type || id;
}

