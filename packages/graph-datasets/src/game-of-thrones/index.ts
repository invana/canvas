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
 * property-graph shape — vertices are `{ id, label, properties }`, edges are
 * `{ id, label, source, target, properties }` — so this module is a thin
 * typed view over it, not a translator. The interfaces below ARE the on-disk
 * contract; the JSON is its serialisation. Regenerate it offline with
 * `node scripts/prepare-got.mjs` (the raw upstream source is never stored).
 *
 * The graph is large (~5 MB), so it ships on its **own subpath entry**
 * (`@invana/graph-datasets/game-of-thrones`) to keep the main bundle lean.
 *
 * `label` / `properties` don't match `@invana/graph`'s `GraphNode`
 * (`type` / `data`) one-to-one, so a consuming story maps `label → type` and
 * `properties → data` at `setData` time.
 *
 * @example
 * import { gameOfThrones } from '@invana/graph-datasets/game-of-thrones';
 * graphLayer.setData({
 *   nodes: gameOfThrones.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
 *   edges: gameOfThrones.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label, data: e.properties })),
 * });
 */

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

/** A GoT entity as a property-graph vertex: `{ id, label, properties }`. */
export interface GotNode {
  readonly id: string;
  readonly label: GotNodeLabel;
  readonly properties: GotNodeProperties;
}

/** A typed relation as a property-graph edge: `{ id, label, source, target, properties }`. */
export interface GotEdge {
  readonly id: string;
  readonly label: GotEdgeLabel;
  readonly source: string;
  readonly target: string;
  readonly properties: GotEdgeProperties;
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
}

/** The full dataset: provenance + the property graph. */
export interface GameOfThronesData {
  readonly meta: GotMeta;
  readonly nodes: readonly GotNode[];
  readonly edges: readonly GotEdge[];
}

// The JSON is already valid `GameOfThronesData`; the cast only narrows the
// string-literal unions (`label`) that JSON import widens to `string`.
// No per-record reshaping.
export const gameOfThrones = raw as unknown as GameOfThronesData;
