// ElementInspectorViewPanel — a **read-only** detail card for *one* element at a
// time, node or edge: what it is called, what it is, what it holds, and (for an
// edge) what it connects. The detail half of a master/detail pair whose master is
// `SelectionViewPanel`: that panel answers "which elements are selected", this one
// answers "what is in this one".
//
// **Read-only, on purpose.** Editing an element already has a surface —
// `toolbars/InspectorPanel` → `PropertiesEditor`, driven by `ClickInspectBehaviour`
// and committing through `useEntityEditor`. This panel is the *looking* path: it
// never writes element data and never writes the selection, so inspecting a value
// can't overwrite it. Its only effect on the canvas is the camera (**Focus**).
//
// **It shows the element you clicked — not the selection.** The target comes from
// `ClickInspectBehaviour`, which exists precisely because selection and inspection
// are different concerns: a selection holds *many* elements (for highlighting and
// multi-drag), while an inspector only ever has room for **one**. Driving this
// panel off `view.interaction.selection` instead would force it to pick an element
// out of a set of forty — an arbitrary choice dressed up as an answer.
//
// That behaviour is **not** in any default bundle (rule 7 — behaviours never
// auto-enable), so a host must register and enable one. With none registered the
// panel says so rather than sitting silently empty.
//
// The behaviour hands back `{ kind, id }`; the element itself is resolved here via
// `GraphStore.getNode` / `getEdge` (one O(1) map lookup, not a scan). It also owns
// the two subtleties a hand-rolled click listener gets wrong: clicking the
// background *clears* the target, and the synthetic click at the end of a node
// **drag** does not set one.

import type {
  ClickInspectBehaviour,
  GraphCanvas,
  GraphEdge,
  GraphLayer,
  GraphNode,
  InspectTarget,
} from '@invana/graph';
import { Badge, Button, Card, PropertyList, PropertyRow, Separator, cn } from '@invana/ui';
import { ArrowRight, Check, Copy, Crosshair, HelpCircle, MousePointerClick } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { displayNameOf, isRecord, labelOfEdge, labelOfNode, nodeSwatchColor } from '../element-display';

export interface ElementInspectorViewPanelProps {
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
  /** Extra classes for the panel root. */
  className?: string;
}

/**
 * The live `ClickInspectBehaviour` target, plus whether such a behaviour is
 * registered at all (the two empty states read very differently: "click
 * something" vs "nothing here can tell me what you clicked").
 *
 * Re-attaches on `scene:behaviour:register`. That matters because this panel is
 * usually mounted **outside** the canvas subtree — handed the engine once it is
 * ready — while the behaviour is registered *inside* it: a one-shot lookup on
 * mount would miss a behaviour registered a tick later and stay dead forever.
 */
function useInspectedTarget(
  canvas: GraphCanvas,
  inspectBehaviourId: string,
): { target: InspectTarget | null; behaviourPresent: boolean } {
  const [state, setState] = useState<{ target: InspectTarget | null; present: boolean }>(() => {
    const b = canvas.behaviours.get<ClickInspectBehaviour>(inspectBehaviourId);
    return { target: b?.getTarget() ?? null, present: b != null };
  });

  useEffect(() => {
    let offTarget: (() => void) | undefined;
    const attach = (): void => {
      const b = canvas.behaviours.get<ClickInspectBehaviour>(inspectBehaviourId);
      if (!b) {
        setState({ target: null, present: false });
        return;
      }
      offTarget?.();
      setState({ target: b.getTarget(), present: true });
      offTarget = b.events.on('inspect:change', (t) => setState({ target: t, present: true }));
    };
    attach();
    const offRegister = canvas.events.on('scene:behaviour:register', (e: { id: string }) => {
      if (e.id === inspectBehaviourId) attach();
    });
    return () => {
      offTarget?.();
      offRegister();
    };
  }, [canvas, inspectBehaviourId]);

  return { target: state.target, behaviourPresent: state.present };
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

/** A titled block in the panel body. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-muted-foreground px-1 text-xs font-medium">{title}</h3>
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
 * {@link ElementInspectorViewPanelContent} with a guaranteed-live canvas, which lets
 * the body subscribe to the behaviour directly, with no null plumbing.
 */
export function ElementInspectorViewPanel({ canvas, className, ...rest }: ElementInspectorViewPanelProps) {
  if (!canvas) {
    return (
      <Card className={cn('flex h-full w-full items-center justify-center', className)}>
        <p className="text-muted-foreground p-4 text-sm">Failed to load — no canvas.</p>
      </Card>
    );
  }
  return <ElementInspectorViewPanelContent canvas={canvas} className={className} {...rest} />;
}

/**
 * The panel body — runs only with a guaranteed-live `canvas`. Follows the clicked
 * element (or `elementId`, when the host drives it), resolves it against the graph
 * layer, and re-resolves whenever the layer's data changes so a renamed or deleted
 * element never shows stale values.
 */
function ElementInspectorViewPanelContent({
  canvas,
  layerId = 'graph',
  inspectBehaviourId = 'click-inspect',
  elementId,
  focusZoom = 2,
  renderExtra,
  className,
}: ElementInspectorViewPanelProps & { canvas: GraphCanvas }) {
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
  const properties = element && isRecord(element.data) ? Object.entries(element.data) : [];

  return (
    <div className={cn('flex h-full flex-col gap-2 overflow-hidden p-2 text-sm', className)}>
      {/* What is being shown, and the one action that touches the canvas. */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground min-w-0 truncate text-xs">
          {controlled ? 'Inspecting' : resolved ? `Clicked ${resolved.kind}` : 'No element'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!resolved}
          onClick={focusInspected}
          title="Frame this element on the canvas"
          className="shrink-0 gap-1.5 [&_svg]:size-3.5"
        >
          <Crosshair className="text-muted-foreground/70" />
          Focus
        </Button>
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!inspectedId ? (
          // Two different nothings: no click yet, versus nothing that can report a
          // click. Collapsing them would leave a host debugging an empty panel that
          // was never wired up.
          <div className="text-muted-foreground flex items-start gap-2 px-1 text-xs">
            <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0">
              {behaviourPresent || controlled ? (
                'Click a node or an edge on the canvas to inspect it.'
              ) : (
                <>
                  No <span className="font-mono">ClickInspectBehaviour</span> is registered, so nothing reports which
                  element was clicked. Register and enable one (id{' '}
                  <span className="font-mono">{inspectBehaviourId}</span>), or pass an explicit{' '}
                  <span className="font-mono">elementId</span>.
                </>
              )}
            </span>
          </div>
        ) : !resolved || !element ? (
          // The id is selected but resolves to no element in this layer: removed
          // while selected, or belonging to a different layer. Say which id.
          <div className="flex flex-col gap-2 px-1">
            <div className="text-muted-foreground flex items-start gap-2 text-xs">
              <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0">
                This element is no longer in the <span className="font-mono">{layerId}</span> layer — it may have been
                removed since it was clicked.
              </span>
            </div>
            <p className="text-muted-foreground/80 break-all font-mono text-xs">{inspectedId}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* ── Identity ── */}
            <Section title="Element">
              <div className="flex items-start gap-2 px-1">
                {resolved.kind === 'node' ? (
                  // Hollow when the node has no representable solid colour.
                  <span
                    className="border-muted-foreground/40 mt-1 block h-3 w-3 shrink-0 rounded-full border"
                    style={
                      layer && nodeSwatchColor(layer.resolveNodeStyle(resolved.node))
                        ? { backgroundColor: nodeSwatchColor(layer.resolveNodeStyle(resolved.node)) }
                        : undefined
                    }
                  />
                ) : (
                  <ArrowRight className="text-muted-foreground/70 mt-1 h-3 w-3 shrink-0" />
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="break-words font-medium">{displayNameOf(element)}</span>
                  <span className="flex flex-wrap items-center gap-1">
                    <Badge variant="soft" tone={resolved.kind === 'node' ? 'info' : 'primary'} size="xs">
                      {resolved.kind}
                    </Badge>
                    <Badge variant="outline" size="xs">
                      {resolved.kind === 'node' ? labelOfNode(resolved.node) : labelOfEdge(resolved.edge)}
                    </Badge>
                  </span>
                </div>
              </div>
              <PropertyList labelWidth={72} className="px-1">
                <ValueRow label="id" value={element.id} mono />
              </PropertyList>
            </Section>

            {/* ── Endpoints (edges only) — each one frames its node. ── */}
            {resolved.kind === 'edge' && (
              <Section title="Endpoints">
                <PropertyList labelWidth={72} className="px-1">
                  {(['source', 'target'] as const).map((end) => {
                    const id = resolved.edge[end];
                    const node = store?.getNode(id);
                    return (
                      <PropertyRow key={end} label={end}>
                        <Button
                          variant="ghost"
                          onClick={() => focusNode(id)}
                          title={`Focus ${end} node ${id}`}
                          className="h-auto min-w-0 justify-start px-1.5 py-0.5 text-left font-normal"
                        >
                          <span className="min-w-0 truncate">
                            {node ? displayNameOf(node) : id}
                            {node ? <span className="text-muted-foreground/60 ml-1 font-mono">{id}</span> : null}
                          </span>
                        </Button>
                      </PropertyRow>
                    );
                  })}
                </PropertyList>
              </Section>
            )}

            {/* Host-supplied block — where it came from, before what it says. */}
            {renderExtra ? <div className="px-1">{renderExtra(element, resolved.kind)}</div> : null}

            {/* ── Properties ── */}
            <Section title={`Properties${properties.length > 0 ? ` (${properties.length})` : ''}`}>
              {properties.length === 0 ? (
                <p className="text-muted-foreground px-1 text-xs italic">No properties</p>
              ) : (
                <PropertyList labelWidth={96} className="px-1">
                  {properties.map(([key, value]) => (
                    <ValueRow key={key} label={key} value={formatValue(value)} />
                  ))}
                </PropertyList>
              )}
            </Section>

            {/* ── State — the engine's own flags, which explain why an element
                 might be selected and yet not visible. ── */}
            <Section title="State">
              <PropertyList labelWidth={96} className="px-1">
                <ValueRow label="type" value={element.type} />
                <ValueRow label="hidden" value={String(element.hidden === true)} />
                {resolved.kind === 'node' && <ValueRow label="pinned" value={String(resolved.node.pinned === true)} />}
                {resolved.kind === 'node' && (
                  <ValueRow
                    label="position"
                    value={
                      resolved.node.position
                        ? `${Math.round(resolved.node.position.x)}, ${Math.round(resolved.node.position.y)}`
                        : null
                    }
                    mono
                  />
                )}
              </PropertyList>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
