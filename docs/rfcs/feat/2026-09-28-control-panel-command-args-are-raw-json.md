---
id: feat-2026-09-28-control-panel-command-args-are-raw-json
type: feat
title: Commands describe their arguments, so the control-panel editor shows fields instead of raw JSON
status: landed
opened: 2026-09-28
decided: 2026-09-28
landed: 2026-09-28
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved }
---

# Commands describe their arguments, so the control-panel editor shows fields instead of raw JSON

| | |
|---|---|
| **Motivation** | In `ControlPanelsEditor`, a command item's `args` are a JSON textarea. To set `camera.fit`'s padding or point `graph.erase` at a layer, you have to know the key names from TSDoc and type valid JSON. This is R3 / D3 of `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio`. |
| **Design** | `CanvasCommand` gains an optional, UI-agnostic `args` descriptor: plain data in `canvas-core`, with value kinds and reference kinds (layer / behaviour / layout). canvas-ui maps it to `@invana/forms` fields. Commands without a descriptor, and keys the descriptor doesn't name, keep the JSON field, so nothing is ever dropped. |
| **Row status** | proposed 0 · accepted 0 · implemented 0 · landed 7 · deferred 1 · rejected 0 · superseded 0 |
| **Open decisions** | none — all as recommended |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | `args` is a JSON textarea for command, toggle and choice items | `file:packages/canvas-ui/src/editor-panels/control-panels/fields.ts#L101` | `argsJson` |
| M2 | Commands carry no argument metadata; `run(ctx, args?: unknown)` | `file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts#L25-L42` | type |
| M3 | Arguments are documented only in TSDoc tables, and every command casts per key with a duplicated `arg<T>()` helper | `file:packages/canvas/src/engine/builtinCommands.ts#L6-L19` / `#L38`, `file:packages/graph/src/canvas/graphCommands.ts#L7-L16` / `#L61` | read |
| M4 | A few argument keys recur across commands: `layerId` (7 commands), `value` (6), `clickSelectId` (5), `id` (3) | §2 catalogue | Explore report |
| M5 | Parse errors show as one `Alert` above Apply, not next to the field | `file:packages/canvas-ui/src/editor-panels/control-panels/ControlPanelsEditorPanel.tsx#L113-L123` | read |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Reuse `@invana/forms` `FieldConfig` as the descriptor on the command | rejected | `canvas-core` imports nothing (core-purity), and the engine and graph packages don't depend on the design kit |
| R2 | JSON Schema as the descriptor | rejected | it can't say "a registered layer id" without an extension, and it is heavy for about 25 keys |
| R3 | A UI-side table `COMMAND_ARG_SCHEMAS` in canvas-ui only (option A of D1) | kept as the alternative | no change to core, but provider and app commands would have to register a schema in a second place, far from the command |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `CommandArgSpec` in core: `{ kind, label?, description?, default?, options? }` with `kind`: `'string' \| 'number' \| 'boolean' \| 'enum' \| 'strings' \| 'layer' \| 'behaviour' \| 'layout' \| 'json'`, plus `pick?: true` for the `value` a choice supplies | `sym:CanvasCommand` | plain data, no UI types |
| 2 | `CanvasCommand.args?: Readonly<Record<string, CommandArgSpec>>` | M2 | a command documents its own arguments |
| 3 | canvas-ui `commandArgFields(spec, refs)` maps kinds to `FieldConfig`: number → `number`; boolean → `boolean`; enum → `select`; strings → comma-separated `text`; layer / behaviour / layout → `select` over the live registries (unknown ids stay, flagged "(not registered)"); json → `textarea` | `file:packages/canvas-ui/src/editor-panels/control-panels/fields.ts#L75-L78` (`namesOptions`) | real fields |
| 4 | The form stores `args.<key>` values, plus `argsRestJson` for keys the descriptor doesn't name. `formToItem` merges them back | `file:packages/canvas-ui/src/editor-panels/control-panels/mapping.ts#L153-L223` | a round-trip never drops data |
| 5 | `pick` arguments are hidden on `choice` items (picking supplies them) and shown on `command` / `toggle` items (a fixed value, e.g. a `tool.active` toggle) | `sym:ControlChoiceItemSpec` | no confusing `value` field on a picker |
| 6 | The connected editor reads descriptors with `canvas.commands.get(name)?.args` and reference lists with `canvas.layers` / `behaviours` / `layouts`, refreshing on `commands.subscribe` | `file:packages/canvas-ui/src/editor-panels/control-panels/ControlPanelsEditor.tsx#L80-L83` | overrides (e.g. the undoable `graph.clear`) show their own descriptor |
| 7 | Errors attach to the field (`FormField` error) as well as the summary `Alert` | M5 | fixes are found where they're made |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio` | relates-to | accepted | its R3 / D3; the JSON field stays as the fallback |
| `sym:SettingsSchemaEntry` (`file:packages/canvas-ui/src/editor-panels/canvas-settings/registry.ts#L239`) | relates-to | shipped | the `fields` + `toForm` / `toOptions` pattern that the step 3–4 mappers follow |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| A1 | defect | landed | `file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts` | `CommandArgSpec`, `CommandArgKind`, `CanvasCommand.args?` | commands can describe their arguments | low — additive, optional | — |
| A2 | defect | landed | `file:packages/canvas/src/engine/builtinCommands.ts` | descriptors on all 13 built-ins (`camera.zoomTo.levels` → `json`) | the engine's commands get fields | low | A1 |
| A3 | defect | landed | `file:packages/graph/src/canvas/graphCommands.ts` | descriptors on `select.mode`, `graph.*` (including `eraseCommand`), `tool.*`, `layout.activate` | the graph's commands get fields | low | A1 |
| A4 | defect | landed | `sym:GraphHistoryProvider`, `sym:GraphClipboardProvider`, `sym:CanvasThemeSync` | descriptors on their overrides and commands (`clickSelectId` → `behaviour`) | overrides don't lose their fields | low | A1 |
| A5 | defect | landed | `file:packages/canvas-ui/src/editor-panels/control-panels/{fields,mapping,types}.ts` | `commandArgFields`, `args.<key>` + `argsRestJson` mapping, `pick` handling | the editor shows fields | medium — a form-model change; the existing round-trip tests must keep passing | A1 |
| A6 | defect | landed | `sym:ControlPanelsEditor`, `sym:ControlPanelsEditorPanel` | pass descriptors + layer / behaviour / layout id lists as props (the controlled editor stays pure) | live reference pickers | low — new optional props | A5 |
| A7 | defect | landed | `ControlPanelsEditorPanel` | per-field error display | M5 | low | A5 |
| A8 | defect | deferred | `sym:ControlWidgetItemSpec.options`, choice `options` | the same descriptor for widget props and choice options | removes the two remaining JSON fields | medium — widgets are React components in canvas-ui, so the descriptor would sit on the widget registry. Deferred until A1–A7 prove the kinds | A1 |

## 5. Blast radius

Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `@invana/forms` `FieldType` (`text · textarea · number · boolean · checkbox · radio · select …`, no array type) | A5 maps onto it | `strings` and `json` need textarea / text fallbacks; no change to the design kit |

Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `api/canvas-core.surface.txt`, `api/canvas.surface.txt`, `api/canvas-store.surface.txt` | published API | additions | regenerate the snapshot |
| X2 | Saved `controlPanels` in serialised state | persistence | none — the spec shape is unchanged (`args` is still JSON) | none |
| X3 | App-registered commands without descriptors | third-party | keep the JSON field | none |
| X4 | `story:canvas-ui/editors/CanvasSettingsEditorPanel` (control-panels section) | story | args render as fields | none; checked by V3 |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build`, `check-types`, `lint` (surface regenerated), `test` | repo | green | all |
| V2 | pass | a graph test that registers the built-in and graph commands on a headless canvas, then asserts each command's descriptor keys equal the keys in its TSDoc table (a fixture list) | `packages/graph` tests | pass | A2, A3 |
| V3 | pass | headless Chromium: in the editor, add `camera.fit` → a Padding number and a Layer select appear; set them, Apply, click the button | `story:canvas-ui/editors/CanvasSettingsEditorPanel` | the camera fits that layer with that padding | A5, A6 |
| V4 | pass | **control**: load a panel whose args contain an undeclared key (`{ layerId: 'graph', foo: 1 }`), Apply without edits | same | `foo` survives in `argsRestJson` and in the saved spec | A5 |
| V5 | pass | `choice` item for `select.mode`: no `value` field; a `toggle` item for `tool.active`: `value` field shown | same | as described | A5 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where the descriptor lives | A: a UI-side table in canvas-ui · B: `CanvasCommand.args` in core | **B** — it travels with the command, overrides and app commands document themselves, and it is plain data, so core-purity holds | accepted |
| D2 | `select.mode.modes` / `labels` and `tool.nodeKind.kinds` are maps | A: `json` kind (textarea) for now · B: a `record` kind with a key/value list editor | **A** — three keys and rarely edited; B needs `useFieldArray` UI for little gain | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened from R3 / D3 of `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio` | proposed | awaiting approval |
| 2026-09-28 | Approved whole ("impleemnt all in this branch"); every decision as recommended | accepted | |
| 2026-09-28 | A1–A7 implemented on `feat/view-history` | accepted | V1: build, check-types, lint, tests. V2: `packages/graph/tests/canvas/definitionHistory.test.ts` pins every built-in and graph command's descriptor keys to its TSDoc table, and `pick` on the six picker values. V3: headless Chromium, `CanvasSettingsEditorPanel` — a `camera.fit` item shows **Padding** and **Layer** fields (the button itself was driven on `FullFeatured`). V4: `{ padding: 40, layerId: 'graph', foo: 1 }` shows `foo` in "More args (JSON)" and Apply writes all three back, recorded as `edit:control-panels`. V5: a `select.mode` choice shows Modes / Labels and no Mode field; a `tool.active` toggle shows its Tool field. Learned: the undoable `graph.clear` and the clipboard commands describe their own args (overrides don't inherit); `ERASE_ARGS` stays private — the providers reuse `eraseCommand`, which carries it; the editor refreshes its layer / behaviour / layout lists from bus events, and behaviours announce registration only, so an unregistered behaviour lingers in the picker until the next change; bad values are marked on their field with `setError` as well as listed |
| 2026-09-28 | `feat/view-history` merged to `main` | landed | Every implemented row → landed (all verification rows `pass`; build, check-types, lint, test green at merge). Deferred rows stay deferred, tracked in `doc:docs/commands-followups.md` |
