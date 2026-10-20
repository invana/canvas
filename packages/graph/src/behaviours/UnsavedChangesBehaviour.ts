/**
 * `UnsavedChangesBehaviour` — what on a `GraphLayer` differs from what the host
 * last saved, and the marks that say so on the board.
 *
 * **What is unsaved.** The canvas records every content write in its operation
 * log. This behaviour keeps a *save mark* — the entries applied when the host
 * last called {@link markSaved} — and folds the difference between that and
 * now: the forward ops of every applied entry the mark does not hold, after the
 * inverse ops of every entry it holds that has since been undone. Per element
 * the fold lands on one of:
 *
 * - **new** — not there at the mark, there now;
 * - **edited** — there at both, and a content field (`type`, `data`, `style`, an
 *   edge's ends) differs from its value at the mark. An edit undone, or typed
 *   back to its old value, stops counting;
 * - **deleted** — there at the mark, gone now. Its last record is kept so a
 *   ghost layer can still draw it.
 *
 * Position, pin and hidden writes never count, so a drag or a layout leaves the
 * board saved. Entries made by an actor in {@link UnsavedChangesBehaviourOptions.savedActors}
 * (default `'engine'`) are data that came from the backend — an expansion, a
 * feed — and never count either. A baseline load clears the log, and with it
 * the mark: a freshly loaded board is saved.
 *
 * **The marks.** New and edited elements carry the runtime states
 * {@link UNSAVED_NEW_STATE} / {@link UNSAVED_EDITED_STATE}; the behaviour
 * registers their overlays on the layer (a dashed outline at half fill for new,
 * a dot badge for edited). Runtime states are never recorded, saved or exported.
 *
 * **The acts.** {@link changes} is the net `Delta` for the host to send;
 * {@link markSaved} moves the mark once the host's save succeeded (a failed save
 * leaves the marks); {@link discard} writes the inverse of the changes as one
 * undoable entry, which folds to nothing — the board is back at the mark.
 *
 * ```ts
 * canvas.behaviours.register(new UnsavedChangesBehaviour({ id: 'unsaved', targetLayerId: 'graph', enabled: true }));
 * const tracker = canvas.behaviours.get<UnsavedChangesBehaviour>('unsaved');
 * tracker.events.on('change', ({ count }) => …);
 * await api.save(tracker.changes()); tracker.markSaved();
 * ```
 */

import {
  Behaviour,
  EventEmitter,
  type BehaviourOptions,
  type CanvasContext,
  type Delta,
  type LogEntry,
  type OperationLog,
} from '@invana/canvas';

import type { HistoryOp } from '../history/types';
import { GraphLayer } from '../layer/GraphLayer';
import type { EdgeStyle, NodeStyle } from '../layer/types';
import { cssColorToNumber } from '../theme/accent';
import type { GraphEdge, GraphNode } from '../store/types';

/** The command whose value is the unsaved count as text (`null` while saved) — a rail badge reads it. */
export const UNSAVED_COUNT_COMMAND = 'unsaved.count';

/** Runtime state on a node or edge that is not at the save mark. */
export const UNSAVED_NEW_STATE = 'unsaved-new';
/** Runtime state on a node or edge whose content changed since the save mark. */
export const UNSAVED_EDITED_STATE = 'unsaved-edited';

/** Fields that are not content: writing them never makes the board unsaved (`boundingBox` is measured). */
const NOT_CONTENT = new Set(['id', 'position', 'pinned', 'hidden', 'states', 'boundingBox']);

export interface UnsavedChangesBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` whose changes are tracked. */
  targetLayerId: string;
  /**
   * Actors whose log entries are already saved — data that came from the
   * backend (an expansion, a feed). Default `['engine']`.
   */
  savedActors?: readonly string[];
  /**
   * The edited dot's colour. Default: the document's `--color-warning`, else amber.
   */
  markColor?: number;
}

/** Where one element stands against the save mark. */
type Net<R> =
  | { status: 'new' }
  | { status: 'edited'; before: Record<string, unknown> }
  | { status: 'deleted'; record: R };

/** What the board holds that is not saved. */
export interface UnsavedChangesSummary {
  /** Elements new, edited or deleted since the mark — nodes and edges together. */
  count: number;
  nodes: { new: string[]; edited: string[]; deleted: GraphNode[] };
  edges: { new: string[]; edited: string[]; deleted: GraphEdge[] };
}

export interface UnsavedChangesEventMap {
  /** The unsaved set moved — after a write, an undo / redo, a save or a discard. */
  change: UnsavedChangesSummary;
}

/** One element-level step of the fold, for nodes or edges. */
type Step<R> =
  | { kind: 'add'; record: R }
  | { kind: 'remove'; record: R }
  | { kind: 'update'; id: string; before: Record<string, unknown>; after: Record<string, unknown> };

const EMPTY: UnsavedChangesSummary = {
  count: 0,
  nodes: { new: [], edited: [], deleted: [] },
  edges: { new: [], edited: [], deleted: [] },
};

export class UnsavedChangesBehaviour extends Behaviour<UnsavedChangesBehaviourOptions> {
  override readonly kind = 'unsaved-changes';
  readonly events = new EventEmitter<UnsavedChangesEventMap>();

  private layer: GraphLayer | null = null;
  private log: OperationLog | undefined;
  private offLog: (() => void) | null = null;
  private offAttach: (() => void) | null = null;
  private offFlush: (() => void) | null = null;
  private offCommand: (() => void) | null = null;
  /** The entries applied at the save mark. */
  private saved = new Map<string, LogEntry>();
  private summary: UnsavedChangesSummary = EMPTY;
  /** The summary predates a write; the next read, or the queued pass, folds again. */
  private stale = false;
  /** Folded by a read, but its marks and `change` not yet sent — the queued pass sends them. */
  private unpublished = false;
  private queued = false;
  /** Ids currently carrying a mark, so a recompute only touches what moved. */
  private marked = { node: new Map<string, string>(), edge: new Map<string, string>() };

  constructor(opts: UnsavedChangesBehaviourOptions) {
    super(opts);
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** What is unsaved now. */
  get current(): UnsavedChangesSummary {
    // A read folds quietly: it may run inside a React render, where moving marks
    // or emitting `change` would update other components mid-render.
    if (this.stale) {
      this.summary = this.fold();
      this.stale = false;
      this.unpublished = true;
    }
    return this.summary;
  }

  /** How many elements are new, edited or deleted since the mark. */
  get count(): number {
    return this.current.count;
  }

  /**
   * The unsaved changes as one net `Delta` — what the host sends to its
   * backend: new elements in full, edited ones as a patch of their changed
   * content fields at their current values, deleted ones by id.
   */
  changes(): Delta<GraphNode, GraphEdge> {
    const store = this.layer?.store;
    if (!store) return {};
    this.recompute();
    const s = this.summary;
    const patchOf = (current: Record<string, unknown> | undefined, before: Record<string, unknown>) => {
      const patch: Record<string, unknown> = {};
      for (const k of Object.keys(before)) patch[k] = current?.[k];
      return patch;
    };
    const editedNodes = this.netFor('node');
    const editedEdges = this.netFor('edge');
    return {
      added: {
        nodes: s.nodes.new.map((id) => store.getNode(id)).filter((n): n is GraphNode => !!n),
        edges: s.edges.new.map((id) => store.getEdge(id)).filter((e): e is GraphEdge => !!e),
      },
      updated: {
        nodes: s.nodes.edited.map((id) => ({
          id,
          patch: patchOf(store.getNode(id) as unknown as Record<string, unknown>, editedNodes.get(id) ?? {}) as Partial<GraphNode>,
        })),
        edges: s.edges.edited.map((id) => ({
          id,
          patch: patchOf(store.getEdge(id) as unknown as Record<string, unknown>, editedEdges.get(id) ?? {}) as Partial<GraphEdge>,
        })),
      },
      removed: { nodeIds: s.nodes.deleted.map((n) => n.id), edgeIds: s.edges.deleted.map((e) => e.id) },
    };
  }

  /** The host saved: what the board holds now is the new mark, and every mark clears. */
  markSaved(): void {
    this.saved = new Map(this.appliedEntries().map((e) => [e.id, e]));
    this.recompute();
  }

  /**
   * Put the board back at the mark, as one undoable entry (`'discard changes'`):
   * new elements go, deleted ones come back, edited ones take their saved values.
   */
  discard(): void {
    const store = this.layer?.store;
    if (!store) return;
    this.recompute();
    if (this.summary.count === 0) return;
    const s = this.summary;
    const nodeBefore = this.netFor('node');
    const edgeBefore = this.netFor('edge');
    store.applyDelta(
      {
        removed: { nodeIds: s.nodes.new, edgeIds: s.edges.new },
        added: { nodes: s.nodes.deleted, edges: s.edges.deleted },
        updated: {
          nodes: s.nodes.edited.map((id) => ({ id, patch: (nodeBefore.get(id) ?? {}) as Partial<GraphNode> })),
          edges: s.edges.edited.map((id) => ({ id, patch: (edgeBefore.get(id) ?? {}) as Partial<GraphEdge> })),
        },
      },
      { title: 'discard changes' },
    );
  }

  /**
   * An edited element's content at the mark — its changed fields' saved
   * values, for showing *what* changed. `undefined` when it is not edited.
   */
  before(kind: 'node' | 'edge', id: string): Record<string, unknown> | undefined {
    if (!this.current[kind === 'node' ? 'nodes' : 'edges'].edited.includes(id)) return undefined;
    return this.netFor(kind).get(id);
  }

  /**
   * Put one element back at the mark, as one undoable entry (`'revert <id>'`):
   * a new one goes (a node with the relationships drawn to it), an edited one
   * takes its saved values, a deleted one comes back (a node with the deleted
   * relationships that hung on it).
   */
  revert(kind: 'node' | 'edge', id: string): void {
    const store = this.layer?.store;
    if (!store) return;
    const s = this.current;
    const delta: Delta<GraphNode, GraphEdge> = {};
    if (kind === 'node') {
      if (s.nodes.new.includes(id)) delta.removed = { nodeIds: [id] };
      else if (s.nodes.edited.includes(id)) delta.updated = { nodes: [{ id, patch: (this.before('node', id) ?? {}) as Partial<GraphNode> }] };
      else {
        const node = s.nodes.deleted.find((n) => n.id === id);
        if (!node) return;
        const ends = (e: GraphEdge) => [e.source, e.target];
        const edges = s.edges.deleted.filter((e) => ends(e).includes(id) && ends(e).every((n) => n === id || store.hasNode(n)));
        delta.added = { nodes: [node], edges };
      }
    } else if (s.edges.new.includes(id)) delta.removed = { edgeIds: [id] };
    else if (s.edges.edited.includes(id)) delta.updated = { edges: [{ id, patch: (this.before('edge', id) ?? {}) as Partial<GraphEdge> }] };
    else {
      const edge = s.edges.deleted.find((e) => e.id === id);
      if (!edge || !store.hasNode(edge.source) || !store.hasNode(edge.target)) return;
      delta.added = { edges: [edge] };
    }
    store.applyDelta(delta, { title: `revert ${id}` });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) throw new Error(`UnsavedChangesBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`);
    this.layer = layer;
    this.offAttach = layer.store.onLogAttached((log) => this.bindLog(log));
    // A write is logged before the store applies it (a removal must be captured
    // first), so a log change only marks the fold stale; it is read again once
    // the write has landed.
    this.offFlush = layer.store.events.on('flush', () => this.invalidate());
    this.offCommand =
      ctx.commands?.register(UNSAVED_COUNT_COMMAND, {
        label: 'Unsaved changes',
        category: 'Edit',
        value: () => (this.summary.count > 0 ? String(this.summary.count) : null),
        run: () => {},
      }) ?? null;
    this.bindLog(layer.store.operationLog);
  }

  protected override onEnable(): void {
    this.layer?.setStateConfigs(this.overlays());
    this.recompute();
  }

  protected override onDisable(): void {
    this.applyMarks(EMPTY);
  }

  protected override onDestroy(): void {
    this.applyMarks(EMPTY);
    this.offLog?.();
    this.offAttach?.();
    this.offFlush?.();
    this.offCommand?.();
    this.offLog = this.offAttach = this.offFlush = this.offCommand = null;
    this.layer = null;
  }

  // ─── The fold ───────────────────────────────────────────────────────────

  private bindLog(log: OperationLog | undefined): void {
    this.offLog?.();
    this.log = log;
    // The board as it stands when tracking starts is the mark.
    this.saved = new Map(this.appliedEntries().map((e) => [e.id, e]));
    this.offLog = log ? log.subscribe(() => this.onLogChange()) : null;
    this.recompute();
  }

  private onLogChange(): void {
    // A baseline load clears the log: whatever loaded is the new mark. (`entries()`
    // lists only applied entries, so "empty" alone also means "all undone".)
    const log = this.log;
    if (log && log.entries().length === 0 && !log.canRedo()) this.saved.clear();
    this.invalidate();
  }

  /** Mark the fold stale, and fold again — marks and `change` — once the write has finished. */
  private invalidate(): void {
    this.stale = true;
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (this.stale) this.recompute();
      else if (this.unpublished) this.publish();
    });
  }

  private appliedEntries(): LogEntry[] {
    const log = this.log;
    if (!log) return [];
    return log.entries().filter((e) => log.status(e.id) === 'applied');
  }

  /** This store's ops in `entry`, or none for an actor whose writes are already saved. */
  private opsOf(entry: LogEntry): HistoryOp[] {
    const savedActors = this._options.savedActors ?? ['engine'];
    if (savedActors.includes(entry.actor)) return [];
    const source = this.layer?.store.operationLogSourceId;
    const out: HistoryOp[] = [];
    for (const part of entry.parts) if (part.kind === 'data' && part.sourceId === source) out.push(...(part.ops as HistoryOp[]));
    return out;
  }

  /** The element steps since the mark: undone saved entries backwards, then new entries forwards. */
  private steps(): { node: Step<GraphNode>[]; edge: Step<GraphEdge>[] } {
    const log = this.log;
    const node: Step<GraphNode>[] = [];
    const edge: Step<GraphEdge>[] = [];
    if (!log) return { node, edge };
    const push = (op: HistoryOp, inverse: boolean) => toSteps(op, inverse, node, edge);
    const undone = [...this.saved.values()].filter((e) => log.status(e.id) !== 'applied').reverse();
    for (const entry of undone) {
      const ops = this.opsOf(entry);
      for (let i = ops.length - 1; i >= 0; i--) push(ops[i]!, true);
    }
    for (const entry of this.appliedEntries()) {
      if (this.saved.has(entry.id)) continue;
      for (const op of this.opsOf(entry)) push(op, false);
    }
    return { node, edge };
  }

  /** The `before` of each edited element of `kind` — its content at the mark. */
  private netFor(kind: 'node' | 'edge'): Map<string, Record<string, unknown>> {
    const out = new Map<string, Record<string, unknown>>();
    const steps = this.steps();
    const book = kind === 'node' ? fold(steps.node) : fold(steps.edge);
    for (const [id, net] of book) if (net.status === 'edited') out.set(id, net.before);
    return out;
  }

  /** Fold again and send the result: the marks move and `change` fires. */
  private recompute(): void {
    if (!this.layer) return;
    this.summary = this.fold();
    this.stale = false;
    this.publish();
  }

  private publish(): void {
    this.unpublished = false;
    if (this.isEnabled) this.applyMarks(this.summary);
    this.ctx?.commands?.invalidate();
    this.events.emit('change', this.summary);
  }

  /** Where every element stands against the mark, read off the log and the store. */
  private fold(): UnsavedChangesSummary {
    const store = this.layer?.store;
    if (!store) return EMPTY;
    const { node, edge } = this.steps();
    const summarise = <R extends { id: string }>(book: Map<string, Net<R>>, get: (id: string) => R | undefined) => {
      const out = { new: [] as string[], edited: [] as string[], deleted: [] as R[] };
      for (const [id, net] of book) {
        if (net.status === 'new') {
          if (get(id)) out.new.push(id);
        } else if (net.status === 'deleted') {
          if (!get(id)) out.deleted.push(net.record);
        } else if (differs(net.before, get(id) as unknown as Record<string, unknown> | undefined)) {
          out.edited.push(id);
        }
      }
      return out;
    };
    const nodes = summarise(fold(node), (id) => store.getNode(id));
    const edges = summarise(fold(edge), (id) => store.getEdge(id));
    const count =
      nodes.new.length + nodes.edited.length + nodes.deleted.length + edges.new.length + edges.edited.length + edges.deleted.length;
    return { count, nodes, edges };
  }

  // ─── The marks ──────────────────────────────────────────────────────────

  /** Move the runtime states to `summary`, touching only the ids whose mark changed. */
  private applyMarks(summary: UnsavedChangesSummary): void {
    const store = this.layer?.store;
    if (!store) return;
    const sync = (kind: 'node' | 'edge', next: Map<string, string>) => {
      const prev = this.marked[kind];
      const set = kind === 'node' ? store.setNodeState.bind(store) : store.setEdgeState.bind(store);
      const has = kind === 'node' ? (id: string) => store.hasNode(id) : (id: string) => store.hasEdge(id);
      for (const [id, state] of prev) if (next.get(id) !== state && has(id)) set(id, state, false, { actor: this.id });
      for (const [id, state] of next) if (prev.get(id) !== state) set(id, state, true, { actor: this.id });
      this.marked[kind] = next;
    };
    const marks = (s: { new: string[]; edited: string[] }) =>
      new Map([...s.new.map((id) => [id, UNSAVED_NEW_STATE] as const), ...s.edited.map((id) => [id, UNSAVED_EDITED_STATE] as const)]);
    sync('node', marks(summary.nodes));
    sync('edge', marks(summary.edges));
  }

  /** The two states' overlays: new is a dashed outline in the mark colour over a faded fill; edited keeps its look and gains a dot. */
  private overlays(): { node: Record<string, NodeStyle>; edge: Record<string, EdgeStyle> } {
    const dot = this._options.markColor ?? themeColor('--color-warning') ?? 0xf59e0b;
    const badge = { kind: 'circle' as const, radius: 4 };
    return {
      node: {
        [UNSAVED_NEW_STATE]: { bgAlpha: 0.6, bgStrokeColor: dot, bgStrokeAlpha: 1, bgStrokeDashArray: [4, 3], bgStrokeWidth: 2 },
        [UNSAVED_EDITED_STATE]: {
          badges: [{ id: 'unsaved', placement: 'top-right', shape: badge, fill: dot, strokeWidth: 0 }],
        },
      },
      edge: {
        [UNSAVED_NEW_STATE]: { strokeDashArray: [6, 4] },
        [UNSAVED_EDITED_STATE]: {
          badges: [{ id: 'unsaved', placement: 'middle', shape: badge, fill: dot, strokeWidth: 0 }],
        },
      },
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Split one recorded op into element steps (inverted for an undone entry). */
function toSteps(op: HistoryOp, inverse: boolean, node: Step<GraphNode>[], edge: Step<GraphEdge>[]): void {
  const add = inverse ? 'remove' : 'add';
  const remove = inverse ? 'add' : 'remove';
  switch (op.kind) {
    case 'addNode':
      node.push({ kind: add, record: op.node });
      break;
    case 'addNodes':
      for (const n of inverse ? [...op.nodes].reverse() : op.nodes) node.push({ kind: add, record: n });
      break;
    case 'addEdge':
      edge.push({ kind: add, record: op.edge });
      break;
    case 'addEdges':
      for (const e of inverse ? [...op.edges].reverse() : op.edges) edge.push({ kind: add, record: e });
      break;
    case 'removeNode':
      // Forward: the incident edges go with the node. Inverse: the node comes back first.
      if (inverse) node.push({ kind: remove, record: op.node });
      for (const e of op.edges) edge.push({ kind: remove, record: e });
      if (!inverse) node.push({ kind: remove, record: op.node });
      break;
    case 'removeEdge':
      edge.push({ kind: remove, record: op.edge });
      break;
    case 'updateNode':
      node.push(
        inverse
          ? { kind: 'update', id: op.id, before: op.after as Record<string, unknown>, after: op.before as Record<string, unknown> }
          : { kind: 'update', id: op.id, before: op.before as Record<string, unknown>, after: op.after as Record<string, unknown> },
      );
      break;
    case 'updateEdge':
      edge.push(
        inverse
          ? { kind: 'update', id: op.id, before: op.after as Record<string, unknown>, after: op.before as Record<string, unknown> }
          : { kind: 'update', id: op.id, before: op.before as Record<string, unknown>, after: op.after as Record<string, unknown> },
      );
      break;
    case 'clear':
      for (const e of op.edges) edge.push({ kind: remove, record: e });
      for (const n of op.nodes) node.push({ kind: remove, record: n });
      break;
    // A move, a hide or a show is not content.
    case 'moveNode':
    case 'setHidden':
      break;
  }
}

/** Fold element steps into where each element stands against the mark. */
function fold<R extends { id: string }>(steps: readonly Step<R>[]): Map<string, Net<R>> {
  const book = new Map<string, Net<R>>();
  for (const step of steps) {
    if (step.kind === 'add') {
      const prev = book.get(step.record.id);
      // Deleted then added again: compare the new record with the saved one.
      if (prev?.status === 'deleted') book.set(step.record.id, { status: 'edited', before: content(prev.record) });
      else if (!prev) book.set(step.record.id, { status: 'new' });
    } else if (step.kind === 'remove') {
      const id = step.record.id;
      const prev = book.get(id);
      if (prev?.status === 'new') book.delete(id);
      else book.set(id, { status: 'deleted', record: { ...step.record } });
    } else {
      const before = contentOf(step.before);
      if (Object.keys(before).length === 0) continue;
      const prev = book.get(step.id);
      if (!prev) book.set(step.id, { status: 'edited', before });
      else if (prev.status === 'edited') for (const [k, v] of Object.entries(before)) if (!(k in prev.before)) prev.before[k] = v;
    }
  }
  return book;
}

/** A record's content fields. */
function content(record: { id: string }): Record<string, unknown> {
  return contentOf(record as unknown as Record<string, unknown>);
}

function contentOf(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (!NOT_CONTENT.has(k)) out[k] = v;
  return out;
}

/** Whether any field of `before` differs from `current` — the edit still stands. */
function differs(before: Record<string, unknown>, current: Record<string, unknown> | undefined): boolean {
  if (!current) return false;
  for (const k of Object.keys(before)) if (!same(before[k], current[k])) return true;
  return false;
}

/** Structural equality for the plain JSON values a record holds; `undefined` and `{}` match. */
function same(a: unknown, b: unknown): boolean {
  const blank = (v: unknown) => v === undefined || v === null || (typeof v === 'object' && Object.keys(v as object).length === 0);
  if (blank(a) && blank(b)) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * A theme colour variable as `0xRRGGBB`, resolved by the browser — a token may be
 * `hsl(…)`, `oklch(…)` or a hex, and a computed `color` is always `rgb(…)`.
 */
function themeColor(name: string): number | undefined {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function' || !document.body) return undefined;
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return probe.style.color && rgb ? cssColorToNumber(rgb) : undefined;
}
