/**
 * Synthetic **company knowledge-graph** — entities of five kinds linked
 * by typed relations. Modelled after Palantir / Neo4j Bloom / Diffbot
 * entity-ontology demos so the story has a recognisable picture: five
 * companies, the people who founded / run them, the products they ship,
 * the cities they're based in, and the industries they operate in.
 *
 * The dataset is deliberately under-connected at the periphery so the
 * "double-click to expand" interaction in the story has something
 * meaningful to do — start with the core companies + their CEOs and
 * unfold the products, locations, and industries by clicking.
 */

/** Entity kind — drives shape and palette in the story. */
export type OntologyEntityKind = 'company' | 'person' | 'product' | 'location' | 'industry';

/** Predicate / FK label on each edge. */
export type OntologyEdgeKind =
  | 'founded'
  | 'ceo_of'
  | 'works_at'
  | 'builds'
  | 'headquartered_in'
  | 'operates_in'
  | 'competes_with';

export interface OntologyNodeData {
  readonly kind: OntologyEntityKind;
  /** Human-readable display name (id stays kebab-case for stability). */
  readonly name: string;
}

export interface OntologyEdgeData {
  readonly kind: OntologyEdgeKind;
}

export interface OntologyNode {
  readonly id: string;
  readonly data: OntologyNodeData;
}

export interface OntologyEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly data: OntologyEdgeData;
}

export interface OntologyData {
  readonly nodes: readonly OntologyNode[];
  readonly edges: readonly OntologyEdge[];
  /** Ids that the story shows in its initial collapsed view. */
  readonly coreIds: readonly string[];
}

const nodes: readonly OntologyNode[] = [
  // ── Companies ──
  { id: 'stripe',    data: { kind: 'company', name: 'Stripe' } },
  { id: 'anthropic', data: { kind: 'company', name: 'Anthropic' } },
  { id: 'openai',    data: { kind: 'company', name: 'OpenAI' } },
  { id: 'figma',     data: { kind: 'company', name: 'Figma' } },
  { id: 'linear',    data: { kind: 'company', name: 'Linear' } },

  // ── People ──
  { id: 'patrick-collison', data: { kind: 'person', name: 'Patrick Collison' } },
  { id: 'john-collison',    data: { kind: 'person', name: 'John Collison' } },
  { id: 'dario-amodei',     data: { kind: 'person', name: 'Dario Amodei' } },
  { id: 'daniela-amodei',   data: { kind: 'person', name: 'Daniela Amodei' } },
  { id: 'sam-altman',       data: { kind: 'person', name: 'Sam Altman' } },
  { id: 'greg-brockman',    data: { kind: 'person', name: 'Greg Brockman' } },
  { id: 'dylan-field',      data: { kind: 'person', name: 'Dylan Field' } },
  { id: 'karri-saarinen',   data: { kind: 'person', name: 'Karri Saarinen' } },

  // ── Products ──
  { id: 'stripe-payments',  data: { kind: 'product', name: 'Stripe Payments' } },
  { id: 'stripe-atlas',     data: { kind: 'product', name: 'Stripe Atlas' } },
  { id: 'claude',           data: { kind: 'product', name: 'Claude' } },
  { id: 'chatgpt',          data: { kind: 'product', name: 'ChatGPT' } },
  { id: 'gpt-4',            data: { kind: 'product', name: 'GPT-4' } },
  { id: 'figma-design',     data: { kind: 'product', name: 'Figma Design' } },
  { id: 'figma-dev-mode',   data: { kind: 'product', name: 'Figma Dev Mode' } },
  { id: 'linear-app',       data: { kind: 'product', name: 'Linear' } },

  // ── Locations ──
  { id: 'san-francisco',    data: { kind: 'location', name: 'San Francisco' } },
  { id: 'new-york',         data: { kind: 'location', name: 'New York' } },
  { id: 'seattle',          data: { kind: 'location', name: 'Seattle' } },
  { id: 'london',           data: { kind: 'location', name: 'London' } },

  // ── Industries ──
  { id: 'payments',         data: { kind: 'industry', name: 'Payments' } },
  { id: 'ai-research',      data: { kind: 'industry', name: 'AI Research' } },
  { id: 'design-tools',     data: { kind: 'industry', name: 'Design Tools' } },
  { id: 'productivity',     data: { kind: 'industry', name: 'Productivity' } },
];

const edges: readonly OntologyEdge[] = [
  // founded
  { id: 'f1', source: 'patrick-collison', target: 'stripe',    data: { kind: 'founded' } },
  { id: 'f2', source: 'john-collison',    target: 'stripe',    data: { kind: 'founded' } },
  { id: 'f3', source: 'dario-amodei',     target: 'anthropic', data: { kind: 'founded' } },
  { id: 'f4', source: 'daniela-amodei',   target: 'anthropic', data: { kind: 'founded' } },
  { id: 'f5', source: 'sam-altman',       target: 'openai',    data: { kind: 'founded' } },
  { id: 'f6', source: 'greg-brockman',    target: 'openai',    data: { kind: 'founded' } },
  { id: 'f7', source: 'dylan-field',      target: 'figma',     data: { kind: 'founded' } },
  { id: 'f8', source: 'karri-saarinen',   target: 'linear',    data: { kind: 'founded' } },

  // ceo_of
  { id: 'c1', source: 'patrick-collison', target: 'stripe',    data: { kind: 'ceo_of' } },
  { id: 'c2', source: 'dario-amodei',     target: 'anthropic', data: { kind: 'ceo_of' } },
  { id: 'c3', source: 'sam-altman',       target: 'openai',    data: { kind: 'ceo_of' } },
  { id: 'c4', source: 'dylan-field',      target: 'figma',     data: { kind: 'ceo_of' } },
  { id: 'c5', source: 'karri-saarinen',   target: 'linear',    data: { kind: 'ceo_of' } },

  // works_at (non-founders / past)
  { id: 'w1', source: 'daniela-amodei',   target: 'anthropic', data: { kind: 'works_at' } },
  { id: 'w2', source: 'greg-brockman',    target: 'openai',    data: { kind: 'works_at' } },
  { id: 'w3', source: 'john-collison',    target: 'stripe',    data: { kind: 'works_at' } },

  // builds
  { id: 'b1', source: 'stripe',    target: 'stripe-payments', data: { kind: 'builds' } },
  { id: 'b2', source: 'stripe',    target: 'stripe-atlas',    data: { kind: 'builds' } },
  { id: 'b3', source: 'anthropic', target: 'claude',          data: { kind: 'builds' } },
  { id: 'b4', source: 'openai',    target: 'chatgpt',         data: { kind: 'builds' } },
  { id: 'b5', source: 'openai',    target: 'gpt-4',           data: { kind: 'builds' } },
  { id: 'b6', source: 'figma',     target: 'figma-design',    data: { kind: 'builds' } },
  { id: 'b7', source: 'figma',     target: 'figma-dev-mode',  data: { kind: 'builds' } },
  { id: 'b8', source: 'linear',    target: 'linear-app',      data: { kind: 'builds' } },

  // headquartered_in
  { id: 'h1', source: 'stripe',    target: 'san-francisco', data: { kind: 'headquartered_in' } },
  { id: 'h2', source: 'anthropic', target: 'san-francisco', data: { kind: 'headquartered_in' } },
  { id: 'h3', source: 'openai',    target: 'san-francisco', data: { kind: 'headquartered_in' } },
  { id: 'h4', source: 'figma',     target: 'san-francisco', data: { kind: 'headquartered_in' } },
  { id: 'h5', source: 'linear',    target: 'san-francisco', data: { kind: 'headquartered_in' } },

  // operates_in
  { id: 'o1', source: 'stripe',    target: 'payments',     data: { kind: 'operates_in' } },
  { id: 'o2', source: 'anthropic', target: 'ai-research',  data: { kind: 'operates_in' } },
  { id: 'o3', source: 'openai',    target: 'ai-research',  data: { kind: 'operates_in' } },
  { id: 'o4', source: 'figma',     target: 'design-tools', data: { kind: 'operates_in' } },
  { id: 'o5', source: 'linear',    target: 'productivity', data: { kind: 'operates_in' } },

  // competes_with — directed but read as bi-directional rivalry
  { id: 'x1', source: 'anthropic', target: 'openai', data: { kind: 'competes_with' } },
  { id: 'x2', source: 'openai',    target: 'anthropic', data: { kind: 'competes_with' } },
];

/** Five companies + their CEOs — the story's collapsed starting view. */
const coreIds: readonly string[] = [
  'stripe', 'anthropic', 'openai', 'figma', 'linear',
  'patrick-collison', 'dario-amodei', 'sam-altman', 'dylan-field', 'karri-saarinen',
];

export const ontology: OntologyData = { nodes, edges, coreIds };
