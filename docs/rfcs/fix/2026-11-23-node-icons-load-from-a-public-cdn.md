---
id: fix-2026-11-23-node-icons-load-from-a-public-cdn
type: fix
title: Card node icons are fetched from a public CDN, and a multi-path SVG is drawn with its later paths displaced
status: proposed
opened: 2026-11-23
decided: null
landed: null
packages: [pkg:@invana/graph, pkg:@invana/renderer-pixijs, pkg:@invana/canvas-ui, pkg:@invana/canvas-core]
design_of_record: null
relations:
  - { predicate: manifests-in, object: "story:canvas-ui/apps/SchemaBoard/SchemaBoardLowDetail" }
  - { predicate: manifests-in, object: "story:graph/Nodes/SchemaCard" }
  - { predicate: caused-by, object: "file:packages/renderer-pixijs/src/primitives/paint/insetContentLayer.ts#L283-L337" }
  - { predicate: caused-by, object: "file:packages/graph/src/template/compile.ts#L819-L842" }
  - { predicate: caused-by, object: "file:packages/graph/src/nodes/composite/shared.ts#L22" }
  - { predicate: relates-to, object: "rfc:feat-2026-11-17-marker-icons-and-zoom-labels-are-not-config" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-19-composite-node-types-are-filed-as-cards-and-only-four-ship" }
  - { predicate: relates-to, object: "doc:SECURITY-AUDIT-2026-07-19.md" }
---

| | |
|---|---|
| **What breaks** | Every schema-board node with `icon: "lucide/box"` draws a small `○~` instead of a box, at all three Detail levels; and every card icon is a request to `api.iconify.design` — an air-gapped install draws **nothing**, and every board load tells a third party which icons it shows |
| **Root cause (glyph)** | `svgMarkupToPathD` joins every `<path>` of an SVG into **one** `d` string. Lucide's box has a second `<path>` that opens with a relative `m3.3 7`; once joined, Pixi resolves that `m` against the first subpath's start `(21,8)`, so the inner "V" lands at `x 24–42` — outside the box — and the doubled bounds shrink the whole glyph (§2) |
| **Root cause (CDN)** | The card `icon` element compiles to `svg-url` over `https://api.iconify.design/${id}.svg` (`compile.ts#L836`); the seven built-in cards do the same via `sym:iconifyUrl`. Card icons never pass through `iconSet`, the existing offline seam |
| **Not the cause** | Network, CORS — §1 R1–R3 |
| **Defect rows** | F1 (parse), F2–F6 (no remote fetch, bundled icons, visible fallback) · dressing: none · rejected: F7, F8 (CDN opt-in / fallback) |
| **Row status** | proposed 7 · accepted 0 · implemented 0 · landed 0 · deferred 0 · rejected 2 |
| **Open decisions** | D2, D3, D4 · accepted: D1 (no CDN at all) |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Node icon draws as a small `○~` (a rounded outline with a stroke inside, a "V" to its right) instead of `lucide/box` | Invana Studio `<SchemaBoard>` (`pkg:@invana/canvas-ui` 0.0.18 + `pkg:@invana/graph` 0.0.18, linked from this repo); headless Chromium | Studio screenshots `02-global.png` (Medium — cards), `02-global-high.png` (High — circles), `03-model-board.png` (Low — schema cards) |
| S2 | Same glyph at all three Detail levels | all three presets use a card `icon` element bound to `data.icon` | `file:packages/canvas-ui/src/board/schema/presets.ts#L73`, `#L99`; `file:packages/graph/src/template/schemaCard.ts#L165` |
| S3 | Each icon id is a `GET https://api.iconify.design/<id>.svg` | every card icon | `file:packages/graph/src/template/compile.ts#L836`, `file:packages/graph/src/nodes/composite/shared.ts#L22` |
| S4 | Offline, a failed fetch leaves the icon **empty** and only logs `console.warn` — no visible sign | renderer | `file:packages/renderer-pixijs/src/primitives/paint/insetContentLayer.ts#L151-L156`, `#L167-L171` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Network: the CDN is unreachable from the test machine | **Ruled out** | `curl -sI https://api.iconify.design/lucide/box.svg` → `HTTP/2 200`, `image/svg+xml`, 365 B. Also, a failed fetch draws nothing (S4) — a visible glyph means the fetch **succeeded** |
| R2 | CORS blocks the `fetch` | **Ruled out** | response carries `access-control-allow-origin: *`, `cross-origin-resource-policy: cross-origin` (probed with an `Origin` header) |
| R3 | Pixi's `placeholder` / missing-texture glyph | **Ruled out** | `svg-url` is a `Graphics` path, not a texture; there is no placeholder in the path (`insetContentLayer.ts#L137-L157`) |
| R4 | Wrong icon id from Studio | **Ruled out** | the CDN returns the box for `lucide/box`; the drawn strokes are the box's own three subpaths, displaced (§2 T1) |
| R5 | Pixi mis-parses arcs (`a2 2 0 0 0-1-1.73`) | **Ruled out** | the outline's bbox is correct (`x 3–21`) in T1; only the second `<path>` moves |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Studio sets `data.icon = 'lucide/box'`; the card `icon` element resolves it from `bind: 'data.icon'` | `file:packages/graph/src/template/compile.ts#L819-L823` | id `lucide/box` |
| 2 | `compileCard` emits a composite `icon` part with `{ kind: 'svg-url', url: 'https://api.iconify.design/lucide/box.svg' }` | `compile.ts#L833-L837` | a public-CDN URL is the only route; `iconSet` is never consulted for card parts (`file:packages/graph/src/layer/GraphLayer.ts#L795-L815` serves `style.icon` only, `#L1969`) |
| 3 | `CompositeShape` mounts each `icon` part through `mountInsetContent` | `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L336-L338` | → `renderChild` |
| 4 | `renderChild` creates an empty `Graphics` and calls `fetchSvgPathD(url)` (module cache per URL) | `insetContentLayer.ts#L137-L157`, `#L259-L275` | fetch succeeds (R1, R2) |
| 5 | Iconify returns two `<path>` elements: `M21 8a2…16Z` and `m3.3 7l8.7 5l8.7-5M12 22V12` | `curl` body | in its own element, the leading `m` is absolute (SVG spec: a first `m` is treated as `M`) |
| 6 | `svgMarkupToPathD` collects each element's `d` and returns `ds.join(' ')` | `insetContentLayer.ts#L298-L301`, `#L336` | the second element's `m` is no longer first — it becomes **relative** |
| 7 | Pixi's `parseSVGPath`: after `Z` the current point returns to the subpath start `(21,8)`; `m3.3 7` → `(24.3,15)` | `pixi.js@8.22.0` `lib/scene/graphics/shared/svg/parseSVGPath.mjs` (`case 'm'`, `case 'Z'`) | the "V" draws at `x 24.3–41.7`, to the **right** of the outline |
| 8 | `positionAndScale` scales by the larger local-bounds side: bbox width 38.7 instead of 18 | `insetContentLayer.ts#L173-L175`, `#L204-L209` | the whole glyph shrinks to ~½ and sits off-centre → `○~` (S1) |

Steps 5–8 alone produce exactly the glyph seen; steps 1–2 are why it needs a public host at all.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Node script: `parse-svg-path@0.2.0` + Pixi's current-point rules over the joined `d` vs each element alone | joined: second path at `(24.3,15)→(33,20)→(41.7,15)`, bbox `x 3–41.7`; separate: `(3.3,7)→(12,12)→(20.7,7)`, bbox `x 3–21` | **pass** — step 6–8 confirmed |
| T2 | Count Lucide icons whose non-first element is a `path` starting with `m` (`lucide-react@0.562.0` `dist/esm/icons`) | 478 of 1 666 | ~29 % of Lucide draws wrong through **any** `svg-url` route, including the offline `named` + `iconSetFromLucide` route |
| T3 | In a browser, draw `lucide/box` as `{ kind: 'named' }` from `sym:iconSetFromLucide` (a `data:` URL, no network) | pending | expect the same `○~` → proves the glyph is the parser, independent of the CDN |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-11-17-marker-icons-and-zoom-labels-are-not-config` | relates-to | accepted (T2 implemented) | `GraphLayerOptions.iconSet` + `NodeIcon { kind: 'named' }` → `data:` URL is the offline seam; its R2 already names the CDN as failing offline. This RFC extends that seam to card parts — no parallel channel |
| `sym:iconSetFromLucide` (`file:packages/canvas-ui/src/shared/iconSet.ts`) | relates-to | shipped | builds an `iconSet` from `lucide-react` components (already a `pkg:@invana/canvas-ui` peer/dev dep) — a ready local source |
| `rfc:feat-2026-09-19-composite-node-types-are-filed-as-cards-and-only-four-ship` | relates-to | — | its U4 flags "offline/blocked CDN → missing glyphs" as a known risk; never acted on |
| `doc:SECURITY-AUDIT-2026-07-19.md` A3, A5 | relates-to | open | A3: `fetchSvgPathD` fetches any URL (beacon / SSRF-style vector). F5 closes A3 for icons; F3 removes the `iconifyUrl` line of A5 |
| Bundled icon data in deps | — | — | none in `pkg:@invana/graph`. `lucide-react@0.562.0` in `canvas-react`, `canvas-ui`, `storybook`. No `@iconify-json/lucide`, no `lucide` / `lucide-static` |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:packages/renderer-pixijs/src/primitives/paint/insetContentLayer.ts#L283-L337` (`svgMarkupToPathD`, `renderChild`) | Return one `d` **per element** and draw each with its own `g.path(new GraphicsPath(d))` before the single `stroke` — never join `d` strings | Every multi-element SVG draws at its true geometry (T2's 478 Lucide icons, and any third-party SVG) | Medium — changes how existing `svg-url` stories *look* (they become correct); per-icon cost is N `path` calls instead of 1 | — |
| F2 | defect | proposed | `file:packages/graph/src/template/compile.ts#L819-L842`, `file:packages/graph/src/layer/GraphLayer.ts#L795-L815` (`resolveIconLayer`), `#L1908` (`nodeSpec`) | Card `icon` element compiles to `{ kind: 'named', name: id }`; `nodeSpec` resolves every composite `icon` part through `resolveIconLayer` (from a binding **or** a `shape` resolver) | Card icons use `iconSet` — the one offline seam; no URL is ever built from an id | Medium — `CompositePart.icon` must admit `named` before resolution (graph-side type only; the renderer still sees `svg-url` over `data:`) | — |
| F3 | defect | proposed | `file:packages/graph/src/nodes/composite/shared.ts#L22` (`sym:iconifyUrl`), the 7 card builders (`userCard`, `idCard`, `schemaTableCard`, `taskCard`, `organisationCard`, `productCard`, `statCard`), `file:packages/graph/src/index.ts#L441`, `file:packages/graph/src/template/types.ts#L294-L305`, `file:packages/graph/src/template/schemaCard.ts#L38` | Delete `iconifyUrl`; builders emit `named` icon parts; doc comments say "icon name in the layer's `iconSet`" instead of "iconify id" | No source in the repo can reach `api.iconify.design` | **Not low** — removes a published export (`api/` surface snapshot must regenerate; rule 16); consumers calling `iconifyUrl` break at compile time | F2 |
| F4 | defect | proposed | new `@invana/graph/icons/lucide` subpath (`file:packages/graph/package.json` `exports`), data from a local dependency (D2) | Ship the Lucide set as an `iconSet` keyed `lucide/<name>` (the id format hosts already use), imported as plain data; `pkg:@invana/canvas-ui` `<SchemaBoard>` passes it by default, merged under any host `iconSet` | `lucide/box` draws offline with no host code; Studio needs no change | Medium — package size: a subpath keeps it out of the main `@invana/graph` entry; measured in V8. Licence: Lucide is ISC | F2, D2 |
| F5 | defect | proposed | `file:packages/renderer-pixijs/src/primitives/paint/insetContentLayer.ts#L259-L275` (`fetchSvgPathD`) | `svg-url` accepts only `data:` URLs (and, per D3, same-origin relative paths); any absolute `http(s):` URL to another host is refused before `fetch`, warns once, and draws the F6 fallback | The renderer **cannot** make an icon request to a remote host, whatever a host or a saved config passes; closes audit A3 for icons | **High** — behaviour change on a public spec kind; stories pointing at wikimedia / iconify break (D-5, D-6) and must move to local assets in the same change | F6, D3 |
| F6 | defect | proposed | `resolveIconLayer` (unknown name), `renderChild` (refused URL, load or parse failure, empty `d`) | Draw one deliberate fallback glyph (a bundled `circle-help`-style "?" mark, D4) in the icon's own colour, and keep the one-time warn | A missing icon is visible on the board, never a silent blank (S4) | Low — only affects icons that draw nothing today | — |
| F7 | defect | rejected | `GraphLayerOptions.iconCdn` opt-in | Allow a host to enable `api.iconify.design` (or another remote host) for ids missing from `iconSet` | — | **Rejected 2026-11-23: no CDN at all** (D1) | — |
| F8 | defect | rejected | `resolveIconLayer` | Fall back to the CDN when a name is not in the bundled set | — | **Rejected 2026-11-23: no CDN at all** (D1) | — |
| F9 | defect | proposed | `GraphLayerOptions.iconResolver?: (name) => string \| undefined` | A synchronous, **local-only** host resolver (returns SVG markup), consulted after `iconSet` | A host with its own icon store resolves lazily instead of passing a whole record | Low, but likely redundant with `iconSet` — see D4 recommendation | F2 |

F1 alone fixes the glyph Studio sees today; F2–F5 remove the CDN; F6 makes every remaining failure visible. None is dressing.

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `pixi.js@8.22.0` `parseSVGPath` (via `parse-svg-path@0.2.0`) | relative-`m`-after-`Z` semantics drive the defect | F1 removes the dependence on cross-element state |
| U2 | Icon data source (D2: `@iconify-json/lucide` or `lucide-static`) | F4's set and its version pin | a Lucide rename drops a name → F6 fallback, not a blank |
| U3 | `lucide-react` in `pkg:@invana/canvas-ui` (`sym:iconSetFromLucide`) | stays the React-side builder | none — F4 does not use it |
| U4 | Browser `DOMParser` in `svgMarkupToPathD` | renderer tests run in `node` (`file:packages/renderer-pixijs/vitest.config.ts#L13`) | V1 needs a DOM environment for that one file, or the per-element split tested on a pure helper |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `sym:iconifyUrl` export of `pkg:@invana/graph` (`index.ts#L441`, `nodes/composite/index.ts#L36`) | published API | removed (F3) | regenerate `api/` surface snapshot; changelog entry |
| D-2 | 7 card builders in `file:packages/graph/src/nodes/composite/` | published API | `icon` part becomes `named`; hosts using a builder through a `shape` resolver need `iconSet` (F4 covers `lucide/*`) | none if F2 resolves resolver output |
| D-3 | `file:packages/graph/tests/template/compile.test.ts#L160`, `file:packages/graph/tests/template/markerIcons.test.ts` | test | assert the iconify URL | update to `named` |
| D-4 | `pkg:@invana/canvas-ui` `<SchemaBoard>` + `file:packages/canvas-ui/src/board/schema/presets.ts#L73`, `#L99` | published component | gains the default Lucide `iconSet` (F4) | none for hosts |
| D-5 | `pkg:@invana/canvas-ui` node-style editors: `file:packages/canvas-ui/src/editor-panels/node-style/composite/{fields,mapping,types}.ts`, `file:packages/canvas-ui/src/editor-panels/node-styling/{mapping,types}.ts`, `file:packages/canvas-ui/tests/nodeStylingIcon.test.ts` | editor + serialised state | an "SVG URL" field pointing at a remote host stops drawing (F5) | field help text says `data:`/local only; editor offers an icon **name** instead |
| D-6 | Stories with remote URLs: `story:graph/Nodes/Image/SvgUrl` (iconify ×6), `story:canvas/concepts/Shapes/Fill/Icons/SvgUrl` (wikimedia ×5), `story:canvas-demos/by-casestudies/data-model/SchemaTable` (`#L239`) | story | draw the F6 fallback after F5 | move to `named` / local `staticDirs` assets in the same change |
| D-7 | Stories over card builders / card icons: `story:graph/Nodes/SchemaCard`, `story:canvas-ui/apps/SchemaBoard/SchemaBoardLowDetail`, `story:graph/Nodes/Types/composite-shapes/UserCard`, `…/Restyling`, `apps/storybook/stories/canvas-demos/SimpleAndCompositeNodes.stories.tsx`, `…/tools/CanvasDesigner.stories.tsx`, `…/commerce/StockExposure`, `…/invana-architecture/EndToEnd`, `…/invana-platform/PlatformMap`, `…/org-directory/OwnershipChain`, `…/workflow/WorkflowPlan`, `…/events/SpeakerClashes` | story | icons draw offline; multi-path icons change shape (F1) | visual check (V2, V9) |
| D-8 | `story:graph/Nodes/Icon/Named` (`iconSetFromLucide`) | story | multi-path icons become correct (F1) | none |
| D-9 | Saved configs whose `style.icon` is an `https:` `svg-url` | serialised state | draw the F6 fallback (F5) | none in-repo; Invana Studio stores ids (`data.icon`), not URLs |
| D-10 | Docs: `file:packages/canvas-core/src/specs/style.ts#L130` (`svg-url` doc), `apps/docs/guide/primitives.md`, `apps/docs/guide/glossary.md`, generated `apps/docs/api/**`, `doc:SECURITY-AUDIT-2026-07-19.md` A3/A5, `file:packages/canvas-core/src/lib/svg/shapeSpecToSvg.ts` (skips `svg-url`; unchanged) | docs | state "remote fetch" | reword to `data:`/local only; regenerate API docs |
| D-11 | Invana Studio | external consumer | `lucide/box` draws offline once F1 + F2 + F4 land; no Studio change | re-run the three screenshots (V9) |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Unit: parse the iconify `lucide/box` markup; union bbox of the drawn paths | `pkg:@invana/renderer-pixijs` | bbox within `0–24` both axes (today `x 3–41.7`) | F1 |
| V2 | pending | **Control (works today):** a single-path icon (`lucide/heart` via `named`) and a `glyph` icon | `story:graph/Nodes/Icon/Named`, `story:graph/Nodes/Icon/Glyph` | pixel-identical before/after | F1, F2 |
| V3 | pending | **Offline, zero requests:** Playwright with `context.route` aborting every non-`localhost` request and `page.on('request')` recording them; open each story at High / Medium / Low | `story:canvas-ui/apps/SchemaBoard/SchemaBoardLowDetail`, `story:graph/Nodes/SchemaCard`, `story:graph/Nodes/Types/composite-shapes/UserCard` | **0** requests to any non-local host; every icon inset has non-empty bounds and draws a box, not the fallback | F2, F3, F4 |
| V4 | pending | Source gate: `rg -n 'iconify\.design' packages apps/storybook/stories` | repo | no match | F3, D-6 |
| V5 | pending | Unit: `svg-url` with `https://example.com/x.svg` | `pkg:@invana/renderer-pixijs` | `fetch` never called; fallback drawn; one warn | F5, F6 |
| V6 | pending | Unknown name `lucide/does-not-exist` in a card | `pkg:@invana/graph` story or test | fallback glyph visible in the icon colour; one warn | F6 |
| V7 | pending | `pnpm build && pnpm lint` (incl. `pnpm check-api-surface`) + `pnpm check-types` | workspace | clean with regenerated snapshot | F3, F4 |
| V8 | pending | Bundle size of `@invana/graph` main entry vs the `icons/lucide` subpath | `pkg:@invana/graph` `dist` | main entry unchanged (±1 kB); subpath size recorded here | F4 |
| V9 | pending | Studio: re-take `02-global.png`, `02-global-high.png`, `03-model-board.png` with network blocked | Invana Studio | box icon at all three Detail levels, 0 external requests | F1, F2, F4 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | May canvas ever fetch an icon from a remote host? | (a) never — icons are bundled / local only; (b) CDN as opt-in; (c) CDN as fallback | (a) — on-prem / air-gapped target, privacy, CSP | **accepted** 2026-11-23 (Ravi): no CDN at all; F7, F8 rejected |
| D2 | Source of the bundled Lucide data | (a) `@iconify-json/lucide` — JSON, keyed by the same ids hosts use; (b) `lucide-static` SVG strings; (c) `sym:iconSetFromLucide` over `lucide-react` (React-only, wrong layer for `pkg:@invana/graph`) | (a) — pure data, no React, names match `lucide/<name>` 1:1 | open |
| D3 | Does F5 also allow same-origin relative URLs? | (a) `data:` only; (b) `data:` + same-origin relative paths | (b) — a host serving its own SVGs is still local, and air-gap safe; absolute URLs to any other origin stay refused | open |
| D4 | Fallback glyph, and is F9 needed? | glyph: (a) "?" in a circle; (b) dashed square. F9: (a) add; (b) reject — `iconSet` already is the injection seam (KISS) | glyph (a); F9 (b) — reject unless a host shows a set too large to pass as a record | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-23 | Opened from Invana Studio screenshots. Network and CORS ruled out (R1, R2); glyph traced to `svgMarkupToPathD` joining paths (T1 pass); CDN dependency traced to `compile.ts#L836` + `sym:iconifyUrl` | proposed | |
| 2026-11-23 | D1 accepted (Ravi): no CDN at all, icons bundled offline only | proposed | F7, F8 recorded as rejected |
