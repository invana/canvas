# RFCs — one document per feature or fix, written before the code

Every feature request and every bug fix gets a short document **here, first** — then the
code. The RFC is what gets reviewed and approved; the diff is what follows from it.

```
docs/rfcs/
├── feat/     a new capability, API, or surface
└── fix/      a defect: something already shipped behaves wrong
```

**Which folder?** Ask what the change is *claiming*. `feat/` claims "this is now
possible"; `fix/` claims "this was already promised and doesn't hold". A change that
makes an existing thing better (faster, prettier, more legible) but breaks no promise is
a `feat/`. When a fix needs a new capability to land, the fix RFC links to the feature
RFC rather than absorbing it.

**File name:** `YYYY-MM-DD-kebab-slug.md`, dated the day it was opened. The slug names
the *problem*, not the solution — `group-frame-occludes-edges`, not `add-plane-axis`, so
the document stays findable when the solution changes.

---

## Table-first, for the knowledge graph

These documents are **decision history for the product**, meant to be imported into a
knowledge graph — every RFC a node, every row an entity, every reference an edge. So:

- **Tables carry the content. Prose is the exception**, capped at a line or two under a
  heading, and only where a table would lose a causal link.
- **Every row has a stable ID** (`S1`, `F3`, `D-2`, `V1`, `D1`) scoped to its RFC. IDs
  are append-only: never renumber, never reuse. Other rows and later RFCs cite them.
- **Every reference to a real thing uses the entity vocabulary below** rather than prose,
  so the importer resolves it without parsing English.
- **Status changes are recorded, not overwritten** — front matter carries the current
  state, §8 History carries how it got there.

### Entity reference vocabulary

| Prefix | Means | Example |
|---|---|---|
| `pkg:` | Workspace package | `pkg:@invana/graph` |
| `file:` | Source path, optional `#L<line>` or `#L<a>-L<b>` | `file:packages/canvas/src/primitives/PrimitivesRenderer.ts#L430-L434` |
| `sym:` | Exported class / function / method | `sym:GraphLayer.nodeSpec` |
| `story:` | Storybook title (the sidebar path) | `story:graph/Groups/GroupWithEdges` |
| `doc:` | Repo doc | `doc:docs/render-planes-and-emphasis-plan.md` |
| `rfc:` | Another RFC, by its front-matter `id` | `rfc:fix-2026-08-05-group-frame-occludes-edges` |
| `dataset:` | Exported dataset | `dataset:canvasDataflow` |

### Relation predicates

Used in front-matter `relations` and in the Prior-art table.

| Predicate | Meaning |
|---|---|
| `caused-by` | The defect originates here |
| `manifests-in` | Where it is observed |
| `depends-on` | Cannot land without this |
| `blocks` / `blocked-by` | Sequencing between RFCs |
| `supersedes` / `superseded-by` | Replacement, both directions recorded |
| `relates-to` | Same area, no dependency |
| `verified-by` | The check that proves it |

---

## Required structure

Front matter is YAML and is the machine-readable half. Drop a **section** that would be
empty; never drop a front-matter key — use `null`.

```yaml
---
id: fix-YYYY-MM-DD-slug          # matches the filename, minus .md, prefixed by type
type: fix | feat
title: One line, present tense
status: proposed | accepted | landed | superseded | rejected
opened: YYYY-MM-DD
decided: YYYY-MM-DD | null
landed: YYYY-MM-DD | null
packages: [pkg:…]                # every package the change touches
design_of_record: doc:… | null   # when the design lives elsewhere
relations:
  - { predicate: …, object: … }
---
```

Then a **summary table** (what breaks / root cause / which rows are the defect / which
decisions are open), then the sections:

| § | Section | Table columns | Notes |
|---|---|---|---|
| 1 | **Symptom** (fix) / **Motivation** (feat) | `ID · Observation · Where · Evidence` | Plus a **Ruled out** sub-table: `ID · Hypothesis · Verdict · Evidence`. Recording what the cause *isn't* is half the value on re-read |
| 2 | **Diagnosis** / **Design** | `Step · Mechanism · Evidence · Consequence` | A causal chain, one row per link, ending in the defect. Must explain **why this cause produces exactly the symptom seen** — a mechanism that would produce a different symptom is not yet the diagnosis. Add a sub-table when several factors compound, and a **Confirming test** table: `Test · Action · Result · Inference` |
| 3 | **Prior art** | `Doc · Relation · Status · What survives` | Check `docs/` before writing. If the design of record exists, this RFC scopes the *landing*, not the design |
| 4 | **The fix** | `ID · Kind · Status · File/target · Change · Effect · Risk · Depends on` | `Kind` is `defect` or `dressing`. **Every row carries its own `Status`** (see below). Rows independently reviewable, ordered so a partial landing still makes sense |
| 5 | **Blast radius** | Upstream: `ID · Dependency · Why it matters · Risk if it moves` · Downstream: `ID · Consumer · Kind · Impact · Action required` | Name real consumers. "Various stories" is not a blast radius |
| 6 | **Verification** | `ID · Status · Check · Target · Expected · Covers` | `Covers` cites fix-row IDs. Include the **control** — something that works today and must keep working |
| 7 | **Decisions** | `ID · Question · Options · Recommendation · Status` | Only decisions genuinely needing the maintainer. Every one carries a recommendation |
| 8 | **History** | `Date · Event · Status · Note` | Append-only. This is what makes the RFC a decision record rather than a snapshot |

### Status is per row, not just per RFC

An RFC is rarely approved or landed as one lump — the usual outcome is "F1–F5 yes, F6
later". So **every fix row and every verification row carries its own status**, and the
document's own `status` is a roll-up of them.

| Table | Vocabulary | Meaning |
|---|---|---|
| Fix (§4) | `proposed` | Written, not yet approved |
| | `accepted` | Approved, not yet written |
| | `implemented` | Written and building, but not every check covering it is green yet — the honest state when a check can't run in the implementing session |
| | `landed` | In `main`, and every check that `Covers` it is `pass` |
| | `deferred` | Approved but explicitly postponed — say what unblocks it |
| | `rejected` | Decided against. **Kept, never deleted** — the rejection is the record |
| | `superseded` | Replaced by a row elsewhere; cite the `rfc:`/row ID |
| Verification (§6) | `pending` · `pass` · `fail` · `skipped` | `skipped` states why in the row |
| Decisions (§7) | `open` · `accepted` · `rejected` · `deferred` | Matches the fix rows it governs |

Two roll-up rules:

- A **fix row** reaches `landed` only when every verification row that `Covers` it is `pass`.
- The **RFC** reaches `landed` only when every fix row is `landed`, `rejected`, or `superseded`.

Keep a **Row status** line in the summary table as a count (`proposed 6 · accepted 0 · …`)
so the document's state is legible without reading §4, and update it whenever a row moves.
Every status change also appends a line to §8 History — the current value lives in the
table, how it got there lives in the log.

### Two standing rules for the fix table

- **Separate the defect from the dressing.** A change that makes the symptom *invisible*
  without removing the cause (raising an alpha, a workaround in `onReady`) is
  `Kind: dressing`, gets its own row, and is never presented as the fix.
- **Say what a row costs.** "Risk: low" only means something when the rows that aren't
  low are marked honestly. Cross-package changes, paint-order or z-order semantics,
  public type surfaces, and anything that changes how existing stories *look* are never
  low.

---

## Lifecycle

| Step | Who | Result |
|---|---|---|
| 1 | Claude | Writes the RFC, summarises in chat, **stops**. No code |
| 2 | Maintainer | Approves whole, in part ("rows F1–F5 only"), or sends it back |
| 3 | Claude | Implements, sets `status` / `decided` / `landed`, appends to §8, records what the implementation taught us that the document got wrong |

A superseded RFC is **kept**, with a banner pointing at its replacement and a line on
which parts still hold. `doc:docs/group-frame-paint-band-plan.md` is the model: its
diagnosis survived, its mechanism didn't.

## Relationship to `docs/*-plan.md`

The long-form `*-plan.md` documents in `docs/` are the same idea before this folder
existed, and several are the **design of record** for areas an RFC will touch. They stay
where they are, in prose. A new RFC links to them; it does not re-litigate a locked
design.
