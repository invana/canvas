---
id: fix-2026-09-28-command-palette-shortcuts-provider-commands
type: fix
title: The inline palette misses option changes, Option/Shift shortcuts never fire, and provider commands shadow GraphCanvas's with weaker ones
status: accepted
opened: 2026-09-28
decided: 2026-09-28
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: rfc:feat-2026-09-29-commands-stop-at-saved-control-panels
relations:
  - { predicate: caused-by, object: "file:packages/canvas-ui/src/menus/CommandPalette.tsx#L136-L162" }
  - { predicate: caused-by, object: "file:packages/canvas/src/behaviours/KeyboardShortcutsBehaviour.ts#L146-L155" }
  - { predicate: caused-by, object: "file:packages/canvas-react/src/providers/GraphClipboardProvider.tsx#L110-L150" }
  - { predicate: caused-by, object: "file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx#L98-L133" }
  - { predicate: manifests-in, object: "story:canvas-ui/apps/GraphCanvasApp/CommandPalette" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-29-commands-stop-at-saved-control-panels" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic" }
---

## Summary

| | |
|---|---|
| **What breaks** | (A) The `variant="inline"` palette never rebuilds its rows when a pick command's `options()` change, so a layout added after mount never appears and a removed one stays listed. (B) Any binding whose key needs Option or Shift to type never fires: `alt+<letter>` on macOS, `mod+plus`, `shift+<digit>`. (C) On a `GraphCanvas` with `history: false` inside both providers, the providers' `clipboard.*` / `history.*` / `graph.erase` / `graph.clear` sit on top of GraphCanvas's own. They ignore `args.layerId` (clipboard, undo/redo) and carry no `category` or `keywords` |
| **Root cause** | (A) The palette's `useSyncExternalStore` snapshot is the joined command *names*, so an `invalidate()` that changes options but no names gives an equal snapshot. (B) The combo is built from `KeyboardEvent.key`, which is the typed character (`Ω`, `+`, `!`), not the physical key. (C) The providers hand-roll their own command definitions instead of reusing `@invana/graph`'s `editCommands` + `GRAPH_META` |
| **Not the cause** | `CommandRegistry` notifying (it does fire on `invalidate`), cmdk filtering, `normalizeShortcut` parsing, the providers' bridge/skip rules (already reviewed) |
| **Defect rows** | `P1` `P2` (A) · `K1` `K2` (B) · `C1` `C2` `C3` (C) |
| **Other rows** | `K3` (TSDoc) |
| **Open decisions** | none. `D-1` (a) · `D-2` provider's `layerId` · `D-3` no · `D-4` (a) temporary story, all accepted 2026-09-28 |
| **Row status** | proposed 0 · accepted 0 · implemented 8 · landed 0 · rejected 0. Every check covering P1, P2, K3, C1–C3 passes, so those land on merge. K1/K2 also wait on V5 (physical keys, maintainer) |

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Inline palette: a layout registered after mount never shows up as a `Layout: …` row | `story:canvas-ui/apps/GraphCanvasApp/CommandPalette` (`variant="inline"`) | `file:packages/canvas-ui/src/menus/CommandPalette.tsx#L136-L139` snapshot = `list().join('\n')`; `layout.activate` is already registered, so its name is in the list before and after |
| S2 | Inline palette: rows for a removed layout stay listed (running one is a no-op, guarded by `layouts.has`) | same | same, plus `file:packages/graph/src/canvas/graphCommands.ts#L376-L379` |
| S3 | The dialog variant looks correct | `sym:CommandPalette` (`variant="dialog"`) | the memo depends on `open` (`#L142`, `#L162`), so every open rebuilds |
| S4 | macOS: `alt+z` never fires | `sym:KeyboardShortcutsBehaviour.handleKey` | ⌥Z gives `key: 'Ω'`, so `eventShortcut` returns `alt+ω`; the binding normalises to `alt+z` |
| S5 | US layout: `mod+plus` never fires | same | ⌘/Ctrl + Shift + `=` gives `key: '+'`, `shiftKey: true`, so the combo is `ctrl+shift++`; the binding is `ctrl++` |
| S6 | US layout: `shift+1` never fires | same | the combo is `shift+!` |
| S7 | A saved `clipboard.copy { layerId: 'other' }` acts on the provider's layer | `file:packages/canvas-react/src/providers/GraphClipboardProvider.tsx#L124-L129` | `run` closes over the provider's `clipboard` and never reads `args.layerId`; `SELECTION_ARGS` (`#L57-L59`) doesn't even describe `layerId` |
| S8 | `history.undo { layerId: 'other' }` undoes the provider's layer | `file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx#L106-L115` | `run: (c) => undoNewest(c, history)`, `args` ignored |
| S9 | Palette groups Cut / Copy / Paste / Delete / Undo / Redo / Erase / Clear canvas under **Other**, not **Edit** | `sym:CommandPalette` over the providers' registrations | none of the provider registrations set `category` / `keywords`; `GRAPH_META` (`file:packages/graph/src/canvas/graphCommands.ts#L384-L399`) is applied only in `registerGraphCommands` (`#L405-L409`) |
| S10 | Under `<GraphHistoryProvider layerId="main">`, a bare `graph.clear` clears `'graph'` while bare `history.undo` undoes `'main'` | `file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx#L49-L52` | `targetLayer` defaults to `'graph'`, not the provider's `layerId` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The registry doesn't notify on option changes | no | `invalidate()` → `notify()` (`file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts#L328-L330`, `#L367-L369`); `scene:layout:add` / `:remove` call it (`file:packages/canvas/src/engine/Canvas.ts#L205-L213`, `#L392-L393`). The signal arrives, but the snapshot doesn't change |
| R2 | cmdk caches the items | no | the palette owns filtering (`shouldFilter={false}`, `#L214`); `entries` itself is stale |
| R3 | `normalizeShortcut` mis-parses `mod+plus` | no | it yields `ctrl++` / `meta++` (`#L122-L140`, `plus` → `+` alias). The *event* side is wrong |
| R4 | Always resolve letters from `KeyboardEvent.code` | rejected as the fix | `code` is the physical key, so on AZERTY Ctrl+Z (key `z`) is `KeyW`. Resolving from `code` first would break `mod+z` / `mod+a` for AZERTY and Dvorak users. `code` is used only when `key` isn't already an ASCII letter or digit (K1) |
| R5 | The providers' skip/bridge rules are wrong | out of scope | already reviewed; the defect is *what* they register, not *when* |

## 2. Diagnosis

### A — palette (S1–S3)

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| A1 | A layout registers → `scene:layout:add` → `commands.invalidate()` → subscribers fire | `file:packages/canvas/src/engine/Canvas.ts#L392-L393` | the palette's `subscribe` callback runs |
| A2 | React calls `getSnapshot` = `list().join('\n')` | `file:packages/canvas-ui/src/menus/CommandPalette.tsx#L138` | same names → `Object.is`-equal string → no re-render |
| A3 | `entries` depends on `[inline, open, names, commands, resolved]` | `#L162` | `resolved.commands.options('layout.activate')` is never re-read |
| A4 | Inline: `open` never changes | `#L142` | the rows stay stale for the lifetime of the mount. Dialog: `open` flips on every open, which hides the defect (S3) |

### B — shortcuts (S4–S6)

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| B1 | `eventShortcut` builds `mods + e.key.toLowerCase()` | `file:packages/canvas/src/behaviours/KeyboardShortcutsBehaviour.ts#L146-L155` | the key is the *produced* character |
| B2 | On macOS, Option changes the produced character (`Ω`, `å`, `¸`, or `Dead`) | platform behaviour | every `alt+<letter>` combo becomes `alt+<symbol>` (S4) |
| B3 | A shifted punctuation key reports both `shiftKey: true` and the shifted glyph | platform behaviour | `ctrl+shift++` ≠ `ctrl++` (S5); `shift+!` ≠ `shift+1` (S6) |
| B4 | `handleKey` compares exactly one combo against the binding's alternatives | `#L217-L220` | no fallback, so the binding silently never fires |

`DEFAULT_SHORTCUTS` (`#L55-L63`) only uses letters with `mod`/`shift`, and `delete`/`backspace`/`escape`, which come through unchanged. That's why the defaults work and only user bindings in `definition.behaviours` hit B2/B3.

### C — provider commands (S7–S10)

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| C1 | `GraphCanvas` registers `editCommands(access)` + `GRAPH_META`, where `access` is per layer and `layerIdOf(args)` defaults to `'graph'` | `file:packages/graph/src/canvas/graphCommands.ts#L202-L250`, `#L405-L409`; `file:packages/graph/src/canvas/GraphCanvas.ts#L132-L135` | the canvas's commands honour `args.layerId` and carry `category: 'Edit'` |
| C2 | With `history: false`, `GraphHistoryProvider` builds its own history and registers `history.*` / `graph.clear` / `graph.erase` | `file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx#L98-L133` | its entries sit on top of C1's in the registry stack |
| C3 | Because the ancestor history ≠ the canvas's (`null`), `GraphClipboardProvider` also registers `clipboard.*` / `graph.erase` | `file:packages/canvas-react/src/providers/GraphClipboardProvider.tsx#L104`, `#L110-L150` | same |
| C4 | Those definitions are written by hand: closed over one layer, with no `layerId` read and no `category` / `keywords` | the two blocks above | S7, S8, S9. The canvas's per-layer clipboard for `'other'` still exists (`GraphCanvas.clipboard(id)`, `#L160`) but can no longer be reached by command |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Read `useSyncExternalStore` semantics against A2 | an equal snapshot never schedules a render | A is a snapshot-identity defect, not a notification defect |
| T2 | `eventShortcut({ key: 'Ω', altKey: true, … })` by inspection | `'alt+ω'` | B1/B2 |
| T3 | `grep category packages/canvas-react/src/providers` | no hits | C4 |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-29-commands-stop-at-saved-control-panels` | design of record (K1, U3, U5, U7) | accepted | the palette/shortcut design; this RFC only fixes its implementation |
| `rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` | relates-to | landed | its rule: one shared body per command. C1 extends that to the *definition* (args + meta) |
| `doc:docs/commands-followups.md` | relates-to | — | follow-up list; add D-3 there if deferred |

## 4. The fix

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| P1 | defect | implemented | `sym:CommandRegistry` (`file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts#L367-L369`) | add a read-only `version: number` getter, bumped in `notify()` (register / unregister / pop / `invalidate` / dispose). TSDoc: "a `useSyncExternalStore` snapshot" | a cheap, correct snapshot for any UI that re-reads on `subscribe` | low. Additive class member; the `api/canvas-core.surface.txt` export-name list doesn't change | — |
| P2 | defect | implemented | `sym:CommandPalette` (`#L136-L162`) | snapshot = `commands.version`; `entries` memo keyed on it and reads `list()` inside | rows rebuild on every registry signal, so options added or removed show up in the inline variant | low. Rebuilds a few dozen rows per `invalidate` (history / clipboard changes); `useCommandStates` already re-reads on the same signal | P1 |
| K1 | defect | implemented | `sym:eventShortcut`, `sym:ShortcutKeyEvent` (`file:packages/canvas/src/behaviours/KeyboardShortcutsBehaviour.ts#L65-L73`, `#L146-L155`) | add optional `code?: string` to `ShortcutKeyEvent`. When a modifier is held and `key` isn't an ASCII letter or digit, but `code` is `Key[A-Z]` / `Digit[0-9]`, use that letter or digit | `alt+z` on macOS → `alt+z`; `shift+1` → `shift+1`; `Dead` keys resolve too. AZERTY and Dvorak keep their `key` (R4). Non-layout keys (Escape, arrows, Delete) are untouched | medium. Changes how every event is matched; the public function's signature widens, but its return type is unchanged | — |
| K2 | defect | implemented | `sym:KeyboardShortcutsBehaviour.handleKey` (`#L214-L227`) + a private `eventCandidates(e)` | match a binding if **any** candidate is among its alternatives: (1) the K1 combo, (2) with shift dropped when shift is held and the key is a single printable non-letter, non-digit character | `mod+plus` fires on Ctrl/⌘ + Shift + `=`; `shift+?`-style bindings still match via (1) | medium. A binding for the unshifted glyph with and without shift could now both match; first binding wins (existing rule) | K1 |
| K3 | dressing | implemented | class TSDoc (`#L11-L15`) | document the key rules: letters and digits are resolved physically under a modifier, and shifted punctuation is written as the glyph (`mod+plus`, not `mod+shift+=`) | users can write bindings that work | none | K1, K2 |
| C1 | defect | implemented | `pkg:@invana/graph` `file:packages/graph/src/canvas/graphCommands.ts#L121-L143`, `#L188-L250`, `#L405-L409` | `editCommands(access, defaultLayerId = 'graph')`: `layerIdOf` falls back to `defaultLayerId`, the described `layerId.default` follows it, and `GRAPH_META` is merged **inside** it. `eraseCommand(history, defaultLayerId?)` does the same. Export `registerGraphEditCommands(registry, access, { layerId?, only })`, which returns an unregister. `registerGraphCommands` keeps its behaviour and uses the same meta path. *As built:* `eraseCommand`'s empty-selection fallback now calls `graph.clear` with `layerId` set to the layer it resolved, because the live `graph.clear` may belong to an override with a different default | one definition of args + body + meta for GraphCanvas and the providers, so they can't drift again | medium. Cross-package, and it adds public API to `@invana/graph` (its surface isn't snapshot-pinned) | — |
| C2 | defect | implemented | `sym:GraphClipboardProvider` (`#L50-L59`, `#L110-L150`) | replace the hand-rolled block with `registerGraphEditCommands(commands, access, { layerId, only: ['clipboard.cut','clipboard.copy','clipboard.paste','clipboard.delete','graph.erase'] })`. `access.clipboard(id)` / `access.history(id)` return the provider's clipboard / `historyRef.current` for `id === layerId`, else the canvas's own (`graphHistory(id)` / `clipboard(id)` via the `EditStateOwner` duck-type in `useGraphEditState`, `null` on a plain Canvas). Drop `SELECTION_ARGS` / `clickSelectIdOf` | S7 and S9 fixed; other layers keep GraphCanvas's behaviour | medium. On a plain `Canvas`, `clipboard.copy { layerId: 'other' }` changes from "acts on the wrong layer" to "disabled" | C1, D-1, D-2 |
| C3 | defect | implemented | `sym:GraphHistoryProvider` (`#L48-L52`, `#L98-L133`) | same, with `only: ['history.undo','history.redo','graph.clear','graph.erase']` and access composed the same way. Drop `targetLayer` | S8, S9 and S10 fixed | medium. A bare `graph.clear` under `layerId="main"` now clears `'main'` (was `'graph'`) | C1, D-1, D-2 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:CommandRegistry.subscribe` / `notify` | P1 bumps inside `notify` | if a notify path is added without the bump, the palette goes stale again. Keeping the bump *in* `notify` prevents that |
| U2 | `KeyboardEvent.code` support | K1 | universal in current browsers; absent `code` falls back to today's behaviour |
| U3 | `sym:GraphCanvas.graphHistory` / `sym:GraphCanvas.clipboard` | C2/C3 fall back to them for layers other than the provider's | a rename breaks the duck-type (already relied on by `useCanvasGraphHistory`) |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `sym:CommandPalette` → `sym:GraphCanvasApp`'s docked palette, `story:canvas-ui/apps/GraphCanvasApp/CommandPalette` | UI, story | rows now track layout (un)registration live | none |
| X2 | `api/canvas-core.surface.txt` | published API snapshot | export names unchanged (P1 is a member) | none expected; `pnpm lint` confirms |
| X3 | `sym:eventShortcut` / `sym:ShortcutKeyEvent` / `sym:normalizeShortcut`, exported from `pkg:@invana/canvas` (`api/canvas.surface.txt`) and re-exported from `pkg:@invana/canvas-react` / `pkg:@invana/canvas-ui` | published API | `ShortcutKeyEvent` gains optional `code`. Callers passing plain objects still type-check, and without `code` behave as before | none |
| X4 | saved `definition.behaviours[kind='keyboard-shortcuts'].bindings` | serialised state | bindings that never fired (`alt+<letter>`, `mod+plus`, `shift+<digit>`) **start firing**. No stored shape changes | release note |
| X5 | `DEFAULT_SHORTCUTS` + `mod` alias; `sym:KeyboardShortcutsBehaviour` wrapper in canvas-react; the `keyboard-shortcuts` editor (`file:packages/canvas-ui/src/editors/behaviours/keyboard-shortcuts/`) | behaviour, editor | must keep firing (V6). The editor stores `keys` strings, which don't change | none |
| X6 | `KeyboardCameraInputBehaviour` arrow keys | behaviour | arrows are not letters or digits, so K1 doesn't touch them | none |
| X7 | `sym:registerGraphCommands`, `sym:eraseCommand` (`pkg:@invana/graph` public) | published API | same behaviour on GraphCanvas; `eraseCommand` gains an optional second param; new export `registerGraphEditCommands` | none |
| X8 | `sym:GraphClipboardProvider` / `sym:GraphHistoryProvider` on a **GraphCanvas with history on**: `story:canvas-ui/apps/GraphCanvasApp/ControlPanels`, `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:canvas-react/ControlPanel/GraphCanvas/Modeller` | stories | they bridge and register nothing today; no change | control V9 |
| X9 | `sym:GraphHistoryProvider` in `story:usecases/tools/GraphModeller` (`layerId="graph"`) | story | *Corrected on verification:* this story is a `GraphCanvasApp` (a GraphCanvas with history on), not a plain Canvas, so the provider bridges and registers nothing, like X8. No story mounts either provider on a plain Canvas | control V9 |
| X10 | saved control panels (`definition` control-panel items) binding `clipboard.*` / `history.*` / `graph.clear` / `graph.erase` with `args.layerId` under a provider | serialised state | now target the named layer (was: the provider's layer). This is the fix | release note |
| X12 | `sym:GraphCanvas` React root / `sym:GraphCanvasApp` | React API | *Found on verification:* neither can pass `history: false`, because `useCanvasEngine` forwards only `telemetry` to the constructor (`file:packages/canvas-react/src/useCanvasEngine.tsx#L86-L88`). The reviewed scenario is reachable only when the engine is built imperatively | none here; logged as item 28 in `doc:docs/commands-followups.md` |
| X11 | `sym:useClipboard` / `sym:useHistory` / `sym:useClearGraph` (canvas-react hooks) | hooks | they call the shared `graphActions` bodies directly, not the commands; unaffected | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V0 | skipped | **Control:** dialog palette, register a layout, reopen | `sym:CommandPalette` `variant="dialog"` | the new `Layout: …` row appears (works today; must keep working) — no story mounts `variant="dialog"`, and the dialog path is the same memo with `open` still a dependency. The inline palette's rows before any change stood in as the control (38 rows, `Layout: graph-force`, Undo and Copy under Edit) | P2 |
| V1 | pass | unit test: `version` increments on register, unregister, pop-to-previous, and `invalidate`, and only then | `file:packages/canvas-core/tests/registries/CommandRegistry.test.ts` | pass — 14/14 pass | P1 |
| V2 | pass | inline palette: register a layout after mount via the Playwright canvas handle (no story edit), in a **visible** tab | `story:canvas-ui/apps/GraphCanvasApp/CommandPalette` | the `Layout: <id>` row appears without a remount — `Layout: v2-extra` appeared with no remount | P2 |
| V3 | pass | …then remove that layout | same | the row disappears | P2 |
| V4 | pass | `handleKey` via the canvas handle with synthetic events, after `setOptions({ bindings: [{ keys: 'alt+z', … }, { keys: 'mod+plus', … }, { keys: 'shift+1', … }] })`: `{key:'Ω',code:'KeyZ',altKey}`, `{key:'+',code:'Equal',shiftKey,metaKey/ctrlKey}`, `{key:'!',code:'Digit1',shiftKey}` | same story | all three return `true` and run their command — all three returned `true` and ran their command | K1, K2 |
| V5 | pending | physical keys on macOS (maintainer): ⌥Z, ⌘⇧=, ⇧1 with those bindings | same story | each fires | K1, K2 |
| V6 | pass | **Control:** `DEFAULT_SHORTCUTS`: mod+z, mod+shift+z, mod+y, mod+x/c/v, delete, backspace, escape (synthetic + physical) | same story | all still fire; Ctrl+C with nothing selected still falls through — all nine defaults, plus `mod+z` with no `code`, resolved to the right command; Ctrl+C with nothing selected still returns `false` (falls through) | K1, K2 |
| V7 | pass | layout guard: synthetic `{key:'z',code:'KeyW',ctrlKey}` (AZERTY Ctrl+Z) on a non-mac binding `mod+z` | same story | fires (resolved from `key`, not `code`) | K1 |
| V8 | pass | unit tests: `registerGraphEditCommands` honours `args.layerId`, falls back to `layerId`, carries `GRAPH_META` category / keywords, and the unregister restores the previous entry; `registerGraphCommands` output is unchanged | `file:packages/graph/tests/canvas/graphCommands.test.ts` | pass — graph `tests/canvas` 48/48 pass | C1 |
| V9 | pass | **Control:** undo / cut / copy / paste / clear still work, and palette groups are unchanged | `story:canvas-ui/apps/GraphCanvasApp/ControlPanels`, `story:canvas-react/ControlPanel/GraphCanvas/Modeller`, `story:usecases/tools/GraphModeller` | unchanged behaviour — all three: no page errors, `history.undo` / `clipboard.copy` / `graph.clear` under Edit, clear then undo restores every node (3 / 77 / 3) | C2, C3 |
| V10 | pass | `GraphCanvas history:false` inside both providers, with two graph layers: `clipboard.copy { layerId: 'other' }` targets `'other'`; the palette groups Cut / Copy / Paste / Delete / Undo / Redo under **Edit** | per D-4 | as stated — with a temporary story (deleted after) that builds `new GraphCanvas({ history: false })` itself: the canvas history is `null`, delete then undo goes through the provider's history, `clipboard.copy { layerId: 'other' }` fills `'other'`'s clipboard, and all eight commands are under Edit. **Same script on the old providers:** `'other'` stays empty and all eight are under Other, so the check catches the defect | C2, C3 |
| V11 | pass | `pnpm check-types`, `pnpm lint` (incl. `check-boundaries`, `check-api-surface`), `pnpm --filter` builds of canvas-core, canvas, graph, canvas-react, canvas-ui | repo | green — `check-types` 19/19; `pnpm lint` 0 errors, boundaries intact, all three API surfaces unchanged (no snapshot regen); builds of canvas-core → canvas-ui green | all |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Should the providers skip registering when GraphCanvas already owns the command? | (a) keep today's skip rules (register only when the provider built its own history, or its ancestor history isn't the canvas's), but register via C1 with access that falls back to the canvas's state for other layers; (b) never register on a GraphCanvas; (c) wrap the existing entry instead of overriding it | **(a)**. With `history: false` the canvas's `history.undo` covers `canvas.history` only, so under (b) the provider's history has no Undo command. (c) adds a registry concept for no gain once (a) delegates other layers | accepted |
| D-2 | Default layer for bare args under a provider | the provider's `layerId` · always `'graph'` | **the provider's `layerId`**, which the clipboard provider and `history.*` already do today; fixes S10's inconsistency | accepted |
| D-3 | Resolve punctuation from `code` too (`Slash` → `/`, so `shift+/` matches ⇧/)? | yes · no | **no**. Punctuation positions vary by layout, so `code` names the wrong glyph on non-US keyboards. Document "write the glyph" (K3) and log it in `doc:docs/commands-followups.md` | accepted |
| D-4 | How to run V10: no existing story has `GraphCanvas history:false` inside both providers, and canvas-react has no test harness | (a) a temporary unsaved story, deleted after; (b) a new permanent story; (c) accept V8 (unit) + V9 (controls) and mark V10 `skipped` | **(a)**, only with your go-ahead (rule 11) | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | opened from a `/code-review` of `main...HEAD` on `feat/commands-phases-a-b-c` | proposed | all three findings confirmed against source; reviewer's F2 fix direction narrowed by R4 (AZERTY) |
| 2026-09-28 | maintainer approved every row, with D-1 (a), D-2, D-3 no and D-4 (a) | accepted | — |
| 2026-09-28 | P1, P2, K1–K3, C1–C3 implemented; V1–V4 and V6–V11 pass, V0 skipped, V5 pending (physical keys) | implemented | Learned: (1) no story or React root can build a GraphCanvas with `history: false` (X12, follow-up item 28), so V10 needed a hand-built engine; (2) GraphModeller is a GraphCanvasApp, not a plain Canvas (X9 corrected); (3) `eraseCommand` had to name the layer when it hands off to `graph.clear` (C1); (4) D-3 logged as follow-up item 27 |
