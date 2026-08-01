/**
 * **Modeller seed** — three placed nodes and one edge, the starting board for a
 * graph *authoring* tool.
 *
 * The point of this dataset is that it is nearly empty. A drawing surface needs
 * enough on screen to prove the tools work (something to drag, something to
 * connect to, an existing edge to erase) and nothing more — the graph the user
 * ends up with is their own. Nodes carry a placement and a one-letter caption;
 * there is no type, so the modeller's inspector is what gives a node meaning.
 *
 * @example
 * import { modellerSeed, modellerSeedSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={modellerSeed} config={modellerSeedSettings} />
 */

import type { CanvasData } from '../../types';

/**
 * A seed node. Deliberately **untyped** — the modeller's user is the one who
 * classifies it — so it carries only a caption and where it starts.
 */
export interface ModellerSeedNode {
  readonly id: string;
  /** Starting position, centred around the origin so the board opens framed. */
  readonly position: { readonly x: number; readonly y: number };
  /** The caption drawn on the node (`'A'`). */
  readonly style: { readonly labelText: string };
}

/** A seed edge — untyped for the same reason. */
export interface ModellerSeedEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}

/** The full dataset. */
export interface ModellerSeedData {
  nodes: ModellerSeedNode[];
  edges: ModellerSeedEdge[];
}

export const modellerSeed: ModellerSeedData = {
  nodes: [
    { id: 'a', position: { x: -120, y: -60 }, style: { labelText: 'A' } },
    { id: 'b', position: { x: 120, y: -60 }, style: { labelText: 'B' } },
    { id: 'c', position: { x: 0, y: 90 }, style: { labelText: 'C' } },
  ],
  edges: [{ id: 'a-b', source: 'a', target: 'b' }],
};

/** {@link modellerSeed} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data: CanvasData = modellerSeed as unknown as CanvasData;
