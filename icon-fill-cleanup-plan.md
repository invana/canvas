# Icon-fill cleanup + layered-fill refactor (three phases)

## Status

- **Phase A — done.** `IconRegistry` deleted; `kind: 'ref'` removed.
- **Phase B — done.** `kind: 'icon'` split into vendor-agnostic primitive layer kinds (`glyph`, `svg`, `image-inset`); `ShapeFill` now accepts a single layer or an array (layered fills); `ShapeBase` mounts inset content keyed by layer index.
- **Phase C — done.** Storybook vendor purge: deleted `icon-packs/`; created five per-source stories (FontAwesome, Lucide, Fluent, Unicode, Svg) with everything inlined in `play`.
- **Phase D — done.** Reduced icon scope (kept only glyph + svg-url demos); engine grew `kind:'svg-url'` (vendor-agnostic remote SVG fetch+parse) + `loadIconFont(url, family, weight)` helper. FA story works via codepoint table.
- **Phase E — considered and rejected.** Adding `kind:'glyph-class'` (CSS-class icon via Pixi `HTMLText`) would let consumers write `'fa-database'` instead of a Private-Use codepoint, but the costs — HTMLText is slower than Text, requires inlining stylesheet rules via `cssOverrides` to work around SVG-as-image not loading external `<link>`s, adds a second rendering path — outweighed the ergonomics win. Final decision: **`kind:'glyph'` is the only glyph kind**. Consumers maintain a small `\uXXXX` codepoint table per icon font. The Phase D state is the final state.

## Design principle (load-bearing)

**The canvas library is icon-vendor-agnostic AND so is the storybook scaffold.** The engine knows *how to render primitive content* — a font-based glyph (any font family, any codepoint, including Unicode) and an SVG path (any `pathD`). It never names a vendor.

**Vendor-specific code lives nowhere shared, only inside the individual demo story it belongs to.** Each story file inlines its own glyph table / svg fetch / stylesheet inject — there is no `icon-packs/` library, no shared resolver, no `IconPack` type. A reader opening a single `.stories.ts` file sees exactly the data for that one vendor and nothing else; deleting that one file removes the vendor from the codebase entirely.

## Context

`packages/canvas` previously had icon support woven through the engine via three concepts:

1. **`IconRegistry`** — a CSS-style named-ref lookup table (`'fa-solid:database'` → glyph) with pack registration + webfont preloading.
2. **`kind: 'icon'` fill** — a special-case fill that bundles "centred glyph/SVG overlay + optional plate underneath" into one type, with a nested `IconRef` that includes a `kind: 'ref'` form for registry lookup.
3. **Pack-specific glue in stories** — Font Awesome stylesheet injection + Lucide SVG fetch live inline inside `IconFills.stories.ts`.

Two design problems surfaced in discussion:

- **The registry is dead weight.** Stories can pass concrete `{ kind: 'glyph', char, fontFamily, fontWeight }` or `{ kind: 'svg', pathD }` directly without the named-ref indirection. The CSS-class analogue was elegant but adds engine code for zero capability.
- **The icon fill is a half-baked layered fill.** `kind: 'icon'` already smuggles a second fill layer (the `background` plate) into one type because the most common use needs "plate + glyph". Other compositions are impossible: gradient + icon, image + icon (small logo on photo), corner badge + centre icon, etc. The right model is **layered fills** — `fill: ShapeFill | ShapeFill[]`, painted bottom-up — with `kind: 'icon'` split into orthogonal layer kinds (`glyph`, `svg`, `image-inset`).

This work splits cleanly into two ship-able phases. **Phase A** is a pure deletion + story-side rework, no behavioural change to `kind: 'icon'`. **Phase B** is the layered-fill refactor that touches `ShapeFill`, `ShapeBase`, `applyFillStroke`, and every shape-fill story.

LOD is explicitly out of scope for both phases — it'll be implemented later as a custom Behaviour and (likely) a story-side `WorldLayer` dedicated to icons whose container visibility the behaviour toggles.

---

## Phase A — Delete `IconRegistry` and the `kind: 'ref'` indirection — DONE

### Goal
Remove the named-ref lookup layer entirely. `kind: 'icon'` fills keep working unchanged; the only visible API change is that callers pass concrete `glyph` / `svg` `IconRef`s inline instead of `{ kind: 'ref', name }`.

### Files to modify

**Delete:**
- `packages/canvas/src/icons/IconRegistry.ts` (whole file)
- `packages/canvas/src/icons/` (directory becomes empty — remove)

**Edit:**

- `packages/canvas/src/primitives/types.ts`
  - Remove the `kind: 'ref'` arm of the `IconRef` union (lines ~119–129). `IconRef` becomes `glyph | svg`.
  - Remove `iconRegistry?: IconRegistry` from `ShapeHostInfo` (lines ~280–286).
  - Remove the `import type { IconRegistry }` (line ~16).
  - `ShapeFill`'s `kind: 'icon'` variant stays untouched.

- `packages/canvas/src/primitives/paint/iconLayer.ts`
  - Drop `resolveRef` and the `registry` parameter on `mountIcon` / `updateIcon`. The `IconRef` argument is now always concrete (`glyph | svg`); render directly.
  - Drop the `import type { IconRegistry }`.

- `packages/canvas/src/primitives/base/ShapeBase.ts`
  - Update `mountIcon` / `updateIcon` call sites in `syncIconLayer` (lines ~85–98) to drop the `this.host.iconRegistry` argument.

- `packages/canvas/src/primitives/PrimitivesRenderer.ts`
  - Remove the `iconRegistry` import (line ~31), option (lines ~89–93), private field (line ~112), constructor assignment (line ~118), and pass-through into `ShapeHostInfo` (line ~169).

- `packages/canvas/src/index.ts`
  - Remove `IconRegistry` and `IconFontPack` exports (lines 113–114).

- `packages/canvas/src/primitives/index.ts` — `IconRef` export stays (line 50); union now narrower.

### Story rework

- `apps/storybook/stories/Canvas/Primitives/Shapes/IconFills.stories.ts`
  - Drop `IconRegistry` import + instantiation + all `register*` calls.
  - Drop the `iconRegistry` option on `PrimitivesRenderer`.
  - Replace `{ kind: 'ref', name: 'fa-solid:database' }` with the concrete glyph form inline.
  - Keep `ensureFAStylesheet` and `fetchLucideAsPathD` helpers — they move into per-pack files (next bullet).

- New per-pack helper files under `apps/storybook/stories/Canvas/Primitives/Shapes/icon-packs/`:
  - `fontawesome.ts` — exports `ensureFAStylesheet()` (CDN inject + load wait) and a `fontAwesomeGlyphs` map (`{ database: '', rocket: '', user: '', heart: '', star: '', ... }`) returning a small set of `IconRef` objects ready to drop into `kind: 'icon'` fills.
  - `lucide.ts` — exports `fetchLucideAsPathD(name)` (existing helper) and a small map of pre-fetched names with cached path-d lookup utility.
  - `unicode.ts` — exports a small `unicodeGlyphs` map (`{ star: '★', heart: '♥', check: '✓', ... }`) producing system-font `IconRef`s.
  - `fluent.ts` — Fluent UI System Icons via `@fluentui/svg-icons` CDN, exposing the same fetch-as-path-d helper as Lucide.
  - `index.ts` — re-exports each pack's helpers + a single `ALL_ICONS` array `[{ pack: 'fa-solid', name: 'database', ref: IconRef }, ...]` used by the lil-gui dropdown.

- `IconFills.stories.ts` becomes the showcase: imports from `./icon-packs`, draws four shapes (one per pack), wires a single lil-gui with two controls per shape — pack dropdown + icon dropdown — re-renders on change via `renderer.setShape(id, newSpec)`.

### Story-side rules to follow
- Per `apps/storybook/CLAUDE.md`: all setup lives inside `play`; helpers are imported, not defined at module level. The icon-pack files are imports, not story-internal helpers.
- Per `feedback_storybook_data_pattern.md`: keep glyph maps as flat JSON object literals — no helper functions to "build" them.
- Per `feedback_center_drawing.md`: `canvas.camera.fitContent(layer.getBounds(), 100)` after shapes are added.
- One story per file is already satisfied.

### Verification
- `pnpm --filter @invana/canvas build` — should compile cleanly with the deletions + edits.
- `pnpm --filter @invana/canvas check-types` — no dangling `IconRegistry` references.
- `pnpm --filter @canvas/storybook dev` → http://localhost:6006/?path=/story/canvas-primitives-shapes-iconfills — manual: verify all four icons render correctly, lil-gui pack/icon swap re-renders shapes live, no console errors, FA stylesheet still loads, Lucide fetch still resolves.
- Search the repo for stray `IconRegistry` / `kind: 'ref'` references that were missed.

---

## Phase B — Layered fills (`ShapeFill | ShapeFill[]`)

### Goal
Generalise the smuggled "plate + icon" composition into first-class layered fills. A shape's `fill` accepts either a single layer or an array of layers, painted bottom-up. Split the omnibus `kind: 'icon'` into orthogonal **vendor-agnostic primitive layer kinds** (`glyph`, `svg`, `image-inset`). After this phase, the word "icon" is gone from `packages/canvas/src/` entirely — only primitive rendering kinds remain. Vendor-specific story code in `apps/storybook/.../icon-packs/` is unaffected (it already produces generic refs and will trivially adapt to the new layer shape).

### New `ShapeFill` shape

```ts
type ShapeFillLayer =
  | number  // shorthand → solid color
  | { kind: 'solid'; color: number; alpha?: number }
  | { kind: 'image'; url: string; alpha?: number; fit?: 'fill' | 'cover' | 'contain' | 'none' | 'tile' }   // silhouette filler
  | { kind: 'glyph'; char: string; fontFamily?: string; fontWeight?: number | string; fontStyle?: 'normal' | 'italic'; color?: number; alpha?: number; sizeRatio?: number; anchor?: InsetAnchor }
  | { kind: 'svg'; pathD: string; viewBox?: { width: number; height: number }; strokeWidth?: number; color?: number; alpha?: number; sizeRatio?: number; anchor?: InsetAnchor }
  | { kind: 'image-inset'; url: string; alpha?: number; sizeRatio?: number; anchor?: InsetAnchor };

type InsetAnchor = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type ShapeFill = ShapeFillLayer | ReadonlyArray<ShapeFillLayer>;
```

- `kind: 'icon'` is **gone** — its fields move onto `glyph` / `svg` directly. The `background` field is gone — users prepend a `solid` / `gradient` / `image` layer instead.
- Layer kinds split into two roles:
  - **Silhouette fillers** (`solid`, `image`) — paint into the silhouette via Pixi's `g.fill()` / textured fill.
  - **Inset content** (`glyph`, `svg`, `image-inset`) — mounted as Container children, sized by `sizeRatio`, anchored per `anchor`.

### Files to modify

- `packages/canvas/src/primitives/types.ts`
  - Replace `ShapeFill` with the layered union above. Drop `IconRef` (its arms become layer kinds directly).
  - `BaseShapeSpec.fill` typed as `ShapeFill` (already covers single + array via the union).

- `packages/canvas/src/primitives/paint/applyFillStroke.ts`
  - Convert `applyFill` to iterate layers. Multiple silhouette-filler layers stack via alpha (paint each into the Graphics in order). Inset-content layers are skipped here (handled by a new mounter). Single non-array fill is treated as a one-element array.

- `packages/canvas/src/primitives/paint/iconLayer.ts` → rename to `insetContentLayer.ts`
  - Replaces `IconView` with `InsetContentView` keyed by layer index.
  - `mountInsetContent(parent, layer, bounds)`, `updateInsetContent(view, layer, bounds)`, `destroyInsetContent(view)`.
  - `glyph` → Pixi `Text`; `svg` → Pixi `Graphics` from `GraphicsPath`; `image-inset` → Pixi `Sprite` from `Texture.from(url)` with size constrained by `sizeRatio`.
  - Anchor positioning replaces today's hard-coded centre.

- `packages/canvas/src/primitives/base/ShapeBase.ts`
  - Replace `iconView: IconView | null` with `insetViews: Map<number, InsetContentView>` (layer-index keyed).
  - `syncInsetLayers(spec)` — diff the inset-content layers between previous and current spec; mount new, update changed, destroy removed.
  - Decoration `paintInto` flow unchanged: it operates only on the silhouette, never sees inset content.

- Story migration — every story that uses `kind: 'icon'` becomes either:
  - `fill: { kind: 'glyph', char, ...}` for a bare icon-on-silhouette.
  - `fill: [{ kind: 'solid', color: 0x...}, { kind: 'glyph', char, ...}]` for the plate-and-glyph case.
  - `fill: [{ kind: 'image', url, fit: 'cover' }, { kind: 'glyph', char, sizeRatio: 0.25, anchor: 'top-right' }]` for "photo + corner badge" — new capability.

### Verification
- `pnpm --filter @invana/canvas build` + `check-types` clean.
- `pnpm --filter @canvas/storybook dev` — visit each shape-fill story, confirm visual parity with Phase A on the plate+glyph composition; new "photo + badge" story renders correctly.
- Decoration stories (glow, ring, marching-ants) still halo only the silhouette and leave inset content untouched — read each decoration story under `Canvas/Primitives/Shapes/Decorations/*` and verify visually.
- Decoration-related code sites that today read `spec.fill?.kind === 'icon'` need updating; grep `applyFillStroke`, `ShapeDecorationBase`, and `primitives/decorations/shape/*` for the pattern.
- No `IconRef` / `IconView` / `iconLayer` strings remain in `packages/canvas/src/`.

### Out of scope for Phase B
- Gradient layers (note them as a future addition; the layered model accepts them trivially).
- LOD behaviour — separate task, will reference inset-content views.
- Domain packages (`@invana/graph` etc.) consuming the new fill model — only required if they directly construct `kind: 'icon'` specs today (they likely don't).

---

## Phase C — Storybook vendor purge + per-source icon stories

### Goal

Remove every shared vendor abstraction from `apps/storybook`. Each icon source — Font Awesome, Lucide, Fluent, Unicode, generic hand-written SVG — becomes its own one-file demo story. All vendor data (codepoints, CDN URLs, stylesheet inject, fetch helpers, glyph maps) lives **inlined inside `play`** of the story that uses it. Deleting any one story removes that vendor from the codebase entirely. There is no `icon-packs/` directory, no `IconPack` type, no `getPack()` resolver, no cross-story shared helper.

### Files to delete

- `apps/storybook/stories/Canvas/Primitives/Shapes/icon-packs/fontawesome.ts`
- `apps/storybook/stories/Canvas/Primitives/Shapes/icon-packs/lucide.ts`
- `apps/storybook/stories/Canvas/Primitives/Shapes/icon-packs/fluent.ts`
- `apps/storybook/stories/Canvas/Primitives/Shapes/icon-packs/unicode.ts`
- `apps/storybook/stories/Canvas/Primitives/Shapes/icon-packs/svg-fetch.ts`
- `apps/storybook/stories/Canvas/Primitives/Shapes/icon-packs/index.ts`
- `apps/storybook/stories/Canvas/Primitives/Shapes/icon-packs/` (now empty, remove the directory)
- `apps/storybook/stories/Canvas/Primitives/Shapes/IconFills.stories.ts` (depends on icon-packs)

### Files to create

Five new story files under `apps/storybook/stories/Canvas/Primitives/Shapes/Icons/`. Storybook title format: `'Canvas/Primitives/Shapes/Icons/<Source>'`. One story per file (per existing convention).

| File | Demonstrates | Inline data |
|---|---|---|
| `FontAwesome.stories.ts` | `kind: 'glyph'` fill with an icon-font (FA 6 Free Solid). Story injects the FA stylesheet via CDN, awaits font readiness, then renders one demo shape. | ~6–8 codepoints (`database`, `rocket`, `user`, `heart`, `star`, `bell`, `gear`, `bolt`) inline in `play`. |
| `Lucide.stories.ts` | `kind: 'svg'` fill via runtime SVG fetch + path-d extraction. | ~6–8 Lucide icon names; svg→path-d converter inline in `play`. |
| `Fluent.stories.ts` | `kind: 'svg'` fill from Fluent UI System Icons CDN. | ~6–8 Fluent icon names; same converter pattern as Lucide, inline. |
| `Unicode.stories.ts` | `kind: 'glyph'` fill with system-font Unicode chars (no CDN, no webfont). | ~6–8 chars (`★`, `♥`, `✓`, etc.) inline. |
| `Svg.stories.ts` | `kind: 'svg'` fill with hand-written `pathD` literals (engine-generic, no vendor). | 4–5 small literal path strings inline (triangle, plus, check, cross, diamond). |

### Per-story structure (uniform across all five)

```ts
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, PrimitivesRenderer, WheelZoomBehaviour, WorldLayer } from '@invana/canvas';
import type { CanvasContext, ShapeFillLayer } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Shapes/Icons/<Source>' };
export default meta;
type Story = StoryObj;

export const <Source>: Story = {
  render: () => createContainer({ id: 'cvs-prim-icons-<source>' }),
  play: async ({ canvasElement }) => {
    // 1. Inline icon data (codepoint map, name list, or path-d literals).
    // 2. Inline helper(s) needed (FA stylesheet inject for the FA story;
    //    fetch+svg-to-pathD for Lucide / Fluent; nothing for Unicode / Svg).
    // 3. Standard canvas + WorldLayer + PrimitivesRenderer setup.
    // 4. Add one demo shape (circle or rounded rect) with layered fill:
    //    [{kind:'solid', color: <plate>}, {kind:'glyph'|'svg', ...iconData, color:0xffffff, sizeRatio:0.6}].
    // 5. canvas.camera.fitContent(layer.getBounds(), 100).
    // 6. lil-gui with one dropdown control (icon name); onChange calls
    //    renderer.updateShape with a fresh fill array.
  },
};
```

### Rules to follow (already in play in the codebase)
- `apps/storybook/CLAUDE.md`: all setup lives inside `play`. No module-level constants, no module-level helpers — that includes the FA stylesheet inject, the svg-to-pathD converter, and every glyph map. Modules import only the canvas API and lil-gui.
- `feedback_storybook_data_pattern.md`: glyph maps and name lists are flat object literals / arrays of literal values inside `play`.
- `feedback_center_drawing.md`: `canvas.camera.fitContent(layer.getBounds(), 100)` after shapes are added.
- `feedback_icon_vendor_agnostic.md`: vendor specifics (codepoints, CDN URLs) appear only inside the single story that owns them.

### Files unaffected
- `packages/canvas/src/**` — already vendor-free after Phase B; Phase C does not touch the engine.
- `apps/storybook/stories/Canvas/Primitives/Shapes/CircleSolid.stories.ts`, `RectSolid.stories.ts` — solid-fill demos, no icons, no change.
- `apps/storybook/stories/Canvas/Primitives/Shapes/PhotoBadge.stories.ts` — vendor-free layered-fill demo (image + glyph corner badge with literal unicode chars). Stays as-is.

### Verification
- `pnpm --filter @invana/canvas check-types` — clean (engine untouched).
- `pnpm --filter @canvas/storybook check-types` — clean apart from the pre-existing `StraightLine.stories.ts` `length`/`ArrowMarkerSpec` error (unrelated, present before this work began).
- `pnpm --filter @canvas/storybook dev` — visit each of the five new stories at `?path=/story/canvas-primitives-shapes-icons-<source>`, verify the icon renders, lil-gui dropdown swaps icons live, no console errors.
- `grep -r "icon-packs\|IconFragment\|IconPack" apps/storybook` — zero hits.
- `grep -r "fontawesome\|font-awesome\|lucide-static\|@fluentui" apps/storybook --include='*.ts' | wc -l` — exactly 3 hits (one per vendor story file), confirming each vendor is referenced from exactly one place.

### Out of scope for Phase C
- Removing `glyph` / `svg` / `image-inset` fill kinds from the canvas library — these are vendor-agnostic primitives, intentionally retained.
- Reorganising other shape stories.

---

## Phase D — Scope reduction + `kind:'svg-url'` + `loadIconFont`

### Goal

Phase C produced five stories. Two of them (Lucide, Fluent) are wrong in concept: they treat the engine's remote-SVG capability as a way to ship icon-library glue. That's not what we want — `kind:'svg-url'` exists so a *consumer* can drop in their own SVG URL, not as a transport for curated icon-pack libraries.

The supported icon-rendering surfaces, after Phase D, are:

- **`kind:'glyph'`** — font-rendered character. The user picks a font (any font — system or webfont), the user picks a codepoint. Demoed by `Unicode.stories.ts` (system font) and `FontAwesome.stories.ts` (a webfont loaded via the new `loadIconFont` helper, with codepoint glyphs like `fa-user`, `fa-database`).
- **`kind:'svg-url'`** — generic remote SVG. The consumer supplies a URL to *their own* SVG (logo, custom diagram, sample artwork from Wikimedia, etc.). The engine fetches, parses, caches, renders. Demoed by `Svg.stories.ts` with curated sample URLs from neutral sources (Wikimedia, GitHub raw, w3.org).

`kind:'svg'` (literal `pathD`) stays in the engine but has no story demo — it's a programmatic capability for consumers who already have the path-d in code.

The Lucide / Fluent stories are deleted outright. The engine never names them, the storybook never demos them.

### Engine changes

#### `packages/canvas/src/primitives/types.ts`

Add a sixth `ShapeFillLayer` variant:

```ts
| {
    /** Vector SVG icon fetched from a URL. Engine extracts every drawing
     *  primitive (path / ellipse / circle / rect / line / polyline / polygon)
     *  into a single concatenated pathD and renders it as a Pixi Graphics
     *  path. Fetched lazily; result cached globally per URL. */
    readonly kind: 'svg-url';
    readonly url: string;
    readonly viewBox?: { readonly width: number; readonly height: number };
    readonly strokeWidth?: number;
    readonly color?: number;
    readonly alpha?: number;
    readonly sizeRatio?: number;
    readonly anchor?: InsetAnchor;
  }
```

Update the `InsetLayer` extract in `paint/insetContentLayer.ts` to include `'svg-url'`.

#### `packages/canvas/src/primitives/paint/insetContentLayer.ts`

- `isInsetLayer`: include `'svg-url'`.
- `renderChild`: for `kind:'svg-url'`, create an empty Pixi `Graphics`, kick off a fetch (memoised module-level `Map<string, Promise<string>>`), and on resolve trace the path with `g.path(new GraphicsPath(pathD))` + `g.stroke(...)`. After population, call `positionAndScale` again so the now-non-empty bounds drive the correct scale.
- The svg-to-pathD converter (the parser currently inline in stories) moves here as a private helper. ~70 lines of `switch (tag)`. Engine-internal.
- `layerKey`: include `'svg-url'` — key by URL string.

#### `packages/canvas/src/fonts/loadIconFont.ts` (new file)

```ts
/** Inject an icon-font stylesheet once and await font readiness. */
export async function loadIconFont(
  stylesheetUrl: string,
  fontFamilyToProbe?: string,
): Promise<void>
```

- Idempotent: dedupes via `data-icon-font-cdn="<encodeURIComponent(url)>"` attribute on the `<link>`.
- Wraps `<link>` injection in a Promise that resolves on `link.onload` (or immediately if `link.sheet` is already populated).
- If `fontFamilyToProbe` is supplied, calls `document.fonts.load(\`16px "\${fontFamily}"\`)` so the first paint actually rasterises against the webfont.
- No-ops cleanly when `document` is undefined (SSR safety).

Export from `packages/canvas/src/index.ts` alongside `TextureRegistry`.

#### `packages/canvas/src/primitives/index.ts`

No changes needed beyond the union update via `types.ts`.

### Story changes

| File | Change |
|---|---|
| `Lucide.stories.ts` | **Delete.** |
| `Fluent.stories.ts` | **Delete.** |
| `FontAwesome.stories.ts` | Replace the ~25-line inline `<link>` inject + `document.fonts.load` block with `await loadIconFont(FA_CDN_URL, 'Font Awesome 6 Free')`. Rename the dropdown options from `database / rocket / ...` to `fa-database / fa-rocket / ...` to match the user's mental model. Rest of story (codepoint table + glyph fill + lil-gui) unchanged. |
| `Unicode.stories.ts` | No change — already trivial (literal chars, system font, `kind:'glyph'`). |
| `Svg.stories.ts` | **Repurpose** from "inline literal `pathD`" → "remote SVG via `kind:'svg-url'`". Drop the hand-written `pathD` map. Add a curated list of 5–6 SVG URLs from neutral sources — e.g. Wikimedia Commons public-domain SVGs, w3.org SVG examples, github raw. URLs picked deliberately to avoid icon libraries (no Lucide / Fluent / Heroicons / Material Symbols / Tabler — just generic SVG art). lil-gui dropdown swaps among them. At implementation, verify each URL responds with permissive `Access-Control-Allow-Origin` so the fetch isn't blocked in the storybook iframe. |

### Files to modify / create / delete

**Create:**
- `packages/canvas/src/fonts/loadIconFont.ts`

**Modify:**
- `packages/canvas/src/primitives/types.ts` (add `'svg-url'` variant)
- `packages/canvas/src/primitives/paint/insetContentLayer.ts` (svg-url renderer + parser + cache; the SVG-to-pathD parser moves here from the deleted stories)
- `packages/canvas/src/index.ts` (export `loadIconFont`)
- `apps/storybook/stories/Canvas/Primitives/Shapes/Icons/FontAwesome.stories.ts`
- `apps/storybook/stories/Canvas/Primitives/Shapes/Icons/Svg.stories.ts`

**Delete:**
- `apps/storybook/stories/Canvas/Primitives/Shapes/Icons/Lucide.stories.ts`
- `apps/storybook/stories/Canvas/Primitives/Shapes/Icons/Fluent.stories.ts`

### Verification
- `pnpm --filter @invana/canvas check-types` ✓ + `build` ✓.
- `pnpm --filter @canvas/storybook check-types` clean apart from the pre-existing `StraightLine.stories.ts` error.
- `pnpm --filter @canvas/storybook dev` — manual visit each of the three remaining Icons stories:
  - FontAwesome — glyph renders after `loadIconFont` resolves; dropdown swaps codepoints with `fa-` prefix.
  - Unicode — system-font char renders immediately.
  - Svg — first sample URL renders shortly after load (async fetch); dropdown swaps URLs; second visit to same URL is instant (cache hit).
- `grep -n 'querySelectorAll\|DOMParser\|fetch(\|document\\.fonts' apps/storybook/stories/Canvas/Primitives/Shapes/Icons/` — zero hits (all such logic now lives in the engine).
- `ls apps/storybook/stories/Canvas/Primitives/Shapes/Icons/` — exactly three files: `FontAwesome.stories.ts`, `Unicode.stories.ts`, `Svg.stories.ts`.

### Out of scope for Phase D
- Pre-flighting CORS for arbitrary URLs at runtime — engine assumes URLs are reachable; failures are surfaced as console errors (story dev verifies the curated set works).
- Caching strategies beyond per-URL memoisation in module scope (no LRU, no eviction, no persistence).
- Loading raster image URLs as SVG (use `kind:'image-inset'` for raster, `kind:'svg-url'` for vector).
- Removing `kind:'svg'` (literal `pathD`) — kept; serves the in-code path-d case, even though no story demos it.

