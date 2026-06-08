// @invana/graph-datasets — public API surface
//
// Example datasets used by storybook stories and tests.

export {
  lesMiserables,
  type LesMiserablesData,
  type LesMiserablesEdge,
  type LesMiserablesEdgeData,
  type LesMiserablesNode,
  type LesMiserablesNodeData,
} from './lesMiserables';

export {
  generateRandomTree,
  type RandomTreeData,
  type RandomTreeEdge,
  type RandomTreeNode,
} from './randomTree';

export { generateLattice, type LatticeData } from './lattice';

export {
  flareAsGraph,
  flareHierarchy,
  type FlareGraphData,
  type FlareGraphEdge,
  type FlareGraphNode,
  type FlareNode,
} from './flare';

export {
  flareImportsAsGraph,
  type FlareImportEdge,
  type FlareImportsGraphData,
  type FlareImportsOptions,
} from './flare-imports';

export {
  h1b2019AsGraph,
  h1b2019Hierarchy,
  type H1B2019GraphData,
  type H1B2019GraphEdge,
  type H1B2019GraphNode,
  type H1B2019Node,
} from './h1b2019';

export {
  lifeTreeAsGraph,
  lifeTreeHierarchy,
  type LifeTreeGraphData,
  type LifeTreeGraphEdge,
  type LifeTreeGraphNode,
  type LifeTreeKingdom,
  type LifeTreeNode,
} from './lifeTree';

export {
  ukEnergyFlow,
  ukEnergyFlowAsGraph,
  type UkEnergyFlow,
  type UkEnergyFlowLink,
  type UkEnergyFlowNode,
  type UkEnergyFlowGraphData,
  type UkEnergyFlowGraphEdge,
  type UkEnergyFlowGraphNode,
} from './uk-energy-flow';

export {
  oldFaithful,
  type OldFaithfulGraphData,
  type OldFaithfulNode,
  type OldFaithfulNodeData,
  type OldFaithfulPoint,
} from './oldFaithful';

export {
  airports,
  landTopology,
  type Airport,
  type LandTopology,
} from './air-routes';
