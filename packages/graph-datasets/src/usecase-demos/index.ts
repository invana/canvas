// @invana/graph-datasets/usecase-demos — synthetic datasets for the
// Storybook `usecases/` showcase folder. Kept separate from the root
// `@invana/graph-datasets` export so the "real" datasets (Les Misérables,
// Flare, UK Energy, etc.) and the synthetic demo-only ones don't share
// a namespace.
//
// Each dataset is one `data.ts` exporting both halves — the graph (`GraphData`)
// and its recommended look (`CanvasConfig`). Values only, no types: payloads ride
// the engine's `data?: unknown` bag, and a consumer that wants one narrowed casts
// at the point of use.
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
//  - modellerSeed        → usecases/GraphModeller

// ── settings — one recommended look per dataset ──────────────────────────────
export { settings as agentTraceSettings } from './agent-trace/data';
export { settings as ragEmbeddingsSettings } from './rag-embeddings/data';
export { settings as microservicesSettings } from './microservices/data';
export { settings as ontologySettings } from './ontology/data';
export { settings as citationsSettings } from './citations/data';
export { settings as paperCitationsSettings } from './paper-citations/data';
export { settings as computingPioneersSettings } from './computing-pioneers/data';
export { settings as invanaArchitectureSettings } from './invana-architecture/data';
export { settings as modellerSeedSettings } from './modeller-seed/data';
export { settings as starSchemaSettings } from './star-schema/data';
export { settings as invanaCodeKgSettings } from './invana-code-kg/data';

// ── data ─────────────────────────────────────────────────────────────────────

export { agentTrace } from './agent-trace/data';
export { ragEmbeddings } from './rag-embeddings/data';
export { microservices } from './microservices/data';
export { ontology } from './ontology/data';
export { citations } from './citations/data';
export { paperCitations, generatePaperCitations, type PaperCitationsOptions } from './paper-citations/data';
export { computingPioneers } from './computing-pioneers/data';
export { invanaArchitecture } from './invana-architecture/data';
export { modellerSeed } from './modeller-seed/data';
export { starSchema } from './star-schema/data';
export { invanaCodeKg } from './invana-code-kg/data';
