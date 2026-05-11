# LayersPanelLayer — devtool overlay listing every layer with a visibility checkbox

> Note: per the user's standing preference, plans normally live in the repo
> root (e.g. `layers-panel-plan.md`). This file is the plan-mode artifact —
> after approval, I'll copy it to the repo as `layers-panel-plan.md`.

## Context

The engine already ships `DevInfoLayer` — a `ScreenLayer` that renders a DOM
overlay in a configurable corner showing camera, pointer, FPS, etc. The user
wants a second devtool of the same style: a panel that **enumerates every
`Layer` currently attached to the `Canvas`** and lets the developer toggle
each layer's visibility from a checkbox, à la the browser DevTools "elements"
panel for canvas layers.

The new layer is a developer aid, not part of any domain. It mirrors
`DevInfoLayer` exactly so the two look and feel related, and so future panels
(BehavioursPanelLayer, etc.) can extract a shared base later.

## Design decisions (locked with the user)

- **Label per row:** `layer.id` only (no base-class changes, already on `ILayer`).
- **Toggle per row:** a single checkbox bound to `layer.visible`.
- **No new events.** `layer.visible` is a plain mutable boolean today; the
  panel mutates it directly on checkbox change and the engine's existing
  per-tick render picks up the new flag. Re-render of the panel itself is
  driven by `layer:added` / `layer:removed` plus the local checkbox handler.
- **Self-handling:** the panel filters out its own `id` from the list, so the
  user can't accidentally hide the panel via the panel.

## Files

### New
- `packages/canvas/src/layers/LayersPanelLayer.ts` — the layer class.

### Modified
- `packages/canvas/src/index.ts` — re-export `LayersPanelLayer` and its types
  alongside `DevInfoLayer`.
- `apps/storybook/stories/Layers/LayersPanelLayer.stories.ts` (new file under
  the existing `Layers/` story folder) — mirrors `DevInfoLayer.stories.ts`.

### Reference (read, do not modify)
- `packages/canvas/src/layers/DevInfoLayer.ts` — pattern to clone.
- `packages/canvas/src/layers/ScreenLayer.ts` — base class.
- `packages/canvas/src/layers/Layer.ts` — `ILayer.visible`, `ILayer.id`.
- `packages/canvas/src/registries/LayerRegistry.ts` — `list()`,
  `'layer:added'`, `'layer:removed'`.
- `apps/storybook/stories/Layers/DevInfoLayer.stories.ts` — story template.

## Implementation

### `LayersPanelLayer.ts` shape

```ts
import { ScreenLayer, type ScreenLayerHit } from './ScreenLayer';

export type LayersPanelCorner =
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface LayersPanelLayerOptions {
  corner?: LayersPanelCorner;       // default 'top-right'
  enabled?: boolean;                // default true
  fontSize?: number;                // default 11
  opacity?: number;                 // default 0.92
  backgroundColor?: string;         // default 'rgba(10,10,10,0.82)'
  textColor?: string;               // default '#c8d3e0'
  accentColor?: string;             // default '#4fc3f7'
  /** Hide rows for layers whose id matches. Useful for hiding 'background'
   *  or the panel's own siblings. Self id is always filtered. */
  hideIds?: readonly string[];
}

export interface LayersPanelLayerCtorOptions extends LayersPanelLayerOptions {
  id?: string;       // default 'layers-panel'
  zIndex?: number;   // default 9998 (just below DevInfoLayer's 9999)
}

interface LayersPanelState { enabled: boolean }

export class LayersPanelLayer
  extends ScreenLayer<LayersPanelLayerOptions, LayersPanelState>
{
  constructor(opts: LayersPanelLayerCtorOptions = {}) {
    const { id, zIndex, ...rest } = opts;
    super({
      id: id ?? 'layers-panel',
      options: rest,
      zIndex: zIndex ?? 9998,
      hittable: false,    // engine hit-testing skips it; DOM still receives clicks
      cullable: false,
    });
  }

  override hitTest(_x: number, _y: number): ScreenLayerHit | null { return null; }

  protected createState() { return { enabled: true }; }

  // onMount: build DOM overlay; subscribe to layer:added / layer:removed
  // onUnmount: tear down listeners + DOM
  // setEnabled / enable / disable / setOptions — same surface as DevInfoLayer
  // _mountOverlay, _applyStyles — copied from DevInfoLayer, with one diff:
  //    container div has pointer-events:auto (checkboxes need clicks)
  //    panel still doesn't block canvas: row layout uses pointer-events:none
  //    on labels, pointer-events:auto only on the <input type=checkbox>.
  // _render: build innerHTML from ctx.layers.list()
}
```

### `_render` sketch

```ts
private _render(): void {
  if (!this._overlay || !this.ctx) return;
  const all = this.ctx.layers.list().filter(l =>
    l.id !== this.id && !this._opts.hideIds?.includes(l.id)
  );
  const rows = all.map(l => `
    <label class="lpl-row" data-layer-id="${l.id}">
      <input type="checkbox" ${l.visible ? 'checked' : ''}
             data-layer-id="${l.id}" />
      <span>${escapeHtml(l.id)}</span>
    </label>
  `).join('');
  this._overlay.innerHTML = `${header}${rows}`;
  // re-bind change listener once via event delegation on the container
}
```

Use a single delegated `change` listener on the container:
```ts
this._overlay.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.tagName !== 'INPUT' || !t.dataset.layerId) return;
  const layer = this.ctx!.layers.get(t.dataset.layerId);
  if (layer) layer.visible = t.checked;
  // no re-render needed: the checkbox is already the source of truth for
  // its own row. Other rows are unaffected.
});
```

### Refresh triggers
- `ctx.events.on('layer:added', () => this._render())`
- `ctx.events.on('layer:removed', () => this._render())`
- Initial `_render()` at the end of `_mountOverlay`.

We do **not** subscribe to anything for `visible` changes — there's no event
emitted when other code flips `layer.visible`. v1 accepts this: checkboxes
reflect the value at panel-open and follow user clicks; programmatic visibility
flips from other code won't update the checkbox until the next add/remove
churn. Acceptable for a devtool.

### Styles
Clone `_applyStyles` from `DevInfoLayer.ts` with:
- `pointer-events:auto` (was `none`) on the root.
- `min-width: 200px` (no need for the wide pointer-coords block).
- Row CSS: `display:flex; gap:6px; align-items:center; padding:2px 0;`.

### Storybook
`apps/storybook/stories/Layers/LayersPanelLayer.stories.ts` —
mirror `DevInfoLayer.stories.ts`:
- Create canvas + register pan/zoom behaviours.
- Add a `BackgroundLayer` + a `DevInfoLayer` + a content layer so the panel
  has multiple rows to show.
- Add `new LayersPanelLayer({ corner: 'top-right' })`.
- lil-gui knobs: `corner`, `fontSize`, `opacity`, `enabled` (calls
  `setEnabled`), and a "Add demo layer" / "Remove demo layer" pair of
  buttons so the user can see rows appear/disappear live via the
  `layer:added` / `layer:removed` events.
- Per the project memory: all of this code goes **inside the `play`
  function**, no module-level helpers.

## Verification

1. `pnpm --filter @invana/canvas build` — type-checks cleanly.
2. `pnpm --filter @canvas/storybook dev` → open
   `http://localhost:6006/?path=/story/layers-layerspanellayer--default`.
3. Verify:
   - Panel renders in the chosen corner.
   - One row per layer; the panel's own row is absent.
   - Unchecking a row hides that layer (e.g. background disappears).
   - Re-checking restores it.
   - Clicking "Add demo layer" appends a new row; "Remove" deletes it.
   - lil-gui `enabled = false` removes the panel DOM; `true` restores it.
4. Existing DevInfoLayer story still works when both layers are mounted on
   the same canvas (z-order: DevInfo on top).

## Out of scope (deliberate, can follow as v2)

- A shared base class for floating DOM panels.
- Drag-to-reorder rows / zIndex spinner.
- Hittable toggle, opacity slider per layer.
- An event on `Layer.visible` mutation (so the panel auto-syncs when other
  code flips it). Worth doing only if we add other UIs that mutate visibility.
- An icon vendor — the panel is text-only to honour the
  "canvas is icon-vendor-agnostic" rule (project memory).
