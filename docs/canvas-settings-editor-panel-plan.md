# CanvasSettingsEditorPanel — clean rewrite plan

**Status:** 🚧 in progress. A rewrite of `packages/canvas-ui/src/panels/canvas-settings/CanvasSettingsEditorPanel.tsx` into a well-named, single-responsibility set of files. No behaviour change — same UI, same live editing — just readable code and a clean canvas-store seam.

**Done so far:** the gate is gone — `CanvasSettingsPanelInner` is merged into a single `CanvasSettingsEditorPanel` (renamed from `CanvasSettingsPanel`) via the null-safe `store.view.definition` read in §3, and `applyMode` / `title` / `schemas` are real props. **Still to do:** the decomposition (§4) — extract `useCanvasSettings`, `SettingsGroupEditor`, `SettingsInstanceRow`, `InstanceSettingsForm`, `buildSettingsSections`, and the type renames in §5.

---

## 1. Why rewrite

The current file works but reads badly because **four unrelated jobs are interleaved in one 500-line file**, with names that don't say what they are:

| Job | Where it lives today | Problem |
|---|---|---|
| Read live settings (introspect registries + read store) | `CanvasSettingsPanelInner` body + `readOptions` + `defaultResolveKind` | store coupling tangled into the component |
| Engine ⇄ form mapping | `InstanceEditor` + `seedValues` / `deriveDefaults` | mapping logic mixed with rendering |
| Search / filter | `instanceHaystack` + inline `noMatches` + filter | scattered |
| Presentation (accordion, PanelStack, badges) | `renderSectionItems` + the `sections` map + the `Card` | the *simple* part, buried under the other three |

Two structural smells on top of that:

- **`CanvasSettingsPanel` → `CanvasSettingsPanelInner` indirection.** The outer component exists only to guard the null-until-ready canvas context (`useCanvas()` / `useGraphCanvasOptions()` **throw** on a null canvas, and `GraphCanvasApp`'s docked region mounts the panel before the engine is ready). It reads as pointless forwarding.
- **Names that hide intent.** `InstanceEditor`, `CanvasSettingsInstance`, `CanvasSettingsDefinition`, `SettingsSchemaEntry` — none say "form", "one row", "the whole model", "one kind's schema".

**Goal:** the component should read as *"read the settings from canvas-store, show them, write edits back to canvas-store"* — a pure projection of canvas-state — with each concern in its own small, named unit.

---

## 2. Principles

1. **The panel is a pure projection of canvas-state.** It reads settings **from** `canvas.store.view.definition` and writes edits **to** it via `canvas.update(...)`. No local copy of settings state; the store is the single source of truth.
2. **All store coupling lives in exactly one hook** (`useCanvasSettings`). Everything else is presentational and engine-free — trivially readable and Storybook-able.
3. **One file, one responsibility, one honest name.** A reader opening any file knows what it does from the filename.
4. **One component, no gate indirection.** The null-until-ready case is handled by a **null-safe store read** inside the hook, so the panel is a single component that `return null`s at the end until the engine is ready (legal — hooks all run unconditionally; only the final render is conditional).

---

## 3. Source of truth: canvas-store

The panel reads and writes **`store.view.definition`** (the serialisable settings slice: `{ layers, behaviours, layouts, activeLayout }`), reactively.

**Read (defaults):** an instance's editable defaults are resolved in this precedence, all inside the hook:

1. **`store.view.definition[section][id]`** — the configured settings (source of truth for anything the user/engine has set).
2. **the live instance's current options** (`getOptions()` / `.options`) — seeds anything not yet in the store slice, so a freshly-registered instance shows its real runtime defaults.
3. **schema field defaults** (`deriveDefaults` from the kind's `fields`) — the final fallback so every control is a controlled input.

**Introspection is still required for one thing only:** the store is domain-free — it stores config by `id` but **not each instance's `kind`**. So the hook introspects the live registries (`canvas.layers/behaviours/layouts.list()`) once per canvas to get `{ id, kind }`, then resolves the kind → schema. This is the *only* non-store read, and it's isolated in the hook.

**Write:** every edit is an **engine-shaped patch** applied via `canvas.update({ [section]: { [id]: patch } })` — which patches `store.view.definition`, and the renderer reacts. Field edits map through the schema's `toOptions`; toggles write `{ enabled }`; layout activation writes `{ activeLayout: id }`.

**Null-safe reactive read (this is what removes the gate):** instead of `useGraphCanvasOptions()` (which calls `useCanvas()` → throws on a null canvas), the hook reads the slice with a null-tolerant `useSyncExternalStore` over the kernel `select` port:

```ts
// pseudo — inside useCanvasSettings
const view = canvas?.store.view ?? null;                       // null-safe
const slice = useMemo(() => (view ? select(view, s => s.definition) : null), [view]);
const definition = useSyncExternalStore(
  slice?.subscribe ?? NOOP_SUBSCRIBE,     // module-stable no-op when not ready
  slice?.get ?? GET_EMPTY_DEFINITION,     // module-stable empty slice
  slice?.get ?? GET_EMPTY_DEFINITION,
);
```

Because every hook now runs unconditionally regardless of readiness, the component needs no `*Inner` split — it just `return null`s at the end while `canvas` is null.

---

## 4. Architecture

The panel is a **shell** that renders one **group editor per category** (Layers / Behaviours / Layouts); each group editor renders its instances, each instance a form. This is the decomposition to aim for — the panel itself renders almost nothing directly.

```
CanvasSettingsEditorPanel                 ← shell: hook + search, renders a <PanelStack> whose 3 sections
│                                            are the 3 group editors. ~40 lines.
│  useCanvasSettings()                     ← THE store seam. null-safe read of store.view.definition
│                                            + registry introspection (kinds) → SettingsModel; { ready, groups, apply }.
│                                            The only file that touches canvas-react store hooks / canvas.update.
│
├─ SettingsGroupEditor (group='layers')    ← one component, rendered once per category. Renders the group's
├─ SettingsGroupEditor (group='behaviours')   instance rows; owns the group-specific affordance (enable toggle
├─ SettingsGroupEditor (group='layouts')      for layers/behaviours, "make active" for layouts) + empty state.
│     └─ SettingsInstanceRow               ← one accordion row (title · type · toggle/active · badges · expander).
│            └─ InstanceSettingsForm        ← the per-instance controlled form. Owns its own useForm; seeds from
│                                             the entry's settings, emits an engine patch on change (live)/Apply.
│                                             Stays a component: each open row needs independent form state.
│
├─ settings-schema-registry               ← kind → { typeLabel, fields, toForm, toOptions }. (was registry.ts)
└─ form-mapping                           ← pure helpers: deriveDefaults, seedForm, matchesQuery.
```

**The load-bearing constraint — the per-instance form is *schema-generated*, not hand-written per kind.** "A separate component per layer / behaviour / layout" means **per category** (the 3 `SettingsGroupEditor`s) and **per instance** (`InstanceSettingsForm`) — but there is **not** a hand-coded `DragPanForm` / `BackgroundLayerForm` / … for each of the ~50 kinds. Each `InstanceSettingsForm` renders from the kind's `fields.ts` + `mapping.ts` in `settings-schema-registry` (root rule 12). That's deliberate: adding a new behaviour/layer/layout stays "one `FieldConfig` + one mapper line", not a new form component. Hand-writing a form per kind would be ~50 components and would drop the auto-generated editors the whole system is built on — a different (and much larger) project. See §9.1.

Because layers / behaviours / layouts differ only in one affordance (enable-toggle vs. make-active) and are otherwise the same list-of-rows, `SettingsGroupEditor` is **one component reused three times**, not three near-duplicate files. (If you'd rather have three explicitly-named wrappers — `LayersSettingsEditor` etc. — they'd be one-line shells over `SettingsGroupEditor`; call it in §9.)

**Data flow (one direction each way):**

```
canvas-store ──read──▶ useCanvasSettings ──▶ SettingsModel ──▶ buildSettingsSections ──▶ PanelStack (rows + forms)
     ▲                                                                                              │
     └──────────────── canvas.update(patch) ◀── apply() ◀── InstanceSettingsForm onChange ◀────────┘
```

---

## 5. Naming conventions & rename table

Types describe the **model**, components describe the **thing on screen**, the hook describes the **seam**.

| Today | New | Why |
|---|---|---|
| `CanvasSettingsPanel` + `CanvasSettingsPanelInner` | **`CanvasSettingsEditorPanel`** (one component) | it *is* the editor panel; drop the gate indirection |
| `InstanceEditor` | **`InstanceSettingsForm`** | it's a form for one instance, not an "editor" |
| — (inline `renderSectionItems`) | **`SettingsGroupEditor`** | one category (layers/behaviours/layouts) = one component, reused 3× |
| — (inline per-row JSX) | **`SettingsInstanceRow`** | one row = one component |
| `CanvasSettingsDefinition` | **`SettingsModel`** | the whole model the panel renders |
| `CanvasSettingsInstance` | **`SettingsEntry`** | one row's data (id · kind · settings · enabled) |
| `SettingsSection` (`'layers'|…`) | **`SettingsGroupKind`** | it's the group discriminator |
| — | **`SettingsGroup`** | `{ kind, entries }` — a folder + its entries |
| `SettingsSchemaEntry` | **`SettingsSchema`** | one kind's `{ fields, toForm, toOptions }` |
| `registry.ts` / `DEFAULT_CANVAS_SETTINGS_SCHEMAS` | `settings-schema-registry.ts` / `DEFAULT_SETTINGS_SCHEMAS` | says what it is |
| `readOptions`, `defaultResolveKind`, `seedValues`, `instanceHaystack` | `form-mapping.ts`: `deriveDefaults`, `seedForm`, `matchesQuery`; hook-local `resolveKind` | grouped + descriptive |

---

## 6. File layout

```
packages/canvas-ui/src/editor-panels/canvas-settings/
├─ CanvasSettingsEditorPanel.tsx     the shell (hook + search + <PanelStack> of 3 group editors)
├─ useCanvasSettings.ts              store read/write seam (null-safe) — the ONLY store-coupled file
├─ SettingsGroupEditor.tsx           one category's list of instance rows (reused 3×)
├─ SettingsInstanceRow.tsx           one accordion row (title · toggle/active · expander)
├─ InstanceSettingsForm.tsx          per-instance controlled form + live-apply (schema-generated)
├─ settings-schema-registry.ts       kind → SettingsSchema (fields + mappers)
├─ form-mapping.ts                   deriveDefaults / seedForm / matchesQuery
├─ types.ts                          SettingsModel / SettingsGroup / SettingsEntry / SettingsSchema / SettingsGroupKind
└─ index.ts                          public exports
```

> **Location decision (§9):** because the panel is now store-connected *and* an "EditorPanel", it can sit under `editor-panels/canvas-settings/` (co-located with the other `*EditorPanel`s) rather than `panels/`. The registry/types moved into `panels/canvas-settings/` in the last change would move back here. Alternatively keep it in `panels/`. **Recommend `editor-panels/`** for name consistency; confirm before moving.

---

## 7. Public API (unchanged surface)

```ts
export { CanvasSettingsEditorPanel } from './CanvasSettingsEditorPanel';
export type { CanvasSettingsEditorPanelProps } from './CanvasSettingsEditorPanel';
export { DEFAULT_SETTINGS_SCHEMAS } from './settings-schema-registry';
export type { SettingsSchema, SettingsModel, SettingsEntry, SettingsGroupKind } from './types';
```

`CanvasSettingsEditorPanelProps`:

```ts
interface CanvasSettingsEditorPanelProps {
  className?: string;
  /** Map a live instance → schema `kind`. Default `instance.kind ?? constructor.name`. */
  resolveKind?: (instance: unknown) => string | undefined;
  /** kind → schema. Default DEFAULT_SETTINGS_SCHEMAS. */
  schemas?: Record<string, SettingsSchema>;
  /** 'live' (default) applies each edit immediately; 'manual' batches behind Apply. */
  applyMode?: 'live' | 'manual';
  /** Heading. Default 'Canvas Settings'; null to omit. */
  title?: ReactNode;
}
```

(This keeps the API-improvement from the current merge — `schemas` / `applyMode` / `title` are real props, not hardcoded.)

---

## 8. Migration steps

Behaviour-preserving; each step compiles green.

1. **Extract types** → `types.ts` with the new names (alias old names temporarily if needed).
2. **Extract the registry** → `settings-schema-registry.ts` (rename export), and the pure helpers → `form-mapping.ts`.
3. **Write `useCanvasSettings`** — move introspection + the null-safe store read + `apply` out of the component. Returns `{ ready, groups, apply }`.
4. **Extract `InstanceSettingsForm`** (rename of `InstanceEditor`, unchanged logic) and **`SettingsInstanceRow`** (the row JSX out of `renderSectionItems`).
5. **Extract `SettingsGroupEditor`** (one category's list of rows + its toggle/active affordance + search filter for that group).
6. **Rewrite `CanvasSettingsEditorPanel`** as the shell: `useCanvasSettings()` → build the 3 `<PanelStack>` sections whose content is `<SettingsGroupEditor group=… />` → `<Card><Search/><PanelStack/></Card>`, `return null` until `ready`. Delete the `*Inner` gate.
7. **Update barrel + root `index.ts`** exports to the new names; rename the story to `CanvasSettingsEditorPanel`; verify types build + storybook.
8. **Docs:** update `packages/canvas-ui/CLAUDE.md` (folder note + naming) and `apps/storybook/CLAUDE.md` (editors bucket).

---

## 9. Open decisions

1. **Per-instance form: schema-generated (recommended) vs hand-written per kind.** The plan keeps the schema-driven `InstanceSettingsForm` (renders from `fields.ts` + `mapping.ts` per kind — root rule 12). The alternative — a bespoke React form component per kind (`DragPanForm`, `BackgroundLayerForm`, …) — is ~50 components, drops the auto-generated editor system, and makes every new behaviour/layer/layout cost a hand-written form. **Strongly recommend schema-generated.** The category-level and instance-level component split (§4) gives the "clean, separate components" readability without paying that cost.
2. **Group editors: one reused component vs three named wrappers.** `SettingsGroupEditor` rendered 3× (recommended — the three differ only by one affordance prop) vs `LayersSettingsEditor` / `BehavioursSettingsEditor` / `LayoutsSettingsEditor` one-line shells over it (if explicit names read better to you).
3. **Component name.** `CanvasSettingsEditorPanel` (recommended — matches the `*EditorPanel` convention). Re-adopts the merged-away name, now as a **single store-connected component**, not a controlled/connected pair.
4. **Folder.** `editor-panels/canvas-settings/` (recommended, name-consistent) vs keep in `panels/`. See §6.
5. **Store-read seam.** Hand-rolled null-safe `useSyncExternalStore` (§3) vs adding a null-tolerant `useGraphCanvasOptions`/`useStore` variant to `@invana/canvas-react` (reusable, but a canvas-react change). Recommend the local seam first; promote to canvas-react only if a second panel needs it.
6. **`applyMode` default** — keep `'live'`.

---

## 10. Non-goals

- No change to the schema registry contents or the engine ⇄ form mappers (only its filename/export name).
- No change to `InstanceSettingsForm`'s field-diff / live-apply logic — it's correct; it just moves to its own file.
- No new features (grouping, per-field search highlight, etc.).
