/**
 * Synthetic **citation graph** — 150 papers across 5 research topics,
 * connected by directed `paper-cites-paper` edges. Designed for a
 * Connected-Papers / Litmaps / Elicit-style overview: density contours
 * per topic bring the cluster topology forward, force layout pulls the
 * dense intra-topic citation neighbourhoods together, and the inter-
 * topic edges form the long bridges between clusters.
 *
 * Generation rules (seeded for snapshot stability):
 *
 *   - 30 papers per topic across 5 topics, years span 2018–2025.
 *   - `citationsCount` drawn from a clipped log-normal so a handful of
 *     hub papers dominate the visualisation.
 *   - Each paper cites 2–4 prior papers, biased 70% intra-topic and
 *     30% inter-topic. Within the bias bucket, targets are weighted
 *     toward older papers with higher citation counts — i.e. crude
 *     preferential attachment.
 */

const TOPICS = [
  'transformers',
  'diffusion-models',
  'reinforcement-learning',
  'graph-neural-networks',
  'vision-language',
] as const;
export type CitationsTopic = (typeof TOPICS)[number];

const TOPIC_SLUGS: Record<CitationsTopic, string> = {
  'transformers':           'tfm',
  'diffusion-models':       'diff',
  'reinforcement-learning': 'rl',
  'graph-neural-networks':  'gnn',
  'vision-language':        'vlm',
};

const TOPIC_TITLE_FRAGS: Record<CitationsTopic, readonly string[]> = {
  'transformers': [
    'Scaling Laws', 'Mixture-of-Experts', 'Long-Context Attention', 'Rotary Embeddings',
    'Distilled Encoders', 'Sparse Attention', 'KV-Cache Compression', 'Speculative Decoding',
    'Pre-training Recipes', 'Tokenizer Studies', 'Position Bias', 'Layer-Norm Variants',
  ],
  'diffusion-models': [
    'Latent Diffusion', 'Score Matching', 'Consistency Models', 'Flow Matching',
    'Classifier-Free Guidance', 'DDIM Sampling', 'Cascaded Resolutions', 'Conditional Priors',
    'Video Diffusion', 'Audio Diffusion', 'Inverse Problems', 'Training Stability',
  ],
  'reinforcement-learning': [
    'Offline RL', 'Direct Preference Optimization', 'Reward Modelling', 'World Models',
    'Decision Transformer', 'Exploration Bonuses', 'Hierarchical Policies', 'PPO Variants',
    'Constitutional AI', 'Multi-Agent Coordination', 'Sample Efficiency', 'Self-Play',
  ],
  'graph-neural-networks': [
    'Message Passing', 'Spectral Filters', 'Graph Transformers', 'Heterogeneous Graphs',
    'Subgraph Sampling', 'Equivariant GNNs', 'Knowledge-Graph Reasoning', 'Link Prediction',
    'GraphSAGE', 'Attention Pooling', 'Over-smoothing', 'Scalability',
  ],
  'vision-language': [
    'CLIP Variants', 'Visual Question Answering', 'Image Captioning', 'Multimodal Pre-training',
    'Region Grounding', 'Document Understanding', 'Video-Language', 'Open-Vocabulary Detection',
    'Vision Transformers', 'Cross-Modal Alignment', 'Compositional Reasoning', 'Few-Shot Vision',
  ],
};

const PAPERS_PER_TOPIC = 30;
const YEAR_MIN = 2018;
const YEAR_MAX = 2025;

export interface CitationsNodeData {
  readonly topic: CitationsTopic;
  readonly title: string;
  readonly year: number;
  readonly citationsCount: number;
}

export interface CitationsEdgeData {
  /** Reserved for future predicates (`cites`, `extends`, `refutes`, ...). */
  readonly kind: 'cites';
}

export interface CitationsNode {
  readonly id: string;
  readonly data: CitationsNodeData;
}

export interface CitationsEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly data: CitationsEdgeData;
}

export interface CitationsData {
  readonly nodes: readonly CitationsNode[];
  readonly edges: readonly CitationsEdge[];
}

/** Mulberry32 PRNG seeded for snapshot stability. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number): number {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildDataset(): CitationsData {
  const rng = mulberry32(0xc17a710);
  const nodes: CitationsNode[] = [];

  for (const topic of TOPICS) {
    const frags = TOPIC_TITLE_FRAGS[topic];
    const slug = TOPIC_SLUGS[topic];
    for (let i = 0; i < PAPERS_PER_TOPIC; i++) {
      const yearSpan = YEAR_MAX - YEAR_MIN + 1;
      const year = YEAR_MIN + Math.floor(rng() * yearSpan);
      // Clipped log-normal citation count: median ~12, long right tail.
      const raw = Math.exp(2.5 + gauss(rng) * 1.0);
      const citationsCount = Math.min(900, Math.max(1, Math.round(raw)));
      const fragA = frags[Math.floor(rng() * frags.length)]!;
      const fragB = frags[Math.floor(rng() * frags.length)]!;
      const title = fragA === fragB ? fragA : `${fragA}: ${fragB}`;
      nodes.push({
        id: `${slug}-${i}`,
        data: { topic, title, year, citationsCount },
      });
    }
  }

  // Edge generation. Each paper makes 2–4 citation edges to OLDER
  // papers (year ≤ this paper's year). 70% intra-topic, 30% inter-topic.
  // Within the chosen pool we sample with weights ∝ citationsCount so
  // hubs accumulate more incoming edges → preferential attachment.
  const byTopic = new Map<CitationsTopic, CitationsNode[]>();
  for (const t of TOPICS) byTopic.set(t, []);
  for (const n of nodes) byTopic.get(n.data.topic)!.push(n);

  const edges: CitationsEdge[] = [];
  let edgeCounter = 0;

  for (const src of nodes) {
    const fanout = 2 + Math.floor(rng() * 3); // 2–4
    const used = new Set<string>([src.id]);
    for (let k = 0; k < fanout; k++) {
      const intra = rng() < 0.7;
      const pool = intra
        ? byTopic.get(src.data.topic)!
        : nodes;
      // Restrict to strictly-older papers for citation realism.
      const candidates = pool.filter((n) => n.data.year < src.data.year && !used.has(n.id));
      if (candidates.length === 0) continue;

      // Weighted sample by citationsCount + 1.
      const totalW = candidates.reduce((acc, n) => acc + n.data.citationsCount + 1, 0);
      let r = rng() * totalW;
      let target: CitationsNode | undefined;
      for (const c of candidates) {
        r -= c.data.citationsCount + 1;
        if (r <= 0) { target = c; break; }
      }
      if (!target) target = candidates[candidates.length - 1]!;
      used.add(target.id);
      edges.push({
        id: `c${edgeCounter++}`,
        source: src.id,
        target: target.id,
        data: { kind: 'cites' },
      });
    }
  }

  return { nodes, edges };
}

export const citations: CitationsData = buildDataset();
