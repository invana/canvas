/**
 * **Cora** citation network — the canonical machine-learning paper dataset
 * (2,708 papers across 7 subject areas, 10,556 `CITES` edges).
 *
 * The raw CSVs live beside this file; `scripts/prepare-cora.mjs` projects them
 * to a compact `cora.json` **already in the engine-ready shape** (and drops the
 * 1,433-dim bag-of-words feature matrix the viewer never needs), so this module
 * is a thin typed view over it — no per-record mapping on import, which at 2,708
 * nodes is worth having.
 *
 * A paper's subject is both its `type` (so colour-by-type partitions the
 * network with no consumer wiring) and its `data.subject`.
 *
 * Re-run the prepare script when the CSVs change:
 *   `node scripts/prepare-cora.mjs`
 *
 * @example
 * import { cora, coraSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={cora} config={coraSettings} />
 */

import type { CanvasData } from '../../types';

import raw from './cora.json';

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

/** A paper. `type` is its subject area; `data.subject` repeats it for readers. */
export interface CoraNode {
  readonly id: string;
  readonly type: CoraSubject;
  readonly data: CoraNodeData;
}

/** A citation. Direction is citing → cited. */
export interface CoraEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}

export interface CoraData {
  nodes: CoraNode[];
  edges: CoraEdge[];
}

// The JSON is already valid `CoraData`; the cast only narrows `type` /
// `data.subject` from the `string` a JSON import widens them to.
export const cora = raw as unknown as CoraData;

/** {@link cora} as the engine-ready value `setData` / `<GraphCanvasApp>` take. */
export const data: CanvasData = cora as unknown as CanvasData;
