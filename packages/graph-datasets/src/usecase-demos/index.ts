// @invana/graph-datasets/usecase-demos — synthetic datasets for the
// Storybook `usecases/` showcase folder. Kept separate from the root
// `@invana/graph-datasets` export so the "real" datasets (Les Misérables,
// Flare, UK Energy, etc.) and the synthetic demo-only ones don't share
// a namespace.
//
// Dataset modules are added as each usecase ships:
//
//  - agentTrace      → usecases/domains/llm-agent-trace/AgentTrace
//  - ragEmbeddings   → usecases/domains/rag-embeddings/EmbeddingExplorer
//  - microservices   → usecases/domains/microservices/ServiceTopology
//  - ontology        → usecases/apps/visualiser/KnowledgeGraphExplorer
//  - citations       → usecases/domains/citations/CitationGraph
//  - invanaCodeKg    → usecases/domains/code-kg/{DotsForce,CompositeCards}

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
} from './agentTrace';

export {
  ragEmbeddings,
  type RagEmbeddingsCluster,
  type RagEmbeddingsData,
  type RagEmbeddingsNode,
  type RagEmbeddingsNodeData,
} from './ragEmbeddings';

export {
  microservices,
  type MicroservicesData,
  type MicroservicesEdge,
  type MicroservicesEdgeData,
  type MicroservicesHealth,
  type MicroservicesNode,
  type MicroservicesNodeData,
  type MicroservicesTier,
} from './microservices';

export {
  ontology,
  type OntologyData,
  type OntologyEdge,
  type OntologyEdgeData,
  type OntologyEdgeKind,
  type OntologyEntityKind,
  type OntologyNode,
  type OntologyNodeData,
} from './ontology';

export {
  citations,
  type CitationsData,
  type CitationsEdge,
  type CitationsEdgeData,
  type CitationsNode,
  type CitationsNodeData,
  type CitationsTopic,
} from './citations';

export {
  cora,
  type CoraData,
  type CoraEdge,
  type CoraNode,
  type CoraNodeData,
  type CoraSubject,
} from './coraDataset';

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
} from './invanaCodeKg';
