// @invana/graph-datasets — public API surface
//
// Every dataset is a **folder** holding `data.ts` (what to draw — `@invana/graph`'s
// `GraphData`, authored in the shape `GraphLayer.setData` takes) and `settings.ts`
// (how it should look — `@invana/canvas`'s `CanvasConfig`, pure serialisable JSON
// keyed by the `<GraphCanvasApp>` bundle's ids). This barrel re-exports both halves
// per dataset under matching names — `lesMiserables` + `lesMiserablesSettings` — so
// a consumer wires a complete visualisation with:
//
//   import { lesMiserables, lesMiserablesSettings } from '@invana/graph-datasets';
//   <GraphCanvasApp data={lesMiserables} config={lesMiserablesSettings} />
//
// The two big graphs (Game of Thrones, Wikipedia data-viz) keep their own
// subpath entries so they stay out of this bundle.

// ── settings — one recommended look per dataset ──────────────────────────────
export { settings as lesMiserablesSettings } from './les-miserables/settings';
export { settings as randomTreeSettings } from './random-tree/settings';
export { settings as latticeSettings } from './lattice/settings';
export { settings as twitterActivitySettings } from './twitter/settings';
export { settings as flareSettings } from './flare/settings';
export { settings as flareImportsSettings } from './flare-imports/settings';
export { settings as h1b2019Settings } from './h1b2019/settings';
export { settings as lifeTreeSettings } from './life-tree/settings';
export { settings as ukEnergyFlowSettings } from './uk-energy-flow/settings';
export { settings as oldFaithfulSettings } from './old-faithful/settings';
export { settings as airportsSettings } from './air-routes/settings';

// ── data ─────────────────────────────────────────────────────────────────────

export {
  lesMiserables,
  type LesMiserablesData,
  type LesMiserablesEdge,
  type LesMiserablesEdgeData,
  type LesMiserablesNode,
  type LesMiserablesNodeData,
} from './les-miserables/data';

export {
  generateRandomTree,
  type RandomTreeData,
  type RandomTreeEdge,
  type RandomTreeNode,
} from './random-tree/data';

export { generateLattice, type LatticeData } from './lattice/data';

export {
  twitterActivity,
  generateTwitterActivity,
  type TwitterGraphData,
  type TwitterNode,
  type TwitterEdge,
  type TwitterNodeLabel,
  type TwitterDatasetOptions,
} from './twitter/data';

export {
  flareAsGraph,
  flareHierarchy,
  type FlareGraphData,
  type FlareGraphEdge,
  type FlareGraphNode,
  type FlareNode,
} from './flare/data';

export {
  flareImportsAsGraph,
  type FlareImportEdge,
  type FlareImportsGraphData,
  type FlareImportsOptions,
} from './flare-imports/data';

export {
  h1b2019AsGraph,
  h1b2019Hierarchy,
  type H1B2019GraphData,
  type H1B2019GraphEdge,
  type H1B2019GraphNode,
  type H1B2019Node,
} from './h1b2019/data';

export {
  lifeTreeAsGraph,
  lifeTreeHierarchy,
  type LifeTreeGraphData,
  type LifeTreeGraphEdge,
  type LifeTreeGraphNode,
  type LifeTreeKingdom,
  type LifeTreeNode,
} from './life-tree/data';

export {
  ukEnergyFlow,
  ukEnergyFlowAsGraph,
  type UkEnergyFlow,
  type UkEnergyFlowLink,
  type UkEnergyFlowNode,
  type UkEnergyFlowGraphData,
  type UkEnergyFlowGraphEdge,
  type UkEnergyFlowGraphNode,
} from './uk-energy-flow/data';

export {
  oldFaithful,
  type OldFaithfulGraphData,
  type OldFaithfulNode,
  type OldFaithfulNodeData,
  type OldFaithfulPoint,
} from './old-faithful/data';

export {
  airports,
  landTopology,
  type Airport,
  type LandTopology,
} from './air-routes/data';
