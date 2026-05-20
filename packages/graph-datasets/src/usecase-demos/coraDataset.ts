/**
 * **Cora** citation network — the canonical machine-learning paper
 * dataset (2,708 papers across 7 subject areas, 10,556 `CITES` edges).
 * The raw CSVs live in `./cora-dataset/{nodes,edges}.csv`; a build-time
 * pre-strip in `scripts/prepare-cora.mjs` projects them to a compact
 * `cora.json` (drops the 1,433-dim bag-of-words feature matrix the
 * viewer never needs). This module imports that JSON and shapes it for
 * `GraphLayer.setData`.
 *
 * Re-run the prepare script when the CSVs change:
 *   `node scripts/prepare-cora.mjs`
 *
 * @example
 * import { cora } from '@invana/graph-datasets/usecase-demos';
 * graphLayer.setData({ nodes: cora.nodes, edges: cora.edges });
 */

import raw from './cora-dataset/cora.json';

/** Subject category — the 7 ML topics the original Cora dataset partitions papers into. */
export type CoraSubject =
  | 'Neural_Networks'
  | 'Rule_Learning'
  | 'Reinforcement_Learning'
  | 'Probabilistic_Methods'
  | 'Theory'
  | 'Genetic_Algorithms'
  | 'Case_Based';

export interface CoraNodeData {
  readonly subject: CoraSubject;
}

export interface CoraNode {
  readonly id: string;
  readonly data: CoraNodeData;
}

export interface CoraEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}

export interface CoraData {
  readonly nodes: readonly CoraNode[];
  readonly edges: readonly CoraEdge[];
}

interface RawNode {
  readonly id: string;
  readonly subject: string;
}
interface RawEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}
interface RawCora {
  readonly nodes: readonly RawNode[];
  readonly edges: readonly RawEdge[];
}

const rawCora = raw as RawCora;

export const cora: CoraData = {
  nodes: rawCora.nodes.map((n) => ({
    id: n.id,
    data: { subject: n.subject as CoraSubject },
  })),
  edges: rawCora.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  })),
};
