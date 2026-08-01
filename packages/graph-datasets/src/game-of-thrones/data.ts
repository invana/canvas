/**
 * **Game of Thrones** — a multi-entity property graph of HBO's *Game of
 * Thrones*, derived from [Jeffrey Lancaster's open GoT
 * data](https://github.com/jeffreylancaster/game-of-thrones) (the source
 * behind the well-known force-directed character viz).
 *
 * Seven vertex kinds — `character`, `house`, `location`, `subLocation`,
 * `season`, `episode`, `scene` — wired by six relation kinds:
 * `member_of` (character → house), `part_of` (episode → season, scene →
 * episode), `located_at` (scene → location / sub-location), `within`
 * (sub-location → location), `appears_in` (character → scene), and a
 * weighted, undirected `co_appears_with` (character ↔ character, the
 * force-directed network — `sharedScenes` + `sharedSeconds` of screen time).
 *
 * `./game-of-thrones.json` is authored **directly** in this package's
 * engine-ready shape — vertices are `{ id, type, data }`, edges are
 * `{ id, type, source, target, data }` — so this module is a thin
 * typed view over it, not a translator. The interfaces below ARE the on-disk
 * contract; the JSON is its serialisation. Regenerate it offline with
 * `node scripts/prepare-got.mjs` (the raw upstream source is never stored).
 *
 * The graph is large (~5 MB), so it ships on its **own subpath entry**
 * (`@invana/graph-datasets/game-of-thrones`) to keep the main bundle lean.
 *
 *
 * @example
 * import { gameOfThrones, gameOfThronesSettings } from '@invana/graph-datasets/game-of-thrones';
 * <GraphCanvasApp data={gameOfThrones} config={gameOfThronesSettings} />
 */

import type { CanvasData } from '../types';

import raw from './game-of-thrones.json';

/** Vertex label — the entity kind. Drives shape + palette downstream. */
export type GotNodeLabel =
  | 'character'
  | 'house'
  | 'location'
  | 'subLocation'
  | 'season'
  | 'episode'
  | 'scene';

/** Edge label — the relation kind. */
export type GotEdgeLabel =
  | 'member_of'
  | 'part_of'
  | 'located_at'
  | 'within'
  | 'appears_in'
  | 'co_appears_with';

/** A named character appearing in at least one scene. */
export interface GotCharacterProperties {
  /** Display name (`Jon Snow`, `Tyrion Lannister`, …). */
  readonly name: string;
  /** Owning house name, or `null` when the character isn't in a group. */
  readonly house: string | null;
  /** Total screen time across all scenes, in whole seconds. */
  readonly screenTimeSeconds: number;
  /** Number of distinct scenes the character appears in. */
  readonly sceneCount: number;
  /** Number of distinct episodes the character appears in. */
  readonly episodeCount: number;
}

/** A great house / faction / group (Stark, Targaryen, Night's Watch, …). */
export interface GotHouseProperties {
  readonly name: string;
  /** Count of characters the source assigns to this house. */
  readonly memberCount: number;
}

/** A top-level location (King's Landing, Winterfell, The Wall, …). */
export interface GotLocationProperties {
  readonly name: string;
  /** Number of scenes set at this location. */
  readonly sceneCount: number;
}

/** A sub-location within one or more locations (Castle Black, Red Keep, …). */
export interface GotSubLocationProperties {
  readonly name: string;
}

/** A season of the show. */
export interface GotSeasonProperties {
  readonly seasonNum: number;
  /** Number of episodes in the season. */
  readonly episodeCount: number;
}

/** An episode, with IMDb link + air date carried through from the source. */
export interface GotEpisodeProperties {
  readonly seasonNum: number;
  readonly episodeNum: number;
  readonly title: string;
  readonly airDate: string | null;
  /** IMDb title path (`/title/tt1480055/`), or `null`. */
  readonly link: string | null;
  readonly description: string | null;
  readonly sceneCount: number;
}

/** A single scene — the atomic unit of the source transcripts. */
export interface GotSceneProperties {
  readonly seasonNum: number;
  readonly episodeNum: number;
  /** 0-based position of the scene within its episode. */
  readonly sceneIndex: number;
  /** `h:mm:ss` start timecode within the episode. */
  readonly start: string;
  /** `h:mm:ss` end timecode within the episode. */
  readonly end: string;
  /** Scene length in whole seconds (`|end − start|`). */
  readonly durationSeconds: number;
  readonly location: string | null;
  readonly subLocation: string | null;
  /** Number of distinct characters in the scene. */
  readonly characterCount: number;
}

/** Node property bag — discriminated by the vertex {@link GotNodeLabel}. */
export type GotNodeProperties =
  | GotCharacterProperties
  | GotHouseProperties
  | GotLocationProperties
  | GotSubLocationProperties
  | GotSeasonProperties
  | GotEpisodeProperties
  | GotSceneProperties;

/** Weight carried by a `co_appears_with` edge; `{}` for the structural kinds. */
export interface GotCoAppearanceProperties {
  /** Number of scenes the two characters share. */
  readonly sharedScenes: number;
  /** Combined screen time of their shared scenes, in whole seconds. */
  readonly sharedSeconds: number;
}

/** Edge property bag — `co_appears_with` carries weight; others are empty. */
export type GotEdgeProperties = GotCoAppearanceProperties | Record<string, never>;

/** A GoT entity `{ id, type, data }`. */
export interface GotNode {
  readonly id: string;
  readonly type: GotNodeLabel;
  readonly data: GotNodeProperties;
}

/** A typed relation `{ id, type, source, target, data }`. */
export interface GotEdge {
  readonly id: string;
  readonly type: GotEdgeLabel;
  readonly source: string;
  readonly target: string;
  readonly data: GotEdgeProperties;
}

/** One vertex kind in the {@link GotSchema} — its label, tally, and property types. */
export interface GotNodeTypeSchema {
  readonly type: GotNodeLabel;
  /** Number of vertices carrying this label. */
  readonly count: number;
  /**
   * Property key → primitive type string, unioned across every vertex of this
   * kind (`'string'`, `'number'`, `'string | null'`, …).
   */
  readonly properties: Readonly<Record<string, string>>;
}

/** A permitted `{ source → target }` vertex pairing for a relation kind. */
export interface GotEndpointSchema {
  readonly source: GotNodeLabel;
  readonly target: GotNodeLabel;
}

/** One relation kind in the {@link GotSchema} — its endpoints, tally, and property types. */
export interface GotEdgeTypeSchema {
  readonly type: GotEdgeLabel;
  /** Number of edges carrying this label. */
  readonly count: number;
  /** `false` for symmetric networks (`co_appears_with`); `true` otherwise. */
  readonly directed: boolean;
  /** Every `{ source, target }` label-pair observed for this relation. */
  readonly endpoints: readonly GotEndpointSchema[];
  /** Property key → primitive type string; `{}` for the structural relations. */
  readonly properties: Readonly<Record<string, string>>;
}

/**
 * The graph schema (meta-graph / ontology) — the vertex and relation kinds the
 * dataset contains, each with counts, property types, and (for edges) endpoint
 * constraints. Derived by the generator from the emitted data, so it always
 * matches {@link GameOfThronesData.nodes} / `.edges`.
 */
export interface GotSchema {
  readonly nodeTypes: readonly GotNodeTypeSchema[];
  readonly edgeTypes: readonly GotEdgeTypeSchema[];
}

/** Self-describing provenance + counts baked into the JSON by the generator. */
export interface GotMeta {
  readonly name: string;
  readonly description: string;
  /** The site that publishes the underlying data. */
  readonly source: string;
  /** The GitHub repo the raw data is fetched from. */
  readonly sourceRepo: string;
  readonly nodeCount: number;
  readonly edgeCount: number;
  /** The graph's meta-graph — vertex/relation kinds, their property types + endpoints. */
  readonly schema: GotSchema;
}

/** The full dataset: provenance + the property graph. */
export interface GameOfThronesData {
  readonly meta: GotMeta;
  nodes: GotNode[];
  edges: GotEdge[];
}

// The JSON is already valid `GameOfThronesData`; the cast only narrows the
// string-literal unions (`label`) that JSON import widens to `string`.
// No per-record reshaping.
export const gameOfThrones = raw as unknown as GameOfThronesData;

/** {@link gameOfThrones} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data: CanvasData = gameOfThrones as unknown as CanvasData;
