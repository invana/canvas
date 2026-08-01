# RFC — `ColorByBehaviour`

**Status:** 📋 proposed — no code written.
**Package:** `@invana/graph` (behaviour + legend contract) · `@invana/canvas-ui` (editor).
**Supersedes:** `ColorByLabelBehaviour` (rename + extend, back-compat alias).
**Parent:** [`new-behaviours-rfc.md`](./new-behaviours-rfc.md) §4.1 / U5 — decisions
**D2, D6, D7, D9, D10, D11** are locked there and are not re-opened here.
**Reference implementation for the options pattern:** `NodeCentralityBehaviour`.

---

## 1. What this is

One behaviour that colours nodes and edges from a data field, in two modes:

| Mode | Question | Example |
|---|---|---|
| `'category'` | *"which kind is this?"* | node type, community id, status, tier |
| `'range'` | *"how much of this is there?"* | risk score, confidence, latency, amount |

Both write the **same template fields** through the **same field-resolver
mechanism** that `ColorByLabelBehaviour` uses today. That shared write path is why
they are one behaviour and not two (parent RFC §7 D2): two behaviours writing the
same fields on the same layer would need the whole single-writer discipline
between them, to solve a problem created by splitting them.

**Not in scope:** size, alpha and stroke width. Colour only (parent D6) — those
channels belong to `NodeCentralityBehaviour` and `EdgeCentralityBehaviour`.

---

## 2. The options design

> **This section is the RFC.** The options interface is simultaneously the public
> API, the `setOptions` patch shape, the `canvas-ui` editor schema, and what
> persists into `view.definition`. Everything in §3 onward falls out of it.

### 2.1 Constraints the options must satisfy

Four hard constraints, each of which kills a design that would otherwise look fine:

1. **Serialisable by default.** A function can't round-trip through
   `view.definition`, can't be saved with a visualisation, and can't be rendered
   by an editor. This is the *actual* reason today's behaviour can't colour by an
   arbitrary property: `nodeLabel` is a callback (`ColorByLabelBehaviour.ts:75-77`)
   and the editor explicitly drops it (`color-by-label/types.ts:20` — *"accessor
   callbacks … are out of scope"*). So the current editor can toggle node/edge
   colouring and set a fallback colour, and **cannot choose the property**.
2. **Patchable field-by-field.** `setOptions(changes: Partial<TOptions>)`
   (`Behaviour.ts:155`) shallow-merges a flat patch and calls
   `onOptionsChanged(changes)`. Every option must be independently settable, and
   the type must survive `Partial<…>` cleanly.
3. **Renderable as a flat form.** `@invana/forms` `FieldConfig[]` is a flat list
   of scalar leaves registered at `options.<name>`. Nesting and unions cost real
   mapping code.
4. **Back-compatible.** Every existing `new ColorByLabelBehaviour({…})` call site
   must compile and behave identically — which means every new option is optional
   and `mode` defaults to `'category'`.

### 2.2 Naming — borrowed, not invented

`NodeCentralityBehaviour` already solved the serialisable-vs-escape-hatch problem
and shipped the convention:

```ts
/** Numeric field name … to sum instead of counting edges. */
weightKey?: string;
/** Code escape hatch … Supersedes weightKey. Not editor-exposed (function). */
weightBy?: (edge: GraphEdge) => number;
```

So: **`<thing>Key` is the serialisable string; `<thing>By` is the function escape
hatch and takes precedence.** `ColorByBehaviour` uses the same pair for the value
it derives — `nodeValueKey` / `nodeValueBy`, `edgeValueKey` / `edgeValueBy`.
"Value" rather than "label" because it's a category string in one mode and a
number in the other.

⚠️ **One deliberate divergence.** `weightKey` is a *field name inside
`edge.data`*. `ColorByBehaviour`'s default is `node.type`, which is at the item
root, not in `data` — so `*ValueKey` is a **root-relative dot path**
(`'type'`, `'data.riskScore'`, `'data.meta.tier'`). Documented on the option, and
worth a follow-up to align `weightKey` the same way (§10.4).

### 2.3 Per-kind vs shared — the rule

Nodes and edges are coloured from different fields, so their values carry
different units. That gives a clean line:

> **Unit-bearing options are per-kind. Unit-free options are shared.**

| | Options | Why |
|---|---|---|
| **Per-kind** | `nodeValueKey`/`edgeValueKey`, `nodeValueBy`/`edgeValueBy`, `nodeDomain`/`edgeDomain`, `nodeThresholds`/`edgeThresholds` | Expressed in the data's units. A single `domain` shared between node risk `[0,1]` and edge latency `[0,250]` is not a compromise — it's meaningless. |
| **Shared** | `mode`, `scale`, `bins`, `palette`, `valueColors`, `maxCategories`, `colorStops`, `fallbackColor` | Shape and appearance, no units. Sharing them is what makes one instance colour both channels coherently. |

**This is the change designing-options-first bought.** The parent RFC's §4.1.2
sketch had a single `domain: [number, number]`. Writing the interface out against
the two-channel reality showed it can't work.

**When node and edge scales must genuinely diverge, run two instances** — one
with `colorEdges: false`, one with `colorNodes: false`. They write disjoint
template fields, so the identity-guarded restore path (§5.2) keeps them from
touching each other. That composition property is why per-kind options stop at
the unit-bearing ones instead of duplicating the whole surface.

### 2.4 Flat interface, not a discriminated union

`NodeStyle.shape` is a discriminated union, and `graph/CLAUDE.md` endorses that
pattern for compile-time enforcement of variant-required fields. It is **wrong
here**, for two reasons:

- `setOptions` takes `Partial<TOptions>`. `Partial<A | B>` distributes to
  `Partial<A> | Partial<B>`, so a patch has to satisfy one arm whole — exactly
  the property a shallow field-by-field patch must not need.
- The editor emits a flat `Record<string, unknown>`; mapping it onto a union arm
  means reintroducing the discrimination in `mapping.ts` by hand.

So: **one flat interface, mode-conditional validity expressed in TSDoc and
enforced by the editor's `fields` function** (§7), not by the type. Same choice
`NodeCentralityBehaviour` makes with `sizeFn` superseding `minSize`/`maxSize`/`scale`.

### 2.5 The interface

```ts
/** Which colouring job. */
export type ColorByMode = 'category' | 'range';

/**
 * Curve / binning mapping a numeric value to a colour. Continuous curves
 * interpolate along `colorStops`; binning scales quantise into discrete steps.
 * `'linear' | 'sqrt' | 'log'` match `NodeCentralityScale` deliberately.
 */
export type ColorByScale = 'linear' | 'sqrt' | 'log' | 'quantile' | 'threshold';

/** Maps an item to its colour value. `null`/`undefined`/`''` → `fallbackColor`. */
export type ColorValueAccessor<T> = (item: T) => string | number | null | undefined;

/** Constructor options for `ColorByBehaviour`. */
export interface ColorByBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour colours. */
  targetLayerId: string;

  /**
   * Which colouring job. Default `'category'` — one distinct colour per distinct
   * value. `'range'` maps a numeric value through {@link scale} onto
   * {@link colorStops}. Determines which options below are read; see the
   * validity matrix in the class TSDoc.
   */
  mode?: ColorByMode;

  // ─── Value selection (per-kind; serialisable first) ────────────────────

  /**
   * **Root-relative dot path** to the value driving a node's colour — e.g.
   * `'type'`, `'data.riskScore'`, `'data.meta.tier'`. Default `'type'`.
   * A missing path, or a non-numeric value in `'range'` mode, yields
   * {@link fallbackColor}. Superseded by {@link nodeValueBy}.
   *
   * Note this is a path from the node root, **not** a key inside `data` — unlike
   * `NodeCentralityBehaviourOptions.weightKey`, because the default (`type`)
   * lives at the root.
   */
  nodeValueKey?: string;
  /** Edge equivalent of {@link nodeValueKey}. Default `'type'`. */
  edgeValueKey?: string;

  /**
   * **Code escape hatch.** Per-node value accessor; supersedes
   * {@link nodeValueKey} when set. Use for computed keys the store doesn't hold
   * (`` `community-${n.data.group}` ``) or derived magnitudes. Return a `string`
   * in `'category'` mode, a `number` in `'range'` mode.
   * **Not editor-exposed** (function) and not persisted to `view.definition`.
   */
  nodeValueBy?: ColorValueAccessor<GraphNode>;
  /** Edge equivalent of {@link nodeValueBy}. */
  edgeValueBy?: ColorValueAccessor<GraphEdge>;

  // ─── Channels ─────────────────────────────────────────────────────────

  /** Colour nodes — writes `bgFill`. Default `true`. */
  colorNodes?: boolean;
  /** Colour edges — writes `strokeColor` + `arrowTargetColor`. Default `true`. */
  colorEdges?: boolean;
  /**
   * Colour for items whose value is missing, empty, or (in `'range'` mode)
   * non-numeric. Default `0x9ca3af` (grey).
   */
  fallbackColor?: number;

  // ─── mode: 'category' ─────────────────────────────────────────────────

  /**
   * Colours (`0xRRGGBB`) handed out in order of first appearance and remembered,
   * cycled when there are more distinct values than colours.
   * Default {@link DEFAULT_CATEGORY_PALETTE}.
   */
  palette?: readonly number[];

  /**
   * **Pin known values to specific colours.** Anything not listed falls through
   * to {@link palette} in first-appearance order. Without this, `'failed'` gets
   * whatever colour happens to be next — and that changes with data arrival
   * order. Shared across nodes and edges (values are compared as strings).
   */
  valueColors?: Readonly<Record<string, number>>;

  /**
   * **Cardinality cap.** Values beyond the first `maxCategories` distinct ones
   * (in first-appearance order) share {@link fallbackColor} and collapse into a
   * single `other` legend row. Default `24`.
   *
   * A guard against colouring by a high-cardinality field — `nodeValueKey: 'id'`
   * is legal and yields one distinct value *per node*, which cycles the palette
   * into meaninglessness and grows a legend row per item. Capping makes the
   * truncation **visible** (`other (317)`) instead of silently lying, which is
   * what unbounded palette cycling already does today.
   *
   * Values pinned by {@link valueColors} are always honoured and **do not count
   * against the cap** — an explicit choice is never truncated.
   *
   * Set to `Infinity` to disable.
   */
  maxCategories?: number;

  // ─── mode: 'range' ────────────────────────────────────────────────────

  /**
   * How a numeric value becomes a colour. Default `'linear'`.
   *
   * - `'linear'` / `'sqrt'` / `'log'` — **continuous**: normalise into `[0,1]`
   *   against the domain, ease, then interpolate along {@link colorStops}.
   * - `'quantile'` — **binned** into {@link bins} equal-*count* buckets, edges
   *   derived from the observed values.
   * - `'threshold'` — **binned** at explicit edges
   *   ({@link nodeThresholds} / {@link edgeThresholds}).
   *
   * Binned scales reuse the category restore path and render as legend rows;
   * continuous scales render as a gradient (§6).
   */
  scale?: ColorByScale;

  /**
   * Colour ramp (`0xRRGGBB`), interpolated in sRGB. Two or more stops; a single
   * stop is a constant colour. Default {@link DEFAULT_RANGE_STOPS} — a sequential
   * single-hue ramp, chosen because sRGB interpolation between distant hues can
   * pass near grey (parent RFC D7).
   */
  colorStops?: readonly number[];

  /**
   * Explicit `[min, max]` for node values. **Omit to auto-scan** the field across
   * the layer's nodes, rescanned on `data:changed` (§4).
   * ⚠️ With auto-domain, loading a node that widens the range **recolours every
   * other node** — set this explicitly for stable colours across a streaming load.
   */
  nodeDomain?: readonly [number, number];
  /** Edge equivalent of {@link nodeDomain}. */
  edgeDomain?: readonly [number, number];

  /** Bucket count for `scale: 'quantile'`. Default `5`. Ignored by other scales. */
  bins?: number;

  /**
   * Explicit bucket edges for `scale: 'threshold'`, in the node field's units —
   * `[10, 50, 200]` gives four buckets. Sorted ascending on resolve; duplicates
   * dropped. Ignored by other scales.
   */
  nodeThresholds?: readonly number[];
  /** Edge equivalent of {@link nodeThresholds}, in the edge field's units. */
  edgeThresholds?: readonly number[];
}
```

### 2.6 Defaults

Every default lives in `resolveOptions` (§2.7), stated once.

| Option | Default | Note |
|---|---|---|
| `mode` | `'category'` | back-compat: today's behaviour |
| `nodeValueKey` / `edgeValueKey` | `'type'` | matches today's `n.type` / `e.type` accessors |
| `nodeValueBy` / `edgeValueBy` | — | unset |
| `colorNodes` / `colorEdges` | `true` | unchanged |
| `fallbackColor` | `0x9ca3af` | unchanged |
| `palette` | `DEFAULT_CATEGORY_PALETTE` | the current 12-colour palette, renamed |
| `valueColors` | `{}` | |
| `maxCategories` | `24` | `Infinity` disables; pinned values don't count |
| `scale` | `'linear'` | |
| `colorStops` | `DEFAULT_RANGE_STOPS` | sequential single-hue; see §3.5 |
| `nodeDomain` / `edgeDomain` | — | unset → auto-scan |
| `bins` | `5` | |
| `nodeThresholds` / `edgeThresholds` | — | unset |

### 2.7 `ResolvedOptions` + `resolveOptions` — the same shape as `NodeCentralityBehaviour`

Options are resolved **once** into an all-required internal record, so no code
past the constructor writes `?? default`. This is
`NodeCentralityBehaviour.ts:136-176` verbatim in structure:

```ts
/** All-required resolved form — no `??` past this point. */
interface ResolvedOptions {
  mode: ColorByMode;
  nodeValueKey: string;
  edgeValueKey: string;
  nodeValueBy: ColorValueAccessor<GraphNode> | undefined;
  edgeValueBy: ColorValueAccessor<GraphEdge> | undefined;
  colorNodes: boolean;
  colorEdges: boolean;
  fallbackColor: number;
  palette: readonly number[];
  valueColors: Readonly<Record<string, number>>;
  maxCategories: number;
  scale: ColorByScale;
  colorStops: readonly number[];
  nodeDomain: readonly [number, number] | undefined;
  edgeDomain: readonly [number, number] | undefined;
  bins: number;
  nodeThresholds: readonly number[];
  edgeThresholds: readonly number[];
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<ColorByBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? { /* the §2.6 table */ };
  return {
    mode: patch.mode ?? base.mode,
    // …`??` for defaulted scalars…
    // `'x' in patch` for *clearable* optionals — so `setOptions({ nodeDomain:
    // undefined })` reverts to auto-scan rather than being ignored:
    nodeValueBy: 'nodeValueBy' in patch ? patch.nodeValueBy : base.nodeValueBy,
    nodeDomain:  'nodeDomain'  in patch ? patch.nodeDomain  : base.nodeDomain,
    // …
    nodeThresholds: normaliseThresholds(patch.nodeThresholds ?? base.nodeThresholds),
  };
}
```

The `??` vs `'x' in patch` split is load-bearing and easy to get wrong: `??`
means "unset in the patch keeps the previous value" — correct for a scalar with a
default; `'x' in patch` means "explicitly present, even as `undefined`, clears
it" — required for anything whose *absence is meaningful*
(`nodeDomain` absent = auto-scan; `nodeValueBy` absent = use the key).

### 2.8 Validity matrix

Which options each mode actually reads. This table is the specification the
editor's `fields` function implements (§7), and belongs in the class TSDoc.

| Option | `'category'` | `'range'` continuous | `'range'` `quantile` | `'range'` `threshold` |
|---|:--:|:--:|:--:|:--:|
| `*ValueKey` / `*ValueBy` | ✅ as string | ✅ as number | ✅ | ✅ |
| `colorNodes` / `colorEdges` / `fallbackColor` | ✅ | ✅ | ✅ | ✅ |
| `palette` | ✅ | — | — | — |
| `valueColors` | ✅ | — | — | — |
| `maxCategories` | ✅ | — | — | — |
| `colorStops` | — | ✅ | ✅ sampled per bucket | ✅ sampled per bucket |
| `nodeDomain` / `edgeDomain` | — | ✅ | ✅ | — (edges are explicit) |
| `bins` | — | — | ✅ | — |
| `nodeThresholds` / `edgeThresholds` | — | — | — | ✅ |

Options outside their mode are **ignored, not errors** — a patch that changes
`mode` shouldn't have to clear the other mode's fields, and round-tripping
through an editor must not destroy the settings of the mode you're not on.

---

## 3. Semantics

### 3.1 What you can colour by

`*ValueKey` is a **root-relative dot path over the stored record**
(`GraphNode` / `GraphEdge`, `store/types.ts:20,83`), so it reaches every field on
the item — not just `data`.

| Path | Node | Edge | Mode | Notes |
|---|:--:|:--:|---|---|
| `type` | ✅ | ✅ | category | **the default.** Optional on the record (`type?`), so untyped items get `fallbackColor` |
| `data.…` | ✅ | ✅ | either | `D = unknown`, arbitrary depth — `data.status`, `data.risk`, `data.meta.tier`. The main case |
| `id` | ✅ | ✅ | category | legal, but **one distinct value per item** — the case `maxCategories` exists for |
| `parentId` | ✅ | — | category | colour by group / combo membership |
| `source` / `target` | — | ✅ | category | colour edges by endpoint |
| `pinned` / `hidden` | ✅ | `hidden` | category | booleans → `'true'` / `'false'` |
| `states` | ✅ | ✅ | category | an **array** → `String()` joins it (`'hover,selected'`) |
| `position.x` / `position.y` | ✅ | — | range | numeric; derived, and rewritten by every layout |
| `boundingBox.width` / `.height` | ✅ | — | range | numeric; `undefined` until the item has rendered once |
| `style.…`, `state.…` | ✅ | ✅ | either | typed `unknown` on the record. `style.shape.kind` (`'rect'`/`'circle'`/`'arc'`) works |

> ⚠️ **There is no `kind` field on a node or edge.** `GraphElementKind`
> (`store/types.ts:17`) is the package-wide `'node' | 'edge'` discriminator used
> on events — it is never stored per item, and it would be redundant anyway:
> which channel you are configuring *is* node-vs-edge. `Behaviour.kind` is the
> unrelated editor-registry discriminator. If you want the **shape** kind, that's
> `style.shape.kind`.

### 3.2 Value extraction and coercion

```
nodeValueBy present?  → nodeValueBy(node)
otherwise             → readPath(node, nodeValueKey)
```

`readPath` walks a dot path from the item root, returning `undefined` on any
missing segment. A small local helper, not a dependency.

**`'category'` — `String(value)`, uniformly.** `null` / `undefined` / `''` →
`fallbackColor`; everything else stringifies. So booleans give `'true'` / `'false'`,
numbers give `'42'`, and arrays join (`states` → `'hover,selected'`).

> **Accepted cost:** objects all stringify to `'[object Object]'` and therefore
> share one colour — including a mis-typed path that lands on `data` or
> `position`. The uniform rule was chosen over per-type special-casing for its
> simplicity; the diagnostic is that *everything* collapsing to one colour is
> itself a loud symptom, and `getLegend()` will show the single
> `[object Object]` row. Revisit if it bites (§10.6).

**`'range'` — a finite number, no coercion.** `null`, `undefined`, `NaN`,
`Infinity`, booleans, objects, and numeric *strings* all → `fallbackColor`. A
numeric string is deliberately not coerced: silent coercion hides a mis-typed
path, and grey makes it visible.

### 3.3 Category mapping

```
valueColors[value]        → pinned colour   (never capped)
else  count < maxCategories → assignFromPalette(value)
else                        → fallbackColor, counted into `other`
```

`assignFromPalette` keeps today's behaviour exactly: first sight of a value takes
the next palette colour and remembers it, cycling when values outrun colours. The
assignment map resets when options change (as it does today), so a new palette —
or a new `maxCategories` — re-assigns from scratch.

The cap counts **distinct values assigned from the palette**, in first-appearance
order. Values pinned by `valueColors` are always honoured and never counted, so
raising the cap can never demote an explicit choice. Overflow values are tallied
so `getLegend()` can emit a single `other (N)` row (§6) — the truncation is
stated, not silent.

### 3.4 Range mapping

```ts
// continuous
t = normalise(value, domain)          // clamped to [0,1]
eased = scale === 'linear' ? t
      : scale === 'sqrt'   ? Math.sqrt(t)
      : Math.log1p(t * (hi - lo)) / Math.log1p(hi - lo)
color = sampleStops(colorStops, eased)

// binned
i = bucketIndex(value, edges)          // quantile: derived; threshold: explicit
color = sampleStops(colorStops, edges.length ? i / (edges.length) : 0)
```

Kept as **free functions**, per the `mapDegreeToSize` precedent
(`NodeCentralityBehaviour.ts:184-207` — *"pulled out as a free function so
unit-style reasoning is easier and the call site stays branch-light"*).

Degenerate cases resolve without branching at the call site: `hi === lo` → the
first stop; empty `colorStops` → `fallbackColor`; one stop → that stop.

### 3.5 Interpolation

Hand-rolled sRGB channel lerp — roughly twenty lines, **no new dependency**
(parent RFC D7; `@invana/graph` has zero 3rd-party deps by design).

The documented cost is that sRGB interpolation between distant hues can pass near
grey. The mitigation is the **default**: `DEFAULT_RANGE_STOPS` is a *sequential
single-hue* ramp (light→dark blue), which is both the conventionally correct
default for a magnitude scale and immune to the grey-midpoint problem. Diverging
and multi-hue ramps are opt-in via `colorStops`, where the caller is choosing
the endpoints deliberately.

---

## 4. Domain — auto-scan and rescan

Per kind, and only when that kind's `*Domain` is unset:

1. **On enable**, and on any `setOptions` that could change the scanned values.
2. **On `GraphLayer`'s `data:changed`** (`GraphLayer.ts:521,716`), coalesced to
   one recompute — the microtask-debounce + `recomputeScheduled` flag pattern
   `NodeCentralityBehaviour` already uses.

Two implementation notes the current class doesn't need and this one does:

- **The rescan must refresh the domain only, never re-run the install path.**
  Today the behaviour installs resolvers once on enable and never re-applies
  (`ColorByLabelBehaviour.ts:26-32`); the resolvers close over live getters. The
  domain must be one more thing they read, so a rescan is a field write plus a
  layer repaint — not a re-install. Re-installing on every data batch would
  re-snapshot the prior template fields and break restore.
- **A `patching` re-entrancy guard** (again, the `NodeCentralityBehaviour`
  precedent) so writes made in response to `data:changed` can't feed back into
  another rescan.

`getLegend()` (§6) reads the same resolved domain, so the legend can never
disagree with the canvas.

---

## 5. Write path

### 5.1 Template field resolvers — unchanged mechanism

| Channel | Fields written | Via |
|---|---|---|
| nodes | `bgFill` | `layer.setNodeDefaults` |
| edges | `strokeColor`, `arrowTargetColor` | `layer.setEdgeDefaults` |

Because the colour lives on the template as a function of the item, **new nodes
and edges are coloured as they arrive** — no per-item loop, no re-apply wiring.
This is the property that makes the behaviour cheap, and it is preserved exactly.

### 5.2 Restore — keep the identity guard

`syncNode` / `syncEdge` and their **identity** guard
(`current === this.installedNodeBgFill`, `ColorByLabelBehaviour.ts:121-131`)
carry over unchanged. That guard is scar tissue from `dab4ad0`: a `typeof
current === 'function'` test claimed a *consumer's* own `bgFill` resolver as this
behaviour's, so disabling it wrote a pre-config snapshot (usually `undefined`)
over their resolver and rendered every node with no fill — invisible shapes with
visible labels.

**Nothing in this RFC touches that logic**, and any implementation that finds
itself rewriting it should stop and re-read the comment first.

---

## 6. Legend contract

`GraphLegendLayer` renders one row per node/edge **type**, reading the swatch back
off the effective style (`GraphLegendLayer.ts:1-24`). That model has no answer for
a continuous scale — and with `mode: 'range'` on it would keep showing type rows
that **disagree with what's on screen**.

So the behaviour publishes what a legend should draw:

```ts
export type ColorByLegendSection =
  | { kind: 'categories'; field: string; entries: { value: string; color: number }[];
      /** Values beyond `maxCategories`, collapsed. Absent when nothing was capped. */
      other?: { count: number; color: number } }
  | { kind: 'bins';       field: string; bins: { from: number; to: number; color: number }[] }
  | { kind: 'gradient';   field: string; domain: [number, number]; stops: readonly number[] };

class ColorByBehaviour {
  /** What a legend should render, per coloured channel. Derived from the same
   *  resolved options and domain the canvas is painted from. */
  getLegend(): { nodes?: ColorByLegendSection; edges?: ColorByLegendSection };

  /** Retained for `'category'` mode — value → assigned colour. */
  getColorMap(): ReadonlyMap<string, number>;
}
```

Per-channel, because per §2.3 the two channels can carry different fields and
domains. `GraphLegendLayer` gains an explicit **`colorByBehaviourId`** option to
source sections from it — an explicit id per root rule 8, never "the only colour
behaviour".

```text
 categories             bins                     gradient
 Nodes (by data.status) Nodes (by data.risk)     Nodes (by data.latencyMs)
  ●  active        12    ●  0.0–0.2       12      [████▓▓▒▒░░]
  ●  failed         8    ●  0.2–0.5        8       0 ──────── 250
  ●  pending        3    ●  0.5–1.0        3
  ●  other (317)         ← the maxCategories overflow row (§3.3)
```

---

## 7. Editor — `canvas-ui/src/editors/behaviours/color-by/`

Replaces `color-by-label/`, whose three fields (`colorNodes`, `colorEdges`,
`fallbackColor`) become the shared section.

**`fields.ts` exports a function, not an array** — `colorByFields(values)` →
`FieldConfig[]`, resolved from a `useWatch` on `mode` and `scale`. This is the
established pattern (`DensityContourFillLayerEditorPanel.tsx:59-62`, and ~20
other editors), and it is what made merging the two modes into one behaviour the
right call at all (parent RFC §7 preamble).

The function implements §2.8 directly:

```
always            → mode, nodeValueKey, edgeValueKey, colorNodes, colorEdges, fallbackColor
mode 'category'   → + valueColors (map editor), palette (swatch array), maxCategories
mode 'range'      → + scale, colorStops
  scale continuous  → + nodeDomain[min,max], edgeDomain[min,max]   (blank = auto)
  scale 'quantile'  → + bins, nodeDomain, edgeDomain
  scale 'threshold' → + nodeThresholds, edgeThresholds
```

`mapping.ts` carries the encodings `FieldType` can't express directly: colour
`number ⇄ #rrggbb` (existing, via `shared/color`), `[min,max]` tuple ⇄ two number
fields, `readonly number[]` thresholds ⇄ a comma-separated text field, and
`valueColors` ⇄ a repeatable value/swatch pair.

`*ValueBy` accessors stay out of the editor by design — they're functions
(`types.ts` mirror keeps the existing note). The **`nodeDomain` field description
must carry the §2.5 warning** about auto-domain recolouring on data load; it's
the one behaviour here that surprises people.

Registry: `kind: 'color-by'`, with a `'color-by-label'` alias key for one release.

---

## 8. Migration

| | Before | After |
|---|---|---|
| Class | `ColorByLabelBehaviour` | **`ColorByBehaviour`** |
| `kind` | `'color-by-label'` | **`'color-by'`** |
| Editor | `editors/behaviours/color-by-label/` | **`editors/behaviours/color-by/`** |
| Palette const | `DEFAULT_LABEL_PALETTE` | `DEFAULT_CATEGORY_PALETTE` |
| Node accessor | `nodeLabel?: (n) => string` | `nodeValueKey?: string` + `nodeValueBy?` |

- `export { ColorByBehaviour as ColorByLabelBehaviour }` — deprecated alias. Every
  new option is optional and `mode` defaults to `'category'`, so existing call
  sites compile and behave identically.
- `nodeLabel` / `edgeLabel` remain as **deprecated aliases** of `nodeValueBy` /
  `edgeValueBy`, resolved in `resolveOptions` (`nodeValueBy ?? nodeLabel`) so
  there is one code path past the constructor.
- `DEFAULT_LABEL_PALETTE` stays exported as a deprecated alias.
- Instances built through the alias still report `kind: 'color-by'`, hence the
  editor-registry alias key.
- `getColorMap()` is unchanged and still the right call for category legends.

`kind` is the stable key `CanvasSettingsEditorPanel` resolves editors by — which
is exactly why it gets fixed **now**, with one consumer, rather than after
`mode: 'range'` has shipped under a name that says `label`.

---

## 9. Implementation shape

```
packages/graph/src/behaviours/ColorByBehaviour.ts
  ColorByMode · ColorByScale · ColorValueAccessor
  ColorByBehaviourOptions          — §2.5
  DEFAULT_CATEGORY_PALETTE · DEFAULT_RANGE_STOPS
  ResolvedOptions · resolveOptions — §2.7
  readPath · lerpSrgb · sampleStops · normalise · bucketIndex   (free functions, §3)
  class ColorByBehaviour
    kind = 'color-by'
    private opts: ResolvedOptions
    private layer: GraphLayer | null
    private readonly colors = new Map<string, number>()   // category assignment
    private nodeScan / edgeScan: [number, number] | undefined   // auto-domain
    private readonly subs: Array<() => void> = []
    private recomputeScheduled = false
    private patching = false
    // install/restore: syncNode · syncEdge   — carried over verbatim, §5.2
    getLegend() · getColorMap() · colorForValue()
```

Sequenced so each step is independently reviewable:

1. **Options + resolve, no behaviour change.** Land `ColorByBehaviourOptions`,
   `resolveOptions`, the rename and aliases. `mode: 'category'` reproduces
   today's behaviour exactly; the only new capability is `nodeValueKey`.
2. **Category upgrades.** `valueColors`, `maxCategories` + the `other` tally,
   palette rename.
3. **Range mode.** Scales, stops, lerp, bucketing — with explicit
   `nodeDomain`/`edgeDomain` only.
4. **Auto-domain.** The `data:changed` subscription, coalescing, re-entrancy
   guard (§4).
5. **Legend.** `getLegend()`, then `GraphLegendLayer`'s `colorByBehaviourId` +
   bins/gradient sections.
6. **Editor.** `editors/behaviours/color-by/` with the `fields` function; delete
   `color-by-label/`, add the registry alias.

Steps 1–3 are useful on their own; 4–6 are what make it studio-editable.

---

## 10. Open items

1. **`DEFAULT_RANGE_STOPS` values.** A sequential single-hue ramp (§3.5) — the
   specific three stops still to pick.
2. **Theme `ColorRole` stops.** `colorStops` could accept `ColorRole` names
   resolved through the theme palette, the way `template/compile.ts` does, so
   ranges recolour with the theme. **Additive** — literals first, roles later.
3. **`bins` vs `*Thresholds` precedence** when both are set. Recommend
   `scale` decides (each reads only its own), which the §2.8 "ignored, not
   errors" rule already gives — noted here only because it's the obvious question.
4. **Align `weightKey` to a dot path** (§2.2) so `NodeCentralityBehaviour` and
   `ColorByBehaviour` share one path convention. Separate, non-blocking change.
5. **`valueColors` across both channels.** Currently shared and compared as
   strings. If a node type and an edge type ever collide by name and want
   different colours, this needs splitting per-kind — no case study asks for it.
6. **Object values collapse to `'[object Object]'`** under the uniform
   `String(value)` rule (§3.2) — every object-valued field, and every mis-typed
   path landing on `data` / `position`, shares one colour. Accepted for
   simplicity. If it bites, the smallest fix is treating a non-primitive as
   `fallbackColor` (making the mistake grey and obvious) rather than adding
   per-type coercion. Revisit with evidence, not speculatively.
7. **Should `maxCategories` overflow use `fallbackColor`,** or a distinct
   "other" colour? Sharing `fallbackColor` means capped values are
   indistinguishable from missing ones. Both are "not meaningfully coloured", so
   sharing is defensible and keeps the option count down — but the legend `other`
   row exists precisely because the two want telling apart.
