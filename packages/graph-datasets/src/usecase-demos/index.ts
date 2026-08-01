// @invana/graph-datasets/usecase-demos — synthetic datasets for the
// Storybook `usecases/` showcase folder. Kept separate from the root
// `@invana/graph-datasets` export so the "real" datasets (Les Misérables,
// Flare, UK Energy, etc.) and the synthetic demo-only ones don't share
// a namespace.
//
// Dataset modules are added as each usecase ships:
//
//  - agentTrace          → usecases/domains/llm-agent-trace/AgentTrace
//  - ragEmbeddings       → usecases/domains/rag-embeddings/EmbeddingExplorer
//  - microservices       → usecases/domains/microservices/ServiceTopology
//  - ontology            → canvas-ui/view-panels/SchemaViewPanel/{CanvasDerived,CustomSchema}
//  - citations           → usecases/domains/citations/CitationGraph
//  - invanaCodeKg        → usecases/domains/code-kg/{DotsForce,CompositeCards,HealthBadges}
//  - starSchema          → usecases/domains/data-model/SchemaTable
//  - invanaArchitecture  → usecases/domains/invana-architecture/EndToEnd
//  - computingPioneers   → usecases/SimpleAndCompositeNodes
//  - modellerSeed        → usecases/apps/GraphModeller

// ── settings — one recommended look per dataset ──────────────────────────────
export { settings as agentTraceSettings } from './agent-trace/settings';
export { settings as ragEmbeddingsSettings } from './rag-embeddings/settings';
export { settings as microservicesSettings } from './microservices/settings';
export { settings as ontologySettings } from './ontology/settings';
export { settings as citationsSettings } from './citations/settings';
export { settings as coraSettings } from './cora/settings';
export { settings as computingPioneersSettings } from './computing-pioneers/settings';
export { settings as invanaArchitectureSettings } from './invana-architecture/settings';
export { settings as modellerSeedSettings } from './modeller-seed/settings';
export { settings as starSchemaSettings } from './star-schema/settings';
export { settings as invanaCodeKgSettings } from './invana-code-kg/settings';

// ── data ─────────────────────────────────────────────────────────────────────

export {
  agentTrace,
  type AgentTraceData,
  type AgentTraceEdge,
  type AgentTraceEdgeData,
  type AgentTraceEdgeKind,
  type AgentTraceNode,
  type AgentTraceNodeData,
  type AgentTraceNodeKind,
  type AgentTraceStatus,
} from './agent-trace/data';

export {
  ragEmbeddings,
  type RagEmbeddingsCluster,
  type RagEmbeddingsData,
  type RagEmbeddingsNode,
  type RagEmbeddingsNodeData,
} from './rag-embeddings/data';

export {
  microservices,
  type MicroservicesData,
  type MicroservicesEdge,
  type MicroservicesEdgeData,
  type MicroservicesHealth,
  type MicroservicesNode,
  type MicroservicesNodeData,
  type MicroservicesTier,
} from './microservices/data';

export {
  ontology,
  type OntologyData,
  type OntologyEdge,
  type OntologyEdgeData,
  type OntologyEdgeKind,
  type OntologyEntityKind,
  type OntologyNode,
  type OntologyNodeData,
} from './ontology/data';

export {
  citations,
  type CitationsData,
  type CitationsEdge,
  type CitationsEdgeData,
  type CitationsNode,
  type CitationsNodeData,
  type CitationsTopic,
} from './citations/data';

export {
  cora,
  type CoraData,
  type CoraEdge,
  type CoraNode,
  type CoraNodeData,
  type CoraSubject,
} from './cora/data';

export {
  computingPioneers,
  type ComputingPioneersData,
  type ComputingPioneersEdge,
  type ComputingPioneersEdgeType,
  type ComputingPioneersNode,
  type ComputingPioneersNodeType,
  type ComputingPioneersNodeData,
} from './computing-pioneers/data';

export {
  invanaArchitecture,
  type InvanaArchitectureData,
  type InvanaArchitectureEdge,
  type InvanaArchitectureEdgeType,
  type InvanaArchitectureEdgeData,
  type InvanaArchitectureNode,
  type InvanaArchitectureNodeType,
  type InvanaArchitectureNodeData,
} from './invana-architecture/data';

export {
  modellerSeed,
  type ModellerSeedData,
  type ModellerSeedEdge,
  type ModellerSeedNode,
  } from './modeller-seed/data';

export {
  starSchema,
  type StarSchemaData,
  type StarSchemaEdge,
  type StarSchemaEdgeType,
  type StarSchemaEdgeData,
  type StarSchemaField,
  type StarSchemaFieldType,
  type StarSchemaNode,
  type StarSchemaNodeType,
  type StarSchemaNodeData,
} from './star-schema/data';

export {
  invanaCodeKg,
  type InvanaCodeCluster,
  type InvanaCodeComplexity,
  type InvanaCodeEdge,
  type InvanaCodeEdgeLabel,
  type InvanaCodeEdgeProperties,
  type InvanaCodeKgData,
  type InvanaCodeNode,
  type InvanaCodeNodeLabel,
  type InvanaCodeNodeProperties,
  type InvanaCodeProject,
  type InvanaCodeTourStep,
} from './invana-code-kg/data';
