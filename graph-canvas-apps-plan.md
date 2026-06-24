# GraphCanvasApp — plan

**Goal.** Turn today's `GraphCanvasLiteApp` into **`GraphCanvasApp`** — a single,
composable graph application built as a **compound component** (orchestrator +
region components), lean to use as a one-liner yet reusable for every use case
(stories, website quick-demos with controls, drawing, streaming). Then retire
the storybook-local `StoryCanvasShell` + `StoryGraphApp` by migrating all
canvas-react stories onto it.

The richer apps (**Visualiser**, **Drawing**) are **not** separate exported
components — there is no `GraphVisualiserApp` / `GraphDrawingApp`. They're
*arrangements* of `GraphCanvasApp` (story files / website pages). One app,
composed differently.

> **Terminology — "chrome".** The UI that *frames* the canvas (from "browser
> chrome": the bars/buttons around a web page, not the page itself). Here: the
> header bar, footer bar, and floating bits (minimap, inspector, context menus,
> dev overlay). "Full-chrome" = all of it on (Visualiser); a bare widget = none.
> `chrome` is a *concept* in this doc, never a prop name.

---

## 1. The idea — one app, decomposed into regions

The tension we kept hitting: a single component can be *easy to use* (opinionated,
batteries baked in) **or** *infinitely composable* (everything a prop), but
forcing both into one flat component bloats its prop surface.

The resolution is the **compound-component** idiom (React-Flow `<ReactFlow>` +
`<Panel>`/`<Controls>`; Radix). One orchestrator owns the engine + chrome
shell; the chrome is split into focused, replaceable **region components**:

```
GraphCanvasApp                 ← orchestrator: owns engine, lifted context, AppLayoutBase, cross-region state
├── GraphCanvasAppHeader       ← title · toolbar · devInfo toggle · theme toggle
├── GraphCanvasAppMain         ← <Canvas> + graph bundle (or your own children) + DevInfoLayer + ready-bridge
└── GraphCanvasAppFooter       ← status bar · message bar
```

`GraphCanvasApp` is "lite" not because it's feature-poor but because the
**orchestrator file is thin** — the weight is distributed into three small,
single-purpose region files, each independently customisable or replaceable.

> **Why no separate `CanvasAppShell` base, and no `bare` flag:** the region
> components *are* the plumbing/opinion seam. "Provide the slot → you own it;
> omit it → get the default." Replacing `GraphCanvasAppMain`'s children swaps the
> whole graph bundle out — that's how Drawing/Streaming bring their own — with
> no second top-level name and no suppression flag.

---

## 2. Region responsibilities

### `GraphCanvasApp` (orchestrator)

Owns what spans regions; delegates the rest.

- Live engine state + lifted `CanvasContext` / `GraphCanvasContext` (so header /
  footer, which are siblings of `<Canvas>` under `AppLayoutBase`, resolve the
  same engine).
- The `AppLayoutBase` itself; distributes `header` / `main` / `footer`.
- **Cross-region state** (declared in a region, drives another — see §3).
- Props: `data`, `config` (deep-merged over baked defaults), `wrap(node)`,
  `preference`/backend + `instanceKey` (re-key `<Canvas>`), `overlay`, `onReady`,
  `className`, the region option bags `header` / `main` / `footer`, and
  `children` (extra in-canvas, appended into Main).

### `GraphCanvasAppHeader`

- Props: `title`, `toolbar`, `themeToggle`, `devInfo`, `devInfoInitiallyOn`,
  `left` / `center` / `right` overrides.
- `toolbar` is a **render-prop** handed the control context
  `{ canvas, backend, setBackend, magnet, toggleMagnet }` so a custom toolbar can
  drive backend / magnet without prop-drilling.
- The dev-overlay **toggle** is a header control, so `devInfo` /
  `devInfoInitiallyOn` live here (per the explicit call: "devInfo passed to the
  header options").

### `GraphCanvasAppMain`

- Renders `<Canvas config>`, the default **graph bundle** (background · graph ·
  color-by-label · d3-force + auto-run · select/hover behaviours), the
  `DevInfoLayer` (visibility from the orchestrator), and the ready-bridge that
  publishes the engine up.
- Props: `nodeLabel`, `graphLayer`, bundle tuning (`palette`, `forceOptions`,
  `layouts`, behaviour on/off, …).
- **Explicit children replace the bundle** — Drawing/Streaming pass their own
  layers/behaviours and the default bundle steps aside.

### `GraphCanvasAppFooter`

- Props: `statusBar`, `messageBar`, `left` / `right`.

---

## 3. Cross-region state (the orchestrator's real job)

Three pieces are *declared* in a region but *span* two, so `GraphCanvasApp` holds
the state and feeds both sides:

| State | Declared in | Drives |
|---|---|---|
| **devInfo on/off** | `header.devInfoInitiallyOn` | Header toggle ↔ Main `DevInfoLayer` visibility |
| **magnet** | header toolbar | Header toggle ↔ Main `HoverActivateBehaviour` degree |
| **backend** | header toolbar | Header switcher ↔ Main `<Canvas>` key (remount) |

This is exactly why the header `toolbar` is a render-prop carrying
`{ canvas, backend, setBackend, magnet, toggleMagnet }`. Region components stay
dumb; the orchestrator is the wire.

---

## 4. Package toolbar — magnet / backend / refresh

`GraphControlsToolbar` (full) covers `history · layout · selectMode · style ·
edit · view · grid`. The story `HeaderToolbar` additionally has **magnet**,
**backend** switcher, and **refresh** (+ layout/select/magnet `showMessage`
narration). Add these as **optional sections** (default off, gated by
`sections`), taking `magnet`/`onToggleMagnet` + `backend`/`onBackendChange`
props. With them on, `GraphControlsToolbar` fully replaces the story
`HeaderToolbar`, and `shell-toolbar.tsx` can be deleted.

---

## 5. How every use case sits on it

```tsx
// quick demo — one-liner, full default chrome
<GraphCanvasApp data={g} />

// website demo with controls — compose just the header you want
<GraphCanvasApp data={g}
  header={{ toolbar: (ctx) => <GraphControlsToolbar {...ctx} sections={{ grid: false }} /> }} />

// Visualiser — batteries via Main children + full toolbar
<GraphCanvasApp data={g} header={{ toolbar: (ctx) => <GraphControlsToolbar {...ctx} sections={{ magnet:true, backend:true }} />, devInfo:{} }}>
  <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />
  <ClickViewBehaviour id="click-view" panel={inspector} />
  <GraphClipboardProvider layerId="graph">…context menus…</GraphClipboardProvider>
</GraphCanvasApp>

// Drawing — own Main children replace the bundle; wrap lifts providers
<GraphCanvasApp wrap={withTool} config={DRAWING}
  header={{ title:'Drawing', toolbar:<ModellerToolbar bare/>, themeToggle:<DrawingTheme/> }}
  footer={{ messageBar:<CanvasMessageBar/> }}>
  <BackgroundLayer/> <GraphLayer data={SEED}/> <SystemTheme/>
  <DragPanBehaviour/> <WheelZoomBehaviour/>
  <GraphHistoryProvider layerId="graph"><DrawingTools/><HistoryBridge/></GraphHistoryProvider>
</GraphCanvasApp>
```

`data` → default bundle in Main. Provide Main children → you own Main. No flags.

---

## 5a. Layout, sizing & theming — serving widgets, not just full-page stories

Two target hosts, **opposite** layout demands:

| | Story | Website widget |
|---|---|---|
| Size | fills the iframe (`100vh`) | fills a bounded box (a card, a docs slot) |
| Chrome | full header/main/footer rails | often chrome-light / floating / none |
| Theme | one full-page theme is fine | must NOT hijack the host page; multi-instance safe |

The current foundation is built for the **story** side only. Verified facts:

- **`@invana/themes` `AppLayoutBase` is viewport-locked.** Root is `h-screen`;
  the main slot is a *fixed* `h-[calc(100vh-65px)]` (not `flex-1`). It cannot be
  embedded in a bounded box without fighting those utilities.
- **`AppLayoutBase` has no overlay / floating mode** and always renders the
  40px + 25px rails. (The `StoryCanvasShell` already collapses empty rails and
  implements `overlay` *itself*, not via `AppLayoutBase`.)
- **Our `applyChromeTheme` writes the global document root**
  (`document.documentElement` `data-theme` + `classList`). Fine for one full-page
  app; wrong for an embedded widget (hijacks the host theme; two widgets fight).
  `@invana/themes` itself does **no** global document writes — the global
  mutation is entirely our code.

**Therefore `GraphCanvasApp` owns a thin layout abstraction** instead of
hard-delegating to `AppLayoutBase`:

- **`overlay`** — `false` (default; in-flow **rails** — header/main/footer
  stacked, the full-page app look, may use `AppLayoutBase` internally) · `true`
  (full-bleed canvas with the regions **floating** over it — widgets *and* the
  existing Overlay story). "No chrome" needs no special mode — just omit the
  `header` / `footer` regions and that rail disappears.
- **sizing — fill-parent by default; never the viewport.** Our `<Canvas>` host
  div already defaults to `width:100%; height:100%` (it fills its parent, not the
  viewport) — so the only thing forcing full-screen today is `AppLayoutBase`
  (`h-screen` root + `h-[calc(100vh-65px)]` main). **Resolution: the orchestrator
  renders its own ~15-line layout and does NOT use `AppLayoutBase`** (whose
  `h-screen`/`calc` utilities can't be reliably overridden — equal-specificity
  Tailwind classes, source-order wins — without `!important` hacks against a
  published dep). The layout is a flex column reusing `@invana/ui`'s
  `NavHorizontal` for the bars (identical look):

  ```
  <div class="flex flex-col …" style={{ width, height, ...style }}>   // size from props
    {header && <NavHorizontal class="h-[40px] shrink-0 …"/>}
    <div class="relative flex-1 min-h-0"> …<Canvas/>… </div>          // ← flex-1 min-h-0
    {footer && <NavHorizontal class="h-[25px] shrink-0 …"/>}
  </div>
  ```

  `flex-1 min-h-0` on main is load-bearing: `flex-1` eats the space left by the
  rails; `min-h-0` lets it shrink so the 100%-height canvas can't overflow and
  shove the footer off-screen (the flexbox-canvas gotcha `AppLayoutBase`'s
  hard-coded `calc` sidestepped wrongly). API: defaults to filling the parent;
  `style` / `className` / `width` / `height` are escape hatches. Story → parent
  `100vh`; widget → `style={{ width, height }}` or a sized wrapper.
- **owning the layout also gives, for free:** overlay mode (`relative` root +
  `absolute inset-0` canvas + `absolute` floating bars), rail-collapse (omit a
  region → no empty bar), and a **scoped theme root** (theme classes land on this
  div, not `document.documentElement` — the §8.2-C widget-safe recipe). This
  supersedes risk **H** (`AppLayoutBase` is dropped, not merely wrapped).
- **scoped, controlled theme** — a `theme` prop (`'light' | 'dark' | 'system' |
  controlled`); theme classes scoped to the app's **own root element**, no
  `document.documentElement` writes when embedded. `'system'` (OS-follow) stays
  the default for the standalone/story path; the global-root flip becomes
  opt-in (`themeScope="document"`) for the genuine full-page app.

The region components are unchanged — this lives purely in the orchestrator's
layout/theme layer. It's what lets the *same* `GraphCanvasApp` be a story, a
full-page app, and an embeddable widget.

---

## 6. Story migration map

No story creates a `GraphCanvasApp` *wrapper component* — each story renders
`<GraphCanvasApp …>` directly, arranged for its use case. (The `use-cases/*` story
files are renamed to drop the `…App` component framing: Visualiser, Drawing.)

| Story | Today | After (all = `GraphCanvasApp`, arranged) |
|---|---|---|
| `use-cases/Visualiser` (was `GraphVisualiserApp`) | `StoryGraphApp` | **Visualiser** = full chrome on (toolbar + footer + minimap + inspector + menus + dev overlay) |
| `shell/BareCanvas` | `StoryGraphApp` (show* + subtractive behaviours) | header/footer omitted + Main behaviour toggles |
| `shell/SelectOnly` | `StoryGraphApp` | toolbar `sections` + behaviour props |
| `shell/Overlay` | `StoryGraphApp` (`overlay`) | `overlay` |
| `shell/CustomLayoutAndMenus` | `StoryGraphApp` | `layouts` + context-menu children |
| `shell/NoChrome` | `StoryCanvasShell` core | header/footer omitted |
| `use-cases/Drawing` (was `GraphModellerApp`) | `StoryCanvasShell` core + wrap | **Drawing** arrangement (§5) |
| `layouts/Acyclic+CyclicExamples` | `StreamingDemo`→`StoryCanvasShell` | `StreamingDemo` rebuilt on `GraphCanvasApp` |

> The existing `ModellerToolbar` (a shipped `@invana/canvas-react` export) keeps
> its name — only the *use-case / story* is renamed Modeller → **Drawing**.
> Renaming the toolbar component too would be a separate change; say if you want it.

### Deleted

`_shared/StoryGraphApp.tsx`, `_shared/StoryCanvasShell.tsx`, and the now-dead
helpers (`shell-toolbar.tsx`, `shell-config.ts`, `shell-bridges.tsx`,
`shell-menus.tsx`, their `_shared/index.ts` exports). Anything a surviving story
still needs (dataset/palette constants, default menu builders) moves into the
package or to its call site.

---

## 7. Staged execution

Stop after **Stage 1** for sign-off on the region API before migrating.

1. **`GraphCanvasApp` + region components** — rename `GraphCanvasLiteApp` →
   `GraphCanvasApp`; split into `GraphCanvasAppHeader` / `GraphCanvasAppMain` /
   `GraphCanvasAppFooter`; add the region option bags, the toolbar control
   context, cross-region state (devInfo / magnet / backend), `wrap`,
   `instanceKey`, `overlay`, `nodeLabel`/`graphLayer`, Main-children-replace-
   bundle. `<GraphCanvasApp data={g}/>` must still render the same default app.
   **Checkpoint: review region API.**
2. **Package toolbar** — add optional `magnet`/`backend`/`refresh` sections to
   `GraphControlsToolbar`; re-home default context-menu builders into the package.
3. **Migrate use-case + shell stories** — rewrite each as a `GraphCanvasApp`
   arrangement (Visualiser, Bare, SelectOnly, Overlay, CustomLayoutAndMenus,
   NoChrome, Drawing).
4. **Streaming** — rebuild `StreamingDemo` on `GraphCanvasApp`; migrate the two
   layout stories.
5. **Delete** `StoryGraphApp` / `StoryCanvasShell` / dead `_shared` helpers.
6. **Verify** — `pnpm check-types`, `pnpm --filter @canvas/storybook build`, then
   a manual pass over each migrated story.

---

## 8. Concerns, risks & open questions

### 8.1 Open questions — need a decision before/during Stage 1

1. **Region placement: slot-prop bags vs compound children.** Recommend
   **slot-prop** (`header` / `main` / `footer` option bags, with the region
   components as the defaults/building blocks) over child-introspection
   (`React.Children` matching `child.type === GraphCanvasAppHeader`) — it matches
   today's Lite slots, avoids fragility (wrapping a region breaks matching), and
   still lets advanced users render the region components directly. **Confirm.**
2. **Public-API rename.** `GraphCanvasLiteApp` is a public `@invana/canvas-react`
   export. No in-repo consumers found (only build artifacts reference it), so a
   hard rename is *safe in-tree* — but external consumers would break. Decide:
   hard rename, or keep `GraphCanvasLiteApp` as a deprecated re-export of
   `GraphCanvasApp` for a release? Needs a changeset / version bump either way.
3. **Backend switcher scope.** Flipping WebGL↔WebGPU **remounts the engine**
   (re-keyed `<Canvas>`) → live state is lost (selection, camera, layout
   positions, in-progress drawing). Fine for the read-only Visualiser; **wrong
   for Drawing mid-edit**. Decide: backend switcher is Visualiser-only (a header
   option the Drawing arrangement omits), or gated behind a confirm.
4. **`header` bag heterogeneity.** It mixes a node (`title`), a render-prop
   (`toolbar`, needs the control ctx), and option flags (`devInfo`,
   `devInfoInitiallyOn`). Acceptable, or split into clearer sub-shapes? **Confirm
   the prop shape during Stage 1 review.**
5. **`ModellerToolbar` → `DrawingToolbar`?** The use-case is renamed Drawing; the
   shipped toolbar component still reads "Modeller". Rename it too (wider public
   change) or leave it? (Also flagged in §6.)

### 8.2 Risks — could go wrong; mitigations

- **A. GPU context exhaustion (widget multi-instance).** Every `<Canvas>` creates
  its own WebGL/WebGPU context; browsers cap these (~8–16 WebGL contexts) and
  reclaim the oldest. A docs page with many graph widgets can hit context loss /
  blank canvases. *Mitigation:* lazy-init on viewport intersection; tear down
  off-screen instances; document the practical per-page limit; prefer WebGL for
  many small widgets.
- **B. SSR / hydration (website).** `<Canvas>` is client-only (inits in
  `useEffect`); `osPrefersDark()` read during render risks a hydration mismatch
  on a VitePress/Next host. *Mitigation:* render a stable initial theme, resolve
  OS/host theme post-mount.
- **C. Theme scoping — feasible, with traps.** Verified: the design-kit tokens
  flip via **non-root-anchored** selectors (`[data-theme="…-dark"]`,
  `.theme-…`, and Tailwind v4's `.dark` ancestor variant), so they cascade into a
  subtree → multiple themed widgets *can* coexist. **Recipe:** apply
  `data-theme` + `.theme-…` + `.dark/.light` to the **app's own root element**,
  not `document.documentElement`. **Traps:** (i) do **not** rely on
  `@invana/styling` `theme.css`'s `@media (prefers-color-scheme: dark)` block — it
  emits on `:root` and is global-only; (ii) `@invana/ui` base tokens live on
  `:root` and a nested `.dark` only overrides the `--sidebar-*` group, so the
  in-scope `.theme-…` class must (re)define the color tokens (it does). Residual:
  the full-page path historically wrote the document root — scoping is a
  behaviour change for standalone use (keep a `themeScope="document"` opt-in).
- **D. Cross-region controls vs custom Main.** `magnet` / `backend` / `devInfo`
  header controls drive Main pieces (`HoverActivateBehaviour` degree / `<Canvas>`
  key / `DevInfoLayer`). When an arrangement replaces Main (Drawing, Streaming),
  those targets may be absent → the controls become no-ops. *Mitigation:*
  arrangements enable only the header controls whose Main targets exist; document
  the coupling so it's a deliberate choice, not a surprise.
- **E. `wrap` nesting contract.** Drawing's `wrap` must sit **outermost** — above
  the orchestrator's lifted `CanvasContext` — so `GraphToolProvider` +
  `HistoryContext` are visible to header, main, and footer alike; the in-`Canvas`
  `GraphHistoryProvider` + a `HistoryBridge` lift the live history up into it.
  Get the order wrong and the toolbar's undo/redo desyncs from the in-canvas
  behaviours. *Mitigation:* pin the exact nesting order as a documented contract
  in Stage 1.
- **F. Overlay reimplementation parity.** We re-implement floating chrome in the
  package (since `AppLayoutBase` can't). Port `StoryCanvasShell`'s existing
  overlay faithfully; the design-kit `Nav*` components may need styling tweaks
  when floated over a full-bleed canvas.
- **G. Migration drift, no visual-regression net.** 8 stories migrate with only a
  manual pass (§7.6) — risk of silent behavioural change vs `StoryGraphApp`
  defaults (a default that the new app implements slightly differently).
  *Mitigation:* migrate one story at a time, eyeball each against `main`.
- **H. `AppLayoutBase` is full-page only — RESOLVED by §5a.** It's `h-screen`,
  fixed-height main, no overlay, always-on rails, and can't be reliably resized
  from outside. **Decision: drop it.** The orchestrator renders its own ~15-line
  flex-column layout (reusing `@invana/ui` `NavHorizontal` for the bars), which
  also delivers overlay, rail-collapse, and the scoped theme root. Residual: we
  re-own the look (must match the bar heights / borders `AppLayoutBase` used) and
  the `TooltipProvider` wrapper it provided.

### 8.3 Settled by investigation (don't re-litigate)

- `AppLayoutBase` is viewport-locked, rails-always-on, no overlay → orchestrator
  owns layout (§5a, risk H).
- Design-kit theme **can** be scoped to a subtree (risk C recipe) → widgets are
  viable.
- No in-repo consumers of `GraphCanvasLiteApp` → in-tree rename is safe
  (external story is open question 8.1.2).

### 8.4 Expectation-setting

- **Drawing / Streaming arrangements aren't shorter** than the old
  `StoryCanvasShell` calls — the win is *one* package app + named regions +
  package-level reuse (website), not fewer lines.
- **`GraphCanvasApp`'s surface is broad by design.** The default one-liner stays
  trivial; the breadth lives in the region option bags. If it starts feeling like
  two components bolted together, that's the signal to revisit the layering.

---

## 9. Out of scope

- No new engine primitives, behaviours, or layouts.
- No `@invana/canvas` internal changes.
- No API-reference docs (TSDoc on the new public surface only).
- No new stories beyond migrating existing ones.
```
