/**
 * Synthetic **RAG embedding explorer** dataset — ~400 2D points that
 * imitate a UMAP / t-SNE projection of a vector index. Five thematic
 * clusters (auth, billing, search, infra, ML) plus a sprinkling of
 * uniform outliers, generated from a seeded RNG so the visualisation
 * is stable across reloads.
 *
 * Each point carries a `cluster` id, a short `text` snippet that stands
 * in for the chunk content, and a `source` filename. There are no edges
 * — the story renders raw points overlaid by a
 * `DensityContourFillLayer` to bring the cluster topology forward.
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphNode } from '@invana/graph';

const CLUSTER_NAMES = ['auth', 'billing', 'search', 'infra', 'ml'] as const;
type RagEmbeddingsCluster = (typeof CLUSTER_NAMES)[number];

const SNIPPETS: Record<RagEmbeddingsCluster, readonly string[]> = {
  auth: [
    'JWT token expiration handling and clock-skew guard',
    'OAuth2 refresh flow with PKCE',
    'session cookie SameSite=strict rationale',
    'MFA enrollment for new tenants',
    'password reset token TTL discussion',
    'SAML assertion signature validation',
    'role-based access control matrix',
    'rate-limit on /login endpoint',
    'audit log of failed sign-in attempts',
    'SSO redirect URL allowlist',
    'CSRF double-submit cookie pattern',
    'service-account credential rotation',
  ],
  billing: [
    'monthly invoice generation cron',
    'pro-rated subscription cancellation',
    'tax calculation by jurisdiction',
    'failed payment retry strategy',
    'refund eligibility window',
    'currency conversion at billing time',
    'usage-based metering rollup',
    'dunning email cadence',
    'invoice PDF templating',
    'Stripe webhook idempotency',
    'credit note vs. refund difference',
    'plan upgrade mid-cycle proration',
  ],
  search: [
    'BM25 vs TF-IDF ranking trade-offs',
    'query parser handles boolean operators',
    'synonym expansion via thesaurus',
    'autocomplete with prefix trie',
    'fuzzy matching edit-distance threshold',
    'faceted search aggregation buckets',
    'reranker model fine-tuning notes',
    'index sharding strategy',
    'stop-word filtering per language',
    'phrase query slop parameter',
    'spell-correction candidates',
    'search result snippet highlighting',
  ],
  infra: [
    'Kubernetes pod scheduling priorities',
    'load balancer health-check tuning',
    'service mesh mTLS rollout',
    'horizontal pod autoscaler thresholds',
    'PV claim retention policy',
    'cert-manager renewal cadence',
    'Prometheus scrape interval',
    'Grafana dashboard for p99 latency',
    'log shipper backpressure',
    'cluster upgrade canary plan',
    'IAM role for service account',
    'network policy egress allowlist',
  ],
  ml: [
    'embedding model fine-tuning loop',
    'vector similarity cosine vs dot',
    'RAG retrieval top-k tuning',
    'chunking strategy: sliding window',
    'evaluation harness for retrieval',
    'prompt template versioning',
    'context-window budget allocation',
    'temperature ablation study',
    'hallucination rate by domain',
    'fine-tune dataset sourcing',
    'reranker latency budget',
    'model serving GPU bin-pack',
  ],
};

const SOURCES: Record<RagEmbeddingsCluster, string> = {
  auth: 'docs/security/auth.md',
  billing: 'docs/billing/overview.md',
  search: 'docs/search/internals.md',
  infra: 'runbooks/infra.md',
  ml: 'docs/ml/rag.md',
};

interface ClusterCenter {
  readonly cluster: RagEmbeddingsCluster;
  readonly cx: number;
  readonly cy: number;
  readonly spread: number;
  readonly count: number;
}

const CENTERS: readonly ClusterCenter[] = [
  { cluster: 'auth',    cx: -260, cy: -180, spread: 70, count: 78 },
  { cluster: 'billing', cx:  240, cy: -150, spread: 80, count: 84 },
  { cluster: 'search',  cx:  280, cy:  180, spread: 65, count: 72 },
  { cluster: 'infra',   cx: -200, cy:  220, spread: 75, count: 80 },
  { cluster: 'ml',      cx:    0, cy:    0, spread: 55, count: 66 },
];

const OUTLIER_COUNT = 22;

/** Mulberry32 — same PRNG used in flare-imports. */
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

/** Box-Muller — turn two uniforms into a single standard-normal sample. */
function gauss(rng: () => number): number {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildDataset() {
  const rng = mulberry32(0x52414708); // 'RAG\x08'
  const nodes: (GraphNode & {
    data: { cluster: RagEmbeddingsCluster; text: string; source: string };
  })[] = [];
  let i = 0;

  for (const c of CENTERS) {
    const snippets = SNIPPETS[c.cluster];
    for (let k = 0; k < c.count; k++) {
      const x = c.cx + gauss(rng) * c.spread;
      const y = c.cy + gauss(rng) * c.spread;
      const text = snippets[Math.floor(rng() * snippets.length)]!;
      nodes.push({
        id: `n${i++}`,
        type: c.cluster,
        position: { x, y },
        data: { cluster: c.cluster, text, source: SOURCES[c.cluster] },
      });
    }
  }

  // Uniform outliers spread over the whole canvas — visually they peel
  // the contour iso-bands away from a perfectly tidy ellipse, which
  // gives the density layer more interesting work to do.
  for (let k = 0; k < OUTLIER_COUNT; k++) {
    const cluster = CLUSTER_NAMES[Math.floor(rng() * CLUSTER_NAMES.length)]!;
    const snippets = SNIPPETS[cluster];
    nodes.push({
      id: `n${i++}`,
      type: cluster,
      position: { x: (rng() - 0.5) * 900, y: (rng() - 0.5) * 700 },
      data: {
        cluster,
        text: snippets[Math.floor(rng() * snippets.length)]!,
        source: SOURCES[cluster],
      },
    });
  }

  // A projection scatter: the positions are the data, there are no links.
  return { nodes, edges: [] };
}

export const ragEmbeddings = buildDataset();

/** {@link ragEmbeddings} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = ragEmbeddings;

/**
 * Recommended look for the **RAG embedding** projection.
 *
 * An embedding projection: every chunk's `position` **is** the data, so there is
 * **no layout** (`activeLayout: ''`) and dragging is off — moving a point would be
 * lying about the embedding. Marks are small translucent dots so overlapping
 * regions read as density, which is what a contour overlay then picks up.
 * Colour-by-type separates the semantic clusters.
 */
export const settings: CanvasConfig = {
  activeLayout: '',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 3.5 },
          bgStrokeWidth: 0,
          bgAlpha: 0.85,
          showLabel: false,
        },
      },
    },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    'drag-node': { enabled: false },
    hover: { enabled: true, state: 'highlighted', degree: 0 },
  },
};
