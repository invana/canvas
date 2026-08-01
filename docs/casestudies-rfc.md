# RFC — `casestudies/`: the five case studies, their data, and the analyst's story

**Status:** 🚧 in progress — the namespace split (§6) and the dataset audit
(§5.4) have landed; the five case studies are not written yet.
**Decisions locked:** folder name `casestudies/` (§6) · dataset licence policy (§3).
**Scope:** `apps/storybook/stories/` (namespace move + new stories) and the
datasets that feed them.
**Companion:** [`new-behaviours-rfc.md`](./new-behaviours-rfc.md) — the engine
work these five stories require. Every step below marked 🔧 needs a behaviour we
have not written yet.
**Supersedes (in part):** [`usecases-storybook-taxonomy-plan.md`](./usecases-storybook-taxonomy-plan.md)
§"`usecases/domains/`" — that plan's `apps` vs `domains` split holds; this RFC
renames and re-charters the `domains` half.

---

## 1. Why

`usecases/domains/` held 13 stories named after a *dataset*:
`cora/CitationNetwork`, `geo-air-routes/AirRoutes`, `microservices/ServiceTopology`.
Each demonstrates the engine over interesting data. None is something a buyer
recognises as *their own job*. "Cora Citation Network" is not a pitch.

Renaming `domains` → `casestudies` raises the authoring bar:

> A **domain** is a dataset with a theme.
> A **case study** is *a named analyst, a question they are accountable for, and
> a decision they must defend to someone else.*

If a story can't name the analyst and the decision, it's an engine demo and
belongs under the owning package's namespace.

### The loop every case study is written in

| Beat | The analyst's act | What the canvas does |
|---|---|---|
| **Observe** | *"Where is this weird?"* | The whole population in one frame — layout, colour-by, centrality, contours, LOD, minimap |
| **Focus** | *"These 40, not those 40,000."* | Narrow **without losing context** — lasso/brush, filters, isolate, neighbours, emphasis + dimming |
| **Investigate** | *"Prove it, and let me export the reason."* | Element-level evidence — hover, inspect, expand, path, provenance, export |

### The claim that makes these five one product

> **An explanation is a subgraph.**

Every model output worth arguing about — a risk score, a link prediction, a
retrieval, a routing decision — has a small evidence subgraph behind it. SHAP
bars and attention heatmaps don't survive a regulator, a clinician, or an
incident review: they answer *which features moved the number*, not *which facts,
and can I check them*.

---

## 2. The five at a glance

| | Case study | Dataset | Real or created | Licence |
|---|---|---|---|---|
| **CS1** | **Financial crime** — alert → filed narrative | **Wikidata** corporate graph + synthetic money overlay | **real** entities, **created** transactions | CC0 |
| **CS2** | **Attack paths** — identity/cloud blast radius | `attack-paths` generator (AD-shaped) | **created** | ours |
| **CS3** | **Target discovery** — biomedical hypothesis provenance | **Open Targets Platform** | **real** | CC0 |
| **CS4** | **Supply risk** — disruption propagation | **air-routes** (`krlawrence/graph`) + synthetic software half | **real** physical, **created** software | Apache-2.0 |
| **CS5** | **AI traces** — why did the agent answer that | **OpenTelemetry Demo** + in-repo `agent-trace` / `rag-embeddings` / `data-lineage` | **generated** | Apache-2.0 |

**Four of five run on real or self-generated-from-real data.** Only CS2 is wholly
invented — the one domain where no prospect would expect otherwise.

Build order: **CS5 → CS2 → CS4 → CS1 → CS3** (cheapest to most credible; CS5
largely exists already, CS3 has the longest sales cycle and the highest prestige).

---

## 3. 🔒 Dataset licence policy (locked 2026-08-02)

| | |
|---|---|
| **Allowed** | **CC0 1.0** · **public domain** · **MIT** · **Apache-2.0** · **BSD** · **ISC** · **self-generated** |
| **Blocked** | Any `*-NC` · any copyleft (ODbL, CC BY-SA, GPL) · **any per-use data-attribution requirement** (CC-BY, Etalab) · anything with no stated licence |

Data attribution is excluded deliberately: no credit lines in the UI, no
per-dataset notices a consumer must reproduce, no obligation that can be got
wrong later by whoever adds the next dataset.

> **Clarification (2026-08-02).** An earlier phrasing blocked "any attribution
> requirement", which was self-contradictory — MIT and Apache-2.0 both require
> retaining a copyright notice. The real line is:
>
> - **Notice-only software licences** (MIT · Apache-2.0 · BSD · ISC) — **allowed**.
>   The obligation is "keep the LICENSE file", which the repo already does.
> - **Per-use data-attribution licences** (CC-BY · Etalab · ODbL) — **blocked**.
>   The obligation follows the *data* into every consumer and every screen.

### Facts aren't licensable

A recurring finding across the audit: several datasets turned out to be **pure
measurement** — 272 geyser eruption timings, 68 energy-flow quantities,
character co-occurrence counts. Facts carry no copyright of their own, so what
matters for those is whichever container they arrived in. This is what cleared
three of the five asserted-provenance datasets in §5.4.

**The policy is retroactive** — it governs the 15 dataset folders already in
`@invana/graph-datasets`, which predate any review (§5.4 T1).

### The trap to watch for

The dangerous failure isn't non-commercial licences, which are obvious. It's
**headline licences that cover only the integration work**:

- **PrimeKG is MIT** — on the *code*. Its data pulls in DrugBank (non-commercial).
- **Hetionet is CC0** — on the *integration*. Its sources keep their own terms and
  its README states some gave no licence at all.
- **Alibaba clusterdata** has **no licence** — "study or research purposes" plus a
  citation request is not a grant to ship commercially.

Both read as clean at a glance. Rate the dataset, never the site.

### Two working rules

1. **Schemas and shapes are not licensed; rows are.** We may study a blocked
   dataset's structure and summary statistics and build a generator of that
   shape. We may not ship its rows. This is what makes synthesis credible.
2. **Find vs create.** *Find* where entities are public record (companies,
   airports, targets). *Create* where the data is confidential by nature (a
   bank's transactions, a company's AD) — nobody expects real data there anyway,
   and a generator plants the narrative beat exactly.

---

## 4. The five case studies

Each step is written as the demo script. 🔧 marks a step blocked on engine work —
see [`new-behaviours-rfc.md`](./new-behaviours-rfc.md).

---

### CS1 — Financial crime: from alert to filed narrative

**Pitch.** *Your model flags 4,000 accounts a month. Your analysts clear them one
row at a time and write the narrative from memory. Here is the ring, the
evidence, and the export.*

**Who.** L2 financial-crime analyst at a bank, fintech, or PSP. A SAR filing
deadline, and a regulator who will read it.

**The question.** *Is this alert one account behaving oddly, or one node of a mule
network — and what do I put in the narrative?*

| Dataset | |
|---|---|
| **Substrate — real** | **Wikidata** (CC0): `owned by` · `parent organization` · `subsidiary` · `board member` · `chief executive officer` · `headquarters location`. Real, named companies and officers a prospect can look up. |
| **Overlay — created** | `financial-crime` generator: accounts, devices, transfers, KYC flags, and the planted ring |
| **Why this split** | The ownership chains are genuine and checkable; only the money is invented — which is the half that would be confidential at any real bank. Recovers what ICIJ Offshore Leaks was going to give us, under CC0 instead of copyleft. |
| **Planted beats** | One **funnel account** (high betweenness, *medium* degree — so a ranked queue misses it) · one shared-device cluster · one 3-hop path to a flagged exit · decoy clusters that look similar and aren't |

**How the visualiser helps — step by step**

1. **Open the month's alerts.** Force layout, colour by risk band, size by
   centrality. The whole population, one frame.
2. **Spot what the queue can't.** The eye lands not on the highest-scoring
   account but on a tight cluster of *medium*-scoring ones. **That cluster is the
   case, and no ranked list surfaces it** — this is the entire argument for
   graph triage in one screen.
3. **Lasso the cluster and isolate it.** 🔧 40,000 nodes → 34, context intact.
4. **Pull the 2-hop neighbourhood.** 🔧 The shared device and the funnel account
   appear — neither was in the alert.
5. **Trace the money.** 🔧 Highlight the path from the flagged account to the
   known-bad exit; everything else dims. Hover each transfer for amount and
   timestamp.
6. **Check the entity.** Click the funnel account → its KYC record, its owning
   company, its officers — real Wikidata entities.
7. **Export the evidence.** 🔧 The subgraph plus its reasons becomes the
   narrative's attachment.

**The explainability moment.** The model scored the funnel account 0.91. The graph
answers *why*: three hops to a sanctioned entity through a shared device — a claim
the analyst can verify, cite, and be cross-examined on. A feature-importance chart
cannot be cross-examined.

**Stories.** `casestudies/financial-crime/{AlertTriage,MuleRing,BeneficialOwnership}`

---

### CS2 — Attack paths: blast radius before the breach

**Pitch.** *You have 12,000 findings and a "critical" label on 900 of them. Only 6
sit on a path to a crown jewel. Here are the 6.*

**Who.** Cloud-security or identity engineer, SOC lead — or a CNAPP/ITDR vendor
who wants this embedded in their own product. **The strongest OEM wedge.**

**The question.** *What can an attacker who owns this laptop actually reach — and
which single edge, if I cut it, kills the most paths?*

| Dataset | |
|---|---|
| **Created — fully synthetic** | `attack-paths` generator: `User` · `Computer` · `Group` · `Domain` · `GPO` · `OU`, connected by `MemberOf` · `AdminTo` · `CanRDP` · `HasSession` · `GenericAll` |
| **Why synthetic** | BloodHound's sample data is derived from GOAD, which is **GPL-3.0**; SpecterOps' official set has no licence I could confirm. Both blocked by §3. |
| **Why that's near-lossless** | Recognition comes from the **model** — `MemberOf` / `AdminTo` / `CanRDP` is public schema knowledge — not from whose principals populate it. Every real AD is confidential anyway. Shape it from published AD privilege-distribution statistics. |
| **Planted beats** | Exactly **6 paths** from one workstation to Domain Admin · one ACL edge on **5 of the 6** (the choke point) · one over-privileged nested group nobody owns |

**How the visualiser helps — step by step**

1. **Open the identity graph.** Hierarchical (ELK), tiered from public-facing to
   crown jewel.
2. **See where privilege pools.** Density contours show concentration — usually
   somewhere nobody owns.
3. **Pick the compromised foothold.** 🔧 Everything unreachable dims. The
   surviving subgraph *is* the blast radius, and it's always smaller and stranger
   than the finding count implied.
4. **Read the paths.** 🔧 Six routes to Domain Admin, drawn.
5. **Find the choke point.** 🔧 One ACL edge appears on five of the six. Edge
   betweenness ranks it; the picture confirms it.
6. **Walk one hop at a time.** Inspect the permission that makes each hop
   possible.
7. **Test the fix.** 🔧 Cut the edge, re-run: the paths are gone. **A falsifiable
   prediction, not a severity score.**

**The explainability moment.** "Critical" is a model verdict, and severity scores
are unarguable in both directions — nobody can defend or refute them. A path from
*this* laptop to *that* bucket is a proof, and cutting an edge from it is a
prediction you can check.

**Stories.** `casestudies/attack-paths/{BlastRadius,ChokePoints,IdentitySprawl}`

---

### CS3 — Target discovery: why the model proposed this hypothesis

**Pitch.** *Your link-prediction model says this target matters in this tumour
type. Before anyone spends a year of wet-lab time, show the scientist the chain of
evidence.*

**Who.** Computational biologist or translational-research lead; a
target-nomination committee that must justify the spend.

**The question.** *What is this prediction actually built on — and is any of it a
single retracted paper?*

| Dataset | |
|---|---|
| **Real — no synthesis at all** | **Open Targets Platform** (**CC0 1.0**, confirmed): `Target` · `Disease` · `Drug` · `Publication`, connected by `ASSOCIATED_WITH` (score) · `EVIDENCED_BY` (**source + confidence**) · `TARGETS` |
| **Why it's the flagship** | It ships **per-evidence provenance and scores** — literally the edge attribute the story needs. CS3's whole premise is real, citable provenance, and it landed on the only unconditional public-domain licence in its field. |
| **What we gave up** | Hetionet was to supply the wider mechanistic neighbourhood (pathways, compounds) but fails §3's integration trap. CS3 narrows to target–disease–evidence — acceptable, since `WeakestLink` is the story that sells. |

**How the visualiser helps — step by step**

1. **Open the target/disease neighbourhood.** Clustered by association strength.
2. **See where evidence is thin.** Contour density shows where support is thick
   and — more usefully — where it isn't.
3. **Isolate the predicted edge's supporting subgraph.** 🔧 Two independent assay
   chains and one review-article chain, as three visibly separate bundles.
4. **Weight by confidence.** Edge width and alpha carry the per-evidence score, so
   a weak chain *looks* weak.
5. **Follow each chain to its source.** Click through to the actual publication
   per edge.
6. **Find the weakest link.** 🔧 "Independent chain two" traces to the same 2011
   paper as chain one. **The hypothesis's real confidence interval is its weakest
   edge.**
7. **Record the decision** — the committee gets the subgraph, not a summary.

**The explainability moment.** The purest of the five. A knowledge-graph embedding
outputs a score; the **provenance path is the explanation**. No other
explainability technique surfaces *"this whole hypothesis rests on one retracted
paper"* — a graph does it in a glance.

**Stories.** `casestudies/target-discovery/{EvidenceChain,PathwayNeighbourhood,WeakestLink}`

---

### CS4 — Supply risk: when one node stops

**Pitch.** *You know your tier-1 suppliers. The shortage will come from a tier-3
you've never heard of, that four of your tier-1s quietly share.*

**Who.** Supply-chain risk / procurement analyst. **Second market, same
storyboard:** swap the physical graph for packages and CVEs and the buyer becomes
DevSecOps.

**The question.** *If this node goes dark tomorrow, what stops — and where is my
hidden single point of failure?*

| Dataset | |
|---|---|
| **Physical — real** | **air-routes** (`krlawrence/graph`, **Apache-2.0** confirmed): ~3.4 k airports, ~43 k routes, `airport → country → continent` hierarchy, real geography |
| **Software — created** | `supply-risk` generator: `Package` · `Version` · `Advisory`, `DEPENDS_ON` · `AFFECTED_BY`. Planted: one transitive package shared by four directs; one advisory reaching ~40 % of the tree |
| **Why air-routes** | A **real network-flow / choke-point story with zero synthesis**, and universally legible — nobody needs supply-chain context to understand that closing a hub strands passengers. deps.dev would have been better for the software half but requires attribution (§3). |
| ⚠️ **Not what we ship today** | Our `air-routes/` folder is **2,980 airport points + a Natural Earth land outline and no edges** — the maplibre stories Delaunay-triangulate fake routes. Adopting the GraphML converts a point set into a 43 k-edge graph and deletes that hack. |

**How the visualiser helps — step by step**

1. **Open the network on a map.** Real geography; concentration is visible
   instantly — the thing a supplier spreadsheet structurally cannot show.
2. **Rank the hubs.** Centrality sizes the nodes; the load-bearing ones surface.
3. **Take one out.** 🔧 Select a hub as disrupted.
4. **Watch it propagate.** 🔧 Everything downstream lights up, the rest dims. Four
   tier-1s converge on one tier-3 — or a whole region loses connectivity through
   one airport.
5. **Find the cut vertex.** 🔧 Which single node, removed, disconnects the most
   pairs.
6. **Check the alternates.** Which substitute routes exist, and what they cost.
7. **Export the exposure list.** 🔧

**The explainability moment.** Supplier-risk vendors deliver a number per supplier.
Nobody can act on 68/100. The graph reframes it as *"this is high because these
three paths converge here"* — and propagation is arithmetic on the graph, so it's
auditable rather than modelled.

**Stories.** `casestudies/supply-risk/{TierExposure,SinglePointOfFailure,SoftwareBillOfMaterials}`

---

### CS5 — AI traces: why did the AI answer that

**Pitch.** *Your agent gave a customer the wrong number. The trace is 400 spans of
JSON. Here is the one retrieved chunk that poisoned it, and the upstream table it
came from.*

**Who.** AI platform / applied-ML team shipping agents to production — and every
LLMOps and evaluation vendor. Alongside CS2, the strongest embed candidate, and
the closest to what we already build.

**The question.** *Which step went wrong, what did it read, and where did that come
from?*

| Dataset | |
|---|---|
| **Generated — Apache-2.0** | **OpenTelemetry Demo**, self-instrumented: `Run` · `Span` · `ToolCall` · `Chunk` · `Document` · `Table` · `Model`, connected by `INVOKED` · `RETRIEVED` · `DERIVED_FROM` · `GROUNDED_IN` |
| **Already in the repo** | `agent-trace`, `rag-embeddings`, `data-lineage` — pending the §5.4 T1 audit |
| **Why generated is right** | We author the failing run deliberately, so the narrative is exact. Alibaba's real 20 k-microservice call graphs would have given the fleet-scale **observe** beat, but have **no licence** — generate a synthetic fleet instead. |
| **Why build it first** | Three of its four datasets already ship. These are currently three unrelated demos and are secretly one product. |

**How the visualiser helps — step by step**

1. **Open a fleet of runs.** Laid out by structure, coloured by outcome.
2. **See the failures share a shape.** That shape is the bug — the view no
   trace-viewer-as-a-list can give you.
3. **Open one failing run as a DAG.** The branch where confidence collapses is a
   *position*, not a scroll offset.
4. **Focus the retrieval step.** 🔧 Its chunks, and only its chunks.
5. **Follow `DERIVED_FROM` upstream.** 🔧 Past the document, into the table, into
   the pipeline that wrote it.
6. **Answer the actual question** — prompt bug or data bug?
7. **Compare against a passing run.** 🔧 The diff is the fix.

**The explainability moment.** Explainability applied to our own industry, which
makes it the most credible demo we can hand a technical buyer.

**Stories.** `usecases/by-casestudies/ai-traces/{AgentRunTrace,RetrievalProvenance,DataLineage}`

---

## 5. Datasets

### 5.1 Allowed — the ones we use

| Dataset | For | Licence | Size (raw) | Ship target |
|---|---|---|---|---|
| **Open Targets Platform** | CS3 | **CC0 1.0** ✅ confirmed | FTP dump tens of GB (parquet); we need 2 tables | ~1.5 k nodes |
| **Wikidata** | CS1 | **CC0 1.0** ✅ confirmed | full dump ~100s of GB; SPARQL out a slice | ~2 k nodes |
| **air-routes** (`krlawrence/graph`) | CS4, **+ engine proving ground** | **Apache-2.0** ✅ confirmed from repo `LICENSE` | GraphML, ~3.4 k airports / ~43 k routes | ship near-whole |
| **OpenTelemetry Demo** | CS5 | Apache-2.0 | we generate it | ~500 spans |
| In-repo `agent-trace` / `rag-embeddings` / `data-lineage` | CS5 | already shipping — ⚠️ unaudited | story-sized | reuse |

**air-routes does a second job.** [`new-behaviours-rfc.md`](./new-behaviours-rfc.md)
says path + reachability is the whole unlock, and *"how do I fly from Austin to
Kathmandu"* is the signature query of the Gremlin tutorial this dataset ships
with. Small, real, legible, hierarchical, geographic, permissive — **it should be
what the path work is built and demoed against, before any case study depends on
it.**

### 5.2 Created — the generators

Each is a **seeded, deterministic generator** with the narrative beats as
parameters, so the demo is reproducible, the story is exact, and the same
generator scales to 100 k nodes for a performance story. Synthetic data is marked
as such in the data itself and said out loud in the story.

| Generator | For | Standalone or overlay |
|---|---|---|
| `financial-crime` | CS1 | **overlay** on real Wikidata entities |
| `attack-paths` | CS2 | **standalone** — the only wholly-invented dataset of the five |
| `supply-risk` | CS4 | **software half only** — air-routes carries the physical half |

### 5.3 Blocked — do not use

| Dataset | Was for | Why |
|---|---|---|
| ICIJ Offshore Leaks | CS1 | ODbL + CC BY-SA — copyleft, propagates |
| deps.dev | CS4 | CC-BY 4.0 — attribution |
| BACI / CEPII | CS4 | Etalab 2.0 — attribution |
| Hetionet | CS3 | CC0 on the *integration only*; sources keep own terms, some none |
| PrimeKG | CS3 | **MIT covers code, not data** — DrugBank (NC) inside. Superseded by OptimusKG. |
| Alibaba clusterdata | CS5, CS2 | **No licence** — "research purposes" + citation request |
| BloodHound GOADv2 sample | CS2 | **GOAD is GPL-3.0**; official set's licence unconfirmable |
| PaySim | CS1 | Unverified — Kaggle page is JS-rendered, unreadable |
| Elliptic | CS1 | Believed CC BY-NC-SA (NC *and* SA — fails either way, so not worth verifying) |
| OpenSanctions | CS1 | Paid data licence for business use — confirmed |
| SNAP · Network Repository · KONECT · DBpedia · OSM · MAG | various | No stated licence, or CC BY-SA / ODbL / NC |
| LDBC SNB Datagen | G1/G2 | **GPLv3** — even the generator is copyleft |
| OGB | various | MIT for OGB-released sets but **varies per dataset** (`ogbl-ddi` is DrugBank-derived) — usable per-dataset only, never "OGB is MIT" |

### 5.4 Audit of the shipping datasets — ✅ done 2026-08-02

The §3 policy applied retroactively to all 15 folders in
`@invana/graph-datasets`. Provenance read from each folder's TSDoc/README;
external licences checked against the source repos.

#### 🔴 Replaced — ✅ done 2026-08-02

All three encumbered datasets are **deleted from the repo** and replaced by
seeded generators. `pnpm build`, `check-types` (datasets **and** storybook) and
`lint` all pass.

| Was | Size | Why it went | Now | Size |
|---|---|---|---|---|
| **`game-of-thrones`** | **6.8 MB** | Source repo [`jeffreylancaster/game-of-thrones`](https://github.com/jeffreylancaster/game-of-thrones) has **NO licence** — confirmed via the GitHub API, which returns no licence object. No licence = all rights reserved. **Compounded by an IP layer**: character names, episode titles + descriptions and IMDb links are HBO/GRRM material, not facts we re-derive. | **`epic-saga`** — `generateEpicSaga()` | **10 KB** |
| **`wikipedia-dataviz`** | **1.6 MB** | sigma.js's demo repo is MIT ✅, but the content is a **Wikipedia** link graph (CC BY-SA). Dropped on principle rather than leaning on a facts-not-expression argument. | **`topic-cartography`** — `generateTopicCartography()` | **7 KB** |
| **`usecase-demos/cora`** | ~1 MB | [LINQS](https://linqs.soe.ucsc.edu/data) — **CC BY-SA**, copyleft *and* attribution. Fails §3 twice. | **`usecase-demos/paper-citations`** — `generatePaperCitations()` | a few KB |

Also deleted: `scripts/prepare-{got,wikipedia-dataviz,cora}.mjs` — they exist only
to re-fetch and re-derive the sources above.

**Shape is preserved, values are invented.** Each generator was tuned against the
original's published distributions (§3's "schemas and shapes are not licensed;
rows are"), so the demos look the same:

| | Nodes | Edges | Notes |
|---|---|---|---|
| `epic-saga` | **4,959** (7 types, matching the original per-type counts exactly) | 30,683 | `co_appears_with` is a genuine projection — derived from who shared a generated scene, weighted by duration. Screen-time is long-tailed (top 22.6 ks vs 1.9 ks median), which is what makes the force layout readable. |
| `topic-cartography` | **2,083** (11 tags, distribution within 1 of the original) | 5,409 | 24 clusters on a golden-angle spiral with Gaussian scatter — places the outcome a ForceAtlas2 run would produce, so `activeLayout: ''` stays the honest default. URLs point at `atlas.invalid` (RFC 2606) so no reader mistakes them for real pages. |
| `paper-citations` | **2,708** (7 subjects, distribution exact) | **10,556** | A DAG — citations point backwards in time — with ~81 % intra-subject links and preferential attachment, giving real communities and hub papers (top cited 24, median 4). |

**Three bonuses, as predicted:** ~9.4 MB of JSON became ~20 KB of source; both
large datasets are now parameterisable (`generateEpicSaga({ scenes: 50_000 })`
for a performance story); and the `wikipedia-dataviz` judgement call disappeared
rather than being argued.

Consumers repointed: `LayersViewPanel`, `FindInCanvasViewPanel`,
`CanvasFiltersViewPanel`, and the two `cora/` stories (moved to
`usecases/by-casestudies/paper-citations/`).

#### ⚠️ Asserted provenance — ✅ verified 2026-08-02

The five datasets carrying an unchecked claim in their own TSDoc. **Four cleared,
one replaced.** Each TSDoc now records the actual licence position rather than an
assertion.

| Dataset | What we found | Verdict |
|---|---|---|
| `old-faithful` | Payload is **272 pairs of numbers** — physical measurements of a geyser. R's `datasets` *package* is GPL-2, but that covers the package, not the observations. | ✅ **keep** — the clearest facts-not-expression case in the repo |
| `uk-energy-flow` | Ships as `test/energy.json` inside [`d3/d3-sankey`](https://github.com/d3/d3-sankey), which is **BSD-3-Clause** (our TSDoc claimed MIT — wrong, now corrected; d3 itself is ISC). Payload is 48 labels + 68 flow quantities. | ✅ **keep** — permissive container, factual payload |
| `les-miserables` | Knuth publishes the Stanford GraphBase as **public domain**, with a *request* — not a licence condition — that the canonical files not be altered ("may be freely copied but please do not change it in any way"). That request is about keeping the SGB distribution identical worldwide; it doesn't reach a downstream reshaping of co-occurrence counts, which are facts regardless. | ✅ **keep** — ambiguity resolved and recorded |
| `air-routes` | Natural Earth is public domain ✅, but the airports CSV arrived via an Observable notebook and our own README asks downstream users to keep an attribution. | ✅ **resolved by T2** — the Apache-2.0 `krlawrence/graph` swap replaces it outright |
| `life-tree` | 145-species tree from **Ciccarelli et al. (2006)**, a *Science* paper (© AAAS), taken via d3's Tree of Life. **No data licence exists anywhere in the chain** → fails §3's "no stated licence" rule. | 🔴 **replaced** — see below |

**`life-tree` → `generateLifeTreeNewick()`.** The 12 KB Newick string is gone,
replaced by a generator emitting a synthetic phylogeny in the same format, so
`parseNewick` and `lifeTreeAsGraph` are untouched. Verified: **145 leaves / 291
nodes / 290 edges, depth 11**, partitioned Bacteria 170 · Eukaryota 80 ·
Archaea 40, no dangling edges, no duplicate ids.

Nothing is lost — the dataset exists to be a **deep, unbalanced, three-way
hierarchy** for the radial / cluster / tidy-tree layouts, and that shape
reproduces exactly. The three domain names are universal taxonomic ranks, not
anyone's authorship; every genus and species below them is invented. Clades split
30/70 rather than in half, which is what produces the lopsided ladders a balanced
split never would.

> If real phylogeny is ever wanted, the clean source is the **Open Tree of
> Life** — published under **CC0**.

#### ✅ Clean — ours, US government, or permissive

`flare-imports` · `lattice` · `random-tree` · `twitter` · and all of
`usecase-demos/` (`agent-trace` · `citations` ·
`computing-pioneers` · `invana-architecture` · `invana-code-kg` ·
`microservices` · `modeller-seed` · `ontology` · `star-schema` ·
`rag-embeddings`) — **synthetic or hand-authored by us**, several explicitly
seeded generators. `h1b2019` — **USCIS H-1B Data Hub, US government work**.
`flare` — the prefuse/flare class hierarchy, BSD-family and arguably not
copyrightable as a list of class names.

> **The good news:** the majority of what we ship is already ours. The
> generator-first habit (`twitter`, `citations`, `microservices`,
> `rag-embeddings` are all seeded synthetic) means §5.2's generators are a
> continuation of existing practice, not a new discipline.

### 5.5 Data tasks

| ID | Task | Blocks | Status |
|---|---|---|---|
| ~~T1~~ | ~~Audit the 15 existing folders~~ | — | ✅ **done** — see §5.4 |
| ~~T1a~~ | ~~Replace `game-of-thrones` + `wikipedia-dataviz`~~ | — | ✅ **done** — `epic-saga` + `topic-cartography` generators |
| ~~T1b~~ | ~~Replace `cora`~~ | — | ✅ **done** — `paper-citations` generator |
| ~~T1c~~ | ~~Verify the 5 asserted-provenance datasets~~ | — | ✅ **done** — 4 cleared, `life-tree` replaced with a generator |
| **T2** | Adopt `krlawrence/graph` air-routes (Apache-2.0) as the real routes graph | CS4 + all path work | 📋 best value-per-effort |
| **T3** | Wikidata SPARQL extraction — corporate ownership slice | CS1 | 📋 |
| **T4** | Generator framework — seeded, deterministic, beats as params, marked synthetic | CS1, CS2, CS4 | 📋 one framework, three configs |
| **T5** | Extraction script pattern — `extract.ts` per folder; `data: GraphData` + `settings: CanvasConfig` as the **only** exports, per [`graph-datasets-folder-exports-plan.md`](./graph-datasets-folder-exports-plan.md) | all real datasets | 📋 |
| **T6** | `PROVENANCE.md` per folder — source *or* generator + seed, licence, date, query | all | 📋 credibility + audit trail |
| **T7** | Size budget for `@invana/graph-datasets` (`usecase-demos/` is 13 MB, `game-of-thrones/` 6.8 MB) | all | 📋 |
| **T8** | Check the **LDBC FinBench Datagen** licence | `financial-crime` quality | 📋 SNB is GPLv3 so nothing can be assumed; if permissive it's a purpose-built fraud-graph generator |
| **T9** | Write the §3 policy into `packages/graph-datasets/CLAUDE.md` | future additions | 📋 so it isn't re-litigated by whoever adds the next one |

---

## 6. The namespace move

### D1 — 🔒 LOCKED (revised 2026-08-02) — two buckets **inside** `usecases/`

✅ **Executed.** The move landed; titles, `apps/storybook/CLAUDE.md` and this
manifest are updated.

```
stories/usecases/
  tools/                    ← the product surfaces: GraphModeller · GraphVisualiser · CanvasDesigner
  by-casestudies/           ← the verticals: one folder per case study
    financial-crime/ · attack-paths/ · target-discovery/ · supply-risk/ · ai-traces/
    …plus the 13 migrated domain folders, until each is rewritten…
  SimpleAndCompositeNodes   ← known orphan; engine-capability demo in neither bucket
```

**Revision from the first draft.** D1 originally made `casestudies/` a *top-level
sibling* of `usecases/`. It's now nested, and the tools get their own `tools/`
bucket rather than sitting loose in the root — so `usecases/` reads as two
symmetrical halves (*the tools we ship* · *the problems they solve*) instead of
three files and a folder.

**`SimpleAndCompositeNodes` stays put as an acknowledged orphan.** Its subject is
an engine capability, not a use case, and it holds the repo's only
ellipse-composite-frame demo — so it can't simply be deleted (this is the
unresolved §5 carried over from
[`usecases-storybook-taxonomy-plan.md`](./usecases-storybook-taxonomy-plan.md)).
Re-home that coverage first, then move it.

### D1a — Grow `by-casestudies/`, don't migrate into it

The 13 folders under `by-casestudies/` today are **dataset demos**, named after
what they show rather than a decision anyone has to defend. The bar this RFC
exists to raise (§1) is not met by any of them yet.

So the five case studies are **authored one at a time**, and a dataset demo is
absorbed into one only when it has actually been rewritten as a beat of that
narrative — never as a bulk move. `ABSORB` rows in D2 are *destinations*, not a
migration to run in one pass. A folder that says "case study" while holding a
dataset demo violates its own charter, and "rewrite it later" reliably means
never.

Order: **CS5 first** — three of its four datasets already ship, so it's the
cheapest way to find out whether the three-beat folder shape reads well before
four more commit to it.

### D2 — Destination manifest (13 stories)

| Today | Disposition | New home |
|---|---|---|
| `by-casestudies/llm-agent-trace/AgentTrace` | **ABSORB** → CS5 | `usecases/by-casestudies/ai-traces/AgentRunTrace` |
| `by-casestudies/rag-embeddings/EmbeddingExplorer` | **ABSORB** → CS5 | `usecases/by-casestudies/ai-traces/RetrievalProvenance` |
| `by-casestudies/data-lineage/SankeyLineage` | **ABSORB** → CS5 | `usecases/by-casestudies/ai-traces/DataLineage` |
| `by-casestudies/microservices/ServiceTopology` | **ABSORB** → CS2 | `usecases/by-casestudies/attack-paths/ServiceTopology` |
| `by-casestudies/geo-air-routes/AirRoutes` | **ABSORB** → CS4 | `usecases/by-casestudies/supply-risk/NetworkFlow` |
| `by-casestudies/paper-citations/CitationNetwork` | MOVE as-is | `usecases/by-casestudies/citations/CitationNetwork` |
| `by-casestudies/paper-citations/SubjectBundle` | MOVE as-is | `usecases/by-casestudies/citations/SubjectBundle` |
| `by-casestudies/citations/CitationGraph` | MOVE as-is (merge with `cora/`) | `usecases/by-casestudies/citations/CitationGraph` |
| `by-casestudies/code-kg/DotsForce` | MOVE as-is | `usecases/by-casestudies/code-intel/DotsForce` |
| `by-casestudies/code-kg/CompositeCards` | MOVE as-is | `usecases/by-casestudies/code-intel/CompositeCards` |
| `by-casestudies/code-kg/HealthBadges` | MOVE as-is | `usecases/by-casestudies/code-intel/HealthBadges` |
| `by-casestudies/invana-architecture/EndToEnd` | **RE-HOME** — our own architecture, a marketing demo, not a vertical | open (§7 Q2) |
| `by-casestudies/data-model/SchemaTable` | **RE-HOME** — an ER diagram is a template/engine capability | open (§7 Q2) |

**Read this as destinations, not a batch job** (D1a). *ABSORB* = when that case
study is authored, this demo is rewritten as one of its beats and moves then.
*MOVE as-is* = a pure folder rename, safe to do any time. *RE-HOME* = leaves
`usecases/` entirely once §7 Q2 is answered.

Still pending from this table: the `citations/` merge (three citation stories
across two folders), the `code-kg/` → `code-intel/` rename, and both RE-HOMEs.

### D3 — Phasing

- **Phase A — the bucket split.** ✅ **done 2026-08-02.** `tools/` +
  `by-casestudies/` created, 16 stories moved with `git mv`, titles rewritten,
  `apps/storybook/CLAUDE.md` updated, `check-types` clean. Export names were
  unaffected — they key off the file name, not the path.
- **Phase B — data.** §5.4 audit ✅ done; T2 (adopt the Apache-2.0 air-routes
  graph) and T4 (generator framework) remain.
- **Phase C — engine.** See [`new-behaviours-rfc.md`](./new-behaviours-rfc.md).
  The minimum unlock is P1 + P2 + B1 + B2.
- **Phase D — the five, one at a time.** CS5 → CS2 → CS4 → CS1 → CS3, per D1a.
- **Phase E — the leftovers.** The `citations/` merge, `code-kg/` →
  `code-intel/`, and the two RE-HOMEs (§7 Q2).

## 7. Open questions

1. ~~**Does `usecases/` survive?**~~ ✅ **Resolved 2026-08-02** — it survives,
   with the tools moved into `usecases/tools/` so the node reads as two
   symmetrical halves alongside `usecases/by-casestudies/`. See D1.
2. **Where do `invana-architecture` and `data-model` go?** Candidates:
   `graph/Nodes/SchemaTable` for the ER diagram (it demos the composite-shape
   resolver), a new `showcase/` node, or delete `invana-architecture` if the deck
   covers it.
3. **One folder per case study with one file per beat?** *(Recommend yes — the
   existing `code-kg/` shape. Observe/focus/investigate are genuinely three
   configurations of one graph.)*
4. **Ship generated graphs, or generator seeds?** A seed is bytes; a committed
   graph is diff-able and loads with no compute. *(Recommend seed + generator,
   plus one committed snapshot per story for load speed.)*
5. **Does `air-routes` get replaced in place?** T2 swaps a point set for a
   43 k-edge graph under the same folder name, and two maplibre stories import
   `airports` / `landTopology` today. *(Recommend replace in place, keeping both
   exports.)*
6. **Do the stories get authored before the engine work?** *(Recommend yes, with
   pre-baked highlighted paths — it proves the narrative and exposes the API we
   want before we commit to it. But internally: the demo without path
   highlighting is the old demo with better labels.)*
