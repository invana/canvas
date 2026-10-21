// ElementViewPanel — one drawn element, node or relationship: read-only, or its editor.
//
// **The view.** What the element is called, what it is, what it holds and, for a
// relationship, what it connects — each end frames its node. It shows the element
// you *clicked* (`ClickInspectBehaviour`), not the selection: a selection holds
// many, and a panel has room for one. That behaviour is not in any default bundle,
// so a host registers one; with none the panel says so rather than sitting empty.
// `elementId` drives it from a host's own list instead. Its only effect on the
// canvas is the camera (**Focus**).
//
// **The editor.** When `editable`, *Edit* — the panel's own button, or
// `editElement` from a context menu or a drawing tool — swaps in the generated form
// (`ElementEditorPanel`). Apply saves through `useEntityEditor` (undoable, one
// history entry) and goes back to the view; Cancel goes back without saving;
// clicking another element leaves the editor. `editable` is the host's: a board
// passes its mode (`editable={mode === 'edit'}`), so the same panel is a viewer in
// Explore and an editor in Edit.
//
// An element just drawn (`editElement(…, { isNew: true })`) opens as *New node* /
// *New relationship*: the type comes first, with the caret, offered from the types
// already on the board, and Apply refuses a blank one — a type cannot be guessed.
// Its Cancel takes the element off the board. Leaving it any other way (another
// click, a mode change) keeps it, untyped, for the Changes panel to flag. A
// relationship's editor shows its ends read-only, with *Reverse direction* beside
// them.
//
// Given a `schema` — the graph's model — the editor's keys follow the type: a
// type's keys become its rows and each key appears once. With `strictSchema` a
// type is picked from the model and a key from that type's; nothing else can
// be typed.

import { isAnnotationElement } from '@invana/graph';
import type { Canvas } from '@invana/canvas';
import type {
  ClickInspectBehaviour,
  GraphCanvas,
  GraphEdge,
  GraphLayer,
  GraphNode,
  InspectTarget,
} from '@invana/graph';
import { useBehaviourInstance, useEntityEditor } from '@invana/canvas-react';
import { Badge, Button, Card, Eyebrow, PropertyList, PropertyRow, cn } from '@invana/ui';
import { ArrowLeft, ArrowRight, Check, Copy, Crosshair, HelpCircle, MousePointerClick, Pencil } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { ElementEditorPanel, type ElementEditorValues, type ElementTypeSchema } from '../../components/ElementEditorPanel';
import { NO_TYPE, displayNameOf, isRecord, labelOfEdge, labelOfNode, nodeSwatchColor } from '../element-display';
import { editElement, elementKey, isEditingNewElement, stopEditingElement, useElementEditing } from './editing';

/** The panel's footer: acts, or acts for the shown element. */
export type ElementFooter = ReactNode | ((element: GraphNode | GraphEdge, kind: 'node' | 'edge') => ReactNode);

export interface ElementViewPanelProps {
  /** The live canvas engine (null until `<Canvas>` publishes it). */
  canvas: Canvas | null;
  /** GraphLayer the element is read from and written to. Default `'graph'`. */
  layerId?: string;
  /** `ClickInspectBehaviour` id the element is read from. Default `'click-inspect'`. */
  inspectBehaviourId?: string;
  /**
   * Allow editing — the *Edit* button and `editElement`. Default `false`: a
   * viewer until the host says otherwise (a board passes `mode === 'edit'`).
   */
  editable?: boolean;
  /**
   * Modeller mode: one `type` field that is also the drawn label, for nodes and
   * relationships alike. Default `false` — a node edits its label and its type.
   */
  typeAsLabel?: boolean;
  /**
   * Edit a node's drawn label (`style.labelText`). Default `true`. A host whose
   * labels come from the element's own properties — so a typed label would not
   * survive a save — passes `false`.
   */
  labelField?: boolean;
  /**
   * The model the editor follows: node types and relationship types, each
   * with its property keys. A type's keys become its rows, *Add property*
   * lists the ones not set, and each key appears once.
   */
  schema?: { nodeTypes: ElementTypeSchema[]; edgeTypes: ElementTypeSchema[] };
  /**
   * Take only what `schema` has: types are picked from the model, keys from
   * the type's — nothing of one's own. A host whose graph has a published
   * model passes it; default `false`.
   */
  strictSchema?: boolean;
  /** The editor's heading for a node. Default `'Node'`. */
  nodeTitle?: string;
  /** The editor's heading for a relationship. Default `'Relationship'`. */
  edgeTitle?: string;
  /** Minimum zoom **Focus** zooms a node in to. Default `2`. */
  focusZoom?: number;
  /**
   * Show this element instead of the clicked one (controlled) — a host's own
   * list (a search result, a table row) with no behaviour at all.
   */
  elementId?: string | null;
  /** App-specific content in the view, between identity and properties. */
  renderExtra?: (element: GraphNode | GraphEdge, kind: 'node' | 'edge') => ReactNode;
  /** A host's controls beside **Focus** in the view's header, before *Edit*. */
  actions?: ReactNode;
  /**
   * Draw Focus · Edit (and `actions`) in the view's own top row. Default `true`.
   * A host that has a panel bar puts them there instead — from
   * {@link useElementPanel} — and passes `false`.
   */
  inlineActions?: boolean;
  /**
   * A host's acts under the view — *Ask about*, *Expand*, *Hide*. A function
   * gets the shown element, so the acts follow it. Not drawn while editing.
   */
  footer?: ElementFooter;
  /**
   * Keys the host keeps out of sight — its own bookkeeping, like provenance.
   * They are neither shown nor edited, and every save keeps them as they were.
   */
  hiddenKeys?: (key: string) => boolean;
  /**
   * Apply, taken by the host: given the element and the values, it decides
   * what happens — the board store, a backend, a script's own state. Without
   * it the values are written to the board store (undoable, and unsaved until
   * the board is saved).
   */
  onApply?: (edit: ElementEdit) => void | Promise<void>;
  /**
   * Cancel, taken by the host. Without it a drawn element that was never
   * applied is taken off the board.
   */
  onCancel?: (target: ElementTarget) => void;
  /**
   * The editor's *Delete*, taken by the host. Without it the element is
   * removed from the board store (a node with its relationships).
   */
  onDelete?: (target: ElementTarget) => void;
  /** Offer *Delete* in the editor for an element already saved. Default `true`. */
  deletable?: boolean;
  /** The element opened in its editor, or `null` when the editor closes. */
  onEditingChange?: (target: ElementTarget | null) => void;
  /** Extra classes for the panel root. */
  className?: string;
}

/** The element an editor is open on. */
export interface ElementTarget {
  kind: 'node' | 'edge';
  id: string;
  /** Drawn on the board and not applied yet. */
  isNew: boolean;
}

/** What Apply hands a host's `onApply`. */
export interface ElementEdit extends ElementTarget {
  values: ElementEditorValues;
}

/**
 * The **Element** panel: the clicked node or relationship, read-only, and — when
 * `editable` — an *Edit* that turns it into its {@link ElementEditorPanel}. Needs
 * a `ClickInspectBehaviour` (it reads the click from it) and, for undoable saves,
 * a graph history.
 *
 * ```tsx
 * { id: 'element', title: 'Element', render: (c) => <ElementViewPanel canvas={c} editable={mode === 'edit'} /> }
 * // from a context menu, or a drawing tool's onNodeCreate:
 * editElement(canvas, { kind: 'node', id }, { isNew: true });
 * ```
 */
export function ElementViewPanel({
  canvas,
  layerId = 'graph',
  inspectBehaviourId = 'click-inspect',
  editable = false,
  typeAsLabel = false,
  labelField = true,
  schema,
  strictSchema = false,
  nodeTitle = 'Node',
  edgeTitle = 'Relationship',
  focusZoom,
  elementId,
  renderExtra,
  actions,
  inlineActions = true,
  footer,
  hiddenKeys,
  onApply,
  onCancel,
  onDelete,
  deletable = true,
  onEditingChange,
  className,
}: ElementViewPanelProps) {
  const target = useEntityEditor({ layerId, inspectId: inspectBehaviourId, typeAsLabel }, canvas);
  const editingKey = useElementEditing(canvas);
  const key = target ? elementKey(target) : null;
  const editing = editable && key !== null && editingKey === key;

  // Clicking another element (or the board) leaves the editor; so does losing edit
  // rights. Only a move *away* from the edited element counts: the target arrives
  // a render after the panel mounts, and that first blank is not a click.
  const lastKey = useRef<string | null>(null);
  // Reversing writes the store at once; the ends shown follow it.
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const was = lastKey.current;
    lastKey.current = key;
    if (!canvas || editingKey === null) return;
    if (!editable || (was === editingKey && key !== editingKey)) stopEditingElement(canvas);
  }, [canvas, editable, editingKey, key]);

  // Tell the host when the editor opens on an element, and when it closes.
  const editingNow = editable && key !== null && editingKey === key;
  const told = useRef(onEditingChange);
  told.current = onEditingChange;
  useEffect(() => {
    if (!told.current || !canvas) return;
    told.current(editingNow && target ? { kind: target.kind, id: target.id, isNew: isEditingNewElement(canvas) } : null);
    // Only a change in what is edited is news.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingNow, key]);

  if (editing && target && canvas) {
    const isEdge = target.kind === 'edge';
    const isNew = isEditingNewElement(canvas);
    const showLabel = !isEdge && !typeAsLabel && labelField;
    const layer = canvas.layers.get<GraphLayer>(layerId);
    const element: ElementTarget = { kind: target.kind, id: target.id, isNew };
    const remove = (): void => {
      const store = layer?.store;
      if (store) store.batch(() => (isEdge ? store.removeEdge(target.id) : store.removeNode(target.id)), { title: isEdge ? 'delete edge' : 'delete node' });
    };
    const discard = (): void => {
      const store = layer?.store;
      if (store) store.batch(() => (isEdge ? store.removeEdge(target.id) : store.removeNode(target.id)), { title: isEdge ? 'discard new edge' : 'discard new node' });
    };
    return (
      <ElementEditorPanel
        key={key}
        title={isNew ? `New ${(isEdge ? edgeTitle : nodeTitle).toLowerCase()}` : isEdge ? edgeTitle : nodeTitle}
        defaults={{
          // A new element's drawn label is its placeholder type; it starts blank.
          label: isNew ? '' : target.label,
          type: isNew && target.type === NO_TYPE ? '' : target.type,
          data: shownData(target.data, hiddenKeys),
        }}
        showLabel={showLabel}
        showType
        {...(schema ? { schema: isEdge ? schema.edgeTypes : schema.nodeTypes, strictSchema } : {})}
        {...(isNew
          ? {
              requireType: `A new ${(isEdge ? edgeTitle : nodeTitle).toLowerCase()} needs a type`,
              typeSuggestions: layer ? typesOn(layer, target.kind) : [],
            }
          : {})}
        {...(isEdge && layer ? { endpoints: endpointsOf(layer, target.id) } : {})}
        {...(isEdge && target.reverse
          ? {
              onReverse: () => {
                target.reverse?.();
                redraw();
              },
            }
          : {})}
        onCancel={() => {
          if (onCancel) onCancel(element);
          else if (isNew) discard();
          stopEditingElement(canvas);
        }}
        {...(deletable && !isNew
          ? {
              onDelete: () => {
                if (onDelete) onDelete(element);
                else remove();
                stopEditingElement(canvas);
              },
            }
          : {})}
        onSubmit={(values) => {
          const full: ElementEditorValues = {
            ...values,
            // A label not shown is not edited: commit the one drawn now.
            label: showLabel ? values.label : target.label,
            data: { ...keptData(layer, target, hiddenKeys), ...values.data },
          };
          if (onApply) {
            void Promise.resolve(onApply({ ...element, values: full })).then(() => stopEditingElement(canvas));
            return;
          }
          target.commit(full);
          stopEditingElement(canvas);
        }}
        {...(className !== undefined ? { className } : {})}
      />
    );
  }

  return (
    <ElementDetail
      canvas={canvas as GraphCanvas | null}
      layerId={layerId}
      inspectBehaviourId={inspectBehaviourId}
      {...(focusZoom !== undefined ? { focusZoom } : {})}
      {...(elementId !== undefined ? { elementId } : {})}
      {...(renderExtra ? { renderExtra } : {})}
      {...(className !== undefined ? { className } : {})}
      {...(hiddenKeys ? { hiddenKeys } : {})}
      inlineActions={inlineActions}
      footer={footer}
      actions={
        <>
          {actions}
          {editable && target && canvas ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editElement(canvas, target, { inspectBehaviourId })}
              className="gap-1.5 [&_svg]:size-3.5"
            >
              <Pencil className="text-muted-foreground/70" />
              Edit
            </Button>
          ) : null}
        </>
      }
    />
  );
}

/** The element's data without the keys the host hides — what the view and the editor show. */
function shownData(data: Record<string, string>, hidden?: (key: string) => boolean): Record<string, string> {
  if (!hidden) return data;
  return Object.fromEntries(Object.entries(data).filter(([k]) => !hidden(k)));
}

/** The hidden keys' values as the store holds them, carried through a save untouched. */
function keptData(
  layer: GraphLayer | undefined,
  target: { kind: 'node' | 'edge'; id: string },
  hidden?: (key: string) => boolean,
): Record<string, string> {
  if (!hidden || !layer) return {};
  const el = target.kind === 'node' ? layer.store.getNode(target.id) : layer.store.getEdge(target.id);
  const data = el && isRecord(el.data) ? el.data : {};
  // The editor's value type is a string map; a kept value is passed through as it is.
  return Object.fromEntries(Object.entries(data).filter(([k]) => hidden(k))) as Record<string, string>;
}

/** The types already on the layer for nodes or for relationships, in first-seen order; `unknown` is no type. */
function typesOn(layer: GraphLayer, kind: 'node' | 'edge'): string[] {
  const seen = new Set<string>();
  for (const el of kind === 'node' ? layer.store.nodes() : layer.store.edges()) {
    if (isAnnotationElement(el)) continue;
    const t = typeof el.type === 'string' ? el.type.trim() : '';
    if (t && t !== NO_TYPE) seen.add(t);
  }
  return [...seen];
}

/** A relationship's two ends as the editor shows them: the node's name, then its type. */
function endpointsOf(layer: GraphLayer, edgeId: string): { from: ReactNode; to: ReactNode } | undefined {
  const edge = layer.store.getEdge(edgeId);
  if (!edge) return undefined;
  const end = (id: string): ReactNode => {
    const node = layer.store.getNode(id);
    if (!node) return id;
    const type = typeof node.type === 'string' && node.type !== NO_TYPE ? labelOfNode(node) : '';
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate">{displayNameOf(node)}</span>
        {type && <span className="text-muted-foreground shrink-0 font-mono text-xs">{type}</span>}
      </span>
    );
  };
  return { from: end(edge.source), to: end(edge.target) };
}

// ── The read-only view ─────────────────────────────────────────────────────

/** The read-only view's props — {@link ElementViewPanel} fills them. */
interface ElementDetailProps {
  /** The live canvas engine (null until `<Canvas>` publishes it). */
  canvas: GraphCanvas | null;
  /** GraphLayer id the inspected id is resolved against. Default `'graph'`. */
  layerId?: string;
  /**
   * `ClickInspectBehaviour` id the inspected element is read from. Default
   * `'click-inspect'`. That behaviour is **not** registered by default (rule 7):
   * with none present the panel renders an explanatory empty state instead of
   * pretending nothing has been clicked.
   */
  inspectBehaviourId?: string;
  /**
   * Inspect this element instead of the clicked one (controlled mode) — lets a
   * host drive the panel from its own list (a search result, a table row) with no
   * behaviour at all. `undefined` leaves the panel following the click.
   */
  elementId?: string | null;
  /** Minimum zoom the **Focus** action zooms a node in to. Default `2`. */
  focusZoom?: number;
  /**
   * Extra content for the inspected element, rendered between its identity and
   * its properties — where an app-specific block belongs (provenance, a dataset
   * link, permissions). The escape hatch that keeps domain concerns *out* of the
   * kit: canvas-ui never learns what a dataset is, the host renders it.
   */
  renderExtra?: (element: GraphNode | GraphEdge, kind: 'node' | 'edge') => ReactNode;
  /** Controls beside **Focus** in the header — a host's *Edit*. */
  actions?: ReactNode;
  /** Draw Focus and `actions` in the view's top row. */
  inlineActions?: boolean;
  /** A host's acts under the view. */
  footer?: ElementFooter;
  /** Keys kept out of the view. */
  hiddenKeys?: (key: string) => boolean;
  /** Extra classes for the panel root. */
  className?: string;
}

/**
 * The live `ClickInspectBehaviour` target, plus whether such a behaviour is
 * registered at all (the two empty states read very differently: "click
 * something" vs "nothing here can tell me what you clicked").
 *
 * Follows the behaviour through `useBehaviourInstance`. That matters because this
 * panel is usually mounted **outside** the canvas subtree — handed the engine once
 * it is ready — while the behaviour is registered *inside* it: a one-shot lookup
 * on mount would miss a behaviour registered a tick later, and a remount of the
 * behaviour's wrapper would leave the panel listening to a destroyed instance.
 */
function useInspectedTarget(
  canvas: GraphCanvas,
  inspectBehaviourId: string,
): { target: InspectTarget | null; behaviourPresent: boolean } {
  const behaviour = useBehaviourInstance<ClickInspectBehaviour>(inspectBehaviourId, canvas);
  const [target, setTarget] = useState<InspectTarget | null>(() => behaviour?.getTarget() ?? null);

  useEffect(() => {
    setTarget(behaviour?.getTarget() ?? null);
    if (!behaviour) return;
    return behaviour.events.on('inspect:change', setTarget);
  }, [behaviour]);

  return { target, behaviourPresent: behaviour !== null };
}

/** Longest property value rendered inline; the rest lives in the `title` tooltip. */
const MAX_VALUE_CHARS = 400;

/**
 * A property value as display text. `GraphNode.data` is `unknown` user payload, so
 * an object must be stringified rather than coerced — `String({})` is
 * `[object Object]`, which tells the reader nothing about their own data.
 * Returns `null` for absent values, which render as a muted dash.
 */
function formatValue(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    // Cyclic or otherwise unserialisable — say so rather than throwing inside render.
    return String(v);
  }
}

/** Copies `text` to the clipboard, flashing a tick. Renders nothing where the API is unavailable (non-secure origins). */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(t);
  }, [copied]);
  if (typeof navigator === 'undefined' || !navigator.clipboard) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      title={label}
      onClick={() => void navigator.clipboard.writeText(text).then(() => setCopied(true))}
      className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
    >
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="text-muted-foreground/70 h-3 w-3" />}
    </Button>
  );
}

/** A titled block in the panel body, its count beside the title. */
function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-0.5 pt-2">
      <Eyebrow className="px-3">
        {title}
        {count !== undefined && count > 0 ? ` ${count}` : ''}
      </Eyebrow>
      {children}
    </section>
  );
}

/** One `label: value` row with a hover-revealed copy button. */
function ValueRow({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <PropertyRow label={label} mono={mono} className="group">
      <span className="flex min-w-0 items-start gap-1">
        {value === null ? (
          <span className="text-muted-foreground/60">—</span>
        ) : (
          <span className="min-w-0 break-all" title={value.length > MAX_VALUE_CHARS ? value : undefined}>
            {value.length > MAX_VALUE_CHARS ? `${value.slice(0, MAX_VALUE_CHARS)}…` : value}
          </span>
        )}
        {value === null ? null : <CopyButton text={value} label={`Copy ${label}`} />}
      </span>
    </PropertyRow>
  );
}

/**
 * Read-only inspector for the element the user **clicked** on a `GraphCanvas` —
 * identity, endpoints (edges), `data` properties, and element state, with a
 * **Focus** action that frames it. Needs a `ClickInspectBehaviour` (register and
 * enable one; it is not in any default bundle), or an explicit `elementId`. Drop it
 * into a panel / tab and hand it the live `canvas`; pair it with
 * `SelectionViewPanel`, which answers the *other* question — what is selected.
 *
 * A thin **validation guard**: the real work runs in
 * {@link ElementDetailContent} with a guaranteed-live canvas, which lets
 * the body subscribe to the behaviour directly, with no null plumbing.
 */
function ElementDetail({ canvas, className, ...rest }: ElementDetailProps) {
  if (!canvas) {
    return (
      <Card className={cn('flex h-full w-full items-center justify-center', className)}>
        <p className="text-muted-foreground p-4 text-base">Failed to load — no canvas.</p>
      </Card>
    );
  }
  return <ElementDetailContent canvas={canvas} className={className} {...rest} />;
}

/**
 * The panel body — runs only with a guaranteed-live `canvas`. Follows the clicked
 * element (or `elementId`, when the host drives it), resolves it against the graph
 * layer, and re-resolves whenever the layer's data changes so a renamed or deleted
 * element never shows stale values.
 */
function ElementDetailContent({
  canvas,
  layerId = 'graph',
  inspectBehaviourId = 'click-inspect',
  elementId,
  focusZoom = 2,
  renderExtra,
  actions,
  inlineActions = true,
  footer,
  hiddenKeys,
  className,
}: ElementDetailProps & { canvas: GraphCanvas }) {
  const layer = canvas.layers.get<GraphLayer>(layerId) ?? undefined;
  const store = layer?.store;

  // The clicked element. `elementId` overrides it entirely (controlled mode), so a
  // host can drive the panel with no behaviour registered at all.
  const { target, behaviourPresent } = useInspectedTarget(canvas, inspectBehaviourId);
  const controlled = elementId !== undefined;
  const inspectedId = controlled ? (elementId ?? null) : (target?.id ?? null);

  // A revision counter bumped (coalesced per frame) whenever the layer's data
  // changes — `GraphStore` is mutable, so a rename changes no dependency and a
  // plain memo would never re-run. Only `update` / `remove` matter here.
  const [dataRev, setDataRev] = useState(0);
  useEffect(() => {
    if (!store) return;
    let frame = 0;
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setDataRev((r) => r + 1);
      });
    };
    const unsubs = [
      store.events.on('node:update', schedule),
      store.events.on('node:remove', schedule),
      store.events.on('edge:update', schedule),
      store.events.on('edge:remove', schedule),
    ];
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const off of unsubs) off();
    };
  }, [store]);

  // Resolve the id to a node, an edge, or nothing. An id that resolves to nothing
  // is reported as such rather than rendered blank — a node can be removed while
  // it is still the click target, and a blank card would read as "this element has
  // no data".
  const resolved = useMemo(() => {
    if (!inspectedId || !store) return null;
    const node = store.getNode(inspectedId);
    if (node) return { kind: 'node' as const, node };
    const edge = store.getEdge(inspectedId);
    if (edge) return { kind: 'edge' as const, edge };
    return null;
    // `dataRev` is a deliberate dependency — the store is mutable (see above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectedId, store, dataRev]);

  const footerNode = !resolved
    ? null
    : typeof footer === 'function'
      ? footer(resolved.kind === 'node' ? resolved.node : resolved.edge, resolved.kind)
      : footer;

  const focusNode = useCallback(
    (id: string): void => layer?.focusNode(id, { zoom: focusZoom, includeHidden: true }),
    [layer, focusZoom],
  );
  const focusInspected = useCallback((): void => {
    if (!resolved) return;
    if (resolved.kind === 'node') focusNode(resolved.node.id);
    else layer?.focusEdges([resolved.edge.id], { includeHidden: true });
  }, [resolved, layer, focusNode]);

  const element = resolved ? (resolved.kind === 'node' ? resolved.node : resolved.edge) : null;
  const properties = element && isRecord(element.data) ? Object.entries(element.data).filter(([k]) => !hiddenKeys?.(k)) : [];
  const relationships = resolved?.kind === 'node' && store ? relationshipsOf(store, resolved.node.id) : [];

  return (
    <div className={cn('flex h-full flex-col overflow-hidden text-base', className)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!inspectedId ? (
          // Two different nothings: no click yet, versus nothing that can report a
          // click. Collapsing them would leave a host debugging an empty panel that
          // was never wired up.
          <div className="text-muted-foreground flex flex-col items-center gap-1.5 px-4 py-8 text-center text-sm">
            <MousePointerClick className="h-5 w-5" />
            {behaviourPresent || controlled ? (
              <>
                <span className="text-foreground font-semibold">Nothing picked</span>
                <span>Click a node or a relationship to see it here.</span>
              </>
            ) : (
              <span className="min-w-0">
                No <span className="font-mono">ClickInspectBehaviour</span> is registered, so nothing reports which
                element was clicked. Register and enable one (id{' '}
                <span className="font-mono">{inspectBehaviourId}</span>), or pass an explicit{' '}
                <span className="font-mono">elementId</span>.
              </span>
            )}
          </div>
        ) : !resolved || !element ? (
          // The id is selected but resolves to no element in this layer: removed
          // while selected, or belonging to a different layer. Say which id.
          <div className="flex flex-col gap-2 p-3">
            <div className="text-muted-foreground flex items-start gap-2 text-sm">
              <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0">
                This element is no longer in the <span className="font-mono">{layerId}</span> layer — it may have been
                removed since it was clicked.
              </span>
            </div>
            <p className="text-muted-foreground/80 break-all font-mono text-sm">{inspectedId}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 pb-2">
            {/* ── Identity: what it is called, what it is, its id ── */}
            <div className="group flex flex-col gap-1 px-3 pt-3 pb-2">
              <div className="flex min-w-0 items-center gap-2">
                {resolved.kind === 'node' ? (
                  // Hollow when the node has no representable solid colour.
                  <span
                    className="border-muted-foreground/40 block size-2.5 shrink-0 rounded-full border"
                    style={
                      layer && nodeSwatchColor(layer.resolveNodeStyle(resolved.node))
                        ? { backgroundColor: nodeSwatchColor(layer.resolveNodeStyle(resolved.node)) }
                        : undefined
                    }
                  />
                ) : (
                  <ArrowRight className="text-muted-foreground/70 size-3 shrink-0" />
                )}
                <span className="min-w-0 truncate font-semibold">{elementTitle(resolved, store)}</span>
                <Badge variant="outline" size="xs" className="shrink-0 font-mono">
                  {resolved.kind === 'node' ? labelOfNode(resolved.node) : labelOfEdge(resolved.edge)}
                </Badge>
                {inlineActions && (
                  <span className="ml-auto flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={focusInspected}
                      aria-label="Focus"
                      title="Frame this element on the canvas"
                    >
                      <Crosshair />
                    </Button>
                    {actions}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground flex items-center gap-1 font-mono text-xs">
                <span className="min-w-0 truncate">id {element.id}</span>
                <CopyButton text={element.id} label="Copy id" />
              </span>
            </div>

            {/* Host-supplied block — where it came from, before what it says. */}
            {renderExtra ? <div className="px-3">{renderExtra(element, resolved.kind)}</div> : null}

            {/* ── Ends (relationships only) — each one frames its node. ── */}
            {resolved.kind === 'edge' && (
              <Section title="Ends">
                <PropertyList labelWidth={56} className="px-3">
                  {([['From', 'source'], ['To', 'target']] as const).map(([label, end]) => {
                    const id = resolved.edge[end];
                    const node = store?.getNode(id);
                    return (
                      <PropertyRow key={end} label={label}>
                        <Button
                          variant="ghost"
                          onClick={() => focusNode(id)}
                          title={`Show ${node ? displayNameOf(node) : id} on the board`}
                          className="h-auto min-w-0 justify-start gap-1.5 px-1.5 py-0.5 text-left font-normal"
                        >
                          <span className="min-w-0 truncate">{node ? displayNameOf(node) : id}</span>
                          {node && <span className="text-muted-foreground font-mono text-xs">{labelOfNode(node)}</span>}
                        </Button>
                      </PropertyRow>
                    );
                  })}
                </PropertyList>
              </Section>
            )}

            {/* ── Properties ── */}
            <Section title="Properties" count={properties.length}>
              {properties.length === 0 ? (
                <p className="text-muted-foreground px-3 text-sm">No properties</p>
              ) : (
                <PropertyList labelWidth={96} className="px-3">
                  {properties.map(([key, value]) => (
                    <ValueRow key={key} label={key} value={formatValue(value)} />
                  ))}
                </PropertyList>
              )}
            </Section>

            {/* ── Relationships (nodes only) — what is drawn on the board, by direction and type. ── */}
            {resolved.kind === 'node' && relationships.length > 0 && (
              <Section title="Relationships" count={relationships.reduce((n, r) => n + r.names.length, 0)}>
                <div className="flex flex-col px-3">
                  {relationships.map((r) => (
                    <div key={r.dir + r.type} className="flex min-h-7 items-center gap-2 text-sm">
                      {r.dir === 'out' ? (
                        <ArrowRight className="text-muted-foreground size-3 shrink-0" aria-label="out" />
                      ) : (
                        <ArrowLeft className="text-muted-foreground size-3 shrink-0" aria-label="in" />
                      )}
                      <span className="w-24 shrink-0 truncate font-mono text-xs">{r.type}</span>
                      <span className="w-5 shrink-0 font-semibold">{r.names.length}</span>
                      <span className="text-muted-foreground min-w-0 truncate">
                        {r.names.slice(0, 3).join(', ')}
                        {r.names.length > 3 ? ` +${r.names.length - 3}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
      {footerNode ? <div className="border-border flex shrink-0 flex-wrap items-center gap-1.5 border-t p-2">{footerNode}</div> : null}
    </div>
  );
}

/** A relationship is named by its ends — `LHR → JFK`; a node by its display name. */
function elementTitle(
  resolved: { kind: 'node'; node: GraphNode } | { kind: 'edge'; edge: GraphEdge },
  store: GraphLayer['store'] | undefined,
): string {
  if (resolved.kind === 'node') return displayNameOf(resolved.node);
  const name = (id: string) => {
    const n = store?.getNode(id);
    return n ? displayNameOf(n) : id;
  };
  return `${name(resolved.edge.source)} → ${name(resolved.edge.target)}`;
}

/** A node's drawn relationships, grouped by direction and type, out first. */
function relationshipsOf(
  store: GraphLayer['store'],
  id: string,
): Array<{ dir: 'out' | 'in'; type: string; names: string[] }> {
  const groups = new Map<string, { dir: 'out' | 'in'; type: string; names: string[] }>();
  for (const e of store.edges()) {
    if (isAnnotationElement(e)) continue;
    const dir = e.source === id ? 'out' : e.target === id ? 'in' : null;
    if (!dir) continue;
    const other = store.getNode(dir === 'out' ? e.target : e.source);
    const type = labelOfEdge(e);
    const k = dir + ':' + type;
    if (!groups.has(k)) groups.set(k, { dir, type, names: [] });
    groups.get(k)!.names.push(other ? displayNameOf(other) : dir === 'out' ? e.target : e.source);
  }
  return [...groups.values()].sort((a, b) => (a.dir === b.dir ? a.type.localeCompare(b.type) : a.dir === 'out' ? -1 : 1));
}
