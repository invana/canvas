// @invana/graph-datasets — public API surface
//
// Every dataset is a **folder** holding a single `data.ts`, which exports both
// halves of the visualisation: `data` (what to draw — `@invana/graph`'s
// `GraphData`, authored in the shape `GraphLayer.setData` takes) and `settings`
// (how it should look — `@invana/canvas`'s `CanvasConfig`, pure serialisable JSON
// keyed by the `<GraphCanvasApp>` bundle's ids). This barrel re-exports both per
// dataset under matching names — `lesMiserables` + `lesMiserablesSettings` — so a
// consumer wires a complete visualisation with:
//
//   import { lesMiserables, lesMiserablesSettings } from '@invana/graph-datasets';
//   <GraphCanvasApp data={lesMiserables} config={lesMiserablesSettings} />
//
// **Values only, no types.** A dataset is `GraphData` and its settings are
// `CanvasConfig`; both come from the packages that own them, and no dataset
// declares record types of its own — node / edge payloads are the engine's
// `data?: unknown` bag. A consumer that wants a payload narrowed casts at the
// point of use.
//
// The two big graphs (Game of Thrones, Wikipedia data-viz) keep their own
// subpath entries so they stay out of this bundle.

// ── settings — one recommended look per dataset ──────────────────────────────
export { settings as lesMiserablesSettings } from './les-miserables/data';
export { settings as randomTreeSettings } from './random-tree/data';
export { settings as latticeSettings } from './lattice/data';
export { settings as twitterActivitySettings } from './twitter/data';
export { settings as flareSettings } from './flare/data';
export { settings as flareImportsSettings } from './flare-imports/data';
export { settings as h1b2019Settings } from './h1b2019/data';
export { settings as lifeTreeSettings } from './life-tree/data';
export { settings as ukEnergyFlowSettings } from './uk-energy-flow/data';
export { settings as oldFaithfulSettings } from './old-faithful/data';
export { settings as airportsSettings } from './air-routes/data';

// ── data ─────────────────────────────────────────────────────────────────────

export { lesMiserables } from './les-miserables/data';
export { generateRandomTree } from './random-tree/data';
export { generateLattice } from './lattice/data';
export { twitterActivity, generateTwitterActivity } from './twitter/data';
export { flareAsGraph, flareHierarchy } from './flare/data';
export { flareImportsAsGraph } from './flare-imports/data';
export { h1b2019AsGraph, h1b2019Hierarchy } from './h1b2019/data';
export { lifeTreeAsGraph, lifeTreeHierarchy } from './life-tree/data';
export { ukEnergyFlow, ukEnergyFlowAsGraph } from './uk-energy-flow/data';
export { oldFaithful } from './old-faithful/data';
export { airports, landTopology } from './air-routes/data';
