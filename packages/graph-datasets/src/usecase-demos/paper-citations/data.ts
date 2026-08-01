/**
 * **Paper citations** — a synthetic machine-learning citation network
 * (2,708 papers across 7 subject areas, 10,556 `CITES` edges).
 *
 * The package's **largest force-layout fixture**: big enough that the subject
 * communities read as regions rather than individual marks, which is what makes
 * it the right dataset for density contours, subject bundling, and
 * colour-by-type at scale.
 *
 * A paper's subject is both its `type` (so colour-by-type partitions the network
 * with no consumer wiring) and its `data.subject`.
 *
 * ### Generated, not stored
 *
 * Built at import time by {@link generatePaperCitations} from a fixed seed —
 * byte-stable across reloads, a few KB of source instead of ~1 MB of records,
 * and carrying no third-party licence. The subject-area names are generic
 * field-of-study terms; every paper id, title and citation is invented.
 *
 * The citation topology is what makes it useful, and it is modelled rather than
 * random — see {@link generatePaperCitations} for the three rules (intra-subject
 * bias, preferential attachment, and citations pointing backwards in time) that
 * give the graph its community structure and its hub papers.
 *
 * @example
 * import { paperCitations, paperCitationsSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={paperCitations} config={paperCitationsSettings} />
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

/** The seven subject areas a paper can belong to. */
type PaperSubject =
  | 'Neural_Networks'
  | 'Rule_Learning'
  | 'Reinforcement_Learning'
  | 'Probabilistic_Methods'
  | 'Theory'
  | 'Genetic_Algorithms'
  | 'Case_Based';

/**
 * The seven subjects with their share of the corpus.
 *
 * Deliberately uneven — one dominant area, a long tail of smaller ones. A
 * uniform split would make every community the same size and the map far less
 * interesting to read.
 */
const SUBJECT_WEIGHTS: readonly { subject: PaperSubject; weight: number }[] = [
  { subject: 'Neural_Networks', weight: 818 },
  { subject: 'Probabilistic_Methods', weight: 426 },
  { subject: 'Genetic_Algorithms', weight: 418 },
  { subject: 'Theory', weight: 351 },
  { subject: 'Case_Based', weight: 298 },
  { subject: 'Reinforcement_Learning', weight: 217 },
  { subject: 'Rule_Learning', weight: 180 },
];

/** Leading words for invented paper titles. */
const TITLE_HEADS = [
  'Adaptive', 'Bayesian', 'Compositional', 'Distributed', 'Efficient', 'Generalised',
  'Hierarchical', 'Incremental', 'Kernel-based', 'Latent', 'Modular', 'Nonparametric',
  'Online', 'Probabilistic', 'Recursive', 'Sparse', 'Structured', 'Unsupervised',
  'Variational', 'Robust', 'Scalable', 'Approximate',
];

/** Middle terms for invented paper titles. */
const TITLE_MIDS = [
  'inductive', 'symbolic', 'connectionist', 'evolutionary', 'stochastic', 'analogical',
  'discriminative', 'generative', 'relational', 'temporal', 'multi-agent', 'case-based',
];

/** Trailing noun phrases for invented paper titles. */
const TITLE_TAILS = [
  'learning', 'inference', 'search', 'classification', 'reasoning', 'planning',
  'optimisation', 'representation', 'generalisation', 'control', 'induction',
  'retrieval', 'abstraction', 'credit assignment',
];

/** Deterministic PRNG (mulberry32) — same seed, same graph. */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `xs` uniformly. */
function pick<T>(rng: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

/** Knobs for {@link generatePaperCitations}. */
export interface PaperCitationsOptions {
  /** Papers in the corpus. Default `2708`. */
  papers?: number;
  /** Directed `CITES` edges. Default `10556`. */
  citations?: number;
  /** Fraction of citations that stay inside a subject (0–1). Default `0.81`. */
  intraSubjectRatio?: number;
  /** PRNG seed — same seed → same graph. Default `2708`. */
  seed?: number;
}

/**
 * Generate the citation network.
 *
 * Three rules shape the topology, and between them they're what make the graph
 * look like a citation network rather than a random one:
 *
 * 1. **Citations point backwards in time.** A paper may only cite one published
 *    before it, so the graph is a DAG — which is what stops a force layout from
 *    collapsing it into an undifferentiated ball.
 * 2. **~81 % of citations stay inside a subject.** This is what creates the seven
 *    visible communities; the remaining cross-subject links become the bridges
 *    between them.
 * 3. **Targets are drawn by preferential attachment.** A paper already cited
 *    often is more likely to be cited again, producing the handful of hub papers
 *    every real citation graph has.
 *
 * @param options — counts + seed; see {@link PaperCitationsOptions}.
 *
 * @example
 * const big = generatePaperCitations({ papers: 50_000, seed: 9 });
 */
export function generatePaperCitations(options: PaperCitationsOptions = {}) {
  const papers = options.papers ?? 2708;
  const citations = options.citations ?? 10556;
  const intraSubjectRatio = options.intraSubjectRatio ?? 0.81;
  const rng = mulberry32(options.seed ?? 2708);

  const totalWeight = SUBJECT_WEIGHTS.reduce((s, w) => s + w.weight, 0);

  /**
   * Assign a subject by walking the cumulative weights at the paper's position
   * in the corpus — a stratified draw, so the counts land on the intended mix
   * exactly rather than approaching it statistically.
   */
  const subjectFor = (i: number): PaperSubject => {
    const target = ((i + 0.5) / papers) * totalWeight;
    let acc = 0;
    for (const w of SUBJECT_WEIGHTS) {
      acc += w.weight;
      if (target <= acc) return w.subject;
    }
    return SUBJECT_WEIGHTS[0]!.subject;
  };

  const nodes: (GraphNode & { type: PaperSubject; data: { subject: PaperSubject } })[] = [];
  /** Paper indices bucketed by subject — drives the intra-subject citation draw. */
  const bySubject = new Map<PaperSubject, number[]>();

  for (let i = 0; i < papers; i++) {
    // Interleave the subjects rather than emitting them in blocks, so a paper's
    // index carries no subject signal a layout could accidentally exploit.
    const subject = subjectFor((i * 1103515245 + 12345) % papers);
    nodes.push({
      id: `p${i}`,
      type: subject,
      data: {
        subject,
        title: `${pick(rng, TITLE_HEADS)} ${pick(rng, TITLE_MIDS)} ${pick(rng, TITLE_TAILS)}`,
        year: 1988 + Math.floor((i / papers) * 12),
      } as { subject: PaperSubject },
    });
    const bucket = bySubject.get(subject) ?? [];
    bucket.push(i);
    bySubject.set(subject, bucket);
  }

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  /** Times each paper has been cited — the preferential-attachment weight. */
  const citedCount = new Int32Array(papers);

  let guard = 0;
  while (edges.length < citations && guard < citations * 40) {
    guard++;

    // Source is any paper past the first decile (something must exist to cite).
    const source = Math.floor(rng() * papers * 0.9) + Math.floor(papers * 0.1);
    if (source >= papers) continue;
    const subject = nodes[source]!.type;

    let target: number;
    if (rng() < intraSubjectRatio) {
      const bucket = bySubject.get(subject)!;
      // Two draws, keep the better-cited — a cheap preferential attachment that
      // needs no cumulative-weight table.
      const a = pick(rng, bucket);
      const b = pick(rng, bucket);
      target = (citedCount[a] ?? 0) >= (citedCount[b] ?? 0) ? a : b;
    } else {
      target = Math.floor(rng() * papers);
    }

    if (target >= source) continue; // citations point backwards in time
    const key = `${source}>${target}`;
    if (seen.has(key)) continue;
    seen.add(key);

    citedCount[target] = (citedCount[target] ?? 0) + 1;
    edges.push({ id: `c${edges.length}`, type: 'CITES', source: `p${source}`, target: `p${target}`, data: {} });
  }

  return { nodes, edges };
}

/** The default citation network — 2,708 papers / ~10,556 citations from seed `2708`. */
export const paperCitations = generatePaperCitations();

/** {@link paperCitations} as the engine-ready value `setData` / `<GraphCanvasApp>` take. */
export const data = paperCitations;

/**
 * Recommended look for the **paper citations** network.
 *
 * 2,708 papers and ~10,556 citations — the largest dataset here, and the settings
 * are shaped almost entirely by that. Papers are 3px dots so the seven subject
 * communities read as regions rather than as individual marks; citations are barely
 * visible on their own and exist to shape the layout. Colour-by-type partitions the
 * subjects for free, since each paper's `type` **is** its subject.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 3 },
          bgStrokeWidth: 0,
          showLabel: false,
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.4,
          strokeAlpha: 0.12,
          arrowTargetShape: 'none',
        },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -60 },
      link: { distance: 30 },
      collide: {},
      animate: false,
    },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: {
      enabled: true,
      state: 'highlighted',
      inactiveState: 'dimmed',
      degree: 1,
      direction: 'both',
    },
  },
};
