// FindInCanvasViewPanel — a structured "find in canvas" surface: build one or more
// field filters (**any** / id / label / any property, `contains` or `equals`),
// AND-combined, and get the matching nodes and edges as a live, previewable result
// list. Each result shows the element's **display name** and the **matched
// field(s)** with the search term **highlighted** — so searching `World` visibly
// lists every element whose id / label / property text contains it, and you can see
// *why* each matched. Clicking a result **focuses** it (frames the camera on it) and
// **selects** it — the app-wide ClickSelectBehaviour selection, same as the
// context-menu "Select" — a non-destructive locate, never a hide/filter.
//
// Like `CanvasFiltersViewPanel` / `LayersViewPanel` it takes a *live* `GraphCanvas`
// and reads its `GraphLayer` store directly, staying within the package's import
// rules — `@invana/graph` is imported for **types only** (label resolution is
// inlined, mirroring `defaultNodeTypeOf`/`defaultEdgeTypeOf`) and all chrome is
// `@invana/ui` / `@invana/forms`. The element snapshot + the property-key options
// recompute off the store's topology/data stream (`node:add` / `node:update` / … —
// coalesced per animation frame), so the field dropdown and the results stay in
// sync as the graph changes; matching itself is pure and runs per render.

import type { ClickSelectBehaviour, GraphCanvas, GraphEdge, GraphLayer, GraphNode, NodeStyle } from '@invana/graph';
import {
  Button,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  RichSelect,
  Separator,
  ToggleGroup,
  ToggleGroupItem,
  cn,
  type RichSelectOption,
} from '@invana/ui';
import { Input } from '@invana/forms';
import { ArrowRight } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

export interface FindInCanvasViewPanelProps {
  /** The live canvas engine (null until `<Canvas>` publishes it). */
  canvas: GraphCanvas | null;
  /** GraphLayer id whose nodes/edges this view searches. Default `'graph'`. */
  layerId?: string;
  /** Minimum zoom a node **result** click zooms in to. Default `2`. */
  focusZoom?: number;
  /**
   * `ClickSelectBehaviour` id a result click also selects the element on — same
   * mechanism as the context-menu "Select". Default `'click-select'`; the click
   * still frames the element (a no-op selection) if no such behaviour is
   * registered.
   */
  selectBehaviourId?: string;
  /** Result rows per page. Default `25`. */
  pageSize?: number;
}

/** Which element kinds the filters run against. */
type Kind = 'all' | 'nodes' | 'edges';

/**
 * A comparison operator for a single filter row. `contains` / `equals` are text
 * (case-insensitive); `between` / `lt` / `lte` / `gt` / `gte` are numeric — the
 * candidate value is parsed as a number and non-numeric values never match.
 */
type Op = 'contains' | 'equals' | 'between' | 'lt' | 'lte' | 'gt' | 'gte';

/** The numeric operators — they compare parsed numbers, not text. */
const NUMERIC_OPS: readonly Op[] = ['between', 'lt', 'lte', 'gt', 'gte'];
const isNumericOp = (op: Op): boolean => NUMERIC_OPS.includes(op);

/** Operator dropdown catalogue — symbol-first labels so the trigger reads clearly when truncated. */
const OP_OPTIONS: { value: Op; label: string; description: string }[] = [
  { value: 'contains', label: 'contains', description: 'text' },
  { value: 'equals', label: 'equals', description: 'text or number' },
  { value: 'between', label: 'between', description: 'number range' },
  { value: 'lt', label: '< less than', description: 'number' },
  { value: 'lte', label: '≤ less or equal', description: 'number' },
  { value: 'gt', label: '> greater than', description: 'number' },
  { value: 'gte', label: '≥ greater or equal', description: 'number' },
];

/** The catch-all field token — matches across id, label, and every property. */
const ANY_FIELD = 'any';
const PROP_PREFIX = 'prop:';

/**
 * The single search filter. `field` is a special token — `'any'`, `'id'`, or
 * `'label'` — or a property field encoded as `'prop:<key>'`.
 */
interface Filter {
  field: string;
  op: Op;
  /** The value, or the **lower** bound for `between`. */
  value: string;
  /** The **upper** bound — used only by `between`. */
  value2?: string;
}

/** The filter is active once it has enough input for its operator. */
const isFilterActive = (f: Filter): boolean =>
  f.op === 'between' ? f.value.trim() !== '' && (f.value2 ?? '').trim() !== '' : f.value.trim() !== '';

/** One field↦value that satisfied a row, kept for the result preview. */
interface MatchHit {
  /** Human field name shown in the preview (`id`, `label`, or the property key). */
  fieldLabel: string;
  /** The matched value, rendered with the search term highlighted. */
  value: string;
}

const asName = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

// Label resolution inlined (canvas-ui imports @invana/graph for types only) — the
// same precedence as graph's `defaultNodeTypeOf` / `defaultEdgeTypeOf`.
const labelOfNode = (n: GraphNode): string => {
  const d = n.data;
  return (
    asName(n.type) ??
    (isRecord(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) ?? asName(d.group) ?? asName(d.category) : undefined) ??
    'node'
  );
};
const labelOfEdge = (e: GraphEdge): string => {
  const d = e.data;
  return asName(e.type) ?? (isRecord(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) : undefined) ?? 'edge';
};

/** The human-readable title for a result row — a `name`/`title`/`label` property, else the id. */
const displayNameOf = (el: GraphNode | GraphEdge): string => {
  const d = el.data;
  return (isRecord(d) ? asName(d.name) ?? asName(d.title) ?? asName(d.label) : undefined) ?? el.id;
};

/** 0xRRGGBB → `#rrggbb`. */
const hexColor = (c: number): string => `#${(c & 0xffffff).toString(16).padStart(6, '0')}`;

/**
 * A representable solid colour (0xRRGGBB) out of a `NodeStyle` fill — a bare
 * number, a `{ kind: 'solid', color }` layer, or the first such layer of a
 * stack. Image / glyph / svg fills have no single colour → `undefined`.
 */
function solidColorOf(fill: unknown): number | undefined {
  if (typeof fill === 'number') return fill;
  const layers = Array.isArray(fill) ? fill : fill != null ? [fill] : [];
  for (const l of layers) if (isRecord(l) && l.kind === 'solid' && typeof l.color === 'number') return l.color;
  return undefined;
}

/**
 * The swatch colour for a node's *resolved* style — the same fill the renderer
 * paints: its body `bgFill`, else a composite card's `shape.fill`, else its
 * background stroke. `undefined` when the node has no representable solid colour
 * (a purely image/glyph body), in which case the row shows a hollow swatch.
 */
function nodeSwatchColor(style: Partial<NodeStyle>): string | undefined {
  const shape = style.shape as { fill?: unknown } | undefined;
  const c =
    solidColorOf(style.bgFill) ??
    (typeof shape?.fill === 'number' ? shape.fill : undefined) ??
    (typeof style.bgStrokeColor === 'number' ? style.bgStrokeColor : undefined);
  return c === undefined ? undefined : hexColor(c);
}

/** Test a candidate string value against the filter's operator + operand(s). */
function testValue(value: string, filter: Filter): boolean {
  const { op } = filter;
  if (op === 'contains') return value.toLowerCase().includes(filter.value.trim().toLowerCase());
  if (op === 'equals') return value.trim().toLowerCase() === filter.value.trim().toLowerCase();
  // Numeric operators — the candidate must parse as a finite number.
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  const a = Number(filter.value);
  if (op === 'between') {
    const b = Number(filter.value2);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    return n >= Math.min(a, b) && n <= Math.max(a, b);
  }
  if (!Number.isFinite(a)) return false;
  switch (op) {
    case 'lt':
      return n < a;
    case 'lte':
      return n <= a;
    case 'gt':
      return n > a;
    case 'gte':
      return n >= a;
    default:
      return false;
  }
}

/**
 * The `(field, value)` candidates an element exposes to matching — id, label, then
 * every non-null property. For a targeted `field` it's the single candidate; for
 * `ANY_FIELD` it's all of them.
 */
function candidates(el: GraphNode | GraphEdge, field: string, isNode: boolean): MatchHit[] {
  const label = isNode ? labelOfNode(el as GraphNode) : labelOfEdge(el as GraphEdge);
  if (field === ANY_FIELD) {
    const out: MatchHit[] = [
      { fieldLabel: 'id', value: el.id },
      { fieldLabel: 'label', value: label },
    ];
    if (isRecord(el.data)) {
      for (const [k, v] of Object.entries(el.data)) if (v != null) out.push({ fieldLabel: k, value: String(v) });
    }
    return out;
  }
  if (field === 'id') return [{ fieldLabel: 'id', value: el.id }];
  if (field === 'label') return [{ fieldLabel: 'label', value: label }];
  const key = field.slice(PROP_PREFIX.length);
  const d = el.data;
  if (isRecord(d) && key in d) {
    const v = d[key];
    return [{ fieldLabel: key, value: v == null ? '' : String(v) }];
  }
  return [];
}

/** Whether an element matches the (active) filter — its first matching candidate, else `null`. */
function filterHit(el: GraphNode | GraphEdge, filter: Filter, isNode: boolean): MatchHit | null {
  if (!isFilterActive(filter)) return null;
  for (const c of candidates(el, filter.field, isNode)) if (testValue(c.value, filter)) return c;
  return null;
}

/** Split `text` into runs, wrapping any occurrence of any needle in a highlight `<mark>`. */
function highlight(text: string, needles: string[]): ReactNode {
  const ns = needles.map((n) => n.trim().toLowerCase()).filter(Boolean);
  if (ns.length === 0) return text;
  const lower = text.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < text.length) {
    let at = -1;
    let len = 0;
    for (const n of ns) {
      const idx = lower.indexOf(n, i);
      if (idx !== -1 && (at === -1 || idx < at)) {
        at = idx;
        len = n.length;
      }
    }
    if (at === -1) {
      out.push(text.slice(i));
      break;
    }
    if (at > i) out.push(text.slice(i, at));
    out.push(
      <mark key={k++} className="bg-primary/20 text-primary rounded-[2px]">
        {text.slice(at, at + len)}
      </mark>,
    );
    i = at + len;
  }
  return out;
}

/** A matched element (node or edge) in the result list. */
interface ResultRow {
  el: GraphNode | GraphEdge;
  isNode: boolean;
}

/**
 * A structured find-in-canvas panel for a `GraphCanvas`: compose field filters
 * (**any** field / **id** / **label** / any **property**, `contains` or `equals`),
 * AND-combined, and preview the matches inline — each result shows the element's
 * display name and the matched field(s) with the search term highlighted. Click a
 * match to **focus + select** it on the canvas (non-destructive — it never hides or
 * filters elements). The kind toggle scopes matching to nodes, edges, or both; the
 * property field options are discovered live from the loaded data. Drop it into a
 * panel / tab and hand it the live `canvas`.
 */
export function FindInCanvasViewPanel({
  canvas,
  layerId = 'graph',
  focusZoom = 2,
  selectBehaviourId = 'click-select',
  pageSize = 25,
}: FindInCanvasViewPanelProps) {
  const layer = canvas?.layers.get<GraphLayer>(layerId) ?? undefined;
  const store = layer?.store;
  const select =
    selectBehaviourId != null ? canvas?.behaviours.get<ClickSelectBehaviour>(selectBehaviourId) : undefined;

  const [kind, setKind] = useState<Kind>('all');
  const emptyFilter = (): Filter => ({ field: ANY_FIELD, op: 'contains', value: '' });
  const [filter, setFilter] = useState<Filter>(emptyFilter);
  const updateFilter = (patch: Partial<Filter>): void => setFilter((prev) => ({ ...prev, ...patch }));

  // A snapshot of the store's elements, refreshed off the topology/data stream
  // (coalesced per frame) — not per render — so the field options and results
  // track live graph changes without re-subscribing.
  const [snapshot, setSnapshot] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  useEffect(() => {
    if (!store) {
      setSnapshot({ nodes: [], edges: [] });
      return;
    }
    let frame = 0;
    const recompute = (): void => setSnapshot({ nodes: [...store.nodes()], edges: [...store.edges()] });
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };
    recompute();
    const unsubs = [
      store.events.on('node:add', schedule),
      store.events.on('node:remove', schedule),
      store.events.on('node:update', schedule),
      store.events.on('edge:add', schedule),
      store.events.on('edge:remove', schedule),
      store.events.on('edge:update', schedule),
    ];
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const off of unsubs) off();
    };
  }, [store]);

  // Distinct property keys observed on the in-scope elements → the field dropdown
  // options (after the fixed `any` / `id` / `label` entries).
  const fieldOptions = useMemo<RichSelectOption[]>(() => {
    const keys = new Set<string>();
    const collect = (els: (GraphNode | GraphEdge)[]): void => {
      for (const el of els) if (isRecord(el.data)) for (const k of Object.keys(el.data)) keys.add(k);
    };
    if (kind !== 'edges') collect(snapshot.nodes);
    if (kind !== 'nodes') collect(snapshot.edges);
    return [
      { value: ANY_FIELD, label: 'any field', description: 'id, label & properties' },
      { value: 'id', label: 'id' },
      { value: 'label', label: 'label' },
      ...[...keys].sort().map((k) => ({ value: PROP_PREFIX + k, label: k, description: 'property' })),
    ];
  }, [snapshot, kind]);

  const active = isFilterActive(filter);
  // Only text operators highlight in the preview — a numeric threshold isn't a
  // substring to mark.
  const needles = useMemo(
    () => (active && (filter.op === 'contains' || filter.op === 'equals') ? [filter.value] : []),
    [active, filter.op, filter.value],
  );

  // The full match set — nodes first, then edges — as one ordered list to paginate.
  const items = useMemo<ResultRow[]>(() => {
    if (!active) return [];
    const out: ResultRow[] = [];
    if (kind !== 'edges')
      for (const n of snapshot.nodes) if (filterHit(n, filter, true)) out.push({ el: n, isNode: true });
    if (kind !== 'nodes')
      for (const e of snapshot.edges) if (filterHit(e, filter, false)) out.push({ el: e, isNode: false });
    return out;
  }, [snapshot, filter, active, kind]);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Reset to the first page whenever the search (filter or scope) changes, so a
  // new query lands on page 1.
  const [page, setPage] = useState(0);
  const searchSig = `${kind}|${filter.field} ${filter.op} ${filter.value} ${filter.value2 ?? ''}`;
  useEffect(() => setPage(0), [searchSig]);

  // Clamp so a shrinking result set (data changed under us) can't strand the
  // view on a now-empty page.
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize],
  );

  const clear = (): void => setFilter(emptyFilter());

  // Result click: frame the camera on the element and select it (the app-wide
  // ClickSelectBehaviour selection — same as the context-menu "Select").
  // `includeHidden` so a hidden match still frames.
  const focusNode = (id: string): void => {
    layer?.focusNode(id, { zoom: focusZoom, includeHidden: true });
    select?.select(id, 'shape');
  };
  const focusEdge = (id: string): void => {
    layer?.focusEdges([id], { includeHidden: true });
    select?.select(id, 'connector');
  };

  // A fixed metadata line under every result — its id and label/type, with any
  // search term highlighted. (Deliberately not the matched field: no url / other
  // properties.)
  const renderMeta = (el: GraphNode | GraphEdge, isNode: boolean): ReactNode => (
    <span className="text-muted-foreground block truncate">
      <span className="opacity-70">id:</span> {highlight(el.id, needles)}
      <span className="opacity-50"> · </span>
      <span className="opacity-70">label:</span>{' '}
      {highlight(isNode ? labelOfNode(el as GraphNode) : labelOfEdge(el as GraphEdge), needles)}
    </span>
  );

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-2 text-sm">
      {/* Element-kind scope. */}
      <ToggleGroup
        type="single"
        value={kind}
        onValueChange={(v) => v && setKind(v as Kind)}
        size="sm"
        variant="outline"
        className="justify-start"
      >
        <ToggleGroupItem value="all" size="sm">
          All
        </ToggleGroupItem>
        <ToggleGroupItem value="nodes" size="sm">
          Nodes
        </ToggleGroupItem>
        <ToggleGroupItem value="edges" size="sm">
          Edges
        </ToggleGroupItem>
      </ToggleGroup>

      {/* The single filter — field + operator on top, the value input(s) below
          (two, for `between`). */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <RichSelect
            options={fieldOptions}
            value={filter.field}
            onChange={(v) => updateFilter({ field: v as string })}
            label="Field"
            align="start"
            triggerClassName="min-w-0 flex-1"
          />
          <RichSelect
            options={OP_OPTIONS}
            value={filter.op}
            onChange={(v) => updateFilter({ op: v as Op })}
            label="Operator"
            align="start"
            triggerClassName="min-w-0 flex-1"
          />
        </div>
        {filter.op === 'between' ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={filter.value}
              onChange={(e) => updateFilter({ value: e.target.value })}
              placeholder="min"
              inputMode="decimal"
              className="h-8 min-w-0 flex-1"
            />
            <span className="text-muted-foreground shrink-0">and</span>
            <Input
              value={filter.value2 ?? ''}
              onChange={(e) => updateFilter({ value2: e.target.value })}
              placeholder="max"
              inputMode="decimal"
              className="h-8 min-w-0 flex-1"
            />
          </div>
        ) : (
          <Input
            value={filter.value}
            onChange={(e) => updateFilter({ value: e.target.value })}
            placeholder={isNumericOp(filter.op) ? 'number' : 'search text…'}
            inputMode={isNumericOp(filter.op) ? 'decimal' : 'text'}
            className="h-8 min-w-0 w-full"
          />
        )}
      </div>

      <Separator />

      {/* Result count + clear. */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">
          {!active ? 'Type to search nodes & edges' : `${total} match${total === 1 ? '' : 'es'}`}
        </span>
        <Button variant="ghost" size="sm" onClick={clear} disabled={!active}>
          Clear
        </Button>
      </div>

      {/* Results — a borderless design-kit Table, one page at a time; each row
          shows the display name + the matched field(s) with the search term
          highlighted; click to focus + select. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {active && total === 0 ? (
          <p className="text-muted-foreground px-1">No matching elements.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {pageItems.map(({ el, isNode }) => {
              // Resolve the node's body colour for just this page's rows — the
              // same style the renderer paints.
              const color = isNode && layer ? nodeSwatchColor(layer.resolveNodeStyle(el as GraphNode)) : undefined;
              const edge = isNode ? undefined : (el as GraphEdge);
              return (
                // Each row is a ghost Button — native hover (accent fill) plus a
                // neutral border revealed on hover (`ring-border` over the ghost's
                // transparent `ring-1`). `h-auto`/`items-start` fit the two-line
                // content; `[&_svg]:size-3` counters the button's default svg size.
                <Button
                  key={`${isNode ? 'n' : 'e'}:${el.id}`}
                  variant="ghost"
                  onClick={() => (isNode ? focusNode(el.id) : focusEdge(el.id))}
                  title={`Focus & select ${isNode ? 'node' : 'edge'} ${el.id}`}
                  className="h-auto w-full items-start justify-start gap-2 rounded-md px-2 py-1.5 text-left font-normal hover:ring-border [&_svg]:size-3"
                >
                  {isNode ? (
                    // Body-colour swatch — hollow when the node has no
                    // representable solid colour.
                    <span
                      className="border-muted-foreground/40 mt-0.5 block h-3 w-3 shrink-0 rounded-full border"
                      style={color ? { backgroundColor: color } : undefined}
                    />
                  ) : (
                    <ArrowRight className="text-muted-foreground/70 mt-0.5 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {highlight(displayNameOf(el), needles)}
                      {edge && (
                        <span className="text-muted-foreground/60 ml-1 font-normal">
                          {edge.source} → {edge.target}
                        </span>
                      )}
                    </span>
                    {renderMeta(el, isNode)}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pager — the design-kit Pagination; Prev / page indicator / Next. */}
      {pageCount > 1 && (
        <Pagination className="mx-0 w-full justify-between">
          <PaginationContent className="w-full justify-between">
            <PaginationItem>
              <PaginationPrevious
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={cn('cursor-pointer', safePage === 0 && 'pointer-events-none opacity-40')}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-muted-foreground px-1">
                Page {safePage + 1} of {pageCount}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className={cn('cursor-pointer', safePage >= pageCount - 1 && 'pointer-events-none opacity-40')}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
