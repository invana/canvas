/**
 * **Computing pioneers** — a hand-authored ten-node graph of four computing
 * figures, the institutions they worked at, and the ideas they created.
 *
 * Deliberately tiny and deliberately *heterogeneous*: three entity kinds whose
 * property bags differ (a `Person` has a role and an avatar id, an
 * `Organization` has a founding note, a `Concept` has only a name), which is
 * exactly what a per-type node-rendering demo needs — one structure per label,
 * each binding different fields. Seven relation kinds keep the edge legend
 * interesting at this size.
 *
 * `avatar` holds an **avatar id** (`'ada'`), not an image URL — the consuming
 * template resolves it to whatever portrait source it has.
 *
 * @example
 * import { computingPioneers, computingPioneersSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={computingPioneers} config={computingPioneersSettings} />
 */

import type { CanvasData } from '../../types';

/** Node type — the entity kind. Drives which node structure renders it. */
export type ComputingPioneersNodeType = 'Person' | 'Organization' | 'Concept';

/** Edge type — how a person relates to an idea or an institution. */
export type ComputingPioneersEdgeType =
  | 'DESIGNED'
  | 'DESCRIBED'
  | 'CREATED'
  | 'INVENTED'
  | 'STUDIED_AT'
  | 'WORKED_AT'
  | 'INFLUENCED';

/**
 * Node payload. Only `name` is common to all three types — `role` / `avatar`
 * are `Person`-only and `founded` is `Organization`-only, so a template binds
 * whichever subset its type uses.
 */
export interface ComputingPioneersNodeData {
  /** Display name — the one field every label carries. */
  readonly name: string;
  /** `Person` only — what they're known as professionally. */
  readonly role?: string;
  /** `Person` only — an avatar **id** (`'ada'`), not a URL. */
  readonly avatar?: string;
  /** `Organization` only — founding note, pre-formatted (`'est. 1209'`). */
  readonly founded?: string;
}

/** A pioneer, institution or idea. */
export interface ComputingPioneersNode {
  readonly id: string;
  readonly type: ComputingPioneersNodeType;
  readonly data: ComputingPioneersNodeData;
}

/** A relation. The type carries the whole meaning, so there's no payload. */
export interface ComputingPioneersEdge {
  readonly id: string;
  readonly type: ComputingPioneersEdgeType;
  readonly source: string;
  readonly target: string;
}

/** The full dataset. */
export interface ComputingPioneersData {
  nodes: ComputingPioneersNode[];
  edges: ComputingPioneersEdge[];
}

export const computingPioneers: ComputingPioneersData = {
  nodes: [
    { id: 'ada', type: 'Person', data: { name: 'Ada Lovelace', role: 'Mathematician', avatar: 'ada' } },
    { id: 'alan', type: 'Person', data: { name: 'Alan Turing', role: 'Computer Scientist', avatar: 'alan' } },
    { id: 'grace', type: 'Person', data: { name: 'Grace Hopper', role: 'Rear Admiral', avatar: 'grace' } },
    { id: 'tim', type: 'Person', data: { name: 'Tim Berners-Lee', role: 'Engineer', avatar: 'tim' } },
    { id: 'cambridge', type: 'Organization', data: { name: 'Univ. of Cambridge', founded: 'est. 1209' } },
    { id: 'cern', type: 'Organization', data: { name: 'CERN', founded: 'est. 1954' } },
    { id: 'ae', type: 'Concept', data: { name: 'Analytical Engine' } },
    { id: 'tm', type: 'Concept', data: { name: 'Turing Machine' } },
    { id: 'cobol', type: 'Concept', data: { name: 'COBOL' } },
    { id: 'www', type: 'Concept', data: { name: 'World Wide Web' } },
  ],
  edges: [
    { id: 'e1', type: 'DESIGNED', source: 'ada', target: 'ae' },
    { id: 'e2', type: 'DESCRIBED', source: 'alan', target: 'tm' },
    { id: 'e3', type: 'CREATED', source: 'grace', target: 'cobol' },
    { id: 'e4', type: 'INVENTED', source: 'tim', target: 'www' },
    { id: 'e5', type: 'STUDIED_AT', source: 'alan', target: 'cambridge' },
    { id: 'e6', type: 'WORKED_AT', source: 'tim', target: 'cern' },
    { id: 'e7', type: 'INFLUENCED', source: 'ada', target: 'alan' },
  ],
};

/** {@link computingPioneers} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data: CanvasData = computingPioneers as unknown as CanvasData;
