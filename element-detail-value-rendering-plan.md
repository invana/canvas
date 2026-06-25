# Element Detail Views + Extensible Property Rendering Plan

> **File location:** repo root, sibling to the other `*-plan.md` design notes.
> **Status:** **Implemented.** Defaults taken for all §7 points; story panels
> migrated (no extra seed data). The detail views are **always bare content**
> (no surface/placement/close). A **`<PanelContent>`** provides the surface +
> header bar (with the close ✕) + scrollable body; a **`<Panel position="right">`**
> positions it as a full-height side dock. `ClickViewBehaviour` is thin:
> it renders `panel(ctx)` verbatim
> (consumer wraps in a `<Panel>`), **and** exposes an `onView(ctx | null)`
> callback so the detail viewer can be rendered **outside the canvas / outside
> `GraphCanvasApp`** (stash ctx in your own state, render the pure view there).
> Card / endpoint titles are tinted with the element's resolved styling colour.
> Builds + all packages typecheck clean.

Introduce **`NodeDetailView`** and **`EdgeDetailView`** (engine-aware panels) that
share **`PropertyDetailView`** — a dumb component that renders an element's
`data` as a property list where **each property is rendered by kind** (number,
long text with more/less, image, link/file URL, tags, list, JSON/dict, …)
through an **extensible renderer registry**. Adding a new data-type rendering
ability = adding one `PropertyRenderer` object.

These **replace** today's `ElementDetailViewer` + `PropertiesViewer`.

---

## 1. Context — what exists today

The click-to-inspect panel (the right dock in `FullFeatured.stories`) is:

```
ClickViewBehaviour.panel(ctx)
  └─ ElementDetailViewer        (toolbars/ — engine-aware adapter: ctx → props)
       └─ PropertiesViewer      (components/ — dumb renderer)
```

Data flows: `useViewData` → `ViewData.data` → `useViewContext` (spreads it) →
`ViewContext.data` → the panel.

Two problems block typed rendering:

1. **Type info is destroyed at the boundary.** `useViewData.ts`'s `toStringMap()`
   coerces every value to a string (`String(number)`,
   `JSON.stringify(object|array)`). The panel only ever sees
   `Record<string, string>` — number, URL, image, array all become
   indistinguishable strings.
2. **Rendering is uniform plain text** (`PropertiesViewer.tsx:114-119`) — no
   per-kind treatment, no expand/collapse, no `<img>`, no `<a href>`, and **no
   way to add new type renderers**.

### Blast radius (verified)

The **view path** is self-contained — only these read view-side `data`:
`hooks/useViewData.ts`, `hooks/useViewContext.ts`, `toolbars/ElementDetailViewer.tsx`,
`components/PropertiesViewer.tsx`. We replace the last two.

Untouched and independent: the **editor path** (`hooks/useEntityEditor.ts` has
its *own* `toStringMap`; `components/PropertiesEditor.tsx` needs strings for its
`<input>`s) and the **hover-preview card** (`HoverElementPreviewCard`, driven by
`ResolvedPreviewCard` from `@invana/graph` — a separate renderer; §8 notes it
could adopt the registry later).

### Chrome available

`@invana/ui@0.0.12` (already a dep) exports `Badge`, `Separator`, `Accordion`,
`ScrollArea`, `Button`, `cn`. No new dependency.

`src/components/` must stay **dumb**: no `@invana/canvas` / engine /
`lucide-react` imports. The registry + `PropertyDetailView` obey this (pure
classification + presentational React over `@invana/ui`). Local `useState` for
expand toggles is fine — "dumb" forbids engine imports, not UI state.

---

## 2. Component architecture

```
ClickViewBehaviour                              (thin — renders panel(ctx) verbatim; owns NO placement/close)
  └─ panel(ctx) = consumer composition:         ← STORY/consumer side (could instead live outside the canvas)
       <Panel position="right">                  (components/ — pure positioner; full-height side dock)
         └─ <PanelContent onClose fill>          (components/ — surface + header bar [✕] + scroll body)
              └─ NodeDetailView / EdgeDetailView  (toolbars/ — always-BARE content; no surface/placement/close)
                   └─ DetailCard                   (components/ — bare content layout)
                        ├─ title (tinted with the element's styling colour) · type Badge
                        ├─ identity rows: Type / Label
                        ├─ EdgeEndpoints           (edge only — source —▸ target; each title tinted by its node colour)
                        └─ PropertyDetailView      (components/ — dumb properties block)
                 └─ for each [key,value]:  resolvePropertyRenderer(...) → <PropertyRow>
                                            (renderer chosen from the registry)
```

- **`NodeDetailView` / `EdgeDetailView`** (`toolbars/`, engine-aware): thin
  adapters. Read `ctx: ViewContext`, compute `{ title, subtitle(id), badge(type),
  rows, data }`, and render `<DetailCard …><PropertyDetailView … /></DetailCard>`.
  They differ in the default title, the identity rows, and that **`EdgeDetailView`
  renders an `EdgeEndpoints` block** (see below). Both forward `renderers` and
  `hints`. Both set `key={ctx.id}` on the card so expand/collapse state resets
  per element (§4).
- **`EdgeEndpoints`** (`components/`, dumb): the edge's **source → target**
  connection block. `EdgeDetailView` resolves each endpoint *node* from the
  engine — `ctx.store.getNode(ctx.source)` / `getNode(ctx.target)`, with the
  drawn label via `ctx.layer.resolveNodeStyle(node).labelText` (same resolution
  `useViewData` uses for the clicked node) and `node.type` — then hands
  `EdgeEndpoints` a plain `{ source: {id,type,label}, target: {id,type,label},
  directed }`. The component renders each endpoint (id mono · type Badge · label)
  with a **direction indicator** between them (`source —▸ target`; an unmarked
  divider when `directed === false`). Engine-agnostic: it only takes resolved
  strings, so it obeys the dumb-component rule.
- **`DetailCard`** (`components/`, dumb): the card chrome — title/subtitle/badge,
  optional close button, fixed identity `rows`, `className`/`style` (placement
  surface, incl. the dock recipe), and a `children` slot for the properties
  block. This is the relocated/renamed core of today's `PropertiesViewer` header.
- **`PropertyDetailView`** (`components/`, dumb): renders the **whole**
  properties block from `data: Record<string, unknown>`. For each entry it calls
  `resolvePropertyRenderer(value, { name, hint }, renderers)` and renders the
  result, choosing inline vs block layout from the renderer's `layout`.

`dockCardClassName('left'|'right')` (today in `ElementDetailViewer.tsx`) moves to
a shared `toolbars/detailView.ts` and is re-exported.

---

## 3. The extensible renderer registry (the core of this feature)

A `PropertyRenderer` co-locates **detection** (`match`) with **rendering**
(`render`), so a new data type is a single self-contained object.

```ts
/** Everything a renderer needs to draw one property value. */
export interface PropertyRenderContext {
  /** Property key (enables name-based matching, e.g. "avatar" → image). */
  name: string;
  /** Raw value (unknown — never pre-stringified). */
  value: unknown;
  /** Explicit kind hint for this key, if the consumer supplied one. */
  hint?: string;
  /** Recursion depth — list items / json values increment it (guard runaway nesting). */
  depth: number;
  /** Recurse: render a nested value back through the registry (used by list/json). */
  renderValue: (value: unknown, opts?: { name?: string; hint?: string }) => ReactNode;
}

export interface PropertyRenderer {
  /** Unique kind id — also the hint string that force-selects it. */
  kind: string;
  /** Claim this value? First match wins (custom before defaults). */
  match: (value: unknown, ctx: { name: string; hint?: string }) => boolean;
  /** 'inline' = label-left / value-right row; 'block' = label caption above full-width value. Default 'inline'. */
  layout?: 'inline' | 'block';
  /** Draw it. Return a component instance when you need hooks (expand state, onError). */
  render: (ctx: PropertyRenderContext) => ReactNode;
}
```

### Resolution — `resolvePropertyRenderer(value, { name, hint }, custom?)`

1. Build the ordered list `[...(custom ?? []), ...defaultPropertyRenderers]` —
   **custom renderers come first**, so a consumer can override a built-in kind.
2. If `hint` is set and some renderer has `kind === hint`, use it directly
   (hint forces the kind, beating heuristics).
3. Otherwise return the first renderer whose `match` returns `true`.
4. The built-in **`text`** renderer is last and matches everything (catch-all),
   so resolution never fails.

### Default renderer set (`defaultPropertyRenderers`, in order)

| `kind` | `layout` | match heuristic | rendering |
|---|---|---|---|
| `number` | inline | `typeof v === 'number' && Number.isFinite(v)` | `font-mono tabular-nums` (right-aligned — §7.1) |
| `image` | block | string matches `^data:image/` or `\.(png\|jpe?g\|gif\|webp\|avif\|svg)(\?\|#\|$)`i | `<img loading="lazy" onError=hide>` constrained (`max-h-40 w-full object-contain rounded-md border`); opens full URL on click |
| `url` | inline | string passes `isSafeHref` (`^(https?:\|file:\|mailto:)`i or `//`) | `<a target="_blank" rel="noopener noreferrer">` (sanitized), `text-primary` + hover underline, `break-all`; `file:`/`mailto:` skip `target=_blank` |
| `longtext` | block | string with `length > LONG_TEXT_THRESHOLD` (≈140) or contains `\n` | clamp to ≈3 lines (`line-clamp`); **Show more / Show less** (`useState`) |
| `tags` | block | `Array.isArray` && every item primitive && every string item `≤ TAG_MAX_LEN` (≈24) | `flex flex-wrap gap-1` of `<Badge variant="secondary">`; caps at `LIST_ITEM_CAP`, then `+N more` |
| `list` | block | `Array.isArray` (anything not caught by `tags`) | `<ul class="list-disc pl-4">`; **each item via `renderValue`** (depth+1), so links/numbers in a list render correctly; caps at `LIST_ITEM_CAP` |
| `json` | block | plain object | collapsible (`useState`): collapsed shows `{ N keys }`; expanded = one-level nested key/value table recursing `renderValue` per value; beyond `MAX_DEPTH` (≈2) falls back to `<pre>` pretty JSON |
| `text` | inline | always (catch-all, last) | `break-words` span; booleans → `'true'`/`'false'` |

Thresholds (`LONG_TEXT_THRESHOLD`, `TAG_MAX_LEN`, `LIST_ITEM_CAP`, `MAX_DEPTH`)
are documented module constants.

### Security — `isSafeHref`

Scheme allow-list only: `http:` `https:` `file:` `mailto:` and protocol-relative
`//`. Reject `javascript:`, `vbscript:`, non-image `data:`, etc. A URL-looking
string that fails the allow-list falls through to **text** (never a live link).
Image `data:` is gated to the `^data:image/` prefix.

### Adding a new data type (the whole point)

```tsx
const geoPointRenderer: PropertyRenderer = {
  kind: 'geo',
  layout: 'block',
  match: (v, { name }) =>
    name === 'location' && typeof v === 'object' && v !== null && 'lat' in v && 'lng' in v,
  render: ({ value }) => <MiniMap point={value as { lat: number; lng: number }} />,
};

<NodeDetailView ctx={ctx} renderers={[geoPointRenderer]} />
```

No core edit — one object, prepended to the defaults.

---

## 4. Layout & state details

- **Inline vs block**: scalar kinds (`text`, `number`, `url`) keep the current
  label-left / value-right row; block kinds (`image`, `longtext`, `tags`,
  `list`, `json`) stack a muted label caption above a full-width value.
  `PropertyDetailView` reads `renderer.layout` to choose.
- **Expand reset across elements**: `NodeDetailView` / `EdgeDetailView` set
  `key={ctx.id}` on the card, so switching elements remounts the block and
  resets every more/less + JSON toggle to collapsed.
- **Recursion guard**: `list`/`json` pass `depth+1` via `renderValue`; past
  `MAX_DEPTH` the `json` renderer prints compact `<pre>` instead of recursing.

---

## 5. File-by-file changes

| # | File | Change |
|---|---|---|
| 1 | **NEW** `components/propertyRenderers.tsx` | `PropertyRenderer`, `PropertyRenderContext` types; `defaultPropertyRenderers`; `resolvePropertyRenderer()`; internal value components (`LongTextValue`, `JsonValue`, `TagList`, `ImageValue`, `LinkValue`, `NumberValue`); `isSafeHref`/`isImageUrl`; thresholds. Pure + presentational; `@invana/ui` chrome only. |
| 2 | **NEW** `components/PropertyDetailView.tsx` | Dumb properties block. Props: `data?: Record<string, unknown>`, `renderers?: PropertyRenderer[]`, `hints?: Record<string, string>`, `emptyText?`, `title?` (default `'Properties'`), `className?`. Maps entries → `resolvePropertyRenderer` → row by layout. |
| 3 | **NEW** `components/DetailCard.tsx` | Dumb card shell extracted from `PropertiesViewer`: `title`/`subtitle`/`badge`/`rows`/`onClose`/`className`/`style`/`children`. (`PropertiesViewerRow` → `DetailRow`.) |
| 4 | **NEW** `toolbars/NodeDetailView.tsx` | Engine-aware: `ctx`, `title?='Node'`, `showId?`, `renderers?`, `hints?`, `className?`, `style?`. Renders `DetailCard` (Type/Label rows) + keyed `PropertyDetailView`. |
| 5 | **NEW** `toolbars/EdgeDetailView.tsx` | As above, `title?='Edge'`. Resolves source/target nodes via `ctx.store.getNode` + `ctx.layer.resolveNodeStyle(node).labelText` + `node.type` and renders `<EdgeEndpoints>` between the identity rows and the properties block. Falls back to the bare id when an endpoint node is missing. |
| 5b | **NEW** `components/EdgeEndpoints.tsx` | Dumb source —▸ target block. Props: `source`/`target` `{ id; type?; label? }`, `directed?` (default `true`). Renders each endpoint (id mono · type Badge · label) with a direction glyph; unmarked divider when not directed. |
| 6 | **NEW** `toolbars/detailView.ts` | Shared `dockCardClassName()` (relocated) + shared base prop types. |
| 7 | `hooks/useViewData.ts` | Replace view-path `toStringMap` with structure-preserving `toDisplayMap` (drop `null`/`undefined`; keep number/string/boolean/array/plain-object as-is). Widen `ViewData.data` → `Record<string, unknown>`. Update TSDoc. |
| 8 | `hooks/useViewContext.ts` | `ViewContext.data` inherits the widened type via the spread; fix the "flat string map" doc line. |
| 9 | `components/index.ts` + `src/index.ts` | Export `PropertyDetailView`, `DetailCard`, `EdgeEndpoints`, `PropertyRenderer`, `PropertyRenderContext`, `defaultPropertyRenderers`, `resolvePropertyRenderer`, `NodeDetailView`, `EdgeDetailView`, `dockCardClassName`. Drop `ElementDetailViewer` / `PropertiesViewer` exports. |
| 10 | **DELETE** `toolbars/ElementDetailViewer.tsx`, `components/PropertiesViewer.tsx` | Superseded. |
| 11 | `apps/storybook/stories/canvas-react/graph-canvas-app/FullFeatured.stories.tsx` | Migrate the `panel` prop: `panel={(ctx) => ctx.kind === 'edge' ? <EdgeDetailView ctx={ctx} className={dockCardClassName('right')} /> : <NodeDetailView ctx={ctx} className={dockCardClassName('right')} />}`. (Story edit needed for the migration to compile/run — see §7.6.) |

**NOT touched:** `hooks/useEntityEditor.ts`, `components/PropertiesEditor.tsx`,
`components/HoverElementPreviewCard.tsx`.

---

## 6. Verification

```bash
pnpm check-types                          # all packages
pnpm --filter @invana/canvas-react build  # ESM + d.ts emit
pnpm --filter @canvas/storybook dev       # visual: FullFeatured right dock
```

**Sample-data caveat.** Les Misérables nodes only carry a numeric `group`, so
the story exercises only the `number` kind. To *see* image/link/tags/list/json,
a node's `data` must contain those types — see §7.6.

---

## 7. Decision points (resolve before implementation)

1. **Number alignment** — right-aligned `tabular-nums` (proposed) vs left.
2. **JSON default** — collapsed `{ N keys }` + nested table (proposed), `MAX_DEPTH`
   2 then `<pre>` — accept or tune.
3. **List/tag cap** — `LIST_ITEM_CAP` (proposed 50) + `+N more` as static text vs
   a "show all" toggle.
4. **`dispatch by kind`** — keep the consumer writing the `ctx.kind` ternary
   (proposed, explicit), or also ship a thin `ElementDetailView` convenience that
   dispatches to Node/Edge internally?
5. **`file:` link label** — full URL (proposed) vs friendly basename + full URL
   in `title`.
6. **Demo data / story** — Migrating `FullFeatured` (file #11) is required for
   the build to use the new components. Separately, to *demonstrate* the rich
   kinds, do you want me to (a) just migrate the panel and leave data as-is,
   (b) add a few mixed-type properties to the story's node data, or (c) add a
   dedicated story? (b)/(c) need your go-ahead per repo rule #11.
7. **Thresholds** — `LONG_TEXT_THRESHOLD` (≈140), `TAG_MAX_LEN` (≈24): accept or tune.
8. **Naming** — `DetailCard` for the shell, `PropertyDetailView` for the block,
   `EdgeEndpoints` for the connection block, `Node`/`EdgeDetailView` for the
   panels. Confirm or rename.
9. **Edge direction source** — always render directed `source —▸ target`
   (proposed), or read directedness from the edge (e.g. an `directed`/arrow-marker
   style field) and show an unmarked divider for undirected edges? Confirm which
   field signals "undirected" if the latter.
10. **Clickable endpoints** — render each endpoint as plain text (proposed), or
    make it actionable (click an endpoint to re-target the inspector to that
    node via `ClickViewBehaviour`)? The latter needs the behaviour id — flag if
    you want it.

---

## 8. Out of scope / follow-ups

- **Hover-preview parity** — `HoverElementPreviewCard` could reuse the registry
  so hover + click panels render values identically. Not this pass.
- **Editor parity** — typed *editing* (number field, image picker) is the
  `PropertiesEditor` path; separate, larger effort.
- **Per-type hint schemas** — deriving `hints` from a per-`type` schema (e.g.
  type `Person` → render `avatar` as image) instead of passing `hints` per
  render. Natural once the `data-types-implementation-plan.md` model lands.
