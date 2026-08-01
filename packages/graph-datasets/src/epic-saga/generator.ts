/**
 * **Epic Saga — the generator.**
 *
 * Builds a **fictional** serialised-drama property graph: seasons hold episodes,
 * episodes hold scenes, scenes happen at locations and feature characters, and
 * characters belong to houses and co-appear with one another. Every name, title
 * and timecode is invented by this file from seeded pools — nothing is derived
 * from, or copied out of, any real production.
 *
 * ### Why a generator and not a JSON
 *
 * This dataset exists to be the package's **large, heterogeneous, multi-type
 * property graph** — seven vertex kinds and six edge kinds at ~5k nodes / ~29k
 * edges, which is the shape a layers/schema panel or a colour-by-type demo needs
 * and no other dataset here provides. That shape is entirely reproducible
 * synthetically, so shipping ~7 MB of real third-party records to obtain it was
 * both a licensing liability and a bundle-size one. Three things fall out:
 *
 * 1. **Zero licence surface** — the values are ours.
 * 2. **~7 MB → a few KB** of source.
 * 3. **It scales.** Want 50k scenes for a large-graph performance story? Pass a
 *    bigger `scenes`. A fixed JSON is stuck at whatever was recorded.
 *
 * ### Determinism
 *
 * Same `seed` → byte-identical graph, so snapshots stay stable across reloads.
 * The PRNG is mulberry32, the same one `twitter/generators.ts` uses.
 */

import type { GraphEdge, GraphNode } from '@invana/graph';

// ─── Name pools ──────────────────────────────────────────────────────────────
//
// Composed rather than enumerated: 577 unique character names from ~40 syllables
// beats 577 hand-written literals, and stays obviously fictional.

/** Leading syllables for invented given names. */
const NAME_HEADS = [
  'Aer', 'Bal', 'Cae', 'Dor', 'Eld', 'Fen', 'Gar', 'Hal', 'Ith', 'Jor',
  'Kel', 'Lyr', 'Mor', 'Nyx', 'Orr', 'Pae', 'Quel', 'Rho', 'Syl', 'Tor',
  'Ul', 'Vor', 'Wyn', 'Xan', 'Yr', 'Zel',
];

/** Trailing syllables for invented given names. */
const NAME_TAILS = [
  'an', 'wyn', 'ric', 'as', 'ion', 'eth', 'ard', 'ys', 'or', 'ae',
  'ven', 'ax', 'iel', 'un', 'ora', 'is', 'ath', 'en', 'yra', 'ok',
];

/** Stems for invented house names. */
const HOUSE_STEMS = [
  'Ashvale', 'Brackmoor', 'Cindral', 'Dunhollow', 'Emberwick', 'Frostmere',
  'Grimwald', 'Hollowmere', 'Ironvale', 'Karsten', 'Lorwyn', 'Marrowdeep',
  'Northgale', 'Oakenshield',
];

/** Stems for invented region / location names. */
const PLACE_STEMS = [
  'Aldenreach', 'Blackfen', 'Coldharbour', 'Dawnspire', 'Elderwatch', 'Fallowmoor',
  'Greyhaven', 'Highmarch', 'Ironhold', 'Jarrowgate', 'Kingsbarrow', 'Longmire',
  'Mistfell', 'Nightreach', 'Oldspire', 'Pinewatch', 'Quarryhold', 'Ravensmoot',
  'Stonebrook', 'Thornkeep', 'Undermarch', 'Vaelport', 'Westwatch', 'Yarrowden',
  'Zephyrhall', 'Amberfall',
];

/** Sub-location qualifiers — combined with a place to name a room / district. */
const SUBPLACE_KINDS = [
  'Great Hall', 'Watchtower', 'Undercroft', 'Rookery', 'Barracks', 'Sept',
  'Docks', 'Market', 'Throne Room', 'Crypt', 'Stables', 'Gatehouse',
];

/** Word pool for invented episode titles. */
const TITLE_WORDS = [
  'Ashes', 'Oath', 'Winter', 'Crown', 'Debt', 'Storm', 'Wolf', 'Ember', 'Vow',
  'Siege', 'Exile', 'Dawn', 'Reckoning', 'Bloom', 'Fracture', 'Harvest', 'Omen',
  'Tide', 'Vigil', 'Rift', 'Pyre', 'Herald', 'Cinder', 'Requiem', 'Thaw',
];

/** Sentence fragments for invented episode descriptions. */
const SYNOPSIS_OPENERS = [
  'An old alliance frays as', 'A long-buried claim resurfaces when', 'The council fractures after',
  'A hostage exchange collapses when', 'News from the north arrives just as', 'A wedding turns when',
];

/** Sentence fragments completing an invented episode description. */
const SYNOPSIS_CLOSERS = [
  'two houses meet at the border.', 'the youngest heir refuses the terms.',
  'a rider brings word of a broken siege.', 'the harvest fails a second year running.',
  'an envoy is found dead in the undercroft.', 'the river road is cut for the winter.',
];

// ─── PRNG ────────────────────────────────────────────────────────────────────

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

/** Integer in `[lo, hi]`, inclusive. */
function int(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/**
 * Draw an index into `0..n-1` biased toward 0 — `exp` controls how hard.
 *
 * This is what gives the cast its shape: a handful of leads carry most of the
 * screen time while the long tail appears in a scene or two, which is what makes
 * a force layout of the co-appearance network readable instead of uniform mush.
 */
function skewedIndex(rng: () => number, n: number, exp = 2.2): number {
  return Math.min(n - 1, Math.floor(Math.pow(rng(), exp) * n));
}

// ─── Options ─────────────────────────────────────────────────────────────────

/** Knobs for {@link generateEpicSaga}. Defaults reproduce the ~5k / ~29k graph. */
export interface EpicSagaOptions {
  /** Seasons in the run. Default `8`. */
  seasons?: number;
  /** Episodes across all seasons. Default `73`. */
  episodes?: number;
  /** Scenes across all episodes — the bulk of the graph. Default `4165`. */
  scenes?: number;
  /** Speaking characters. Default `577`. */
  characters?: number;
  /** Noble houses characters can belong to. Default `14`. */
  houses?: number;
  /** Top-level locations. Default `26`. */
  locations?: number;
  /** Sub-locations nested inside locations. Default `96`. */
  subLocations?: number;
  /** PRNG seed — same seed → same graph. Default `1337`. */
  seed?: number;
}

/** Every option resolved to a concrete number. */
type Resolved = Required<EpicSagaOptions>;

/** Defaults — chosen so the generated graph lands at ~4,959 nodes / ~28,700 edges. */
const DEFAULTS: Resolved = {
  seasons: 8,
  episodes: 73,
  scenes: 4165,
  characters: 577,
  houses: 14,
  locations: 26,
  subLocations: 96,
  seed: 1337,
};

// ─── Local record shapes ─────────────────────────────────────────────────────
//
// Unexported, per the package's "no per-dataset record types" rule — they exist
// so the builder below reads clearly, not for consumers to import.

/** The seven vertex kinds this generator emits. */
type SagaNodeType =
  | 'character' | 'house' | 'location' | 'subLocation' | 'season' | 'episode' | 'scene';

/** The six relation kinds this generator emits. */
type SagaEdgeType =
  | 'member_of' | 'part_of' | 'located_at' | 'within' | 'appears_in' | 'co_appears_with';

/** A generated vertex — `data` varies by `type`, but every kind carries a `name`. */
type SagaNode = GraphNode & {
  type: SagaNodeType;
  data: { name?: string } & Record<string, unknown>;
};

/** A generated edge — only `co_appears_with` carries a payload. */
type SagaEdge = GraphEdge & {
  type: SagaEdgeType;
  data: { sharedScenes?: number; sharedSeconds?: number };
};

// ─── Builder ─────────────────────────────────────────────────────────────────

/**
 * Generate the full saga graph.
 *
 * Built in dependency order — houses and places first, then the calendar
 * (season → episode → scene), then the cast, then the appearance edges, and
 * finally the co-appearance projection derived from who shared a scene.
 *
 * @param options — counts + seed; see {@link EpicSagaOptions}.
 * @returns `{ meta, nodes, edges }` in the engine-ready shape `setData` takes.
 *
 * @example
 * const saga = generateEpicSaga({ scenes: 50_000, seed: 7 });
 */
export function generateEpicSaga(options: EpicSagaOptions = {}) {
  const o: Resolved = { ...DEFAULTS, ...options };
  const rng = mulberry32(o.seed);

  const nodes: SagaNode[] = [];
  const edges: SagaEdge[] = [];
  let edgeSeq = 0;

  /** Push an edge with a stable sequential id. */
  const link = (
    type: SagaEdgeType,
    source: string,
    target: string,
    data: SagaEdge['data'] = {},
  ): void => {
    edges.push({ id: `e${edgeSeq++}`, type, source, target, data });
  };

  // ── Houses ────────────────────────────────────────────────────────────────
  const houseIds: string[] = [];
  for (let i = 0; i < o.houses; i++) {
    const id = `house-${i}`;
    houseIds.push(id);
    nodes.push({
      id,
      type: 'house',
      data: {
        name: `House ${HOUSE_STEMS[i % HOUSE_STEMS.length]}`,
        words: `${pick(rng, TITLE_WORDS)} and ${pick(rng, TITLE_WORDS)}`,
      },
    });
  }

  // ── Locations + sub-locations ─────────────────────────────────────────────
  const locationIds: string[] = [];
  for (let i = 0; i < o.locations; i++) {
    const id = `location-${i}`;
    locationIds.push(id);
    nodes.push({
      id,
      type: 'location',
      data: { name: PLACE_STEMS[i % PLACE_STEMS.length]!, region: pick(rng, ['North', 'South', 'East', 'West', 'Isles']) },
    });
  }

  /** Every place a scene can be set — sub-locations plus bare locations. */
  const sceneVenues: string[] = [...locationIds];
  /** Sub-location → its parent location, so a scene can be linked to both. */
  const venueParent = new Map<string, string>();
  for (let i = 0; i < o.subLocations; i++) {
    const id = `subLocation-${i}`;
    const parent = locationIds[i % locationIds.length]!;
    const parentName = nodes.find((n) => n.id === parent)!.data.name;
    sceneVenues.push(id);
    venueParent.set(id, parent);
    nodes.push({
      id,
      type: 'subLocation',
      data: { name: `${parentName} — ${pick(rng, SUBPLACE_KINDS)}` },
    });
    link('within', id, parent);
  }

  // ── Seasons → episodes → scenes ───────────────────────────────────────────
  const seasonIds: string[] = [];
  for (let i = 0; i < o.seasons; i++) {
    const id = `season-${i}`;
    seasonIds.push(id);
    nodes.push({ id, type: 'season', data: { name: `Season ${i + 1}`, number: i + 1 } });
  }

  const episodeIds: string[] = [];
  // Air dates walk forward one week per episode from an arbitrary fixed epoch,
  // so the field is orderable without encoding a real broadcast schedule.
  let airDay = Date.UTC(2201, 2, 14);
  for (let i = 0; i < o.episodes; i++) {
    const id = `episode-${i}`;
    const seasonIdx = Math.floor((i / o.episodes) * o.seasons);
    episodeIds.push(id);
    nodes.push({
      id,
      type: 'episode',
      data: {
        name: `The ${pick(rng, TITLE_WORDS)} of ${pick(rng, PLACE_STEMS)}`,
        number: i + 1,
        airDate: new Date(airDay).toISOString().slice(0, 10),
        description: `${pick(rng, SYNOPSIS_OPENERS)} ${pick(rng, SYNOPSIS_CLOSERS)}`,
      },
    });
    link('part_of', id, seasonIds[seasonIdx]!);
    airDay += 7 * 86_400_000;
  }

  const sceneIds: string[] = [];
  /** Per-scene duration in seconds — needed later to weight co-appearance. */
  const sceneSeconds: number[] = [];
  for (let i = 0; i < o.scenes; i++) {
    const id = `scene-${i}`;
    const episodeIdx = Math.floor((i / o.scenes) * o.episodes);
    const start = (i % 60) * 55;
    const duration = int(rng, 20, 240);
    sceneIds.push(id);
    sceneSeconds.push(duration);
    const venue = pick(rng, sceneVenues);
    nodes.push({
      id,
      type: 'scene',
      data: {
        name: `Scene ${i + 1}`,
        start,
        end: start + duration,
        durationSeconds: duration,
        characterCount: 0, // filled once the cast is assigned
      },
    });
    link('part_of', id, episodeIds[episodeIdx]!);
    link('located_at', id, venue);
    // A scene set in a sub-location is also *at* its parent location — the two
    // edges are what let a consumer roll scenes up to a region without walking
    // `within` first.
    const parent = venueParent.get(venue);
    if (parent) link('located_at', id, parent);
  }

  // ── Characters ────────────────────────────────────────────────────────────
  const characterIds: string[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < o.characters; i++) {
    const id = `character-${i}`;
    characterIds.push(id);

    // Compose until unique — the pools give ~520 base combinations, so past that
    // an ordinal suffix keeps names distinct without growing the pools.
    let name = '';
    do {
      name = `${pick(rng, NAME_HEADS)}${pick(rng, NAME_TAILS)}`;
      if (usedNames.has(name)) name = `${name} ${int(rng, 2, 99)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    nodes.push({
      id,
      type: 'character',
      data: { name, screenTimeSeconds: 0, sceneCount: 0, episodeCount: 0 },
    });

    // ~26% of the cast is landed gentry; the rest are unaffiliated.
    if (rng() < 0.265) link('member_of', id, pick(rng, houseIds));
  }

  /** Fast lookup for the appearance tallies below. */
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // ── Appearances, and the co-appearance projection ─────────────────────────
  //
  // Cast per scene is drawn skewed so leads recur; the co-appearance network is
  // then *derived* from shared scenes rather than invented separately, which is
  // what makes it a real projection of the graph instead of decoration.

  /** `"a|b"` → accumulated shared scenes + seconds, for the undirected pair. */
  const coAppear = new Map<string, { scenes: number; seconds: number }>();

  // Characters belong to a **storyline**, and a scene's cast is drawn mostly
  // from one of them. Without this, casts drawn independently from the global
  // skew produce ~3× too many *distinct* pairs — a co-appearance network that is
  // dense and structureless. Storylines are what make the same faces recur
  // together, which is what gives the force layout its communities.
  const STORYLINES = 24;
  const storylineOf = (i: number): number => i % STORYLINES;
  const byStoryline: string[][] = Array.from({ length: STORYLINES }, () => []);
  characterIds.forEach((id, i) => byStoryline[storylineOf(i)]!.push(id));

  for (let s = 0; s < sceneIds.length; s++) {
    const sceneId = sceneIds[s]!;
    const seconds = sceneSeconds[s]!;
    const castSize = int(rng, 1, 5);
    const home = byStoryline[Math.floor(rng() * STORYLINES)]!;

    const cast: string[] = [];
    for (let c = 0; c < castSize; c++) {
      // 88 % from the scene's storyline, the rest anywhere — the cross-storyline
      // minority is what stops the communities from being disconnected islands.
      const pool = rng() < 0.88 ? home : characterIds;
      const id = pool[skewedIndex(rng, pool.length)]!;
      if (!cast.includes(id)) cast.push(id);
    }

    const sceneNode = nodeById.get(sceneId)!;
    sceneNode.data.characterCount = cast.length;

    for (const id of cast) {
      link('appears_in', id, sceneId);
      const ch = nodeById.get(id)!;
      ch.data.sceneCount = (ch.data.sceneCount as number) + 1;
      ch.data.screenTimeSeconds = (ch.data.screenTimeSeconds as number) + seconds;
    }

    for (let a = 0; a < cast.length; a++) {
      for (let b = a + 1; b < cast.length; b++) {
        // Sort the pair so the undirected edge has one canonical key.
        const key = cast[a]! < cast[b]! ? `${cast[a]}|${cast[b]}` : `${cast[b]}|${cast[a]}`;
        const acc = coAppear.get(key) ?? { scenes: 0, seconds: 0 };
        acc.scenes += 1;
        acc.seconds += seconds;
        coAppear.set(key, acc);
      }
    }
  }

  for (const [key, acc] of coAppear) {
    const [a, b] = key.split('|') as [string, string];
    link('co_appears_with', a, b, { sharedScenes: acc.scenes, sharedSeconds: acc.seconds });
  }

  // Episode counts are approximated from scene counts — a character in N scenes
  // spans roughly N * (episodes/scenes) episodes. Exact tracking would need a
  // per-character episode set for a field no story reads at that precision.
  const scenesPerEpisode = o.scenes / o.episodes;
  for (const id of characterIds) {
    const ch = nodeById.get(id)!;
    ch.data.episodeCount = Math.max(1, Math.round((ch.data.sceneCount as number) / scenesPerEpisode));
  }

  return { meta: deriveMeta(nodes, edges), nodes, edges };
}

// ─── Derived meta ────────────────────────────────────────────────────────────

/**
 * Derive the dataset's meta-graph from the generated records.
 *
 * Computed rather than hand-written so it can never drift from the data — the
 * layers / schema panel reads this to draw the vertex + edge kind inventory.
 */
function deriveMeta(nodes: readonly SagaNode[], edges: readonly SagaEdge[]) {
  const typeOf = new Map(nodes.map((n) => [n.id, n.type]));

  const nodeTypes = new Map<string, { count: number; properties: Record<string, string> }>();
  for (const n of nodes) {
    const entry = nodeTypes.get(n.type) ?? { count: 0, properties: {} };
    entry.count++;
    for (const [k, v] of Object.entries(n.data)) entry.properties[k] ??= typeof v;
    nodeTypes.set(n.type, entry);
  }

  const edgeTypes = new Map<
    string,
    { count: number; endpoints: Set<string>; properties: Record<string, string> }
  >();
  for (const e of edges) {
    const entry = edgeTypes.get(e.type) ?? { count: 0, endpoints: new Set(), properties: {} };
    entry.count++;
    entry.endpoints.add(`${typeOf.get(e.source)}→${typeOf.get(e.target)}`);
    for (const [k, v] of Object.entries(e.data)) entry.properties[k] ??= typeof v;
    edgeTypes.set(e.type, entry);
  }

  return {
    name: 'Epic Saga',
    description:
      'A fully synthetic serialised-drama property graph — seasons, episodes, scenes, characters, houses and locations, with a co-appearance network derived from shared scenes.',
    source: 'Generated by @invana/graph-datasets — no external data.',
    sourceRepo: '',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    schema: {
      nodeTypes: [...nodeTypes].map(([type, v]) => ({ type, count: v.count, properties: v.properties })),
      edgeTypes: [...edgeTypes].map(([type, v]) => ({
        type,
        count: v.count,
        endpoints: [...v.endpoints].map((p) => {
          const [source, target] = p.split('→') as [string, string];
          return { source, target };
        }),
        properties: v.properties,
      })),
    },
  };
}
